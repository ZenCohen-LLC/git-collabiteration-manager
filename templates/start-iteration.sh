#!/bin/bash
# Universal startup script for all iterations
set -e

# Configuration
ITERATION_NAME="{iterationName}"
DB_PORT={dbPort}
BACKEND_PORT={backendPort}
FRONTEND_PORT={frontendPort}

echo "🚀 Starting ${ITERATION_NAME} iteration..."
echo ""

# Navigate to iteration directory
cd "$(dirname "$0")/.."

# 1. Pre-flight checks
echo "✈️  Pre-flight checks..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

# Check for port conflicts
for port in $FRONTEND_PORT $BACKEND_PORT $DB_PORT; do
    if lsof -ti:$port > /dev/null 2>&1; then
        echo "⚠️  Port $port is already in use"
        PID=$(lsof -ti:$port)
        echo "   Process using it: $(ps -p $PID -o comm=)"
        echo "   Kill it with: kill -9 $PID"
        echo ""
    fi
done

# 2. Environment setup
echo "🔧 Setting up environment..."
if [ ! -f .env ]; then
    cp .env.template .env
    echo "✅ Created .env file with TEST_MODE=true"
else
    # Ensure TEST_MODE is set
    if ! grep -q "TEST_MODE=true" .env; then
        echo "TEST_MODE=true" >> .env
        echo "✅ Added TEST_MODE=true to .env"
    fi
fi

# 3. Start database
echo ""
echo "🗄️  Starting database..."
docker compose -f docker-compose.${ITERATION_NAME}.yml up -d postgres

# 4. Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
MAX_ATTEMPTS=30
ATTEMPT=0
while ! docker compose -f docker-compose.${ITERATION_NAME}.yml exec postgres pg_isready -U postgres > /dev/null 2>&1; do
    ATTEMPT=$((ATTEMPT + 1))
    if [ $ATTEMPT -gt $MAX_ATTEMPTS ]; then
        echo "❌ Database failed to start after 30 seconds"
        docker compose -f docker-compose.${ITERATION_NAME}.yml logs postgres
        exit 1
    fi
    printf "."
    sleep 1
done
echo " Ready!"

# 5. Run migrations
echo ""
echo "🔄 Running database migrations..."
docker compose -f docker-compose.${ITERATION_NAME}.yml --profile setup run --rm flyway migrate || {
    echo "⚠️  Some migrations may have already been applied, continuing..."
}

# 6. Setup database permissions and test user
echo ""
echo "🔐 Setting up database access..."
docker compose -f docker-compose.${ITERATION_NAME}.yml exec postgres psql -U postgres -d media_tool << EOF > /dev/null 2>&1
-- Ensure media_tool user has correct password and permissions
ALTER USER media_tool WITH PASSWORD 'pass';
GRANT ALL PRIVILEGES ON SCHEMA media_tool TO media_tool;
GRANT ALL PRIVILEGES ON SCHEMA cds TO media_tool;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA media_tool TO media_tool;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA media_tool TO media_tool;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cds TO media_tool;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA cds TO media_tool;

-- Create test user if not exists
INSERT INTO media_tool.users (id, email, name, zoho_user_id, created_at, updated_at) 
VALUES (gen_random_uuid(), 'test@mail.com', 'Test User', 'test-zoho-id', NOW(), NOW()) 
ON CONFLICT (email) DO UPDATE SET 
    zoho_user_id = 'test-zoho-id',
    updated_at = NOW();
EOF
echo "✅ Database permissions configured"
echo "✅ Test user created/updated"

# 7. Run test data setup
echo ""
echo "📊 Setting up test data..."
if [ -f ./scripts/setup-test-data.sql ]; then
    docker compose -f docker-compose.${ITERATION_NAME}.yml exec postgres psql -U postgres -d media_tool < ./scripts/setup-test-data.sql > /dev/null 2>&1
    echo "✅ Test campaigns and data created"
else
    # Inline test data creation if script doesn't exist
    docker compose -f docker-compose.${ITERATION_NAME}.yml exec postgres psql -U postgres -d media_tool << 'EOF' > /dev/null 2>&1
DO $$
DECLARE
  stage_record RECORD;
  campaign_num INT;
  campaign_id UUID;
BEGIN
  -- Create 2 campaigns for each stage
  FOR stage_record IN 
    SELECT unnest(enum_range(NULL::media_tool.campaign_stage)) as stage
  LOOP
    FOR campaign_num IN 1..2 LOOP
      campaign_id := gen_random_uuid();
      
      INSERT INTO media_tool.campaigns (
        id, name, stage, campaign_number,
        agency_gross_margin_pct, referral_partner_commission_pct,
        created_at, updated_at
      ) VALUES (
        campaign_id,
        stage_record.stage || ' Test Campaign ' || campaign_num,
        stage_record.stage,
        'TEST-' || substring(campaign_id::text, 1, 8),
        CASE WHEN campaign_num = 1 THEN 0.15 ELSE 0 END,
        CASE WHEN campaign_num = 2 THEN 0.10 ELSE 0 END,
        NOW(), NOW()
      ) ON CONFLICT DO NOTHING;
      
      -- Add standard line items
      INSERT INTO media_tool.line_items (
        id, campaign_id, name, line_item_type, 
        impressions, net_unit_cost,
        created_at, updated_at
      )
      VALUES 
        (gen_random_uuid(), campaign_id, 'Standard Display', 'standard', 100000, 10.00, NOW(), NOW()),
        (gen_random_uuid(), campaign_id, 'Management Fee', 'management_fee', 0, 1500.00, NOW(), NOW()),
        (gen_random_uuid(), campaign_id, 'Zero Dollar Social', 'zero_dollar', 50000, 0.00, NOW(), NOW())
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;
EOF
    echo "✅ Test campaigns created inline"
fi

# 8. Install dependencies if needed
if [ ! -d "node_modules" ] || [ ! -d "packages/backend/node_modules" ]; then
    echo ""
    echo "📦 Installing dependencies..."
    bun install
    echo "✅ Dependencies installed"
fi

# 9. Update backend to use PORT environment variable
echo ""
echo "🔧 Configuring backend..."
if [ -f "packages/backend/src/index.ts" ]; then
    # Check if backend already uses process.env.PORT
    if ! grep -q "process.env.PORT" packages/backend/src/index.ts; then
        # Create a backup
        cp packages/backend/src/index.ts packages/backend/src/index.ts.bak
        
        # Update to use PORT env var
        sed -i '' 's/listen(3001/listen(process.env.PORT || 3001/g' packages/backend/src/index.ts
        sed -i '' 's/localhost:3001/localhost:\${process.env.PORT || 3001}/g' packages/backend/src/index.ts
        echo "✅ Backend configured to use PORT environment variable"
    fi
fi

# 10. Initialize Claude Flow
echo ""
echo "🤖 Initializing Claude Flow..."
if command -v claude-flow > /dev/null 2>&1 || command -v npx > /dev/null 2>&1; then
    npx claude-flow@alpha swarm init \
        --topology hierarchical \
        --max-agents 5 \
        --session "${ITERATION_NAME}" > /dev/null 2>&1 || {
        echo "⚠️  Claude Flow initialization optional, continuing..."
    }
    echo "✅ Claude Flow swarm ready"
fi

# 11. Start backend
echo ""
echo "🔧 Starting backend on port ${BACKEND_PORT}..."
DB_PORT=${DB_PORT} PORT=${BACKEND_PORT} TEST_MODE=true bun run dev:backend > backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend starting (PID: $BACKEND_PID)"

# 12. Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
MAX_ATTEMPTS=60
ATTEMPT=0
while ! curl -s http://localhost:${BACKEND_PORT}/auth/status > /dev/null 2>&1; do
    ATTEMPT=$((ATTEMPT + 1))
    if [ $ATTEMPT -gt $MAX_ATTEMPTS ]; then
        echo "❌ Backend failed to start after 60 seconds"
        echo "📋 Last 50 lines of backend log:"
        tail -50 backend.log
        exit 1
    fi
    printf "."
    sleep 1
done
echo " Ready!"

# 13. Verify TEST_MODE is working
AUTH_CHECK=$(curl -s http://localhost:${BACKEND_PORT}/auth/status 2>/dev/null)
if echo "$AUTH_CHECK" | grep -q "test@mail.com"; then
    echo "✅ TEST_MODE authentication confirmed"
else
    echo "❌ TEST_MODE not working properly"
    echo "   Response: $AUTH_CHECK"
    echo "   Check backend.log for errors"
    exit 1
fi

# 14. Final instructions
echo ""
echo "🎉 Iteration environment ready!"
echo ""
echo "📋 Starting frontend..."
echo "   This will open in your default browser"
echo ""
echo "🌐 URLs:"
echo "   Frontend: http://localhost:${FRONTEND_PORT}/"
echo "   Backend:  http://localhost:${BACKEND_PORT}/api/"
echo "   Database: localhost:${DB_PORT}"
echo ""
echo "📧 Test User: test@mail.com (auto-login enabled)"
echo ""
echo "🛑 To stop all services: Press Ctrl+C"
echo ""

# Trap to cleanup on exit
trap cleanup INT TERM EXIT

cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    
    # Kill backend if it's our child process
    if [ -n "$BACKEND_PID" ] && kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    # Stop any frontend process on our port
    lsof -ti:${FRONTEND_PORT} | xargs kill -9 2>/dev/null || true
    
    # Stop database
    docker compose -f docker-compose.${ITERATION_NAME}.yml down
    
    echo "✅ All services stopped"
    exit 0
}

# 15. Start frontend in foreground
echo "🎨 Starting frontend on port ${FRONTEND_PORT}..."
VITE_API_URL=http://localhost:${BACKEND_PORT}/api VITE_PORT=${FRONTEND_PORT} bun run dev:frontend -- --port ${FRONTEND_PORT}