# Authentication Bypass Troubleshooting Guide

This guide helps resolve issues when TEST_MODE authentication bypass isn't working in your iteration.

## Problem: Still seeing login screen despite TEST_MODE=true

### Solution Steps

1. **Verify Environment Configuration**
   ```bash
   # Check that TEST_MODE is set correctly
   grep TEST_MODE .env
   # Expected output: TEST_MODE=true
   ```

2. **Check Test User Existence**
   ```bash
   # Replace [DB_NAME] with your iteration's database name
   docker exec media-tool-postgres-1 psql -U postgres -d [DB_NAME] \
     -c "SELECT * FROM media_tool.users WHERE email='test@mail.com';"
   ```

3. **Create Test User If Missing**
   ```bash
   # Replace [DB_NAME] with your iteration's database name
   docker exec media-tool-postgres-1 psql -U postgres -d [DB_NAME] \
     -c "SET search_path TO media_tool, public; \
          INSERT INTO users (id, name, email, zoho_user_id, created_at, updated_at) \
          VALUES ('11111111-1111-1111-1111-111111111111', 'Test User', \
                  'test@mail.com', 'test-zoho-id', NOW(), NOW()) \
          ON CONFLICT (email) DO NOTHING;"
   ```

4. **Fix Database Schema Issues**
   
   If you see errors like "relation 'users' does not exist", the backend may not be using the correct schema. You need to:
   
   a. Update the database connection to set the search_path:
      - Edit `packages/backend/src/db/postgres.ts`
      - Add initialization options to set search_path to `media_tool, public`
   
   b. Update queries to use schema prefix:
      - Find queries like `FROM users` and change to `FROM media_tool.users`
      - Common files that need updates:
        - `packages/backend/src/services/users.ts`
        - Other service files with database queries

5. **Restart Backend Service**
   ```bash
   # Kill existing backend process
   ps aux | grep "bun.*backend" | grep -v grep | awk '{print $2}' | xargs kill -9
   
   # Restart backend
   bun run dev:backend > backend.log 2>&1 &
   ```

6. **Verify Auth Bypass is Working**
   ```bash
   # Test the auth status endpoint
   curl -s http://localhost:3001/auth/status
   
   # Expected response should include test user details:
   # {"id":"test","email":"test@mail.com","name":"Test User",...}
   ```

## Common Issues

### Issue: "Could not find test user" in backend logs
**Solution**: The test user doesn't exist in the database. Follow step 3 above to create it.

### Issue: "relation 'users' does not exist" errors
**Solution**: The database queries aren't using the schema prefix. Follow step 4 above.

### Issue: Backend crashes on startup
**Solution**: Check `backend.log` for specific errors. Common causes:
- Missing environment variables
- Database connection issues
- Port conflicts

## Prevention for Future Iterations

To prevent this issue in new iterations:

1. The post-create hook should automatically create the test user
2. Database queries should use schema prefixes by default
3. The STARTUP.md should include troubleshooting steps

## Related Documentation

- [STARTUP.md Template](../contexts/media-tool/templates/STARTUP.md.template)
- [Post-Create Hook](../contexts/media-tool/hooks/post-create.ts)
- [Iterate Workflow](./ITERATE_WORKFLOW.md)