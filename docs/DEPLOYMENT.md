# R8R Platform Deployment Guide

## ⚠️ CRITICAL: Read This First

**ALWAYS reference this file before any deployment to avoid configuration errors.**

This guide covers the complete deployment process for the R8R multi-tenant rating platform. The platform has multiple configuration files - some working, some broken. Follow this guide exactly.

## Configuration File Status

### ✅ WORKING Configurations:
- **`wrangler.worker.toml`** - API Worker (points to existing `api/worker.js`)
- **`wrangler.routing.toml`** - Routing Worker (for `*.r8r.one` subdomains)
- **`wrangler.pages.toml`** - Pages deployment (detailed config)
- **`wrangler.toml`** - Basic Pages config (fallback)
- **`backup-worker/wrangler.backup.toml`** - Backup worker

### ❌ BROKEN Configurations:
- **`wrangler.platform.toml`** - Points to non-existent `api/platform-worker.js`

### 📦 Package.json Scripts Status:
- **✅ WORKING**: `deploy:legacy`, `deploy:worker`, `deploy:pages`, `build`
- **❌ BROKEN**: `deploy`, `deploy:platform-worker` (use platform.toml)

## Architecture Components

### 1. Routing Layer (Cloudflare Workers)
- **Purpose**: Handle wildcard subdomain routing (`*.r8r.one`)
- **File**: `routing-worker.js`
- **Config**: `wrangler.routing.toml` ✅
- **Deployment**: Manual with account ID

### 2. Frontend Layer (Cloudflare Pages)
- **Purpose**: Next.js application with tenant-aware routing
- **Project**: `r8r-platform`
- **Build Output**: `out/` directory (Next.js static export)
- **Config**: `wrangler.pages.toml` ✅ (primary) or `wrangler.toml` ✅ (basic)

### 3. API Layer (Cloudflare Workers)
- **Purpose**: Tenant-aware API endpoints
- **File**: `api/worker.js` ✅
- **Config**: `wrangler.worker.toml` ✅
- **Bindings**: `DB` (database), `BUCKET` (R2 storage)

### 4. Backup Layer (Cloudflare Workers)
- **Purpose**: Automated daily database backups
- **File**: `backup-worker/src/index.ts`
- **Config**: `backup-worker/wrangler.backup.toml` ✅
- **Schedule**: Daily at midnight UTC

## Prerequisites

- Node.js (v18 or later)
- npm (v10 or later)
- Cloudflare account with Workers and Pages enabled
- Cloudflare API token with appropriate permissions
- Domain configured with Cloudflare DNS (r8r.one)

## Environment Setup

### Required Environment Variables

Create a `.env.local` file in the project root:

```env
# Cloudflare Configuration (REQUIRED for deployment)
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id

# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://your-api-worker.your-account.workers.dev

# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Mapbox Access Token (for new map component)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token

# Admin Configuration
NEXT_PUBLIC_ADMIN_PASSWORD=your_secure_password

# Cloudflare Turnstile (CAPTCHA)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_turnstile_site_key
```

### Security Note
- **Never commit actual keys/IDs to git**
- **Always use environment variable references in documentation**
- **Keep `.env.local` in `.gitignore`**

### Cloudflare Dashboard Configuration

In the Cloudflare Pages dashboard, set these environment variables:
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_ADMIN_PASSWORD`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`

## Deployment Process

### 🚨 CRITICAL: Use ONLY These Commands

**DO NOT use `npm run deploy` - it's broken and uses the faulty platform.toml config.**

### Step 1: Deploy the Routing Worker

The routing worker handles wildcard subdomain routing and must be deployed first:

```bash
# Deploy the routing worker (set account ID in .env.local)
CLOUDFLARE_ACCOUNT_ID=$CLOUDFLARE_ACCOUNT_ID npx wrangler deploy --config wrangler.routing.toml --env production
```

This deploys the worker with routes:
- `r8r.one/*`
- `*.r8r.one/*`

### Step 2: Deploy the API Worker

Deploy the backend API worker using the WORKING config:

```bash
# ✅ CORRECT: Deploy API worker (uses wrangler.worker.toml)
npm run deploy:worker
```

Or explicitly:
```bash
npx wrangler deploy --config wrangler.worker.toml
```

### Step 3: Deploy the Frontend

Build and deploy the Next.js application:

```bash
# ✅ CORRECT: Build first
npm run build

# ✅ CORRECT: Deploy to Pages
npm run deploy:pages
```

Or explicitly:
```bash
npm run build
npx wrangler pages deploy out --project-name r8r-platform
```

### 🎯 Complete Working Deployment Sequence

```bash
# Complete deployment (use this exact sequence)
CLOUDFLARE_ACCOUNT_ID=$CLOUDFLARE_ACCOUNT_ID npx wrangler deploy --config wrangler.routing.toml --env production
npm run deploy:worker
npm run build
npm run deploy:pages
```

### Step 4: Configure DNS

Ensure your DNS is configured correctly:

```
# DNS Records in Cloudflare Dashboard
Type: A
Name: r8r.one
Value: 192.0.2.1  # Placeholder - handled by Workers
Proxy: Enabled (orange cloud)

Type: CNAME
Name: *
Target: r8r.one
Proxy: Enabled (orange cloud)
```

## Deployment Commands Reference

### ✅ WORKING Individual Component Deployment

```bash
# Deploy routing worker only
CLOUDFLARE_ACCOUNT_ID=$CLOUDFLARE_ACCOUNT_ID npx wrangler deploy --config wrangler.routing.toml --env production

# Deploy API worker only  
npm run deploy:worker

# Deploy frontend only
npm run build && npm run deploy:pages

# Deploy backup worker
cd backup-worker && npx wrangler deploy --config wrangler.backup.toml
```

### ❌ BROKEN Commands (DO NOT USE)
```bash
# These commands are BROKEN - avoid them:
npm run deploy                    # Uses broken platform.toml
npm run deploy:platform-worker    # Uses broken platform.toml  
npm run deploy:app                # Uses wrong build directory
```

### 🎯 Recommended Full Deployment
```bash
# Use this sequence for complete deployment:
./scripts/deploy-all.sh  # (if exists) or run individual commands above
```

### Build Commands

```bash
# Build frontend for production
npm run build

# Analyze bundle sizes
npm run analyze

# Run linting
npm run lint
```

### Development Commands

```bash
# Start local development server
npm run dev

# Test routing worker locally
npx wrangler dev --config wrangler.routing.toml

# Test API worker locally
npx wrangler dev --config wrangler.worker.toml
```

## Configuration Files

### wrangler.routing.toml
```toml
name = "r8r-routing"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]
main = "routing-worker.js"
account_id = "your_account_id"

[env.production]
routes = [
  { pattern = "r8r.one/*", zone_name = "r8r.one" },
  { pattern = "*.r8r.one/*", zone_name = "r8r.one" }
]
```

### wrangler.worker.toml
```toml
name = "r8r-platform-api"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]
main = "api/worker.js"

[[d1_databases]]
binding = "DB"
database_name = "r8r-platform-db"
database_id = "your_database_id"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "r8r-images"
```

### wrangler.pages.toml
```toml
name = "r8r-platform"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]
account_id = "your_account_id"

[build]
command = "npm run build"
cwd = "."
watch_dir = "."

[build.environment]
NODE_VERSION = "18"
```

## Deployment Flow Diagram

```
┌─────────────────┐
│                 │
│  Deploy Routing │
│     Worker      │
│                 │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│                 │
│   Deploy API    │
│     Worker      │
│                 │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│                 │
│ Build & Deploy  │
│    Frontend     │
│                 │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│                 │
│ Configure DNS   │
│   (if needed)   │
│                 │
└─────────────────┘
```

## Wildcard Subdomain Flow

```
User Request: burritos.r8r.one
              │
              ▼
┌─────────────────────────────┐
│     Cloudflare DNS          │
│   (*.r8r.one → Workers)     │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│     Routing Worker          │
│   (r8r-routing)             │
│   • Detect subdomain       │
│   • Route to Pages          │
│   • Preserve hostname       │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│     Cloudflare Pages        │
│   (r8r-platform)            │
│   • Detect tenant from host │
│   • Load tenant config      │
│   • Render tenant UI        │
└─────────────────────────────┘
```

## Verification Steps

After deployment, verify each component:

### 1. Verify Routing Worker
```bash
# Check worker status
npx wrangler list

# Test routing
curl -I https://burritos.r8r.one
curl -I https://pizza.r8r.one
```

### 2. Verify API Worker
```bash
# Test API endpoints
curl https://your-worker.your-account.workers.dev/api/health
curl https://your-worker.your-account.workers.dev/api/ratings
```

### 3. Verify Frontend
- Visit `https://r8r.one` (should show platform landing)
- Visit `https://burritos.r8r.one` (should show burrito interface)
- Visit `https://pizza.r8r.one` (should show pizza interface)
- Check console for any errors

### 4. Test Full Flow
1. Create a rating on a subdomain
2. Verify it appears in admin interface
3. Test image upload (if applicable)
4. Test admin authentication

## Troubleshooting

### Common Issues

#### Routing Not Working
- Check DNS configuration
- Verify routing worker deployment
- Check worker routes in Cloudflare dashboard

#### Subdomain Shows 522 Error
- Verify routing worker is deployed with correct routes
- Check account ID matches in all configs
- Ensure wildcard DNS is configured

#### Frontend Not Loading
- Check Pages deployment status
- Verify environment variables
- Check build output for errors

#### API Errors
- Verify API worker deployment
- Check D1 database bindings
- Test API endpoints directly

### Debugging Commands

```bash
# Check worker logs
npx wrangler tail r8r-routing --env production
npx wrangler tail r8r-platform-api

# Check deployment status
npx wrangler deployments list --name r8r-routing
npx wrangler deployments list --name r8r-platform-api

# Test local routing
npx wrangler dev --config wrangler.routing.toml --local
```

### Deployment Health Checks

After deployment, run these checks:

```bash
# Check all workers are deployed
npx wrangler list | grep -E "(r8r-routing|r8r-platform-api)"

# Test main domain
curl -I https://r8r.one

# Test subdomain routing
curl -I https://test.r8r.one

# Check Pages deployment
curl -I https://r8r-platform.pages.dev
```

## Rollback Procedures

### Rollback Routing Worker
```bash
# List previous deployments
npx wrangler deployments list --name r8r-routing

# Rollback to previous version
npx wrangler rollback --name r8r-routing --version-id <previous-version-id>
```

### Rollback API Worker
```bash
npx wrangler rollback --name r8r-platform-api --version-id <previous-version-id>
```

### Rollback Frontend
```bash
# Redeploy previous build
git checkout <previous-commit>
npm run build
npm run deploy:app
```

## Monitoring

### Key Metrics to Monitor
- Worker invocations and errors
- Pages deployment status
- DNS resolution times
- API response times
- Database query performance

### Cloudflare Dashboard Sections
- **Workers & Pages**: Deployment status and metrics
- **Analytics**: Traffic and performance data
- **DNS**: Domain and subdomain configuration
- **Speed**: Performance optimization settings

## Security Considerations

### Access Control
- API tokens with minimal required permissions
- Environment variables for sensitive data
- Admin authentication for management functions

### Network Security
- HTTPS enforcement
- CORS configuration
- Rate limiting (via Cloudflare)

### Data Security
- Tenant isolation at database level
- Secure image upload validation
- Input sanitization and validation

## Performance Optimization

### Edge Optimization
- Static asset caching (1 year)
- API response caching (5 minutes)
- Image optimization via Cloudflare

### Bundle Optimization
- Code splitting by route and tenant
- Dynamic imports for large components
- Tree shaking for unused code

### Database Optimization
- Efficient multi-tenant queries
- Proper indexing for tenant_id
- Query result caching

## Database Migration

The platform includes complete migration from legacy single-tenant to multi-tenant schema:

### Legacy Data Migration (Completed)
The following migration has been completed and all legacy data is now in the new multi-tenant schema:

- **42 legacy burrito ratings** migrated from `burrito-rater-db` to `r8r-platform-db`
- **All legacy data isolated** to `burritos` tenant accessible at `burritos.r8r.one`
- **New multi-tenant schema** with normalized relationships and JSON flexibility
- **Backward compatibility** maintained through transformation layer

### Migration Scripts
```bash
# Migration scripts available for reference:
scripts/migrate_to_new_schema.js        # Main migration logic
scripts/new_schema_migration.sql        # SQL migration statements  
scripts/legacy_data_export.json         # Exported legacy data

# Verification commands:
npx wrangler d1 execute r8r-platform-db --remote --command="SELECT COUNT(*) FROM tenants;"
npx wrangler d1 execute r8r-platform-db --remote --command="SELECT COUNT(*) FROM ratings WHERE tenant_id = 'burritos';"
```

### Running New Migrations
```bash
# Run new migrations against D1 database
npx wrangler d1 execute r8r-platform-db --remote --file=scripts/new_migration.sql

# Verify migration results
npx wrangler d1 execute r8r-platform-db --remote --command="SELECT COUNT(*) FROM ratings;"
```

### Migration Architecture
The new schema provides:
- **Tenant isolation**: Complete data separation between tenants
- **Normalized relationships**: Items and ratings properly linked
- **JSON flexibility**: Extensible configurations and data structures
- **Legacy compatibility**: Existing APIs continue to work unchanged

## Maintenance

### Regular Tasks
- Monitor deployment status
- Review error logs
- Update dependencies
- Backup database
- Rotate API tokens

### Updates
- Deploy API changes first
- Test in staging environment
- Monitor metrics after deployment
- Have rollback plan ready

## Related Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [API Documentation](./API_WORKER.md)
- [Multi-tenant Schema](./MULTITENANT_SCHEMA.md)