# Claude Behavioral Rules for Collabiterations

## Core Principles

1. **One Way to Do Things** - Always use the documented approach, never create alternatives
2. **Verify Before Declaring Done** - Check Figma, run tests, confirm functionality
3. **Preserve Working State** - Never break what's working (auth, database, services)
4. **Coordinate Everything** - Use Claude Flow to prevent conflicts

## Command Behaviors

### /iterate Command

**ALWAYS:**
```markdown
1. Pull latest main branch first
2. Use gcm create with --ticket flag  
3. Wait for all services to start
4. Verify health check passes
5. Initialize Claude Flow swarm
6. Confirm browser opens without login
```

**NEVER:**
```markdown
1. Skip pulling latest code
2. Create iteration without ticket number
3. Proceed if services aren't healthy
4. Skip Claude Flow initialization
5. Start work if auth isn't working
```

### /resume-iteration Command

**ALWAYS:**
```markdown
1. Run health check FIRST
2. Start only missing services
3. Verify test user still exists
4. Load iteration context/plan
5. Resume Claude Flow session
```

**NEVER:**
```markdown
1. Restart already-running services
2. Drop and recreate database
3. Ignore health check results
4. Lose previous work context
5. Start fresh Claude Flow session
```

### /remove-iteration Command

**ALWAYS:**
```markdown
1. Ensure PR is created first
2. Stop all services cleanly
3. Remove git worktree
4. Clean up Docker volumes
5. Free allocated ports
```

**NEVER:**
```markdown
1. Remove before sharing work
2. Force kill services
3. Leave Docker volumes
4. Keep ports allocated
```

## Development Behaviors

### Component Implementation

**ALWAYS:**
```typescript
// 1. Check Figma FIRST
const figmaUrl = "https://figma.com/file/...";
// Open and review design before coding

// 2. Check with coordinator
await coordinator.checkDependencies('./MyComponent.tsx');

// 3. Write component
export const MyComponent = () => {
  // Match Figma exactly
};

// 4. Write test immediately
test('MyComponent matches Figma design', async ({ page }) => {
  // Test all Figma requirements
});

// 5. Mark complete only when ALL done
await coordinator.markComplete('MyComponent');
```

**NEVER:**
```typescript
// Build without reviewing design
// Declare "implemented" without tests  
// Ignore coordinator warnings
// Create circular dependencies
// Skip Playwright tests
```

### Database Operations

**ALWAYS:**
```sql
-- Use transactions for data changes
BEGIN;
UPDATE campaigns SET ...;
COMMIT;

-- Use migrations for schema changes
ALTER TABLE campaigns ADD COLUMN ...;

-- Preserve test user
INSERT INTO users ... ON CONFLICT DO NOTHING;

-- Keep test data intact
WHERE email != 'test@mail.com'
```

**NEVER:**
```sql
-- Drop and recreate
DROP DATABASE media_tool;
CREATE DATABASE media_tool;

-- Truncate tables
TRUNCATE TABLE users;

-- Delete test user
DELETE FROM users WHERE email = 'test@mail.com';

-- Remove test campaigns
DELETE FROM campaigns WHERE name LIKE '%Test%';
```

### Service Management

**ALWAYS:**
```bash
# Check what's running first
ps aux | grep -E "(node|bun)" | grep -v grep
docker ps

# Start only what's needed
if ! curl http://localhost:3010/health; then
  start_backend
fi

# Use environment variables
TEST_MODE=true PORT=3010 bun run dev:backend
```

**NEVER:**
```bash
# Blindly restart everything
pkill -f node
docker-compose down
docker-compose up

# Hardcode ports
bun run dev:backend # assumes 3001

# Ignore TEST_MODE
bun run dev:backend # without TEST_MODE=true
```

## Claude Flow Integration

### Agent Coordination

**ALWAYS:**
```javascript
// Initialize swarm for iteration
await claudeFlow.swarm.init({
  topology: 'hierarchical',
  maxAgents: 5,
  context: iterationContext
});

// Report all dependencies
await memory.store('dependencies', {
  component: 'MyComponent',
  imports: ['./OtherComponent'],
  exports: ['MyComponent']
});

// Check before creating files
const canCreate = await coordinator.approve(filePath);
```

**NEVER:**
```javascript
// Work without coordination
// Create components in isolation
// Ignore dependency warnings
// Skip memory updates
// Bypass coordinator checks
```

### Parallel Development

**ALWAYS:**
```markdown
- Component Agent: Creates UI from Figma
- API Agent: Builds backend endpoints  
- Test Agent: Writes Playwright tests
- Integration Agent: Connects everything
- Coordinator: Prevents conflicts
```

**NEVER:**
```markdown
- Multiple agents editing same file
- Creating files without coordination
- Ignoring circular dependency warnings
- Working without communication
- Skipping coordinator approval
```

## Testing Requirements

### Component Testing

**ALWAYS:**
```typescript
// Every component needs Playwright test
test('Component visual regression', async ({ page }) => {
  await page.goto('/component-route');
  await expect(page).toHaveScreenshot('component.png');
});

test('Component functionality', async ({ page }) => {
  // Test all interactive elements
  await page.click('button');
  await expect(page.locator('.result')).toBeVisible();
});

test('Component matches Figma', async ({ page }) => {
  // Test specific Figma requirements
  const header = page.locator('header');
  await expect(header).toHaveCSS('height', '64px');
});
```

**NEVER:**
```typescript
// Skip tests
// Test only happy path
// Ignore Figma specifications
// Mark complete without tests passing
// Use .skip to bypass failing tests
```

### Integration Testing

**ALWAYS:**
```typescript
// Test full user flows
test('User can create campaign', async ({ page }) => {
  // Complete workflow test
  await page.goto('/campaigns/new');
  await page.fill('#name', 'Test Campaign');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/campaigns/');
});
```

## PR Creation

### Clean PR Rules

**ALWAYS:**
```bash
# Use gcm share command
gcm share feature-name --title "Clear description"

# This automatically:
# - Excludes docker-compose.*.yml
# - Excludes .env.iteration
# - Excludes test data scripts
# - Removes TEST_MODE code
# - Rebases on main
```

**NEVER:**
```bash
# Manual git commands
git add .
git commit -m "done"
git push

# Include iteration files
git add docker-compose.iteration.yml

# Include auth bypass
git add "TEST_MODE=true"

# Skip rebase
git push --force
```

## Error Handling

### When Things Break

**ALWAYS:**
1. Run health check first
2. Check Docker is running
3. Verify TEST_MODE is set
4. Check allocated ports
5. Review Claude Flow status

**NEVER:**
1. Assume it's broken without checking
2. Recreate everything from scratch
3. Change working configurations
4. Skip diagnostic steps
5. Panic

### Common Fixes

**Login Screen Showing:**
```bash
echo "TEST_MODE=true" >> .env
# Restart backend
```

**Circular Dependency:**
```javascript
// Let coordinator suggest solution
// Usually: extract shared types or lazy load
```

**Port Conflict:**
```bash
lsof -ti:5180 | xargs kill -9
# Or use different iteration name
```

**Database Connection Failed:**
```bash
docker ps # Check if running
docker-compose up -d postgres
```

## Memory Patterns

### What to Remember

**ALWAYS Store:**
- Iteration plan and context
- Component dependencies
- Test results
- Figma links
- Progress state

**NEVER Store:**
- Sensitive data
- User credentials  
- API keys
- Personal information
- Large files

## Summary Rules

1. **Create** → Pull latest, setup clean, verify working
2. **Iterate** → Preserve state, coordinate changes, test everything  
3. **Resume** → Check health, start missing, continue work
4. **Share** → Clean PR, no iteration code, rebase first

**Golden Rule**: If it's working, don't break it. If it's broken, check health first.