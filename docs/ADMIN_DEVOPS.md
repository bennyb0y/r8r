# Burrito Rater Administration and DevOps Guide

This comprehensive guide covers all aspects of deploying, administering, and maintaining the Burrito Rater application, including DevOps workflows and best practices.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Environment Setup](#environment-setup)
- [Deployment](#deployment)
  - [API Deployment](#api-deployment)
  - [Frontend Deployment](#frontend-deployment)
  - [Full Stack Deployment](#full-stack-deployment)
  - [Deployment Process](#deployment-process)
  - [Bundle Optimization and Code Splitting](#bundle-optimization-and-code-splitting)
  - [Choosing the Right Deployment Command](#choosing-the-right-deployment-command)
- [Admin Interface](#admin-interface)
  - [Admin Setup](#admin-setup)
  - [Access and Authentication](#access-and-authentication)
  - [Features](#features)
  - [Implementation Details](#implementation-details)
  - [Confirmation System](#confirmation-system)
- [Development Workflow](#development-workflow)
  - [Local Frontend Development](#local-frontend-development)
  - [API Development](#api-development)
  - [Testing Workflow](#testing-workflow)
- [Component Interaction](#component-interaction)
  - [User Rating Submission Flow](#user-rating-submission-flow)
  - [Admin Confirmation Flow](#admin-confirmation-flow)
  - [Map View Data Flow](#map-view-data-flow)
- [Database Operations](#database-operations)
  - [Database Schema Management](#database-schema-management)
  - [Database Backup Process](#database-backup-process)
- [Image Handling](#image-handling)
  - [Upload System](#upload-system)
  - [Storage and Delivery](#storage-and-delivery)
  - [Admin Panel Integration](#admin-panel-integration)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
  - [Monitoring Architecture](#monitoring-architecture)
  - [Key Metrics to Monitor](#key-metrics-to-monitor)
- [Troubleshooting](#troubleshooting)
  - [Common Issues](#common-issues)
  - [Edge Runtime Error](#edge-runtime-error)
  - [API Connection Issues](#api-connection-issues)
  - [Database Issues](#database-issues)
  - [Authentication Issues](#authentication-issues)
  - [Webpack Module Error](#webpack-module-error)
  - [Image Upload Issues](#image-upload-issues)
- [Best Practices](#best-practices)
- [GitHub Integration](#github-integration)

## Architecture Overview

Burrito Rater uses a cloud-first architecture with three main components:

1. **Frontend**: Next.js application deployed to Cloudflare Pages
2. **API**: Cloudflare Worker
3. **Database**: Cloudflare D1 (single source of truth)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│  Next.js    │────▶│  Cloudflare │────▶│  Cloudflare │
│  App        │     │  Worker API │     │  D1 DB      │
│             │◀────│             │◀────│             │
│             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

For a more detailed view of the architecture within the Cloudflare infrastructure:

```
┌───────────────────────────────────────────────────────┐
│                                                       │
│               Cloudflare Infrastructure               │
│                                                       │
│  ┌───────────┐      ┌───────────┐     ┌───────────┐   │
│  │           │      │           │     │           │   │
│  │ Cloudflare│      │ Cloudflare│     │ Cloudflare│   │
│  │ Pages     │◄────►│ Workers   │◄───►│ D1 DB     │   │
│  │ (Frontend)│      │ (API)     │     │           │   │
│  │           │      │           │     │           │   │
│  └───────────┘      └───────────┘     └───────────┘   │
│        ▲                                              │
└────────┼──────────────────────────────────────────────┘
         │
         │ HTTPS
         │
┌────────▼────────┐
│                 │
│    End User     │
│    Browser      │
│                 │
└─────────────────┘
```

### Single Source of Truth

A key principle of our architecture is that **Cloudflare D1 is the single source of truth** for all data. This means:

- All environments (development, staging, production) use the same cloud database
- No local database development is needed
- Data is consistent across all environments
- Changes to data are immediately visible to all users
- All data changes are persisted in the cloud database
- No need to sync data between environments

## Prerequisites

- Node.js (v18 or later)
- npm (v10 or later)
- Cloudflare account with Pages enabled
- Cloudflare API token with Pages deployment permissions

## Project Structure

The Burrito Rater application consists of two main components:

1. **Frontend**: Next.js application in the `app/` directory
2. **API**: Cloudflare Worker in the `api/worker.js` file

### Key Files and Directories

- **`app/`** - Contains the Next.js application code
  - **`app/admin/`** - Admin interface components
  - **`app/admin/layout.tsx`** - Admin authentication implementation
  - **`app/admin/page.tsx`** - Admin page functionality
- **`api/worker.js`** - The Cloudflare Worker script that handles API requests and database operations
- **`wrangler.toml`** - Configuration for Cloudflare Pages deployment
- **`wrangler.worker.toml`** - Configuration specifically for the Cloudflare Worker deployment
- **`docs/DATABASE_SCHEMA.md`** - The complete database schema definition

### Wrangler Configuration Files

The project uses two separate Wrangler configuration files:

1. **`wrangler.toml`**: Used for Cloudflare Pages deployment
   ```toml
   name = "burrito-rater"
   compatibility_date = "2023-09-01"
   compatibility_flags = ["nodejs_compat"]
   pages_build_output_dir = ".vercel/output/static"
   
   [[d1_databases]]
   binding = "DB"
   database_name = "your-database-name"
   database_id = "your-database-id"
   ```

2. **`wrangler.worker.toml`**: Used for Cloudflare Worker deployment
   ```toml
   name = "burrito-rater"
   compatibility_date = "2023-09-01"
   compatibility_flags = ["nodejs_compat"]
   main = "api/worker.js"
   
   [[d1_databases]]
   binding = "DB"
   database_name = "your-database-name"
   database_id = "your-database-id"
   ```

These files are kept separate because they serve different purposes and have different configuration requirements.

## Environment Setup

### Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://your-worker-name.your-account.workers.dev

# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Cloudflare Credentials
CF_ACCOUNT_ID=your_account_id
CF_API_TOKEN=your_api_token

# Database Configuration
DATABASE_URL=your_database_name

# Admin Configuration
NEXT_PUBLIC_ADMIN_PASSWORD=your_secure_password
```

### Cloudflare Pages Dashboard

Set the following environment variables in the Cloudflare Pages dashboard:

1. Go to the Cloudflare Pages dashboard
2. Select your Burrito Rater project
3. Navigate to the "Settings" tab
4. Click on "Environment variables"
5. Add the following variables:
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Your Google Maps API key
   - `NEXT_PUBLIC_API_BASE_URL`: The URL of your Cloudflare Worker API
   - `NEXT_PUBLIC_ADMIN_PASSWORD`: Your admin password
6. Save the changes
7. Trigger a new deployment for the changes to take effect

### Compatibility Flags

For Cloudflare Pages deployment, ensure:

1. The `wrangler.toml` file includes:
   ```toml
   compatibility_flags = ["nodejs_compat"]
   pages_build_output_dir = ".vercel/output/static"
   ```

2. The `nodejs_compat` compatibility flag is also set in the Cloudflare Pages dashboard:
   - Go to your project settings
   - Navigate to the "Functions" or "Build & Deploy" section
   - Find "Compatibility flags"
   - Add `nodejs_compat` as a compatibility flag for both Production and Preview environments

## Deployment

### Bundle Optimization and Code Splitting

The application uses advanced bundle optimization techniques to ensure optimal performance and stay within Cloudflare Pages' size limits:

#### Code Splitting Strategy

1. **Dynamic Imports**
   - Map components are dynamically imported using `next/dynamic`
   - Loading states are shown during component loading
   - SSR is disabled for map components to reduce initial bundle size

2. **Webpack Optimization**
   The webpack configuration in `next.config.js` implements aggressive code splitting:

   ```javascript
   splitChunks: {
     chunks: 'all',
     maxInitialRequests: 25,
     minSize: 20000,
     cacheGroups: {
       framework: {
         // React and Google Maps framework code
         test: /[\\/]node_modules[\\/](react|react-dom|@react-google-maps)[\\/]/,
         priority: 40
       },
       lib: {
         // Large libraries
         test: module => module.size() > 160000,
         priority: 30,
         maxSize: 24 * 1024 * 1024
       },
       commons: {
         // Shared code between pages
         minChunks: 2,
         priority: 20
       }
     }
   }
   ```

3. **CSS Optimization**
   - Uses `critters` for CSS optimization
   - Inlines critical CSS
   - Defers non-critical CSS loading

4. **Bundle Analysis**
   - Bundle analyzer available via `npm run analyze`
   - Helps identify large dependencies
   - Useful for debugging size issues

#### Size Limits and Considerations

- Cloudflare Pages has a 25MB limit per file
- Use dynamic imports for large components
- Monitor bundle sizes during development
- Run bundle analyzer before deploying major changes

### Local Development
```bash
# Start Next.js development server
npm run dev

# Analyze bundle sizes
npm run analyze

# Start Worker development server
npm run dev:worker
```

### Deployment Commands

⚠️ **IMPORTANT: Directory Requirement** ⚠️
Before running ANY deployment command, ALWAYS ensure you are in the correct directory:
```bash
# Check current directory
pwd
# Expected output should be: /path/to/burrito-rater

# If in wrong directory (e.g., /backup-worker), move to correct directory
cd /path/to/burrito-rater
```

The application can be deployed in three ways depending on the changes made:

#### 1. Frontend-Only Deployment
For changes only to the frontend (`app/` directory):
```bash
# FIRST, verify you're in the project root directory (NOT in backup-worker!)
pwd  # Should show /path/to/burrito-rater

# Then run the deployment command
npm run deploy:app
```
This command:
1. Builds the Next.js application
2. Deploys to Cloudflare Pages

#### 2. API-Only Deployment
For changes only to the API worker:
```bash
# FIRST, verify you're in the project root directory (NOT in backup-worker!)
pwd  # Should show /path/to/burrito-rater

# Then run the deployment command
npm run deploy:worker
```
This command deploys the worker to Cloudflare Workers.

#### 3. Full-Stack Deployment
For changes to both frontend and API:
```bash
# FIRST, verify you're in the project root directory (NOT in backup-worker!)
pwd  # Should show /path/to/burrito-rater

# Then run the deployment command
npm run deploy
```
This command:
1. Deploys the API worker to Cloudflare Workers
2. Builds the Next.js application
3. Deploys the frontend to Cloudflare Pages

### Deployment Commands Reference

| Command | Description | Required Directory |
|---------|-------------|-------------------|
| `npm run deploy` | Deploy both frontend and API | Project root (`/path/to/burrito-rater`) |
| `npm run deploy:app` | Deploy only frontend | Project root (`/path/to/burrito-rater`) |
| `npm run deploy:worker` | Deploy only API worker | Project root (`/path/to/burrito-rater`) |
| `npm run build` | Build Next.js application | Project root (`/path/to/burrito-rater`) |
| `npm run dev` | Start Next.js development server | Project root (`/path/to/burrito-rater`) |

**Note**: Unlike traditional Next.js applications, we don't use `npm run start` because:
- Development is handled by `npm run dev`
- Production is served directly by Cloudflare Pages
- No need for a local production server

This aligns with our cloud-native philosophy where:
- Development is done against the cloud worker
- Production runs entirely on Cloudflare's edge network
- No self-hosted components are required

### Verifying Deployment

After deployment:
1. Check the Cloudflare Pages dashboard for frontend deployment status
2. Check the Cloudflare Workers dashboard for API deployment status
3. Visit the deployed URLs to verify:
   - Frontend: https://your-project.pages.dev
   - API: https://your-worker.workers.dev
4. Test critical functionality:
   - Map loading
   - Rating submission
   - Admin interface access
5. If changes aren't visible, hard refresh (Ctrl/Cmd + Shift + R)

### Troubleshooting Deployment

If deployment fails:

1. **Build Failures**:
   - Verify Node.js version (v18+)
   - Check for TypeScript errors
   - Verify all dependencies are installed

2. **API Connection Issues**:
   - Check `.env.local` for correct API URL
   - Verify Cloudflare Worker is deployed
   - Check browser console for CORS errors

3. **Worker Deployment Issues**:
   - Ensure `api/worker.js` exists and is correctly formatted
   - Check that `wrangler.worker.toml` has the correct configuration
   - Verify D1 database bindings are correct

4. **Frontend Deployment Issues**:
   - Check build output for errors
   - Verify Cloudflare Pages project settings
   - Check environment variables in Cloudflare dashboard

### Choosing the Right Deployment Command

When deploying changes, it's important to choose the correct deployment command based on what you've modified. Here's a quick decision guide:

#### 1. Frontend-Only Changes (`npm run deploy:app`)
Use this when you've only modified:
- Files in the `app/` directory
- React components
- Styles
- Frontend utilities
- Frontend configuration
- Console logs or debugging statements

Example:
```bash
npm run deploy:app
```

#### 2. API-Only Changes (`npm run deploy:worker`)
Use this when you've only modified:
- Files in the `api/` directory
- Worker configuration
- Database queries
- API endpoints
- API middleware

Example:
```bash
npm run deploy:worker
```

#### 3. Full-Stack Changes (`npm run deploy`)
Use this when you've modified both frontend and API:
- Changes spanning both `app/` and `api/` directories
- Database schema changes that require frontend updates
- New features that touch both frontend and API
- Configuration changes affecting both parts

Example:
```bash
npm run deploy
```

### Why Separate Deployments Matter
- **Faster Deployments**: Frontend-only or API-only deployments are faster
- **Reduced Risk**: Smaller, focused deployments are less likely to cause issues
- **Better Error Handling**: Easier to identify and fix deployment issues
- **Avoid Edge Runtime Errors**: Prevents conflicts between Next.js and Worker deployments

## Admin Interface

The admin interface is implemented as a unified system within the main application, with all admin-related functionality centralized under the `/app/admin/` directory:

#### Directory Structure
```
app/admin/
├── layout.tsx       # Admin authentication wrapper
├── page.tsx        # Admin entry point
├── dashboard/      # Admin dashboard interface
├── monitoring/     # System monitoring and health checks
├── settings/       # System settings and backup management
└── ratings/        # Rating management interface
```

#### Route Organization
- `/admin`: Entry point and authentication
- `/admin/dashboard`: Overview and key metrics
- `/admin/monitoring`: System health and performance monitoring
- `/admin/settings`: System settings and backup management
- `/admin/ratings`: Rating management and moderation

All admin routes are protected by the authentication wrapper in `layout.tsx`, ensuring consistent security across all admin functionality.

### Backup Management

The backup management interface is located in the admin settings page and provides comprehensive control over the database backup system:

#### Features

1. **Backup Control**
   - Manual backup trigger button
   - Real-time backup status display
   - Detailed success/error messages
   - Loading states and error handling

2. **Recent Backups Display**
   - List of recent backups with timestamps
   - Backup type indicators (scheduled/manual)
   - Table count and row statistics
   - File size information
   - Newest and oldest backup indicators
   - Automatic refresh every 30 seconds

3. **Statistics Display**
   - Total number of tables
   - Total row count across all tables
   - Total backup size
   - Per-table statistics
   - Backup duration
   - Human-readable formatting for sizes and durations

#### Implementation Details

The backup management interface is implemented using the following components:

1. **BackupControl Component**
   - Handles manual backup triggering
   - Displays backup status and progress
   - Shows detailed success/error messages
   - Implements proper loading states

2. **RecentBackups Component**
   - Fetches and displays recent backups
   - Shows backup metadata and statistics
   - Implements automatic refresh
   - Handles error states gracefully

3. **Backup Statistics**
   - Displays comprehensive backup information
   - Shows per-table statistics
   - Formats sizes and durations for readability
   - Updates in real-time

#### Usage

1. **Triggering a Backup**
   - Navigate to `/admin/settings`
   - Click the "Backup Now" button
   - Wait for the backup to complete
   - Review the backup statistics

2. **Viewing Recent Backups**
   - The Recent Backups section shows the latest backups
   - Each backup entry displays:
     - Timestamp
     - Backup type (scheduled/manual)
     - Table count and row statistics
     - File size
   - The list automatically refreshes every 30 seconds

3. **Monitoring Backup Status**
   - Check the backup status indicator
   - Review any error messages if they occur
   - Monitor backup statistics
   - Verify backup completion

#### Features

#### Rating Management

The admin interface displays a table of all ratings with the following information:
- ID
- User (reviewer name)
- Emoji (reviewer emoji)
- Restaurant
- Burrito Title
- Rating (overall, taste, and value)
- Date submitted
- Status (confirmed or pending)
- Zipcode
- Actions (View, Delete, Confirm)

#### Real-time Updates

The admin interface implements two mechanisms for keeping the ratings list up to date:

1. **Periodic Refresh**
   - Automatically refreshes the ratings list every 30 seconds
   - Ensures admins see new submissions without manual refresh
   - Implemented with proper cleanup on component unmount

2. **Event-driven Updates**
   - Listens for `'burrito-rating-submitted'` events
   - Immediately refreshes when new ratings are submitted
   - Maintains real-time synchronization with user submissions

These update mechanisms ensure that:
- Admins see new ratings promptly
- The list stays current without manual intervention
- Changes from other admin actions are reflected immediately
- System resources are properly managed with cleanup

#### Filtering

The admin interface provides two filtering options:

1. **Status Filter**:
   - All: Shows all ratings
   - Confirmed: Shows only confirmed ratings
   - Unconfirmed: Shows only unconfirmed ratings

2. **Zipcode Filter**:
   - All: Shows ratings from all zipcodes
   - Individual zipcodes: Shows ratings from the selected zipcode only

#### Sorting

You can sort the ratings by clicking on any column header. The sortable columns include:
- ID
- User
- Restaurant
- Burrito Title
- Rating
- Date
- Status
- Zipcode

Clicking a column header toggles between ascending and descending order, indicated by an arrow icon.

#### Confirming Ratings

To confirm a rating:
1. Select the checkbox next to the rating(s) you want to confirm
2. Click the "Confirm" button
3. The rating will be marked as confirmed and will appear on the map and list views

You can also confirm individual ratings by clicking the "Confirm" button in the Actions column.

#### Deleting Ratings

To delete a rating:
1. Select the checkbox next to the rating(s) you want to delete
2. Click the "Delete" button
3. Confirm the deletion in the confirmation dialog
4. The rating will be permanently removed from the database

You can also delete individual ratings by clicking the "Del" button in the Actions column.

#### Viewing Rating Details

To view detailed information about a rating:
1. Click the "View" button in the Actions column
2. A modal will appear showing all details of the rating, including:
   - Restaurant and burrito information
   - Rating scores
   - Ingredients
   - Review text
   - Location data
   - Submission details

### Implementation Details

#### Authentication Implementation

The admin authentication is implemented in the `app/admin/layout.tsx` file, which:

1. Checks for an existing authentication session in `sessionStorage`
2. Validates the password against the environment variable
3. Renders either the login form or the admin interface based on authentication status
4. Provides a logout function to clear the session

#### Admin Page Implementation

The admin page functionality is implemented in `app/admin/page.tsx`, which:

1. Fetches ratings from the API
2. Provides UI for selecting and managing ratings
3. Handles deletion and confirmation of ratings through API calls

#### Authentication Features

- **Session Persistence**: Your login session persists until you log out or close the browser
- **Logout**: Securely end your session with the logout button
- **Error Handling**: Clear error messages for authentication issues

### Confirmation System

The application uses Cloudflare D1 database for storing and managing confirmation status:

1. When an admin confirms a rating, the confirmation status is stored in the D1 database
2. The Map and List views filter ratings based on the confirmation status from the database
3. Confirmations are consistent across all devices and environments
4. Confirmations persist between browser sessions
5. Confirmations are stored in the database and available to all users

## Development Workflow

### Local Frontend Development

For frontend development, you only need to run the Next.js development server:

```bash
npm run dev
```

This starts the Next.js app on http://localhost:3000, which connects to the Cloudflare Worker API hosted in the cloud. The API, in turn, connects to the Cloudflare D1 database.

**Key points:**
- You're working with real data from the cloud database
- API calls go to the production Cloudflare Worker
- Changes to the frontend are immediately visible locally
- No local development environment needed for API or database
- No need for a production server (handled by Cloudflare Pages)

### Available Commands

| Command | Description | When to Use |
|---------|-------------|-------------|
| `npm run dev` | Start Next.js development server | Local frontend development |
| `npm run build` | Build Next.js application | Part of deployment process |
| `npm run deploy` | Deploy both frontend and API | Full-stack changes |
| `npm run deploy:app` | Deploy only frontend | Frontend-only changes |
| `npm run deploy:worker` | Deploy only API worker | API-only changes |
| `npm run lint` | Run ESLint to check code quality | Before commits, during CI/CD |
| `npm run analyze` | Analyze bundle sizes | When optimizing bundle size |

**Note**: Unlike traditional Next.js applications, we don't need a local production server because:
- Development is handled by `npm run dev`
- Production is served directly by Cloudflare Pages
- Our cloud-native architecture eliminates the need for self-hosted components

### API Development

Following our cloud-native, edge-first philosophy, we develop and test the API directly in the cloud:

1. Edit the `api/worker.js` file
2. Deploy the changes to Cloudflare:
   ```bash
   npm run deploy:worker
   ```

**Key points:**
- Changes are deployed directly to the cloud
- Testing is done against the deployed worker
- For critical changes, consider:
  - Creating a staging worker for testing
  - Using feature flags for controlled rollout
  - Implementing proper error handling and fallbacks

**Why Cloud-Native Development?**
- Ensures consistency between development and production
- Eliminates environment-specific bugs
- Reduces setup complexity
- Follows our edge-first architecture principles

## Deployment

### Bundle Optimization and Code Splitting

The application uses advanced bundle optimization techniques to ensure optimal performance and stay within Cloudflare Pages' size limits:

#### Code Splitting Strategy

1. **Dynamic Imports**
   - Map components are dynamically imported using `next/dynamic`
   - Loading states are shown during component loading
   - SSR is disabled for map components to reduce initial bundle size

2. **Webpack Optimization**
   The webpack configuration in `next.config.js` implements aggressive code splitting:

   ```javascript
   splitChunks: {
     chunks: 'all',
     maxInitialRequests: 25,
     minSize: 20000,
     cacheGroups: {
       framework: {
         // React and Google Maps framework code
         test: /[\\/]node_modules[\\/](react|react-dom|@react-google-maps)[\\/]/,
         priority: 40
       },
       lib: {
         // Large libraries
         test: module => module.size() > 160000,
         priority: 30,
         maxSize: 24 * 1024 * 1024
       },
       commons: {
         // Shared code between pages
         minChunks: 2,
         priority: 20
       }
     }
   }
   ```

3. **CSS Optimization**
   - Uses `critters` for CSS optimization
   - Inlines critical CSS
   - Defers non-critical CSS loading

4. **Bundle Analysis**
   - Bundle analyzer available via `npm run analyze`
   - Helps identify large dependencies
   - Useful for debugging size issues

#### Size Limits and Considerations

- Cloudflare Pages has a 25MB limit per file
- Use dynamic imports for large components
- Monitor bundle sizes during development
- Run bundle analyzer before deploying major changes

### Local Development
```bash
# Start Next.js development server
npm run dev

# Analyze bundle sizes
npm run analyze

# Start Worker development server
npm run dev:worker
```

### Production Deployment Commands

The application can be deployed in three ways depending on the changes made:

#### 1. Full-Stack Deployment
For changes to both frontend and API:
```bash
npm run deploy
```
This command:
1. Deploys the API worker to Cloudflare Workers
2. Builds the Next.js application
3. Deploys the frontend to Cloudflare Pages

#### 2. Frontend-Only Deployment
For changes only to the frontend (`app/` directory):
```bash
npm run deploy:app
```
This command:
1. Builds the Next.js application
2. Deploys to Cloudflare Pages

#### 3. API-Only Deployment
For changes only to the API worker:
```bash
npm run deploy:worker
```
This command deploys the worker to Cloudflare Workers.

### Deployment Commands Reference

| Command | Description |
|---------|-------------|
| `npm run deploy` | Deploy both frontend and API |
| `npm run deploy:app` | Deploy only frontend |
| `npm run deploy:worker` | Deploy only API worker |
| `npm run build` | Build Next.js application |
| `npm run dev` | Start Next.js development server |

**Note**: Unlike traditional Next.js applications, we don't use `npm run start` because:
- Development is handled by `npm run dev`
- Production is served directly by Cloudflare Pages
- No need for a local production server

This aligns with our cloud-native philosophy where:
- Development is done against the cloud worker
- Production runs entirely on Cloudflare's edge network
- No self-hosted components are required

### Verifying Deployment

After deployment:
1. Check the Cloudflare Pages dashboard for frontend deployment status
2. Check the Cloudflare Workers dashboard for API deployment status
3. Visit the deployed URLs to verify:
   - Frontend: https://your-project.pages.dev
   - API: https://your-worker.workers.dev
4. Test critical functionality:
   - Map loading
   - Rating submission
   - Admin interface access
5. If changes aren't visible, hard refresh (Ctrl/Cmd + Shift + R)

### Troubleshooting Deployment

If deployment fails:

1. **Build Failures**:
   - Verify Node.js version (v18+)
   - Check for TypeScript errors
   - Verify all dependencies are installed

2. **API Connection Issues**:
   - Check `.env.local` for correct API URL
   - Verify Cloudflare Worker is deployed
   - Check browser console for CORS errors

3. **Worker Deployment Issues**:
   - Ensure `api/worker.js` exists and is correctly formatted
   - Check that `wrangler.worker.toml` has the correct configuration
   - Verify D1 database bindings are correct

4. **Frontend Deployment Issues**:
   - Check build output for errors
   - Verify Cloudflare Pages project settings
   - Check environment variables in Cloudflare dashboard

## Component Interaction

This section details how different components of the Burrito Rater application interact with each other.

### User Rating Submission Flow

The following diagram illustrates the flow when a user submits a new burrito rating:

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│          │  1  │          │  2  │          │  3  │          │
│  User    │────►│  Next.js │────►│ Cloudflare│────►│  D1 DB   │
│ Browser  │     │ Frontend │     │  Worker  │     │          │
│          │◀────│          │◀────│          │◀────│          │
└──────────┘  6  └──────────┘  5  └──────────┘  4  └──────────┘
```

1. User submits a burrito rating through the frontend interface
2. Next.js frontend sends POST request to Cloudflare Worker API
3. Worker validates the data and inserts it into D1 Database
4. D1 Database confirms successful insertion
5. Worker returns success response to frontend
6. Frontend updates UI to show submission confirmation

### Admin Confirmation Flow

The following diagram illustrates the flow when an admin confirms a rating:

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│          │  1  │          │  2  │          │  3  │          │
│  Admin   │────►│  Admin   │────►│ Cloudflare│────►│  D1 DB   │
│ Browser  │     │ Interface│     │  Worker  │     │          │
│          │◀────│          │◀────│          │◀────│          │
└──────────┘  6  └──────────┘  5  └──────────┘  4  └──────────┘
```

1. Admin logs into the admin interface
2. Admin interface sends confirmation request to Worker API
3. Worker updates rating status in D1 Database
4. D1 Database confirms update
5. Worker returns success response
6. Admin interface updates to show confirmed status

### Map View Data Flow

The following diagram illustrates the flow when a user views the map:

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│          │  1  │          │  2  │          │  3  │          │
│  User    │────►│  Map     │────►│ Cloudflare│────►│  D1 DB   │
│ Browser  │     │ Component│     │  Worker  │     │          │
│          │◀────│          │◀────│          │◀────│          │
└──────────┘  6  └──────────┘  5  └──────────┘  4  └──────────┘
      │              ▲
      │              │
      │      7       │
      └──────────────┘
```

1. User visits the map view
2. Map component requests ratings data from Worker API
3. Worker queries confirmed ratings from D1 Database
4. D1 Database returns confirmed ratings
5. Worker sends ratings data to frontend
6. Map component renders ratings on Google Maps
7. User interacts with map markers to view rating details

## Database Operations

### Database Schema Management

The database schema is documented in `docs/DATABASE_SCHEMA.md` and managed through the Wrangler CLI:

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│          │     │          │     │          │     │          │
│  Schema  │────►│ Wrangler │────►│ Cloudflare│────►│  D1 DB   │
│  Doc     │     │  CLI     │     │  API     │     │          │
│          │     │          │     │          │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
```

1. **Schema Definition**: Documented in `docs/DATABASE_SCHEMA.md`
2. **Local Development**: Uses cloud D1 database
3. **Schema Migration**: Applied through Wrangler CLI

### Database Backup Process

Regular backups of the D1 database should be performed:

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│          │     │          │     │          │
│  D1 DB   │────►│ Wrangler │────►│  Local   │
│          │     │  CLI     │     │  Backup  │
│          │     │          │     │          │
└──────────┘     └──────────┘     └──────────┘
```

1. **Export Command**:
   ```
   npx wrangler d1 export <DATABASE_NAME> --output=backup.sql
   ```

2. **Import Command** (for restoration):
   ```
   npx wrangler d1 execute <DATABASE_NAME> --file=backup.sql
   ```

## Monitoring and Maintenance

### Monitoring Architecture

The monitoring architecture for the Burrito Rater application leverages Cloudflare's built-in monitoring tools:

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│          │     │          │     │          │
│ Cloudflare│────►│ Cloudflare│────►│  Alert   │
│ Services │     │ Dashboard │     │  Notifs  │
│          │     │          │     │          │
└──────────┘     └──────────┘     └──────────┘
```

### Key Metrics to Monitor

1. **Worker Performance**:
   - Request count
   - CPU time
   - Error rate

2. **Pages Performance**:
   - Page load time
   - Cache hit ratio
   - Error rate

3. **D1 Database**:
   - Query performance
   - Storage usage
   - Error rate

## Troubleshooting

### Common Issues

#### Build Failures
- Check Node.js version compatibility
- Verify all dependencies are installed
- Check for TypeScript errors

#### Webpack Module Error

If you encounter an error like `Cannot find module './[number].js'` in the development server:

1. Stop the development server
2. Clean the Next.js cache and temporary files:
   ```bash
   rm -rf .next node_modules/.cache
   ```
3. Reinstall dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

This error typically occurs when the Next.js build cache becomes corrupted or out of sync with the current codebase.

#### Deployment Failures
- Verify Cloudflare credentials in `.env.local`
- Check API token permissions
- Ensure project name matches Cloudflare Pages project

#### Runtime Errors
- Check environment variables
- Verify API endpoints
- Check browser console for errors

#### Worker Deployment Issues
- Ensure `api/worker.js` exists and is correctly formatted
- Check that `wrangler.worker.toml` has the correct path (`main = "api/worker.js"`)
- Verify D1 database bindings are correct

#### Node.JS Compatibility Error

If you see a "Node.JS Compatibility Error" message:

1. Check that the `nodejs_compat` compatibility flag is set in the Cloudflare Pages dashboard
2. Verify that `compatibility_flags = ["nodejs_compat"]` is in your `wrangler.toml` file
3. Redeploy the application

The troubleshooting process typically follows this pattern:

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│          │     │          │     │          │
│  Error   │────►│  Error   │────►│ Resolution│
│  Logs    │     │  ID      │     │  Steps    │
│          │     │          │     │          │
└──────────┘     └──────────┘     └──────────┘
```

### Edge Runtime Error

When deploying with `npm run deploy` or `npm run pages:build`, you may encounter the following error:

```
ERROR: Failed to produce a Cloudflare Pages build from the project.

     The following routes were not configured to run with the Edge Runtime:
       - /api/worker

     Please make sure that all your non-static routes export the following edge runtime route segment config:
       export const runtime = 'edge';
```

This error occurs because the build process is trying to deploy the API worker as a Next.js API route, but it's not configured to use the Edge Runtime.

#### How to Fix

There are two ways to fix this issue:

1. **Recommended Approach**: Deploy the frontend and API separately
   - Deploy the API worker using `npm run deploy:worker`
   - Deploy the frontend using `npm run pages:deploy`

2. **Alternative Approach**: Add Edge Runtime configuration to the API worker
   - Add `export const runtime = 'edge';` to the top of your API route files
   - Note: This approach is not recommended for this project as we're using a separate Cloudflare Worker for the API

#### Why This Happens

This project uses a separate Cloudflare Worker for the API instead of Next.js API routes. The build process detects the `/api/worker` path and tries to treat it as a Next.js API route, which requires the Edge Runtime configuration.

By using `npm run pages:deploy` instead of `npm run deploy`, you bypass this check and deploy only the static files, which is the intended behavior for this project.

### API Connection Issues

If you're having trouble connecting to the API:

1. Check your `.env.local` file to ensure the API URL is set correctly
2. Verify that the Cloudflare Worker is deployed and running
3. Check the browser console for CORS errors or other issues

### Database Issues

If you're experiencing database issues:

1. Check the Cloudflare D1 dashboard to ensure the database exists
2. Verify that the database ID in `wrangler.toml` matches the actual database ID
3. Check the Cloudflare Worker logs for any database connection errors

### Authentication Issues

If you're having trouble with admin authentication:

1. Verify that the `NEXT_PUBLIC_ADMIN_PASSWORD` environment variable is set correctly
2. Check for any whitespace in the password value
3. Ensure the environment variable is available in the client-side code
4. Try clearing your browser's sessionStorage and cache

### Bundle Size Issues

If you encounter bundle size issues during deployment:

1. **Analyze the Bundle**
   ```bash
   npm run analyze
   ```
   This will generate a report showing bundle composition and sizes.

2. **Common Solutions**
   - Use dynamic imports for large components
   - Split vendor chunks appropriately
   - Optimize image and media assets
   - Remove unused dependencies

3. **Webpack Configuration**
   - Check `next.config.js` for optimization settings
   - Verify chunk splitting configuration
   - Ensure proper cache group setup

4. **Dependencies**
   - Review and remove unused dependencies
   - Use smaller alternatives when possible
   - Consider code splitting for large libraries

## Best Practices

### Version Control
- Keep `.env.local` in `.gitignore`
- Use environment variables for sensitive data
- Document all environment variables

### Deployment
- Test locally before deploying
- Use the automated deployment command
- Monitor deployment logs
- Always deploy the API worker and frontend separately to avoid Edge Runtime errors

### Security
- Rotate API tokens regularly
- Use environment-specific credentials
- Follow least privilege principle

### Development
- **Commit Often**: Make small, focused commits with clear messages
- **Use Feature Branches**: Create a new branch for each feature or bug fix
- **Test Before Deployment**: Always test changes locally before deploying
- **Monitor Deployments**: Check the Cloudflare dashboard for deployment status and logs
- **Keep Secrets Secure**: Never commit API keys or sensitive information to version control
- **Document Changes**: Update documentation when making significant changes
- **Follow the Single Source of Truth Principle**: All data should come from the Cloudflare D1 database

## GitHub Integration

### GitHub Secrets

For the GitHub Actions workflow to work, you need to set up the following secrets in your GitHub repository:

- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token with Pages deployment permissions
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Your Google Maps API key
- `NEXT_PUBLIC_API_BASE_URL`: The URL of your Cloudflare Worker API

### Continuous Integration

The GitHub Actions workflow automatically builds and deploys the frontend whenever changes are pushed to the main branch. This ensures that:

1. The latest code is always deployed
2. The build process is consistent
3. Deployment is automated and reliable

## Related Documentation

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Next.js Documentation](https://nextjs.org/docs)
- [API Worker Documentation](./API_WORKER.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [Product Management](./PRODUCT_MGMT/)

## Admin Panel Structure

The admin panel is implemented as a unified interface within the main application:

### Admin Interface (`app/admin/`)
- **Purpose**: Primary admin interface for rating management
- **Authentication**: Uses session-based authentication with environment variable password
- **Features**: Full rating management, confirmation, and deletion capabilities
- **URL Structure**:
  - `/admin` - Entry point that redirects to `/admin/dashboard`
  - `/admin/dashboard` - Main admin interface
  - `/admin/ratings` - Rating management interface

### Directory Structure
```
app/admin/
├── layout.tsx    # Admin authentication wrapper
├── page.tsx      # Admin entry point
├── AdminAuth.tsx # Authentication component
├── dashboard/    # Dashboard implementation
│   └── page.tsx  # Main admin interface
└── ratings/      # Ratings management
    └── page.tsx  # Ratings interface
```

### Authentication Flow
1. User visits `/admin`
2. Authentication check via `sessionStorage`
3. If not authenticated, show login form
4. After successful login, store authentication in `sessionStorage`
5. Redirect to `/admin/dashboard`

### Environment Variables
The admin interface uses these environment variables:
```env
NEXT_PUBLIC_ADMIN_PASSWORD=your_secure_password
NEXT_PUBLIC_API_BASE_URL=https://your-worker-name.your-account.workers.dev
```

### Security Considerations
1. Password is exposed in client-side code (NEXT_PUBLIC_ prefix)
2. Session storage used for authentication persistence
3. No server-side session validation
4. Suitable for basic admin access control
5. Consider implementing Zero Trust security for production use

## Image Handling

The Burrito Rater application uses Cloudflare Workers and R2 storage for image handling. For detailed documentation on the image upload system, see [Image Upload Documentation](./IMAGE_UPLOAD.md).

### Image URL Format

Images in the application follow a specific URL format using Cloudflare's Image Resizing service:

```
https://images.benny.com/cdn-cgi/image/width=800,height=600,format=webp,quality=80/[IMAGE_FILENAME]
```

#### URL Components Breakdown:
1. **Base URL**: `https://images.benny.com`
2. **Cloudflare Path**: `/cdn-cgi/image`
3. **Transformation Parameters**:
   - `width=800`: Sets image width to 800px
   - `height=600`: Sets image height to 600px
   - `format=webp`: Converts image to WebP format
   - `quality=80`: Sets compression quality to 80%
4. **Image Filename**: The unique identifier for the image (e.g., `1741908086664-xatuw8nflv.jpeg`)

#### Example URLs:
```
# Full-size burrito image
https://images.benny.com/cdn-cgi/image/width=800,height=600,format=webp,quality=80/1741908086664-xatuw8nflv.jpeg

# Thumbnail version
https://images.benny.com/cdn-cgi/image/width=400,height=300,format=webp,quality=80/1741908086664-xatuw8nflv.jpeg
```

### Image Storage and Delivery

1. **Storage Format**:
   - Original images are stored with unique filenames
   - Filenames are generated using timestamp and random string
   - Example: `1741908086664-xatuw8nflv.jpeg`

2. **URL Construction**:
   ```typescript
   const getImageUrl = (filename: string, options = {
     width: 800,
     height: 600,
     format: 'webp',
     quality: 80
   }) => {
     const params = Object.entries(options)
       .map(([key, value]) => `${key}=${value}`)
       .join(',');
     
     return `https://images.benny.com/cdn-cgi/image/${params}/${filename}`;
   };
   ```

3. **Important Notes**:
   - Do NOT include `/images/` in the URL path
   - Always use HTTPS
   - Include all transformation parameters
   - Use WebP format for optimal compression
   - Maintain aspect ratio in transformations

### Common Image Sizes

| Use Case | Width | Height | Quality | Example URL |
|----------|--------|---------|----------|-------------|
| Full Size | 800 | 600 | 80 | `/cdn-cgi/image/width=800,height=600,format=webp,quality=80/filename.jpeg` |
| Thumbnail | 400 | 300 | 80 | `/cdn-cgi/image/width=400,height=300,format=webp,quality=80/filename.jpeg` |
| Mini | 200 | 150 | 80 | `/cdn-cgi/image/width=200,height=150,format=webp,quality=80/filename.jpeg` |

### Upload System

The image upload system is implemented with the following features:

1. **Client-Side Processing**:
   - Image compression before upload
   - File type validation
   - Size limits enforcement
   - CAPTCHA validation

2. **Server-Side Handling**:
   - Secure storage in R2
   - Unique filename generation
   - CORS configuration
   - Authentication checks

### Admin Panel Integration

The admin panel provides:

1. **Image Preview**:
   ```typescript
   <img
     src={`https://images.benny.com/cdn-cgi/image/width=800,height=600,format=webp,quality=80/${imageFilename}`}
     alt="Burrito preview"
     className="object-cover"
   />
   ```

2. **Image Management**:
   - View full-size images
   - Delete images
   - Monitor upload status

### Troubleshooting Image Issues

Common image-related issues and solutions:

1. **Incorrect URL Format**:
   ❌ Wrong: `https://images.benny.com/images/filename.jpeg`
   ✅ Correct: `https://images.benny.com/cdn-cgi/image/width=800,height=600,format=webp,quality=80/filename.jpeg`

2. **Missing Transformation Parameters**:
   ❌ Wrong: `https://images.benny.com/cdn-cgi/image/filename.jpeg`
   ✅ Correct: Include all required parameters (width, height, format, quality)

3. **Extra Path Segments**:
   ❌ Wrong: `https://images.benny.com/cdn-cgi/image/width=800,height=600,format=webp,quality=80/images/filename.jpeg`
   ✅ Correct: Remove `/images/` from the path

4. **Display Issues**:
   - Verify API base URL configuration
   - Check image URL construction
   - Validate CORS settings
   - Monitor R2 bucket access

### NPM Scripts Reference

The project includes several npm scripts for different purposes. Here's a detailed guide for each command:

#### Development Commands
```bash
# Start Next.js development server for local frontend development
npm run dev

# Run ESLint to check code quality
npm run lint

# Analyze bundle sizes for optimization
npm run analyze
```

#### Build Commands
```bash
# Build the Next.js application for production
npm run build
```

#### Deployment Commands

1. **Frontend-Only Deployment**
   ```bash
   npm run deploy:app
   ```
   - Use when you've only modified files in the `app/` directory
   - Builds and deploys to Cloudflare Pages
   - Includes: components, styles, frontend utilities, console logs
   - Command sequence: `npm run build && npx wrangler pages deploy`

2. **API-Only Deployment**
   ```bash
   npm run deploy:worker
   ```
   - Use when you've only modified files in the `api/` directory
   - Deploys the Cloudflare Worker
   - Includes: API endpoints, database queries, worker configuration
   - Command: `wrangler deploy --config wrangler.worker.toml`

3. **Full-Stack Deployment**
   ```bash
   npm run deploy
   ```
   - Use when you've modified both frontend and API code
   - Deploys both the worker and frontend
   - For changes that span the entire application
   - Command sequence: `npm run deploy:worker && npm run deploy:app`

#### Best Practices

1. **Choose the Right Command**
   - Use `deploy:app` for frontend-only changes
   - Use `deploy:worker` for API-only changes
   - Use `deploy` for full-stack changes

2. **Development Flow**
   - Start with `npm run dev` for local development
   - Use `npm run lint` before committing changes
   - Use `npm run analyze` when optimizing bundle sizes

3. **Deployment Flow**
   - Always run `npm run lint` before deployment
   - Choose the appropriate deployment command
   - Verify the deployment in the Cloudflare dashboard
   - Test the deployed changes

[Rest of the document remains unchanged...] 