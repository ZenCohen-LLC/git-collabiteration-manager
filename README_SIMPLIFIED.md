# Git Collabiteration Manager (Simplified)

> One tool. Four commands. Zero confusion.

## What It Does

Creates isolated development environments for features with:
- ✅ Automatic auth bypass (no login screens)
- ✅ Test data that's always there
- ✅ Parallel development without conflicts  
- ✅ Clean PRs ready to merge

## Install

```bash
npm install -g https://github.com/ZenCohen-LLC/git-collabiteration-manager.git
npm install -g claude-flow@alpha
```

## The Only 4 Commands You Need

### 1. Start New Work
```bash
/iterate
# Or: gcm create feature-name --ticket BRAV-1234
```
→ Latest code, working environment, test data ready

### 2. Continue Work
```bash
/resume-iteration  
# Or: gcm resume feature-name
```
→ Checks health, starts what's needed, preserves your work

### 3. Share Work
```bash
gcm share feature-name --title "Add cool feature"
```
→ Clean PR without iteration junk, rebased and tested

### 4. Clean Up
```bash
/remove-iteration
# Or: gcm remove feature-name --force
```
→ Frees ports and cleans everything

## What's Different Now?

### Before (Complex)
- 10+ different STARTUP.md files
- 5+ ways to bypass auth
- Database resets breaking login
- Circular dependencies everywhere
- "Done" without testing

### After (Simple)
- One way to do each thing
- Auth always works (TEST_MODE=true)
- Database preserves test user
- Claude Flow prevents conflicts
- Done means tested against Figma

## Quick Fixes

**See login screen?**
```bash
echo "TEST_MODE=true" >> .env
# Restart backend
```

**Port conflict?**
```bash
lsof -ti:5180 | xargs kill -9
```

**Services down?**
```bash
./scripts/health-check.sh
gcm resume your-feature
```

## Development Flow

1. **Create** with `/iterate` → Environment ready at http://localhost:5180/
2. **Build** with Claude Flow agents → No circular dependencies
3. **Test** with Playwright → Matches Figma exactly
4. **Share** with `gcm share` → Clean PR ready for review

## The Rules

### Always
- Pull latest before creating
- Check Figma before implementing  
- Write tests with components
- Use gcm commands

### Never
- Drop the database
- Restart running services
- Skip tests
- Include TEST_MODE in PRs

## Port Allocation

Automatic based on iteration name:
- Frontend: 5180, 5190, 5200...
- Backend: 3010, 3020, 3030...
- Database: 5440, 5450, 5460...

## Test Data

Every iteration includes:
- User: `test@mail.com` (auto-login)
- Campaigns: 2 of each type
- Line items: Standard, management fee, zero-dollar

---

**Remember**: If something seems broken, run `./scripts/health-check.sh` first. It's probably already working.