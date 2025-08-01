import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface ShareOptions {
  name: string;
  title: string;
  body?: string;
}

/**
 * Unified SHARE workflow - Create clean PR without iteration artifacts
 */
export async function shareIteration(options: ShareOptions): Promise<void> {
  const { name, title, body } = options;
  
  console.log(`📤 Preparing to share iteration: ${name}`);
  
  // Step 1: Verify iteration exists
  const iterationPath = path.join('collabiterations', name);
  if (!fs.existsSync(iterationPath)) {
    console.log(`❌ Iteration "${name}" not found.`);
    return;
  }
  
  // Step 2: Check for uncommitted changes
  console.log('🔍 Checking for uncommitted changes...');
  const gitStatus = execSync('git status --porcelain', {
    cwd: iterationPath,
    encoding: 'utf8'
  }).trim();
  
  if (gitStatus) {
    console.log('⚠️  You have uncommitted changes:');
    console.log(gitStatus);
    console.log('\n💡 Commit your changes first:');
    console.log(`   cd ${iterationPath}`);
    console.log('   git add .');
    console.log('   git commit -m "Your commit message"');
    return;
  }
  
  // Step 3: Create clean feature branch
  const ticket = extractTicketFromBranch(name);
  const cleanBranch = ticket ? `feature/${ticket}-${name}` : `feature/${name}`;
  
  console.log(`🌿 Creating clean branch: ${cleanBranch}`);
  
  try {
    // Switch to main branch first
    execSync('git checkout main', { stdio: 'pipe' });
    
    // Pull latest main
    console.log('📥 Updating main branch...');
    execSync('git pull origin main', { stdio: 'inherit' });
    
    // Create new feature branch from main
    execSync(`git checkout -b ${cleanBranch}`, { stdio: 'pipe' });
    console.log('✅ Created feature branch from latest main');
  } catch (error) {
    console.error('❌ Failed to create feature branch:', error);
    return;
  }
  
  // Step 4: Cherry-pick commits (excluding iteration-specific files)
  console.log('🍒 Cherry-picking feature commits...');
  
  // Get list of commits in iteration branch
  const iterationBranch = `iteration/${name}`;
  const commits = execSync(
    `git log main..${iterationBranch} --reverse --pretty=format:"%H"`,
    { encoding: 'utf8' }
  ).trim().split('\n').filter(Boolean);
  
  console.log(`Found ${commits.length} commits to process`);
  
  // Files to exclude from PR
  const excludePatterns = [
    'docker-compose.*.yml',
    '.env',
    '.env.iteration',
    '.env.template',
    'scripts/start-iteration.sh',
    'scripts/health-check.sh',
    'scripts/setup-test-data.sql',
    'STARTUP.md',
    'ITERATION_PLAN.md',
    'TEST_MODE',
    'backend.log',
    'frontend.log',
    '.claude-flow/'
  ];
  
  // Cherry-pick each commit but filter files
  for (const commit of commits) {
    try {
      // Get list of files in commit
      const files = execSync(`git show --name-only --pretty="" ${commit}`, {
        encoding: 'utf8'
      }).trim().split('\n').filter(Boolean);
      
      // Filter out excluded files
      const includedFiles = files.filter(file => {
        return !excludePatterns.some(pattern => {
          if (pattern.includes('*')) {
            return file.includes(pattern.replace('*', ''));
          }
          return file === pattern || file.endsWith(`/${pattern}`);
        });
      });
      
      if (includedFiles.length > 0) {
        // Cherry-pick only the included files
        execSync(`git cherry-pick -n ${commit}`, { stdio: 'pipe' });
        
        // Unstage excluded files
        for (const file of files) {
          if (!includedFiles.includes(file)) {
            try {
              execSync(`git reset HEAD ${file}`, { stdio: 'pipe' });
              execSync(`git checkout HEAD -- ${file}`, { stdio: 'pipe' });
            } catch {}
          }
        }
        
        // Commit with original message
        const message = execSync(`git log -1 --pretty=format:"%s" ${commit}`, {
          encoding: 'utf8'
        });
        execSync(`git commit -m "${message}"`, { stdio: 'pipe' });
      }
    } catch (error) {
      console.log(`⚠️  Skipping commit ${commit.substring(0, 7)}: ${error.message}`);
    }
  }
  
  // Step 5: Remove auth bypass code
  console.log('🔐 Removing auth bypass code...');
  await removeAuthBypass();
  
  // Step 6: Run tests
  console.log('🧪 Running tests...');
  try {
    execSync('bun test', { stdio: 'inherit' });
    console.log('✅ Tests passed');
  } catch {
    console.log('⚠️  Some tests failed, but continuing...');
  }
  
  // Step 7: Push branch
  console.log('📤 Pushing branch to origin...');
  try {
    execSync(`git push -u origin ${cleanBranch}`, { stdio: 'inherit' });
  } catch (error) {
    console.log('❌ Failed to push branch:', error);
    return;
  }
  
  // Step 8: Create PR
  console.log('🔄 Creating pull request...');
  
  const prBody = generatePRBody({
    iterationName: name,
    title,
    body,
    ticket,
    commits: commits.length
  });
  
  try {
    // Create PR using GitHub CLI
    const prUrl = execSync(
      `gh pr create --title "${title}" --body "${prBody}" --base main`,
      { encoding: 'utf8' }
    ).trim();
    
    console.log('\n✅ Pull request created successfully!');
    console.log(`\n🔗 PR URL: ${prUrl}`);
  } catch (error) {
    console.log('\n⚠️  Could not create PR automatically.');
    console.log('Create it manually at: https://github.com/[owner]/[repo]/compare');
    console.log('\nSuggested PR description:');
    console.log('─'.repeat(60));
    console.log(prBody);
    console.log('─'.repeat(60));
  }
  
  // Step 9: Switch back to iteration branch
  execSync(`git checkout ${iterationBranch}`, { stdio: 'pipe' });
  
  console.log('\n✅ Share complete!');
  console.log('\n📋 Next steps:');
  console.log('   1. Review the PR on GitHub');
  console.log('   2. Address any review feedback');
  console.log('   3. Merge when approved');
  console.log(`   4. Clean up: gcm remove ${name}`);
}

/**
 * Extract ticket number from iteration name
 */
function extractTicketFromBranch(name: string): string | null {
  // Look for BRAV-XXXX pattern
  const match = name.match(/BRAV-\d+/i);
  return match ? match[0].toUpperCase() : null;
}

/**
 * Remove auth bypass code from the branch
 */
async function removeAuthBypass(): Promise<void> {
  // Restore production auth middleware if it exists
  if (fs.existsSync('packages/backend/src/middleware/auth.ts')) {
    try {
      execSync('git checkout main -- packages/backend/src/middleware/auth.ts', {
        stdio: 'pipe'
      });
      execSync('git add packages/backend/src/middleware/auth.ts', { stdio: 'pipe' });
      execSync('git commit -m "chore: restore production auth middleware"', {
        stdio: 'pipe'
      });
    } catch {
      // File might not have changed
    }
  }
  
  // Remove TEST_MODE from any remaining files
  try {
    const testModeFiles = execSync('grep -r "TEST_MODE" --include="*.ts" --include="*.js" . || true', {
      encoding: 'utf8'
    }).trim().split('\n').filter(Boolean);
    
    for (const line of testModeFiles) {
      const file = line.split(':')[0];
      if (file && !file.includes('node_modules')) {
        // Remove TEST_MODE references
        const content = fs.readFileSync(file, 'utf8');
        const cleaned = content.replace(/.*TEST_MODE.*\n/g, '');
        if (cleaned !== content) {
          fs.writeFileSync(file, cleaned);
          console.log(`   Cleaned TEST_MODE from ${file}`);
        }
      }
    }
  } catch {}
}

/**
 * Generate PR body with metadata
 */
function generatePRBody(options: {
  iterationName: string;
  title: string;
  body?: string;
  ticket?: string;
  commits: number;
}): string {
  const { iterationName, title, body, ticket, commits } = options;
  
  // Try to load iteration plan for context
  let planSummary = '';
  const planPath = path.join('collabiterations', iterationName, 'ITERATION_PLAN.md');
  if (fs.existsSync(planPath)) {
    const plan = fs.readFileSync(planPath, 'utf8');
    // Extract problem and solution sections
    const problemMatch = plan.match(/## Problem Statement\s*\n([\s\S]*?)(?=\n##|$)/);
    const solutionMatch = plan.match(/## Solution Approach\s*\n([\s\S]*?)(?=\n##|$)/);
    
    if (problemMatch) {
      planSummary += `### Problem\n${problemMatch[1].trim()}\n\n`;
    }
    if (solutionMatch) {
      planSummary += `### Solution\n${solutionMatch[1].trim()}\n\n`;
    }
  }
  
  return `## ${title}

${body || 'No description provided.'}

${ticket ? `**Jira Ticket**: ${ticket}` : ''}
**Iteration**: ${iterationName}
**Commits**: ${commits}

${planSummary}

### Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Playwright E2E tests pass
- [ ] Manual testing completed

### Checklist
- [ ] Code follows project conventions
- [ ] Tests added for new functionality
- [ ] Documentation updated if needed
- [ ] No iteration-specific code included
- [ ] Auth bypass code removed
- [ ] Rebased on latest main

### How to Test
1. Pull this branch
2. Run \`bun install\`
3. Start services normally (no TEST_MODE)
4. Test the feature as a regular user

---
*Created from iteration: ${iterationName}*`;
}