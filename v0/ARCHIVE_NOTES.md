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
