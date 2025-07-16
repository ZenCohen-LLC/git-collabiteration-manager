# Collabiteration: {collabiterationName}

This PR contains the collabiteration work for **{collabiterationName}** on the Brkthru Media Tool.

## 🚀 Preview & Testing

**Frontend**: http://localhost:{frontendPort}  
**Backend**: http://localhost:{backendPort}  
**Database**: `{dbSchema}` on port {dbPort}

### Quick Start
```bash
# Clone and setup collabiteration
git checkout {collabiterationBranch}
bun install

# Start services  
bun run collabiteration:start

# Optional: Seed with demo data
bun run collabiteration:seed:demo
```

### Alternative Testing (Git Collabiteration Manager)
```bash
# Using the collabiteration manager
git-collabiteration start {collabiterationName}
```

## 🗂️ Project Context

**Project Type**: Media Buying & Campaign Management Platform  
**Tech Stack**: TypeScript, React, Node.js, PostgreSQL, Docker  
**Architecture**: Monorepo (frontend/backend/shared packages)  

## 📊 Database & Data

- **Schema**: `{dbSchema}` (isolated from main database)
- **Migrations**: Flyway-managed migrations in `db/migrations/`
- **Seeding Options**:
  - `bun run collabiteration:seed` - Development data (default)
  - `bun run collabiteration:seed:demo` - Light demo data
  - `bun run collabiteration:seed:presentation` - Rich presentation data
  - `bun run collabiteration:seed:planning` - Planning stage examples

## 🧪 Quality Checks

```bash
# Run all quality checks
bun run quality:check

# Individual checks
bun run lint:collabiteration      # ESLint
bun run typecheck:collabiteration # TypeScript
bun run test:collabiteration      # Jest tests
```

## 📝 Collabiteration Metadata

- **Created**: {createdDate}
- **Branch**: `{collabiterationBranch}`
- **Collabiteration Manager**: git-collabiteration-manager v{version}
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

🤖 **Generated with [Git Collabiteration Manager](https://github.com/brkthru/git-collabiteration-manager)**

Co-Authored-By: Git Collabiteration Manager <noreply@brkthru.com>