# Collabiteration Service API Specification

## Overview
RESTful API for the Collabiteration SaaS platform. All endpoints require authentication unless otherwise noted.

## Base URLs
- Development: `http://localhost:3000/api`
- Staging: `https://staging-api.collabiteration.dev`
- Production: `https://api.collabiteration.dev`

## Authentication

### API Key Authentication
All requests must include an API key in the Authorization header:
```
Authorization: Bearer [api-key]
```

### API Key Format
- Prefix: `cbr_live_` for production, `cbr_test_` for test
- Example: `cbr_live_sk_a1b2c3d4e5f6g7h8i9j0`

### Rate Limiting
- 100 requests per minute per API key
- 429 status code when exceeded
- `X-RateLimit-*` headers included in responses

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "version": "1.0.0"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input provided",
    "details": { ... }
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "request_id": "req_123456"
  }
}
```

## Endpoints

### Projects

#### Create Project
`POST /api/projects`

Register a new project with the service.

**Request Body:**
```json
{
  "name": "My Project",
  "git_url": "https://github.com/user/repo.git",
  "context": {
    "framework": "react",
    "language": "typescript"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "proj_123456",
    "name": "My Project",
    "api_key": "cbr_test_sk_...",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### List Projects
`GET /api/projects`

**Query Parameters:**
- `limit` (number): Max items to return (default: 20, max: 100)
- `offset` (number): Pagination offset
- `sort` (string): Sort field (name, created_at)
- `order` (string): Sort order (asc, desc)

### Iterations

#### Create Iteration
`POST /api/iterations`

Create a new iteration for a project.

**Request Body:**
```json
{
  "project_id": "proj_123456",
  "name": "feature-auth",
  "branch": "iteration/feature-auth",
  "lifecycle_stage": "solution-ideation",
  "metadata": {
    "target_user": "Developers",
    "problem": "Need authentication system",
    "proposed_solution": "JWT-based auth"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "iter_789012",
    "project_id": "proj_123456",
    "name": "feature-auth",
    "branch": "iteration/feature-auth",
    "lifecycle_stage": "solution-ideation",
    "status": "created",
    "ports": {
      "frontend": 3020,
      "backend": 3021,
      "database": 5462
    },
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### Get Iteration
`GET /api/iterations/:id`

Retrieve details of a specific iteration.

#### Update Iteration
`PUT /api/iterations/:id`

Update iteration metadata or status.

**Request Body:**
```json
{
  "lifecycle_stage": "design-refinement",
  "status": "in_progress",
  "metadata": {
    "notes": "Refining auth flow"
  }
}
```

#### Delete Iteration
`DELETE /api/iterations/:id`

Remove an iteration (soft delete).

#### Share Iteration
`POST /api/iterations/:id/share`

Share iteration for review/deployment.

**Request Body:**
```json
{
  "environment": "staging",
  "include_assistant": true,
  "pr_title": "Feature: Authentication System",
  "pr_description": "Implements JWT-based authentication"
}
```

### Widget Endpoints

#### Get Widget Configuration
`GET /api/widget/config`

Returns configuration for the widget initialization.

**Headers:**
- `Origin`: Required for CORS validation

**Response:**
```json
{
  "success": true,
  "data": {
    "project_id": "proj_123456",
    "features": {
      "real_time": true,
      "analytics": true,
      "assistant": true
    },
    "theme": {
      "primary_color": "#6B46C1",
      "position": "bottom-right"
    }
  }
}
```

#### Get Widget Iteration Data
`GET /api/widget/iteration/:id`

Get iteration data formatted for widget display.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "iter_789012",
    "name": "feature-auth",
    "lifecycle_stage": "solution-ideation",
    "status": "in_progress",
    "plan": {
      "content": "# Implementation Plan\n...",
      "phases": [...],
      "progress": 45
    },
    "history": [
      {
        "event": "status_changed",
        "from": "created",
        "to": "in_progress",
        "timestamp": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

#### Track Widget Event
`POST /api/widget/events`

Track user interactions with the widget.

**Request Body:**
```json
{
  "iteration_id": "iter_789012",
  "event_type": "modal_opened",
  "metadata": {
    "tab": "overview",
    "user_id": "user_123"
  }
}
```

### Analytics Endpoints

#### Get Iteration Analytics
`GET /api/analytics/iterations/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "duration": {
      "total_days": 5,
      "by_stage": {
        "solution-ideation": 2,
        "design-refinement": 3
      }
    },
    "activity": {
      "commits": 47,
      "files_changed": 23,
      "lines_added": 1250,
      "lines_removed": 340
    },
    "collaboration": {
      "contributors": 3,
      "comments": 12,
      "reviews": 5
    }
  }
}
```

#### Get Project Analytics
`GET /api/analytics/projects/:id`

Returns aggregated analytics for all iterations in a project.

### WebSocket Events

Connect to WebSocket for real-time updates:
```
wss://api.collabiteration.dev/ws
```

#### Authentication
Send auth message after connection:
```json
{
  "type": "auth",
  "api_key": "cbr_live_sk_..."
}
```

#### Subscribe to Iteration
```json
{
  "type": "subscribe",
  "channel": "iteration",
  "id": "iter_789012"
}
```

#### Event Types
- `iteration.created`
- `iteration.updated`
- `iteration.status_changed`
- `iteration.shared`
- `user.joined`
- `user.left`

## Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Invalid or missing API key |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Invalid request data |
| `RATE_LIMITED` | Too many requests |
| `INTERNAL_ERROR` | Server error |

## SDK Usage Examples

### JavaScript/TypeScript
```typescript
import { CollabiterationClient } from '@collabiteration/sdk';

const client = new CollabiterationClient({
  apiKey: process.env.COLLABITERATION_API_KEY
});

// Create iteration
const iteration = await client.iterations.create({
  projectId: 'proj_123456',
  name: 'feature-auth',
  lifecycleStage: 'solution-ideation'
});

// Subscribe to updates
client.subscribe('iteration', iteration.id, (event) => {
  console.log('Iteration updated:', event);
});
```

### cURL Examples
```bash
# Create iteration
curl -X POST https://api.collabiteration.dev/api/iterations \
  -H "Authorization: Bearer cbr_live_sk_..." \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "proj_123456",
    "name": "feature-auth",
    "lifecycle_stage": "solution-ideation"
  }'

# Get iteration
curl https://api.collabiteration.dev/api/iterations/iter_789012 \
  -H "Authorization: Bearer cbr_live_sk_..."
```

## Versioning

The API uses URL versioning. Current version: `v1`

Future versions will be available at:
- `https://api.collabiteration.dev/v2/`

## Deprecation Policy

- Deprecated endpoints return `Deprecation` header
- 6-month notice before removal
- Migration guides provided

## Support

- Documentation: https://docs.collabiteration.dev
- Status: https://status.collabiteration.dev
- Support: support@collabiteration.dev