import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { calculatePorts } from './utils';

interface RemoveOptions {
  name: string;
  force?: boolean;
}

/**
 * Remove iteration - clean up worktree and resources
 */
export async function removeIteration(options: RemoveOptions): Promise<void> {
  const { name, force } = options;
  
  console.log(`🗑️  Preparing to remove iteration: ${name}`);
  
  // Step 1: Verify iteration exists
  const iterationPath = path.join('collabiterations', name);
  if (!fs.existsSync(iterationPath)) {
    console.log(`❌ Iteration "${name}" not found.`);
    return;
  }
  
  // Step 2: Check for uncommitted changes (unless forced)
  if (!force) {
    console.log('🔍 Checking for uncommitted changes...');
    
    try {
      const gitStatus = execSync('git status --porcelain', {
        cwd: iterationPath,
        encoding: 'utf8'
      }).trim();
      
      if (gitStatus) {
        console.log('⚠️  You have uncommitted changes:');
        console.log(gitStatus);
        console.log('\n💡 Options:');
        console.log('   1. Commit your changes first');
        console.log('   2. Create a PR with: gcm share ' + name);
        console.log('   3. Force remove with: gcm remove ' + name + ' --force');
        console.log('\n⚠️  Force removing will DELETE all uncommitted work!');
        return;
      }
    } catch (error) {
      console.log('⚠️  Could not check git status, proceeding...');
    }
  }
  
  // Step 3: Stop all services
  console.log('🛑 Stopping services...');
  await stopServices(name, iterationPath);
  
  // Step 4: Remove git worktree
  console.log('🌳 Removing git worktree...');
  try {
    execSync(`git worktree remove ${iterationPath} --force`, { stdio: 'inherit' });
    console.log('✅ Worktree removed');
  } catch (error) {
    console.log('⚠️  Could not remove worktree, manual cleanup may be needed');
    
    // Try to clean up manually
    if (fs.existsSync(iterationPath)) {
      console.log('🧹 Attempting manual cleanup...');
      fs.rmSync(iterationPath, { recursive: true, force: true });
    }
  }
  
  // Step 5: Clean up Docker volumes
  console.log('🐳 Cleaning up Docker resources...');
  await cleanupDocker(name);
  
  // Step 6: Clean up Claude Flow data
  console.log('🤖 Cleaning up Claude Flow data...');
  await cleanupClaudeFlow(name);
  
  // Step 7: Delete remote branch (optional)
  const branchName = `iteration/${name}`;
  try {
    const remoteBranch = execSync('git ls-remote --heads origin ' + branchName, {
      encoding: 'utf8'
    }).trim();
    
    if (remoteBranch) {
      console.log(`\n📌 Remote branch exists: origin/${branchName}`);
      console.log('   To delete it: git push origin --delete ' + branchName);
    }
  } catch {}
  
  console.log('\n✅ Iteration removed successfully!');
  console.log('\n📊 Cleanup summary:');
  console.log('   ✅ Services stopped');
  console.log('   ✅ Worktree removed');
  console.log('   ✅ Docker resources cleaned');
  console.log('   ✅ Ports freed: ' + JSON.stringify(calculatePorts(name)));
}

/**
 * Stop all services for the iteration
 */
async function stopServices(name: string, iterationPath: string): Promise<void> {
  const ports = calculatePorts(name);
  
  // Kill processes on iteration ports
  const portsToKill = [ports.frontend, ports.backend];
  
  for (const port of portsToKill) {
    try {
      const pid = execSync(`lsof -ti:${port}`, { encoding: 'utf8' }).trim();
      if (pid) {
        execSync(`kill -9 ${pid}`);
        console.log(`   Stopped process on port ${port}`);
      }
    } catch {
      // Port not in use
    }
  }
  
  // Stop Docker containers
  const dockerComposePath = path.join(iterationPath, `docker-compose.${name}.yml`);
  if (fs.existsSync(dockerComposePath)) {
    try {
      execSync(`docker compose -f docker-compose.${name}.yml down`, {
        cwd: iterationPath,
        stdio: 'pipe'
      });
      console.log('   Stopped Docker containers');
    } catch {
      // Containers might not be running
    }
  }
}

/**
 * Clean up Docker resources
 */
async function cleanupDocker(name: string): Promise<void> {
  // Remove containers
  try {
    execSync(`docker rm -f ${name}-postgres ${name}-flyway 2>/dev/null`, {
      stdio: 'pipe'
    });
  } catch {}
  
  // Remove volumes
  try {
    execSync(`docker volume rm ${name}-postgres-data 2>/dev/null`, {
      stdio: 'pipe'
    });
    console.log('   Removed Docker volumes');
  } catch {}
  
  // Remove dangling images
  try {
    execSync('docker image prune -f', { stdio: 'pipe' });
  } catch {}
}

/**
 * Clean up Claude Flow data
 */
async function cleanupClaudeFlow(name: string): Promise<void> {
  try {
    // Clear memory for this iteration
    execSync(
      `npx claude-flow@alpha memory clear "iteration/${name}/*"`,
      { stdio: 'pipe' }
    );
    
    // End swarm session
    execSync(
      `npx claude-flow@alpha swarm end --session "${name}"`,
      { stdio: 'pipe' }
    );
    
    console.log('   Cleaned Claude Flow data');
  } catch {
    // Claude Flow might not be initialized
  }
}