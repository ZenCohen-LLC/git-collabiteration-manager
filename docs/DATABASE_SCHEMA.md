# Database Schema

## Overview
PostgreSQL database schema for the Collabiteration SaaS platform using Supabase.

## Schema Design Principles
- UUID primary keys for all tables
- Soft deletes with `deleted_at` timestamps
- Audit fields (`created_at`, `updated_at`) on all tables
- JSONB for flexible metadata storage
- Row Level Security (RLS) policies for multi-tenancy

## Tables

### organizations
Stores organization/team information.

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  subscription_tier TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
```

### users
User accounts with organization membership.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  settings JSONB DEFAULT '{}',
  last_seen_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization ON users(organization_id);
```

### api_keys
API keys for service authentication.

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL, -- First 8 chars for identification
  key_hash TEXT NOT NULL, -- SHA256 hash of full key
  environment TEXT DEFAULT 'test' CHECK (environment IN ('test', 'live')),
  permissions JSONB DEFAULT '["read", "write"]',
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  revoked_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_api_keys_key_prefix ON api_keys(key_prefix);
CREATE INDEX idx_api_keys_organization ON api_keys(organization_id);
```

### projects
Projects registered with the service.

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  git_url TEXT,
  context JSONB DEFAULT '{}', -- Framework, language, config
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(organization_id, slug)
);

CREATE INDEX idx_projects_organization ON projects(organization_id);
CREATE INDEX idx_projects_slug ON projects(slug);
```

### iterations
Individual development iterations.

```sql
CREATE TABLE iterations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  branch TEXT NOT NULL,
  lifecycle_stage TEXT NOT NULL CHECK (lifecycle_stage IN (
    'solution-ideation',
    'design-refinement', 
    'deployed-prototype',
    'test-integration',
    'ready-to-deploy'
  )),
  status TEXT DEFAULT 'created' CHECK (status IN (
    'created', 'running', 'stopped', 'shared', 'completed', 'archived'
  )),
  metadata JSONB DEFAULT '{}', -- User, problem, solution, etc.
  ports JSONB, -- Allocated ports
  pr_url TEXT,
  deployment_url TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(project_id, name)
);

CREATE INDEX idx_iterations_project ON iterations(project_id);
CREATE INDEX idx_iterations_status ON iterations(status);
CREATE INDEX idx_iterations_stage ON iterations(lifecycle_stage);
```

### iteration_events
Event log for iteration activities.

```sql
CREATE TABLE iteration_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  iteration_id UUID REFERENCES iterations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_iteration_events_iteration ON iteration_events(iteration_id);
CREATE INDEX idx_iteration_events_type ON iteration_events(event_type);
CREATE INDEX idx_iteration_events_created ON iteration_events(created_at DESC);
```

### iteration_phases
Implementation phases from iteration plans.

```sql
CREATE TABLE iteration_phases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  iteration_id UUID REFERENCES iterations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'completed', 'blocked'
  )),
  order_index INTEGER NOT NULL,
  estimated_days INTEGER,
  actual_days NUMERIC(5,2),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_iteration_phases_iteration ON iteration_phases(iteration_id);
CREATE INDEX idx_iteration_phases_status ON iteration_phases(status);
```

### iteration_tasks
Tasks within phases.

```sql
CREATE TABLE iteration_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase_id UUID REFERENCES iteration_phases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'completed', 'blocked'
  )),
  priority TEXT DEFAULT 'medium' CHECK (priority IN (
    'low', 'medium', 'high', 'critical'
  )),
  assignee_id UUID REFERENCES users(id),
  estimated_hours NUMERIC(5,2),
  actual_hours NUMERIC(5,2),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_iteration_tasks_phase ON iteration_tasks(phase_id);
CREATE INDEX idx_iteration_tasks_assignee ON iteration_tasks(assignee_id);
CREATE INDEX idx_iteration_tasks_status ON iteration_tasks(status);
```

### widget_analytics
Analytics for widget usage.

```sql
CREATE TABLE widget_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  iteration_id UUID REFERENCES iterations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_widget_analytics_iteration ON widget_analytics(iteration_id);
CREATE INDEX idx_widget_analytics_event ON widget_analytics(event_type);
CREATE INDEX idx_widget_analytics_created ON widget_analytics(created_at DESC);
CREATE INDEX idx_widget_analytics_session ON widget_analytics(session_id);
```

## Views

### active_iterations
View of currently active iterations.

```sql
CREATE VIEW active_iterations AS
SELECT 
  i.*,
  p.name as project_name,
  p.organization_id,
  o.name as organization_name
FROM iterations i
JOIN projects p ON i.project_id = p.id
JOIN organizations o ON p.organization_id = o.id
WHERE i.status IN ('created', 'running', 'shared')
  AND i.deleted_at IS NULL
  AND p.deleted_at IS NULL;
```

### iteration_progress
Aggregated progress view.

```sql
CREATE VIEW iteration_progress AS
SELECT 
  i.id,
  i.name,
  COUNT(DISTINCT ph.id) as total_phases,
  COUNT(DISTINCT ph.id) FILTER (WHERE ph.status = 'completed') as completed_phases,
  COUNT(DISTINCT t.id) as total_tasks,
  COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed') as completed_tasks,
  ROUND(
    COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed')::numeric / 
    NULLIF(COUNT(DISTINCT t.id), 0) * 100, 
    2
  ) as completion_percentage
FROM iterations i
LEFT JOIN iteration_phases ph ON i.id = ph.iteration_id
LEFT JOIN iteration_tasks t ON ph.id = t.phase_id
GROUP BY i.id, i.name;
```

## Functions

### generate_api_key()
Generate a secure API key.

```sql
CREATE OR REPLACE FUNCTION generate_api_key(env TEXT DEFAULT 'test')
RETURNS TABLE(key TEXT, key_prefix TEXT, key_hash TEXT) AS $$
DECLARE
  prefix TEXT;
  random_part TEXT;
  full_key TEXT;
BEGIN
  -- Generate prefix based on environment
  prefix := CASE env
    WHEN 'live' THEN 'cbr_live_'
    ELSE 'cbr_test_'
  END;
  
  -- Generate random part (32 chars)
  random_part := encode(gen_random_bytes(24), 'base64');
  random_part := replace(random_part, '/', '');
  random_part := replace(random_part, '+', '');
  random_part := substring(random_part, 1, 32);
  
  -- Combine
  full_key := prefix || 'sk_' || random_part;
  
  RETURN QUERY SELECT 
    full_key,
    substring(full_key, 1, 16) as key_prefix,
    encode(digest(full_key, 'sha256'), 'hex') as key_hash;
END;
$$ LANGUAGE plpgsql;
```

### update_updated_at()
Trigger function to update timestamps.

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- Repeat for all tables...
```

## Row Level Security (RLS)

### Enable RLS
```sql
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE iterations ENABLE ROW LEVEL SECURITY;
-- Enable for all tables...
```

### Policies
```sql
-- Organizations: Users can see their own organization
CREATE POLICY organizations_select ON organizations
  FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Projects: Users can see projects in their organization
CREATE POLICY projects_select ON projects
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Iterations: Users can see iterations for their projects
CREATE POLICY iterations_select ON iterations
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );
```

## Indexes Strategy

### Performance Indexes
- Primary keys (automatic)
- Foreign keys (recommended)
- Frequently queried columns
- Composite indexes for common queries

### Example Composite Indexes
```sql
-- For finding iterations by project and status
CREATE INDEX idx_iterations_project_status 
  ON iterations(project_id, status) 
  WHERE deleted_at IS NULL;

-- For analytics queries
CREATE INDEX idx_widget_analytics_iteration_created 
  ON widget_analytics(iteration_id, created_at DESC);
```

## Migration Strategy

### Initial Setup
```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Run migrations in order
-- 001_create_organizations.sql
-- 002_create_users.sql
-- 003_create_api_keys.sql
-- etc...
```

### Future Migrations
- Always use migrations, never modify schema directly
- Include both UP and DOWN migrations
- Test rollback procedures
- Version control all migrations

## Backup Strategy

### Automated Backups
- Supabase provides daily backups
- Point-in-time recovery available
- Test restore procedures monthly

### Manual Exports
```bash
# Export schema
pg_dump --schema-only > schema.sql

# Export data
pg_dump --data-only > data.sql

# Full backup
pg_dump > full_backup.sql
```

## Performance Considerations

1. **Indexes**: Add as needed based on query patterns
2. **Partitioning**: Consider for analytics tables > 10M rows
3. **Archiving**: Move old iterations to archive tables
4. **Vacuum**: Regular maintenance for optimal performance
5. **Connection Pooling**: Use Supabase's built-in pooler