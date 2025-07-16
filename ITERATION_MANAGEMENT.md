# Iteration Management & Directory Resolution

## 🚨 Current Critical Issues

### Issue #1: Content Mismatch Across Directories
- **Problem**: Multiple directories claiming to have "line item types" work but showing old iteration-ui-integration content
- **Impact**: Cannot locate actual line item types implementation with badges
- **Status**: CRITICAL - Needs immediate resolution

### Issue #2: Directory Confusion
Multiple iteration systems exist:
1. `/freshbravo/media-tool/.git-iterations/` (Git worktrees - proper git integration)
2. `/freshbravo/media-tool/iterations/` (Legacy iteration directories)
3. `/freshbravo/media-tool/iterations/media-tool/iterations/` (Nested structure)

## 🔍 Comprehensive Directory Audit

### Search Strategy
We need to systematically search ALL possible locations for the actual line item types work:

```bash
# Search for line item type badge implementations
find /Users/christophergarrison/freshbravo -name "*.tsx" -exec grep -l "LineItemTypeBadge\|line_item_type.*badge" {} \; 2>/dev/null

# Search for line item type column implementations  
find /Users/christophergarrison/freshbravo -name "*.tsx" -exec grep -l "MANAGEMENT_FEE\|ZERO_DOLLAR\|ZERO_MARGIN.*badge" {} \; 2>/dev/null

# Search for ITERATION_SUMMARY.md files mentioning line item types
find /Users/christophergarrison/freshbravo -name "ITERATION_SUMMARY.md" -exec grep -l "line.*item.*type" {} \; 2>/dev/null
```

### Expected Line Item Types Features
The REAL line item types iteration should contain:
- ✅ Line item type column in tables with badges
- ✅ Four types: STANDARD, MANAGEMENT_FEE, ZERO_DOLLAR, ZERO_MARGIN  
- ✅ Color-coded badges (blue, purple, green, orange)
- ✅ Editable dropdown in tables
- ✅ Type-specific field validation
- ❌ NO robot icon from old iteration-ui-integration
- ❌ NO "iteration-ui-integration" text in overview

## 🎯 Action Plan

### Step 1: Complete Audit
1. Stop ALL running iterations
2. Search every possible directory for line item types content
3. Identify which directory actually contains our work
4. Document findings in registry

### Step 2: Directory Standardization  
Choose ONE iteration system:
- **Option A**: Use git worktrees (`.git-iterations/`) - proper git integration
- **Option B**: Use legacy iterations directories - simpler but no git integration
- **Recommendation**: Git worktrees for better version control

### Step 3: Content Verification
For each potential location:
1. Check App.tsx for line item type imports
2. Check if line-items-table.tsx has line_item_type column  
3. Verify presence of LineItemTypeBadge component
4. Test UI for correct content (no robot icon)

### Step 4: Port Standardization
- Create consistent port allocation system
- Update configurations to match actual runtime ports
- Document port ranges for each project

## 🛠️ Recovery Commands

### Complete System Reset
```bash
# Kill all processes
killall node bun 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "packages/backend/src/index.ts" 2>/dev/null || true

# Check for any remaining processes
lsof -nP -iTCP -sTCP:LISTEN | grep -E ":(30[0-9][0-9])"
```

### Directory Content Check
```bash
# Function to check if directory has line item types work
check_iteration_content() {
    local dir="$1"
    echo "Checking: $dir"
    
    if [[ -f "$dir/packages/frontend/src/App.tsx" ]]; then
        echo "  App.tsx exists"
        if grep -q "LineItemTypeDemo\|line-item-type" "$dir/packages/frontend/src/App.tsx"; then
            echo "  ✅ Contains line item type imports"
        else
            echo "  ❌ No line item type imports found"
        fi
    fi
    
    if [[ -f "$dir/packages/frontend/src/features/line-items/line-items-table.tsx" ]]; then
        if grep -q "line_item_type.*field" "$dir/packages/frontend/src/features/line-items/line-items-table.tsx"; then
            echo "  ✅ Has line_item_type column"
        else
            echo "  ❌ No line_item_type column"
        fi
    fi
    
    echo ""
}
```

## 📋 Registry Template

### Iteration Entry Format
```markdown
| Name | Project | Location | Frontend | Backend | DB | Branch | Content Status | UI Status |
|------|---------|----------|----------|---------|----|---------|--------------|-----------| 
| iteration-name | media-tool | /full/path | 3000 | 3001 | 5432 | branch-name | ✅ Correct | ✅ No robot |
```

### Content Status Legend
- ✅ **Correct**: Contains expected line item types implementation
- ❌ **Wrong**: Contains different iteration content  
- ⚠️ **Mixed**: Partially correct content
- ❓ **Unknown**: Needs investigation

### UI Status Legend  
- ✅ **No robot**: Correct UI without old iteration-ui-integration elements
- ❌ **Robot**: Shows old iteration-ui-integration UI with robot icon
- ❓ **Not tested**: Haven't verified UI content

## 🔄 Standard Operating Procedures

### Before Starting ANY Iteration:
1. Check RUNNING_ITERATIONS.md for current status
2. Verify directory content matches expected features
3. Test UI briefly to confirm correct content
4. Update registry with actual status

### When Creating New Iterations:
1. Use git worktrees for proper isolation
2. Document in registry immediately  
3. Include content verification checklist
4. Record any configuration discrepancies

### When Issues Arise:
1. Stop ALL iterations to get clean slate
2. Update registry with CRITICAL status
3. Perform systematic audit
4. Document resolution steps

---

**🚨 CRITICAL REMINDER**: The line item types work exists SOMEWHERE - we just need to find the correct directory!