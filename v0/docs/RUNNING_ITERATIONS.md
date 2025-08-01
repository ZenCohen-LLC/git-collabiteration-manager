# Running Iterations Registry

**Last Updated**: 2025-06-27 09:05:00

This file tracks all currently running iterations across projects to prevent confusion and port conflicts.

## 🟢 Currently Running

| Iteration Name | Project | Location | Frontend Port | Backend Port | DB Port | Branch | Status | Last Updated |
|---|---|---|---|---|---|---|---|---|
| line-item-types | media-tool | `/Users/christophergarrison/freshbravo/media-tool/iterations/media-tool/iterations/line-item-types/media-tool` | 3050 | 3051 | 5522 | iteration/line-item-types | 🟢 RUNNING | 2025-06-27 09:18 |

## 🔴 Stopped/Available Iterations

| Iteration Name | Project | Location | Frontend Port | Backend Port | DB Port | Branch | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| iteration-ui-integration | media-tool | `/Users/christophergarrison/freshbravo/media-tool/iterations/iteration-ui-integration/media-tool` | 3000 | 3001 | 5442 | iteration/ui-integration | 🔴 STOPPED | Old iteration - not current work |
| ui-redesign | media-tool | `/Users/christophergarrison/freshbravo/media-tool/iterations/media-tool/iterations/ui-redesign/media-tool` | 3020 | 3021 | 5452 | iteration/ui-redesign | 🔴 STOPPED | |
| design-exploration | media-tool | `/Users/christophergarrison/freshbravo/media-tool/iterations/media-tool/iterations/design-exploration/media-tool` | 3030 | 3031 | 5462 | iteration/design-exploration | 🔴 STOPPED | |

## 📋 Iteration Content Map

### iteration-ui-integration (🟢 RUNNING)
- **Contains**: Line item types implementation with badges
- **Features**: 
  - Line item type badges (STANDARD, MANAGEMENT_FEE, ZERO_DOLLAR, ZERO_MARGIN)
  - `LineItemTypeBadge` component with color-coded styling
  - Line item type utilities and display names
  - Field behavior configuration for each type
- **Location**: `/Users/christophergarrison/freshbravo/media-tool/iterations/iteration-ui-integration/media-tool`
- **Access**: http://localhost:3000
- **Backend**: http://localhost:3001

### line-item-types (⚠️ WRONG CONTENT)
- **Problem**: Directory contains iteration-ui-integration code despite having line-item-types documentation
- **ITERATION_SUMMARY.md**: Contains detailed line item types documentation
- **Actual Code**: Shows robot icon and iteration-ui-integration content
- **Action Needed**: Code needs to be corrected or iteration needs cleanup

## 🚀 Quick Start Commands

### Start iteration-ui-integration (Line Item Types Work)
```bash
cd /Users/christophergarrison/freshbravo/media-tool/iterations/iteration-ui-integration/media-tool
bun run db:start
nohup bun run dev:frontend > frontend.log 2>&1 &
nohup bun run dev:backend > backend.log 2>&1 &
# Access at http://localhost:3000
```

### Stop All Iterations
```bash
killall node && killall bun
# Or more targeted:
pkill -f "vite" && pkill -f "packages/backend/src/index.ts"
```

### Check Running Processes
```bash
lsof -nP -iTCP -sTCP:LISTEN | grep -E ":(3000|3001|3020|3021|3030|3031|3060|3061|3090|3091)"
```

## 📁 Directory Structure

### Media Tool Iterations
```
/Users/christophergarrison/freshbravo/media-tool/
├── .git-iterations/              # Git worktrees (clean, proper git integration)
│   ├── line-item-types/         # Git worktree for line-item-types branch
│   └── tailwinds-refactor/      # Git worktree for tailwinds-refactor branch
├── iterations/                   # Legacy iteration system directories
│   ├── iteration-ui-integration/ # ✅ Contains actual line item types work
│   ├── media-tool/iterations/   # Nested iteration structure
│   │   ├── line-item-types/     # ⚠️ Wrong content - has iteration-ui-integration code
│   │   ├── ui-redesign/
│   │   └── design-exploration/
│   └── ...
```

### Git Collabiteration Manager
```
/Users/christophergarrison/freshbravo/git-collabiteration-manager/
├── RUNNING_ITERATIONS.md        # This file - central registry
├── ITERATION_MANAGEMENT.md      # Management procedures (to be created)
├── contexts/                    # Project-specific configurations
└── src/                        # Tool source code
```

## ⚠️ Known Issues

1. **line-item-types Directory Confusion**: 
   - Directory contains wrong code despite having correct documentation
   - Actual line item types work is in iteration-ui-integration
   - Needs cleanup or proper code sync

2. **Port Conflicts**: 
   - iteration-ui-integration configured for 3060/3061 but running on 3000/3001
   - Need to standardize port configurations vs actual runtime ports

3. **Multiple Iteration Systems**: 
   - Legacy iterations/ directory structure
   - Git worktrees in .git-iterations/
   - Need to consolidate or clearly document which system to use

## 🔧 Maintenance

### When Starting an Iteration:
1. Update this file with RUNNING status
2. Record actual ports being used
3. Note any configuration discrepancies

### When Stopping an Iteration:
1. Update status to STOPPED
2. Add any notes about final state
3. Clear port assignments

### Weekly Cleanup:
1. Verify running processes match this registry
2. Clean up stopped iterations that are no longer needed
3. Resolve any content/directory mismatches

---

**⚡ Remember**: Always check this file before starting iterations to avoid port conflicts and directory confusion!