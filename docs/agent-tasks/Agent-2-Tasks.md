# Agent 2: CLI Enhancement - Deployment Commands

## Overview
Add new commands for sharing prototypes and creating production PRs with lifecycle stage awareness.

## Prerequisites
- Understanding of git workflows
- Familiarity with GitHub CLI (gh)
- Knowledge of the existing worktree manager

## Task 1.4: Add `gcm share` Command
**Branch**: `feature/share-command`
**Priority**: High
**Dependencies**: Task 1.1 (lifecycle stages)

### Deliverables
1. Update `bin/git-collabiteration.js` to add `share` command
2. Modify `src/core/worktree-manager.ts`:
   - Add stage validation to `shareIteration`
   - Include Collabiteration Assistant for early stages
   - Deploy to staging/dev environment

### Implementation Details
```typescript
async shareIteration(name: string, projectPath: string, options: ShareOptions) {
  const iteration = this.loadIterationConfig(name, projectPath);
  
  // Check lifecycle stage
  if (isEarlyStage(iteration.lifecycleStage)) {
    // Include assistant files
    await this.includeCollabiterationAssistant(iteration);
    
    // Add deployment note
    console.log(chalk.yellow(
      'DEVS: THIS IS WHERE THE TOOL\'S DEPLOYMENT FOR PROTOTYPING ' +
      'NEEDS TO BE CONFIGURED FOR DEV OR STAGING SERVER BEHIND FEATURE FLAG'
    ));
    
    // Deploy to staging
    await this.deployToStaging(iteration);
  }
  
  // Create PR with stage metadata
  const prBody = this.generateStagedPRBody(iteration);
  // ... rest of PR creation
}
```

### Tests Required
- Test stage validation logic
- Test assistant inclusion for early stages
- Test deployment configuration
- Test PR body generation

### Acceptance Criteria
- [ ] Command validates lifecycle stage
- [ ] Early stages include assistant
- [ ] Shows deployment configuration note
- [ ] PR includes stage metadata
- [ ] Works with existing share functionality

---

## Task 1.5: Add `gcm push-pr` Command
**Branch**: `feature/push-pr-command`  
**Priority**: High
**Dependencies**: Task 1.1 (lifecycle stages)

### Deliverables
1. Update `bin/git-collabiteration.js` to add `push-pr` command
2. Create clean code validation in `src/core/worktree-manager.ts`
3. Implement production PR creation

### Implementation Details
```typescript
async pushForProduction(name: string, projectPath: string, options: PushOptions) {
  const iteration = this.loadIterationConfig(name, projectPath);
  
  // Validate ready for production
  if (iteration.lifecycleStage !== LifecycleStage.ReadyToDeploy) {
    throw new Error('Iteration must be in ReadyToDeploy stage');
  }
  
  // Clean validation
  await this.validateCleanCode(iteration);
  
  // Remove development files
  await this.removeDevFiles(iteration);
  
  // Ensure tests pass
  await this.runProductionTests(iteration);
  
  // Create production PR
  const prBody = this.generateProductionPRBody(iteration);
  // ... create PR without assistant
}
```

### Clean Code Validation
```typescript
async validateCleanCode(iteration: IterationInstance) {
  const checks = [
    { name: 'No console.logs', fn: this.checkNoConsoleLogs },
    { name: 'No TODO comments', fn: this.checkNoTodos },
    { name: 'No development dependencies', fn: this.checkNoDevelopmentDeps },
    { name: 'No assistant references', fn: this.checkNoAssistantRefs },
    { name: 'All tests pass', fn: this.runTests }
  ];
  
  for (const check of checks) {
    await check.fn(iteration);
  }
}
```

### Tests Required
- Test stage validation
- Test clean code checks
- Test file removal logic
- Test production PR creation
- Test error scenarios

### Acceptance Criteria
- [ ] Only works for ReadyToDeploy stage
- [ ] Validates code is production-ready
- [ ] Removes all development files
- [ ] Runs and passes all tests
- [ ] Creates clean PR

---

## Common Implementation Notes

### Stage Helpers
Create shared utilities in `src/utils/lifecycle-stages.ts`:
```typescript
export function isEarlyStage(stage: LifecycleStage): boolean {
  return [
    LifecycleStage.SolutionIdeation,
    LifecycleStage.DesignRefinement,
    LifecycleStage.DeployedPrototype
  ].includes(stage);
}

export function requiresTests(stage: LifecycleStage): boolean {
  return [
    LifecycleStage.TestIntegration,
    LifecycleStage.ReadyToDeploy
  ].includes(stage);
}
```

### File Patterns
Development files to remove for production:
- `**/collabiteration-assistant/**`
- `**/*.test.ts`
- `**/*.spec.ts`
- `**/tests/**`
- `.env.local`
- `LOCAL_SECRETS.md`

### Error Messages
Provide clear, actionable error messages:
```typescript
if (!testsPass) {
  throw new Error(
    'Tests must pass before creating production PR.\n' +
    'Run: gcm test ' + iteration.name + '\n' +
    'Fix any failing tests and try again.'
  );
}
```

## Testing Strategy

### Unit Tests
- Mock git operations
- Mock file system operations
- Test validation logic independently
- Test error handling

### Integration Tests
- Create test iterations
- Run commands end-to-end
- Verify file changes
- Check git operations

## Documentation Updates

1. Update README with new commands
2. Add examples for each command
3. Document stage requirements
4. Include troubleshooting guide

## Definition of Done
- [ ] Commands implemented and tested
- [ ] Stage validation working
- [ ] Clean code checks implemented
- [ ] Documentation updated
- [ ] PR approved and merged
- [ ] No regressions in existing functionality