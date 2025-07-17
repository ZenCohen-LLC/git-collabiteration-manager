# Media Tool Iteration Troubleshooting Guide

This guide helps resolve common issues when setting up Media Tool iterations.

## 🚨 Common Issues & Solutions

### 1. Authentication Errors (401 Unauthorized)

**Symptoms:**
- Frontend shows login screen when accessing http://localhost:3000
- Backend returns "Invalid accessToken" errors
- API calls fail with 401 status

**Solution:**
1. Check that `TEST_MODE=true` is set in your `.env` file
2. Restart the backend after changing the env file:
   ```bash
   # Kill existing backend
   pkill -f "bun packages/backend" || true
   
   # Restart with env loaded
   source .env && bun packages/backend/src/index.ts
   ```

### 2. Missing Environment Variables

**Symptoms:**
- Backend crashes with errors like:
  - `"undefined" is not a valid API_KEY`
  - `"undefined" is not a valid DATABASE_CREDS`
  - `"undefined" is not a valid TEST_MODE`

**Solution:**
1. Use the provided env template which includes ALL required variables
2. Critical variables that MUST be set:
   ```env
   TEST_MODE=true
   API_KEY=test-api-key-123
   ADMIN_PASSWORD=admin123
   DATABASE_CREDS='{"username":"postgres","password":"postgres"}'
   ```
3. The post-create hook should create this automatically

### 3. Database Connection Issues

**Symptoms:**
- `relation "users" does not exist`
- `relation "campaigns" does not exist`
- Data seeding fails with schema errors

**Root Cause:**
- Media Tool uses PostgreSQL schemas (`media_tool` schema)
- Seeding scripts don't always use the correct schema prefix

**Solution:**
1. Migrations should run automatically via Docker
2. Check if tables exist:
   ```bash
   docker exec custom-pacing-enhancements-postgres-1 psql -U postgres -d media_tool -c "SELECT count(*) FROM media_tool.campaigns;"
   ```
3. For now, work without seeded data or create test data manually in the UI

### 4. Cross-Iteration Import Errors

**Symptoms:**
- Frontend build fails with:
  ```
  Failed to resolve import "../../../iterations/iteration-ui-integration/..."
  ```

**Solution:**
1. The post-create hook should fix these automatically
2. If not, manually fix by commenting out cross-iteration imports:
   ```typescript
   // import { useAnnotations } from '../../../iterations/...'
   const addAnnotation = () => {}; // Mock implementation
   ```

### 5. Port Conflicts

**Symptoms:**
- `Error: listen EADDRINUSE: address already in use ::1:3000`
- Services fail to start

**Solution:**
1. Kill processes on conflicting ports:
   ```bash
   lsof -ti:3000 | xargs kill -9  # Frontend port
   lsof -ti:3001 | xargs kill -9  # Backend port
   lsof -ti:5432 | xargs kill -9  # Database port
   ```
2. Or use different ports in your iteration

### 6. Frontend Can't Connect to Backend

**Symptoms:**
- Frontend loads but API calls fail
- Network errors in browser console

**Solution:**
1. Ensure backend is running on the correct port
2. Check `VITE_BACKEND_URL` in `.env` matches backend port
3. Backend should be accessible at http://localhost:3001

## 🎯 Quick Setup Checklist

For a successful iteration setup:

- [ ] Docker is running
- [ ] `.env` file exists with `TEST_MODE=true`
- [ ] Database container is healthy: `docker ps`
- [ ] Backend starts without errors
- [ ] Frontend loads at http://localhost:3000
- [ ] No authentication required (bypassed by TEST_MODE)

## 📝 Manual Setup Steps

If the automated setup fails, here's the manual process:

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Create `.env` file with all required variables** (see env.media-tool.template)

3. **Start database:**
   ```bash
   bun run db:start
   # Wait ~10 seconds for migrations to complete
   ```

4. **Start backend (in one terminal):**
   ```bash
   source .env && bun packages/backend/src/index.ts
   ```

5. **Start frontend (in another terminal):**
   ```bash
   bun dev:frontend
   ```

6. **Access the app:**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

## 🔍 Debugging Commands

```bash
# Check running Docker containers
docker ps

# View backend logs
tail -f backend.log

# Check database tables
docker exec [container-name] psql -U postgres -d media_tool -c "\dt media_tool.*"

# Test backend health
curl http://localhost:3001/health

# Check environment variables are loaded
echo $TEST_MODE  # Should output: true
```

## 💡 Tips for Future Iterations

1. **Always set TEST_MODE=true** - This bypasses all authentication
2. **Don't rely on data seeding** - It has schema issues
3. **Fix cross-iteration imports immediately** - They break the build
4. **Use the comprehensive env template** - It has ALL required variables
5. **Check Docker is running first** - Many issues stem from this

## 🚀 If All Else Fails

1. Delete the iteration and recreate it
2. Ensure you're using the latest git-collabiteration-manager
3. Report persistent issues to improve the tool

Remember: The goal is to get you coding quickly, not fighting with setup!