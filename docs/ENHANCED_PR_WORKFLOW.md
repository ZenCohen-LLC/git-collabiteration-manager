# Enhanced PR Workflow Documentation

The Git Collabiteration Manager now includes an intelligent PR creation system that automatically extracts content from your iteration files and generates rich, informative pull requests.

## 🚀 Key Features

### 1. **Automatic Content Extraction**
The system automatically scans your iteration files to extract:
- **Summary** from ITERATION_PLAN.md or README.md
- **Implementation details** from plan documents
- **Testing instructions** from TESTING.md or test sections
- **Success criteria** from iteration plans
- **Jira tickets** from markdown files and commit messages
- **Figma links** from documentation

### 2. **Quality Checks Integration**
Before creating a PR, the system runs:
- Unit tests (`bun test`)
- Linting checks (`bun run lint`)
- Type checking (`bun run typecheck`)

Results are automatically included in the PR description.

### 3. **Smart PR Generation**
The enhanced PR body includes:
- Extracted iteration summary
- Implementation details with bullet points
- Testing steps numbered sequentially
- Success criteria as checkboxes
- Progress tracking from iteration status
- Code change statistics
- Review focus areas based on file changes
- Related Jira tickets and Figma links
- Quality check results with pass/fail indicators
- Suggested labels based on content and changes

### 4. **Project-Specific Templates**
For known projects (like media-tool), the system uses rich templates with:
- Project context and tech stack
- Service URLs and ports
- Database information
- Custom testing commands
- Project-specific sections

## 📘 Usage

### Basic Usage
```bash
# Share iteration with automatic content extraction
gcm share my-feature --title "Feature: Awesome New Feature"
```

### Advanced Options
```bash
# Disable automatic content extraction
gcm share my-feature --no-extract

# Interactive mode (coming soon)
gcm share my-feature --interactive

# Force PR creation even if quality checks fail
gcm share my-feature --force

# Custom description
gcm share my-feature --description "This PR implements..."
```

## 🎯 Content Extraction Details

### Summary Extraction
The system looks for summary content in this order:
1. `## Summary` section in markdown files
2. `## Overview` section
3. `## Description` section
4. First paragraph after the main title

### Jira Ticket Detection
Automatically detects:
- Standard Jira format: `ABC-123`
- Jira URLs: `https://jira.company.com/browse/ABC-123`
- Explicit mentions: `ticket: ABC-123`
- Tickets in commit messages

### Testing Instructions
Extracts from:
- `TESTING.md` file
- `TEST_PLAN.md` file
- `## Testing` sections in any markdown
- Numbered or bulleted test steps

### Success Criteria
Looks for:
- `## Success Criteria` sections
- Bulleted lists of criteria
- Converts to GitHub checkboxes in PR

## 🔧 Configuration

### Project Context
Add quality check configuration to your project context:
```json
{
  "qualityChecks": {
    "enabled": true,
    "blockOnFailure": true,
    "commands": {
      "test": "bun test",
      "lint": "bun run lint",
      "typecheck": "bun run typecheck"
    }
  }
}
```

### Custom Templates
Place custom PR templates in:
- `contexts/[project-id]/templates/[project-id]-pr.md`
- `.github/pull_request_template.md` in your project

## 📋 Template Variables

The following variables are available in PR templates:

### Iteration Variables
- `{iterationName}` - Name of the iteration
- `{collabiterationName}` - Same as iterationName
- `{collabiterationBranch}` - Git branch name
- `{createdDate}` - ISO timestamp of creation
- `{version}` - Git Collabiteration Manager version

### Service Variables
- `{frontendPort}` - Frontend service port
- `{backendPort}` - Backend service port
- `{dbPort}` - Database port
- `{dbSchema}` - Database schema name

### Extracted Content Variables
- `{summary}` - Extracted summary
- `{implementation}` - Implementation details list
- `{testingSteps}` - Numbered testing instructions
- `{successCriteria}` - Success criteria checklist
- `{jiraTickets}` - Comma-separated Jira tickets
- `{figmaLinks}` - Newline-separated Figma URLs

### Progress Variables
- `{progressPercent}` - Overall progress percentage
- `{currentPhase}` - Current implementation phase

### Quality Check Variables
- `{testsIcon}` - ✅ or ❌ based on test results
- `{testsStatus}` - "Passed" or "Failed"
- `{lintingIcon}` - ✅ or ❌ based on linting
- `{lintingStatus}` - "Passed" or "Failed"
- `{typeCheckIcon}` - ✅ or ❌ based on type check
- `{typeCheckStatus}` - "Passed" or "Failed"

### Review Variables
- `{reviewFocusAreas}` - Bulleted list of areas to review
- `{suggestedLabels}` - Formatted label suggestions

## 🎨 Label Suggestions

The system automatically suggests labels based on:

### File Changes
- `tests` - If test files are modified
- `documentation` - If docs are changed
- `database` - If migrations are included
- `styling` - If CSS/SCSS files are modified

### Content Analysis
- `bug` - If Jira tickets contain "BUG"
- `enhancement` - If iteration name contains "feature"
- `refactor` - If iteration name contains "refactor"

### Size Labels
- `size/small` - Less than 100 lines changed
- `size/medium` - 100-500 lines changed
- `size/large` - More than 500 lines changed

## 🚧 Future Enhancements

### Interactive Mode (Coming Soon)
```bash
gcm share my-feature --interactive

? PR Title: Feature: Awesome New Feature
? Add description? Yes
? Description: This PR implements...
? Select labels: (space to select)
  ◯ enhancement
  ◯ bug
  ◯ documentation
? Assign reviewers? @teammate1, @teammate2
? Create as draft? No
```

### GitHub Integration
- Automatic reviewer assignment based on CODEOWNERS
- Project board integration
- Milestone assignment
- Auto-linking to issues

### AI Enhancement
- GPT-powered PR description generation
- Automatic code review summary
- Change impact analysis

## 🤝 Best Practices

1. **Write Good Iteration Plans**: The better your ITERATION_PLAN.md, the better your PR description
2. **Include Testing Docs**: Add TESTING.md for automatic test instruction extraction
3. **Reference Tickets**: Include Jira tickets in your markdown and commits
4. **Add Success Criteria**: Define clear success criteria in your plans
5. **Keep Commits Clean**: The system extracts tickets from commit messages

## 🐛 Troubleshooting

### Quality Checks Failing
If quality checks fail but you need to create a PR:
```bash
# Fix the issues first (recommended)
bun run lint --fix
bun test

# Or force PR creation
gcm share my-feature --force
```

### Content Not Extracted
Check that your files follow the expected patterns:
- Summary sections use standard markdown headers
- Jira tickets follow standard format
- Testing instructions are properly formatted

### Template Not Found
The system looks for templates in this order:
1. Project-specific template in contexts directory
2. GitHub PR template in project
3. Falls back to enhanced default template

---

The enhanced PR workflow makes sharing your iterations more informative and professional, helping reviewers understand your changes quickly and thoroughly.