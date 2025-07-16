# /resume-iteration Workflow

## When user types /resume-iteration:

### Step 1: Read System Documentation
First, I'll read:
- COLLABITERATION_MANAGER_PROCESS.md
- Key sections of README.md
- Understanding git worktree structure and workflow

### Step 2: Discover Available Iterations
```
Let me check what iterations are available to resume...

[Check these locations:]
- /collabiterations/* directories
- .git-collabiterations/* worktrees  
- git branch -r | grep iteration/
- Any iteration registry files
```

### Step 3: Present Options
```
I found the following iterations:

1. **custom-pacing-enhancements**
   - Status: Stage 2 - Verification pending
   - Description: Monthly block generator for Account Managers
   - Last updated: 2 days ago

2. **dashboard-performance**
   - Status: Stage 3 - Development in progress  
   - Description: Optimize dashboard loading times
   - Last updated: 1 week ago

3. **user-permissions-update**
   - Status: Stage 1 - Setup complete
   - Description: Granular permission system
   - Last updated: 3 days ago

Which iteration would you like to resume? (enter number or name):
```

### Step 4: Load Selected Iteration

After user selects (e.g., "custom-pacing"):

```
Loading iteration: custom-pacing-enhancements

Reading documentation...
✅ Found iteration plan at: /collabiterations/custom-pacing/CUSTOM_PACING_ITERATION_PLAN.md
✅ Checking git worktree status...
✅ Loading change history...
```

### Step 5: Read and Analyze Documents

Read in this order:
1. **ITERATION_PLAN.md** - Full context and specifications
2. **Change logs** - What's been modified
3. **TODO lists** - Current progress
4. **Git status** - Uncommitted changes
5. **Test results** - If available

### Step 6: Summarize Current State

```
📋 **Iteration: custom-pacing-enhancements**

**Context:**
- Problem: Account Managers waste 15-30 minutes creating monthly schedules
- Solution: Automated monthly block generator with enhanced UI
- Users Affected: ~50 Account Managers
- Expected Impact: 70% time reduction

**Technical Approach:**
- Priority 1: Monthly block generator algorithm
- Priority 2: Enhanced block display with metrics
- Priority 3: Improved header and progress bar
- Priority 4: Segmented chart visualization

**Current Progress:**
✅ Planning phase complete
✅ Stage 1: Environment setup done
  - Collabiteration created
  - Ports: Frontend 3030, Backend 3031, DB 5472
  - Iteration plan documented
🔄 Stage 2: Verification needed
  - Need to confirm services running
  - Test basic functionality
⏳ Stage 3: Ready to launch 4 parallel agents

**Next Steps:**
1. Verify the iteration environment is running
2. Confirm with you before proceeding
3. Launch parallel development agents

Shall we start by verifying the environment is running correctly?
```

### Step 7: Resume Work

Based on the current state, continue with appropriate next steps:

**If in Stage 1**: Complete environment setup
**If in Stage 2**: Run verification checks
**If in Stage 3**: Resume development with appropriate agent
**If testing**: Continue test execution
**If ready for PR**: Help package and submit

### Step 8: Maintain Continuity

Throughout resumed work:
- Reference previous decisions from iteration plan
- Update change logs as modifications are made
- Follow established patterns and approaches
- Keep iteration assistant updated
- Maintain consistent code style from existing work

## Workflow Decision Tree

```
/resume-iteration
    |
    ├── No iterations found
    |   └── "No active iterations found. Would you like to start a new one with /iterate?"
    |
    ├── Single iteration found
    |   └── "Found one iteration: [name]. Would you like to resume it? (yes/no)"
    |
    └── Multiple iterations found
        ├── Show numbered list
        ├── User selects by number or name
        ├── Load context
        └── Resume from current state
```

## Special Cases

### Iteration in Unknown State
If state is unclear:
```
The iteration appears to be in an inconsistent state. Let me check:
- Git status: [show any uncommitted changes]
- Last known stage: [from plan or logs]
- Any error logs: [check for issues]

Would you like to:
1. Continue from last known good state
2. Reset to a specific stage
3. Review the changes before deciding
```

### Multiple People Working
If iteration shows recent changes by others:
```
This iteration was last updated by another team member [X time] ago.
Recent changes include: [summary]

Would you like to:
1. Continue from their work
2. Create a new branch for your changes
3. Review their changes first
```

### Blocked or Failed State
If iteration has logged blockers:
```
This iteration has documented blockers:
- [List any noted issues]

Would you like to:
1. Address the blockers
2. Work around them
3. Get more context
```

## Success Indicators

The resume is successful when:
- ✅ All context is loaded and understood
- ✅ Current state is accurately determined
- ✅ User confirms the summary is correct
- ✅ Work continues smoothly from last state
- ✅ No context or progress is lost