# Iteration Setup Checklist

This checklist ensures all critical steps are completed when setting up a new iteration. Future iterations should reference this document to avoid missing essential configuration.

## Pre-Setup Requirements
- [ ] Docker Desktop is running
- [ ] User is in the project directory (not git-collabiteration-manager)
- [ ] Latest code is pulled from main branch
- [ ] No port conflicts on iteration ports

## Stage 1: Environment Setup

### 1. Create Iteration Structure
- [ ] Create `/collabiterations/[iteration-name]/` directory
- [ ] Create `ITERATION_PLAN.md` with proper structure
- [ ] Document all user requirements and technical approach

### 2. Git Worktree Setup
- [ ] Create feature branch: `iteration/[iteration-name]`
- [ ] Set up git worktree in iteration directory
- [ ] Verify worktree is properly linked

### 3. Docker Configuration
- [ ] Create `docker-compose.[iteration-name].yml`
- [ ] Configure unique ports (database, backend, frontend)
- [ ] Set up isolated database with unique schema name
- [ ] Configure Flyway migrations with correct paths

### 4. Environment Configuration
- [ ] Create `.env` file with:
  - [ ] `TEST_MODE=true` for auth bypass
  - [ ] Correct database port and credentials
  - [ ] API URLs pointing to iteration ports
  - [ ] All required API keys and secrets

### 5. Startup Scripts
- [ ] Create `scripts/start-iteration.sh` with:
  - [ ] Docker startup commands
  - [ ] Dependency installation
  - [ ] **Test data generation (`bun run test:db-setup`)**
  - [ ] Backend and frontend startup
  - [ ] PID tracking for clean shutdown
- [ ] Create `scripts/stop-iteration.sh` for cleanup
- [ ] Make scripts executable: `chmod +x scripts/*.sh`

### 6. Documentation
- [ ] Create `STARTUP.md` with:
  - [ ] Quick start command
  - [ ] Manual startup steps
  - [ ] Test data generation step
  - [ ] Service URLs and ports
  - [ ] Health check commands
  - [ ] Troubleshooting guide

### 7. Database Setup
- [ ] Start database container
- [ ] Wait for database to be ready
- [ ] Run Flyway migrations
- [ ] **Generate test data with `bun run test:db-setup`**
- [ ] Verify test user exists (test@mail.com)
- [ ] Confirm schema prefixes are correct

### 8. Service Startup
- [ ] Install dependencies with `bun install`
- [ ] Start backend service
- [ ] Start frontend service
- [ ] Run health checks on all services
- [ ] Verify authentication bypass works

### 9. Verification
- [ ] Frontend loads at correct port
- [ ] Backend API responds to health checks
- [ ] Database queries work with proper schema
- [ ] Test user can authenticate
- [ ] No errors in service logs

## Common Issues to Avoid

### Database Issues
- **Missing test data**: Always run `test:db-setup` after migrations
- **Schema prefix errors**: Ensure queries use `media_tool.` prefix
- **Duplicate key errors**: Handle existing test users gracefully

### Port Conflicts
- **Check ports before starting**: `lsof -i :PORT`
- **Use deterministic port allocation**: Based on iteration name
- **Document all ports**: In STARTUP.md and docker-compose

### Authentication
- **TEST_MODE must be true**: In .env file
- **Test user must exist**: Created by test:db-setup
- **API URL must be correct**: Frontend needs correct backend URL

## Post-Setup Tasks
- [ ] Update main CLAUDE.md if new patterns discovered
- [ ] Document any project-specific setup requirements
- [ ] Commit all setup files to iteration branch
- [ ] Test complete workflow before implementation

## Cleanup Reminder
When iteration is complete:
- [ ] Run `./scripts/stop-iteration.sh`
- [ ] Remove Docker volumes if no longer needed
- [ ] Document lessons learned for future iterations