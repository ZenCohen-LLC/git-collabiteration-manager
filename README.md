# Git Collabiteration Manager

> One tool. Four commands. Zero confusion.

A simplified git worktree-based iteration manager that creates isolated development environments with automatic auth bypass, test data, and Claude Flow coordination.

## Quick Install

```bash
npm install -g https://github.com/ZenCohen-LLC/git-collabiteration-manager.git
npm install -g claude-flow@alpha
```

## The 4 Essential Commands

### 1. Create New Iteration
```bash
gcm create feature-name --ticket BRAV-1234
```
✅ Pulls latest code  
✅ Sets up isolated environment  
✅ Configures auth bypass  
✅ Loads test data  
✅ Initializes Claude Flow  

### 2. Resume Work
```bash
gcm resume feature-name
```
✅ Health checks first  
✅ Starts only what's needed  
✅ Preserves all your work  
✅ Resumes Claude Flow context  

### 3. Share as PR
```bash
gcm share feature-name --title "Add awesome feature"
```
✅ Creates clean branch  
✅ Excludes iteration files  
✅ Removes auth bypass  
✅ Rebases on main  

### 4. Clean Up
```bash
gcm remove feature-name --force
```
✅ Stops all services  
✅ Removes worktree  
✅ Cleans Docker resources  
✅ Frees ports  

## What Makes This Different?

### 🎯 Simplified
- **One way** to do each thing (no more competing approaches)
- **Unified templates** for all configurations
- **Deterministic ports** based on iteration name
- **Standard test data** in every iteration

### 🛡️ Reliable
- **Auth always works** with TEST_MODE=true
- **Test user preserved** through all operations
- **Health checks** before any action
- **Claude Flow** prevents circular dependencies

### 🚀 Fast
- **Under 5 minutes** to start new iteration
- **Instant resume** with health-aware startup
- **Clean PRs** ready to merge
- **Parallel development** without conflicts

## Key Features

### Automatic Auth Bypass
Every iteration includes:
- `TEST_MODE=true` environment variable
- Test user: `test@mail.com` 
- Auto-login enabled
- No auth screens blocking development

### Comprehensive Test Data
Automatically creates:
- 2 campaigns of **every** stage type
- Standard, management fee, and zero-dollar line items
- All required database functions
- Consistent test user with all fields

### Claude Flow Integration
Prevents common issues:
- 🚫 Circular dependencies detected before creation
- ✅ Components must match Figma designs
- ✅ Playwright tests required for completion
- ✅ Coordinated parallel development

### Smart Health Checks
Before any operation:
- Checks Docker status
- Verifies database connection
- Confirms test user exists
- Validates auth bypass
- Reports exact issues

## Port Allocation

Deterministic based on iteration name:
```
Frontend: 5173 + offset (5180, 5190, 5200...)
Backend:  3001 + offset (3010, 3020, 3030...)
Database: 5432 + offset (5440, 5450, 5460...)
```

## Common Issues & Fixes

### "I see a login screen"
```bash
echo "TEST_MODE=true" >> .env
# Restart backend
```

### "Port already in use"
```bash
lsof -ti:5180 | xargs kill -9
# Or use different iteration name
```

### "Services not starting"
```bash
cd collabiterations/your-feature
./scripts/health-check.sh
# Follow specific recommendations
```

## Development Workflow

### Starting New Feature
```bash
# 1. Create with Jira ticket
gcm create new-feature --ticket BRAV-1234

# 2. Automatic setup happens
# - Latest code pulled
# - Environment configured  
# - Services started
# - Test data loaded

# 3. Browser opens to http://localhost:5180/
# Already logged in as test@mail.com
```

### Continuing Work
```bash
# 1. Resume iteration
gcm resume new-feature

# 2. Health check runs automatically
# - Only missing services start
# - Your work is preserved

# 3. Continue development
# Claude Flow context restored
```

### Submitting PR
```bash
# 1. Share your work
gcm share new-feature --title "Add cool feature"

# 2. Automatic cleanup
# - Iteration files excluded
# - Auth bypass removed  
# - Branch rebased on main

# 3. PR created on GitHub
# Ready for review
```

## Architecture

- **Git Worktrees**: True isolation without VM overhead
- **Docker Compose**: Consistent service management
- **Template System**: Unified configuration across iterations
- **Claude Flow**: Intelligent development coordination
- **Health Monitoring**: Proactive issue detection

## Requirements

- Node.js 18+
- Docker Desktop
- Git 2.20+ (worktree support)
- Bun (for media-tool)

## Advanced Usage

### Custom Description
```bash
gcm create feature-name --ticket BRAV-1234 --description "Complex feature"
```

### Force Remove
```bash
gcm remove feature-name --force  # Skip safety checks
```

### List Iterations
```bash
gcm list  # Show all active iterations
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Make changes following the patterns
4. Submit PR with clear description

## Philosophy

- **Simplicity**: One right way to do things
- **Reliability**: Always works the same way
- **Speed**: Get coding in under 5 minutes
- **Safety**: Preserve work, prevent mistakes

## License

MIT - See LICENSE file

---

**Remember**: If something seems broken, run `./scripts/health-check.sh` first. It's probably already working.