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

### Working with the Collabiteration Tool - A User's Guide

#### Starting a New Iteration
When you tell Claude "I want to start a new iteration", here's what happens:

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
- This packages the git worktree and creates a PR
- PR is submitted to media-tool's GitHub repository
- Includes testing instructions and iteration metadata
- Links to Jira tickets and documentation
- Ready for team review and merge

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
npm install -g git-collabiteration-manager

# Initialize your project (one-time)
cd /path/to/your-project
gcm init

# Create exploration space for your team
gcm create feature-exploration --description="Understanding the problem together"

# Start the isolated environment
gcm start feature-exploration
# → Full app running with dedicated database and ports

# Prototype together
cd .git-collabiterations/feature-exploration/
# → Make changes, test flows, see complexity
# → Align on approach before detailed work begins
```

### Enable Design-in-Code

```bash
# Create design collabiteration
gcm create workflow-redesign --description="Prototyping new user flow"

# Work with Claude Code in the collabiteration
# → Reference Figma designs
# → Implement directly in React
# → Test with real data flows
# → Iterate rapidly

# Share working prototype
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
- Each iteration is a separate worktree with its own:
  - Working directory (full project copy)
  - Git branch for changes
  - Uncommitted modifications
  - Build artifacts and dependencies
- **Dedicated databases** for each collabiteration
- **Isolated ports and services** - no conflicts
- **Independent environments** - break nothing in main codebase

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
# Initialize project (one time)
gcm init

# Create new collabiteration
gcm create feature-name --description="Brief description"

# Start working
gcm start feature-name

# Share your work
gcm share feature-name --title="PR Title"

# Clean up when done
gcm remove feature-name
# Or use Claude: /remove-iteration
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

## 🔧 Installation & Setup

### System Requirements
- Node.js 18+ and npm/yarn
- Git with worktree support
- Docker (for database isolation)
- Your project's specific requirements

### Global Installation
```bash
npm install -g git-collabiteration-manager
# or
yarn global add git-collabiteration-manager
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
npm install -g git-collabiteration-manager
cd your-project/
gcm init
gcm create first-exploration --description="Testing the waters"
gcm start first-exploration
```

Transform how your team builds software. Start today.

---

*Built for teams who value alignment, rapid iteration, and getting the right thing built the first time.*