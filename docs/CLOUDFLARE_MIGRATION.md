# Cloudflare Migration Guide

This document outlines the migration process from a local SQLite database to Cloudflare D1 and the deployment of the API to Cloudflare Workers.

## Overview

The Burrito Rater application has been migrated from using a local SQLite database to Cloudflare D1, a serverless SQL database. The API has also been migrated from Next.js API routes to Cloudflare Workers.

## Architecture Changes

### Before Migration

- **Database**: Local SQLite database
- **API**: Next.js API routes
- **Hosting**: Vercel or similar platform

### After Migration

- **Database**: Cloudflare D1 (SQLite-compatible)
- **API**: Cloudflare Workers
- **Hosting**: Cloudflare Pages for frontend, Cloudflare Workers for API

## Migration Steps

### 1. Database Migration

#### Schema Creation

The D1 database schema was created with the following structure:

```sql
CREATE TABLE Rating (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  rating REAL NOT NULL,
  price REAL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  comment TEXT,
  author TEXT,
  created_at TEXT NOT NULL,
  confirmed INTEGER DEFAULT 0
);
```

#### Data Migration

Data was migrated from the local SQLite database to Cloudflare D1 using the following steps:

1. Export data from SQLite:
   ```bash
   sqlite3 ratings.db .dump > ratings_dump.sql
   ```

2. Modify the SQL dump to be compatible with D1:
   - Remove SQLite-specific commands
   - Ensure table creation matches the D1 schema
   - Format INSERT statements to be compatible with D1

3. Import data to D1:
   ```bash
   wrangler d1 execute burrito-rater --file=ratings_dump.sql
   ```

### 2. API Migration

#### Worker Creation

A Cloudflare Worker was created to handle API requests:

1. Create a new Worker project:
   ```bash
   wrangler init worker
   ```

2. Configure the Worker to use D1:
   ```toml
   # wrangler.toml
   [[d1_databases]]
   binding = "DB"
   database_name = "burrito-rater"
   database_id = "your-d1-database-id"
   ```

3. Implement API endpoints in the Worker:
   - GET /ratings - List all ratings
   - POST /ratings - Create a new rating
   - GET /ratings/:id - Get a specific rating
   - DELETE /ratings/:id - Delete a rating
   - PUT /ratings/:id/confirm - Confirm a rating

#### API Endpoint Changes

| Old Endpoint (Next.js) | New Endpoint (Cloudflare Worker) |
|------------------------|----------------------------------|
| /api/ratings           | /ratings                         |
| /api/ratings/:id       | /ratings/:id                     |
| /api/ratings/:id/confirm | /ratings/:id/confirm           |

### 3. Frontend Updates

The frontend was updated to use the new API endpoints:

1. Update API base URL:
   ```typescript
   // Before
   const API_BASE_URL = '/api';
   
   // After
   const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
   ```

2. Update API calls to use the new endpoints:
   ```typescript
   // Before
   fetch('/api/ratings')
   
   // After
   fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/ratings`)
   ```

3. Add CORS handling for cross-origin requests.

### 4. Deployment Configuration

#### Cloudflare Worker Deployment

1. Deploy the Worker:
   ```bash
   cd worker
   npm run deploy
   ```

2. The Worker is now available at `https://your-worker-name.your-account.workers.dev`.

#### Cloudflare Pages Deployment

1. Configure the build settings in Cloudflare Pages:
   - Build command: `npm run pages:build`
   - Build output directory: `.vercel/output/static`

2. Add environment variables:
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - `NEXT_PUBLIC_API_BASE_URL`
   - `NEXT_PUBLIC_ADMIN_PASSWORD`

3. Enable the `nodejs_compat` compatibility flag in the Cloudflare Pages dashboard.

## Local Development

### API Development

For local development with the Cloudflare Worker:

1. Start the Worker development server:
   ```bash
   cd worker
   npm run dev
   ```

2. The Worker will be available at `http://localhost:8787`.

### Frontend Development

For frontend development:

1. Start the Next.js development server:
   ```bash
   npm run dev
   ```

2. The frontend will be available at `http://localhost:3000`.

3. Set the `NEXT_PUBLIC_API_BASE_URL` environment variable in `.env.local` to point to the Worker:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://your-worker-name.your-account.workers.dev
   ```

## Troubleshooting

### CORS Issues

If you encounter CORS issues:

1. Ensure the Worker has the correct CORS headers:
   ```javascript
   const corsHeaders = {
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
     'Access-Control-Allow-Headers': 'Content-Type',
   };
   ```

2. Handle OPTIONS requests in the Worker:
   ```javascript
   if (request.method === 'OPTIONS') {
     return new Response(null, {
       headers: corsHeaders,
     });
   }
   ```

### D1 Connection Issues

If you encounter issues connecting to D1:

1. Verify your D1 database ID in `wrangler.toml`.
2. Ensure you have the correct permissions to access the D1 database.
3. Check that your Cloudflare API token has the necessary permissions.

## References

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/) 