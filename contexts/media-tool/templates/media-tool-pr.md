# Iteration: {iterationName}

This PR contains the iteration work for **{iterationName}** on the Brkthru Media Tool.

## 🚀 Preview & Testing

**Frontend**: http://localhost:{frontendPort}  
**Backend**: http://localhost:{backendPort}  
**Database**: `{dbSchema}` on port {dbPort}

### Quick Start
```bash
# Clone and setup iteration
git checkout {iterationBranch}
bun install

# Start services  
bun run iteration:start

# Optional: Seed with demo data
bun run iteration:seed:demo
```

### Alternative Testing (Git Iteration Manager)
```bash
# Using the iteration manager
git-iteration start {iterationName}
```

## 🗂️ Project Context

**Project Type**: Media Buying & Campaign Management Platform  
**Tech Stack**: TypeScript, React, Node.js, PostgreSQL, Docker  
**Architecture**: Monorepo (frontend/backend/shared packages)  

## 📊 Database & Data

- **Schema**: `{dbSchema}` (isolated from main database)
- **Migrations**: Flyway-managed migrations in `db/migrations/`
- **Seeding Options**:
  - `bun run iteration:seed` - Development data (default)
  - `bun run iteration:seed:demo` - Light demo data
  - `bun run iteration:seed:presentation` - Rich presentation data
  - `bun run iteration:seed:planning` - Planning stage examples

## 🧪 Quality Checks

```bash
# Run all quality checks
bun run quality:check

# Individual checks
bun run lint:iteration      # ESLint
bun run typecheck:iteration # TypeScript
bun run test:iteration      # Jest tests
```

## 📝 Iteration Metadata

- **Created**: {createdDate}
- **Branch**: `{iterationBranch}`
- **Iteration Manager**: git-iteration-manager v{version}
- **Context**: media-tool (auto-detected)

## 🔍 Code Review Notes

<!-- Add specific areas for reviewers to focus on -->

### Key Changes
- [ ] Frontend changes in `packages/frontend/`
- [ ] Backend changes in `packages/backend/`  
- [ ] Shared type changes in `packages/shared/`
- [ ] Database migrations in `db/migrations/`
- [ ] Configuration changes

### Testing Checklist
- [ ] Frontend builds and runs on port {frontendPort}
- [ ] Backend starts and connects to database
- [ ] Database migrations apply successfully
- [ ] All linting and type checks pass
- [ ] No regression in existing functionality

---

🤖 **Generated with [Git Iteration Manager](https://github.com/brkthru/git-iteration-manager)**

Co-Authored-By: Git Iteration Manager <noreply@brkthru.com>