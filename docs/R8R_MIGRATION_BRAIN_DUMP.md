# R8R Migration Brain Dump

This document captures the complete context and decisions made during the transition from burrito-rater to the r8r.one multi-tenant platform.

## Project Evolution

### Original Project
- **Purpose**: Single-purpose burrito rating application
- **Domain**: burrito-rater (Cloudflare deployment)
- **Users**: Test data only, no real users
- **Architecture**: Single-tenant, burrito-specific

### New Vision: R8R Platform
- **Purpose**: Multi-tenant SaaS platform for custom rating sites
- **Domain**: r8r.one (newly registered)
- **Vision**: Users create their own rating communities (pizza.r8r.one, coffee.r8r.one, books.r8r.one)
- **Architecture**: Subdomain-based multi-tenancy

## Strategic Decisions Made

### Migration Approach: Fork + Cleanup
- **Decision**: Fork existing codebase and clean up vs rebuild from scratch
- **Rationale**: No real users to impact, strong infrastructure foundation
- **Timeline**: 6-8 weeks (vs 9-13 weeks for migration, 10+ weeks from scratch)
- **Approach**: Keep 70% infrastructure, rebuild 30% domain-specific logic

### Technical Analysis Results

#### Strong Foundation to Preserve (70%)
- Next.js 15+ with TypeScript architecture
- Cloudflare Workers + D1 + Pages deployment
- Google Maps integration (@react-google-maps/api)
- Tailwind CSS + Tremor UI components
- Admin authentication and session management
- Image upload and R2 storage integration
- Development tooling (ESLint, build scripts)
- Documentation structure

#### Components Requiring Rebuild (30%)
- Database schema (burrito-specific → flexible)
- Rating form components (hardcoded → configurable)
- API endpoints (static field mappings → dynamic)
- UI strings and branding (burrito → tenant-customizable)

## Technical Debt Assessment

### Database Schema - HIGH Rigidity
**Current burrito-specific fields:**
```sql
burritoTitle TEXT NOT NULL,
hasPotatoes BOOLEAN NOT NULL DEFAULT FALSE,
hasCheese BOOLEAN NOT NULL DEFAULT FALSE,
hasBacon BOOLEAN NOT NULL DEFAULT FALSE,
hasChorizo BOOLEAN NOT NULL DEFAULT FALSE,
hasAvocado BOOLEAN NOT NULL DEFAULT FALSE,
hasVegetables BOOLEAN NOT NULL DEFAULT FALSE,
```

**Generic fields to preserve:**
- `id`, `createdAt`, `updatedAt`
- `restaurantName`, `latitude`, `longitude`
- `rating`, `taste`, `value`, `price`
- `review`, `reviewerName`, `reviewerEmoji`

### UI Components - MODERATE Coupling
**Highly reusable:**
- Map components (location-agnostic)
- Admin interface patterns
- Authentication and CAPTCHA components

**Needs refactoring:**
- `RatingForm.tsx` - hardcoded ingredient checkboxes
- Navigation and branding strings
- Form validation logic

### API Design - MODERATE Genericity
**Generic patterns:**
- RESTful endpoints
- CRUD operations
- Authentication flow

**Burrito-specific elements:**
- Hardcoded field mappings in INSERT statements
- Ingredient-specific validation

## New Multi-Tenant Architecture

### Database Schema Design
```sql
-- Core tenant management
CREATE TABLE tenants (
  id TEXT PRIMARY KEY,
  subdomain TEXT UNIQUE,
  name TEXT,
  category TEXT, -- 'pizza', 'coffee', 'books', etc.
  owner_id TEXT,
  created_at TIMESTAMP,
  settings JSON -- flexible: rating fields, themes, branding
);

-- Generic items being rated
CREATE TABLE items (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id),
  name TEXT, -- "Supreme Pizza", "Cortado", "1984"
  location_lat REAL,
  location_lng REAL,
  venue_name TEXT,
  attributes JSON, -- flexible: ingredients, features, etc.
  created_at TIMESTAMP
);

-- Flexible rating system
CREATE TABLE ratings (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id),
  item_id TEXT REFERENCES items(id),
  scores JSON, -- flexible: taste, value, service, etc.
  review TEXT,
  reviewer_info JSON,
  created_at TIMESTAMP
);
```

### Component Architecture
```typescript
// Generic rating configuration
interface RatingConfig {
  itemName: string; // "Pizza", "Coffee", "Book"
  scoreFields: ScoreField[]; // taste, quality, value, etc.
  attributeFields: AttributeField[]; // ingredients, features
  theme: TenantTheme;
}

// Tenant-aware components
interface TenantContext {
  tenantId: string;
  subdomain: string;
  config: RatingConfig;
  branding: BrandingConfig;
}
```

### Platform Features

#### Core Multi-Tenant Features
1. **Tenant Management System**
   - Registration and onboarding flow
   - Subdomain provisioning and validation
   - Tenant settings and configuration

2. **Subdomain Routing**
   - `pizza.r8r.one` → tenant isolation
   - Worker-based tenant resolution
   - Custom domain support (future)

3. **Configuration System**
   - Custom rating categories (taste, quality, service)
   - Flexible item attributes (ingredients, features)
   - Tenant-specific themes and branding

4. **Generic Rating Engine**
   - Works for any item type
   - Configurable forms and validation
   - Location-based features for applicable categories

## Implementation Phases

### Phase 1: Foundation Cleanup (Week 1)
1. **Repository Setup**
   - Fork to new r8r directory
   - Update package.json (name, description)
   - Remove burrito-specific branding

2. **Database Schema Migration**
   - Design new multi-tenant schema
   - Create migration scripts
   - Update TypeScript interfaces

3. **Core Architecture**
   - Add tenant management types
   - Create configuration system foundation
   - Update API routing for tenant isolation

### Phase 2: Component Generalization (Week 2-3)
1. **Rating Form Refactor**
   - Convert hardcoded ingredients to configurable attributes
   - Make form fields dynamic based on tenant config
   - Update validation logic

2. **UI Component Updates**
   - Remove burrito-specific strings
   - Add tenant branding system
   - Update navigation and layout

3. **Map Integration**
   - Make markers tenant-aware
   - Update info windows for generic items
   - Maintain location-based features

### Phase 3: Multi-Tenant Features (Week 4-5)
1. **Tenant Management**
   - Registration and onboarding flow
   - Admin interface for tenant management
   - Settings and configuration UI

2. **Subdomain Routing**
   - Worker-based tenant resolution
   - Subdomain validation and provisioning
   - Tenant-specific data isolation

3. **API Generalization**
   - Dynamic field mapping based on tenant config
   - Tenant-specific validation rules
   - Multi-tenant query patterns

### Phase 4: Platform Polish (Week 6)
1. **User Experience**
   - Onboarding flow for new tenants
   - Example templates (pizza, coffee, restaurants)
   - Help documentation and guides

2. **Analytics and Monitoring**
   - Tenant-specific analytics dashboard
   - Platform-wide monitoring
   - Usage metrics and insights

3. **Deployment and Launch**
   - r8r.one domain setup
   - Production deployment
   - Initial tenant seeding

## Preserved Development Workflow

### Development Commands
```bash
npm run dev           # Start Next.js development server
npm run build         # Build application for production
npm run lint          # Run ESLint for code quality
npm run deploy:app    # Deploy frontend to Cloudflare Pages
npm run deploy:worker # Deploy API worker to Cloudflare Workers
npm run deploy        # Deploy both (worker first, then app)
```

### Environment Variables Pattern
```bash
# Core platform variables
NEXT_PUBLIC_API_BASE_URL=https://api.r8r.one
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
NEXT_PUBLIC_ADMIN_PASSWORD=...

# CAPTCHA and security
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
TURNSTILE_SECRET_KEY=...

# Cloudflare configuration
CF_ACCOUNT_ID=...
CF_API_TOKEN=...

# Storage and CDN
NEXT_PUBLIC_R2_API_TOKEN=...
NEXT_PUBLIC_CDN_URL=...
```

## Key Files to Focus On

### Immediate Changes Required
- `package.json` - Update project name and description
- `app/layout.tsx` - Remove burrito branding
- `lib/db.ts` - New flexible database schema
- `app/components/RatingForm.tsx` - Make configurable
- `api/worker.js` - Add tenant isolation and routing

### New Files to Create
- `lib/tenants.ts` - Tenant management utilities
- `lib/config.ts` - Configuration system
- `app/admin/tenants/` - Tenant administration interface
- `app/onboarding/` - New tenant registration flow
- `app/types/tenant.ts` - Multi-tenant type definitions

### Documentation Updates
- Update all docs to reflect multi-tenant architecture
- Create tenant onboarding guides
- API documentation for multi-tenant endpoints

## Current Repository State

### What We Have
- Clean git history with good commit practices
- Working Cloudflare Workers + D1 + Pages deployment
- Comprehensive documentation in `/docs` directory
- Solid TypeScript and ESLint configuration
- Test data only (no real users to migrate)

### What We Keep
- Entire infrastructure and deployment pipeline
- Google Maps integration and location features
- Admin authentication and session management
- Image upload and storage systems
- Development tooling and configuration

### What We Transform
- Single-tenant → multi-tenant architecture
- Burrito-specific → category-agnostic
- Hardcoded forms → configurable systems
- Static branding → tenant-customizable

## Success Metrics

### Technical Goals
- Subdomain routing working (`pizza.r8r.one`)
- Tenant isolation and data security
- Configurable rating systems
- Scalable multi-tenant architecture

### Platform Goals
- Easy tenant onboarding (< 5 minutes)
- Multiple category templates available
- Real tenants using the platform
- Foundation for future enterprise features

## Next Steps

1. **Fork Repository**: Move current codebase to new r8r directory
2. **Clean Foundation**: Remove burrito-specific elements
3. **Build Multi-Tenant Core**: Database schema and tenant management
4. **Generalize Components**: Make UI configurable and reusable
5. **Launch Platform**: Deploy r8r.one with initial tenant examples

This brain dump provides complete context for continuing development in the new r8r directory with full knowledge of architectural decisions and implementation strategy.