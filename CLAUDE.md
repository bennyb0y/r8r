# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Development
```bash
npm run dev           # Start Next.js development server
npm run build         # Build application for production
npm run lint          # Run ESLint for code quality
npm run analyze       # Build with bundle analyzer for performance analysis
```

### Deployment
```bash
npm run deploy:app    # Deploy frontend to Cloudflare Pages
npm run deploy:worker # Deploy API worker to Cloudflare Workers
npm run deploy        # Deploy both worker and app (runs deploy:worker then deploy:app)
```

### Routing Worker Deployment
```bash
# Deploy wildcard routing worker (for *.r8r.one support)
CLOUDFLARE_ACCOUNT_ID=4467ef47f4344bb87ee9fc681c6ca144 npx wrangler deploy --config wrangler.routing.toml --env production
```

## Project Architecture

### Tech Stack
- **Frontend**: Next.js 15+ with React and TypeScript
- **Styling**: Tailwind CSS with Tremor UI components
- **Backend**: Cloudflare Workers (serverless API)
- **Database**: Cloudflare D1 (edge database)
- **Maps**: Google Maps API with @react-google-maps/api
- **Hosting**: Cloudflare Pages for frontend

### Cloud-Native Architecture
This is a fully serverless, edge-first application with zero self-hosted components:
- **Routing Layer**: Cloudflare Workers handle wildcard subdomain routing (*.r8r.one)
- **Frontend**: Cloudflare Pages with tenant-aware Next.js application
- **API Layer**: Cloudflare Workers for tenant-isolated backend services
- **Database**: Cloudflare D1 with multi-tenant schema
- All development connects to cloud services directly
- No local API or database development environment
- Single source of truth in Cloudflare D1 for all environments
- Edge-deployed Workers for global low-latency API access
- True self-service subdomain creation

### Key Directories
- `app/` - Next.js app directory with pages and components
- `app/admin/` - Admin interface with authentication wrapper
- `app/components/` - Reusable React components (includes TenantPage.tsx)
- `app/contexts/` - React context providers (TenantContext)
- `app/dev/[tenant]/` - Dynamic development routing for localhost testing
- `api/` - Cloudflare Worker code (worker.js)
- `lib/` - Database interfaces and shared utilities (tenant.ts)
- `docs/` - Comprehensive project documentation
- `routing-worker.js` - Wildcard subdomain routing worker
- `wrangler.routing.toml` - Routing worker configuration

### Admin Interface Architecture
Centralized under `/app/admin/` with:
- Single authentication layer via `layout.tsx`
- Feature-specific routes: `/dashboard`, `/monitoring`, `/ratings`
- Real-time updates with 30-second fallback polling
- Event-driven communication between components

### Database Schema
The main `Rating` interface (defined in `app/components/TenantPage.tsx`) includes:
- Location data (zipcode)
- Universal rating metrics (quality thumbs system, value yes/no, price)
- Generic item details (restaurant name, item title)
- User identity (reviewer name, identity password)
- Backward compatibility with legacy numeric rating systems

### Environment Variables
All environment variables must be in `.env.local` with `NEXT_PUBLIC_` prefix:
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key
- `NEXT_PUBLIC_API_BASE_URL` - Cloudflare Worker API URL
- `NEXT_PUBLIC_ADMIN_PASSWORD` - Admin interface password
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` - Cloudflare CAPTCHA key

### API Configuration
The `getApiUrl()` function in `app/config.ts` handles API endpoint construction with proper `/api/` prefixing for Cloudflare Workers routing.

### Multi-Tenant Architecture
The platform supports unlimited self-service tenant creation with complete isolation:
- **Dynamic Routing**: Any subdomain (*.r8r.one) automatically works without manual configuration
- **Tenant Detection**: API worker detects tenants from hostname, headers, and query parameters
- **Universal Components**: Single TenantPage component handles all tenant types with configurable theming
- **Development Testing**: `/dev/[tenant]` routes allow localhost testing of any tenant
- **Data Isolation**: All database queries are tenant-scoped for complete data separation
- **Generic Rating System**: Universal thumbs up/neutral/down quality ratings and yes/no value ratings
- **Cross-Category Support**: Works for food, beverages, services, products, or any reviewable items

### Development Philosophy
- Cloud-native first with serverless everything
- Event-driven design for real-time updates
- API-first development with clean separation
- Edge-first deployment for global performance
- Zero Trust security model for admin access
- Self-service tenant creation without developer intervention

## Important Notes

### Code Style
- Follow TypeScript strict mode conventions
- Use Zod schemas for type validation
- Prefer functional components with hooks
- Follow Next.js 13+ app directory patterns
- No comments should be added unless specifically requested

### Testing and Quality
Always run `npm run lint` before committing changes to ensure code quality.

### Documentation
Comprehensive documentation is available in the `/docs` directory covering:
- Deployment procedures (`ADMIN_DEVOPS.md`)
- API reference (`API_WORKER.md`)  
- Database schema (`DATABASE_SCHEMA.md`)
- Design philosophy (`DESIGN_PHILOSOPHY.md`)
- Product management (`PRODUCT_MGMT/` folder)