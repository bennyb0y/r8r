#!/usr/bin/env node

/**
 * Migrate legacy burrito data to new multi-tenant schema
 */

const fs = require('fs');
const crypto = require('crypto');

console.log('🚀 Migrating legacy data to new multi-tenant schema...');

// Read the exported JSON
const rawData = JSON.parse(fs.readFileSync('scripts/legacy_export_raw.json', 'utf8'));
const legacyRatings = rawData[0].results;

console.log(`📥 Found ${legacyRatings.length} legacy ratings to migrate`);

// Step 1: Create burritos tenant
const burritosTenant = {
  id: 'burritos',
  subdomain: 'burritos',
  name: 'Burrito Reviews',
  category: 'food',
  subcategory: 'mexican',
  owner_email: 'admin@r8r.one',
  status: 'active',
  config: {
    type: 'food_rating',
    features: {
      maps: true,
      images: true,
      reviews: true,
      social: false
    },
    scoring_criteria: [
      { name: 'taste', label: 'Taste', scale: 5 },
      { name: 'value', label: 'Value', scale: 5 },
      { name: 'overall', label: 'Overall', scale: 5 }
    ],
    location_required: true,
    price_tracking: true
  },
  branding: {
    color_primary: '#8B4513',
    color_secondary: '#D2691E',
    emoji: '🌯'
  },
  settings: {
    moderation: 'auto',
    anonymous_reviews: true,
    require_photos: false
  }
};

// Step 2: Extract unique items (restaurant + burrito combinations)
const itemsMap = new Map();

legacyRatings.forEach(rating => {
  const key = `${rating.restaurantName}||${rating.burritoTitle}`;
  if (!itemsMap.has(key)) {
    const itemId = crypto.createHash('md5').update(key).digest('hex').substring(0, 12);
    itemsMap.set(key, {
      id: itemId,
      tenant_id: 'burritos',
      name: rating.burritoTitle || 'Burrito',
      venue_name: rating.restaurantName || 'Unknown Restaurant',
      venue_address: null,
      latitude: rating.latitude,
      longitude: rating.longitude,
      zipcode: rating.zipcode,
      price_range_min: null,
      price_range_max: null,
      attributes: {
        type: 'burrito',
        category: 'mexican'
      },
      image_urls: [],
      status: 'active',
      created_by: 'migration',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }
});

const items = Array.from(itemsMap.values());
console.log(`📦 Created ${items.length} unique items from legacy data`);

// Step 3: Transform ratings to new schema
const ratings = legacyRatings.map(rating => {
  const key = `${rating.restaurantName}||${rating.burritoTitle}`;
  const item = itemsMap.get(key);
  
  // Clean up emoji
  let emoji = rating.reviewerEmoji || rating.generatedEmoji || '🌯';
  if (emoji && emoji.includes('<span')) {
    emoji = emoji.substring(0, emoji.indexOf('<')).trim() || '🌯';
  }
  
  // Build ingredients
  const ingredients = [];
  if (rating.hasPotatoes) ingredients.push('potatoes');
  if (rating.hasCheese) ingredients.push('cheese');
  if (rating.hasBacon) ingredients.push('bacon');
  if (rating.hasChorizo) ingredients.push('chorizo');
  if (rating.hasAvocado) ingredients.push('avocado');
  if (rating.hasVegetables) ingredients.push('vegetables');
  
  return {
    id: `rating_${rating.id}`,
    tenant_id: 'burritos',
    item_id: item.id,
    scores: {
      taste: rating.taste,
      value: rating.value,
      overall: rating.rating
    },
    review: rating.review || null,
    price_paid: rating.price,
    reviewer_info: {
      name: rating.reviewerName,
      emoji: emoji,
      identity_hash: rating.identityPassword,
      ingredients: ingredients
    },
    visit_date: rating.createdAt ? rating.createdAt.split('T')[0] : null,
    image_urls: rating.image ? [`https://r8r-images.bennyfischer.workers.dev/${rating.image}`] : [],
    status: 'confirmed',
    confirmed_at: rating.updatedAt,
    confirmed_by: 'migration',
    created_at: rating.createdAt,
    updated_at: rating.updatedAt
  };
});

console.log(`⭐ Transformed ${ratings.length} ratings`);

// Step 4: Generate SQL statements
const sqlStatements = [];

// Insert tenant
const tenantValues = [
  `'${burritosTenant.id}'`,
  `'${burritosTenant.subdomain}'`,
  `'${burritosTenant.name}'`,
  `'${burritosTenant.category}'`,
  `'${burritosTenant.subcategory}'`,
  `'${burritosTenant.owner_email}'`,
  `'${burritosTenant.status}'`,
  `'${JSON.stringify(burritosTenant.config).replace(/'/g, "''")}'`,
  `'${JSON.stringify(burritosTenant.branding).replace(/'/g, "''")}'`,
  `'${JSON.stringify(burritosTenant.settings).replace(/'/g, "''")}'`,
  `CURRENT_TIMESTAMP`,
  `CURRENT_TIMESTAMP`
];

sqlStatements.push(`INSERT OR REPLACE INTO tenants (id, subdomain, name, category, subcategory, owner_email, status, config, branding, settings, created_at, updated_at) VALUES (${tenantValues.join(', ')});`);

// Insert items
items.forEach(item => {
  const values = [
    `'${item.id}'`,
    `'${item.tenant_id}'`,
    `'${item.name.replace(/'/g, "''")}'`,
    `'${item.venue_name.replace(/'/g, "''")}'`,
    item.venue_address ? `'${item.venue_address}'` : 'NULL',
    item.latitude || 'NULL',
    item.longitude || 'NULL',
    item.zipcode ? `'${item.zipcode}'` : 'NULL',
    item.price_range_min || 'NULL',
    item.price_range_max || 'NULL',
    `'${JSON.stringify(item.attributes).replace(/'/g, "''")}'`,
    `'${JSON.stringify(item.image_urls).replace(/'/g, "''")}'`,
    `'${item.status}'`,
    `'${item.created_by}'`,
    `'${item.created_at}'`,
    `'${item.updated_at}'`
  ];
  
  sqlStatements.push(`INSERT OR REPLACE INTO items (id, tenant_id, name, venue_name, venue_address, latitude, longitude, zipcode, price_range_min, price_range_max, attributes, image_urls, status, created_by, created_at, updated_at) VALUES (${values.join(', ')});`);
});

// Insert ratings
ratings.forEach(rating => {
  const values = [
    `'${rating.id}'`,
    `'${rating.tenant_id}'`,
    `'${rating.item_id}'`,
    `'${JSON.stringify(rating.scores).replace(/'/g, "''")}'`,
    rating.review ? `'${rating.review.replace(/'/g, "''")}'` : 'NULL',
    rating.price_paid || 'NULL',
    `'${JSON.stringify(rating.reviewer_info).replace(/'/g, "''")}'`,
    rating.visit_date ? `'${rating.visit_date}'` : 'NULL',
    `'${JSON.stringify(rating.image_urls).replace(/'/g, "''")}'`,
    `'${rating.status}'`,
    rating.confirmed_at ? `'${rating.confirmed_at}'` : 'NULL',
    rating.confirmed_by ? `'${rating.confirmed_by}'` : 'NULL',
    `'${rating.created_at}'`,
    `'${rating.updated_at}'`
  ];
  
  sqlStatements.push(`INSERT OR REPLACE INTO ratings (id, tenant_id, item_id, scores, review, price_paid, reviewer_info, visit_date, image_urls, status, confirmed_at, confirmed_by, created_at, updated_at) VALUES (${values.join(', ')});`);
});

// Create final migration SQL
const migrationSQL = [
  '-- Legacy burrito data migration to new multi-tenant schema',
  '-- This creates the burritos tenant and migrates all legacy ratings',
  '',
  '-- Clean up any existing burritos tenant data',
  "DELETE FROM ratings WHERE tenant_id = 'burritos';",
  "DELETE FROM items WHERE tenant_id = 'burritos';", 
  "DELETE FROM tenants WHERE id = 'burritos';",
  '',
  '-- Insert tenant',
  sqlStatements[0],
  '',
  '-- Insert items',
  ...sqlStatements.slice(1, items.length + 1),
  '',
  '-- Insert ratings',
  ...sqlStatements.slice(items.length + 1),
  '',
  '-- Verification queries',
  "SELECT 'Tenant created:' as status, COUNT(*) as count FROM tenants WHERE id = 'burritos';",
  "SELECT 'Items created:' as status, COUNT(*) as count FROM items WHERE tenant_id = 'burritos';",
  "SELECT 'Ratings created:' as status, COUNT(*) as count FROM ratings WHERE tenant_id = 'burritos';"
].join('\n');

// Write migration file
fs.writeFileSync('scripts/new_schema_migration.sql', migrationSQL);

console.log('✅ New schema migration created: scripts/new_schema_migration.sql');
console.log('\n📊 Migration Summary:');
console.log(`   • 1 tenant (burritos)`);
console.log(`   • ${items.length} items`);
console.log(`   • ${ratings.length} ratings`);
console.log('\n🔍 Sample items created:');
items.slice(0, 3).forEach((item, i) => {
  console.log(`${i + 1}. ${item.name} at ${item.venue_name}`);
});

console.log('\n📤 Ready to import with: npx wrangler d1 execute r8r-platform-db --remote --file=scripts/new_schema_migration.sql');