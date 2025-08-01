# Git Collabiteration Manager - Quick Start Guide

## Installation (One Time)

```bash
# Install the tool globally
npm install -g https://github.com/ZenCohen-LLC/git-collabiteration-manager.git

# Install Claude Flow for coordination
npm install -g claude-flow@alpha

# Navigate to your media-tool project
cd ~/projects/media-tool

# Initialize (one time per project)
gcm init
```

## The 4 Essential Commands

### 1. Start New Iteration
```bash
# In Claude conversation:
/iterate

# Or directly:
gcm create feature-name --ticket BRAV-1234
```

**What happens automatically:**
- Pulls latest code from main
- Creates isolated environment
- Sets up auth bypass (TEST_MODE=true)
- Populates test data (2 campaigns of each type)
- Starts all services on dedicated ports
- Opens browser to http://localhost:5180/
- Initializes Claude Flow agents

### 2. Resume Existing Work
```bash
# In Claude conversation:
/resume-iteration

# Or directly:
gcm resume feature-name
```

**What happens automatically:**
- Checks health of all services
- Starts only missing services
- Verifies auth bypass still works
- Loads your iteration context
- Resumes Claude Flow coordination

### 3. Share Your Work
```bash
# When ready for PR:
gcm share feature-name --title "Add awesome feature"
```

**What happens automatically:**
- Creates clean branch (no iteration artifacts)
- Removes auth bypass code
- Runs all tests
- Rebases on latest main
- Creates PR with metadata

### 4. Clean Up
```bash
# After PR is merged:
/remove-iteration

# Or directly:
gcm remove feature-name --force
```

## Quick Troubleshooting

### "Can't access the app" / Login screen showing
```bash
# Run health check
cd collabiterations/your-feature
./scripts/health-check.sh

# If auth bypass not working:
echo "TEST_MODE=true" >> .env
# Restart backend
```

### Port conflicts
```bash
# Find what's using the port
lsof -i :5180

# Kill it
kill -9 [PID]

# Or use different iteration (auto-assigns different ports)
```

### Database issues
```bash
# Check if Docker is running
docker ps

# If not, start Docker Desktop, then:
gcm resume your-feature
```

### Circular dependency errors
This means Claude Flow prevented a problem! Let the coordinator agent suggest a fix.

## Development Workflow

### Starting Fresh
```bash
# 1. Create iteration
/iterate
# Provide: feature description, Jira ticket, Figma links

# 2. Claude automatically sets everything up
# You're now at http://localhost:5180/ logged in as test@mail.com

# 3. Develop with Claude Flow agents
# They coordinate to prevent conflicts

# 4. Share when done
gcm share your-feature --title "Feature: Description"
```

### Continuing Work
```bash
# 1. Resume iteration
/resume-iteration
# Select your iteration from the list

# 2. Everything starts back up
# Continue where you left off

# 3. Make changes
# Claude Flow agents maintain coordination

# 4. Share updates
gcm share your-feature --title "Updated: Description"
```

## Important Rules

### ✅ DO
- Always provide Figma links for UI work
- Always write Playwright tests for components
- Always use the gcm commands (not manual processes)
- Always check health before assuming something is broken

### ❌ DON'T
- Don't drop/recreate the database (use migrations)
- Don't restart services that are already running
- Don't declare components "done" without tests
- Don't include iteration code in PRs

## Port Allocation

Each iteration gets unique ports based on its name:
- Frontend: 5173 + offset (5180, 5190, 5200...)
- Backend: 3001 + offset (3010, 3020, 3030...)
- Database: 5432 + offset (5440, 5450, 5460...)

## Test Data

Every iteration includes:
- Test user: `test@mail.com` (auto-login)
- 2 campaigns of each stage type
- Standard, management fee, and zero-dollar line items
- All required database functions and views

## Common Patterns

### Adding a New Component
```typescript
// 1. Claude Flow agent checks dependencies first
await coordinator.checkDependencies('./components/NewComponent.tsx');

// 2. Create component matching Figma exactly
export const NewComponent = () => {
  // Implementation matching Figma specs
};

// 3. Write Playwright test alongside
test('NewComponent matches Figma', async ({ page }) => {
  // Test implementation
});

// 4. Register completion
await coordinator.markComplete('NewComponent');
```

### Making Database Changes
```sql
-- Always use migrations, never DROP
ALTER TABLE campaigns ADD COLUMN new_field TEXT;

-- Always preserve test data
UPDATE campaigns SET new_field = 'test' WHERE name LIKE '%Test Campaign%';
```

### Checking Status
```bash
# Overall health
./scripts/health-check.sh

# Service logs
docker logs [iteration-name]-postgres
tail -f backend.log
tail -f frontend.log

# Claude Flow status
npx claude-flow@alpha swarm status
```

## Getting Help

1. **Health issues**: Run `./scripts/health-check.sh` first
2. **Claude Flow issues**: Check coordination status with `npx claude-flow@alpha swarm status`
3. **Can't find iteration**: Look in `./collabiterations/` directory
4. **PR problems**: Ensure you used `gcm share` not manual git commands

## Remember

The system is designed to:
- **Just work** - Everything auto-configures
- **Prevent problems** - Claude Flow stops circular dependencies
- **Stay isolated** - Each iteration is independent
- **Merge cleanly** - PRs exclude iteration-specific code

If something seems broken, run health check first. 90% of issues are already-running services or missing TEST_MODE.