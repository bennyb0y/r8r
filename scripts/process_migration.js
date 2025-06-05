#!/usr/bin/env node

/**
 * Process exported legacy data and create import SQL
 */

const fs = require('fs');

console.log('🚀 Processing legacy data for migration...');

// Read the exported JSON
const rawData = JSON.parse(fs.readFileSync('scripts/legacy_export_raw.json', 'utf8'));
const ratings = rawData[0].results;

console.log(`📥 Found ${ratings.length} ratings to migrate`);

// Transform data for new schema
const transformedRatings = ratings.map(rating => {
  // Clean up emoji - remove HTML tags if present
  let emoji = rating.reviewerEmoji || rating.generatedEmoji || '🌯';
  if (emoji && emoji.includes('<span')) {
    emoji = emoji.substring(0, emoji.indexOf('<')).trim() || '🌯';
  }
  
  // Build ingredients list from boolean fields
  const ingredients = [];
  if (rating.hasPotatoes) ingredients.push('potatoes');
  if (rating.hasCheese) ingredients.push('cheese');
  if (rating.hasBacon) ingredients.push('bacon');
  if (rating.hasChorizo) ingredients.push('chorizo');
  if (rating.hasAvocado) ingredients.push('avocado');
  if (rating.hasVegetables) ingredients.push('vegetables');
  
  return {
    tenant_id: 'burritos', // All legacy data goes to burritos tenant
    id: rating.id,
    title: rating.burritoTitle || 'Burrito',
    restaurant: rating.restaurantName || 'Unknown',
    latitude: rating.latitude,
    longitude: rating.longitude,
    zipcode: rating.zipcode,
    rating: rating.rating,
    taste: rating.taste,
    value: rating.value,
    price: rating.price,
    reviewer_name: rating.reviewerName,
    reviewer_emoji: emoji,
    identity_password: rating.identityPassword,
    ingredients: ingredients.length > 0 ? ingredients.join(',') : null,
    image_filename: rating.image,
    image_url: rating.image ? `https://r8r-images.bennyfischer.workers.dev/${rating.image}` : null,
    created_at: rating.createdAt,
    updated_at: rating.updatedAt
  };
});

// Generate INSERT statements
const insertStatements = transformedRatings.map(rating => {
  const escapeString = (str) => str ? `'${str.replace(/'/g, "''")}'` : 'NULL';
  
  const values = [
    escapeString(rating.tenant_id),
    rating.id,
    escapeString(rating.title),
    escapeString(rating.restaurant),
    rating.latitude,
    rating.longitude,
    rating.zipcode ? escapeString(rating.zipcode) : 'NULL',
    rating.rating,
    rating.taste,
    rating.value,
    rating.price,
    escapeString(rating.reviewer_name),
    escapeString(rating.reviewer_emoji),
    escapeString(rating.identity_password),
    escapeString(rating.ingredients),
    escapeString(rating.image_filename),
    escapeString(rating.image_url),
    escapeString(rating.created_at),
    escapeString(rating.updated_at)
  ];
  
  return `INSERT INTO ratings (tenant_id, id, title, restaurant, latitude, longitude, zipcode, rating, taste, value, price, reviewer_name, reviewer_emoji, identity_password, ingredients, image_filename, image_url, created_at, updated_at) VALUES (${values.join(', ')});`;
});

// Write import file
const importSQL = [
  '-- Data migration from burrito-rater-db to r8r-platform-db',
  '-- All legacy ratings assigned to "burritos" tenant for burritos.r8r.one',
  '',
  '-- Delete any existing burritos tenant data (in case of re-run)',
  "DELETE FROM ratings WHERE tenant_id = 'burritos';",
  '',
  '-- Insert migrated data',
  ...insertStatements,
  '',
  '-- Verification',
  "SELECT COUNT(*) as migrated_count FROM ratings WHERE tenant_id = 'burritos';"
].join('\n');

fs.writeFileSync('scripts/legacy_data_import.sql', importSQL);

console.log('✅ Import SQL file created: scripts/legacy_data_import.sql');
console.log(`📊 Generated ${insertStatements.length} INSERT statements`);
console.log('📤 Ready to import into r8r-platform-db');

// Show sample of first few entries for verification
console.log('\n🔍 Sample migrated data (first 3 entries):');
transformedRatings.slice(0, 3).forEach((rating, i) => {
  console.log(`${i + 1}. ${rating.title} at ${rating.restaurant} - ${rating.rating}⭐ by ${rating.reviewer_name} ${rating.reviewer_emoji}`);
});