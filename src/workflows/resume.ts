import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { calculatePorts } from './utils';

interface ResumeOptions {
  name?: string;
}

interface IterationInfo {
  name: string;
  path: string;
  hasStartup: boolean;
  hasPlan: boolean;
  lastModified: Date;
}

/**
 * Unified RESUME workflow - Single implementation for resuming iterations
 */
export async function resumeIteration(options: ResumeOptions): Promise<void> {
  // Step 1: Find available iterations
  const iterations = await findIterations();
  
  if (iterations.length === 0) {
    console.log('❌ No iterations found.');
    console.log('💡 Create a new one with: gcm create <name>');
    return;
  }
  
  // Step 2: Select iteration
  let selectedIteration: IterationInfo;
  
  if (options.name) {
    const found = iterations.find(i => i.name === options.name);
    if (!found) {
      console.log(`❌ Iteration "${options.name}" not found.`);
      console.log('\nAvailable iterations:');
      iterations.forEach(i => console.log(`  - ${i.name}`));
      return;
    }
    selectedIteration = found;
  } else {
    // Show available iterations
    console.log('📂 Available iterations:\n');
    iterations.forEach((iter, index) => {
      console.log(`${index + 1}. ${iter.name}`);
      console.log(`   Path: ${iter.path}`);
      console.log(`   Last modified: ${iter.lastModified.toLocaleDateString()}`);
      console.log('');
    });
    
    // For CLI, we'd prompt for selection
    // For now, we'll require the name parameter
    console.log('Please specify iteration name: gcm resume <name>');
    return;
  }
  
  console.log(`\n📋 Loading iteration: ${selectedIteration.name}`);
  
  // Step 3: Load iteration plan
  if (selectedIteration.hasPlan) {
    const planPath = path.join(selectedIteration.path, 'ITERATION_PLAN.md');
    const planContent = fs.readFileSync(planPath, 'utf8');
    const firstLines = planContent.split('\n').slice(0, 10).join('\n');
    console.log('\n📄 Iteration plan found:');
    console.log(firstLines);
    console.log('...\n');
  }
  
  // Step 4: CRITICAL - Health check first
  console.log('🏥 Running health check...\n');
  const healthStatus = await runHealthCheck(selectedIteration);
  
  // Step 5: Take action based on health status
  if (healthStatus.allHealthy) {
    console.log('\n✅ All services are running and healthy!');
    console.log(`\n🌐 Access your application at: http://localhost:${healthStatus.ports.frontend}/`);
    console.log('📧 Logged in as: test@mail.com\n');
  } else {
    console.log('\n⚠️  Some services need attention:\n');
    
    // Start only what's needed
    if (!healthStatus.docker) {
      console.log('❌ Docker is not running. Please start Docker Desktop first.');
      return;
    }
    
    if (!healthStatus.database) {
      console.log('🗄️  Starting database...');
      await startDatabase(selectedIteration);
    }
    
    if (!healthStatus.testUser) {
      console.log('👤 Creating test user...');
      await createTestUser(selectedIteration);
    }
    
    if (!healthStatus.authBypass) {
      console.log('🔐 Fixing auth bypass...');
      await fixAuthBypass(selectedIteration);
    }
    
    console.log('\n💡 To start missing services, run:');
    console.log(`   cd ${selectedIteration.path}`);
    console.log('   ./scripts/start-iteration.sh\n');
  }
  
  // Step 6: Resume Claude Flow context
  console.log('🤖 Resuming Claude Flow context...');
  await resumeClaudeFlow(selectedIteration);
  
  // Step 7: Show current state
  await showIterationState(selectedIteration);
}

/**
 * Find all available iterations
 */
async function findIterations(): Promise<IterationInfo[]> {
  const iterations: IterationInfo[] = [];
  const collabiterationsPath = './collabiterations';
  
  if (!fs.existsSync(collabiterationsPath)) {
    return iterations;
  }
  
  const entries = fs.readdirSync(collabiterationsPath, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const iterPath = path.join(collabiterationsPath, entry.name);
      const stats = fs.statSync(iterPath);
      
      iterations.push({
        name: entry.name,
        path: iterPath,
        hasStartup: fs.existsSync(path.join(iterPath, 'scripts', 'start-iteration.sh')),
        hasPlan: fs.existsSync(path.join(iterPath, 'ITERATION_PLAN.md')),
        lastModified: stats.mtime
      });
    }
  }
  
  return iterations.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
}

/**
 * Run health check and return status
 */
async function runHealthCheck(iteration: IterationInfo): Promise<any> {
  const ports = calculatePorts(iteration.name);
  const healthCheckPath = path.join(iteration.path, 'scripts', 'health-check.sh');
  
  // If health check script exists, run it
  if (fs.existsSync(healthCheckPath)) {
    try {
      execSync(`bash ${healthCheckPath}`, {
        cwd: iteration.path,
        env: {
          ...process.env,
          ITERATION_NAME: iteration.name,
          FRONTEND_PORT: ports.frontend.toString(),
          BACKEND_PORT: ports.backend.toString(),
          DB_PORT: ports.database.toString()
        },
        stdio: 'inherit'
      });
    } catch {
      // Health check exited with error, parse what we can
    }
  }
  
  // Manual checks for status object
  const status = {
    allHealthy: false,
    docker: false,
    database: false,
    backend: false,
    frontend: false,
    testUser: false,
    authBypass: false,
    ports
  };
  
  // Check Docker
  try {
    execSync('docker info', { stdio: 'pipe' });
    status.docker = true;
  } catch {}
  
  // Check database
  if (status.docker) {
    try {
      execSync(
        `docker ps --format "{{.Names}}" | grep -q "${iteration.name}-postgres"`,
        { stdio: 'pipe' }
      );
      status.database = true;
    } catch {}
  }
  
  // Check backend
  try {
    execSync(`curl -sf http://localhost:${ports.backend}/auth/status`, { stdio: 'pipe' });
    status.backend = true;
    
    // Check auth bypass
    const authResponse = execSync(
      `curl -s http://localhost:${ports.backend}/auth/status`,
      { encoding: 'utf8' }
    );
    if (authResponse.includes('test@mail.com')) {
      status.authBypass = true;
    }
  } catch {}
  
  // Check frontend
  try {
    execSync(`curl -sf http://localhost:${ports.frontend}/`, { stdio: 'pipe' });
    status.frontend = true;
  } catch {}
  
  // Check test user (if database is running)
  if (status.database) {
    try {
      const result = execSync(
        `docker exec ${iteration.name}-postgres psql -U postgres -d media_tool -t -c "SELECT COUNT(*) FROM media_tool.users WHERE email='test@mail.com';"`,
        { encoding: 'utf8' }
      );
      if (parseInt(result.trim()) > 0) {
        status.testUser = true;
      }
    } catch {}
  }
  
  status.allHealthy = status.docker && status.database && status.backend && 
                     status.frontend && status.testUser && status.authBypass;
  
  return status;
}

/**
 * Start database service
 */
async function startDatabase(iteration: IterationInfo): Promise<void> {
  const dockerComposePath = `docker-compose.${iteration.name}.yml`;
  
  execSync(
    `docker compose -f ${dockerComposePath} up -d postgres`,
    { cwd: iteration.path, stdio: 'inherit' }
  );
  
  // Wait for ready
  console.log('⏳ Waiting for database to be ready...');
  for (let i = 0; i < 30; i++) {
    try {
      execSync(
        `docker compose -f ${dockerComposePath} exec postgres pg_isready -U postgres`,
        { cwd: iteration.path, stdio: 'pipe' }
      );
      console.log('✅ Database is ready');
      break;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Run migrations
  try {
    execSync(
      `docker compose -f ${dockerComposePath} --profile setup run --rm flyway`,
      { cwd: iteration.path, stdio: 'inherit' }
    );
  } catch {
    console.log('⚠️  Some migrations may have already run');
  }
}

/**
 * Create test user
 */
async function createTestUser(iteration: IterationInfo): Promise<void> {
  const dockerComposePath = `docker-compose.${iteration.name}.yml`;
  
  const sql = `
    INSERT INTO media_tool.users (id, email, name, zoho_user_id, created_at, updated_at) 
    VALUES (gen_random_uuid(), 'test@mail.com', 'Test User', 'test-zoho-id', NOW(), NOW()) 
    ON CONFLICT (email) DO UPDATE SET zoho_user_id = 'test-zoho-id';
  `;
  
  execSync(
    `docker compose -f ${dockerComposePath} exec -T postgres psql -U postgres -d media_tool`,
    { cwd: iteration.path, input: sql }
  );
  
  console.log('✅ Test user created');
}

/**
 * Fix auth bypass
 */
async function fixAuthBypass(iteration: IterationInfo): Promise<void> {
  const envPath = path.join(iteration.path, '.env');
  
  // Ensure TEST_MODE=true is in .env
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (!envContent.includes('TEST_MODE=true')) {
      fs.appendFileSync(envPath, '\nTEST_MODE=true\n');
    }
  } else {
    fs.writeFileSync(envPath, 'TEST_MODE=true\n');
  }
  
  console.log('✅ TEST_MODE=true set in .env');
  console.log('⚠️  Backend needs to be restarted for this to take effect');
}

/**
 * Resume Claude Flow context
 */
async function resumeClaudeFlow(iteration: IterationInfo): Promise<void> {
  try {
    // Resume swarm
    execSync(
      `npx claude-flow@alpha swarm resume --session "${iteration.name}"`,
      { cwd: iteration.path, stdio: 'inherit' }
    );
    
    // Get stored context
    const contextJson = execSync(
      `npx claude-flow@alpha memory get "iteration/${iteration.name}/context"`,
      { cwd: iteration.path, encoding: 'utf8' }
    );
    
    if (contextJson) {
      const context = JSON.parse(contextJson);
      console.log('✅ Claude Flow context restored');
    }
  } catch {
    console.log('⚠️  No Claude Flow session to resume');
  }
}

/**
 * Show current iteration state
 */
async function showIterationState(iteration: IterationInfo): Promise<void> {
  // FIRST: Check for TODO_STATE.md
  const todoStatePath = path.join(iteration.path, 'TODO_STATE.md');
  if (fs.existsSync(todoStatePath)) {
    console.log('\n📋 TODO STATE - CURRENT WORK STATUS:');
    console.log('═'.repeat(50));
    
    const todoContent = fs.readFileSync(todoStatePath, 'utf8');
    // Extract just the current status section
    const statusMatch = todoContent.match(/## Current Status[\s\S]*?(?=##|$)/);
    if (statusMatch) {
      console.log(statusMatch[0].trim());
    }
    
    console.log('═'.repeat(50));
    console.log('\n💡 For full task details, read: TODO_STATE.md\n');
  } else {
    console.log('\n⚠️  No TODO_STATE.md found - this is an older iteration');
  }
  
  console.log('\n📊 Iteration State Summary:');
  console.log('─'.repeat(40));
  
  // Git status
  try {
    const gitStatus = execSync('git status --porcelain', {
      cwd: iteration.path,
      encoding: 'utf8'
    });
    
    if (gitStatus.trim()) {
      const changes = gitStatus.trim().split('\n').length;
      console.log(`📝 Uncommitted changes: ${changes} files`);
    } else {
      console.log('📝 Working directory: Clean');
    }
  } catch {}
  
  // Last commit
  try {
    const lastCommit = execSync('git log -1 --oneline', {
      cwd: iteration.path,
      encoding: 'utf8'
    }).trim();
    console.log(`📌 Last commit: ${lastCommit}`);
  } catch {}
  
  // Check for test results
  const testDirs = ['test-results', 'playwright-report', 'coverage'];
  const foundTests = testDirs.filter(dir => 
    fs.existsSync(path.join(iteration.path, dir))
  );
  
  if (foundTests.length > 0) {
    console.log(`🧪 Test artifacts: ${foundTests.join(', ')}`);
  }
  
  // Check current phase
  const currentPhasePath = path.join(iteration.path, 'CURRENT_PHASE.md');
  if (fs.existsSync(currentPhasePath)) {
    const phase = fs.readFileSync(currentPhasePath, 'utf8').trim();
    console.log(`🎯 Current Phase: ${phase}`);
  }
  
  console.log('─'.repeat(40));
  console.log('\n🎯 Next steps:');
  console.log(`   1. cd ${iteration.path}`);
  console.log('   2. Read TODO_STATE.md for exact next action');
  console.log('   3. Continue development from documented position');
  console.log(`   4. When ready: gcm share ${iteration.name} --title "Your PR title"`);
}