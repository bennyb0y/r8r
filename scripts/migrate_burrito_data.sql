-- Migration Script: Transform Legacy Burrito Data to Multi-Tenant Schema
-- This script migrates data from the old single-tenant Rating table to the new multi-tenant structure

-- ============================================================================
-- MIGRATION STRATEGY
-- ============================================================================
-- 1. Extract unique venues from existing ratings to create items
-- 2. Transform ratings to reference items and include tenant_id
-- 3. Convert burrito-specific fields to JSON attributes
-- 4. Preserve all existing rating data and reviewer information

-- ============================================================================
-- STEP 1: CREATE ITEMS FROM EXISTING RATINGS
-- ============================================================================

-- Extract unique venue/burrito combinations to create items
INSERT INTO items (
  id,
  tenant_id,
  name,
  venue_name,
  venue_address,
  latitude,
  longitude,
  zipcode,
  price_range_min,
  price_range_max,
  attributes,
  status,
  created_at,
  updated_at
)
SELECT DISTINCT
  -- Generate UUID-like ID from restaurant and burrito combination
  'item_' || LOWER(REPLACE(REPLACE(restaurantName, ' ', '_'), '''', '')) || '_' || 
  LOWER(REPLACE(REPLACE(burritoTitle, ' ', '_'), '''', '')) AS id,
  
  'burritos' AS tenant_id,
  burritoTitle AS name,
  restaurantName AS venue_name,
  NULL AS venue_address, -- We don't have address data in the old schema
  latitude,
  longitude,
  zipcode,
  
  -- Calculate price range from existing ratings
  (SELECT MIN(price) FROM Rating r2 
   WHERE r2.restaurantName = r1.restaurantName 
   AND r2.burritoTitle = r1.burritoTitle) AS price_range_min,
   
  (SELECT MAX(price) FROM Rating r2 
   WHERE r2.restaurantName = r1.restaurantName 
   AND r2.burritoTitle = r1.burritoTitle) AS price_range_max,
  
  -- Convert burrito ingredients to JSON attributes
  json_object(
    'ingredients', json_array(
      CASE WHEN (SELECT hasPotatoes FROM Rating r2 
                 WHERE r2.restaurantName = r1.restaurantName 
                 AND r2.burritoTitle = r1.burritoTitle 
                 AND hasPotatoes = 1 LIMIT 1) THEN 'potatoes' END,
      CASE WHEN (SELECT hasCheese FROM Rating r2 
                 WHERE r2.restaurantName = r1.restaurantName 
                 AND r2.burritoTitle = r1.burritoTitle 
                 AND hasCheese = 1 LIMIT 1) THEN 'cheese' END,
      CASE WHEN (SELECT hasBacon FROM Rating r2 
                 WHERE r2.restaurantName = r1.restaurantName 
                 AND r2.burritoTitle = r1.burritoTitle 
                 AND hasBacon = 1 LIMIT 1) THEN 'bacon' END,
      CASE WHEN (SELECT hasChorizo FROM Rating r2 
                 WHERE r2.restaurantName = r1.restaurantName 
                 AND r2.burritoTitle = r1.burritoTitle 
                 AND hasChorizo = 1 LIMIT 1) THEN 'chorizo' END,
      CASE WHEN (SELECT hasAvocado FROM Rating r2 
                 WHERE r2.restaurantName = r1.restaurantName 
                 AND r2.burritoTitle = r1.burritoTitle 
                 AND hasAvocado = 1 LIMIT 1) THEN 'avocado' END,
      CASE WHEN (SELECT hasVegetables FROM Rating r2 
                 WHERE r2.restaurantName = r1.restaurantName 
                 AND r2.burritoTitle = r1.burritoTitle 
                 AND hasVegetables = 1 LIMIT 1) THEN 'vegetables' END
    ),
    'commonIngredients', json_object(
      'potatoes', CASE WHEN (SELECT COUNT(*) FROM Rating r2 
                            WHERE r2.restaurantName = r1.restaurantName 
                            AND r2.burritoTitle = r1.burritoTitle 
                            AND hasPotatoes = 1) > 0 THEN 1 ELSE 0 END,
      'cheese', CASE WHEN (SELECT COUNT(*) FROM Rating r2 
                          WHERE r2.restaurantName = r1.restaurantName 
                          AND r2.burritoTitle = r1.burritoTitle 
                          AND hasCheese = 1) > 0 THEN 1 ELSE 0 END,
      'bacon', CASE WHEN (SELECT COUNT(*) FROM Rating r2 
                         WHERE r2.restaurantName = r1.restaurantName 
                         AND r2.burritoTitle = r1.burritoTitle 
                         AND hasBacon = 1) > 0 THEN 1 ELSE 0 END,
      'chorizo', CASE WHEN (SELECT COUNT(*) FROM Rating r2 
                           WHERE r2.restaurantName = r1.restaurantName 
                           AND r2.burritoTitle = r1.burritoTitle 
                           AND hasChorizo = 1) > 0 THEN 1 ELSE 0 END,
      'avocado', CASE WHEN (SELECT COUNT(*) FROM Rating r2 
                           WHERE r2.restaurantName = r1.restaurantName 
                           AND r2.burritoTitle = r1.burritoTitle 
                           AND hasAvocado = 1) > 0 THEN 1 ELSE 0 END,
      'vegetables', CASE WHEN (SELECT COUNT(*) FROM Rating r2 
                              WHERE r2.restaurantName = r1.restaurantName 
                              AND r2.burritoTitle = r1.burritoTitle 
                              AND hasVegetables = 1) > 0 THEN 1 ELSE 0 END
    )
  ) AS attributes,
  
  'active' AS status,
  MIN(createdAt) AS created_at,
  MAX(updatedAt) AS updated_at
  
FROM Rating r1
GROUP BY restaurantName, burritoTitle, latitude, longitude, zipcode;

-- ============================================================================
-- STEP 2: MIGRATE RATINGS TO NEW STRUCTURE
-- ============================================================================

INSERT INTO ratings (
  id,
  tenant_id,
  item_id,
  scores,
  review,
  price_paid,
  reviewer_info,
  visit_date,
  image_urls,
  status,
  confirmed_at,
  confirmed_by,
  created_at,
  updated_at
)
SELECT 
  'rating_' || CAST(id AS TEXT) AS id,
  'burritos' AS tenant_id,
  
  -- Link to the corresponding item
  'item_' || LOWER(REPLACE(REPLACE(restaurantName, ' ', '_'), '''', '')) || '_' || 
  LOWER(REPLACE(REPLACE(burritoTitle, ' ', '_'), '''', '')) AS item_id,
  
  -- Convert rating fields to JSON scores
  json_object(
    'overall', rating,
    'taste', taste,
    'value', value
  ) AS scores,
  
  review,
  price AS price_paid,
  
  -- Convert reviewer information to JSON
  json_object(
    'name', COALESCE(reviewerName, 'Anonymous'),
    'emoji', COALESCE(reviewerEmoji, generatedEmoji, '🌮'),
    'identity_hash', COALESCE(identityPassword, 'legacy_' || CAST(id AS TEXT)),
    'location', zipcode
  ) AS reviewer_info,
  
  DATE(createdAt) AS visit_date,
  
  -- Convert image to JSON array
  CASE 
    WHEN image IS NOT NULL THEN json_array(image)
    ELSE NULL 
  END AS image_urls,
  
  -- Convert confirmation status
  CASE 
    WHEN confirmed = 1 THEN 'confirmed'
    ELSE 'pending'
  END AS status,
  
  -- Set confirmed_at if already confirmed
  CASE 
    WHEN confirmed = 1 THEN updatedAt
    ELSE NULL 
  END AS confirmed_at,
  
  'migration_script' AS confirmed_by,
  createdAt,
  updatedAt
  
FROM Rating;

-- ============================================================================
-- STEP 3: GENERATE RATING ANALYTICS
-- ============================================================================

INSERT INTO rating_analytics (
  id,
  tenant_id,
  item_id,
  total_ratings,
  average_scores,
  last_rating_at,
  updated_at
)
SELECT 
  item_id,
  'burritos' AS tenant_id,
  item_id,
  COUNT(*) AS total_ratings,
  
  json_object(
    'overall', ROUND(AVG(json_extract(scores, '$.overall')), 2),
    'taste', ROUND(AVG(json_extract(scores, '$.taste')), 2),
    'value', ROUND(AVG(json_extract(scores, '$.value')), 2)
  ) AS average_scores,
  
  MAX(created_at) AS last_rating_at,
  CURRENT_TIMESTAMP AS updated_at
  
FROM ratings 
WHERE tenant_id = 'burritos' AND status = 'confirmed'
GROUP BY item_id;

-- ============================================================================
-- STEP 4: CREATE ADMIN USER FOR BURRITOS TENANT
-- ============================================================================

INSERT INTO tenant_admins (
  id,
  tenant_id,
  email,
  role,
  permissions,
  created_at
) VALUES (
  'admin_burritos_owner',
  'burritos',
  'admin@burritos.r8r.one',
  'owner',
  json_object(
    'canManageAdmins', 1,
    'canModerateRatings', 1,
    'canEditTenantConfig', 1,
    'canViewAnalytics', 1,
    'canManageItems', 1,
    'canExportData', 1
  ),
  CURRENT_TIMESTAMP
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Count migrated data
SELECT 
  'Legacy Ratings' as source,
  COUNT(*) as count
FROM Rating
UNION ALL
SELECT 
  'New Items' as source,
  COUNT(*) as count
FROM items WHERE tenant_id = 'burritos'
UNION ALL
SELECT 
  'New Ratings' as source,
  COUNT(*) as count
FROM ratings WHERE tenant_id = 'burritos'
UNION ALL
SELECT 
  'Rating Analytics' as source,
  COUNT(*) as count
FROM rating_analytics WHERE tenant_id = 'burritos';

-- Sample of migrated data
SELECT 
  i.name,
  i.venue_name,
  i.attributes,
  COUNT(r.id) as rating_count,
  json_extract(ra.average_scores, '$.overall') as avg_overall
FROM items i
LEFT JOIN ratings r ON i.id = r.item_id
LEFT JOIN rating_analytics ra ON i.id = ra.item_id
WHERE i.tenant_id = 'burritos'
GROUP BY i.id
ORDER BY rating_count DESC
LIMIT 10;

-- Check reviewer information migration
SELECT 
  json_extract(reviewer_info, '$.name') as reviewer_name,
  json_extract(reviewer_info, '$.emoji') as emoji,
  json_extract(scores, '$.overall') as overall_rating,
  status,
  created_at
FROM ratings 
WHERE tenant_id = 'burritos'
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- CLEANUP NOTES
-- ============================================================================

-- After verifying the migration was successful, you can:
-- 1. Rename the old Rating table: ALTER TABLE Rating RENAME TO Rating_backup;
-- 2. Or drop it entirely: DROP TABLE Rating;
-- 3. Remove the backup when confident: DROP TABLE Rating_backup;

-- The migration preserves:
-- ✓ All original rating data and scores
-- ✓ Reviewer information and identity
-- ✓ Location data (lat/lng/zipcode)
-- ✓ Image references
-- ✓ Confirmation status
-- ✓ Created/updated timestamps
-- ✓ Burrito ingredient information (as JSON attributes)

-- New features enabled:
-- ✓ Multi-tenant architecture ready
-- ✓ Flexible rating categories
-- ✓ JSON-based attributes for extensibility
-- ✓ Pre-calculated analytics
-- ✓ Admin management system