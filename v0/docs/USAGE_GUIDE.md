# Git Collabiteration Manager - Usage Guide

## 🎯 Quick Implementation Guide

You now have a **standalone, context-aware collabiteration management system** that can be used independently of any project repository!

## 📦 Installation & Setup

### 1. Install the Collabiteration Manager
```bash
# From the git-collabiteration-manager directory
cd /Users/christophergarrison/freshbravo/git-collabiteration-manager
bun install
bun run build

# Optional: Create global symlink  
sudo ln -sf $(pwd)/bin/git-collabiteration.js /usr/local/bin/git-collabiteration

# Test installation
git-collabiteration --version
```

### 2. Clean Up Media-Tool Repository
```bash
# Return media-tool to clean main branch state
cd /Users/christophergarrison/freshbravo/media-tool

# Remove worktree files added during development
git reset --hard HEAD
git clean -fd

# Remove iteration-specific files
rm -rf worktrees/
rm -rf .git-collabcollabiterations/
rm WORKTREE_ITERATIONS.md
rm -rf scripts/worktree-iteration-manager.ts
rm -rf scripts/migrate-to-worktrees.ts

# Revert package.json to original state
git checkout HEAD -- package.json

# Optional: Create clean commit
git add -A
git commit -m "clean: remove iteration manager files, tool now external"
```

## 🚀 Using with Media-Tool (Clean Workflow)

### 1. Initialize Media-Tool for Collabiterations
```bash
cd /path/to/media-tool/
git-collabiteration init
# ✅ Matched known project: Brkthru Media Tool
# 📁 Detected context: Comprehensive media buying platform
```

### 2. Create Feature Iteration
```bash
git-collabiteration create line-item-types --description="Implement 4 line item types for Standard campaigns"
# 🌿 Creating branch iteration/line-item-types
# 🔨 Creating worktree at .git-collabcollabiterations/line-item-types
# 📦 Installing dependencies...
# 🐳 Configuring Docker services...
# 📊 Database: media_tool_line_item_types (port 5462)
# ⚙️ Configuring environment...
# 📝 Adding iteration scripts...
# ✅ Media Tool iteration setup complete!
```

### 3. Start Development
```bash
git-collabiteration start line-item-types
# 📊 Starting database...
# ⏳ Waiting for database to be ready...
# 🌱 Seeding with development data...
# ✅ Ready!
#    Frontend: http://localhost:3030
#    Backend: http://localhost:3031
#    Database: media_tool_line_item_types:5462
```

### 4. Work in Isolation
```bash
cd .git-collabcollabiterations/line-item-types/

# All your original media-tool work is preserved here:
# - Line item types implementation
# - Annotations system
# - Type safety improvements
# - Everything from the iteration work

# Start services
bun run iteration:start
# Frontend: http://localhost:3030
# Backend: http://localhost:3031

# Continue development...
git add .
git commit -m "feat: complete line item types implementation"
```

### 5. Share via PR
```bash
git-collabiteration share line-item-types --title="Feature: Line Item Types for Standard Campaigns"
# 🪝 Running quality checks...
# ✅ Quality checks passed  
# 📤 Pushed iteration/line-item-types to origin
# ✅ Pull Request created: https://github.com/yourorg/media-tool/pull/123
```

### 6. List All Collabiterations
```bash
git-collabiteration list
# 🌳 Collabiterations:
# 🟡 line-item-types
#    Branch: iteration/line-item-types
#    Created: 6/25/2025
#    Frontend: http://localhost:3030
#    Backend: http://localhost:3031
#    Database: media_tool_line_item_types
```

## 🧠 Context Intelligence in Action

### Media-Tool Auto-Detection
When you run `git-collabiteration init` in the media-tool directory, it will:

1. **Detect Project Fingerprint**:
   - Git remote: `*/media-tool*`
   - Package.json: Workspaces, specific dependencies
   - Custom markers: `CLAUDE.md`, `Justfile`, `bunfig.toml`
   - Directory structure: `packages/`, `db/migrations/`, etc.

2. **Load Rich Context**:
   - PostgreSQL with Flyway migrations
   - Frontend (Vite + React) on port 3020+
   - Backend (Bun + Node.js) on port 3021+
   - Database schema isolation
   - Data seeding commands
   - Quality checks integration

3. **Configure Environment**:
   - Docker compose with dedicated database
   - Environment variables for all services
   - Package.json scripts for iteration management
   - PR templates with media-tool context

### Other Projects Auto-Adapt
For non-media-tool projects, it will:

1. **Analyze Structure**:
   - Detect React, Node, Docker, etc.
   - Find package.json scripts
   - Identify build systems

2. **Create Adaptive Context**:
   - Configure appropriate services
   - Allocate ports automatically  
   - Set up basic worktree workflow

3. **Learn and Improve**:
   - Save context for future use
   - Refine detection over time

## 🏆 Benefits Achieved

### ✅ **Clean Repository Separation**
- Media-tool repository stays clean and focused
- Iteration tool is independent and reusable
- No vendor lock-in to specific projects

### ✅ **Rich Context Preservation**  
- All your media-tool workflow knowledge is preserved
- Database seeding, port allocation, service configuration
- Quality checks, PR templates, environment setup

### ✅ **Universal Applicability**
- Works with any git repository
- Adapts to different project structures
- Team can use across multiple projects

### ✅ **True Isolation**
- Each iteration gets dedicated database schema
- Independent ports and environments
- Complete git worktree isolation

### ✅ **Professional Workflow**
- GitHub CLI integration for PRs
- Quality checks before sharing
- Rich PR templates with context

## 🔧 Advanced Features

### Multiple Projects
```bash
# Use with any project
cd /path/to/react-app/
git-collabiteration init
# ✅ Detected: React application with Vite

cd /path/to/node-api/  
git-collabiteration init
# ✅ Detected: Node.js API with Express

# Each gets appropriate configuration
```

### Team Collaboration
```bash
# Team member shares iteration
git checkout iteration/their-feature
git-collabiteration start their-feature
# Automatically detects and configures their environment
```

### Parallel Development
```bash
# Multiple collabiterations running simultaneously
git-collabiteration create feature-a    # Ports 3020-3021, DB 5462
git-collabiteration create feature-b    # Ports 3030-3031, DB 5472  
git-collabiteration create hotfix-auth  # Ports 3040-3041, DB 5482
# Each completely isolated
```

## 📂 Final Directory Structure

```
media-tool/                          # Clean main repository
├── packages/                        # Original project structure
├── db/                              # Original project structure  
├── docker-compose.yml               # Original configuration
├── .git-collabcollabiterations/                 # Worktrees live here
│   ├── line-item-types/            # Your iteration work preserved
│   ├── dashboard-redesign/          # Future collabiterations
│   └── mobile-responsive/           # More collabiterations
└── (clean main codebase)

git-collabiteration-manager/               # Standalone tool
├── bin/git-collabiteration.js            # Global CLI
├── contexts/media-tool/             # Rich media-tool context
├── src/                            # Tool implementation
└── (independent repository)
```

## 🎯 Next Steps

1. **Clean up media-tool** - Remove iteration files, return to clean state
2. **Install iteration manager globally** - Make available across projects  
3. **Initialize media-tool** - `git-collabiteration init` to detect and configure
4. **Create first iteration** - Migrate your line-item-types work
5. **Share and collaborate** - Use PR workflow for team review

You now have a **production-ready, context-aware collabiteration management system** that preserves all your workflow intelligence while keeping repositories clean and enabling use across any project!

---

🌳 **Independent. Intelligent. Infinitely Reusable.**