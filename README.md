# Git Collabiteration Manager

A collaborative development tool that eliminates downstream thrash and enables design-in-code workflows. Built for teams of Principals who need to align early, explore solutions together, and compress the design→development pipeline.

## 🎯 The Problems We Solve

### Problem #1: Development Lead Time Through Misalignment

**The Current Reality:**
- Product Managers define solutions in isolation
- Detailed tickets are created without team input
- Days and weeks are spent haggling over approach and feasibility
- Client promises are made without proper scoping
- Designs become misaligned with what can actually be delivered

**The Root Cause:**
When Principals aren't part of understanding the problem and ideating solutions together, we have no idea what the cost and time to implement any solution actually is. This creates a disconnect between what's promised and what's deliverable.

### Problem #2: Principal Designer Trapped in Production Work

**The Current Reality:**
- Principal Designer spends too much time on Figma maintenance
- Complex apps have calculation ripple effects across workflows
- Tables and charts are time-intensive to keep updated
- Less time available for Principal-level work: strategy, user research, value definition

**The Root Cause:**
Traditional design workflows require detailed static designs that must then be translated to code, creating a bottleneck when you need to prototype complex, interconnected flows quickly.

## 🚀 The Solution: Collaborative Early Exploration

### Inclusive Ideation That Actually Works

Instead of thrashing later, invest hours or a day at the beginning to:

1. **Collectively understand the problem** to be solved
2. **Sketch out possible solutions** in a working version of the app  
3. **See features realized** even in crude form to understand effort
4. **Align on direction** before anyone writes detailed tickets
5. **Size and scope together** with full team context

### Design-in-Code Workflows

Enable "vibe design" where you:

1. **Create isolated app instances** for rapid prototyping
2. **Give Claude clear requirements** or Figma references  
3. **Prototype directly in working flows** rather than static designs
4. **Document and share** working implementations
5. **Possibly commit directly** - designs that are already implemented

## 🎨 How It Works in Practice

### Scenario 1: New Feature Exploration

```bash
# Team meeting: "We need to improve campaign budget allocation"

# Create exploration space
gcm create budget-allocation-exploration

# Everyone can now:
# - See the current flow in action
# - Prototype different approaches
# - Test with real data and calculations
# - Understand implementation complexity together
# - Align on what we're actually building

# Result: Team leaves with shared understanding of:
# - What we're solving
# - How we might solve it  
# - What the effort level is
# - Clear next steps
```

### Scenario 2: Design-in-Code Workflow

```bash
# Designer creates working prototype
gcm create margin-calculation-redesign

# In the collabiteration:
# - Reference Figma designs
# - Prototype directly in React components
# - Test calculation flows with real data
# - See ripple effects across workflows
# - Iterate with Claude Code assistance

# Result: Working implementation that can be:
# - Tested by the team
# - Refined collaboratively  
# - Potentially shipped directly
```

### Scenario 3: AI-Assisted Ideation

```bash
# Create Claude-ready version of the app
gcm create ai-ideation-session

# Give Claude context:
# - "Here's our current user flow"
# - "We need to improve X workflow"
# - "Reference this Figma design"
# - "Test with real data from our database"

# Claude helps you:
# - Implement ideas rapidly
# - Test different approaches
# - See calculation ripple effects
# - Understand implementation complexity
```

## 🛠️ Quick Start

### Installation
```bash
# Install from GitHub (recommended)
npm install -g https://github.com/ZenCohen-LLC/git-collabiteration-manager.git

# Or clone and install locally
git clone https://github.com/ZenCohen-LLC/git-collabiteration-manager.git
cd git-collabiteration-manager
npm install
npm run build
npm link
```

### Using with Claude Code (Recommended)

**⚠️ IMPORTANT: Always `cd` to your project directory first, NOT the git-collabiteration-manager directory!**

```bash
# First, go to YOUR PROJECT directory
cd /path/to/your-project  # e.g., cd ~/projects/media-tool

# Initialize the tool in your project
git-collabiteration init

# Then use Claude slash commands:
/iterate              # Start new iteration with Claude's guidance
/resume-iteration     # Continue existing iteration  
/remove-iteration     # Clean up completed iteration
```

### Working with the Collabiteration Tool - A User's Guide

#### Starting a New Iteration
When you use `/iterate` or tell Claude "I want to start a new iteration", here's what happens:

**1. Initial Conversation**
- Claude asks what feature or problem you want to work on
- You provide context about the issue

**2. Requirements Gathering**
Claude will prompt you for:
- **User**: Who is experiencing this problem? (e.g., Account Managers)
- **Problem**: What specific issues are they facing?
- **Impact**: How does this affect their work? (time, errors, efficiency)
- **Solution**: Your proposed approach to solve it
- Any existing documentation or Figma designs

**3. Planning Phase**
Claude works with you to develop:
- Technical implementation approach
- Breakdown into phases and priorities
- Component specifications
- Testing strategy
- Success criteria

All of this is documented in an iteration plan as you go.

**4. Environment Setup (Stage 1)**
Once planning is complete, Claude will:
- Create the collabiteration using `gcm create [iteration-name]`
- This creates a **git worktree** - an isolated, complete copy of your project
- Each iteration gets its own branch, working directory, and uncommitted changes
- Set up an isolated development environment with no impact on main codebase
- Configure dedicated ports and database
- Populate the iteration assistant with your plan
- Verify everything is working

**5. Development Phase**
After setup verification:
- Claude can launch multiple parallel agents for different priorities
- Each agent works on specific aspects of your feature
- Changes are tracked automatically in the iteration assistant
- Progress is logged as work proceeds

**6. Execute Iteration Plan**
Once development begins:
- Work in the isolated environment with full application functionality
- Test changes with dedicated database and services
- Make modifications without affecting main codebase
- Verify all features work as expected
- Run tests (unit, integration, and Playwright E2E)

**7. Submit Work via Pull Request**
When iteration is complete:
- Use `gcm share [iteration-name] --title "Feature: Description"`
- This creates a PR from your iteration branch to media-tool's main branch
- The PR automatically includes:
  - All code changes developed in isolation
  - Summary from ITERATION_PLAN.md
  - Testing instructions and success criteria
  - Links to related Jira tickets and Figma designs
- Team reviews the PR normally on GitHub
- Once approved and merged, your iteration becomes part of media-tool
- No separate iterations repository - just standard PR workflow

#### What to Expect

**Timeline:**
- Planning: 30-60 minutes depending on complexity
- Environment setup: 10-15 minutes
- Development: Varies by feature scope

**During the Process:**
- Be prepared with details about the problem
- Have design resources ready (Figma links, documentation)
- Think about how you'll measure success
- Consider testing requirements upfront

**Benefits:**
- No impact on main codebase until ready
- Clear plan documented before coding starts
- Ability to launch parallel development
- Automatic change tracking
- Easy rollback if needed

### Set Up Collaborative Exploration

```bash
# Install the tool
npm install -g https://github.com/ZenCohen-LLC/git-collabiteration-manager.git

# Initialize Claude Code in your project
cd /path/to/your-project
claude init

# Start a new iteration with Claude
# In your conversation with Claude, type:
/iterate

# Claude will guide you through:
# → Understanding the problem together
# → Documenting who's affected and how
# → Planning the technical approach
# → Creating the iteration with full isolation
# → Setting up database and ports

# The iteration is created in:
cd collabiterations/feature-exploration/
# → Make changes, test flows, see complexity
# → Align on approach before detailed work begins
# → Documentation and code live together
```

### Enable Design-in-Code

```bash
# Start a design iteration with Claude
# In your conversation with Claude, type:
/iterate

# Tell Claude you want to prototype a new workflow
# Provide:
# → Figma design links
# → Current workflow pain points
# → Desired improvements

# Claude creates the iteration and helps you:
# → Implement designs directly in React
# → Test with real data flows
# → See calculation ripple effects
# → Iterate rapidly with working code

# When ready, share via PR:
gcm share workflow-redesign --title="New workflow prototype"
# → Creates PR with working implementation
# → Team can test and provide feedback
```

## 🧠 How It Preserves Your Workflows

The collabiteration manager automatically detects your project and preserves all workflows:

### For React/TypeScript Projects
- ✅ Complete build toolchain (Vite, Webpack, etc.)
- ✅ Package manager lockfiles and node_modules
- ✅ ESLint, Prettier, TypeScript configurations
- ✅ Testing frameworks and configurations
- ✅ All custom scripts and workflows

### For Complex Applications (like Media Tool)
- ✅ Database with complete schema and migrations
- ✅ Multi-service architecture (frontend, backend, database)
- ✅ Environment isolation with dedicated ports
- ✅ Authentication and security configurations
- ✅ Integration with external APIs and services
- ✅ Custom build processes and deployment scripts

### For Any Git Repository
- ✅ Git history and branch management
- ✅ CI/CD configurations and workflows
- ✅ Documentation and README files
- ✅ License and contribution guidelines
- ✅ Issue templates and project management

## 💡 Key Features

### 🔄 True Isolation via Git Worktrees
- **Git worktrees** provide complete, isolated copies of your project
- Each iteration lives in `/collabiterations/[iteration-name]/` containing:
  - `ITERATION_PLAN.md` - Documentation and plan
  - Complete project copy - All source code and configs
  - Git branch for changes - Isolated from main
  - Build artifacts and dependencies - Separate node_modules, etc.
- **Dedicated databases** for each collabiteration
- **Isolated ports and services** - no conflicts
- **Independent environments** - break nothing in main codebase
- **Self-contained** - Documentation and code live together

### 🎯 Context Intelligence
- **Auto-detects project type** and applies appropriate configuration
- **Preserves complex workflows** including databases, multi-service setups
- **Rich templates** for known project patterns
- **Learning system** that improves over time

### 🚀 Team Collaboration
- **Shared collabiterations** that anyone can access
- **PR creation** with rich metadata and testing instructions
- **Quality checks** built into the workflow
- **Documentation** automatically generated

### 🤖 AI-Ready
- **Claude Code integration** for rapid prototyping
- **Real data access** for testing and validation
- **Working implementations** rather than static mockups
- **Rapid iteration** on complex workflows

## 🎯 Best Practices

### When to Use Collabiterations

✅ **Perfect for:**
- Early feature exploration with full team
- Design prototyping in complex workflows  
- Client demonstrations of working concepts
- Understanding implementation complexity
- AI-assisted ideation sessions

❌ **Not needed for:**
- Simple bug fixes or small changes
- Well-understood implementation tasks

### Team Collaboration Patterns

**Exploration Phase:**
1. Create shared collabiteration for team session
2. Prototype together to understand complexity
3. Align on approach before detailed work
4. Document decisions and rationale

**Design Phase:**
1. Create design collabiteration for prototyping
2. Use Claude Code to implement ideas rapidly
3. Test flows with real data and calculations
4. Share working prototypes for feedback

**Development Phase:**
1. Create feature collabiteration for implementation
2. Work in isolated environment without conflicts
3. Test thoroughly with dedicated database
4. Share via PR when ready for review

## 📋 Common Commands

### Basic Workflow
```bash
# Initialize Claude Code (one time)
claude init

# Start new iteration with Claude
/iterate
# → Claude guides you through planning
# → Creates iteration automatically
# → Sets up isolated environment

# Resume existing iteration
/resume-iteration
# → Shows available iterations
# → Loads context and continues work

# Share your work via PR to main project
gcm share feature-name --title="PR Title"
# → Creates PR to project GitHub
# → Team reviews like any feature branch
# → Merges into main when approved

# Clean up local iteration after merge
/remove-iteration
# → Claude helps remove iteration
# → Frees ports and resources
# → Cleans up git worktree
```

### Advanced Usage
```bash
# List all collabiterations
gcm list

# Switch between collabiterations
gcm switch feature-name

# Clone teammate's collabiteration
gcm clone teammate-feature

# Export collabiteration as package
gcm export feature-name

# Get help
gcm --help
gcm create --help
```

### Claude Code Commands
```bash
# Start a new iteration with guided planning
/iterate

# Resume an existing iteration
/resume-iteration

# Remove an iteration and clean up resources
/remove-iteration
```

## 📁 Repository Structure

### Git Collabiteration Manager (This Tool)
The `git-collabiteration-manager` repository contains:
- The gcm tool itself
- Command documentation (/iterate, /resume-iteration, /remove-iteration)
- Templates and contexts for different project types
- Generic, reusable across any project

**This repository does NOT contain your iterations** - teammates can check out this tool without getting your specific work.

### Your Project's Iterations
In your project (e.g., media-tool), iterations live in:
```
/your-project/
├── collabiterations/
│   ├── custom-pacing/
│   │   ├── ITERATION_PLAN.md      # Documentation
│   │   ├── packages/              # Full project instance
│   │   ├── docker-compose.yml     # Isolated services
│   │   └── ...                    # Complete codebase
│   ├── dashboard-redesign/
│   │   ├── ITERATION_PLAN.md
│   │   └── [full instance]
│   └── feature-xyz/
│       ├── ITERATION_PLAN.md
│       └── [full instance]
```

Each iteration is self-contained with its documentation and code together.

### Iteration Backup & Sharing Strategy
- **Local Development**: Iterations live in `/collabiterations/` during development
- **Backup/Sharing**: Use `gcm share` to create PRs to your project's GitHub
- **No Separate Repo**: Iterations flow through standard PR review process
- **After Merge**: Iteration code becomes part of main project history
- **Clean Local**: Use `gcm remove` to clean up local iterations after merge

## 🔧 Installation & Setup

### System Requirements
- Node.js 18+ and npm/yarn
- Git with worktree support
- Docker (for database isolation)
- Your project's specific requirements

### Global Installation
```bash
# Install from GitHub
npm install -g https://github.com/ZenCohen-LLC/git-collabiteration-manager.git

# Or with yarn
yarn global add https://github.com/ZenCohen-LLC/git-collabiteration-manager.git
```

### Project Setup
```bash
cd your-project/
gcm init
# Follow prompts to configure for your project type
```

## 🎉 Success Stories

> **"We went from 3 weeks of back-and-forth on feature scope to 2 hours of collaborative exploration. Everyone understood the complexity and we aligned on the right approach immediately."**
> 
> — Product Team Lead

> **"I can now prototype complex table calculations in working React components instead of spending days in Figma. The designs are already implemented when we're done exploring."**
> 
> — Principal Designer

> **"Claude Code + real app data = rapid prototyping superpowers. We can test ideas with actual calculations and see ripple effects immediately."**
> 
> — Senior Developer

## 🚀 Get Started

Ready to eliminate thrash and enable true collaboration?

```bash
# Install the tool
npm install -g https://github.com/ZenCohen-LLC/git-collabiteration-manager.git

# Initialize Claude Code in your project
cd your-project/
claude init

# Start your first iteration
# In conversation with Claude:
/iterate

# Claude will guide you through the entire process
```

Transform how your team builds software. Start today.

## 🔍 Known Project Setup Challenges

### Media Tool (Brkthru)

The Media Tool project has specific setup requirements that the tool handles automatically:

**Common Issues:**
1. **Authentication** - Requires `TEST_MODE=true` for local development
2. **Environment Variables** - Needs ~30+ specific env vars to start
3. **Database Schema** - Uses PostgreSQL schemas which affect data seeding
4. **Cross-Iteration Imports** - Some files reference other iterations

**Automated Fixes:**
- Comprehensive `.env` template with all required variables
- `TEST_MODE=true` set by default for iterations
- Cross-iteration imports fixed automatically
- Clear troubleshooting guide at `/contexts/media-tool/TROUBLESHOOTING.md`

**Quick Test:**
```bash
# After creating a Media Tool iteration:
curl http://localhost:3000  # Should load without auth
curl http://localhost:3001/api/buildInfo  # Should return data
```

### Adding Your Project

To add automated setup for your project:

1. Create context in `/contexts/your-project/`
2. Add comprehensive env template with ALL required variables
3. Create post-create hook to fix common issues
4. Document troubleshooting steps

The goal: **New iterations should "just work" without manual setup!**

---

*Built for teams who value alignment, rapid iteration, and getting the right thing built the first time.*