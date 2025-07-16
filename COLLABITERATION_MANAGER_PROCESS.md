# Collabiteration Manager Process

## Overview
This document defines the standard process for creating and managing collabiterations in the Fresh Bravo media-tool project.

## Process Steps

When a user says they want to start a new iteration, follow these steps:

### 1. Initial Query
- **Ask what the iteration is about** if not mentioned
- Example: "What feature or problem will this iteration address?"

### 2. Directory Setup
- The collabiteration tool creates a subdirectory in `.git-collabiterations/` 
- Use descriptive kebab-case naming (e.g., `custom-pacing-enhancements`, `user-auth-improvements`)
- Example: `.git-collabiterations/custom-pacing-enhancements/`

### 3. Create Iteration Plan File
- Create an `ITERATION_PLAN.md` file within the iteration directory
- Path: `.git-collabiterations/[iteration-name]/ITERATION_PLAN.md`

### 4. Set Planning Mode
- Switch to planning mode to focus on requirements gathering and design

### 5. Gather Requirements
Prompt for and document:
- **User**: Who has the problem? (e.g., Account Managers, Campaign Managers)
- **Problem**: What specific issue are they facing?
- **Impact**: What is the business/time/efficiency impact?
- **Solution**: What is the proposed solution approach?

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

### 8. Document Everything
All information gathered must be documented in the `ITERATION_PLAN.md` file as you go, including:
- Problem context
- Solution overview
- Implementation phases
- Technical specifications
- Testing requirements

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