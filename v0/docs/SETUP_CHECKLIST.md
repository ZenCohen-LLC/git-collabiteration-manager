# Git Collabiteration Setup Checklist

## Essential Environment Setup Steps

### ✅ Docker Compose Configuration
```yaml
# ALL placeholders MUST be defined:
FLYWAY_PLACEHOLDERS_GRAFANA_READER_PASSWORD: test_password
FLYWAY_PLACEHOLDERS_SNOWFLAKE_LOADER_PASSWORD: test_password
FLYWAY_PLACEHOLDERS_SNOWFLAKE_LOADER_USER_PASSWORD: test_password
FLYWAY_PLACEHOLDERS_MEDIA_TOOL_USER_PASSWORD: pass
FLYWAY_PLACEHOLDERS_MEDIA_TOOL_DB_NAME_SUFFIX: ""
```

### ✅ Backend Configuration
Update `packages/backend/src/index.ts`:
```typescript
const port = process.env.PORT || 3001;
appServer.listen(port, () => logger.info(`App listening at http://localhost:${port}`));
```

### ✅ Frontend Proxy Configuration
Update `packages/frontend/vite.config.mjs`:
```javascript
proxy: {
  '/api': process.env.VITE_API_URL || 'http://localhost:3001',
  '/auth': process.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001',
  '/download': process.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'
}
```

### ✅ Database Setup Sequence
1. Start postgres container
2. Wait for health check
3. Run migrations with placeholders
4. Create and configure media_tool user:
   ```sql
   ALTER USER media_tool WITH PASSWORD 'pass';
   GRANT ALL PRIVILEGES ON SCHEMA media_tool TO media_tool;
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA media_tool TO media_tool;
   GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA media_tool TO media_tool;
   ```

### ✅ Test User Creation
Must include ALL required fields:
```sql
INSERT INTO media_tool.users (id, email, name, zoho_user_id, created_at, updated_at) 
VALUES (gen_random_uuid(), 'test@mail.com', 'Test User', 'test-zoho-id', NOW(), NOW()) 
ON CONFLICT (email) DO UPDATE SET zoho_user_id = 'test-zoho-id';
```

### ✅ Environment Variables
```bash
# Backend
DB_PORT=[custom_port]  # e.g., 5433
PORT=[backend_port]    # e.g., 3002
TEST_MODE=true

# Frontend
VITE_API_URL=http://localhost:[backend_port]/api
VITE_PORT=[frontend_port]  # e.g., 5174
```

## Common Failures and Solutions

| Issue | Solution |
|-------|----------|
| "password authentication failed for user 'media_tool'" | Run database permission setup |
| "Expected string, received null" for zoho_user_id | Ensure test user has zoho_user_id field |
| Frontend shows login screen | Check TEST_MODE=true and restart backend |
| Backend runs on wrong port | Update index.ts to use PORT env variable |
| Flyway migration fails | Add ALL required placeholders |

## Validation Script
```bash
# Quick health check
curl -s http://localhost:[backend_port]/auth/status | grep -q "test@mail.com" && echo "✅ Auth working" || echo "❌ Auth failed"
```