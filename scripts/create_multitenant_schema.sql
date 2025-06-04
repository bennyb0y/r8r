-- R8R Multi-Tenant Database Schema
-- This script creates the complete multi-tenant schema for the R8R platform

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Tenants table - stores tenant configuration and metadata
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

-- Items table - stores the items being rated (burritos, pizzas, etc.)
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

-- Ratings table - stores flexible ratings for items
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

-- Tenant admins - stores admin users for each tenant
CREATE TABLE tenant_admins (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  permissions JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Rating analytics - pre-calculated statistics for performance
CREATE TABLE rating_analytics (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  item_id TEXT NOT NULL REFERENCES items(id),
  total_ratings INTEGER NOT NULL DEFAULT 0,
  average_scores JSON,
  last_rating_at TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Tenant isolation indexes (CRITICAL for multi-tenancy)
CREATE INDEX idx_items_tenant ON items(tenant_id);
CREATE INDEX idx_ratings_tenant ON ratings(tenant_id);
CREATE INDEX idx_ratings_item ON ratings(item_id);
CREATE INDEX idx_tenant_admins_tenant ON tenant_admins(tenant_id);
CREATE INDEX idx_rating_analytics_tenant ON rating_analytics(tenant_id);

-- Subdomain lookup (CRITICAL for routing)
CREATE UNIQUE INDEX idx_tenants_subdomain ON tenants(subdomain);

-- Location-based queries
CREATE INDEX idx_items_location ON items(tenant_id, latitude, longitude);
CREATE INDEX idx_items_zipcode ON items(tenant_id, zipcode);

-- Status and confirmation queries
CREATE INDEX idx_ratings_status ON ratings(tenant_id, status);
CREATE INDEX idx_ratings_confirmed ON ratings(tenant_id, status, confirmed_at);

-- Performance queries
CREATE INDEX idx_items_venue ON items(tenant_id, venue_name);
CREATE INDEX idx_ratings_created ON ratings(tenant_id, created_at);
CREATE INDEX idx_items_created ON items(tenant_id, created_at);

-- Email lookup for admins
CREATE INDEX idx_tenant_admins_email ON tenant_admins(email);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Update timestamps automatically
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

-- Update analytics when ratings are inserted
CREATE TRIGGER update_rating_analytics_insert
AFTER INSERT ON ratings
FOR EACH ROW
WHEN NEW.status = 'confirmed'
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
  WHERE tenant_id = NEW.tenant_id 
    AND item_id = NEW.item_id 
    AND status = 'confirmed';
END;

-- Update analytics when ratings are confirmed/rejected
CREATE TRIGGER update_rating_analytics_status_change
AFTER UPDATE OF status ON ratings
FOR EACH ROW
WHEN NEW.status != OLD.status
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
  WHERE tenant_id = NEW.tenant_id 
    AND item_id = NEW.item_id 
    AND status = 'confirmed';
END;

-- ============================================================================
-- CONSTRAINTS
-- ============================================================================

-- Ensure valid tenant status
CREATE INDEX idx_tenants_status_check ON tenants(status)
WHERE status NOT IN ('active', 'suspended', 'pending');

-- Ensure valid item status  
CREATE INDEX idx_items_status_check ON items(status)
WHERE status NOT IN ('active', 'inactive', 'reported');

-- Ensure valid rating status
CREATE INDEX idx_ratings_status_check ON ratings(status)
WHERE status NOT IN ('pending', 'confirmed', 'rejected');

-- Ensure valid admin roles
CREATE INDEX idx_tenant_admins_role_check ON tenant_admins(role)
WHERE role NOT IN ('owner', 'admin', 'moderator');

-- ============================================================================
-- SEED DATA FOR BURRITOS TENANT
-- ============================================================================

-- Create the initial burritos tenant
INSERT INTO tenants (
  id, 
  subdomain, 
  name, 
  category, 
  subcategory, 
  status,
  config,
  settings
) VALUES (
  'burritos',
  'burritos',
  'Burrito Community',
  'food',
  'mexican',
  'active',
  '{
    "ratingCategories": [
      {"id": "overall", "name": "Overall Rating", "required": true, "weight": 1.0},
      {"id": "taste", "name": "Taste", "required": true, "weight": 0.4},
      {"id": "value", "name": "Value", "required": true, "weight": 0.3}
    ],
    "itemAttributes": [
      {
        "id": "ingredients",
        "name": "Ingredients",
        "type": "multiselect",
        "options": ["cheese", "lettuce", "beans", "rice", "salsa", "avocado", "potatoes", "bacon", "chorizo", "vegetables"]
      },
      {
        "id": "spiceLevel",
        "name": "Spice Level",
        "type": "scale",
        "min": 1,
        "max": 5
      }
    ],
    "locationRequired": true,
    "imageUploadEnabled": true,
    "maxPriceRange": 25.0,
    "currencySymbol": "$"
  }',
  '{
    "requireModeration": true,
    "allowAnonymousReviews": true,
    "maxImagesPerRating": 3,
    "enableLocationValidation": true,
    "timezoneId": "America/Los_Angeles",
    "language": "en",
    "features": {
      "imageUpload": true,
      "locationMapping": true,
      "priceTracking": true,
      "socialSharing": false
    }
  }'
);

-- ============================================================================
-- EXAMPLE ADDITIONAL TENANTS (commented out)
-- ============================================================================

/*
-- Pizza tenant example
INSERT INTO tenants (
  id, subdomain, name, category, subcategory, status, config
) VALUES (
  'pizza-nyc',
  'pizza-nyc',
  'NYC Pizza Guide',
  'food',
  'italian',
  'active',
  '{
    "ratingCategories": [
      {"id": "overall", "name": "Overall Rating", "required": true, "weight": 1.0},
      {"id": "crust", "name": "Crust", "required": true, "weight": 0.3},
      {"id": "sauce", "name": "Sauce", "required": true, "weight": 0.3},
      {"id": "cheese", "name": "Cheese", "required": true, "weight": 0.2}
    ],
    "itemAttributes": [
      {
        "id": "style",
        "name": "Pizza Style",
        "type": "select",
        "options": ["neapolitan", "new-york", "sicilian", "deep-dish", "thin-crust"]
      },
      {
        "id": "toppings",
        "name": "Toppings",
        "type": "multiselect",
        "options": ["pepperoni", "mushrooms", "sausage", "peppers", "onions", "olives"]
      }
    ],
    "locationRequired": true,
    "imageUploadEnabled": true,
    "maxPriceRange": 50.0,
    "currencySymbol": "$"
  }'
);

-- Coffee tenant example  
INSERT INTO tenants (
  id, subdomain, name, category, subcategory, status, config
) VALUES (
  'coffee-sf',
  'coffee-sf',
  'San Francisco Coffee Guide',
  'food',
  'beverages',
  'active',
  '{
    "ratingCategories": [
      {"id": "overall", "name": "Overall Rating", "required": true, "weight": 1.0},
      {"id": "taste", "name": "Coffee Taste", "required": true, "weight": 0.4},
      {"id": "atmosphere", "name": "Atmosphere", "required": true, "weight": 0.3},
      {"id": "service", "name": "Service", "required": true, "weight": 0.3}
    ],
    "itemAttributes": [
      {
        "id": "drinkType",
        "name": "Drink Type",
        "type": "select",
        "options": ["espresso", "americano", "latte", "cappuccino", "macchiato", "cold-brew"]
      },
      {
        "id": "milkType",
        "name": "Milk Type",
        "type": "select",
        "options": ["whole", "skim", "oat", "almond", "soy", "coconut", "none"]
      }
    ],
    "locationRequired": true,
    "imageUploadEnabled": true,
    "maxPriceRange": 15.0,
    "currencySymbol": "$"
  }'
);
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify schema creation
/*
SELECT 
  'tenants' as table_name, 
  COUNT(*) as row_count 
FROM tenants
UNION ALL
SELECT 
  'items' as table_name, 
  COUNT(*) as row_count 
FROM items
UNION ALL
SELECT 
  'ratings' as table_name, 
  COUNT(*) as row_count 
FROM ratings;

-- Verify indexes
.indexes

-- Verify tenant configuration
SELECT 
  id,
  subdomain,
  name,
  category,
  status,
  json_extract(config, '$.ratingCategories') as rating_categories
FROM tenants;
*/