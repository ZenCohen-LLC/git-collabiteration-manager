# /remove-iteration Workflow

## When user types /remove-iteration:

### Step 1: Discover Active Iterations
```
Let me check what iterations are currently available...

[Check these sources:]
- Iteration registry (JSON/database)
- .git-collabiterations/* directories
- git worktree list
- Running processes on allocated ports
```

### Step 2: Gather Iteration Status
For each iteration, determine:
- Name and description
- Allocated ports (frontend, backend, database)
- Current status (running/stopped)
- Directory location
- Git branch name
- Last modified date
- Any active processes

### Step 3: Present Options with Status
```
I found the following iterations:

1. **custom-pacing-enhancements** 🟢 RUNNING
   - Location: .git-collabiterations/custom-pacing-enhancements
   - Frontend: http://localhost:3030 (active)
   - Backend: http://localhost:3031 (active)
   - Database: postgresql://localhost:5472 (active)
   - Last modified: 2 hours ago
   
2. **dashboard-performance** 🔴 STOPPED
   - Location: .git-collabiterations/dashboard-performance
   - Frontend: port 3040 (inactive)
   - Backend: port 3041 (inactive)
   - Database: port 5482 (inactive)
   - Last modified: 3 days ago

3. **user-permissions** 🟡 PARTIAL
   - Location: .git-collabiterations/user-permissions
   - Frontend: port 3050 (inactive)
   - Backend: http://localhost:3051 (active)
   - Database: postgresql://localhost:5492 (active)
   - Last modified: 1 day ago

Which iteration would you like to remove? (enter number or name):
```

### Step 4: Validate Selection
```
You selected: custom-pacing-enhancements

Checking iteration details...
✅ Found git worktree
✅ Located in registry
✅ Identified allocated ports
⚠️  Services are currently running
```

### Step 5: Check for Uncommitted Work
```
Checking for uncommitted changes...

[Run: git -C .git-collabiterations/custom-pacing-enhancements status --porcelain]

[If changes found:]
⚠️  Found uncommitted changes:
 M src/components/PacingBlock.tsx
 M src/utils/pacing-helpers.ts
?? src/components/GenerateMonthlyBlocksButton.tsx

These changes will be PERMANENTLY LOST if you proceed.
```

### Step 6: Final Confirmation
```
⚠️  REMOVAL CONFIRMATION

Iteration: custom-pacing-enhancements
This action will:

1. Stop running services:
   - Frontend (port 3030)
   - Backend (port 3031)
   - Database (port 5472)

2. Delete permanently:
   - Directory: .git-collabiterations/custom-pacing-enhancements
   - Git branch: iteration/custom-pacing-enhancements
   - Database volume: custom-pacing-enhancements_db_data
   - Any uncommitted changes

3. Clean up:
   - Remove from iteration registry
   - Free allocated ports
   - Remove Docker containers/volumes

This cannot be undone. Continue? (type 'yes' to confirm):
```

### Step 7: Execute Removal

#### 7.1 Stop Services
```
Stopping services...

# Frontend
[Check if running: lsof -i:3030]
[If running: lsof -ti:3030 | xargs kill -TERM]
✅ Frontend stopped

# Backend  
[Check if running: lsof -i:3031]
[If running: lsof -ti:3031 | xargs kill -TERM]
✅ Backend stopped

# Database
[Run: docker stop custom-pacing-enhancements-db]
✅ Database container stopped
```

#### 7.2 Remove Docker Resources
```
Removing Docker resources...

[Run: docker rm custom-pacing-enhancements-db]
✅ Container removed

[Run: docker volume rm custom-pacing-enhancements_db_data]
✅ Volume removed
```

#### 7.3 Remove Git Worktree
```
Removing git worktree...

[Run: git worktree remove .git-collabiterations/custom-pacing-enhancements --force]
✅ Worktree removed

[Run: git branch -D iteration/custom-pacing-enhancements]
✅ Branch deleted
```

#### 7.4 Update Registry
```
Updating iteration registry...

[Remove entry from registry JSON/database]
[Update port allocation records]
[Clean up metadata files]
✅ Registry updated
```

### Step 8: Verify Cleanup
```
Verifying cleanup...

✅ Directory removed: .git-collabiterations/custom-pacing-enhancements
✅ No processes on ports: 3030, 3031, 5472
✅ Git branch deleted
✅ Docker resources cleaned
✅ Registry entry removed
```

### Step 9: Final Report
```
✅ Successfully removed iteration: custom-pacing-enhancements

Summary:
- Stopped 3 services
- Freed ports: 3030, 3031, 5472 (now available)
- Removed git worktree and branch
- Cleaned up Docker containers and volumes
- Updated iteration registry

The main codebase was not affected by this removal.
```

## Error Handling Scenarios

### Service Won't Stop Gracefully
```
⚠️  Frontend service on port 3030 is not responding to SIGTERM

Options:
1. Force kill the process (SIGKILL)
2. Wait and retry (10 seconds)
3. Cancel removal

Your choice: 
```

### Permission Denied
```
❌ Error: Permission denied while removing directory

This might be because:
- Files are locked by another process
- Insufficient permissions
- Directory is on a read-only filesystem

Please try:
1. Close any editors with files open from this iteration
2. Run with appropriate permissions
3. Check filesystem status
```

### Docker Resources Busy
```
⚠️  Cannot remove Docker volume: resource is busy

The database volume is still in use. 

Checking for connected containers...
Found: custom-pacing-enhancements-db-backup

Would you like to:
1. Stop all related containers and retry
2. Skip Docker cleanup (manual cleanup needed)
3. Cancel removal
```

### Registry Update Failure
```
⚠️  Failed to update iteration registry

The iteration has been partially removed:
✅ Services stopped
✅ Git worktree removed
❌ Registry update failed

Please manually update the registry to complete removal.
```

## Special Considerations

### Multiple Users
If iteration shows signs of multi-user access:
```
⚠️  This iteration may be in use by another team member
Last accessed by: different-user (15 minutes ago)

Proceed with removal? (yes/no):
```

### Running Tests
If tests are currently running:
```
⚠️  Found running test processes:
- Playwright tests (PID: 12345)
- Jest watch mode (PID: 12346)

These will be terminated. Continue? (yes/no):
```

### Linked Resources
If iteration has linked resources:
```
This iteration has associated resources:
- Pull Request: #234 (draft)
- Shared preview URL: https://preview.example.com/custom-pacing
- CI/CD pipeline: Running

These references will become invalid. Continue? (yes/no):
```

## Command Shortcuts

For experienced users:
```
# Skip confirmation for stopped iterations
/remove-iteration dashboard-performance --force

# Remove multiple iterations
/remove-iteration --all-stopped

# Dry run to see what would be removed
/remove-iteration custom-pacing --dry-run
```