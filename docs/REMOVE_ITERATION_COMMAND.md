# /remove-iteration Command Documentation

## Overview
The `/remove-iteration` command allows users to cleanly remove an iteration, including stopping all services, freeing ports, cleaning up the git worktree, and updating the registry.

## Usage
Simply type `/remove-iteration` in your conversation with Claude Code from your project directory.

**⚠️ IMPORTANT:** You must be in your project directory (e.g., media-tool), NOT in the git-collabiteration-manager directory!

## What It Does
1. Lists all existing iterations from the registry
2. Prompts user to select which iteration to remove
3. Confirms the removal action
4. Stops all running services (frontend, backend, database)
5. Removes the git worktree directory
6. Updates/removes registry entries
7. Frees up allocated ports for future use
8. Cleans up any Docker containers or volumes

## Process Flow

### Step 1: Show Available Iterations
```
Available iterations to remove:
1. custom-pacing-enhancements 
   - Ports: Frontend 3030, Backend 3031, DB 5472
   - Status: Running
   
2. user-auth-improvements
   - Ports: Frontend 3040, Backend 3041, DB 5482  
   - Status: Stopped
   
3. dashboard-redesign
   - Ports: Frontend 3050, Backend 3051, DB 5492
   - Status: Running

Which iteration would you like to remove? (enter number or name):
```

### Step 2: Confirm Removal
```
⚠️  You are about to remove: custom-pacing-enhancements

This will:
- Stop all running services
- Delete the worktree at .git-collabiterations/custom-pacing-enhancements
- Remove the git branch iteration/custom-pacing-enhancements
- Free ports: 3030, 3031, 5472
- Remove database volume: custom-pacing-enhancements_db_data
- Update the iteration registry

Are you sure you want to proceed? (yes/no):
```

### Step 3: Stop Running Services
```
Stopping services for custom-pacing-enhancements...
✅ Stopped frontend (port 3030)
✅ Stopped backend (port 3031)
✅ Stopped database (port 5472)
✅ Removed Docker containers
```

### Step 4: Clean Up Resources
```
Cleaning up resources...
✅ Removed git worktree at .git-collabiterations/custom-pacing-enhancements
✅ Deleted branch iteration/custom-pacing-enhancements
✅ Removed database volume
✅ Updated iteration registry
✅ Freed allocated ports
```

### Step 5: Completion
```
✅ Successfully removed iteration: custom-pacing-enhancements

The following resources have been cleaned up:
- Git worktree and branch
- All service containers
- Database and volumes
- Port allocations (3030, 3031, 5472 now available)
- Registry entries

The main codebase was not affected.
```

## Example Usage

```
User: /remove-iteration

Claude: I'll help you remove an iteration. Let me check what's currently available...

Found 3 iterations:

1. **custom-pacing-enhancements** [RUNNING]
   - Frontend: http://localhost:3030
   - Backend: http://localhost:3031  
   - Database: postgresql://localhost:5472
   - Created: 3 days ago
   
2. **report-export** [STOPPED]
   - Frontend: port 3040 (not running)
   - Backend: port 3041 (not running)
   - Database: port 5482 (not running)
   - Created: 1 week ago

3. **api-optimization** [RUNNING]
   - Frontend: http://localhost:3050
   - Backend: http://localhost:3051
   - Database: postgresql://localhost:5492
   - Created: 2 days ago

Which iteration would you like to remove? (enter number or name):

User: 2

Claude: You've selected: report-export

⚠️  This will permanently remove:
- Worktree: .git-collabiterations/report-export
- Branch: iteration/report-export  
- Any uncommitted changes
- Database and all test data

Are you sure? (yes/no):

User: yes

Claude: Removing iteration: report-export

✅ Services already stopped
✅ Removed git worktree
✅ Deleted git branch
✅ Cleaned up Docker resources
✅ Updated registry
✅ Freed ports 3040, 3041, 5482

Iteration successfully removed!
```

## Safety Features

### Pre-removal Checks
- Verify iteration exists in registry
- Check for uncommitted changes
- Warn if services are running
- Confirm before proceeding

### Graceful Service Shutdown
- Send SIGTERM to allow clean shutdown
- Wait for services to stop
- Force stop if necessary after timeout
- Clean up orphaned processes

### Registry Updates
- Remove iteration entry
- Update port allocation records
- Clean up any temporary files
- Update iteration count

## Implementation Details

### Service Stop Commands
```bash
# Stop frontend (React/Vite)
lsof -ti:3030 | xargs kill -TERM

# Stop backend (Node)
lsof -ti:3031 | xargs kill -TERM

# Stop database (Docker)
docker stop custom-pacing-enhancements-db
docker rm custom-pacing-enhancements-db
docker volume rm custom-pacing-enhancements_db_data
```

### Git Worktree Cleanup
```bash
# Remove worktree
git worktree remove .git-collabiterations/custom-pacing-enhancements --force

# Delete branch
git branch -D iteration/custom-pacing-enhancements
```

### Registry Cleanup
- Remove from iteration registry JSON/database
- Update port allocation table
- Clean up iteration metadata

## Error Handling

### Iteration Not Found
```
No iteration found with name: unknown-iteration

Did you mean one of these?
- custom-pacing-enhancements
- user-auth-improvements
```

### Services Won't Stop
```
⚠️  Some services are not responding to stop signals.

Would you like to:
1. Force stop (may lose uncommitted data)
2. Try again
3. Cancel removal
```

### Uncommitted Changes
```
⚠️  Found uncommitted changes in report-export:
- Modified: src/components/ExportButton.tsx
- New file: src/utils/pdf-generator.ts

Would you like to:
1. Remove anyway (changes will be lost)
2. Cancel and commit changes first
3. Create a backup branch
```

## Notes
- This is a Claude Code conversation command
- Requires proper permissions to stop services and remove directories
- Always backs up important work before removing
- Main codebase is never affected
- Ports are immediately available for new iterations