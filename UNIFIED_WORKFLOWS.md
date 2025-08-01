# Unified Workflows - Single Implementation for Each

## 1. CREATE Workflow - `/iterate` Command

### When User Says "/iterate" or "start new iteration"

```markdown
## Step 1: Initial Setup
"I'll help you create a new iteration. Let me first ensure we have the latest code..."

[Execute]:
- git pull origin main
- Check current directory is media-tool root

## Step 2: Gather Information
"What feature or problem will this iteration address?"

[Wait for response, then]:
"Do you have a Jira ticket number for this? (e.g., BRAV-1234)"

## Step 3: Create Iteration Structure
"Creating iteration: [name] (Ticket: BRAV-XXXX)"

[Execute]:
gcm create [iteration-name] --ticket BRAV-XXXX

This automatically:
✓ Creates git worktree
✓ Sets up isolated environment
✓ Configures ports (frontend: 5180, backend: 3010, database: 5440)
✓ Installs dependencies
✓ Sets TEST_MODE=true
✓ Creates test user
✓ Populates test campaigns
✓ Starts all services
✓ Runs health checks

## Step 4: Requirements Gathering
"Now let's understand the problem:"

1. Who is experiencing this problem?
2. What specific issues are they facing?
3. What's the business impact?
4. What's your proposed solution?
5. Do you have Figma designs? [REQUIRED for UI work]

## Step 5: Initialize Claude Flow
"Setting up coordinated development..."

[Execute]:
npx claude-flow@alpha swarm init --topology hierarchical --max-agents 5
npx claude-flow@alpha memory store "iteration/[name]/plan" [gathered_requirements]

## Step 6: Confirm Ready
"✅ Iteration environment is ready!

- Frontend: http://localhost:5180/
- Logged in as: test@mail.com
- Test campaigns: 2 of each type loaded
- Claude Flow agents: Ready for parallel development

Ready to start development? I'll coordinate the implementation using Claude Flow agents."
```

## 2. ITERATE Workflow - Development Rules

### Database Operations
```javascript
// NEVER do this:
await db.query('DROP DATABASE media_tool');
await db.query('CREATE DATABASE media_tool');

// ALWAYS do this:
await db.transaction(async (trx) => {
  // Make changes within transaction
  await trx.query('UPDATE ...');
  await trx.query('INSERT ...');
});
```

### Component Development Process
```markdown
## Before Implementation
1. Review Figma design: [embedded link in task]
2. Check with coordinator agent for dependencies
3. Register component in swarm memory

## During Implementation
1. Create component following Figma exactly
2. Write Playwright test alongside
3. Report imports/exports to coordinator
4. Check for circular dependencies

## Definition of Done
✓ Component matches Figma design
✓ Playwright tests pass
✓ No circular dependencies
✓ Integrated with API/state
✓ Reviewed by test agent
```

### Claude Flow Agent Rules
```javascript
// Each agent MUST follow this protocol
const agentProtocol = {
  beforeStart: async () => {
    // Load context from memory
    const context = await claudeFlow.memory.get('iteration/context');
    const dependencies = await claudeFlow.memory.get('dependencies');
  },
  
  beforeCreatingFile: async (filePath) => {
    // Check with coordinator
    const approval = await coordinator.checkDependencies(filePath);
    if (!approval) throw new Error('Would create circular dependency');
  },
  
  afterCreatingComponent: async (component) => {
    // Register in memory
    await claudeFlow.memory.store(`components/${component.name}`, {
      imports: component.imports,
      exports: component.exports,
      tests: component.tests
    });
  }
};
```

## 3. RESUME Workflow - `/resume-iteration` Command

### Single Implementation
```markdown
## Step 1: Find Iterations
"Let me check for available iterations..."

[Execute]:
ls ./collabiterations/

## Step 2: Load Selected Iteration
"Loading iteration: [selected]"

[Execute]:
cd ./collabiterations/[selected]
cat ITERATION_PLAN.md

## Step 3: Health Check (CRITICAL)
"Checking environment status..."

[Execute]:
./scripts/health-check.sh

Results:
✓ Database: Running on port 5440
✓ Backend: Running on port 3010
✓ Frontend: Running on port 5180
✓ Test user: Exists
✓ Auth bypass: Working

## Step 4: Resume Based on State
[If all services running]:
"Environment is healthy! Ready to continue at http://localhost:5180/"

[If some services down]:
"Starting missing services..."
[Start ONLY what's needed]

[If auth not working]:
"Fixing authentication..."
[Restore test user, set TEST_MODE=true]

## Step 5: Reload Claude Flow Context
[Execute]:
npx claude-flow@alpha swarm resume --session [iteration-name]
npx claude-flow@alpha memory get "iteration/[name]/state"

"Loaded context. Current progress:
- Components completed: X/Y
- Tests written: X/Y
- Ready to continue with: [next task]"
```

## 4. SHARE Workflow - Creating Clean PRs

### Single Implementation
```bash
gcm share [iteration-name] --title "Feature: Description"
```

### What This Does
```javascript
async function share(iterationName, title) {
  // 1. Create clean branch
  const cleanBranch = `feature/${ticket}-${iterationName}`;
  await git.checkout('-b', cleanBranch);
  
  // 2. Copy only feature code (exclude iteration-specific)
  const filesToExclude = [
    'docker-compose.*.yml',
    '.env.iteration',
    'scripts/start-iteration.sh',
    'STARTUP.md',
    'TEST_DATA.sql'
  ];
  
  await copyFeatureFiles(iterationPath, '.', { exclude: filesToExclude });
  
  // 3. Restore production auth code
  await git.checkout('main', '--', 'packages/backend/src/middleware/auth.ts');
  
  // 4. Run all tests
  await run('bun test');
  await run('bun test:e2e');
  
  // 5. Rebase on main
  await git.fetch('origin', 'main');
  await git.rebase('origin/main');
  
  // 6. Create PR
  const prBody = generatePRBody({
    title,
    ticket,
    description: fromIterationPlan,
    testingInstructions: fromPlaywrightTests,
    checklist: standardChecklist
  });
  
  await gh.pr.create({
    title,
    body: prBody,
    base: 'main'
  });
}
```

## Health Check System - Single Implementation

### Universal Health Check Script
```bash
#!/bin/bash
# scripts/health-check.sh - Used by ALL iterations

# Configuration from environment
FRONTEND_PORT=${FRONTEND_PORT:-5180}
BACKEND_PORT=${BACKEND_PORT:-3010}
DB_PORT=${DB_PORT:-5440}

echo "🏥 Health Check Report"
echo "===================="

# 1. Docker Check
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker: Not running (start Docker Desktop)"
  exit 1
fi
echo "✅ Docker: Running"

# 2. Database Check
if docker ps | grep -q "postgres.*$DB_PORT"; then
  echo "✅ Database: Container running"
  
  if docker exec [container] pg_isready > /dev/null 2>&1; then
    echo "✅ Database: Accepting connections"
    
    # Check test user
    if docker exec [container] psql -U postgres -d media_tool \
       -c "SELECT email FROM users WHERE email='test@mail.com'" | grep -q "test@mail.com"; then
      echo "✅ Test User: Exists"
    else
      echo "❌ Test User: Missing (run setup-test-user.sh)"
    fi
  else
    echo "❌ Database: Not ready"
  fi
else
  echo "❌ Database: Container not found"
fi

# 3. Backend Check
if curl -s http://localhost:$BACKEND_PORT/auth/status > /dev/null 2>&1; then
  echo "✅ Backend: Running on port $BACKEND_PORT"
  
  # Check TEST_MODE
  if curl -s http://localhost:$BACKEND_PORT/auth/status | grep -q "test@mail.com"; then
    echo "✅ Auth Bypass: Working (TEST_MODE=true)"
  else
    echo "❌ Auth Bypass: Not working (check TEST_MODE env var)"
  fi
else
  echo "❌ Backend: Not accessible on port $BACKEND_PORT"
fi

# 4. Frontend Check
if curl -s http://localhost:$FRONTEND_PORT/ > /dev/null 2>&1; then
  echo "✅ Frontend: Running on port $FRONTEND_PORT"
else
  echo "❌ Frontend: Not accessible on port $FRONTEND_PORT"
fi

# 5. Summary
echo ""
echo "🌐 Access URL: http://localhost:$FRONTEND_PORT/"
echo "📧 Test User: test@mail.com"
echo ""

# Exit with appropriate code
if [[ $OUTPUT == *"❌"* ]]; then
  echo "⚠️  Some services need attention"
  exit 1
else
  echo "✅ All systems operational!"
  exit 0
fi
```

## Test Data Generator - Single Implementation

### Standard Test Campaigns
```sql
-- scripts/setup-test-data.sql
-- Creates 2 campaigns of EVERY type

DO $$
DECLARE
  stage_record RECORD;
  campaign_num INT;
  campaign_id UUID;
BEGIN
  -- Ensure test user exists
  INSERT INTO media_tool.users (email, name, zoho_user_id)
  VALUES ('test@mail.com', 'Test User', 'test-zoho-id')
  ON CONFLICT (email) DO UPDATE SET zoho_user_id = 'test-zoho-id';

  -- Create 2 campaigns for each stage
  FOR stage_record IN 
    SELECT unnest(enum_range(NULL::media_tool.campaign_stage)) as stage
  LOOP
    FOR campaign_num IN 1..2 LOOP
      campaign_id := gen_random_uuid();
      
      INSERT INTO media_tool.campaigns (
        id, name, stage, campaign_number,
        agency_fees_pct, referral_partner_fees_pct
      ) VALUES (
        campaign_id,
        stage_record.stage || ' Test Campaign ' || campaign_num,
        stage_record.stage,
        'TEST-' || substring(campaign_id::text, 1, 8),
        CASE WHEN campaign_num = 1 THEN 0.15 ELSE 0 END,
        CASE WHEN campaign_num = 2 THEN 0.10 ELSE 0 END
      );
      
      -- Add standard line items
      INSERT INTO media_tool.line_items (campaign_id, name, type, budget)
      VALUES 
        (campaign_id, 'Standard Display', 'standard', 10000),
        (campaign_id, 'Management Fee', 'management-fee', 1500),
        (campaign_id, 'Zero Dollar Social', 'zero-dollar', 0);
    END LOOP;
  END LOOP;
END $$;
```

## Figma Integration Rules

### In Iteration Plans
```markdown
## Implementation Phase 1: User Dashboard

**Figma Design**: [Dashboard Layout](https://figma.com/file/xxx/yyy?node-id=123:456)

Requirements from Figma:
- Header height: 64px with shadow
- Card spacing: 16px grid
- Primary button: Blue (#0066CC) with 8px radius
- Data table: Sortable columns with hover states

**IMPORTANT**: Open Figma link and implement EXACTLY as shown
```

### In Code Reviews
```javascript
// Component must match Figma
test('Dashboard matches Figma design', async ({ page }) => {
  await page.goto('/dashboard');
  
  // From Figma specs
  const header = page.locator('header');
  await expect(header).toHaveCSS('height', '64px');
  await expect(header).toHaveCSS('box-shadow', /0px 2px 4px/);
  
  const primaryButton = page.locator('button.primary');
  await expect(primaryButton).toHaveCSS('background-color', 'rgb(0, 102, 204)');
  await expect(primaryButton).toHaveCSS('border-radius', '8px');
});
```

## Error Prevention Patterns

### Prevent Database Rollbacks
```javascript
// middleware/migrations.ts
export async function runMigration(sql: string) {
  if (sql.includes('DROP') || sql.includes('TRUNCATE')) {
    throw new Error('Destructive operations not allowed in iterations');
  }
  
  // Always preserve test user
  await db.query(`
    INSERT INTO users (email, name, zoho_user_id)
    VALUES ('test@mail.com', 'Test User', 'test-zoho-id')
    ON CONFLICT (email) DO NOTHING
  `);
  
  return db.query(sql);
}
```

### Prevent Circular Dependencies
```javascript
// Claude Flow coordinator check
export async function checkImport(fromFile: string, importPath: string) {
  const dependencies = await memory.get('dependencies');
  
  if (wouldCreateCycle(dependencies, fromFile, importPath)) {
    throw new Error(`
      Circular dependency detected!
      ${fromFile} -> ${importPath} -> ... -> ${fromFile}
      
      Suggestion: Use lazy loading or extract shared types
    `);
  }
}
```

### Prevent Incomplete Components
```javascript
// Definition of done enforcer
export async function markComponentComplete(component: string) {
  const checks = {
    figmaReviewed: await memory.get(`${component}/figma-reviewed`),
    playwrightTests: await checkTestsExist(component),
    noCircularDeps: await checkDependencies(component),
    apiIntegrated: await checkAPIIntegration(component)
  };
  
  const failed = Object.entries(checks)
    .filter(([_, pass]) => !pass)
    .map(([check]) => check);
    
  if (failed.length > 0) {
    throw new Error(`
      Component not complete. Missing:
      ${failed.map(f => `- ${f}`).join('\n')}
    `);
  }
}
```

This unified workflow system ensures consistency, prevents common errors, and integrates intelligent coordination throughout the development process.