# /iterate Command Workflow

## When user types /iterate:

### Step 1: Initial Question
```
Would you like to know how the collabiteration tool works? (yes/no)
```

**If YES**: Explain the process
```
The collabiteration tool creates isolated development environments for features:

🔄 **How it works:**
- Creates a complete copy of your project in an isolated workspace
- Sets up dedicated database, ports, and services
- Allows parallel development without conflicts
- Tracks all changes automatically

📋 **The Planning Process:**
1. We'll understand the problem together
2. Document who's affected and how
3. Design the solution approach
4. Break down into manageable phases
5. Set up testing requirements

🚀 **Benefits:**
- No impact on main codebase until ready
- Multiple developers can work in parallel
- Complete documentation trail
- Easy rollback if needed
- Integrated testing with Playwright

Ready to create your iteration? Let's begin!
```

**If NO**: Skip to Step 2

### Step 2: Gather Basic Information
```
What feature or problem will this iteration address?
```

Wait for user response, then:
```
Great! I'll help you set up a collabiteration for [their topic].

Let me create the directory structure...
✅ Created: /collabiterations/[iteration-name]/
✅ Created: /collabiterations/[iteration-name]/ITERATION_PLAN.md

Now let's gather some details about this iteration.
```

### Step 3: Requirements Gathering

```
Let's understand the problem better:

1. **Who is experiencing this problem?** 
   (e.g., Account Managers, Users, Developers)
```

After response:
```
2. **What specific issues are they facing?**
   Please describe the current pain points.
```

After response:
```
3. **What's the impact of this problem?**
   Consider: time cost, errors, efficiency, user satisfaction
```

After response:
```
4. **What's your proposed solution approach?**
   High-level description of how you want to solve this.
```

### Step 4: Collect Resources
```
Do you have any existing resources for this iteration?
- Figma designs or mockups
- Documentation or specs
- Related Jira tickets
- Other relevant materials

Please share any links or references (or type 'none' if starting fresh):
```

### Step 5: Technical Planning
```
Now let's plan the technical approach:

1. What components will need to be created or modified?
2. Are there any specific technical challenges to consider?
3. What's the expected scope? (small/medium/large)
```

### Step 6: Testing Strategy
```
Let's define the testing approach:

REMEMBER: Testing is NOT optional - it's part of every implementation!

1. What unit tests will be needed?
2. What integration tests should we include?
3. What Playwright E2E tests would verify success?
4. How will we know when this feature is working correctly?

Each implementation phase will include:
- Writing tests alongside the code
- Running tests to verify functionality
- No feature is "done" without passing tests
```

### Step 7: Confirm and Document
```
I've documented everything in your iteration plan. Here's a summary:

📋 **Iteration: [name]**
👥 **Users Affected**: [users]
❗ **Problem**: [problem summary]
💰 **Impact**: [impact summary]
✅ **Solution**: [solution summary]

The plan includes:
- [X] phases of implementation
- Complete technical specifications
- Testing requirements with Playwright
- Success criteria

The full plan is saved at: /collabiterations/[iteration-name]/ITERATION_PLAN.md

Ready to proceed with setting up the development environment? (yes/no)
```

### Step 8: Next Steps
**If YES**:
```
Great! The next step is to create the isolated development environment.

When you're ready to execute Stage 1, just let me know and I'll:
1. Create the collabiteration using gcm
2. Set up the isolated environment
3. Configure ports and database
4. Populate the iteration assistant
5. Verify everything is working

Just say "Let's execute Stage 1" when you're ready!
```

**If NO**:
```
No problem! Your iteration plan has been saved.

You can:
- Review the plan at: /collabiterations/[iteration-name]/ITERATION_PLAN.md
- Make any adjustments needed
- Come back to execute when ready

Just let me know when you want to proceed!
```

## Workflow Implementation Notes

Throughout this process:
- ✅ Document everything in ITERATION_PLAN.md as we go
- ✅ Use the exact Stage 1 template structure
- ✅ Include testing requirements for each phase
- ✅ Set up for parallel agent development
- ✅ Maintain conversational, helpful tone
- ✅ Guide user through each step clearly