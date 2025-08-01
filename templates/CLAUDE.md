# Git Collabiteration Manager - Templates

## ⚠️ CRITICAL: Never Modify the media-tool Directory

**The freshbravo/media-tool directory is SACRED and READ-ONLY**
- NEVER make changes directly to /Users/christophergarrison/freshbravo/media-tool  
- This directory should remain 1:1 with what's in git
- ALL changes happen through git worktrees in collabiterations/
- Updates to media-tool come ONLY from git pull
- Changes are contributed back via PRs from iteration branches

## This Directory

This `templates/` directory contains the ONLY templates to use:
- `docker-compose.template.yml` - Standard Docker configuration
- `.env.template` - Standard environment variables (TEST_MODE=true)
- `start-iteration.sh` - Standard startup script
- `health-check.sh` - Standard health check script

These are the ONLY templates. Do not create alternatives.