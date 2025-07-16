# /resume-iteration Command Documentation

## Overview
The `/resume-iteration` command allows users to resume work on an existing collabiteration by loading its context, history, and current state.

## Usage
Simply type `/resume-iteration` in your conversation with Claude Code from any directory.

## What It Does
1. Reads the collabiteration manager documentation to understand the system
2. Lists all existing iterations from the registry
3. Prompts user to select which iteration to resume
4. Loads the selected iteration's:
   - Iteration plan
   - Change documentation/history
   - Current state and progress
5. Familiarizes itself with the context before continuing work
6. Resumes from the last documented state

## Process Flow

### Step 1: Load System Context
- Read collabiteration manager documentation
- Understand git worktree structure
- Review iteration workflow process

### Step 2: Show Available Iterations
```
Available iterations to resume:
1. custom-pacing-enhancements - Monthly block generator for Account Managers
2. user-auth-improvements - OAuth integration updates
3. dashboard-redesign - New analytics dashboard

Which iteration would you like to resume? (enter number or name):
```

### Step 3: Load Iteration Context
Once selected, Claude will:
- Read the ITERATION_PLAN.md file
- Review any change logs or documentation
- Check current git branch and worktree state
- Understand completed vs pending work
- Load iteration assistant state if available

### Step 4: Summarize Current State
```
Resuming: custom-pacing-enhancements

📋 Summary:
- Problem: Account Managers spending 15-30 minutes on manual schedule creation
- Solution: Automated monthly block generator
- Current Stage: Stage 2 - Environment verification
- Completed: Planning phase, Stage 1 setup
- Next Steps: Verify iteration is running, then launch parallel agents

Ready to continue from Stage 2?
```

### Step 5: Continue Work
- Pick up from the last documented state
- Follow the iteration plan's next steps
- Maintain continuity with previous work
- Update documentation as work progresses

## Example Usage

```
User: /resume-iteration

Claude: I'll help you resume an existing iteration. Let me check what's available...

Available iterations to resume:
1. custom-pacing-enhancements - Monthly block generator (Stage 2: Verification)
2. margin-calculator-fix - Calculation accuracy improvements (Stage 3: Testing)
3. report-export-feature - PDF export functionality (Stage 1: Setup)

Which iteration would you like to resume? (enter number or name):

User: 1

Claude: Loading iteration context for custom-pacing-enhancements...

✅ Read iteration plan
✅ Reviewed change history
✅ Checked current state

📋 Iteration Summary:
- Users: Account Managers
- Problem: Manual pacing schedule creation taking 15-30 minutes
- Solution: Automated monthly block generator with enhanced UI
- 
- Progress:
  ✅ Stage 1: Environment setup complete
  🔄 Stage 2: Ready for verification
  ⏳ Stage 3: Parallel development pending
  
- Last Activity: Created collabiteration, set up ports 3030-3031, database on 5472

Ready to verify the iteration is running correctly. Shall we proceed with Stage 2?
```

## Benefits
- **Seamless Continuity**: Pick up exactly where you left off
- **Context Preservation**: All previous decisions and progress maintained
- **Multiple Iterations**: Work on several features without losing context
- **Team Collaboration**: Anyone can resume another's iteration
- **Reduced Cognitive Load**: No need to remember iteration details

## Implementation Details

### Registry Locations
- Check `.git-collabiterations/` for active worktrees
- Read `/collabiterations/` for iteration plans
- Review git branches with `iteration/` prefix
- Check iteration assistant logs if available

### Context Loading Priority
1. ITERATION_PLAN.md (primary source)
2. Git commit history on iteration branch
3. Change logs in iteration directory
4. Iteration assistant state
5. TODO lists or progress tracking

### State Detection
- Git branch status and uncommitted changes
- Which stage/phase from iteration plan
- Completed vs pending tasks
- Test results if available
- Any blockers or issues noted

## Notes
- This is a Claude Code conversation command, not a shell command
- Works best when iterations follow standard documentation practices
- Requires access to iteration directories and git repository
- Can resume iterations started by other team members