# /resume-iteration Command Documentation

## Overview
The `/resume-iteration` command allows users to resume work on an existing collabiteration by loading its context, history, and current state.

## Usage
Simply type `/resume-iteration` in your conversation with Claude Code from any directory.

## What It Does
1. Checks for a local `collabiterations/` directory relative to your current working directory
2. Lists all existing iterations found in that directory
3. Prompts user to select which iteration to resume
4. Loads the selected iteration's:
   - Iteration plan
   - Change documentation/history
   - Current state and progress
5. Familiarizes itself with the context before continuing work
6. Resumes from the last documented state

## Process Flow

### Step 1: Check for Iterations
The command first checks for iterations in these locations (in order):
1. `./collabiterations/` - Local collabiterations directory in current project
2. `../collabiterations/` - Parent directory (if you're inside a project)
3. `./.git-collabiterations/` - Git worktree iterations (legacy)

```
Checking for iterations relative to current directory...

Found collabiterations directory at: ./collabiterations/

Available iterations:
1. custom-pacing-enhancements - Monthly block generator for Account Managers
2. user-auth-improvements - OAuth integration updates
3. dashboard-redesign - New analytics dashboard

Which iteration would you like to resume? (enter number or name):
```

### Step 2: Load Iteration Context
Once selected, Claude will:
- Read the iteration's planning documents (ITERATION_PLAN.md, etc.)
- Review any change logs or documentation
- Check if there's an active git worktree for this iteration
- Understand completed vs pending work
- Load any TODO lists or progress tracking

### Step 3: Summarize Current State
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

### Step 4: Continue Work
- Pick up from the last documented state
- Follow the iteration plan's next steps
- Maintain continuity with previous work
- Update documentation as work progresses

## Example Usage

```
User: /resume-iteration

Claude: I'll check for available iterations to resume...

Looking for collabiterations directory...
✅ Found at: ./collabiterations/

Available iterations:
1. custom-pacing - Custom Pacing Enhancements (has CUSTOM_PACING_ITERATION_PLAN.md)
2. line-item-types - Line Item Types Implementation (full project structure)
3. tailwinds-refactor - Tailwinds Refactor (full project structure)

Which iteration would you like to resume? (enter number or name):

User: custom-pacing

Claude: Loading iteration context for custom-pacing...

✅ Found iteration plan at: ./collabiterations/custom-pacing/CUSTOM_PACING_ITERATION_PLAN.md
📖 Reading iteration documentation...

[Loads and summarizes the iteration plan and current state]
```

## Important Notes

### Directory Structure
The command expects iterations to be organized as:
```
your-project/
├── collabiterations/
│   ├── iteration-name-1/
│   │   ├── ITERATION_PLAN.md
│   │   └── ... (other docs or full project copy)
│   ├── iteration-name-2/
│   │   └── ...
│   └── REGISTRY.md (optional)
└── ... (your project files)
```

### Portability
- This command works relative to where you run it
- It doesn't depend on absolute paths
- Anyone who clones your repo with a `collabiterations/` directory can use it
- The command adapts to find iterations whether you're at project root or in a subdirectory

### What if no iterations are found?
If no collabiterations directory is found, the command will:
1. Inform you that no iterations were found
2. Suggest using `/iterate` to create a new iteration
3. Explain the expected directory structure

## Benefits
- **Seamless Continuity**: Pick up exactly where you left off
- **Context Preservation**: All previous decisions and progress maintained
- **Multiple Iterations**: Work on several features without losing context
- **Team Collaboration**: Anyone can resume another's iteration
- **Portable**: Works on any machine with the proper directory structure

## Implementation Details

### Search Strategy
```javascript
// Pseudo-code for finding iterations
const searchPaths = [
  './collabiterations',
  '../collabiterations',
  './.git-collabiterations'
];

for (const path of searchPaths) {
  if (directoryExists(path)) {
    return listIterationsIn(path);
  }
}
return "No iterations found";
```

### Context Loading Priority
1. ITERATION_PLAN.md or similar planning documents
2. README.md or documentation in iteration directory
3. Git history if iteration has a worktree
4. TODO lists or progress tracking files
5. Any other markdown files in the iteration directory

### State Detection
- Presence of planning documents
- Git worktree status (if applicable)  
- Documented stages/phases in iteration plan
- TODO completion status
- Most recent file modifications

## Troubleshooting

**"No iterations found"**
- Make sure you have a `collabiterations/` directory
- Check that you're in the right project directory
- Iterations should be subdirectories within `collabiterations/`

**"Can't load iteration context"**
- Ensure the iteration has documentation (ITERATION_PLAN.md or similar)
- Check file permissions
- Verify the iteration directory isn't empty

**"Command not recognized"**
- Make sure you're using Claude Code with the git-collabiteration-manager
- The command is `/resume-iteration` (with forward slash)
- This is a conversation command, not a shell command