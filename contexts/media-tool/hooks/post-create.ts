import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import chalk from 'chalk';

/**
 * Media Tool post-create hook
 * Sets up the collabiteration environment with all necessary configurations
 */
export async function setupMediaToolIteration(
  collabiterationPath: string, 
  collabiterationName: string,
  context: any
): Promise<void> {
  console.log(chalk.blue('\n🔧 Setting up Media Tool collabiteration environment...\n'));

  try {
    // Change to collabiteration directory
    process.chdir(collabiterationPath);

    // 1. Copy the comprehensive env template
    console.log(chalk.blue('⚙️  Creating environment file with all required variables...'));
    const envTemplate = readFileSync(join(__dirname, '../templates/env.media-tool.template'), 'utf8');
    const envContent = envTemplate
      .replace(/{iterationName}/g, collabiterationName)
      .replace(/{iterationBranch}/g, `iteration/${collabiterationName}`)
      .replace(/{dbPort}/g, context.database.actualPort || '5432')
      .replace(/{dbSchema}/g, context.database.schemaName || 'media_tool')
      .replace(/{frontendPort}/g, context.services.frontend.actualPort || '3000')
      .replace(/{backendPort}/g, context.services.backend.actualPort || '3001')
      .replace(/{createdDate}/g, new Date().toISOString());
    
    writeFileSync(join(collabiterationPath, '.env'), envContent);
    console.log(chalk.green('✅ Created .env file with all required variables'));

    // 2. Install dependencies
    console.log(chalk.blue('\n📦 Installing dependencies...'));
    execSync('bun install', { stdio: 'inherit' });

    // 3. Fix common issues
    console.log(chalk.blue('\n🔧 Fixing common iteration issues...'));
    fixCommonIssues(collabiterationPath);

    // 4. Start database and run migrations
    console.log(chalk.blue('\n🗄️  Starting database and running migrations...'));
    execSync('bun run db:start', { stdio: 'inherit' });
    
    // Wait for database to be ready
    console.log(chalk.gray('   Waiting for database to be ready...'));
    execSync('sleep 10', { stdio: 'inherit' });

    // 5. Setup Iteration Assistant
    console.log(chalk.blue('\n🤖 Setting up Iteration Assistant...'));
    await setupIterationAssistant(collabiterationPath, collabiterationName, context);

    // 6. Setup for test mode authentication
    console.log(chalk.blue('\n🔓 Setting up test mode authentication...'));
    console.log(chalk.green('✅ TEST_MODE=true is already set in .env'));
    
    // Create test user for TEST_MODE
    console.log(chalk.gray('   Creating test user for authentication bypass...'));
    try {
      execSync(`docker exec media-tool-postgres-1 psql -U postgres -d ${context.database.schemaName || 'media_tool'} -c "SET search_path TO media_tool, public;" -c "INSERT INTO users (id, name, email, zoho_user_id, created_at, updated_at) VALUES ('11111111-1111-1111-1111-111111111111', 'Test User', 'test@mail.com', 'test-zoho-id', NOW(), NOW()) ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW();"`, { stdio: 'pipe' });
      console.log(chalk.green('✅ Test user created successfully'));
    } catch (error) {
      console.log(chalk.yellow('⚠️  Could not create test user (may already exist or table not ready)'));
    }

    // 7. Important reminders
    console.log(chalk.yellow('\n⚠️  Important Notes:'));
    console.log(chalk.white('   - If you see login screen, check troubleshooting in STARTUP.md'));
    console.log(chalk.white('   - Database queries may need schema prefix (media_tool.*)'));
    console.log(chalk.white('   - Test user: test@mail.com (auto-created)\n'));
    
    // 8. Show helpful information
    console.log(chalk.green('\n✅ Media Tool collabiteration setup complete!\n'));
    console.log(chalk.cyan('🌐 Service URLs:'));
    console.log(chalk.white(`   Frontend: http://localhost:${context.services.frontend.actualPort || '3000'}`));
    console.log(chalk.white(`   Backend:  http://localhost:${context.services.backend.actualPort || '3001'}`));
    console.log(chalk.white(`   Database: localhost:${context.database.actualPort || '5432'}\n`));

    console.log(chalk.yellow('📝 Quick Start Commands:'));
    console.log(chalk.white('   1. Start services:'));
    console.log(chalk.gray('      # Start backend in one terminal:'));
    console.log(chalk.white('      source .env && bun packages/backend/src/index.ts\n'));
    console.log(chalk.gray('      # Start frontend in another terminal:'));
    console.log(chalk.white('      bun dev:frontend\n'));
    
    console.log(chalk.white('   2. (Optional) Seed test data:'));
    console.log(chalk.gray('      # Note: Data seeding has schema issues, you can:'));
    console.log(chalk.gray('      # - Work without seeded data (recommended)'));
    console.log(chalk.gray('      # - Or manually create test data in the UI\n'));

    console.log(chalk.cyan('🔑 Authentication:'));
    console.log(chalk.white('   TEST_MODE is enabled - no login required!\n'));

    console.log(chalk.red('⚠️  Known Issues:'));
    console.log(chalk.white('   - Data seeding scripts have schema prefix issues'));
    console.log(chalk.white('   - Cross-iteration imports have been fixed automatically'));
    console.log(chalk.white('   - If you see auth errors, ensure TEST_MODE=true in .env\n'));

  } catch (error) {
    console.error(chalk.red('\n❌ Setup failed:'), error);
    console.log(chalk.yellow('\n💡 Troubleshooting Tips:'));
    console.log(chalk.white('   1. Ensure Docker is running'));
    console.log(chalk.white('   2. Check that ports 3000, 3001, and 5432 are available'));
    console.log(chalk.white('   3. Try running: bun install'));
    console.log(chalk.white('   4. Check .env file has TEST_MODE=true\n'));
    throw error;
  }
}

/**
 * Fix common issues that break iterations
 */
function fixCommonIssues(collabiterationPath: string): void {
  // 1. Fix cross-iteration imports
  const problematicFiles = [
    'packages/frontend/src/hooks/use-line-item-type-annotations.ts',
    'packages/frontend/src/features/line-items/new-line-item-form.tsx'
  ];

  for (const file of problematicFiles) {
    const filePath = join(collabiterationPath, file);
    if (existsSync(filePath)) {
      let content = readFileSync(filePath, 'utf8');
      
      // Fix imports that reference other iterations
      if (content.includes('../../../iterations/')) {
        console.log(chalk.gray(`   Fixing cross-iteration imports in ${file}...`));
        
        // Comment out problematic imports
        content = content.replace(
          /import.*from ['"]\.\.\/\.\.\/\.\.\/iterations\/[^'"]+['"]/g,
          (match) => `// ${match} // Commented out - cross-iteration import`
        );
        
        // Add mock implementations for missing imports
        if (file.includes('use-line-item-type-annotations')) {
          content = content.replace(
            'const { addAnnotation } = useAnnotations();',
            '// Mock implementation for iteration without annotations context\n  const addAnnotation = () => {};'
          );
        }
        
        writeFileSync(filePath, content);
        console.log(chalk.green(`   ✅ Fixed ${file}`));
      }
    }
  }

  // 2. Ensure proper schema setup for database operations
  const dbConfigPath = join(collabiterationPath, 'packages/backend/src/db/postgres.ts');
  if (existsSync(dbConfigPath)) {
    let dbContent = readFileSync(dbConfigPath, 'utf8');
    
    // Check if schema setup is missing
    if (!dbContent.includes('search_path')) {
      console.log(chalk.gray('   Adding schema search path configuration...'));
      
      // Add search_path configuration after db connection
      dbContent = dbContent.replace(
        /const innerDb = pgp\(dbConfig\);/,
        `const innerDb = pgp(dbConfig);

// Set search_path for media_tool schema
innerDb.$pool.options.schema = 'media_tool';`
      );
      
      writeFileSync(dbConfigPath, dbContent);
      console.log(chalk.green('   ✅ Added schema configuration'));
    }
  }

  console.log(chalk.green('✅ Fixed common iteration issues'));
}

/**
 * Setup Iteration Assistant by copying files from line-item-types iteration template
 */
async function setupIterationAssistant(
  collabiterationPath: string,
  collabiterationName: string,
  context: any
): Promise<void> {
  const sourceIterationPath = join(collabiterationPath, '../line-item-types');
  
  // Check if source iteration exists to copy from
  if (!existsSync(sourceIterationPath)) {
    console.log(chalk.yellow('⚠️  Source iteration (line-item-types) not found, skipping Iteration Assistant setup'));
    console.log(chalk.gray('   The Iteration Assistant will need to be set up manually'));
    return;
  }

  try {
    console.log(chalk.gray('   Copying Iteration Assistant files from line-item-types template...'));

    // Define files to copy for Iteration Assistant
    const filesToCopy = [
      // Frontend Components
      'packages/frontend/src/components/iteration-modal.tsx',
      'packages/frontend/src/components/annotations-panel.tsx',
      
      // Frontend Hooks
      'packages/frontend/src/hooks/use-iteration-change-tracker.ts',
      'packages/frontend/src/hooks/use-auto-change-tracking.ts',
      
      // Frontend Context
      'packages/frontend/src/contexts/annotations-context.tsx',
      
      // Shared Types
      'packages/shared/src/iteration-types.ts',
      
      // Backend Services
      'packages/backend/src/services/iteration-metadata.ts',
      'packages/backend/src/services/iteration-history.ts',
      
      // Scripts
      'scripts/iteration-manager.js'
    ];

    // Copy each file
    for (const file of filesToCopy) {
      const sourcePath = join(sourceIterationPath, file);
      const destPath = join(collabiterationPath, file);
      
      if (existsSync(sourcePath)) {
        // Ensure destination directory exists
        const destDir = dirname(destPath);
        if (!existsSync(destDir)) {
          mkdirSync(destDir, { recursive: true });
        }
        
        // Copy file
        copyFileSync(sourcePath, destPath);
        console.log(chalk.gray(`     ✓ ${file}`));
      } else {
        console.log(chalk.yellow(`     ⚠️  ${file} (not found in source)`));
      }
    }

    // Add TRPC endpoints to app-router.ts
    await addIterationEndpoints(collabiterationPath);

    // Create .collabiteration-meta directory
    const metaDir = join(collabiterationPath, '.collabiteration-meta');
    if (!existsSync(metaDir)) {
      mkdirSync(metaDir, { recursive: true });
      console.log(chalk.gray('     ✓ Created .collabiteration-meta directory'));
    }

    // Create initial iteration summary if it doesn't exist
    await createIterationSummary(collabiterationPath, collabiterationName);

    // Ensure clean iteration data
    await ensureCleanIterationData(collabiterationPath, collabiterationName);

    console.log(chalk.green('✅ Iteration Assistant setup complete!'));
    console.log(chalk.cyan('🤖 Access the Iteration Assistant via the 🤖 icon in the frontend'));

  } catch (error) {
    console.error(chalk.red('❌ Failed to setup Iteration Assistant:'), error);
    console.log(chalk.yellow('💡 You can manually copy the files from line-item-types iteration'));
  }
}

/**
 * Add iteration TRPC endpoints to app-router.ts
 */
async function addIterationEndpoints(collabiterationPath: string): Promise<void> {
  const appRouterPath = join(collabiterationPath, 'packages/backend/src/api/trpc/app-router.ts');
  
  if (!existsSync(appRouterPath)) {
    console.log(chalk.yellow('     ⚠️  app-router.ts not found, skipping TRPC endpoints'));
    return;
  }

  let content = readFileSync(appRouterPath, 'utf8');
  
  // Check if iteration endpoints already exist
  if (content.includes('iterationMetadata')) {
    console.log(chalk.gray('     ✓ Iteration TRPC endpoints already exist'));
    return;
  }

  // Add imports for iteration services
  const importSection = `import { getIterationMetadata, updateIterationMetadata } from '../../services/iteration-metadata.js';
import { getIterationHistory, addIterationHistoryEntry } from '../../services/iteration-history.js';
import { readFileSync } from 'fs';
import { join } from 'path';`;

  // Add imports after existing imports
  content = content.replace(
    /(import.*from.*;\n)+/,
    `$&\n${importSection}\n`
  );

  // Add iteration endpoints to the router
  const iterationEndpoints = `
  // Iteration Assistant endpoints
  iterationMetadata: t.procedure.query(async () => {
    return getIterationMetadata();
  }),
  
  updateIterationMetadata: t.procedure
    .input(z.object({
      purpose: z.string().optional(),
      persona: z.array(z.string()).optional(),
      userProblem: z.string().optional(),
      iterationDescription: z.string().optional(),
      status: z.enum(['Brainstorming', 'Iterating', 'Refining', 'Ready for UX Review', 'Ship it!']).optional(),
      tags: z.array(z.string()).optional()
    }))
    .mutation(async (opts) => {
      return updateIterationMetadata(opts.input);
    }),

  iterationHistory: t.procedure.query(async () => {
    return getIterationHistory();
  }),

  addIterationHistoryEntry: t.procedure
    .input(z.object({
      type: z.enum(['change', 'note', 'milestone']),
      category: z.enum(['feature', 'bugfix', 'refactor', 'experiment']).optional(),
      description: z.string(),
      details: z.string().optional(),
      impact: z.enum(['high', 'medium', 'low']).optional(),
      filesChanged: z.array(z.string()).optional(),
      commitHash: z.string().optional()
    }))
    .mutation(async (opts) => {
      return addIterationHistoryEntry(opts.input);
    }),

  iterationSummary: t.procedure.query(async () => {
    try {
      // Get iteration name from directory structure
      const iterationName = require('path').basename(process.cwd().replace('/media-tool', ''));
      const iterationBasePath = join(process.cwd(), '../'); // Go up from media-tool to iteration root
      
      const planFilePatterns = [
        'ITERATION_SUMMARY.md',
        'ITERATION_PLAN.md', 
        'IMPLEMENTATION_PLAN.md',
        '{NAME}_ITERATION_PLAN.md', // Will be replaced with actual iteration name
        '{NAME}_IMPLEMENTATION_PLAN.md'
      ];
      
      // Replace {NAME} with actual iteration name (uppercase and with underscores)
      const formattedName = iterationName.toUpperCase().replace(/-/g, '_');
      const expandedPatterns = planFilePatterns.map(pattern => 
        pattern.replace('{NAME}', formattedName)
      );
      
      // Try each pattern until we find a file
      for (const pattern of expandedPatterns) {
        const filePath = join(iterationBasePath, pattern);
        try {
          const content = readFileSync(filePath, 'utf8');
          return { content, filename: pattern };
        } catch {
          continue;
        }
      }
      
      return { content: '# Iteration Plan\\n\\nNo iteration plan found.', filename: null };
    } catch {
      return { content: '# Iteration Plan\\n\\nError loading iteration plan.', filename: null };
    }
  }),`;

  // Find the end of the existing router and add iteration endpoints
  content = content.replace(
    /(\s+)(})(\s*;?\s*$)/m,
    `$1${iterationEndpoints}$1$2$3`
  );

  writeFileSync(appRouterPath, content);
  console.log(chalk.gray('     ✓ Added iteration TRPC endpoints'));
}

/**
 * Create initial ITERATION_SUMMARY.md if no plan file exists
 */
async function createIterationSummary(collabiterationPath: string, collabiterationName: string): Promise<void> {
  // Check for existing plan files first
  const formattedName = collabiterationName.toUpperCase().replace(/-/g, '_');
  const planFilePatterns = [
    'ITERATION_SUMMARY.md',
    'ITERATION_PLAN.md', 
    'IMPLEMENTATION_PLAN.md',
    `${formattedName}_ITERATION_PLAN.md`,
    `${formattedName}_IMPLEMENTATION_PLAN.md`
  ];
  
  // Check if any plan file already exists
  for (const pattern of planFilePatterns) {
    const planPath = join(collabiterationPath, pattern);
    if (existsSync(planPath)) {
      console.log(chalk.gray(`     ✓ Found existing plan file: ${pattern}`));
      console.log(chalk.cyan(`       This file will be displayed in the Iteration Assistant Plan tab`));
      return;
    }
  }

  // Create a basic summary if no plan file exists
  const summaryPath = join(collabiterationPath, 'ITERATION_SUMMARY.md');
  const summaryContent = `# ${collabiterationName.charAt(0).toUpperCase() + collabiterationName.slice(1).replace(/-/g, ' ')} Iteration

## Overview
This iteration was created to implement ${collabiterationName} functionality for the Fresh Bravo Media Tool.

## Purpose
*Describe the business purpose and goals of this iteration*

## User Problem
*What problem are we solving for users?*

## Proposed Solution
*High-level approach to solving the problem*

## Implementation Plan

### Phase 1: Setup and Planning
- [x] Create iteration environment
- [x] Set up Iteration Assistant
- [ ] Define detailed requirements
- [ ] Create implementation tasks

### Phase 2: Development
- [ ] Implement core functionality
- [ ] Add tests
- [ ] Update documentation

### Phase 3: Testing and Review
- [ ] Manual testing
- [ ] Code review
- [ ] Quality checks

## Notes
*Add any important notes, decisions, or considerations here*

---
*This iteration was created automatically by the git-collabiteration-manager*
*The existing implementation plan will be displayed in the Iteration Assistant Plan tab*
*Access the Iteration Assistant via the 🤖 icon in the frontend for more tools and tracking*
`;

  writeFileSync(summaryPath, summaryContent);
  console.log(chalk.gray('     ✓ Created ITERATION_SUMMARY.md (no existing plan found)'));
}

/**
 * Ensure clean iteration data for new iterations
 */
async function ensureCleanIterationData(collabiterationPath: string, collabiterationName: string): Promise<void> {
  const metaDir = join(collabiterationPath, '.collabiteration-meta');
  
  // Create clean iteration metadata
  const metadata = {
    name: collabiterationName,
    purpose: `Implement ${collabiterationName.replace(/-/g, ' ')} functionality`,
    persona: ['Media Trader'],
    userProblem: '',
    iterationDescription: '',
    status: 'Brainstorming',
    lastModified: new Date().toISOString(),
    tags: [collabiterationName],
    frontend: 'http://localhost:3000',
    backend: 'http://localhost:3001',
    gitInfo: {
      commits: 0,
      currentBranch: `iteration/${collabiterationName}`
    }
  };
  
  const metadataPath = join(metaDir, 'iteration-metadata.json');
  writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  console.log(chalk.gray('     ✓ Created clean iteration metadata'));
  
  // Create empty iteration history
  const history = {
    entries: [],
    lastUpdated: new Date().toISOString(),
    totalChanges: 0,
    summary: 'No changes recorded yet'
  };
  
  const historyPath = join(metaDir, 'iteration-history.json');
  writeFileSync(historyPath, JSON.stringify(history, null, 2));
  console.log(chalk.gray('     ✓ Created empty iteration history'));
}