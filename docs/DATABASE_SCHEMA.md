# Database Schema

This document outlines the database schema for the Burrito Rater application and serves as the definitive reference for the database structure.

## Overview

The Burrito Rater application uses Cloudflare D1, a serverless SQL database that is SQLite-compatible. This document contains the complete database schema definition, which is implemented in Cloudflare D1.

## Tables

### Rating

The `Rating` table stores information about burrito ratings submitted by users.

#### Schema

```sql
CREATE TABLE Rating (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  restaurantName TEXT NOT NULL,
  burritoTitle TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  zipcode TEXT,
  rating REAL NOT NULL,
  taste REAL NOT NULL,
  value REAL NOT NULL,
  price REAL NOT NULL,
  hasPotatoes BOOLEAN NOT NULL DEFAULT FALSE,
  hasCheese BOOLEAN NOT NULL DEFAULT FALSE,
  hasBacon BOOLEAN NOT NULL DEFAULT FALSE,
  hasChorizo BOOLEAN NOT NULL DEFAULT FALSE,
  hasAvocado BOOLEAN NOT NULL DEFAULT FALSE,
  hasVegetables BOOLEAN NOT NULL DEFAULT FALSE,
  review TEXT,
  reviewerName TEXT,
  identityPassword TEXT,
  generatedEmoji TEXT,
  reviewerEmoji TEXT,
  confirmed INTEGER NOT NULL DEFAULT 0,
  image TEXT
);
```

#### Columns

| Column Name     | Type      | Description                                      |
|-----------------|-----------|--------------------------------------------------|
| id              | INTEGER   | Primary key, auto-incremented                    |
| createdAt       | TIMESTAMP | When the rating was created                      |
| updatedAt       | TIMESTAMP | When the rating was last updated                 |
| restaurantName  | TEXT      | Name of the restaurant                           |
| burritoTitle    | TEXT      | Name of the burrito                              |
| latitude        | REAL      | Latitude coordinate of the restaurant            |
| longitude       | REAL      | Longitude coordinate of the restaurant           |
| zipcode         | TEXT      | Postal code of the restaurant                    |
| rating          | REAL      | Overall rating (1-5)                             |
| taste           | REAL      | Taste rating (1-5)                               |
| value           | REAL      | Value rating (1-5)                               |
| price           | REAL      | Price of the burrito                             |
| hasPotatoes     | BOOLEAN   | Whether the burrito contains potatoes            |
| hasCheese       | BOOLEAN   | Whether the burrito contains cheese              |
| hasBacon        | BOOLEAN   | Whether the burrito contains bacon               |
| hasChorizo      | BOOLEAN   | Whether the burrito contains chorizo             |
| hasAvocado      | BOOLEAN   | Whether the burrito contains avocado             |
| hasVegetables   | BOOLEAN   | Whether the burrito contains vegetables          |
| review          | TEXT      | Detailed review text                             |
| reviewerName    | TEXT      | Name of the reviewer (optional)                  |
| identityPassword| TEXT      | Password for reviewer identity (hashed)          |
| generatedEmoji  | TEXT      | Emoji generated for anonymous reviewers          |
| reviewerEmoji   | TEXT      | Emoji chosen by the reviewer                     |
| confirmed       | INTEGER   | Whether the rating has been confirmed by an admin (1=confirmed, 0=unconfirmed) |
| image           | TEXT      | Filename of the uploaded image                   |

## Indexes

The database includes several indexes to improve query performance:

```sql
-- Create index for location-based queries
CREATE INDEX idx_rating_location ON Rating (latitude, longitude);

-- Create index for zipcode-based queries
CREATE INDEX idx_rating_zipcode ON Rating (zipcode);

-- Create index for confirmation status
CREATE INDEX idx_rating_confirmed ON Rating (confirmed);
```

## Triggers

The database includes a trigger to automatically update the `updatedAt` timestamp when a rating is updated:

```sql
-- Create trigger to update the updatedAt timestamp
CREATE TRIGGER update_rating_timestamp
AFTER UPDATE ON Rating
FOR EACH ROW
BEGIN
  UPDATE Rating SET updatedAt = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
```

## Complete Schema Definition

Below is the complete SQL schema definition for the Burrito Rater database:

```sql
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id"                    TEXT PRIMARY KEY NOT NULL,
    "checksum"              TEXT NOT NULL,
    "finished_at"           DATETIME,
    "migration_name"        TEXT NOT NULL,
    "logs"                  TEXT,
    "rolled_back_at"        DATETIME,
    "started_at"            DATETIME NOT NULL DEFAULT current_timestamp,
    "applied_steps_count"   INTEGER UNSIGNED NOT NULL DEFAULT 0
);

-- Create Rating table
CREATE TABLE Rating (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  restaurantName TEXT NOT NULL,
  burritoTitle TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  zipcode TEXT,
  rating REAL NOT NULL,
  taste REAL NOT NULL,
  value REAL NOT NULL,
  price REAL NOT NULL,
  hasPotatoes BOOLEAN NOT NULL DEFAULT FALSE,
  hasCheese BOOLEAN NOT NULL DEFAULT FALSE,
  hasBacon BOOLEAN NOT NULL DEFAULT FALSE,
  hasChorizo BOOLEAN NOT NULL DEFAULT FALSE,
  hasOnion BOOLEAN NOT NULL DEFAULT FALSE,
  hasVegetables BOOLEAN NOT NULL DEFAULT FALSE,
  review TEXT,
  reviewerName TEXT,
  identityPassword TEXT,
  generatedEmoji TEXT,
  reviewerEmoji TEXT,
  confirmed INTEGER NOT NULL DEFAULT 0,
  image TEXT
);

-- Create index for location-based queries
CREATE INDEX idx_rating_location ON Rating (latitude, longitude);

-- Create index for zipcode-based queries
CREATE INDEX idx_rating_zipcode ON Rating (zipcode);

-- Create index for confirmation status
CREATE INDEX idx_rating_confirmed ON Rating (confirmed);

-- Create trigger to update the updatedAt timestamp
CREATE TRIGGER update_rating_timestamp
AFTER UPDATE ON Rating
FOR EACH ROW
BEGIN
  UPDATE Rating SET updatedAt = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
```

## API Integration

The database is accessed through the Cloudflare Worker API, which provides endpoints for:

- Getting all ratings
- Creating a new rating
- Getting a specific rating
- Deleting a rating
- Confirming a rating

## Local Development

For local development, the application connects to the cloud D1 database. This ensures that all environments use the same data source.

## Migration

The database was migrated from a local SQLite database to Cloudflare D1. For more information about the migration process, see the [Cloudflare Migration Guide](./CLOUDFLARE_MIGRATION.md). 