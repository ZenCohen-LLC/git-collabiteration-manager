# Implementation Plan - Git Collabiteration Simplification

## Overview

This plan details how to implement the simplified git-collabiteration system with Claude Flow integration to solve the two main goals:
1. Simplify to 4 core workflows with single implementations
2. Integrate Claude Flow to prevent coordination failures

## Phase 0: Backup & Cleanup (Day 1)

### Move old files to v0 directory
- [ ] Create `v0/` subdirectory for archiving old implementations
- [ ] Move all duplicate/variant files to v0:
  - All variant STARTUP.md files
  - All duplicate docker-compose files  
  - All competing workflow documents
  - All alternative health check scripts
- [ ] Keep v0 intact until new system proves stable through 3 full iterations
- [ ] Document what was moved and why in v0/ARCHIVE_NOTES.md

## Phase 1: Core Simplification (Week 1)

### Day 1-2: Consolidate Templates
- [ ] Create single `docker-compose.template.yml` replacing all variants
- [ ] Create single `.env.template` with all required variables
- [ ] Create single `health-check.sh` script
- [ ] Create single `start-iteration.sh` script
- [ ] Remove all duplicate/variant files

### Day 3-4: Implement Unified Commands
- [ ] Rewrite `gcm create` command:
  - Always pull latest main
  - Always set TEST_MODE=true
  - Always create test user and campaigns
  - Always run health check before completing
- [ ] Rewrite `gcm resume` command:
  - Always check health first
  - Only start missing services
  - Never restart running services
- [ ] Rewrite `gcm share` command:
  - Always exclude iteration files
  - Always restore production auth
  - Always rebase on main

### Day 5: Update Documentation
- [ ] Replace all existing docs with simplified versions
- [ ] Update main README.md
- [ ] Update CLAUDE.md in both repos
- [ ] Create single troubleshooting guide

## Phase 2: Claude Flow Integration (Week 2)

### Day 1-2: Swarm Initialization
```typescript
// In gcm create command
async function initializeClaudeFlow(iteration: IterationContext) {
  // Auto-initialize swarm
  await execSync(`npx claude-flow@alpha swarm init \
    --topology hierarchical \
    --max-agents 5 \
    --context ${JSON.stringify(iteration)}`);
    
  // Store iteration plan in memory
  await execSync(`npx claude-flow@alpha memory store \
    "iteration/${iteration.name}/plan" \
    '${JSON.stringify(iteration.plan)}'`);
}
```

### Day 3-4: Agent Coordination Rules
```typescript
// coordinator-rules.ts
export const coordinatorRules = {
  beforeFileCreate: async (filePath: string, imports: string[]) => {
    // Check for circular dependencies
    const deps = await getMemory('dependencies');
    if (wouldCreateCircle(deps, filePath, imports)) {
      throw new CircularDependencyError(filePath, imports);
    }
  },
  
  afterComponentCreate: async (component: ComponentInfo) => {
    // Register in memory
    await storeMemory(`components/${component.name}`, {
      imports: component.imports,
      exports: component.exports,
      tests: component.testFiles
    });
  },
  
  beforeComplete: async (component: string) => {
    // Verify all requirements
    const checks = await runCompletionChecks(component);
    if (!checks.allPassed) {
      throw new IncompleteComponentError(component, checks.failed);
    }
  }
};
```

### Day 5: Test Integration
- [ ] Create test iterations with known circular dependency risks
- [ ] Verify Claude Flow prevents issues
- [ ] Test parallel agent coordination
- [ ] Ensure no regression in basic workflows

## Phase 3: Migration & Enforcement (Week 3)

### Day 1-2: Migration Scripts
```bash
#!/bin/bash
# migrate-iterations.sh

# Find all existing iterations
for iteration in ./collabiterations/*; do
  if [ -d "$iteration" ]; then
    echo "Migrating $iteration..."
    
    # Standardize configuration
    cp templates/docker-compose.template.yml "$iteration/docker-compose.yml"
    cp templates/.env.template "$iteration/.env"
    cp templates/health-check.sh "$iteration/scripts/"
    
    # Update ports based on iteration name
    update_ports "$iteration"
    
    # Ensure test user exists
    add_test_user "$iteration"
  fi
done
```

### Day 3-4: Validation System
```typescript
// validation.ts
export function validateIteration(path: string): ValidationResult {
  const checks = {
    hasStandardDockerCompose: checkFile(`${path}/docker-compose.yml`),
    hasHealthCheck: checkFile(`${path}/scripts/health-check.sh`),
    hasTestMode: checkEnvVar(`${path}/.env`, 'TEST_MODE', 'true'),
    hasTestUser: checkDatabase(path, 'test@mail.com'),
    hasClaudeFlow: checkFile(`${path}/.claude-flow/config.json`)
  };
  
  return {
    valid: Object.values(checks).every(c => c),
    issues: Object.entries(checks)
      .filter(([_, valid]) => !valid)
      .map(([check]) => check)
  };
}
```

### Day 5: Update CI/CD
- [ ] Add pre-commit hooks to validate iterations
- [ ] Add GitHub Actions to check PR compliance
- [ ] Create automated tests for all workflows

## Phase 4: Training & Rollout (Week 4)

### Day 1-2: Update Claude Training
```markdown
## CLAUDE.md Updates

### Collabiteration System Rules
1. ONLY use the 4 documented commands
2. NEVER create alternative approaches
3. ALWAYS verify Figma before implementing
4. ALWAYS use Claude Flow coordination
5. NEVER drop database or restart running services

### Required Behaviors
- When user says /iterate: Follow UNIFIED_WORKFLOWS.md exactly
- When implementing: Check Figma, write tests, coordinate
- When resuming: Health check first, preserve state
- When sharing: Use gcm share, never manual git
```

### Day 3-4: Team Training
- [ ] Create video walkthrough of new system
- [ ] Document common scenarios and solutions
- [ ] Run training session with team
- [ ] Gather feedback and refine

### Day 5: Monitor & Adjust
- [ ] Track usage of new commands
- [ ] Monitor for old patterns creeping back
- [ ] Address any issues quickly
- [ ] Celebrate simplified workflow!

## Phase 5: Validation (Week 5)

### End-to-End Testing
Run 3 complete iterations without issues:

#### Iteration 1: Simple Feature
- [ ] Create iteration with `/iterate`
- [ ] Implement basic UI component
- [ ] Write Playwright tests
- [ ] Resume after stopping
- [ ] Share via PR

#### Iteration 2: Complex Feature with Dependencies
- [ ] Create iteration with multiple components
- [ ] Test Claude Flow prevents circular dependencies
- [ ] Verify parallel agent coordination
- [ ] Test health check and resume
- [ ] Share clean PR

#### Iteration 3: Full Stack Feature
- [ ] Create iteration with frontend, backend, database changes
- [ ] Test all workflows thoroughly
- [ ] Verify auth bypass throughout
- [ ] Ensure clean PR without iteration artifacts
- [ ] Confirm merge readiness

### Success Criteria
- All 3 iterations complete without manual intervention
- No auth/login issues
- No circular dependencies
- All PRs merge cleanly
- Team comfortable with new system

### Rollback Decision
- If all 3 iterations succeed → Delete v0 directory
- If issues persist → Keep v0 and iterate on fixes

## Success Metrics

### Complexity Reduction
- Before: 10+ startup variations → After: 1 standard process
- Before: 5+ auth methods → After: 1 method (TEST_MODE=true)
- Before: Multiple health checks → After: 1 health check script

### Reliability Metrics
- 100% iterations start with working auth
- 0% database rollback login issues
- 100% Figma designs reviewed before coding
- 0% circular dependencies in components

### Developer Experience
- Time to start iteration: <5 minutes
- Time to resume iteration: <1 minute
- PR creation success rate: 100%
- Clean PR merge rate: 100%

## Rollback Plan

If issues arise:
1. Keep old system available in v0 directory
2. Document any blocking issues
3. Fix forward rather than reverting
4. Communicate clearly with team

## Key Files to Create/Update

### New Files
- `/templates/docker-compose.template.yml`
- `/templates/.env.template`  
- `/templates/health-check.sh`
- `/templates/start-iteration.sh`
- `/src/workflows/create.ts`
- `/src/workflows/resume.ts`
- `/src/workflows/share.ts`
- `/src/claude-flow/coordinator.ts`

### Updated Files
- `/README.md` → Simplified version
- `/CLAUDE.md` → New behavioral rules
- `/package.json` → Add claude-flow dependency
- `/bin/gcm` → New command structure

### Archived Files (moved to v0/)
- All variant STARTUP.md files
- All duplicate docker-compose files
- All competing health check scripts
- All alternative workflows
- All redundant documentation

## Timeline Summary

- **Week 0**: Archive old files to v0
- **Week 1**: Core simplification and consolidation
- **Week 2**: Claude Flow integration and testing
- **Week 3**: Migration and enforcement
- **Week 4**: Training and rollout
- **Week 5**: Validation with 3 full iterations

Total time: 5 weeks to fully simplified and validated system