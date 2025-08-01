# Claude Flow Integration Plan - Goal 2

## 🎯 Funnel of Focus - START HERE

When picking up work on ANY iteration, follow this exact sequence:

### 1. Read the Iteration Status First
```bash
# ALWAYS start here - this tells you everything about current state
cat collabiterations/[iteration-name]/TODO_STATE.md
```

### 2. Check for Active Work Documentation
```bash
# These files contain critical context
cat collabiterations/[iteration-name]/ITERATION_PLAN.md
cat collabiterations/[iteration-name]/CURRENT_PHASE.md
cat collabiterations/[iteration-name]/.claude-flow/memory/current-task.json
```

### 3. Understand the Current Phase
- **PLAN**: Read the Figma analysis and requirements
- **IMPLEMENT**: Check TODO_STATE.md for exact next steps
- **TEST**: Review test coverage status
- **REVIEW**: Check completion criteria status

### 4. DO NOT start coding until you've:
- ✅ Read ALL status documentation
- ✅ Understood the current phase and task
- ✅ Identified the exact next step from TODO_STATE.md
- ✅ Checked for any blockers or dependencies

## Objective
Integrate Claude Flow to coordinate development phases and prevent:
1. Circular dependencies between components
2. Component conflicts from parallel development
3. Incomplete implementations (no Figma review, no tests)

## Current State
✅ Basic Claude Flow integration in create workflow
✅ Agent templates defined (component, test, API, coordinator)
✅ Circular dependency detection logic
✅ Memory-based coordination protocols

## Implementation Plan

### Phase 1: Development Phase Architecture

#### 1.1 Define 4 Core Development Phases
```
PLAN → IMPLEMENT → TEST → REVIEW
```

Each phase has:
- Entry criteria (what must be true to start)
- Exit criteria (what must be complete to finish)
- Handoff protocol (how to pass to next phase)
- Rollback protocol (how to go back if needed)

#### 1.2 Phase Templates
Create structured templates for each phase:

**PLAN Phase:**
- Figma analysis and requirements extraction
- Component dependency mapping
- API endpoint identification
- Test scenario planning

**IMPLEMENT Phase:**
- Component creation with Figma verification
- API integration with type safety
- State management setup
- Error handling implementation
- **CRITICAL: Maintain granular todo list after EVERY action**
  - Update todo status immediately after each file creation
  - Record exact line numbers and next steps
  - Include context for resumption ("was implementing X, next need Y")

**TEST Phase:**
- Playwright test creation
- Visual regression against Figma
- API integration testing
- Performance testing
- **CRITICAL: Track test progress in todo list**
  - Mark which components have tests written
  - Note which test scenarios remain
  - Record any failing tests that need fixing

**REVIEW Phase:**
- Code quality checks
- Completion criteria validation
- Security review
- PR preparation

### Phase 2: Automated Handoffs

#### 2.1 Phase Transition Rules
```typescript
interface PhaseTransition {
  from: Phase;
  to: Phase;
  criteria: CompletionCriteria[];
  artifacts: RequiredArtifacts[];
  validation: ValidationFunction;
}
```

#### 2.2 Completion Criteria Enforcement
- No phase can be marked complete without meeting ALL criteria
- Automated validation before phase transitions
- Clear error messages when criteria not met

#### 2.3 Memory-Based Handoffs
```typescript
// Example: PLAN → IMPLEMENT handoff
await memory.store('phases/plan/complete', {
  components: ['Button', 'Form', 'Modal'],
  dependencies: dependencyGraph,
  figmaSpecs: extractedSpecs,
  apiEndpoints: identifiedEndpoints
});
```

### Phase 3: Real-Time Coordination

#### 3.1 Live Dependency Tracking
- Monitor file changes in real-time
- Update dependency graph automatically
- Alert on potential circular dependencies BEFORE they happen

#### 3.2 Component Registry
```typescript
interface ComponentRegistry {
  [componentName: string]: {
    status: 'planned' | 'in-progress' | 'testing' | 'complete';
    owner: string; // Which agent/developer owns this
    dependencies: string[];
    figmaVerified: boolean;
    testsWritten: boolean;
    lastUpdated: Date;
  }
}
```

#### 3.3 Conflict Prevention
- Lock components during modification
- Queue system for shared resources
- Automatic conflict resolution suggestions

### Phase 4: Figma Integration

#### 4.1 Design Verification Requirements
- Extract design tokens from Figma
- Generate visual test baselines
- Enforce pixel-perfect implementation

#### 4.2 Figma Checklist
```typescript
interface FigmaChecklist {
  spacing: boolean;
  colors: boolean;
  typography: boolean;
  interactions: boolean;
  responsiveness: boolean;
  accessibility: boolean;
}
```

### Phase 5: Persistent Todo Tracking

#### 5.1 Todo List Requirements
Every iteration maintains a `TODO_STATE.md` file that includes:
```markdown
## Current Status
- Phase: IMPLEMENT
- Active Task: Creating Button component
- Last Action: Created Button.tsx file with basic structure
- Next Step: Add props interface based on Figma specs

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
- [ ] Add interaction handlers
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Visual regression test setup
```

#### 5.2 Todo Update Protocol
```typescript
// After EVERY file operation
await updateTodoState({
  lastAction: "Created Button.tsx with basic structure",
  nextStep: "Add props interface from Figma",
  context: "Figma shows 3 variants: primary, secondary, disabled"
});
```

#### 5.3 Power Failure Recovery
When resuming after any interruption:
1. Read TODO_STATE.md first
2. Check git status for uncommitted changes
3. Verify last action was completed
4. Continue from documented next step

### Phase 6: Test Coverage Enforcement

#### 6.1 Mandatory Test Types
- Component rendering tests
- Interaction tests (click, type, etc.)
- Visual regression tests
- Accessibility tests
- API integration tests

#### 6.2 Coverage Requirements
- No component marked complete without tests
- Minimum 80% code coverage
- All Figma states must have tests

### Implementation Steps

1. **Create Phase Manager** (`src/claude-flow/phase-manager.ts`)
   - Define phase transitions
   - Implement validation logic
   - Create handoff protocols

2. **Enhance Agent Templates** (`src/claude-flow/agent-templates.ts`)
   - Add phase-specific instructions
   - Include validation checkpoints
   - Define communication protocols

3. **Build Component Registry** (`src/claude-flow/component-registry.ts`)
   - Real-time status tracking
   - Dependency management
   - Lock/unlock mechanisms

4. **Implement Figma Validator** (`src/claude-flow/figma-validator.ts`)
   - Design token extraction
   - Visual comparison logic
   - Checklist automation

5. **Create Test Enforcer** (`src/claude-flow/test-enforcer.ts`)
   - Coverage calculation
   - Test type validation
   - Reporting mechanisms

## Success Metrics

1. **Zero Circular Dependencies**: Detection prevents 100% of circular deps
2. **No Conflicts**: Parallel development without merge conflicts
3. **Complete Implementations**: 100% of components have Figma verification and tests
4. **Faster Development**: 50% reduction in rework due to coordination

## Integration with Existing Workflows

### During `gcm create`:
- Initialize phase manager
- Set up component registry
- Configure validation rules

### During development:
- Real-time coordination active
- Phase transitions enforced
- Continuous validation

### During `gcm share`:
- Final validation check
- Ensure all phases complete
- Generate completion report

## Next Steps

1. Review and approve this plan
2. Create phase manager implementation
3. Update agent templates with phase logic
4. Build validation and enforcement mechanisms
5. Test with real iteration scenarios