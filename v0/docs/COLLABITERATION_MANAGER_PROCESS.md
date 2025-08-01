# Collabiteration Manager Process

## Overview
This document defines the standard process for creating and managing collabiterations in the Fresh Bravo media-tool project.

## Process Steps

When a user says they want to start a new iteration, follow these steps:

### 1. Initial Query
- **Ask what the iteration is about** if not mentioned
- Example: "What feature or problem will this iteration address?"

### 2. Directory Setup
- The collabiteration tool creates an isolated instance in `/collabiterations/[iteration-name]/`
- This is a complete, independent copy of your codebase using **git worktrees**
- Each iteration directory contains:
  - `ITERATION_PLAN.md` - The iteration documentation
  - Full project instance - Complete isolated codebase
  - All project files - packages/, docker-compose.yml, etc.
- Use descriptive kebab-case naming (e.g., `custom-pacing-enhancements`, `user-auth-improvements`)
- Example: `/collabiterations/custom-pacing-enhancements/`

### 3. Create Iteration Plan File
- Create an `ITERATION_PLAN.md` file within the iteration directory
- Path: `/collabiterations/[iteration-name]/ITERATION_PLAN.md`
- This file lives alongside the actual code in the same directory

### 4. Set Planning Mode
- Switch to planning mode to focus on requirements gathering and design

### 5. Gather Requirements
Prompt for and document:
- **User**: Who has the problem? (e.g., Account Managers, Campaign Managers)
- **Problem**: What specific issue are they facing?
- **Impact**: What is the business/time/efficiency impact?
- **Solution**: What is the proposed solution approach?
- **Code Areas**: Ask "What part of the experience/codebase will this iteration involve?"
  - Use this to explore relevant files and understand current implementation
  - Document the existing code structure and patterns
  - Add this context to the iteration documentation

**Before proceeding**: 
- Check if you have the latest version of the repository
- If not, pull the latest changes to ensure iteration starts from current code
- Verify: `git pull origin main` to get latest updates

### 6. Collect Resources
Prompt for:
- Existing documentation links
- Figma design resources
- Related Jira tickets
- Any other relevant materials

### 7. Develop Implementation Plan
Work iteratively with the user to:
- Define technical approach
- Break down into phases/priorities
- Identify components to create/modify
- Plan testing strategy
- Set success criteria

**CRITICAL RULES**: 
1. **Figma Integration**: If user provides Figma designs:
   - Place links DIRECTLY in the relevant implementation step
   - MUST access and review designs BEFORE implementing
   - Include specific design requirements in each phase
   - Never put designs in an appendix - they go with the implementation steps

2. **Testing is Mandatory**: Every implementation phase MUST include:
   - Unit tests for new functions and components
   - Integration tests for feature workflows
   - Playwright E2E tests for user-facing functionality
   - Performance tests where applicable
   - Testing is not optional - it's part of the implementation

### 8. Document Everything
All information gathered must be documented in the `ITERATION_PLAN.md` file as you go, including:
- Problem context
- Solution overview
- Implementation phases
- Technical specifications
- Testing requirements

### 9. Execute Iteration Plan
Once planning is complete and documented:
- Create the collabiteration using `gcm create [iteration-name]`
- This creates a new **git worktree** - a complete, isolated copy of your project
- Each worktree has its own working directory, branch, and uncommitted changes
- Set up the isolated environment with dedicated ports and database
- Populate the iteration assistant with the full plan
- Launch parallel agents for different priorities as needed
- Track all changes and progress in the iteration assistant
- Test thoroughly in the isolated environment without affecting main codebase

### 10. Submit Work via Pull Request
Once the iteration is complete and tested:
- Use `gcm share [iteration-name] --title "Feature: [description]"`
- This creates a PR from your iteration to the media-tool GitHub repository
- The PR includes:
  - All code changes from the iteration
  - Testing instructions from ITERATION_PLAN.md
  - Iteration metadata (who, what, why, impact)
  - Links to Jira tickets and Figma designs
- Team reviews the PR like any other feature branch
- Once merged, the iteration becomes part of media-tool
- No separate iterations repository needed - everything flows through PRs

## Standard Plan Structure

Every iteration plan MUST start with:

```markdown
## Implementation Stages

### Stage 1: Iteration Setup & Verification
1. **Create Collabiteration**
   - Name: `[iteration-name]`
   - Set up isolated development environment
   - Configure ports and dependencies

2. **Populate Iteration Assistant**
   - Copy this full plan to the Iteration Plan tab
   - Set up change logging structure in Iterations tab
   - Configure iteration metadata

3. **Local Environment Setup**
   - Start database with test data
   - Verify all services running (frontend, backend, DB)
   - Confirm access to iteration assistant
   - Embed iteration assistant in the development environment

4. **Stage 1 Testing**
   - Verify iteration is accessible at correct port
   - Confirm database has test data
   - Test navigation to relevant features
   - Verify no console errors
   - Confirm iteration assistant is tracking changes
```

## Critical Requirements

### Testing Is Mandatory
**RULE**: Every implementation phase MUST include comprehensive testing:
1. **No feature is complete without tests** - Testing is part of implementation, not a separate phase
2. **Required test types**:
   - Unit tests for all new functions and components
   - Integration tests for feature workflows
   - Playwright E2E tests for user-facing changes
   - Performance tests where applicable
3. **Test-Driven Development** encouraged where possible
4. **Each parallel agent** must deliver tested code
5. **Definition of Done** includes passing tests

### Iteration Assistant Integration
**IMPORTANT**: The process MUST include:
1. **Passing the full plan** from the `ITERATION_PLAN.md` file into the Plan tab of the iteration assistant
2. **Embedding the iteration assistant** in the collabiteration environment
3. **Setting up change tracking** in the Iterations tab to log all modifications
4. **Maintaining synchronization** between the plan file and the iteration assistant

### Documentation Standards
- Use clear markdown formatting
- Include code examples where relevant
- Reference specific file paths
- Document all design decisions
- Track changes and rationale

## Example Workflow

```
User: "I want to start a new iteration"
Assistant: "What feature or problem will this iteration address?"
User: "Custom pacing schedule enhancements for reducing AM setup time"
Assistant: "I'll set up a new collabiteration for this. Let me gather some details:
- Who is experiencing this problem?
- What specific issues are they facing?
- What's the impact on their workflow?"
[Continue gathering requirements...]
```

## Post-Setup Verification
After Stage 1 is complete, always:
1. Confirm the iteration is running locally
2. Verify the plan is loaded in the iteration assistant
3. Ensure change tracking is active
4. Get user confirmation before proceeding to development