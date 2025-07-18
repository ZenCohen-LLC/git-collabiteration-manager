# Agent 1: CLI Enhancement - Lifecycle & Interactive Commands

## Overview
Transform the existing CLI to support lifecycle stages and add interactive commands for better user experience.

## Prerequisites
- Node.js and TypeScript knowledge
- Familiarity with Commander.js and Inquirer.js
- Understanding of git worktrees

## Task 1.1: Add Lifecycle Stage Types
**Branch**: `feature/lifecycle-stages`
**Priority**: High
**Dependencies**: None

### Deliverables
1. Update `src/types/project-context.ts`:
   - Add `LifecycleStage` enum
   - Add `lifecycleStage` field to `IterationInstance`
   - Update related types

2. Create lifecycle stage definitions:
```typescript
enum LifecycleStage {
  SolutionIdeation = 'solution-ideation',
  DesignRefinement = 'design-refinement', 
  DeployedPrototype = 'deployed-prototype',
  TestIntegration = 'test-integration',
  ReadyToDeploy = 'ready-to-deploy'
}
```

### Tests Required
- Unit tests for type validation
- Ensure backward compatibility with existing iterations

### Acceptance Criteria
- [ ] Types compile without errors
- [ ] Existing code continues to work
- [ ] Stage field is optional for backward compatibility

---

## Task 1.2: Implement Interactive `gcm iterate` Command
**Branch**: `feature/interactive-iterate`
**Priority**: High
**Dependencies**: Task 1.1

### Deliverables
1. Create `src/commands/iterate.ts`
2. Update `bin/git-collabiteration.js` to add new command
3. Replace existing `create` command with `iterate`

### Implementation Details
```javascript
// Interactive prompts using Inquirer.js
const prompts = [
  {
    type: 'input',
    name: 'name',
    message: 'What should we call this iteration?',
    validate: validateIterationName
  },
  {
    type: 'input',
    name: 'targetUser',
    message: 'Who is the target user for this iteration?'
  },
  {
    type: 'input', 
    name: 'problem',
    message: 'What problem does this iteration solve?'
  },
  {
    type: 'list',
    name: 'stage',
    message: 'What lifecycle stage is this?',
    choices: lifecycleStageChoices
  }
];
```

### Tests Required
- Integration tests for command flow
- Test each prompt validation
- Test iteration plan generation
- Test error handling

### Acceptance Criteria
- [ ] Command guides user through all prompts
- [ ] Generates proper iteration plan
- [ ] Creates iteration with metadata
- [ ] Maintains backward compatibility

---

## Task 1.3: Implement `gcm resume-iteration` Command  
**Branch**: `feature/resume-iteration`
**Priority**: High
**Dependencies**: None

### Deliverables
1. Create `src/commands/resume-iteration.ts`
2. Update `bin/git-collabiteration.js`
3. Implement iteration scanning logic

### Implementation Details
```javascript
// Scan for iterations
async function scanForIterations(collabiterationsPath) {
  // Read directory
  // Find iteration configs
  // Extract metadata
  // Return sorted list
}

// Interactive selection
const { selectedIteration } = await inquirer.prompt([
  {
    type: 'list',
    name: 'selectedIteration',
    message: 'Which iteration would you like to resume?',
    choices: iterationChoices,
    pageSize: 10
  }
]);
```

### Tests Required
- Test iteration discovery
- Test with no iterations
- Test with multiple iterations
- Test selection flow

### Acceptance Criteria
- [ ] Lists all available iterations
- [ ] Shows iteration metadata in list
- [ ] Arrow key navigation works
- [ ] Displays iteration plan when selected
- [ ] Shows quick commands to resume work

---

## Common Requirements

### Code Style
- Follow existing TypeScript conventions
- Use async/await for asynchronous operations
- Add comprehensive JSDoc comments
- Keep functions small and focused

### Error Handling
- Use try/catch blocks
- Provide helpful error messages
- Exit gracefully on errors
- Log errors to debug output

### Testing
- Minimum 80% code coverage
- Test happy path and error cases
- Mock external dependencies
- Use Jest for unit tests

### Documentation
- Update CLI help text
- Add examples to README
- Document new commands
- Include troubleshooting tips

## Commit Message Format
Follow conventional commits:
```
feat: add lifecycle stage support to CLI

- Add LifecycleStage enum
- Update IterationInstance type
- Maintain backward compatibility

Closes #123
```

## Definition of Done
- [ ] All code written and tested
- [ ] Documentation updated
- [ ] PR created with description
- [ ] Code review passed
- [ ] CI/CD checks pass
- [ ] No merge conflicts