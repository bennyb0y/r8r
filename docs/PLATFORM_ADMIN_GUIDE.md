# R8R Platform Administration and DevOps Guide

This comprehensive guide covers all aspects of deploying, administering, and maintaining the R8R multi-tenant rating platform, including tenant management and multi-tenant DevOps workflows.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Multi-Tenant Setup](#multi-tenant-setup)
- [Infrastructure Deployment](#infrastructure-deployment)
- [Tenant Management](#tenant-management)
- [Platform Administration](#platform-administration)
- [Development Workflow](#development-workflow)
- [Monitoring and Analytics](#monitoring-and-analytics)
- [Security and Data Isolation](#security-and-data-isolation)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Architecture Overview

R8R Platform uses a cloud-native, multi-tenant architecture with complete data isolation:

### Multi-Tenant Architecture
```
┌─────────────────────────────────────────────────────────┐
│                    R8R Platform                         │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ burritos.   │  │ pizza-nyc.  │  │ coffee-sf.  │      │
│  │ r8r.one     │  │ r8r.one     │  │ r8r.one     │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
│         │                 │                 │           │
│         └─────────────────┼─────────────────┘           │
│                           │                             │
│  ┌─────────────────────────▼─────────────────────────┐   │
│  │         Tenant-Aware API Router                  │   │
│  │         (Cloudflare Worker)                      │   │
│  └─────────────────────────┬─────────────────────────┘   │
│                           │                             │
│  ┌─────────────────────────▼─────────────────────────┐   │
│  │      Multi-Tenant Database                       │   │
│  │      (Cloudflare D1)                             │   │
│  │                                                  │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │   │
│  │  │Tenant A │ │Tenant B │ │Tenant C │ │Platform │ │   │
│  │  │ Data    │ │ Data    │ │ Data    │ │ Admin   │ │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Key Components

1. **Multi-Tenant Frontend**: Next.js with dynamic tenant routing
2. **Tenant-Aware API**: Cloudflare Worker with automatic tenant resolution
3. **Isolated Database**: Cloudflare D1 with strict tenant_id filtering
4. **Tenant Storage**: Cloudflare R2 with tenant-specific buckets
5. **Platform Admin**: Cross-tenant management interface

## Multi-Tenant Setup

### Prerequisites

- **Domain**: `r8r.one` with wildcard subdomain support (`*.r8r.one`)
- **Cloudflare Account**: With Workers Paid, D1, R2, and Pages enabled
- **DNS Configuration**: Wildcard A/CNAME records for subdomain routing
- **SSL Certificates**: Wildcard SSL for `*.r8r.one`

### Infrastructure Requirements

#### New Cloudflare Resources
```bash
# 1. Create multi-tenant D1 database
npx wrangler d1 create r8r-platform-db

# 2. Create tenant image storage
npx wrangler r2 bucket create r8r-tenant-images

# 3. Deploy platform API worker
npx wrangler deploy --config wrangler.platform.toml

# 4. Set up Pages with custom domain
# Via Cloudflare Dashboard: Pages > Custom domains > r8r.one, *.r8r.one
```

#### Environment Variables
```env
# Platform Configuration
NEXT_PUBLIC_PLATFORM_DOMAIN=r8r.one
NEXT_PUBLIC_API_BASE_URL=https://api.r8r.one

# Multi-Tenant Database
PLATFORM_DB_ID=your-d1-database-id
PLATFORM_DB_TOKEN=your-d1-token

# Tenant Storage
R2_TENANT_BUCKET=r8r-tenant-images
R2_API_TOKEN=your-r2-token

# Platform Security
PLATFORM_JWT_SECRET=your-jwt-secret
PLATFORM_ADMIN_SECRET=your-admin-secret

# Per-Tenant Overrides (optional)
TENANT_CONFIG_OVERRIDE=production-overrides.json
```

## Infrastructure Deployment

### Database Setup

#### 1. Create Multi-Tenant Schema
```bash
# Deploy schema to D1 database
npx wrangler d1 execute r8r-platform-db --file=scripts/create_multitenant_schema.sql

# Verify tables created
npx wrangler d1 execute r8r-platform-db --command="SELECT name FROM sqlite_master WHERE type='table';"
```

#### 2. Migrate Legacy Data (if applicable)
```bash
# Migrate existing burrito data
npx wrangler d1 execute r8r-platform-db --file=scripts/migrate_burrito_data.sql

# Verify migration
npx wrangler d1 execute r8r-platform-db --command="SELECT COUNT(*) FROM tenants;"
```

### API Worker Deployment

#### 1. Configure Worker
```toml
# wrangler.platform.toml
name = "r8r-platform-api"
main = "api/platform-worker.js"
compatibility_date = "2024-01-01"

# Custom domain for API
route = "api.r8r.one/*"

[[d1_databases]]
binding = "PLATFORM_DB"
database_name = "r8r-platform-db"
database_id = "your-database-id"

[[r2_buckets]]
binding = "TENANT_STORAGE"
bucket_name = "r8r-tenant-images"
```

#### 2. Deploy Worker
```bash
# Deploy platform API
npm run deploy:platform-worker

# Test tenant resolution
curl -H "Host: burritos.r8r.one" https://api.r8r.one/tenants/current
```

### Frontend Deployment

#### 1. Build with Multi-Tenant Support
```bash
# Build with platform configuration
NEXT_PUBLIC_PLATFORM_MODE=true npm run build

# Deploy to Pages
npm run deploy:platform-pages
```

#### 2. Configure Custom Domains
```bash
# Via Cloudflare Dashboard or API
# Add r8r.one and *.r8r.one to Pages custom domains
# Ensure wildcard SSL certificate is active
```

## Tenant Management

### Creating New Tenants

#### 1. Platform Admin Interface
```typescript
// POST /admin/tenants
const newTenant = {
  id: 'pizza-nyc',
  subdomain: 'pizza-nyc',
  name: 'NYC Pizza Guide',
  category: 'food',
  subcategory: 'italian',
  config: {
    ratingCategories: [
      { id: 'overall', name: 'Overall Rating', required: true },
      { id: 'crust', name: 'Crust Quality', required: true },
      { id: 'sauce', name: 'Sauce', required: true },
      { id: 'cheese', name: 'Cheese', required: true }
    ],
    itemAttributes: [
      {
        id: 'style',
        name: 'Pizza Style',
        type: 'select',
        options: ['neapolitan', 'new-york', 'sicilian']
      }
    ]
  }
};
```

#### 2. Command Line Tenant Creation
```bash
# Create tenant via CLI script
node scripts/create-tenant.js \
  --id="coffee-sf" \
  --name="San Francisco Coffee" \
  --template="coffee" \
  --admin-email="admin@coffee-sf.com"
```

### Tenant Configuration Management

#### 1. Update Tenant Settings
```typescript
// PUT /tenants/:tenantId/config
const updatedConfig = {
  ratingCategories: [
    // Add new rating category
    { id: 'presentation', name: 'Presentation', required: false, weight: 0.2 }
  ],
  branding: {
    primaryColor: '#FF6B35',
    logoUrl: '/tenant-assets/coffee-sf/logo.png'
  }
};
```

#### 2. Tenant Feature Flags
```json
{
  "settings": {
    "features": {
      "imageUpload": true,
      "socialSharing": false,
      "advancedAnalytics": true,
      "customCSS": false
    },
    "limits": {
      "maxRatingsPerDay": 100,
      "maxImagesPerRating": 3,
      "maxAdmins": 5
    }
  }
}
```

### Tenant Admin Management

#### 1. Add Tenant Admin
```typescript
// POST /tenants/:tenantId/admins
const newAdmin = {
  email: 'moderator@pizza-nyc.com',
  role: 'moderator',
  permissions: {
    canModerateRatings: true,
    canManageItems: false,
    canViewAnalytics: true,
    canEditConfig: false
  }
};
```

#### 2. Admin Role Hierarchy
- **Owner**: Full tenant control, billing, admin management
- **Admin**: Content management, configuration, analytics
- **Moderator**: Rating moderation, basic item management
- **Viewer**: Read-only analytics access

## Platform Administration

### Legacy Data Migration Verification

The platform has completed migration from the legacy single-tenant system. Use these commands to verify migration integrity:

#### 1. Verify Migration Completeness
```bash
# Check tenant creation
npx wrangler d1 execute r8r-platform-db --remote --command="
SELECT id, subdomain, name, category, status 
FROM tenants WHERE id = 'burritos';"

# Verify legacy data migration
npx wrangler d1 execute r8r-platform-db --remote --command="
SELECT COUNT(*) as migrated_ratings 
FROM ratings WHERE tenant_id = 'burritos';"

# Should return 42 ratings
npx wrangler d1 execute r8r-platform-db --remote --command="
SELECT COUNT(*) as total_items 
FROM items WHERE tenant_id = 'burritos';"

# Should return 36 unique items
```

#### 2. Verify Data Integrity
```bash
# Check rating-item relationships
npx wrangler d1 execute r8r-platform-db --remote --command="
SELECT COUNT(*) as orphaned_ratings 
FROM ratings r 
LEFT JOIN items i ON r.item_id = i.id 
WHERE i.id IS NULL AND r.tenant_id = 'burritos';"

# Should return 0 orphaned ratings

# Verify tenant isolation
npx wrangler d1 execute r8r-platform-db --remote --command="
SELECT DISTINCT tenant_id FROM ratings;"

# Should only show 'burritos' tenant
```

#### 3. Test Legacy API Compatibility
```bash
# Test legacy rating retrieval
curl https://r8r-platform-api.bennyfischer.workers.dev/api/ratings

# Verify legacy format transformation
curl https://r8r-platform-api.bennyfischer.workers.dev/api/ratings | jq '.[0] | keys'

# Should include legacy fields: restaurantName, burritoTitle, hasPotatoes, etc.
```

#### 4. Verify Burritos Tenant Access
```bash
# Test subdomain routing
curl -H "Host: burritos.r8r.one" https://r8r-platform.pages.dev

# Should show burrito-specific interface
```

### Platform-Wide Operations

#### 1. Tenant Analytics Dashboard
```typescript
// GET /admin/platform/analytics
{
  totalTenants: 45,
  activeTenants: 42,
  totalRatings: 15420,
  topCategories: ['food', 'entertainment', 'services'],
  growthMetrics: {
    newTenantsThisMonth: 8,
    ratingsGrowthRate: 0.23
  }
}
```

#### 2. Platform Health Monitoring
```bash
# Monitor platform health
curl https://api.r8r.one/admin/health

# Check tenant-specific metrics
curl https://api.r8r.one/admin/tenants/burritos/health
```

### Database Maintenance

#### 1. Tenant Data Isolation Verification
```sql
-- Verify no cross-tenant data leakage
SELECT tenant_id, COUNT(*) as rating_count 
FROM ratings 
GROUP BY tenant_id;

-- Check orphaned data
SELECT COUNT(*) FROM ratings r 
LEFT JOIN tenants t ON r.tenant_id = t.id 
WHERE t.id IS NULL;
```

#### 2. Performance Optimization
```sql
-- Analyze query performance per tenant
EXPLAIN QUERY PLAN 
SELECT * FROM ratings 
WHERE tenant_id = 'burritos' 
  AND status = 'confirmed' 
ORDER BY created_at DESC;

-- Rebuild analytics for all tenants
INSERT OR REPLACE INTO rating_analytics 
SELECT item_id, tenant_id, item_id, COUNT(*), 
       json_object('overall', AVG(json_extract(scores, '$.overall'))),
       MAX(created_at), CURRENT_TIMESTAMP
FROM ratings 
WHERE status = 'confirmed'
GROUP BY tenant_id, item_id;
```

## Development Workflow

### Local Multi-Tenant Development

#### 1. Environment Setup
```bash
# Start with tenant context
TENANT_ID=burritos npm run dev

# Test different tenants
curl -H "X-Tenant-ID: pizza-nyc" http://localhost:3000/api/ratings
```

#### 2. Tenant-Aware Testing
```typescript
// Test with multiple tenants
describe('Multi-tenant API', () => {
  const tenants = ['burritos', 'pizza-nyc', 'coffee-sf'];
  
  tenants.forEach(tenantId => {
    it(`should isolate data for ${tenantId}`, async () => {
      const response = await fetch('/api/ratings', {
        headers: { 'X-Tenant-ID': tenantId }
      });
      // Verify tenant isolation
    });
  });
});
```

### Deployment Strategies

#### 1. Blue-Green Deployment
```bash
# Deploy to staging environment
npm run deploy:staging

# Test all tenants in staging
node scripts/test-all-tenants.js --env=staging

# Promote to production
npm run deploy:production
```

#### 2. Feature Flag Rollouts
```typescript
// Gradual feature rollout
const featureConfig = {
  newRatingForm: {
    enabled: true,
    tenants: ['pizza-nyc', 'coffee-sf'], // Start with specific tenants
    rolloutPercentage: 25 // Then gradual rollout
  }
};
```

## Monitoring and Analytics

### Platform Metrics

#### 1. Tenant Activity Monitoring
```typescript
// Monitor per-tenant activity
const tenantMetrics = {
  activeUsers: 145,
  ratingsToday: 23,
  averageRating: 4.2,
  responseTime: 89, // ms
  errorRate: 0.02
};
```

#### 2. Performance Monitoring
```bash
# Monitor API performance across tenants
curl https://api.r8r.one/admin/metrics/performance

# Check database query performance
curl https://api.r8r.one/admin/metrics/database
```

### Alerting Configuration

#### 1. Platform Alerts
- Tenant creation/deletion
- Cross-tenant data access attempts
- Performance degradation
- High error rates per tenant

#### 2. Tenant-Specific Alerts
- Rating submission failures
- Image upload issues
- Admin authentication failures
- Unusual traffic patterns

## Security and Data Isolation

### Tenant Data Security

#### 1. Isolation Verification
```sql
-- Audit query for data isolation
SELECT 
  'ratings' as table_name,
  tenant_id,
  COUNT(*) as records
FROM ratings 
GROUP BY tenant_id
UNION ALL
SELECT 
  'items' as table_name,
  tenant_id,
  COUNT(*) as records  
FROM items
GROUP BY tenant_id;
```

#### 2. Access Control Audit
```typescript
// Verify API access controls
const auditResults = {
  crossTenantAttempts: 0, // Should always be 0
  unauthorizedAdminAccess: 0,
  successfulTenantIsolation: 100, // Percentage
  failedAuthenticationAttempts: 3
};
```

### Security Best Practices

#### 1. Tenant Isolation
- All database queries MUST include `tenant_id`
- API middleware enforces tenant context
- Admin operations scoped to specific tenant
- No shared resources between tenants

#### 2. Authentication Security
- JWT tokens with tenant-specific claims
- Multi-factor authentication for platform admins
- Regular token rotation
- Session management per tenant

## Troubleshooting

### Common Multi-Tenant Issues

#### 1. Tenant Resolution Failures
```bash
# Debug subdomain routing
curl -v -H "Host: invalid.r8r.one" https://api.r8r.one/tenants/current

# Check DNS configuration
dig +short invalid.r8r.one
```

#### 2. Cross-Tenant Data Leakage
```sql
-- Emergency check for data leakage
SELECT r.id, r.tenant_id, i.tenant_id as item_tenant
FROM ratings r
JOIN items i ON r.item_id = i.id
WHERE r.tenant_id != i.tenant_id;
```

#### 3. Performance Issues
```bash
# Check per-tenant performance
curl https://api.r8r.one/admin/tenants/burritos/performance

# Analyze slow queries
npx wrangler d1 execute r8r-platform-db --command="PRAGMA stats;"
```

### Emergency Procedures

#### 1. Tenant Isolation
```sql
-- Emergency: Disable tenant access
UPDATE tenants SET status = 'suspended' WHERE id = 'problematic-tenant';
```

#### 2. Data Recovery
```bash
# Restore from backup for specific tenant
node scripts/restore-tenant-data.js --tenant=burritos --backup-date=2024-01-15
```

## Best Practices

### Multi-Tenant Development
1. **Always include tenant context** in API calls
2. **Test with multiple tenants** during development
3. **Verify data isolation** in all operations
4. **Use tenant-aware error handling**
5. **Monitor cross-tenant performance impact**

### Platform Operations
1. **Regular tenant health checks**
2. **Automated data isolation audits**
3. **Tenant-specific monitoring dashboards**
4. **Gradual feature rollouts per tenant**
5. **Comprehensive backup strategy per tenant**

### Security Operations
1. **Zero trust tenant access model**
2. **Regular security audits**
3. **Tenant-specific rate limiting**
4. **Comprehensive access logging**
5. **Emergency tenant isolation procedures**

## Related Documentation

- [Multi-Tenant Schema](./MULTITENANT_SCHEMA.md) - Database architecture
- [Platform API](./API_WORKER.md) - Multi-tenant API endpoints
- [Platform Types](../app/types/platform.ts) - TypeScript definitions
- [Migration Guide](./R8R_MIGRATION_BRAIN_DUMP.md) - Transformation strategy