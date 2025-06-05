# ⭐ R8R Platform

A multi-tenant SaaS platform for creating custom rating communities. Build subdomain-based rating sites like `pizza.r8r.one`, `coffee.r8r.one`, or `books.r8r.one` - each with their own custom categories, attributes, and branding.

## 🌟 Vision

R8R transforms the way communities share and discover experiences. Instead of one-size-fits-all review platforms, create dedicated spaces where enthusiasts can rate exactly what matters to them, with custom attributes and location-based discovery.

## 🚀 Platform Features

### Multi-Tenant Architecture
- **Self-Service Subdomains**: Users can instantly create `anything.r8r.one` communities
- **Wildcard Routing**: Cloudflare Workers handle unlimited subdomain creation automatically
- **Custom rating categories**: Configure taste, quality, service, ambiance - whatever matters
- **Flexible item attributes**: Ingredients, features, genres - fully customizable
- **Tenant-specific branding**: Colors, logos, and custom styling
- **Complete data isolation**: Each tenant's data is strictly separated

### Core Rating Engine
- **🗺️ Interactive Maps**: Location-based discovery with Google Maps integration
- **⭐ Flexible Rating System**: Custom rating criteria per tenant
- **📋 Advanced Filtering**: Sort and filter by any attribute or rating
- **📱 Mobile-First Design**: Responsive across all devices

### Administration & Management
- **🔐 Tenant Management**: Onboarding, configuration, and settings
- **👨‍💼 Admin Interface**: Rating moderation, analytics, and system monitoring
- **📊 Real-Time Updates**: Live data sync across all interfaces
- **🔒 Security**: CAPTCHA protection, location validation, secure authentication

## 💻 Tech Stack

### Frontend
- **Next.js 15.2+** with React and TypeScript
- **Tailwind CSS** with Tremor UI components for design system
- **Google Maps API** for location-based features
- **Multi-tenant routing** and subdomain handling

### Backend & Infrastructure
- **Cloudflare Workers** for serverless API and wildcard routing (edge-deployed globally)
- **Cloudflare D1** for SQLite-compatible edge database with multi-tenant schema
- **Cloudflare Pages** for static site hosting with tenant-aware routing
- **Cloudflare R2** for image storage and CDN delivery

### Architecture Principles
- **Cloud-Native First**: Zero self-hosted components
- **Edge-First**: Global deployment for minimal latency
- **API-First**: Clean separation between frontend and backend
- **Event-Driven**: Real-time updates and optimistic UI

## 🏗️ Current Status

**Foundation Phase**: Currently transforming from single-tenant burrito rating app to multi-tenant platform.

### ✅ Completed
- Solid cloud-native infrastructure on Cloudflare
- Production-ready admin interface and backup systems
- Comprehensive documentation and deployment workflows
- Mobile-responsive UI with advanced features

### 🚧 In Progress
- Multi-tenant database schema design
- Tenant management system
- Subdomain routing and configuration
- Generic rating form components

### 📋 Coming Next
- Tenant onboarding flow
- Custom branding system
- Category templates (pizza, coffee, books, etc.)
- Beta tenant deployments

## 🏁 Getting Started

### Prerequisites
- Node.js (v18 or later)
- npm (v10 or later)
- Cloudflare account with Workers, D1, and Pages enabled
- Google Maps API key

### Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/bennyb0y/r8r.git
   cd r8r
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create `.env.local` with:
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   NEXT_PUBLIC_API_BASE_URL=https://your-worker.your-account.workers.dev
   NEXT_PUBLIC_ADMIN_PASSWORD=your_admin_password
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_turnstile_site_key
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

   Access the application at http://localhost:3000

### Deployment

Deploy to Cloudflare's edge network:

```bash
# Deploy API worker
npm run deploy:worker

# Deploy frontend
npm run deploy:app

# Deploy everything
npm run deploy
```

See [Administration Guide](./docs/ADMIN_DEVOPS.md) for detailed deployment instructions.

## 📁 Project Structure

```
r8r/
├── app/                    # Next.js application
│   ├── admin/             # Admin interface and tenant management
│   ├── components/        # Reusable React components
│   ├── onboarding/        # Tenant registration flow (planned)
│   └── types/             # TypeScript type definitions
├── api/                   # Cloudflare Worker API
├── lib/                   # Database interfaces and utilities
├── docs/                  # Comprehensive documentation
├── backup-worker/         # Automated database backup system
└── public/               # Static assets and routing config
```

## 📚 Documentation

### Platform Documentation
- [Migration Brain Dump](./docs/R8R_MIGRATION_BRAIN_DUMP.md) - Complete transformation strategy
- [Design Philosophy](./docs/DESIGN_PHILOSOPHY.md) - Architectural decisions and principles
- [Admin & DevOps Guide](./docs/ADMIN_DEVOPS.md) - Deployment and management

### Technical References
- [API Documentation](./docs/API_WORKER.md) - Worker endpoints and usage
- [Database Schema](./docs/DATABASE_SCHEMA.md) - Current and planned schemas
- [Codebase Reference](./docs/CODEBASE_REFERENCE.md) - Development guide

### Product Management
- [Platform Roadmap](./docs/PRODUCT_MGMT/ROADMAP.md) - Feature timeline and vision
- [Sprint Priorities](./docs/PRODUCT_MGMT/SPRINT_PRIORITIES.md) - Current development focus
- [Bug Tracking](./docs/PRODUCT_MGMT/BUGS.md) - Known issues and resolutions

## 🎯 Roadmap

### Phase 1: Foundation (Current)
- [x] Cloud-native infrastructure
- [x] Admin interface and tooling
- [ ] Multi-tenant database schema
- [ ] Tenant management system

### Phase 2: Platform Features
- [ ] Subdomain routing
- [ ] Configurable rating forms
- [ ] Custom tenant branding
- [ ] Category templates

### Phase 3: Launch
- [ ] Tenant onboarding flow
- [ ] Beta tenant deployments
- [ ] Analytics and monitoring
- [ ] Production scaling

## 🤝 Contributing

We're building the future of community-driven rating platforms! 

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and run tests (`npm run lint`)
4. Commit with clear messages (`git commit -m 'Add tenant management system'`)
5. Push and open a Pull Request

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Built With

- [Next.js](https://nextjs.org/) - React framework
- [Cloudflare Workers](https://workers.cloudflare.com/) - Serverless compute
- [Cloudflare D1](https://developers.cloudflare.com/d1/) - Edge database
- [Google Maps API](https://developers.google.com/maps) - Location services
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Tremor](https://www.tremor.so/) - React UI components

---

**R8R Platform** - *Empowering communities to rate what matters*