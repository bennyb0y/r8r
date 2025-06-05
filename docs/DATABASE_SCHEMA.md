# R8R Platform Database Schema

This document serves as the definitive reference for the R8R multi-tenant rating platform database structure, covering the current schema, migration history, and implementation details.

## Overview

The R8R platform uses **Cloudflare D1**, a serverless SQLite-compatible database that supports a sophisticated multi-tenant architecture. The schema enables unlimited self-service tenant creation with complete data isolation and flexible, category-agnostic rating systems.

## Core Design Principles

1. **Universal Rating System**: Supports thumbs up/neutral/down quality ratings and yes/no value ratings
2. **Tenant Isolation**: Complete data separation between communities (burritos.r8r.one vs burgers.r8r.one)
3. **Self-Service Creation**: Any subdomain automatically works without manual configuration
4. **Cross-Category Support**: Works for food, beverages, services, products, or any reviewable items
5. **Backward Compatibility**: Seamless migration from legacy numeric rating systems
6. **Performance Optimization**: Tenant-first indexing and proper query patterns

## Database Evolution

### Legacy Schema (burrito-rater-db)
- **Single-tenant**: Hardcoded for burrito ratings only
- **Rigid Structure**: Fixed columns for burrito-specific attributes
- **Numeric Ratings**: 1-5 scale for taste, value, overall ratings
- **Status**: Fully migrated to new multi-tenant schema

### Current Schema (r8r-platform-db)  
- **Multi-tenant**: Unlimited communities with complete isolation
- **Universal Design**: Generic structure works for any rating category
- **Thumbs System**: Modern thumbs up/neutral/down quality ratings
- **Flexible Attributes**: JSON-based storage for category-specific data

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

#### Example Tenant Configuration JSON

Each tenant can be configured for different rating categories and item types:

**Burritos Tenant Example**:
```json
{
  "category": "food",
  "subcategory": "mexican",
  "ratingSystem": {
    "quality": {
      "type": "thumbs",
      "options": ["up", "neutral", "down"]
    },
    "value": {
      "type": "boolean", 
      "label": "Good Value"
    }
  },
  "itemAttributes": {
    "ingredients": {
      "type": "multiselect",
      "options": ["cheese", "lettuce", "beans", "rice", "salsa", "avocado"]
    },
    "spiceLevel": {
      "type": "scale",
      "min": 1,
      "max": 5
    }
  },
  "features": {
    "maps": true,
    "images": true,
    "locationRequired": true,
    "priceTracking": true
  }
}
```

**Coffee Shop Tenant Example**:
```json
{
  "category": "food", 
  "subcategory": "beverages",
  "ratingSystem": {
    "quality": {
      "type": "thumbs",
      "options": ["up", "neutral", "down"]
    },
    "value": {
      "type": "boolean",
      "label": "Good Value"
    }
  },
  "itemAttributes": {
    "roastLevel": {
      "type": "select",
      "options": ["light", "medium", "dark"]
    },
    "milkOptions": {
      "type": "multiselect", 
      "options": ["oat", "almond", "soy", "whole", "skim"]
    }
  }
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

#### Current Universal Rating System

The platform now uses a simplified, universal rating system that works across all categories:

**Quality Rating**: Thumbs system instead of numeric scales
- `up` (👍) - Positive quality rating
- `neutral` (😐) - Neutral quality rating  
- `down` (👎) - Negative quality rating

**Value Rating**: Simple binary assessment
- `true` - Good value for money
- `false` - Poor value for money

#### Example Current Scores JSON

```json
{
  "quality": "up",
  "value": true,
  "price": 12.50
}
```

#### Example Reviewer Info JSON

```json
{
  "name": "FoodLover123",
  "emoji": "🌯",
  "identity_hash": "abc123...",
  "anonymous": false
}
```

#### Legacy Compatibility

For backward compatibility, legacy numeric ratings are automatically converted:
- Ratings 4-5 → `quality: "up"`
- Rating 3 → `quality: "neutral"`  
- Ratings 1-2 → `quality: "down"`
- Value ratings >3 → `value: true`
- Value ratings ≤3 → `value: false`

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

## Universal Rating System Migration

The platform has evolved from a rigid, category-specific rating system to a universal thumbs-based approach that works across all tenant types.

### Rating System Evolution

**Legacy System (Burritos Only)**:
- Numeric ratings (1-5 scale) for taste, value, overall
- Burrito-specific fields (ingredients, toppings)
- Single-tenant burrito database

**Current Universal System**:
- Thumbs up/neutral/down for quality assessment
- Yes/No boolean for value assessment  
- Generic `itemTitle` field instead of `burritoTitle`
- Multi-tenant with complete data isolation
- Cross-category support (food, beverages, services, etc.)

### Migration Strategy

1. **Automatic Conversion**: Legacy numeric ratings automatically convert to thumbs system
   - Ratings 4-5 → 👍 (up)
   - Rating 3 → 😐 (neutral)
   - Ratings 1-2 → 👎 (down)

2. **Field Mapping**: Category-specific fields become generic
   - `burritoTitle` → `itemTitle` 
   - Numeric `value` rating → Boolean `value` (good/poor)
   - Burrito `ingredients` → Generic JSON attributes

3. **Tenant Isolation**: All legacy data preserved under 'burritos' tenant

4. **Backward Compatibility**: Frontend displays both legacy and new data seamlessly

### Data Transformation Examples

**Legacy Rating**:
```json
{
  "restaurantName": "Tu Madre",
  "burritoTitle": "Pastrami Burrito", 
  "rating": 4,
  "taste": 3.3,
  "value": 2.2,
  "ingredients": ["pastrami", "eggs", "cheese"]
}
```

**Converted to Universal Format**:
```json
{
  "restaurantName": "Tu Madre",
  "itemTitle": "Pastrami Burrito",
  "quality": "up",
  "value": false,
  "price": 15.50,
  "attributes": {
    "ingredients": ["pastrami", "eggs", "cheese"]
  }
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