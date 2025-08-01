# 🎯 START HERE - Funnel of Focus

## You are about to work on a git-collabiteration iteration

### STOP! Read this entire file before doing ANYTHING else.

## The Golden Rule
**Never start work without understanding the current state.**

## Your First Actions (IN THIS ORDER)

### 1. Identify the Iteration
Look at your current directory or the user's request to identify which iteration you're working on.

### 2. Read Current State Documentation
```bash
# These files contain CRITICAL information about work in progress
cat collabiterations/[iteration-name]/TODO_STATE.md          # Current task status
cat collabiterations/[iteration-name]/ITERATION_PLAN.md     # Overall plan
cat collabiterations/[iteration-name]/CURRENT_PHASE.md      # Development phase
```

### 3. Check for Power Failure Recovery
If `TODO_STATE.md` exists, you're resuming work that was interrupted:
- The "Last Action" tells you what was just completed
- The "Next Step" tells you EXACTLY what to do next
- The "Context" provides additional information needed

### 4. Understand the Phase System
Work happens in 4 phases that CANNOT be skipped:
```
PLAN → IMPLEMENT → TEST → REVIEW
```

Each phase has specific requirements that MUST be met before moving forward.

### 5. Never Modify the Base media-tool Directory
- `/Users/christophergarrison/freshbravo/media-tool` is READ-ONLY
- ALL work happens in `collabiterations/[iteration-name]/`
- Changes go back via PR, never direct edits

## Common Scenarios

### Scenario 1: User says "/resume-iteration"
1. List available iterations
2. Let user select
3. Read TODO_STATE.md from selected iteration
4. Continue from documented next step

### Scenario 2: User says "/iterate" 
1. Use `gcm create` to start new iteration
2. System will set up everything automatically
3. Begin with PLAN phase

### Scenario 3: Resuming mid-implementation
1. TODO_STATE.md will show exact component and step
2. Check git status for uncommitted changes
3. Continue from documented next step

## Critical Files to Know About

### In each iteration directory:
- `TODO_STATE.md` - Granular task tracking (updated after EVERY action)
- `ITERATION_PLAN.md` - High-level plan and requirements
- `CURRENT_PHASE.md` - Which development phase is active
- `STARTUP.md` - How to start the development environment
- `.claude-flow/memory/` - Claude Flow coordination data

### Phase-specific files:
- `PLAN_COMPLETE.md` - Requirements and Figma analysis
- `IMPLEMENTATION_LOG.md` - What's been built
- `TEST_COVERAGE.md` - Testing status
- `REVIEW_CHECKLIST.md` - Final validation

## The TODO_STATE.md Format

This file is your lifeline for resuming work:

```markdown
## Current Status
- Phase: IMPLEMENT
- Active Task: Creating Button component  
- Last Action: Created Button.tsx file with basic structure
- Next Step: Add props interface based on Figma specs
- Context: Figma shows 3 variants: primary, secondary, disabled

## Component Status
- [ ] Button - In Progress (file created, needs props)
- [ ] Form - Not Started
- [ ] Modal - Not Started

## Detailed Tasks
### Button Component
- [x] Create file structure
- [x] Basic component scaffold  
- [ ] Add TypeScript props interface
- [ ] Implement Figma design tokens
...
```

## Your Workflow

1. **ALWAYS** read state documentation first
2. **NEVER** skip the funnel of focus
3. **UPDATE** TODO_STATE.md after every action
4. **VERIFY** current phase requirements
5. **COMMUNICATE** blockers immediately

## Remember

**If the power went out and came back on:**
- TODO_STATE.md has your exact position
- Follow "Next Step" exactly
- Don't repeat "Last Action"
- Continue from where you left off

**Now go read the iteration's TODO_STATE.md file!**