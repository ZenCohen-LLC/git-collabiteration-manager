# Git Collabiteration Manager - Claude Instructions

## 🚀 Simplified System - Use ONLY These 4 Workflows

### Core Principle
**ONE way to do each thing. NO alternatives. NO variations.**

### ⚠️ CRITICAL: Never Modify the media-tool Directory
**The freshbravo/media-tool directory is SACRED and READ-ONLY**
- NEVER make changes directly to /Users/christophergarrison/freshbravo/media-tool
- This directory should remain 1:1 with what's in git
- ALL changes happen through git worktrees in collabiterations/
- Updates to media-tool come ONLY from git pull
- Changes are contributed back via PRs from iteration branches

### 🎯 IMPORTANT: Funnel of Focus
**When working on iterations, ALWAYS start here:**
- Read `/Users/christophergarrison/freshbravo/git-collabiteration-manager/START_HERE.md`
- This file contains the exact sequence for picking up any iteration work
- DO NOT skip this step - it prevents lost work and confusion

## The 4 Workflows

### 1. /iterate - Create New Iteration

When user says `/iterate` or wants to start new work:

```markdown
1. ALWAYS pull latest main first
2. ALWAYS ask for Jira ticket (if project uses them)  
3. ALWAYS use: gcm create [name] --ticket BRAV-XXXX
4. ALWAYS verify health check passes
5. ALWAYS confirm browser opens without login
```

**What happens automatically:**
- Git worktree created in `/collabiterations/[name]/`
- Ports allocated: frontend 5180+, backend 3010+, database 5440+
- TEST_MODE=true set everywhere
- Test user created: test@mail.com
- Test campaigns: 2 of each type
- Claude Flow initialized

**NEVER:**
- Skip pulling latest code
- Create alternative setup methods
- Modify the automated process
- Proceed if health check fails

### 2. /resume-iteration - Continue Work

When user says `/resume-iteration`:

```markdown
1. List iterations from ./collabiterations/
2. ALWAYS run health check first
3. Start ONLY missing services
4. NEVER restart running services
5. Load iteration context and continue
```

**Health Check Priority:**
```bash
✅ If all healthy → Ready to continue
❌ If Docker not running → Stop, user must start Docker
⚠️  If some services down → Start only those
🔐 If auth broken → Fix TEST_MODE, restart backend
```

**NEVER:**
- Restart services that are running
- Drop and recreate database
- Delete test user
- Ignore health check results

### 3. gcm share - Create Clean PR

When ready to share:

```markdown
1. Check for uncommitted changes
2. Create clean feature branch
3. Cherry-pick commits (exclude iteration files)
4. Remove all auth bypass code
5. Rebase on latest main
6. Create PR with metadata
```

**Files ALWAYS excluded:**
- docker-compose.*.yml
- .env files
- Scripts in scripts/
- STARTUP.md, ITERATION_PLAN.md
- *.log files
- TEST_MODE references

### 4. /remove-iteration - Clean Up

When done with iteration:

```markdown
1. Check for uncommitted work
2. Stop all services
3. Remove git worktree
4. Clean Docker volumes
5. Free allocated ports
```

## Critical Rules

### Database Operations
```sql
-- NEVER do this:
DROP DATABASE media_tool;
TRUNCATE TABLE users;

-- ALWAYS preserve test user:
ON CONFLICT (email) DO UPDATE SET zoho_user_id = 'test-zoho-id';
```

### Component Development
```markdown
1. ALWAYS check Figma first
2. ALWAYS write Playwright tests
3. ALWAYS use Claude Flow coordination
4. NEVER declare "done" without tests
```

### Port Allocation
```javascript
// Deterministic based on iteration name
const hash = crypto.createHash('md5').update(iterationName).digest();
const offset = (hash[0] % 20) * 10;
// Results in: 0, 10, 20, ... 190
```

### Test Data
Every iteration gets:
- Test user: test@mail.com with zoho_user_id
- 2 campaigns per stage (all stages)
- Line items: standard, management fee, zero dollar
- All required functions and permissions

## Claude Flow Integration

### Automatic on Create
```javascript
npx claude-flow@alpha swarm init \
  --topology hierarchical \
  --max-agents 5 \
  --session "[iteration-name]"
```

### Agent Coordination Rules
1. **Before creating files**: Check dependencies won't create circles
2. **After creating component**: Register in memory
3. **Before marking complete**: Verify all criteria met
4. **Always communicate**: Through Claude Flow memory

### Circular Dependency Prevention
```javascript
// This is handled automatically
if (wouldCreateCircularDependency(deps, file, imports)) {
  throw new Error('Circular dependency detected!');
}
```

## Common Issues & ONLY Solutions

### "Login screen showing"
```bash
echo "TEST_MODE=true" >> .env
# Restart backend
```

### "Port conflict"
```bash
lsof -ti:5180 | xargs kill -9
# Or use different iteration name
```

### "Database error"
```bash
# Check Docker is running
docker ps
# Run health check
./scripts/health-check.sh
```

### "Circular dependency"
Let Claude Flow coordinator suggest refactoring

## What's Been Simplified

### Before (Complex)
- 10+ different STARTUP.md files
- 5+ ways to bypass auth
- Multiple health check scripts
- Various port schemes
- Competing workflows

### After (Simple)
- 1 template set in /templates
- 1 auth method: TEST_MODE=true
- 1 health check script
- 1 port algorithm
- 1 way per workflow

## NEVER Create These

1. Alternative startup scripts
2. Different auth bypass methods
3. New health check variants
4. Custom port allocations
5. Workflow variations

## Success Metrics

When working correctly:
- ✅ Browser opens without login
- ✅ test@mail.com shown in UI
- ✅ Test campaigns visible
- ✅ All services healthy
- ✅ Claude Flow preventing issues

## The Golden Rules

1. **If it's working, don't change it**
2. **If it's broken, run health check first**
3. **One way to do things, not multiple**
4. **Trust the automation**
5. **Follow the 4 workflows exactly**

---

**Remember**: The system is designed to just work. Don't create alternatives or "improvements" - use what's been simplified and tested.