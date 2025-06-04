# R8R Platform Documentation

This directory contains comprehensive documentation for the R8R multi-tenant rating platform.

## Available Documentation

### Platform Architecture

- [Multi-Tenant Schema](./MULTITENANT_SCHEMA.md) - Complete database design for multi-tenant platform
- [Schema Design Summary](./SCHEMA_DESIGN_SUMMARY.md) - Implementation guide and next steps
- [Migration Brain Dump](./R8R_MIGRATION_BRAIN_DUMP.md) - Complete transformation strategy from burrito-rater
- [Design Philosophy](./DESIGN_PHILOSOPHY.md) - Architectural decisions and principles

### Administration and Development

- [Administration and DevOps Guide](./ADMIN_DEVOPS.md) - Deploying, administering, and maintaining the platform
- [API Worker Documentation](./API_WORKER.md) - Cloudflare Worker API endpoints and multi-tenant routing
- [Database Schema (Legacy)](./DATABASE_SCHEMA.md) - Original single-tenant schema (for reference)
- [Database Backup System](./DATABASE_BACKUP.md) - Automated backup and restore procedures

### Technical Integration

- [CAPTCHA Implementation](./CAPTCHA_IMPLEMENTATION.md) - Cloudflare Turnstile integration for tenant security
- [Image Upload System](./IMAGE_UPLOAD.md) - Multi-tenant image storage and CDN delivery
- [Cloudflare Migration](./CLOUDFLARE_MIGRATION.md) - Migration from legacy infrastructure
- [Codebase Reference](./CODEBASE_REFERENCE.md) - Development guide and code organization

### Product Management

- [Platform Roadmap](./PRODUCT_MGMT/ROADMAP.md) - Long-term vision and feature planning for multi-tenant platform
- [Sprint Priorities](./PRODUCT_MGMT/SPRINT_PRIORITIES.md) - Current development focus and immediate tasks  
- [Bug Tracking](./PRODUCT_MGMT/BUGS.md) - Known issues and platform improvements

## Platform Overview

R8R is a multi-tenant SaaS platform for creating custom rating communities. Each tenant gets their own subdomain (like `pizza.r8r.one`, `coffee.r8r.one`) with configurable rating categories, flexible item attributes, and custom branding.

### Architecture
- **Frontend**: Next.js with multi-tenant routing and dynamic configuration
- **Backend**: Cloudflare Workers with tenant-aware API endpoints
- **Database**: Cloudflare D1 with strict tenant data isolation
- **Storage**: Cloudflare R2 for tenant-specific image storage
- **Maps**: Google Maps API with location-based discovery
- **Security**: Cloudflare Turnstile CAPTCHA and Zero Trust access control

### Key Features
- **Subdomain-based tenants**: `burritos.r8r.one`, `pizza-nyc.r8r.one`
- **Configurable rating systems**: Custom categories per tenant (taste/value vs crust/sauce/cheese)
- **Flexible item attributes**: JSON-based ingredient/feature systems
- **Tenant-specific branding**: Colors, logos, custom styling
- **Complete data isolation**: Secure multi-tenant architecture
- **Admin management**: Per-tenant administration and moderation

### Current Status
**Foundation Phase**: Transforming from single-tenant burrito rating app to multi-tenant platform.

- ✅ **Multi-tenant schema designed** - Complete database architecture
- ✅ **TypeScript foundation** - Platform types and interfaces  
- ✅ **Migration strategy** - Preserves existing burrito data
- 🚧 **Infrastructure setup** - New Cloudflare resources
- 📋 **Subdomain routing** - Tenant resolution system
- 📋 **Tenant management** - Admin interface for platform

For more information, see the [main README](../README.md) file.