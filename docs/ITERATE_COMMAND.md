# /iterate Command Documentation

## Overview
The `/iterate` command is a Claude Code slash command that guides users through creating a new collabiteration following best practices.

## Usage
Simply type `/iterate` in your conversation with Claude Code from your project directory.

**⚠️ IMPORTANT:** You must be in your project directory (e.g., media-tool), NOT in the git-collabiteration-manager directory!

## What It Does

When you use this command, Claude will:

1. **Check your current directory** - If you're in git-collabiteration-manager, ask you to cd to your project first
2. Ask if you need an explanation of the collabiteration tool
3. Gather requirements about your feature/problem
4. Document who's affected, the problem, impact, and solution
5. Collect any existing resources (Figma, docs, Jira tickets)
6. Help plan the technical approach
7. Define testing strategy
8. Create a complete iteration plan in `./collabiterations/[feature-name]/ITERATION_PLAN.md`
9. Prepare for Stage 1 execution

## Process Flow

### Initial Question
"Would you like to know how the collabiteration tool works?"
- Yes: Provides explanation of isolated environments, planning process, and benefits
- No: Proceeds directly to iteration setup

### Requirements Gathering
Prompts for:
- **Feature/Problem**: What iteration will address
- **User**: Who is experiencing the problem
- **Problem**: Specific issues being faced
- **Impact**: Time cost, errors, efficiency effects
- **Solution**: Proposed approach

### Resource Collection
Asks for:
- Figma designs or mockups
- Documentation or specifications
- Related Jira tickets
- Other relevant materials

### Technical Planning
- Components to create/modify
- Technical challenges
- Scope estimation

### Environment Setup
**CRITICAL**: Use the GIT_COLLABITERATION_SETUP_GUIDE.md as reference for:
- Docker compose configuration with ALL Flyway placeholders
- Backend port configuration (must use PORT env variable)
- Frontend proxy configuration (must use environment variables)
- Database user setup with correct permissions
- Test user creation with ALL required fields (email, name, zoho_user_id)
- Startup/shutdown/health-check scripts

### Testing Strategy
- Unit test requirements
- Integration test needs
- Playwright E2E test scenarios
- Success criteria

### Output
Creates a complete iteration plan following the standard structure with:
- Stage 1: Iteration Setup & Verification
- Stage 2: Verification Checkpoint  
- Stage 3: Parallel Development
- Full problem context and solution design
- Testing requirements for each phase

## Example Usage

```
User: /iterate

Claude: Would you like to know how the collabiteration tool works? (yes/no)

User: no

Claude: What feature or problem will this iteration address?

User: Custom pacing schedule enhancements to reduce time for Account Managers

Claude: Great! I'll help you set up a collabiteration for custom pacing schedule enhancements.
[... continues through the full process ...]
```

## Benefits
- Consistent iteration planning process
- Complete documentation before coding
- Clear problem/solution definition
- Integrated testing strategy
- Ready for parallel development

## Notes
- This is a Claude Code conversation command, not a shell command
- Works from any directory
- Creates standardized iteration structure
- Ensures all iterations follow best practices