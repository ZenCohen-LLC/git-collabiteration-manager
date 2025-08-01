# Git Collabiteration Manager - Simplified System Design

## Executive Summary

This document outlines a dramatically simplified git-collabiteration system that:
1. Reduces redundancy by consolidating multiple competing approaches
2. Enforces 4 core workflows with consistent behavior
3. Integrates Claude Flow for coordinated development
4. Ensures reliable auth bypass and test data setup

## Core Problems Identified

### 1. Multiple Competing Approaches
- Different STARTUP.md files with different procedures
- Inconsistent port allocations and service configurations
- Various auth bypass methods (TEST_MODE, env vars, database users)
- Different health check implementations

### 2. Incomplete Implementations
- Claude declaring components "done" without testing against Figma
- Database rollbacks destroying test users and blocking development
- Circular dependencies from uncoordinated parallel development
- Missing Playwright tests despite being "required"

### 3. Process Proliferation
- Each iteration adding new "improved" processes without removing old ones
- Multiple ways to do the same thing (start services, check health, etc.)
- Conflicting documentation across iterations

## Simplified 4-Workflow System

### 1. CREATE Workflow
**Purpose**: Start a new iteration with guaranteed working environment

**Key Requirements**:
- ALWAYS pull latest media-tool code first
- ALWAYS set up auth bypass correctly
- ALWAYS populate database with test campaigns
- ALWAYS verify services are running before proceeding

**Single Implementation**:
```bash
gcm create [iteration-name] --ticket BRAV-[number]
```

This command will:
1. Pull latest from media-tool main branch
2. Create git worktree in `/collabiterations/[iteration-name]/`
3. Generate standardized configuration files
4. Start services with deterministic ports
5. Set up database with test user and campaigns
6. Verify all services are healthy
7. Initialize Claude Flow swarm for coordination

### 2. ITERATE Workflow
**Purpose**: Develop features without breaking the environment

**Key Requirements**:
- NEVER re-roll database (preserves test users)
- ALWAYS check Figma designs before implementing
- ALWAYS write Playwright tests for components
- ALWAYS use Claude Flow coordination

**Single Implementation**:
- Database operations use transactions, not full resets
- Figma links embedded in implementation steps
- Playwright tests required for "done" status
- Claude Flow agents coordinate to prevent circular dependencies

### 3. RESUME Workflow
**Purpose**: Continue work with consistent environment state

**Key Requirements**:
- ALWAYS perform health checks first
- NEVER restart already-running services
- ALWAYS load latest iteration state
- ALWAYS verify auth bypass still works

**Single Implementation**:
```bash
gcm resume [iteration-name]
```

This command will:
1. Run comprehensive health checks
2. Start ONLY missing services
3. Verify test user exists and auth works
4. Load iteration plan and current state
5. Resume Claude Flow swarm with context

### 4. SHARE Workflow
**Purpose**: Create clean PRs ready for merge

**Key Requirements**:
- EXCLUDE iteration-specific code (auth bypass, test data)
- INCLUDE all feature code and tests
- REBASE on latest main before PR
- FOLLOW media-tool conventions

**Single Implementation**:
```bash
gcm share [iteration-name] --title "Feature: Description"
```

This command will:
1. Create clean branch without iteration artifacts
2. Rebase on latest main
3. Run all tests to verify
4. Create PR with proper metadata
5. Include testing instructions

## Unified Configuration

### Standard Port Allocation
```javascript
const BASE_PORTS = {
  frontend: 5173,
  backend: 3001,
  database: 5432
};

function getIterationPorts(iterationName) {
  const hash = simpleHash(iterationName);
  const offset = (hash % 20) * 10; // 0, 10, 20, ... 190
  return {
    frontend: BASE_PORTS.frontend + offset,
    backend: BASE_PORTS.backend + offset,
    database: BASE_PORTS.database + offset
  };
}
```

### Standard Auth Bypass
Single method for all iterations:
```javascript
// Backend: middleware/auth.ts
if (process.env.TEST_MODE === 'true') {
  req.user = await getTestUser(); // Always test@mail.com
  return next();
}

// Database: Always ensure test user exists
INSERT INTO media_tool.users (email, name, zoho_user_id) 
VALUES ('test@mail.com', 'Test User', 'test-zoho-id')
ON CONFLICT (email) DO UPDATE SET zoho_user_id = 'test-zoho-id';
```

### Standard Test Data
Every iteration gets:
- 2 campaigns of EVERY type from campaign_stages enum
- Each campaign has standard, management fee, and zero-dollar line items
- Consistent naming: "[Type] Test Campaign [1/2]"

## Claude Flow Integration

### Swarm Initialization
When creating an iteration, automatically:
```javascript
// Initialize swarm with project context
await claudeFlow.swarm.init({
  topology: 'hierarchical',
  maxAgents: 5,
  context: {
    iteration: iterationName,
    figmaLinks: extractedFromPlan,
    components: identifiedComponents
  }
});
```

### Agent Coordination Rules
1. **Component Agent**: Creates React components from Figma
2. **Integration Agent**: Connects components to API/state
3. **Test Agent**: Writes Playwright tests
4. **Review Agent**: Checks for circular dependencies
5. **Coordinator Agent**: Manages dependencies and communication

### Communication Protocol
```javascript
// Every agent must report dependencies
await claudeFlow.memory.store(`${iteration}/dependencies/${component}`, {
  imports: [...],
  exports: [...],
  requires: [...]
});

// Coordinator prevents circular dependencies
if (detectCircularDependency(newImport)) {
  throw new Error('Circular dependency detected');
}
```

## Simplified Documentation Structure

### Single Source of Truth
```
git-collabiteration-manager/
├── README.md                    # Quick start only
├── WORKFLOWS.md                 # 4 workflows explained
├── TROUBLESHOOTING.md          # Common issues
└── src/
    ├── workflows/
    │   ├── create.ts           # Single create implementation
    │   ├── iterate.ts          # Single iterate implementation
    │   ├── resume.ts           # Single resume implementation
    │   └── share.ts            # Single share implementation
    └── templates/
        ├── docker-compose.yml  # One template for all
        ├── env.template        # One env template
        └── startup.sh          # One startup script
```

### Claude Behavioral Rules
Update CLAUDE.md in both repos:
```markdown
## Collabiteration Rules

### /iterate Command
1. ALWAYS pull latest code first
2. ALWAYS use gcm create with --ticket flag
3. ALWAYS verify services before proceeding
4. NEVER skip Figma design review

### Component Development
1. ALWAYS check Figma before implementing
2. ALWAYS write Playwright tests
3. ALWAYS use Claude Flow coordination
4. NEVER declare "done" without tests passing

### Database Operations
1. NEVER drop and recreate database
2. ALWAYS use migrations for schema changes
3. ALWAYS preserve test user
4. ALWAYS use transactions for data changes

### PR Creation
1. ALWAYS use gcm share command
2. ALWAYS exclude iteration-specific code
3. ALWAYS rebase on main first
4. NEVER include auth bypass in PR
```

## Implementation Plan

### Phase 1: Consolidate (Week 1)
1. Merge all STARTUP.md variants into single template
2. Standardize port allocation algorithm
3. Create unified health check system
4. Remove duplicate documentation

### Phase 2: Simplify (Week 2)
1. Rewrite gcm commands with single implementation each
2. Create standard templates for all configurations
3. Implement consistent auth bypass
4. Add Claude Flow integration hooks

### Phase 3: Enforce (Week 3)
1. Add validation to prevent old patterns
2. Create automated tests for workflows
3. Update all Claude.md files
4. Train system on new patterns

### Phase 4: Document (Week 4)
1. Write single quick start guide
2. Create troubleshooting guide
3. Record video walkthrough
4. Deploy and monitor

## Success Metrics

1. **Complexity Reduction**
   - From 10+ ways to start services → 1 way
   - From 5+ auth bypass methods → 1 method
   - From multiple health checks → 1 system

2. **Reliability Improvement**
   - 100% of iterations start with working auth
   - 0% database rollback issues
   - 100% Figma designs reviewed before coding

3. **Coordination Success**
   - 0 circular dependencies in components
   - 100% of components have Playwright tests
   - Parallel development without conflicts

## Quick Start Preview

```bash
# Install
npm install -g @zencohen/git-collabiteration-manager

# Create iteration
cd ~/projects/media-tool
gcm create new-feature --ticket BRAV-1234

# Claude automatically:
# - Pulls latest code
# - Sets up isolated environment
# - Configures auth bypass
# - Populates test data
# - Starts all services
# - Initializes Claude Flow swarm
# - Opens browser to http://localhost:5180/

# Develop with coordination
# Claude Flow agents work in parallel without conflicts

# Share when done
gcm share new-feature --title "Add new feature"
# Creates clean PR ready for review
```

This simplified system eliminates redundancy, enforces best practices, and integrates intelligent coordination to prevent the issues that have plagued previous iterations.