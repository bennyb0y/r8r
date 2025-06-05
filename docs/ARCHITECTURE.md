# R8R Platform Architecture

## Overview

The R8R platform is a serverless, multi-tenant rating system built entirely on Cloudflare's edge infrastructure. This document provides a comprehensive overview of the system architecture, component interactions, and routing logic.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                           Users                                 │
│  r8r.one (platform)  │  burritos.r8r.one  │  *.r8r.one        │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Cloudflare DNS & CDN                        │
│                   (*.r8r.one wildcard)                         │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Cloudflare Workers (Routing)                   │
│                      r8r-routing                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Route Logic:                                           │   │
│  │  • r8r.one → r8r-platform.pages.dev                    │   │
│  │  • *.r8r.one → r8r-platform.pages.dev                  │   │
│  │    (preserve hostname for tenant detection)             │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│               Cloudflare Pages (Frontend)                      │
│                   r8r-platform                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Next.js Application:                                   │   │
│  │  • Tenant detection from hostname                       │   │
│  │  • Platform landing page (r8r.one)                     │   │
│  │  • Tenant-specific interfaces (*.r8r.one)              │   │
│  │  • Admin interfaces (/admin/*)                         │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ (API Calls)
┌─────────────────────────────────────────────────────────────────┐
│              Cloudflare Workers (API)                          │
│                   burrito-rater                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  API Endpoints:                                         │   │
│  │  • /api/ratings (CRUD operations)                       │   │
│  │  • /api/images/upload (R2 storage)                      │   │
│  │  • /api/tenants/* (tenant management)                   │   │
│  │  • Tenant-aware data isolation                          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                    │
                        ┌───────────┴───────────┐
                        ▼                       ▼
┌─────────────────────────────────┐  ┌─────────────────────────────────┐
│        Cloudflare D1            │  │        Cloudflare R2            │
│      (Edge Database)            │  │     (Object Storage)            │
│  ┌─────────────────────────┐    │  │  ┌─────────────────────────┐    │
│  │  • Ratings data         │    │  │  │  • Image uploads        │    │
│  │  • Tenant isolation     │    │  │  │  • Static assets        │    │
│  │  • Multi-tenant schema  │    │  │  │  • User-generated       │    │
│  │  • Real-time queries    │    │  │  │    content              │    │
│  └─────────────────────────┘    │  │  └─────────────────────────┘    │
└─────────────────────────────────┘  └─────────────────────────────────┘
```

## Component Architecture

### 1. Routing Layer (Cloudflare Workers)

**Purpose**: Handle wildcard subdomain routing for unlimited tenant support

**File**: `routing-worker.js`
**Configuration**: `wrangler.routing.toml`
**Routes**: 
- `r8r.one/*` 
- `*.r8r.one/*`

**Logic**:
```javascript
// Main domain routing
if (hostname === 'r8r.one' || hostname === 'www.r8r.one') {
  // Route to Pages deployment
  route_to_pages(request);
}

// Subdomain routing (tenant-specific)
if (hostname.endsWith('.r8r.one') && subdomain !== 'www') {
  // Route to Pages but preserve hostname for tenant detection
  route_to_pages_with_headers(request, {
    'Host': hostname,
    'X-Original-Host': hostname,
    'X-Tenant-Subdomain': subdomain
  });
}
```

### 2. Frontend Layer (Cloudflare Pages)

**Purpose**: Serve the Next.js application with tenant-aware routing

**Project**: `r8r-platform`
**Framework**: Next.js 15+ with static export
**Deployment**: `out/` directory deployed to Pages

**Key Features**:
- Server-side rendering disabled (static export)
- Client-side tenant detection
- Dynamic content loading based on tenant
- Admin interface protection

**Tenant Detection Logic**:
```typescript
// lib/tenant.ts
export function resolveTenantFromHost(host: string): string | null {
  // Development
  if (host.includes('localhost')) return 'burritos';
  
  // Pages deployments
  if (host.includes('.pages.dev')) return 'burritos';
  
  // Production subdomains
  const match = host.match(/^([^.]+)\.r8r\.one$/);
  if (match && match[1] !== 'www') return match[1];
  
  // Main domain - no tenant
  if (host === 'r8r.one' || host === 'www.r8r.one') return null;
  
  return null;
}
```

**Page Routing**:
- `/` - Platform landing page OR tenant interface
- `/admin/*` - Protected admin interfaces
- `/list` - Tenant-specific rating list
- `/guide` - Tenant-specific usage guide

### 3. API Layer (Cloudflare Workers)

**Purpose**: Provide tenant-aware API endpoints

**File**: `api/worker.js`
**Configuration**: `wrangler.worker.toml`

**Endpoints**:
- `GET/POST /api/ratings` - Rating CRUD operations
- `POST /api/images/upload` - Image upload to R2
- `GET /api/tenants/:id` - Tenant configuration
- `GET /api/health` - Health check

**Tenant Isolation**:
```javascript
// All queries include tenant_id filter
const ratings = await env.DB.prepare(`
  SELECT * FROM ratings 
  WHERE tenant_id = ? 
  ORDER BY created_at DESC
`).bind(tenantId).all();
```

### 4. Data Layer

#### Cloudflare D1 (Database)
**Schema**: Multi-tenant with strict isolation
```sql
CREATE TABLE ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  restaurant TEXT NOT NULL,
  rating REAL NOT NULL,
  taste REAL,
  value REAL,
  price REAL,
  ingredients TEXT,
  image_url TEXT,
  latitude REAL,
  longitude REAL,
  zipcode TEXT,
  reviewer_name TEXT,
  reviewer_emoji TEXT,
  identity_password TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ratings_tenant_id ON ratings(tenant_id);
CREATE INDEX idx_ratings_created_at ON ratings(created_at);
```

#### Cloudflare R2 (Storage)
**Purpose**: Store user-uploaded images
**Bucket**: `burrito-rater-bucket`
**Access**: Via signed URLs from Worker API

## Deployment Architecture

### 1. Worker Deployments

```bash
# API Worker
wrangler deploy --config wrangler.worker.toml

# Routing Worker  
wrangler deploy --config wrangler.routing.toml --env production
```

### 2. Pages Deployment

```bash
# Build and deploy frontend
npm run build
wrangler pages deploy out --project-name=r8r-platform
```

### 3. DNS Configuration

```
# DNS Records (Cloudflare Dashboard)
Type: CNAME
Name: *
Target: r8r-platform.pages.dev (proxied through Workers)

Type: A/AAAA  
Name: r8r.one
Target: [Worker routes handle this]
```

## Tenant Architecture

### 1. Tenant Creation Flow

```
1. User visits new-tenant.r8r.one
2. Routing Worker detects subdomain "new-tenant"  
3. Routes to Pages with tenant context
4. Frontend detects tenant "new-tenant"
5. Uses default configuration for new tenant
6. Tenant is auto-created on first rating submission
```

### 2. Tenant Configuration

**Default Configurations** (`lib/tenant.ts`):
```typescript
export const DEFAULT_TENANT_CONFIGS = {
  burritos: {
    ratingCategories: [
      { id: 'overall', name: 'Overall Rating', required: true },
      { id: 'taste', name: 'Taste', required: true },
      { id: 'value', name: 'Value', required: true }
    ],
    itemAttributes: [/* ... */],
    locationRequired: true,
    imageUploadEnabled: true
  },
  pizza: { /* ... */ },
  coffee: { /* ... */ }
};
```

### 3. Tenant Data Isolation

**Database Level**:
- All queries filtered by `tenant_id`
- Indexes on `tenant_id` for performance
- No cross-tenant data access possible

**API Level**:
- Tenant ID extracted from hostname
- All operations scoped to tenant
- Strict validation of tenant context

**Frontend Level**:
- Tenant-specific configurations
- Tenant-aware component rendering
- Isolated state management

## Security Architecture

### 1. Edge Security
- Cloudflare DDoS protection
- WAF rules for common attacks
- Rate limiting at edge level

### 2. Application Security
- CAPTCHA integration (Turnstile)
- CSP headers for XSS protection
- Secure image upload validation

### 3. Admin Security
- Password-based admin authentication
- Session-based admin state
- Admin-only route protection

### 4. Data Security
- Tenant isolation at database level
- No PII stored without user consent
- Secure image URL generation

## Performance Architecture

### 1. Edge Performance
- Global CDN for static assets
- Edge-side rendering where possible
- Minimal cold start times

### 2. Database Performance
- Optimized indexes for common queries
- Efficient multi-tenant query patterns
- Edge database for low latency

### 3. Caching Strategy
- Static asset caching (1 year)
- API response caching (5 minutes)
- Dynamic content caching (1 minute)

## Monitoring and Observability

### 1. Built-in Monitoring
- Cloudflare Analytics dashboard
- Worker execution metrics
- Pages deployment metrics
- D1 query performance

### 2. Custom Monitoring
- Admin dashboard with real-time metrics
- Error logging and alerting
- Performance monitoring

### 3. Debugging Tools
- Worker logs via Wrangler
- Pages deployment logs
- Real-time database query monitoring

## Scalability Considerations

### 1. Horizontal Scaling
- Serverless auto-scaling
- Edge distribution
- No infrastructure limits

### 2. Database Scaling
- D1 automatic scaling
- Efficient query patterns
- Read replica support

### 3. Storage Scaling
- R2 unlimited storage
- CDN-backed delivery
- Automatic geographic distribution

## Disaster Recovery

### 1. Data Backup
- D1 automatic backups
- R2 cross-region replication
- Point-in-time recovery

### 2. Service Continuity
- Multiple edge locations
- Automatic failover
- Zero single points of failure

### 3. Recovery Procedures
- Database restore procedures
- Worker rollback capabilities
- Pages deployment rollback

## Development Workflow

### 1. Local Development
```bash
# Frontend development
npm run dev

# API testing
wrangler dev --config wrangler.worker.toml

# Database operations
wrangler d1 execute DB --command="SELECT * FROM ratings"
```

### 2. Deployment Process
```bash
# Full deployment
npm run deploy

# Individual components
npm run deploy:worker  # API first
npm run deploy:app     # Frontend second
```

### 3. Testing Strategy
- Local frontend testing with cloud APIs
- Direct worker testing in cloud environment
- Database operations against cloud D1
- No mock services or local databases