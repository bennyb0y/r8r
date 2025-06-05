#!/bin/bash

# Export legacy data migration script
# This script exports data from the old burrito-rater-db and prepares it for import

echo "Exporting legacy data from burrito-rater-db..."

# First, let's check what databases we have access to
echo "Available databases:"
npx wrangler d1 list

echo ""
echo "Exporting data from legacy database..."

# Export the data using the legacy database with temporary config
npx wrangler d1 execute burrito-rater-db --config=wrangler.legacy.toml --file=scripts/migrate_legacy_data.sql > scripts/legacy_data_import.sql

if [ $? -eq 0 ]; then
    echo "✅ Legacy data exported successfully to scripts/legacy_data_import.sql"
    echo ""
    echo "Next steps:"
    echo "1. Review the exported data in scripts/legacy_data_import.sql"
    echo "2. Run the import script against the new r8r-platform-db:"
    echo "   npx wrangler d1 execute r8r-platform-db --file=scripts/legacy_data_import.sql"
else
    echo "❌ Failed to export legacy data"
    exit 1
fi