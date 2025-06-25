# Git Iteration Manager

Context-aware git worktree iteration manager that works with any project. Intelligently detects your project setup and provides rich, isolated development environments for feature iterations.

## 🌟 Features

- **🧠 Context-Aware**: Automatically detects and configures for different project types
- **🌳 Git Worktrees**: True git branch isolation with complete project copies  
- **🔒 Environment Isolation**: Dedicated databases, ports, and configurations per iteration
- **📤 PR Integration**: One-command sharing via GitHub pull requests
- **🎯 Rich Contexts**: Pre-built configurations for complex projects like media-tool
- **🚀 Auto-Setup**: Automatic dependency installation, database seeding, and service startup
- **🔧 Adaptive**: Works with any project structure, learns as you use it

## 📦 Installation

```bash
# Global installation
npm install -g git-iteration-manager

# Or with Bun
bun install -g git-iteration-manager

# Verify installation
git-iteration --version
```

## 🚀 Quick Start

### Initialize Any Project
```bash
cd /path/to/your-project/
git-iteration init
# → Auto-detects project type and creates context
```

### Create Development Iteration
```bash
git-iteration create feature-name --description="What you're building"
# → Creates isolated worktree with dedicated environment
```

### Start Working
```bash
git-iteration start feature-name
# → Starts all services with isolated ports and database
```

### Share via PR
```bash
git-iteration share feature-name --title="Feature: Amazing New Thing"
# → Creates GitHub PR with rich context and preview URLs
```

## 🧠 Context Intelligence

The iteration manager automatically detects your project and applies rich, pre-built configurations:

### Detected: Brkthru Media Tool
```bash
✅ Matched known project: Brkthru Media Tool
   Comprehensive media buying platform with React, Node.js, PostgreSQL
   
🔧 Configured:
   📊 Database: media_tool_feature_name (PostgreSQL with Flyway)
   🌐 Frontend: http://localhost:3020 (Vite + React)  
   🔧 Backend: http://localhost:3021 (Bun + Node.js)
   📦 Auto-seeding: Development data
   🎯 Quality checks: ESLint + TypeScript + Tests
```

### Detected: React Application
```bash
✅ Detected: React application with Vite
   
🔧 Configured:
   🌐 Frontend: http://localhost:3000 (Vite dev server)
   📦 Auto-install: npm/bun dependencies
   🔧 Build system: Vite build pipeline
```

### New Project
```bash
🔧 Building new project context...
   
📝 Interactive setup:
   → What type of project? (React, Node, Full-stack, Other)
   → Need database? (PostgreSQL, MySQL, None)  
   → Additional services? (Backend API, Docker, etc.)
```

## 📋 Command Reference

### Core Commands
| Command | Description |
|---------|-------------|
| `git-iteration init` | Initialize project for iteration management |
| `git-iteration create <name>` | Create new iteration with worktree |
| `git-iteration list` | List all iterations |
| `git-iteration start <name>` | Start iteration services |
| `git-iteration stop <name>` | Stop iteration services |
| `git-iteration share <name>` | Create PR for iteration |
| `git-iteration info <name>` | Show detailed iteration info |
| `git-iteration remove <name> --force` | Remove iteration |

### Creation Options
| Option | Description |
|--------|-------------|
| `--from <branch>` | Create from specific branch (default: main) |
| `--description <text>` | Add description to iteration |
| `--auto-start` | Start services immediately after creation |

### Sharing Options  
| Option | Description |
|--------|-------------|
| `--title <title>` | Custom PR title |
| `--description <text>` | Additional PR description |

## 🏗️ Project Contexts

### Media Tool Context (Rich)
Automatically detected for Brkthru Media Tool projects:

```json
{
  "database": {
    "type": "postgresql",
    "migrations": "flyway", 
    "seeding": {
      "demo": "bun run data:demo",
      "development": "bun run data:dev",
      "presentation": "bun run data:presentation"
    }
  },
  "services": {
    "frontend": "vite-react on port 3020+",
    "backend": "bun-node on port 3021+"
  },
  "features": [
    "Automatic Flyway migrations",
    "Rich data seeding options", 
    "Monorepo workspace support",
    "TypeScript + ESLint integration",
    "Docker compose isolation",
    "Quality checks before sharing"
  ]
}
```

### React App Context (Adaptive)
Auto-configured for React applications:

```json
{
  "services": {
    "frontend": "vite/webpack dev server"
  },
  "features": [
    "Hot reload development",
    "Build system integration",
    "Dependency auto-install"
  ]
}
```

### Generic Context (Learning)
Learns your project structure:

```json
{
  "services": {
    "main": "detected start command"
  },
  "features": [
    "Git worktree isolation",
    "Branch management", 
    "Basic PR workflow"
  ]
}
```

## 🎯 Rich Workflow Example (Media Tool)

```bash
# 1. Initialize (one-time per project)
cd /path/to/media-tool/
git-iteration init
# ✅ Matched known project: Brkthru Media Tool

# 2. Create feature iteration
git-iteration create dashboard-redesign --description="New dashboard UI"
# 🌿 Creating branch iteration/dashboard-redesign
# 🔨 Creating worktree at .git-iterations/dashboard-redesign  
# 📦 Installing dependencies...
# 🐳 Configuring Docker services...
# 📊 Database: media_tool_dashboard_redesign (port 5462)

# 3. Start development
git-iteration start dashboard-redesign
# 📊 Starting database...
# ⏳ Waiting for database to be ready...
# 🌱 Seeding with development data...
# ✅ Ready! Frontend: http://localhost:3030, Backend: http://localhost:3031

# 4. Develop normally
cd .git-iterations/dashboard-redesign/
# Work on your feature...
git add . && git commit -m "feat: new dashboard layout"

# 5. Share for review  
git-iteration share dashboard-redesign --title="🎨 New Dashboard Design"
# 🪝 Running quality checks...
# ✅ Quality checks passed
# 📤 Pushed iteration/dashboard-redesign to origin
# ✅ Pull Request created: https://github.com/yourorg/media-tool/pull/123

# 6. Clean up after merge
git-iteration remove dashboard-redesign --force
# ✅ Iteration removed, branch preserved for history
```

## 🔧 Advanced Usage

### Custom Project Setup
```bash
# Create iteration from specific branch
git-iteration create hotfix-auth --from=staging

# Auto-start after creation
git-iteration create experiment-ai --auto-start

# Multiple iterations in parallel
git-iteration create feature-a
git-iteration create feature-b  
git-iteration create feature-c
# Each gets isolated ports, databases, environments
```

### Team Collaboration
```bash
# Share team member's iteration
git checkout iteration/their-feature
git-iteration start their-feature
# Automatically detects context and starts their environment

# List all team iterations
git-iteration list
# Shows all active iterations with status and URLs
```

## 📂 Directory Structure

```
your-project/
├── .git-iterations/           # Worktrees live here  
│   ├── feature-a/            # Complete project copy
│   ├── feature-b/            # Independent environment
│   └── hotfix-auth/          # Isolated development
├── main project files...
└── .gitignore               # Auto-updated to ignore iteration files
```

## 🏆 Benefits Over Traditional Workflows

### vs. Branch Switching
- ✅ **No context switching** - Keep multiple features running
- ✅ **No stash/unstash** - Complete isolation of changes
- ✅ **No build conflicts** - Each iteration has own node_modules, build artifacts

### vs. Docker Dev Environments  
- ✅ **Full git integration** - Native branching and history
- ✅ **IDE compatibility** - Works with any editor/IDE
- ✅ **Faster setup** - No container builds or volumes

### vs. Manual Worktrees
- ✅ **Automatic configuration** - Database, ports, services auto-configured
- ✅ **Context awareness** - Rich setup for known projects
- ✅ **Team sharing** - PR workflow and documentation  

## 🤝 Contributing

```bash
git clone https://github.com/brkthru/git-iteration-manager
cd git-iteration-manager
bun install
bun run build

# Test with local installation
npm link
git-iteration --version
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file.

---

🌳 **Git Iteration Manager** - Context-aware development environments for any project!