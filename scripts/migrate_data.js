#!/usr/bin/env node

/**
 * Data migration script to move legacy burrito ratings from burrito-rater-db 
 * to the new r8r-platform-db with proper tenant isolation
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Starting data migration from burrito-rater-db to r8r-platform-db');

// Step 1: Export all data from legacy database
console.log('\n📥 Exporting data from legacy database...');
try {
  const exportResult = execSync(
    'npx wrangler d1 execute burrito-rater-db --config=wrangler.legacy.toml --remote --command="SELECT * FROM Rating ORDER BY createdAt;"',
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
  );
  
  const exportData = JSON.parse(exportResult);
  const ratings = exportData[0].results;
  
  console.log(`✅ Successfully exported ${ratings.length} ratings`);
  
  // Step 2: Transform data for new schema
  console.log('\n🔄 Transforming data for multi-tenant schema...');
  
  const transformedRatings = ratings.map(rating => {
    // Clean up emoji - remove HTML tags if present
    let emoji = rating.reviewerEmoji || rating.generatedEmoji || '🌯';
    if (emoji.includes('<span')) {
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
      title: rating.burritoTitle,
      restaurant: rating.restaurantName,
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
  
  // Step 3: Generate INSERT statements
  console.log('\n📝 Generating INSERT statements...');
  
  const insertStatements = transformedRatings.map(rating => {
    const values = [
      `'${rating.tenant_id}'`,
      rating.id,
      `'${rating.title.replace(/'/g, "''")}'`,
      `'${rating.restaurant.replace(/'/g, "''")}'`,
      rating.latitude,
      rating.longitude,
      rating.zipcode ? `'${rating.zipcode}'` : 'NULL',
      rating.rating,
      rating.taste,
      rating.value,
      rating.price,
      rating.reviewer_name ? `'${rating.reviewer_name.replace(/'/g, "''")}'` : 'NULL',
      `'${rating.reviewer_emoji}'`,
      rating.identity_password ? `'${rating.identity_password}'` : 'NULL',
      rating.ingredients ? `'${rating.ingredients}'` : 'NULL',
      rating.image_filename ? `'${rating.image_filename}'` : 'NULL',
      rating.image_url ? `'${rating.image_url}'` : 'NULL',
      `'${rating.created_at}'`,
      `'${rating.updated_at}'`
    ];
    
    return `INSERT INTO ratings (tenant_id, id, title, restaurant, latitude, longitude, zipcode, rating, taste, value, price, reviewer_name, reviewer_emoji, identity_password, ingredients, image_filename, image_url, created_at, updated_at) VALUES (${values.join(', ')});`;
  });
  
  // Step 4: Write import file
  const importSQL = [
    '-- Data migration from burrito-rater-db to r8r-platform-db',
    '-- All legacy ratings assigned to "burritos" tenant',
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
  
  // Step 5: Import into new database
  console.log('\n📤 Importing data into r8r-platform-db...');
  
  const importResult = execSync(
    'npx wrangler d1 execute r8r-platform-db --file=scripts/legacy_data_import.sql',
    { encoding: 'utf8' }
  );
  
  console.log('✅ Data migration completed successfully!');
  console.log('\n📊 Migration Summary:');
  console.log(`   • ${ratings.length} ratings migrated`);
  console.log(`   • All assigned to 'burritos' tenant`);
  console.log(`   • Available at: burritos.r8r.one`);
  
  // Step 6: Verify migration
  console.log('\n🔍 Verifying migration...');
  
  const verifyResult = execSync(
    'npx wrangler d1 execute r8r-platform-db --command="SELECT COUNT(*) as count FROM ratings WHERE tenant_id = \'burritos\';"',
    { encoding: 'utf8' }
  );
  
  const verifyData = JSON.parse(verifyResult);
  const migratedCount = verifyData[0].results[0].count;
  
  if (migratedCount === ratings.length) {
    console.log(`✅ Verification successful: ${migratedCount} ratings found in new database`);
  } else {
    console.log(`❌ Verification failed: Expected ${ratings.length}, found ${migratedCount}`);
  }
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}