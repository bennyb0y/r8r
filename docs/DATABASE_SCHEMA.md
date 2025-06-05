# Database Schema

This document outlines the database schema for the R8R multi-tenant rating platform and serves as the definitive reference for the database structure.

## Overview

The R8R platform uses Cloudflare D1, a serverless SQL database that is SQLite-compatible. The schema supports a sophisticated multi-tenant architecture with normalized relationships and JSON storage for flexible data structures.

## Database Migration History

### Legacy Schema (burrito-rater-db)
The platform was migrated from a single-tenant burrito rating system to a multi-tenant platform. The legacy `Rating` table contained denormalized burrito rating data and has been fully migrated to the new schema.

### Current Schema (r8r-platform-db)
The new schema supports unlimited tenants with complete data isolation and normalized relationships.

## Tables

### tenants

The `tenants` table stores configuration and metadata for each tenant in the platform.

#### Schema

```sql
CREATE TABLE tenants (
  id TEXT PRIMARY KEY,
  subdomain TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  owner_email TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  config JSON NOT NULL,
  branding JSON,
  settings JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### Columns

| Column Name  | Type      | Description                                      |
|--------------|-----------|--------------------------------------------------|
| id           | TEXT      | Primary key, tenant identifier                   |
| subdomain    | TEXT      | Unique subdomain (e.g., 'burritos')             |
| name         | TEXT      | Display name for the tenant                      |
| category     | TEXT      | Primary category (e.g., 'food', 'products')     |
| subcategory  | TEXT      | Secondary category (e.g., 'mexican', 'italian') |
| owner_email  | TEXT      | Contact email for tenant owner                   |
| status       | TEXT      | Tenant status ('active', 'suspended', 'pending')|
| config       | JSON      | Tenant configuration (rating criteria, etc.)    |
| branding     | JSON      | Branding configuration (colors, logos, etc.)    |
| settings     | JSON      | Tenant-specific settings                         |
| created_at   | TIMESTAMP | When the tenant was created                      |
| updated_at   | TIMESTAMP | When the tenant was last updated                 |

#### Example Config JSON

```json
{
  "type": "food_rating",
  "features": {
    "maps": true,
    "images": true,
    "reviews": true,
    "social": false
  },
  "scoring_criteria": [
    { "name": "taste", "label": "Taste", "scale": 5 },
    { "name": "value", "label": "Value", "scale": 5 },
    { "name": "overall", "label": "Overall", "scale": 5 }
  ],
  "location_required": true,
  "price_tracking": true
}
```

### items

The `items` table stores information about rated entities (restaurants, products, etc.) for each tenant.

#### Schema

```sql
CREATE TABLE items (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  venue_address TEXT,
  latitude REAL,
  longitude REAL,
  zipcode TEXT,
  price_range_min REAL,
  price_range_max REAL,
  attributes JSON,
  image_urls JSON,
  status TEXT NOT NULL DEFAULT 'active',
  created_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### Columns

| Column Name      | Type      | Description                                      |
|------------------|-----------|--------------------------------------------------|
| id               | TEXT      | Primary key, item identifier                     |
| tenant_id        | TEXT      | Foreign key to tenants table                     |
| name             | TEXT      | Name of the item being rated                      |
| venue_name       | TEXT      | Name of the venue/restaurant                      |
| venue_address    | TEXT      | Address of the venue                              |
| latitude         | REAL      | Latitude coordinate of the venue                  |
| longitude        | REAL      | Longitude coordinate of the venue                 |
| zipcode          | TEXT      | Postal code of the venue                          |
| price_range_min  | REAL      | Minimum price range                               |
| price_range_max  | REAL      | Maximum price range                               |
| attributes       | JSON      | Item-specific attributes                          |
| image_urls       | JSON      | Array of image URLs                               |
| status           | TEXT      | Item status ('active', 'inactive', 'archived')   |
| created_by       | TEXT      | User who created the item                         |
| created_at       | TIMESTAMP | When the item was created                         |
| updated_at       | TIMESTAMP | When the item was last updated                    |

#### Example Attributes JSON

```json
{
  "type": "burrito",
  "category": "mexican",
  "cuisine_style": "california",
  "dietary_options": ["vegetarian_available", "vegan_available"],
  "specialty": "california_burrito"
}
```

### ratings

The `ratings` table stores individual ratings submitted by users for items within each tenant.

#### Schema

```sql
CREATE TABLE ratings (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  item_id TEXT NOT NULL REFERENCES items(id),
  scores JSON NOT NULL,
  review TEXT,
  price_paid REAL,
  reviewer_info JSON,
  visit_date DATE,
  image_urls JSON,
  status TEXT NOT NULL DEFAULT 'pending',
  confirmed_at TIMESTAMP,
  confirmed_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### Columns

| Column Name   | Type      | Description                                      |
|---------------|-----------|--------------------------------------------------|
| id            | TEXT      | Primary key, rating identifier                   |
| tenant_id     | TEXT      | Foreign key to tenants table                     |
| item_id       | TEXT      | Foreign key to items table                       |
| scores        | JSON      | Rating scores for different criteria             |
| review        | TEXT      | Detailed review text                             |
| price_paid    | REAL      | Actual price paid by reviewer                    |
| reviewer_info | JSON      | Information about the reviewer                   |
| visit_date    | DATE      | Date when the item was experienced               |
| image_urls    | JSON      | Array of uploaded image URLs                     |
| status        | TEXT      | Rating status ('pending', 'confirmed', 'flagged')|
| confirmed_at  | TIMESTAMP | When the rating was confirmed                     |
| confirmed_by  | TEXT      | Who confirmed the rating                          |
| created_at    | TIMESTAMP | When the rating was created                       |
| updated_at    | TIMESTAMP | When the rating was last updated                  |

#### Example Scores JSON

```json
{
  "taste": 4.5,
  "value": 3.8,
  "overall": 4.2,
  "presentation": 4.0
}
```

#### Example Reviewer Info JSON

```json
{
  "name": "FoodLover123",
  "emoji": "🌯",
  "identity_hash": "abc123...",
  "ingredients": ["potatoes", "cheese", "avocado", "bacon"],
  "anonymous": false
}
```

### tenant_admins

The `tenant_admins` table manages administrative access for each tenant.

#### Schema

```sql
CREATE TABLE tenant_admins (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  permissions JSON,
  status TEXT NOT NULL DEFAULT 'active',
  invited_by TEXT,
  accepted_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### rating_analytics

The `rating_analytics` table stores aggregated analytics data for performance optimization.

#### Schema

```sql
CREATE TABLE rating_analytics (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  item_id TEXT REFERENCES items(id),
  metric_type TEXT NOT NULL,
  metric_value REAL NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  metadata JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## Indexes

The database includes comprehensive indexes for performance optimization:

```sql
-- Tenant indexes
CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX idx_tenants_status ON tenants(status);

-- Item indexes
CREATE INDEX idx_items_tenant_id ON items(tenant_id);
CREATE INDEX idx_items_status ON items(tenant_id, status);
CREATE INDEX idx_items_location ON items(tenant_id, latitude, longitude);
CREATE INDEX idx_items_venue ON items(tenant_id, venue_name);

-- Rating indexes
CREATE INDEX idx_ratings_tenant_id ON ratings(tenant_id);
CREATE INDEX idx_ratings_item_id ON ratings(item_id);
CREATE INDEX idx_ratings_status ON ratings(tenant_id, status);
CREATE INDEX idx_ratings_created_at ON ratings(tenant_id, created_at);
CREATE INDEX idx_ratings_confirmed ON ratings(tenant_id, status, confirmed_at);

-- Admin indexes
CREATE INDEX idx_tenant_admins_tenant_id ON tenant_admins(tenant_id);
CREATE INDEX idx_tenant_admins_email ON tenant_admins(email);

-- Analytics indexes
CREATE INDEX idx_analytics_tenant_metric ON rating_analytics(tenant_id, metric_type);
CREATE INDEX idx_analytics_period ON rating_analytics(period_start, period_end);
```

## Views

Commonly used data combinations are available through views:

```sql
-- Ratings with item details
CREATE VIEW ratings_with_items AS
SELECT 
  r.*,
  i.name as item_name,
  i.venue_name,
  i.venue_address,
  i.latitude,
  i.longitude,
  i.zipcode,
  i.attributes as item_attributes
FROM ratings r
JOIN items i ON r.item_id = i.id;

-- Tenant summary statistics
CREATE VIEW tenant_stats AS
SELECT 
  t.id as tenant_id,
  t.name as tenant_name,
  COUNT(DISTINCT i.id) as total_items,
  COUNT(DISTINCT r.id) as total_ratings,
  COUNT(DISTINCT CASE WHEN r.status = 'confirmed' THEN r.id END) as confirmed_ratings,
  AVG(CASE WHEN r.status = 'confirmed' THEN JSON_EXTRACT(r.scores, '$.overall') END) as avg_rating
FROM tenants t
LEFT JOIN items i ON t.id = i.tenant_id
LEFT JOIN ratings r ON i.id = r.item_id
GROUP BY t.id, t.name;
```

## Triggers

Automatic timestamp updates and data validation:

```sql
-- Update timestamps on rating changes
CREATE TRIGGER update_rating_timestamp
AFTER UPDATE ON ratings
FOR EACH ROW
BEGIN
  UPDATE ratings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Update timestamps on item changes  
CREATE TRIGGER update_item_timestamp
AFTER UPDATE ON items
FOR EACH ROW
BEGIN
  UPDATE items SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Update timestamps on tenant changes
CREATE TRIGGER update_tenant_timestamp
AFTER UPDATE ON tenants
FOR EACH ROW
BEGIN
  UPDATE tenants SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
```

## Migration from Legacy Schema

The platform includes a complete migration from the original single-tenant burrito rating system:

### Migration Summary
- **Legacy Database**: `burrito-rater-db` (single Rating table)
- **New Database**: `r8r-platform-db` (multi-tenant normalized schema)
- **Data Migrated**: 42 burrito ratings → 1 tenant, 36 items, 42 ratings
- **Tenant Isolation**: All legacy data isolated to 'burritos' tenant
- **Backward Compatibility**: Legacy API format maintained through transformation layer

### Migration Process

1. **Data Export**: Legacy ratings exported from `burrito-rater-db`
2. **Schema Transformation**: Data normalized into new multi-tenant structure
3. **Tenant Creation**: 'burritos' tenant created with appropriate configuration
4. **Item Extraction**: Unique restaurant/burrito combinations converted to items
5. **Rating Normalization**: Individual ratings linked to items with JSON scores
6. **Verification**: Complete data integrity verification

### Legacy Compatibility Layer

The database interface includes transformation methods to maintain backward compatibility:

```typescript
// Transform new schema data to legacy API format
private transformRatingForLegacyApi(row: any): LegacyRating {
  const scores = JSON.parse(row.scores || '{}');
  const reviewerInfo = JSON.parse(row.reviewer_info || '{}');
  const ingredients = reviewerInfo.ingredients || [];
  
  return {
    id: parseInt(row.id.replace('rating_', '')),
    restaurantName: row.venue_name,
    burritoTitle: row.item_name,
    rating: scores.overall || 3,
    taste: scores.taste || 3,
    value: scores.value || 3,
    hasPotatoes: ingredients.includes('potatoes'),
    // ... other legacy fields
  };
}
```

## API Integration

The database is accessed through the r8r-platform-api Cloudflare Worker, which provides tenant-aware endpoints:

- **Tenant Management**: Create, read, update tenant configurations
- **Item Management**: Manage rated items within tenant scope
- **Rating Operations**: CRUD operations with tenant isolation
- **Analytics**: Aggregated data and reporting per tenant
- **Admin Functions**: Tenant administration and moderation

## Security Considerations

### Tenant Isolation
- All queries include mandatory `tenant_id` filtering
- Foreign key constraints enforce referential integrity
- No cross-tenant data access possible at database level

### Data Protection
- Sensitive reviewer information stored in JSON fields
- No direct PII storage without explicit consent
- Configurable data retention policies per tenant

### Access Control
- Role-based access through `tenant_admins` table
- API-level authorization for all operations
- Audit trail through timestamp and user tracking

## Performance Optimization

### Query Patterns
- All major queries indexed for tenant-specific access
- Composite indexes for common filter combinations
- JSON field indexing for frequently accessed nested data

### Caching Strategy
- Tenant configurations cached at application level
- Rating aggregations pre-computed in analytics table
- Static data cached with appropriate TTL values

### Scaling Considerations
- Partitioning strategy ready for tenant-based sharding
- Efficient pagination for large datasets
- Optimized for edge database characteristics

## Local Development

For local development, the application connects to the cloud D1 database to ensure consistency across all environments. Database operations can be performed using:

```bash
# Query database
wrangler d1 execute r8r-platform-db --command="SELECT * FROM tenants"

# Execute migration files
wrangler d1 execute r8r-platform-db --file=migration.sql

# Backup and restore
wrangler d1 backup create r8r-platform-db
```

## Monitoring and Maintenance

### Built-in Analytics
- Real-time query performance monitoring
- Tenant usage statistics and trends
- Error logging and alerting

### Backup Strategy
- Automated daily backups via Cloudflare D1
- Point-in-time recovery capability
- Cross-region backup replication

### Health Checks
- Database connection monitoring
- Query performance alerts
- Data integrity verification