# R8R Platform API Documentation

This document provides information about the Cloudflare Worker API used in the R8R multi-tenant rating platform.

## Overview

The R8R Platform API is implemented as a Cloudflare Worker that handles all data operations for the multi-tenant rating platform. It connects to a Cloudflare D1 database with strict tenant isolation and provides tenant-aware endpoints for ratings, items, and tenant management.

## Architecture

### Multi-Tenant Design
- **Tenant Resolution**: Automatic tenant detection from subdomain or header
- **Data Isolation**: All queries include `tenant_id` for complete data separation
- **Configuration-Driven**: API responses adapt to tenant-specific rating categories
- **Security**: Tenant boundaries enforced at the database level

### File Structure
- **`api/worker.js`**: Main worker script with multi-tenant routing
- **`wrangler.worker.toml`**: Worker deployment configuration
- **`app/types/platform.ts`**: TypeScript definitions for API contracts

## Multi-Tenant API Endpoints

All endpoints automatically resolve the current tenant from:
1. **Subdomain**: `burritos.r8r.one` → `tenant_id: "burritos"`
2. **Header**: `X-Tenant-ID: pizza-nyc` 
3. **Path**: `/api/tenants/coffee-sf/ratings`

### Tenant Management

#### GET `/tenants/:tenantId`
- Returns tenant configuration and metadata
- **Response**: Tenant object with config, branding, settings
- **Access**: Public (basic info) or Admin (full config)

#### PUT `/tenants/:tenantId/config`
- Updates tenant configuration (rating categories, attributes)
- **Auth**: Tenant admin required
- **Body**: Updated tenant configuration object

### Items (Generic Items Being Rated)

#### GET `/items`
- Returns items for current tenant with optional filtering
- **Query Parameters**:
  - `venue`: Filter by venue name
  - `zipcode`: Filter by location
  - `status`: Filter by item status (active/inactive)
  - `limit`: Number of results (default: 50)
  - `offset`: Pagination offset

#### POST `/items`
- Creates a new item for rating
- **Auth**: Authenticated user or admin
- **Body**: Item details with tenant-specific attributes
- **Response**: Created item with generated ID

#### GET `/items/:itemId`
- Returns specific item with aggregated rating data
- **Response**: Item with average scores and rating count

### Ratings (Tenant-Aware Rating System)

#### GET `/ratings`
- Returns ratings for current tenant
- **Query Parameters**:
  - `item_id`: Filter by specific item
  - `status`: Filter by confirmation status
  - `confirmed_only`: Boolean for public views
  - `limit`: Number of results (default: 50)
  - `offset`: Pagination offset

#### POST `/ratings`
- Creates a new rating for an item
- **Auth**: CAPTCHA validation required
- **Body**: Rating with tenant-configured score categories
- **Response**: `{ "success": true, "rating_id": "uuid" }`

#### GET `/ratings/:ratingId`
- Returns specific rating details
- **Access**: Public for confirmed, admin for pending

#### PUT `/ratings/:ratingId/confirm`
- Confirms a pending rating
- **Auth**: Tenant admin required
- **Response**: `{ "success": true, "message": "Rating confirmed" }`

#### DELETE `/ratings/:ratingId`
- Deletes a rating
- **Auth**: Tenant admin required
- **Response**: `{ "success": true, "message": "Rating deleted" }`

#### POST `/ratings/bulk-confirm`
- Confirms multiple ratings at once
- **Auth**: Tenant admin required
- **Body**: `{ "rating_ids": ["id1", "id2", "id3"] }`

### Analytics & Aggregation

#### GET `/analytics/summary`
- Returns tenant analytics summary
- **Auth**: Tenant admin required
- **Response**: Total ratings, average scores, top items

#### GET `/analytics/items/:itemId`
- Returns detailed analytics for specific item
- **Response**: Rating breakdown, score distribution, trends

### Admin Management

#### GET `/admin/tenants`
- Lists all tenants (platform admin only)
- **Auth**: Platform admin required

#### POST `/admin/tenants`
- Creates new tenant
- **Auth**: Platform admin required
- **Body**: Tenant configuration and initial settings

## Request/Response Format

### Standard Response Envelope
```json
{
  "success": boolean,
  "data": any,
  "error": string,
  "tenant_id": string,
  "timestamp": string
}
```

### Pagination Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "total_pages": 3,
    "has_next": true,
    "has_prev": false
  },
  "tenant_id": "burritos"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Tenant not found",
  "error_code": "TENANT_NOT_FOUND",
  "tenant_id": null
}
```

## Authentication & Authorization

### Tenant Admin Authentication
- **Method**: JWT tokens with tenant-specific claims
- **Scope**: Per-tenant admin operations
- **Claims**: `tenant_id`, `role`, `permissions`

### CAPTCHA Validation
- **Required for**: Public rating submissions
- **Provider**: Cloudflare Turnstile
- **Validation**: Server-side token verification

### Rate Limiting
- **Public endpoints**: 100 requests/minute per IP
- **Admin endpoints**: 1000 requests/minute per authenticated user
- **Tenant-specific**: Configurable limits per tenant

## Configuration Examples

### Burrito Tenant API Usage
```javascript
// GET /ratings for burritos.r8r.one
{
  "data": [
    {
      "id": "rating_123",
      "item_id": "item_carne_asada_la_taqueria",
      "scores": {
        "overall": 4.5,
        "taste": 5.0,
        "value": 4.0
      },
      "reviewer_info": {
        "name": "FoodLover",
        "emoji": "🌮"
      }
    }
  ],
  "tenant_id": "burritos"
}
```

### Pizza Tenant API Usage
```javascript
// GET /ratings for pizza-nyc.r8r.one  
{
  "data": [
    {
      "id": "rating_456",
      "item_id": "item_margherita_joes_pizza",
      "scores": {
        "overall": 4.2,
        "crust": 4.5,
        "sauce": 4.0,
        "cheese": 4.0
      },
      "reviewer_info": {
        "name": "PizzaExpert",
        "emoji": "🍕"
      }
    }
  ],
  "tenant_id": "pizza-nyc"
}
```

## Development

### Local Development
```bash
# Start worker development server
npx wrangler dev --config wrangler.worker.toml

# Test with tenant context
curl -H "X-Tenant-ID: burritos" http://localhost:8787/ratings
```

### Deployment
```bash
# Deploy to production
npm run deploy:worker

# Deploy with specific environment
npx wrangler deploy --config wrangler.worker.toml --env production
```

### Environment Variables
Required worker environment variables:
- `PLATFORM_DB_ID`: Multi-tenant D1 database ID
- `TURNSTILE_SECRET_KEY`: CAPTCHA validation secret
- `JWT_SECRET`: Token signing secret
- `R2_BUCKET_NAME`: Image storage bucket

## Migration from Legacy API

### Endpoint Mapping
| Legacy Endpoint | New Multi-Tenant Endpoint | Notes |
|-----------------|---------------------------|-------|
| `GET /ratings` | `GET /ratings?confirmed_only=true` | Tenant-filtered automatically |
| `POST /ratings` | `POST /ratings` | Requires tenant context |
| `DELETE /ratings/:id` | `DELETE /ratings/:id` | Tenant isolation enforced |
| `PUT /ratings/:id/confirm` | `PUT /ratings/:id/confirm` | Admin auth required |

### Data Format Changes
- **Legacy**: Fixed burrito ingredient fields
- **New**: JSON-based flexible attributes per tenant
- **Scores**: Fixed taste/value → Configurable rating categories
- **Migration**: Automatic transformation via migration script

## Security Considerations

### Tenant Data Isolation
- All database queries include `tenant_id` filtering
- Cross-tenant data access prevented at API level
- Admin operations scoped to specific tenant

### Input Validation
- JSON schema validation for all POST/PUT requests
- Tenant configuration validation against allowed schemas
- SQL injection prevention with parameterized queries

### CORS Configuration
```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*.r8r.one',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Tenant-ID',
};
```

## Related Documentation

- [Multi-Tenant Schema](./MULTITENANT_SCHEMA.md) - Database design
- [Platform Types](../app/types/platform.ts) - TypeScript definitions
- [Admin Guide](./ADMIN_DEVOPS.md) - Deployment and management
- [CAPTCHA Implementation](./CAPTCHA_IMPLEMENTATION.md) - Security integration