#!/bin/bash
# Archive old/redundant files to v0 directory

echo "📦 Archiving old implementations to v0 directory..."

# Create v0 directory structure
mkdir -p v0/{docs,contexts,templates,scripts}

# Create archive notes
cat > v0/ARCHIVE_NOTES.md << 'EOF'
# Archive Notes - v0 Directory

This directory contains the original implementations that were replaced during the simplification effort.

## Why These Files Were Archived

1. **Multiple Competing Approaches**: Different Claudes created different solutions for the same problems
2. **Redundant Documentation**: Multiple versions of setup guides, workflows, and processes
3. **Inconsistent Implementations**: Various auth bypass methods, port configurations, and health checks
4. **Complexity Buildup**: Each iteration added new processes without removing old ones

## What's Been Simplified

- **10+ startup variations** → 1 standard startup script
- **5+ auth bypass methods** → 1 method (TEST_MODE=true)
- **Multiple health checks** → 1 unified health check
- **Various port schemes** → 1 deterministic algorithm
- **Scattered documentation** → 1 source of truth

## When to Delete v0

This directory should be deleted only after:
1. ✅ 3 complete iterations run successfully with new system
2. ✅ No auth/login issues encountered
3. ✅ All PRs merge cleanly
4. ✅ Team is comfortable with simplified workflows

Until then, keep this as a fallback reference.

## Archived Files

### Documentation
- Multiple ITERATE_WORKFLOW.md variants
- Multiple RESUME_ITERATION_WORKFLOW.md variants
- Competing setup guides
- Redundant troubleshooting docs

### Templates
- Various docker-compose templates
- Multiple .env configurations
- Different startup scripts
- Competing health check implementations

### Contexts
- Old project configurations
- Outdated hooks
- Legacy templates

Date Archived: $(date)
EOF

# Move redundant documentation files
echo "📄 Archiving redundant documentation..."
[ -f docs/ITERATE_WORKFLOW.md ] && mv docs/ITERATE_WORKFLOW.md v0/docs/
[ -f docs/RESUME_ITERATION_WORKFLOW.md ] && mv docs/RESUME_ITERATION_WORKFLOW.md v0/docs/
[ -f docs/ERROR_ANALYSIS_REPORT.md ] && mv docs/ERROR_ANALYSIS_REPORT.md v0/docs/
[ -f COLLABITERATION_MANAGER_PROCESS.md ] && mv COLLABITERATION_MANAGER_PROCESS.md v0/docs/
[ -f ITERATION_MANAGEMENT.md ] && mv ITERATION_MANAGEMENT.md v0/docs/
[ -f RUNNING_ITERATIONS.md ] && mv RUNNING_ITERATIONS.md v0/docs/
[ -f SETUP_CHECKLIST.md ] && mv SETUP_CHECKLIST.md v0/docs/
[ -f USAGE_GUIDE.md ] && mv USAGE_GUIDE.md v0/docs/

# Move old context files if they exist
echo "📁 Archiving old context files..."
if [ -d contexts/media-tool ]; then
  # Keep the directory but move old templates
  find contexts/media-tool/templates -name "*.old" -o -name "*.bak" | while read file; do
    mv "$file" v0/contexts/
  done
fi

# Archive any duplicate startup scripts from collabiterations
echo "🔧 Documenting iteration-specific scripts..."
cat > v0/ITERATION_SCRIPTS_INVENTORY.md << 'EOF'
# Iteration-Specific Scripts Inventory

This documents the various startup scripts found across iterations.
These are NOT moved but documented for reference.

## Found Scripts

EOF

# Document (don't move) iteration-specific scripts
find ../collabiterations -name "start-iteration.sh" -o -name "STARTUP.md" -o -name "health-check.sh" 2>/dev/null | while read file; do
  echo "- $file" >> v0/ITERATION_SCRIPTS_INVENTORY.md
done

# Move any backup files
echo "🗄️  Archiving backup files..."
find . -name "*.bak" -o -name "*.old" -o -name "*~" | while read file; do
  dir=$(dirname "$file")
  mkdir -p "v0/backups/$dir"
  mv "$file" "v0/backups/$file"
done

# Create migration checklist
cat > v0/MIGRATION_CHECKLIST.md << 'EOF'
# Migration Checklist

## Before Using New System

- [ ] Review SIMPLIFIED_SYSTEM.md
- [ ] Read UNIFIED_WORKFLOWS.md
- [ ] Understand CLAUDE_BEHAVIORAL_RULES.md
- [ ] Check templates/ directory for new templates

## During Migration

- [ ] Use only the 4 core commands
- [ ] Follow unified workflows exactly
- [ ] Report any issues immediately
- [ ] Don't create workarounds

## Success Criteria

- [ ] Iteration 1: Simple feature (complete without issues)
- [ ] Iteration 2: Complex feature (no circular dependencies)
- [ ] Iteration 3: Full stack feature (clean PR merge)

## After Success

- [ ] Delete v0 directory
- [ ] Celebrate simplified system!
EOF

echo ""
echo "✅ Archival complete!"
echo ""
echo "📊 Archive Summary:"
echo "   - Documentation moved to v0/docs/"
echo "   - Backup files moved to v0/backups/"
echo "   - Archive notes created in v0/ARCHIVE_NOTES.md"
echo "   - Migration checklist in v0/MIGRATION_CHECKLIST.md"
echo ""
echo "🔒 The v0 directory will be kept until 3 iterations succeed with the new system."