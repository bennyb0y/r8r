# Burrito Rater Codebase Reference

This document provides a comprehensive reference of all custom variables and functions used throughout the Burrito Rater application.

## Table of Contents
- [Application Structure](#application-structure)
- [Environment Variables](#environment-variables)
- [Types and Interfaces](#types-and-interfaces)
- [Utility Functions](#utility-functions)
- [Map Component Functions](#map-component-functions)
- [Rating Form Functions](#rating-form-functions)
- [State Variables](#state-variables)

## Application Structure

The application follows Next.js 13+ app directory structure with a clear separation of concerns:

### Root Directory Structure
```
burrito-rater/
├── app/               # Main application code (Next.js app directory)
├── api/               # Cloudflare Worker API code
├── docs/              # Documentation files
├── public/            # Static assets (images, _routes.json)
├── scripts/          # Utility scripts and tools
└── .env.local        # Environment variables (not in git)
```

### App Directory (`app/`)
```
app/
├── components/        # Reusable React components
│   ├── Map.tsx       # Google Maps integration
│   ├── RatingForm.tsx # Rating submission form
│   └── ...
├── admin/            # Admin interface pages and components
│   ├── layout.tsx    # Admin authentication wrapper
│   ├── page.tsx      # Admin entry point
│   ├── AdminAuth.tsx  # Admin authentication component
│   ├── dashboard/    # Admin dashboard
│   │   └── page.tsx  # Dashboard implementation
│   └── ratings/      # Ratings management
│       └── page.tsx  # Ratings interface
├── guide/            # User guide pages
├── list/            # Rating list view
├── utils/           # Utility functions and helpers
├── layout.tsx       # Root layout with metadata
├── page.tsx         # Homepage with map
├── favicon.ico      # Fallback favicon
├── icon.svg         # Primary favicon
├── globals.css      # Global styles
└── config.ts        # App configuration
```

### Component Organization (`app/components/`)
- **Map Components**: Map-related components for displaying ratings
- **Form Components**: Rating submission and editing forms
- **UI Components**: Reusable UI elements like buttons and modals
- **Layout Components**: Page layout and structure components

### API Directory (`api/`)
```
api/
├── worker.js         # Main Cloudflare Worker code
└── schema.sql        # Database schema definitions
```

### Documentation (`docs/`)
```
docs/
├── ADMIN_DEVOPS.md   # Deployment and maintenance guide
├── API_WORKER.md     # API documentation
├── CODEBASE_REFERENCE.md  # This file
├── DATABASE_SCHEMA.md     # Database structure
└── PRODUCT_MGMT/         # Product management docs
    ├── BUGS.md          # Bug tracking
    ├── ROADMAP.md       # Feature roadmap
    └── TODO_CHECKLIST.md # Development tasks
```

### Public Directory (`public/`)
```
public/
├── _routes.json     # Cloudflare Pages routing config
└── images/         # Static images and assets
```

### Key Files
- `app/layout.tsx`: Root layout, metadata, and global providers
- `app/page.tsx`: Homepage with map component
- `app/config.ts`: Application configuration and constants
- `api/worker.js`: Cloudflare Worker API implementation
- `wrangler.toml`: Cloudflare Worker configuration
- `wrangler.worker.toml`: API Worker specific configuration

### Directory Purposes

#### `app/components/`
- Reusable React components
- Component-specific styles and logic
- Component-level types and interfaces

#### `app/utils/`
- Helper functions
- Utility types
- Shared logic
- Authentication utilities
- API request helpers

#### `app/admin/`
- Admin interface components
- Authentication logic
- Rating management UI
- Admin-specific utilities

#### `app/guide/`
- User documentation
- Help pages
- Usage instructions
- FAQ content

#### `app/list/`
- Rating list view
- Sorting and filtering logic
- List-specific components

#### `api/`
- Cloudflare Worker code
- API route handlers
- Database interactions
- Schema definitions

#### `docs/`
- Technical documentation
- Setup instructions
- API documentation
- Database schemas
- Product management docs

#### `public/`
- Static assets
- Routing configuration
- Public images
- Global static files

#### `scripts/`
- Development utilities
- Database migration scripts
- Build tools
- Testing utilities

## Environment Variables

### API Configuration
- `NEXT_PUBLIC_API_BASE_URL`: Base URL for the Cloudflare Worker API
  - Used in: `app/config.js`, API requests
  - Example: `https://your-worker-name.your-account.workers.dev`

### Authentication
- `NEXT_PUBLIC_ADMIN_PASSWORD`: Password for admin access
  - Used in: `app/admin/layout.tsx`
  - Purpose: Protects admin interface

### Google Maps
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Google Maps API key
  - Used in: `app/components/Map.tsx`
  - Purpose: Required for map functionality

### CAPTCHA
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: Cloudflare Turnstile site key
  - Used in: `app/components/RatingForm.tsx`
  - Purpose: Bot protection for rating submissions

## Types and Interfaces

### Rating Interface
```typescript
interface Rating {
  id: string;
  latitude: number;
  longitude: number;
  burritoTitle: string;
  rating: number;
  taste: number;
  value: number;
  price: number;
  restaurantName: string;
  review?: string;
  reviewerName?: string;
  reviewerEmoji?: string;
  hasPotatoes: boolean;
  hasCheese: boolean;
  hasBacon: boolean;
  hasChorizo: boolean;
  hasAvocado: boolean;
  hasVegetables: boolean;
  confirmed?: number;
}
```
- Used in: `app/components/Map.tsx`, `app/components/RatingList.tsx`
- Purpose: Defines the structure of a burrito rating

### Position Interface
```typescript
interface Position {
  lat: number;
  lng: number;
  name: string;
  address: string;
}
```
- Used in: `app/components/Map.tsx`, `app/components/RatingForm.tsx`
- Purpose: Defines location data structure

## Utility Functions

### `getApiUrl(endpoint: string): string`
- Location: `app/config.js`
- Purpose: Constructs API endpoint URLs
- Usage: `getApiUrl('ratings')` → `${NEXT_PUBLIC_API_BASE_URL}/ratings`

### `validatePassword(password: string): boolean`
- Location: `app/utils/auth.ts`
- Purpose: Validates user identity passwords
- Usage: Used in RatingForm for reviewer identity validation

### `generateUserEmoji(password: string): string`
- Location: `app/utils/auth.ts`
- Purpose: Generates consistent emoji for user identities
- Usage: Used in RatingForm for reviewer emoji generation

### `extractZipcode(address: string): string | undefined`
- Location: `app/components/RatingForm.tsx`
- Purpose: Extracts zipcode from address string
- Usage: Used when submitting ratings

## Map Component Functions

### `getRatingColor(rating: number, isStroke: boolean = false): string`
- Location: `app/components/Map.tsx`
- Purpose: Returns color for rating markers
- Usage: Used for map marker styling

### `handleSelectRating(rating: Rating): void`
- Location: `app/components/Map.tsx`
- Purpose: Handles rating marker click events
- Usage: Shows rating details in InfoWindow

### `handleStartRating(): void`
- Location: `app/components/Map.tsx`
- Purpose: Initiates rating submission process
- Usage: Opens rating form modal

## Rating Form Functions

### `getRatingEmoji(rating: number): string`
- Location: `app/components/RatingForm.tsx`
- Purpose: Returns emoji based on rating value
- Usage: Visual feedback in rating form

### `getPriceEmoji(price: number): string`
- Location: `app/components/RatingForm.tsx`
- Purpose: Returns emoji based on price value
- Usage: Visual feedback in rating form

### `handleTurnstileVerify(token: string): void`
- Location: `app/components/RatingForm.tsx`
- Purpose: Handles CAPTCHA verification
- Usage: Processes Turnstile CAPTCHA responses

## State Variables

### Map Component States
- `refreshTrigger`: Controls map data refresh
  - Location: `app/page.tsx`
  - Type: `number`
  - Purpose: Triggers map data refresh

- `selectedRating`: Currently selected rating
  - Location: `app/components/Map.tsx`
  - Type: `Rating | null`
  - Purpose: Controls InfoWindow display

### Rating Form States
- `isSubmitting`: Form submission state
  - Location: `app/components/RatingForm.tsx`
  - Type: `boolean`
  - Purpose: Controls form submission UI

- `ingredients`: Selected burrito ingredients
  - Location: `app/components/RatingForm.tsx`
  - Type: `Record<string, boolean>`
  - Purpose: Tracks ingredient checkboxes

## Constants

### Map Configuration
```typescript
const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  // ... other options
};
```
- Location: `app/components/Map.tsx`
- Purpose: Configures Google Maps instance

### Default Map Center
```typescript
const defaultCenter = {
  lat: 34.0011,
  lng: -118.4285
};
```
- Location: `app/components/Map.tsx`
- Purpose: Sets initial map center (Mar Vista, CA)

### Directory Structure
```
app/
├── admin/                    # Admin interface pages and components
│   ├── layout.tsx           # Admin authentication wrapper
│   ├── page.tsx            # Admin entry point
│   ├── AdminAuth.tsx       # Admin authentication component
│   ├── dashboard/          # Admin dashboard
│   │   └── page.tsx       # Dashboard implementation
│   └── ratings/           # Ratings management
│       └── page.tsx       # Ratings interface
├── components/              # Shared components
├── utils/                  # Utility functions
├── guide/                  # User guide pages
├── list/                  # Rating list view
├── monitoring/            # Monitoring interface
├── layout.tsx             # Root layout with metadata
├── page.tsx              # Homepage with map
├── favicon.ico           # Fallback favicon
├── icon.svg             # Primary favicon
├── globals.css          # Global styles
└── config.ts           # App configuration
```

### Admin Components
The admin interface is implemented as a unified system within the main application:

- `app/admin/layout.tsx`: Authentication wrapper for all admin routes
- `app/admin/page.tsx`: Entry point that redirects to dashboard
- `app/admin/AdminAuth.tsx`: Authentication component implementation
- `app/admin/dashboard/page.tsx`: Main admin dashboard interface
- `app/admin/ratings/page.tsx`: Ratings management interface

### Authentication Implementation
- Location: `app/admin/layout.tsx`
- Purpose: Protects admin interface with password-based authentication
- Storage: Uses sessionStorage for auth state
- Environment Variables: Uses NEXT_PUBLIC_ADMIN_PASSWORD 