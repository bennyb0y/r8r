# R8R Platform Deployment Guide

## Overview

This guide covers the complete deployment process for the R8R multi-tenant rating platform. The platform uses a three-layer architecture with wildcard subdomain support for unlimited tenant creation.

## Architecture Components

### 1. Routing Layer (Cloudflare Workers)
- **Purpose**: Handle wildcard subdomain routing (`*.r8r.one`)
- **File**: `routing-worker.js`
- **Config**: `wrangler.routing.toml`

### 2. Frontend Layer (Cloudflare Pages)
- **Purpose**: Next.js application with tenant-aware routing
- **Project**: `r8r-platform`
- **Build**: Static export (`out/` directory)

### 3. API Layer (Cloudflare Workers)
- **Purpose**: Tenant-aware API endpoints
- **File**: `api/worker.js`
- **Config**: `wrangler.worker.toml`

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
# Cloudflare Configuration
CLOUDFLARE_ACCOUNT_ID=your_account_id

# API Configuration (for production APIs when available)
NEXT_PUBLIC_API_BASE_URL=https://your-worker-name.your-account.workers.dev

# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Admin Configuration
NEXT_PUBLIC_ADMIN_PASSWORD=your_secure_password

# Cloudflare Turnstile (CAPTCHA)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_turnstile_site_key
```

### Cloudflare Dashboard Configuration

In the Cloudflare Pages dashboard, set these environment variables:
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_ADMIN_PASSWORD`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`

## Deployment Process

### Step 1: Deploy the Routing Worker

The routing worker handles wildcard subdomain routing and must be deployed first:

```bash
# Deploy the routing worker
CLOUDFLARE_ACCOUNT_ID=your_account_id npx wrangler deploy --config wrangler.routing.toml --env production
```

This deploys the worker with routes:
- `r8r.one/*`
- `*.r8r.one/*`

### Step 2: Deploy the API Worker

Deploy the backend API worker:

```bash
# Deploy the API worker
npm run deploy:worker
```

Or with explicit account ID:
```bash
CLOUDFLARE_ACCOUNT_ID=your_account_id npx wrangler deploy --config wrangler.worker.toml
```

### Step 3: Deploy the Frontend

Build and deploy the Next.js application:

```bash
# Build and deploy frontend
npm run build
CLOUDFLARE_ACCOUNT_ID=your_account_id npx wrangler pages deploy out --project-name=r8r-platform --commit-dirty=true
```

Or use the npm script:
```bash
npm run deploy:app
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

## Deployment Commands

### Individual Component Deployment

```bash
# Deploy routing worker only
CLOUDFLARE_ACCOUNT_ID=your_account_id npx wrangler deploy --config wrangler.routing.toml --env production

# Deploy API worker only  
npm run deploy:worker

# Deploy frontend only
npm run deploy:app

# Full deployment (all components)
npm run deploy
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