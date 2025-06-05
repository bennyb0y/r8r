-- Migration script to export data from legacy burrito-rater-db 
-- and prepare it for import into r8r-platform-db with tenant isolation

-- Step 1: Export all ratings from legacy database
-- Run this against the OLD database (0e87da0b-9043-44f4-8782-3ee0c9fd6553)
-- Command: npx wrangler d1 execute burrito-rater-db --file=scripts/export_legacy_data.sql > legacy_data_export.sql

SELECT 
  'INSERT INTO ratings (tenant_id, id, title, restaurant, latitude, longitude, zipcode, rating, taste, value, price, reviewer_name, reviewer_emoji, identity_password, ingredients, image_filename, image_url, created_at, updated_at) VALUES (' ||
  '''burritos'', ' ||  -- Assign all legacy data to 'burritos' tenant
  '''' || id || ''', ' ||
  '''' || REPLACE(title, '''', '''''') || ''', ' ||
  '''' || REPLACE(restaurant, '''', '''''') || ''', ' ||
  latitude || ', ' ||
  longitude || ', ' ||
  '''' || zipcode || ''', ' ||
  rating || ', ' ||
  taste || ', ' ||
  value || ', ' ||
  price || ', ' ||
  '''' || REPLACE(reviewer_name, '''', '''''') || ''', ' ||
  '''' || reviewer_emoji || ''', ' ||
  CASE 
    WHEN identity_password IS NULL THEN 'NULL'
    ELSE '''' || REPLACE(identity_password, '''', '''''') || ''''
  END || ', ' ||
  CASE 
    WHEN ingredients IS NULL THEN 'NULL'
    ELSE '''' || REPLACE(ingredients, '''', '''''') || ''''
  END || ', ' ||
  CASE 
    WHEN image_filename IS NULL THEN 'NULL'
    ELSE '''' || REPLACE(image_filename, '''', '''''') || ''''
  END || ', ' ||
  CASE 
    WHEN image_url IS NULL THEN 'NULL'
    ELSE '''' || REPLACE(image_url, '''', '''''') || ''''
  END || ', ' ||
  '''' || created_at || ''', ' ||
  '''' || updated_at || '''');'
FROM ratings
ORDER BY created_at;