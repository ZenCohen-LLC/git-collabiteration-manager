#!/bin/bash
# Universal health check script for all iterations

# Load configuration from environment or use defaults
ITERATION_NAME="${ITERATION_NAME:-unknown}"
FRONTEND_PORT="${FRONTEND_PORT:-5180}"
BACKEND_PORT="${BACKEND_PORT:-3010}"
DB_PORT="${DB_PORT:-5440}"

echo "🏥 Health Check Report - ${ITERATION_NAME}"
echo "======================================"
echo ""

# Track overall health
HEALTH_STATUS="healthy"

# 1. Docker Check
echo "🐳 Docker Status:"
if ! docker info > /dev/null 2>&1; then
  echo "   ❌ Docker is not running"
  echo "   💡 Start Docker Desktop and try again"
  HEALTH_STATUS="critical"
  exit 1
else
  echo "   ✅ Docker is running"
fi
echo ""

# 2. Database Check
echo "🗄️  Database Status:"
CONTAINER_NAME="${ITERATION_NAME}-postgres"

if docker ps --format "table {{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
  echo "   ✅ Container: Running"
  
  # Check if database is ready
  if docker exec ${CONTAINER_NAME} pg_isready -U postgres > /dev/null 2>&1; then
    echo "   ✅ PostgreSQL: Ready"
    
    # Check media_tool user
    if docker exec ${CONTAINER_NAME} psql -U media_tool -d media_tool -c "SELECT 1" > /dev/null 2>&1; then
      echo "   ✅ Auth: media_tool user working"
    else
      echo "   ❌ Auth: media_tool user not working"
      echo "   💡 Run: docker exec ${CONTAINER_NAME} psql -U postgres -d media_tool -c \"ALTER USER media_tool WITH PASSWORD 'pass';\""
      HEALTH_STATUS="degraded"
    fi
    
    # Check test user
    TEST_USER_EXISTS=$(docker exec ${CONTAINER_NAME} psql -U postgres -d media_tool -t -c "SELECT COUNT(*) FROM media_tool.users WHERE email='test@mail.com';" 2>/dev/null | tr -d ' ')
    if [ "$TEST_USER_EXISTS" = "1" ]; then
      echo "   ✅ Test User: Exists (test@mail.com)"
    else
      echo "   ❌ Test User: Not found"
      echo "   💡 Creating test user..."
      docker exec ${CONTAINER_NAME} psql -U postgres -d media_tool -c "
        INSERT INTO media_tool.users (id, email, name, zoho_user_id, created_at, updated_at) 
        VALUES (gen_random_uuid(), 'test@mail.com', 'Test User', 'test-zoho-id', NOW(), NOW()) 
        ON CONFLICT (email) DO UPDATE SET zoho_user_id = 'test-zoho-id';" > /dev/null 2>&1
      echo "   ✅ Test User: Created"
    fi
    
    # Check test campaigns
    CAMPAIGN_COUNT=$(docker exec ${CONTAINER_NAME} psql -U postgres -d media_tool -t -c "SELECT COUNT(*) FROM media_tool.campaigns WHERE name LIKE '%Test Campaign%';" 2>/dev/null | tr -d ' ')
    if [ -n "$CAMPAIGN_COUNT" ] && [ "$CAMPAIGN_COUNT" -gt "0" ]; then
      echo "   ✅ Test Data: ${CAMPAIGN_COUNT} test campaigns found"
    else
      echo "   ⚠️  Test Data: No test campaigns found"
      echo "   💡 Run: ./scripts/setup-test-data.sh"
    fi
  else
    echo "   ❌ PostgreSQL: Not ready"
    HEALTH_STATUS="degraded"
  fi
else
  echo "   ❌ Container: Not running"
  echo "   💡 Run: docker compose -f docker-compose.${ITERATION_NAME}.yml up -d postgres"
  HEALTH_STATUS="degraded"
fi
echo ""

# 3. Backend Check
echo "🔧 Backend Status:"
if curl -s -f http://localhost:${BACKEND_PORT}/auth/status > /dev/null 2>&1; then
  echo "   ✅ Service: Running on port ${BACKEND_PORT}"
  
  # Check TEST_MODE
  AUTH_RESPONSE=$(curl -s http://localhost:${BACKEND_PORT}/auth/status 2>/dev/null)
  if echo "$AUTH_RESPONSE" | grep -q "test@mail.com"; then
    echo "   ✅ Auth Bypass: TEST_MODE working"
  else
    echo "   ❌ Auth Bypass: TEST_MODE not working"
    echo "   💡 Check .env file has TEST_MODE=true"
    echo "   💡 Restart backend after fixing"
    HEALTH_STATUS="degraded"
  fi
  
  # Check API health
  if curl -s -f http://localhost:${BACKEND_PORT}/api/health > /dev/null 2>&1; then
    echo "   ✅ API: Healthy"
  else
    echo "   ⚠️  API: Health endpoint not responding"
  fi
else
  echo "   ❌ Service: Not running on port ${BACKEND_PORT}"
  echo "   💡 Check backend logs: tail -f backend.log"
  HEALTH_STATUS="degraded"
fi
echo ""

# 4. Frontend Check
echo "🎨 Frontend Status:"
if curl -s -f http://localhost:${FRONTEND_PORT}/ > /dev/null 2>&1; then
  echo "   ✅ Service: Running on port ${FRONTEND_PORT}"
  
  # Check if frontend can reach backend
  if curl -s http://localhost:${FRONTEND_PORT}/ | grep -q "api.*${BACKEND_PORT}"; then
    echo "   ✅ Proxy: Configured for backend port ${BACKEND_PORT}"
  else
    echo "   ⚠️  Proxy: May not be configured correctly"
  fi
else
  echo "   ❌ Service: Not running on port ${FRONTEND_PORT}"
  echo "   💡 Check frontend logs: tail -f frontend.log"
  HEALTH_STATUS="degraded"
fi
echo ""

# 5. Port Usage Summary
echo "📊 Port Allocation:"
echo "   Frontend: ${FRONTEND_PORT} $(lsof -ti:${FRONTEND_PORT} > /dev/null 2>&1 && echo "✅ IN USE" || echo "⚠️  AVAILABLE")"
echo "   Backend:  ${BACKEND_PORT} $(lsof -ti:${BACKEND_PORT} > /dev/null 2>&1 && echo "✅ IN USE" || echo "⚠️  AVAILABLE")"
echo "   Database: ${DB_PORT} $(lsof -ti:${DB_PORT} > /dev/null 2>&1 && echo "✅ IN USE" || echo "⚠️  AVAILABLE")"
echo ""

# 6. Claude Flow Status (if available)
if command -v claude-flow > /dev/null 2>&1; then
  echo "🤖 Claude Flow Status:"
  if npx claude-flow@alpha swarm status 2>/dev/null | grep -q "active"; then
    echo "   ✅ Swarm: Active"
  else
    echo "   ⚠️  Swarm: Not initialized"
    echo "   💡 Run: npx claude-flow@alpha swarm init --topology hierarchical"
  fi
  echo ""
fi

# 7. Summary
echo "======================================"
case $HEALTH_STATUS in
  "healthy")
    echo "✅ All systems operational!"
    echo ""
    echo "🌐 Access your iteration at: http://localhost:${FRONTEND_PORT}/"
    echo "📧 Logged in as: test@mail.com"
    exit 0
    ;;
  "degraded")
    echo "⚠️  Some services need attention"
    echo ""
    echo "💡 Quick fixes:"
    echo "   - Run './scripts/start-iteration.sh' to start missing services"
    echo "   - Check logs in backend.log and frontend.log"
    echo "   - Ensure Docker Desktop is running"
    exit 1
    ;;
  "critical")
    echo "❌ Critical issues detected"
    echo ""
    echo "🚨 Start Docker Desktop and run './scripts/start-iteration.sh'"
    exit 2
    ;;
esac