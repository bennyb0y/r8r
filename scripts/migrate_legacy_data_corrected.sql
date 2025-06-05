-- Migration script to export data from legacy burrito-rater-db Rating table
-- and prepare it for import into r8r-platform-db ratings table with tenant isolation

-- Step 1: Export all ratings from legacy database Rating table  
-- Run this against the OLD database (burrito-rater-db)

.mode json
SELECT 
  'burritos' as tenant_id,
  id,
  burritoTitle as title,
  restaurantName as restaurant,
  latitude,
  longitude,
  zipcode,
  rating,
  taste,
  value,
  price,
  reviewerName as reviewer_name,
  COALESCE(reviewerEmoji, generatedEmoji, '🌯') as reviewer_emoji,
  identityPassword as identity_password,
  CASE 
    WHEN hasPotatoes OR hasCheese OR hasBacon OR hasChorizo OR hasAvocado OR hasVegetables THEN
      (CASE WHEN hasPotatoes THEN 'potatoes,' ELSE '' END ||
       CASE WHEN hasCheese THEN 'cheese,' ELSE '' END ||
       CASE WHEN hasBacon THEN 'bacon,' ELSE '' END ||
       CASE WHEN hasChorizo THEN 'chorizo,' ELSE '' END ||
       CASE WHEN hasAvocado THEN 'avocado,' ELSE '' END ||
       CASE WHEN hasVegetables THEN 'vegetables,' ELSE '' END)
    ELSE NULL
  END as ingredients,
  image as image_filename,
  CASE 
    WHEN image IS NOT NULL THEN 'https://r8r-images.bennyfischer.workers.dev/' || image
    ELSE NULL
  END as image_url,
  createdAt as created_at,
  updatedAt as updated_at
FROM Rating
ORDER BY createdAt;