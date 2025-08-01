import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

interface CreateOptions {
  name: string;
  ticket?: string;
  description?: string;
}

interface PortAllocation {
  frontend: number;
  backend: number;
  database: number;
}

/**
 * Unified CREATE workflow - Single implementation for creating iterations
 */
export async function createIteration(options: CreateOptions): Promise<void> {
  const { name, ticket, description } = options;
  
  console.log('🚀 Creating new iteration:', name);
  
  // Step 1: ALWAYS pull latest main first
  console.log('📥 Pulling latest code from main...');
  try {
    execSync('git fetch origin main', { stdio: 'inherit' });
    execSync('git pull origin main', { stdio: 'inherit' });
    console.log('✅ Updated to latest main branch');
  } catch (error) {
    console.log('⚠️  Could not pull latest main, continuing with current version');
  }
  
  // Step 2: Create git worktree
  const iterationPath = path.join('collabiterations', name);
  const branchName = `iteration/${name}`;
  
  console.log('🌳 Creating git worktree...');
  try {
    execSync(`git worktree add ${iterationPath} -b ${branchName}`, { stdio: 'inherit' });
    console.log('✅ Created worktree at:', iterationPath);
  } catch (error) {
    console.error('❌ Failed to create worktree:', error);
    throw error;
  }
  
  // Step 3: Calculate deterministic ports
  const ports = calculatePorts(name);
  console.log('🔌 Allocated ports:', ports);
  
  // Step 4: Copy and configure templates
  console.log('📄 Setting up configuration files...');
  await setupIterationFiles(iterationPath, name, ports, ticket);
  
  // Step 5: Create iteration plan
  await createIterationPlan(iterationPath, name, ticket, description);
  
  // Step 6: Start services
  console.log('🐳 Starting services...');
  await startServices(iterationPath, name);
  
  // Step 7: Setup database and test data
  console.log('🗄️  Setting up database...');
  await setupDatabase(iterationPath, name);
  
  // Step 8: Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('bun install', { cwd: iterationPath, stdio: 'inherit' });
  
  // Step 9: Create TODO_STATE.md
  console.log('📝 Creating TODO state tracker...');
  await createTodoState(name, iterationPath);
  
  // Step 10: Initialize Claude Flow
  console.log('🤖 Initializing Claude Flow...');
  await initializeClaudeFlow(name, iterationPath);
  
  // Step 11: Run health check
  console.log('🏥 Running health check...');
  const healthCheckPath = path.join(iterationPath, 'scripts', 'health-check.sh');
  try {
    execSync(`bash ${healthCheckPath}`, { 
      cwd: iterationPath,
      env: { ...process.env, ...getIterationEnv(ports, name) }
    });
    console.log('✅ All services healthy!');
  } catch (error) {
    console.error('⚠️  Some services may need attention, check health report above');
  }
  
  // Step 12: Start frontend and backend
  console.log('🎯 Starting development servers...');
  await startDevelopmentServers(iterationPath, ports, name);
  
  console.log(`
✅ Iteration "${name}" is ready!

🌐 Access your application at: http://localhost:${ports.frontend}/
📧 Logged in as: test@mail.com (auth bypass enabled)
📊 Test data: 2 campaigns of each type loaded

🛠️  Quick commands:
   Resume work:  gcm resume ${name}
   Share as PR:  gcm share ${name} --title "Your PR title"
   Health check: cd ${iterationPath} && ./scripts/health-check.sh

🤖 Claude Flow is initialized and ready for coordinated development.
  `);
}

/**
 * Calculate deterministic ports based on iteration name
 */
function calculatePorts(iterationName: string): PortAllocation {
  const hash = crypto.createHash('md5').update(iterationName).digest();
  const offset = (hash[0] % 20) * 10; // 0, 10, 20, ... 190
  
  return {
    frontend: 5173 + offset,
    backend: 3001 + offset,
    database: 5432 + offset
  };
}

/**
 * Setup iteration files from templates
 */
async function setupIterationFiles(
  iterationPath: string, 
  name: string, 
  ports: PortAllocation,
  ticket?: string
): Promise<void> {
  // Create necessary directories
  fs.mkdirSync(path.join(iterationPath, 'scripts'), { recursive: true });
  
  // Copy and configure docker-compose
  const dockerComposeTemplate = fs.readFileSync(
    path.join(__dirname, '../../templates/docker-compose.template.yml'), 
    'utf8'
  );
  const dockerCompose = replaceTemplateVars(dockerComposeTemplate, {
    iterationName: name,
    dbPort: ports.database.toString()
  });
  fs.writeFileSync(
    path.join(iterationPath, `docker-compose.${name}.yml`),
    dockerCompose
  );
  
  // Copy and configure .env
  const envTemplate = fs.readFileSync(
    path.join(__dirname, '../../templates/.env.template'),
    'utf8'
  );
  const envContent = replaceTemplateVars(envTemplate, {
    iterationName: name,
    dbPort: ports.database.toString(),
    backendPort: ports.backend.toString(),
    frontendPort: ports.frontend.toString(),
    createdDate: new Date().toISOString()
  });
  fs.writeFileSync(path.join(iterationPath, '.env'), envContent);
  fs.writeFileSync(path.join(iterationPath, '.env.template'), envContent);
  
  // Copy scripts
  const scriptsDir = path.join(__dirname, '../../templates');
  const scripts = ['health-check.sh', 'start-iteration.sh', 'setup-test-data.sql'];
  
  for (const script of scripts) {
    const scriptContent = fs.readFileSync(path.join(scriptsDir, script), 'utf8');
    const configured = replaceTemplateVars(scriptContent, {
      iterationName: name,
      dbPort: ports.database.toString(),
      backendPort: ports.backend.toString(),
      frontendPort: ports.frontend.toString()
    });
    
    const destPath = path.join(iterationPath, 'scripts', script);
    fs.writeFileSync(destPath, configured);
    fs.chmodSync(destPath, '755');
  }
}

/**
 * Create iteration plan file
 */
async function createIterationPlan(
  iterationPath: string,
  name: string,
  ticket?: string,
  description?: string
): Promise<void> {
  const plan = `# Iteration Plan: ${name}

${ticket ? `**Jira Ticket**: ${ticket}` : ''}
**Created**: ${new Date().toISOString()}
**Description**: ${description || 'To be defined'}

## Problem Statement
[To be gathered during planning phase]

## Users Affected
[To be identified]

## Business Impact
[To be assessed]

## Solution Approach
[To be designed]

## Implementation Phases
[To be planned]

## Testing Strategy
- Unit tests for all new functions
- Integration tests for workflows
- Playwright E2E tests for UI components
- Performance tests where applicable

## Success Criteria
[To be defined]

## Technical Notes
- Frontend Port: ${calculatePorts(name).frontend}
- Backend Port: ${calculatePorts(name).backend}
- Database Port: ${calculatePorts(name).database}
- Test User: test@mail.com
- Auth Bypass: TEST_MODE=true
`;

  fs.writeFileSync(path.join(iterationPath, 'ITERATION_PLAN.md'), plan);
}

/**
 * Start Docker services
 */
async function startServices(iterationPath: string, name: string): Promise<void> {
  const dockerComposePath = `docker-compose.${name}.yml`;
  
  // Start database
  execSync(
    `docker compose -f ${dockerComposePath} up -d postgres`,
    { cwd: iterationPath, stdio: 'inherit' }
  );
  
  // Wait for database to be ready
  console.log('⏳ Waiting for database...');
  for (let i = 0; i < 30; i++) {
    try {
      execSync(
        `docker compose -f ${dockerComposePath} exec postgres pg_isready -U postgres`,
        { cwd: iterationPath, stdio: 'pipe' }
      );
      break;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Run migrations
  try {
    execSync(
      `docker compose -f ${dockerComposePath} --profile setup run --rm flyway`,
      { cwd: iterationPath, stdio: 'inherit' }
    );
  } catch {
    console.log('⚠️  Some migrations may have already run, continuing...');
  }
}

/**
 * Setup database with test user and data
 */
async function setupDatabase(iterationPath: string, name: string): Promise<void> {
  const dockerComposePath = `docker-compose.${name}.yml`;
  
  // Setup permissions and test user
  const setupSql = `
    ALTER USER media_tool WITH PASSWORD 'pass';
    GRANT ALL PRIVILEGES ON SCHEMA media_tool TO media_tool;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA media_tool TO media_tool;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA media_tool TO media_tool;
    
    INSERT INTO media_tool.users (id, email, name, zoho_user_id, created_at, updated_at) 
    VALUES (gen_random_uuid(), 'test@mail.com', 'Test User', 'test-zoho-id', NOW(), NOW()) 
    ON CONFLICT (email) DO UPDATE SET zoho_user_id = 'test-zoho-id';
  `;
  
  execSync(
    `docker compose -f ${dockerComposePath} exec -T postgres psql -U postgres -d media_tool`,
    { cwd: iterationPath, input: setupSql }
  );
  
  // Run test data setup
  const testDataPath = path.join(iterationPath, 'scripts', 'setup-test-data.sql');
  const testData = fs.readFileSync(testDataPath, 'utf8');
  
  execSync(
    `docker compose -f ${dockerComposePath} exec -T postgres psql -U postgres -d media_tool`,
    { cwd: iterationPath, input: testData }
  );
  
  console.log('✅ Database configured with test user and campaigns');
}

/**
 * Create TODO_STATE.md file for tracking work
 */
async function createTodoState(name: string, iterationPath: string): Promise<void> {
  const templatePath = path.join(__dirname, '../../templates/TODO_STATE.template.md');
  const template = fs.readFileSync(templatePath, 'utf8');
  
  const todoContent = replaceTemplateVars(template, {
    'ITERATION_NAME': name,
    'TIMESTAMP': new Date().toISOString()
  });
  
  fs.writeFileSync(path.join(iterationPath, 'TODO_STATE.md'), todoContent);
  
  // Also create CURRENT_PHASE.md
  fs.writeFileSync(
    path.join(iterationPath, 'CURRENT_PHASE.md'), 
    'PLAN\n'
  );
  
  console.log('✅ Created TODO_STATE.md and CURRENT_PHASE.md');
}

/**
 * Initialize Claude Flow for coordination
 */
async function initializeClaudeFlow(name: string, iterationPath: string): Promise<void> {
  try {
    execSync(
      `npx claude-flow@alpha swarm init --topology hierarchical --max-agents 5 --session "${name}"`,
      { cwd: iterationPath, stdio: 'inherit' }
    );
    
    // Store iteration context
    const context = {
      name,
      path: iterationPath,
      ports: calculatePorts(name),
      created: new Date().toISOString()
    };
    
    execSync(
      `npx claude-flow@alpha memory store "iteration/${name}/context" '${JSON.stringify(context)}'`,
      { cwd: iterationPath, stdio: 'inherit' }
    );
    
    console.log('✅ Claude Flow initialized');
  } catch (error) {
    console.log('⚠️  Claude Flow initialization optional, continuing...');
  }
}

/**
 * Start development servers
 */
async function startDevelopmentServers(
  iterationPath: string, 
  ports: PortAllocation,
  name: string
): Promise<void> {
  const startScript = path.join(iterationPath, 'scripts', 'start-iteration.sh');
  
  console.log(`
📋 To start development servers, run:
   cd ${iterationPath}
   ./scripts/start-iteration.sh

Or start them manually:
   Backend: DB_PORT=${ports.database} PORT=${ports.backend} TEST_MODE=true bun run dev:backend
   Frontend: VITE_API_URL=http://localhost:${ports.backend}/api VITE_PORT=${ports.frontend} bun run dev:frontend
  `);
}

/**
 * Replace template variables
 */
function replaceTemplateVars(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`{${key}}`, 'g'), value);
  }
  return result;
}

/**
 * Get iteration environment variables
 */
function getIterationEnv(ports: PortAllocation, name: string): Record<string, string> {
  return {
    ITERATION_NAME: name,
    FRONTEND_PORT: ports.frontend.toString(),
    BACKEND_PORT: ports.backend.toString(),
    DB_PORT: ports.database.toString()
  };
}