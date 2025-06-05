# R8R Multi-Tenant Database Schema

This document defines the multi-tenant database schema for the R8R platform, designed to support any type of rating community (burritos, pizza, coffee, books, etc.) with flexible, configurable attributes.

## Overview

The multi-tenant schema transforms the rigid, burrito-specific structure into a flexible platform that can handle any rating category while maintaining data isolation between tenants. This enables true self-service subdomain creation where users can instantly create communities at any subdomain (e.g., `pizza.r8r.one`, `coffee.r8r.one`) without manual setup.

## Core Design Principles

1. **Tenant Isolation**: All data is strictly isolated by tenant_id
2. **Self-Service Creation**: Wildcard routing enables instant subdomain creation
3. **Flexible Attributes**: JSON-based storage for category-specific attributes
4. **Configurable Ratings**: Dynamic rating categories per tenant
5. **Default Configurations**: Pre-defined configs for common categories (burritos, pizza, coffee)
6. **Backward Compatibility**: Migration path from current burrito data
7. **Performance**: Proper indexing for multi-tenant queries

## Schema Design

### 1. Tenants Table

```sql
CREATE TABLE tenants (
  id TEXT PRIMARY KEY, -- e.g., 'burritos', 'pizza-ny', 'coffee-sf'
  subdomain TEXT UNIQUE NOT NULL, -- e.g., 'burritos', 'pizza-ny'
  name TEXT NOT NULL, -- e.g., 'Burrito Community', 'NYC Pizza Guide'
  category TEXT NOT NULL, -- e.g., 'food', 'entertainment', 'services'
  subcategory TEXT, -- e.g., 'mexican-food', 'pizza', 'coffee'
  owner_email TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'suspended', 'pending'
  config JSON NOT NULL, -- Tenant configuration (see below)
  branding JSON, -- Colors, logos, custom styling
  settings JSON, -- Feature flags, limits, etc.
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### Tenant Configuration JSON Structure
```json
{
  "ratingCategories": [
    {"id": "overall", "name": "Overall Rating", "required": true, "weight": 1.0},
    {"id": "taste", "name": "Taste", "required": true, "weight": 0.4},
    {"id": "value", "name": "Value", "required": true, "weight": 0.3},
    {"id": "service", "name": "Service", "required": false, "weight": 0.3}
  ],
  "itemAttributes": [
    {"id": "spiceLevel", "name": "Spice Level", "type": "scale", "min": 1, "max": 5},
    {"id": "ingredients", "name": "Ingredients", "type": "multiselect", 
     "options": ["cheese", "lettuce", "tomato", "avocado", "beans"]},
    {"id": "dietaryRestrictions", "name": "Dietary", "type": "tags",
     "options": ["vegetarian", "vegan", "gluten-free", "dairy-free"]}
  ],
  "locationRequired": true,
  "imageUploadEnabled": true,
  "maxPriceRange": 50.0,
  "currencySymbol": "$"
}
```

### 2. Items Table (Generic Items Being Rated)

```sql
CREATE TABLE items (
  id TEXT PRIMARY KEY, -- UUID
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL, -- e.g., "Carne Asada Burrito", "Margherita Pizza"
  venue_name TEXT NOT NULL, -- e.g., "La Taqueria", "Joe's Pizza"
  venue_address TEXT,
  latitude REAL,
  longitude REAL,
  zipcode TEXT,
  price_range_min REAL,
  price_range_max REAL,
  attributes JSON, -- Flexible attributes based on tenant config
  image_urls JSON, -- Array of image filenames
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'reported'
  created_by TEXT, -- User identifier (optional)
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### Item Attributes JSON Example
```json
{
  "ingredients": ["beef", "cheese", "lettuce", "salsa"],
  "spiceLevel": 3,
  "dietaryRestrictions": ["gluten-free"],
  "size": "large",
  "customizations": ["extra cheese", "no onions"]
}
```

### 3. Ratings Table (Flexible Rating System)

```sql
CREATE TABLE ratings (
  id TEXT PRIMARY KEY, -- UUID
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  item_id TEXT NOT NULL REFERENCES items(id),
  scores JSON NOT NULL, -- Flexible scoring based on tenant config
  review TEXT,
  price_paid REAL,
  reviewer_info JSON, -- Anonymous reviewer identity
  visit_date DATE,
  image_urls JSON, -- Array of image filenames for this rating
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'rejected'
  confirmed_at TIMESTAMP,
  confirmed_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### Scores JSON Example
```json
{
  "overall": 4.5,
  "taste": 5.0,
  "value": 4.0,
  "service": 3.5,
  "presentation": 4.0
}
```

#### Reviewer Info JSON Example
```json
{
  "name": "FoodLover123",
  "emoji": "🌮",
  "identity_hash": "abc123...", # Hashed identity for consistency
  "location": "San Francisco, CA"
}
```

### 4. Supporting Tables

#### Tenant Admins
```sql
CREATE TABLE tenant_admins (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin', -- 'owner', 'admin', 'moderator'
  permissions JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### Rating Analytics (For Performance)
```sql
CREATE TABLE rating_analytics (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  item_id TEXT NOT NULL REFERENCES items(id),
  total_ratings INTEGER NOT NULL DEFAULT 0,
  average_scores JSON, -- Pre-calculated averages
  last_rating_at TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## Indexes for Performance

```sql
-- Tenant isolation indexes
CREATE INDEX idx_items_tenant ON items(tenant_id);
CREATE INDEX idx_ratings_tenant ON ratings(tenant_id);
CREATE INDEX idx_ratings_item ON ratings(item_id);
CREATE INDEX idx_tenant_admins_tenant ON tenant_admins(tenant_id);

-- Location-based queries
CREATE INDEX idx_items_location ON items(tenant_id, latitude, longitude);
CREATE INDEX idx_items_zipcode ON items(tenant_id, zipcode);

-- Status and confirmation queries
CREATE INDEX idx_ratings_status ON ratings(tenant_id, status);
CREATE INDEX idx_ratings_confirmed ON ratings(tenant_id, status, confirmed_at);

-- Performance queries
CREATE INDEX idx_items_venue ON items(tenant_id, venue_name);
CREATE INDEX idx_ratings_created ON ratings(tenant_id, created_at);

-- Subdomain lookup (critical for routing)
CREATE UNIQUE INDEX idx_tenants_subdomain ON tenants(subdomain);
```

## Triggers

```sql
-- Update timestamps
CREATE TRIGGER update_tenants_timestamp
AFTER UPDATE ON tenants
FOR EACH ROW
BEGIN
  UPDATE tenants SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER update_items_timestamp
AFTER UPDATE ON items
FOR EACH ROW
BEGIN
  UPDATE items SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER update_ratings_timestamp
AFTER UPDATE ON ratings
FOR EACH ROW
BEGIN
  UPDATE ratings SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Update analytics when ratings change
CREATE TRIGGER update_rating_analytics
AFTER INSERT ON ratings
FOR EACH ROW
BEGIN
  INSERT OR REPLACE INTO rating_analytics (
    id, tenant_id, item_id, total_ratings, last_rating_at, updated_at
  )
  SELECT 
    NEW.item_id,
    NEW.tenant_id,
    NEW.item_id,
    COUNT(*),
    MAX(created_at),
    CURRENT_TIMESTAMP
  FROM ratings 
  WHERE tenant_id = NEW.tenant_id AND item_id = NEW.item_id;
END;
```

## Migration Strategy

### Phase 1: Create New Schema
1. Create all new tables in new D1 database
2. Set up indexes and triggers
3. Create seed tenant for 'burritos'

### Phase 2: Data Migration
```sql
-- Create burritos tenant
INSERT INTO tenants (id, subdomain, name, category, config) VALUES (
  'burritos',
  'burritos', 
  'Burrito Community',
  'food',
  '{
    "ratingCategories": [
      {"id": "overall", "name": "Overall Rating", "required": true, "weight": 1.0},
      {"id": "taste", "name": "Taste", "required": true, "weight": 0.4},
      {"id": "value", "name": "Value", "required": true, "weight": 0.3}
    ],
    "itemAttributes": [
      {"id": "ingredients", "name": "Ingredients", "type": "multiselect",
       "options": ["potatoes", "cheese", "bacon", "chorizo", "avocado", "vegetables"]}
    ],
    "locationRequired": true,
    "imageUploadEnabled": true
  }'
);

-- Migrate existing data
-- This will be a script to transform current Rating table data
-- into the new multi-tenant structure
```

## Example Tenant Configurations

### Burritos Tenant
```json
{
  "id": "burritos",
  "subdomain": "burritos",
  "name": "Burrito Community",
  "config": {
    "ratingCategories": [
      {"id": "overall", "name": "Overall", "required": true},
      {"id": "taste", "name": "Taste", "required": true},
      {"id": "value", "name": "Value", "required": true}
    ],
    "itemAttributes": [
      {"id": "ingredients", "name": "Ingredients", "type": "multiselect",
       "options": ["cheese", "lettuce", "beans", "rice", "salsa", "avocado"]}
    ]
  }
}
```

### Pizza Tenant
```json
{
  "id": "pizza-nyc",
  "subdomain": "pizza-nyc", 
  "name": "NYC Pizza Guide",
  "config": {
    "ratingCategories": [
      {"id": "overall", "name": "Overall", "required": true},
      {"id": "crust", "name": "Crust", "required": true},
      {"id": "sauce", "name": "Sauce", "required": true},
      {"id": "cheese", "name": "Cheese", "required": true}
    ],
    "itemAttributes": [
      {"id": "style", "name": "Style", "type": "select",
       "options": ["neapolitan", "new-york", "sicilian", "deep-dish"]},
      {"id": "toppings", "name": "Toppings", "type": "multiselect",
       "options": ["pepperoni", "mushrooms", "sausage", "peppers"]}
    ]
  }
}
```

## Data Isolation Strategy

1. **All queries MUST include tenant_id** in WHERE clauses
2. **API middleware** automatically adds tenant context
3. **Database constraints** prevent cross-tenant data access
4. **Separate image storage** per tenant in R2 bucket structure

## Performance Considerations

1. **Tenant-first indexing** ensures fast queries within tenant scope
2. **JSON attributes** provide flexibility without table schema changes  
3. **Pre-calculated analytics** for dashboard performance
4. **Proper pagination** for large datasets per tenant

This schema provides the foundation for a scalable, flexible multi-tenant rating platform while maintaining the performance and features of the original burrito-rater application.