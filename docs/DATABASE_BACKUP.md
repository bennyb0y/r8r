# Database Backup System

## Overview

The Burrito Rater application includes an automated backup system that exports the D1 database to R2 storage. The system is implemented as a Cloudflare Worker that creates SQL dumps of the entire database, including schema and data. Backups are performed both automatically on a daily schedule and manually via HTTP requests.

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│              │     │              │     │              │
│  Cloudflare  │────▶│   Backup     │────▶│  Cloudflare  │
│  D1 Database │     │   Worker     │     │  R2 Storage  │
│              │     │              │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
```

## Configuration

### Worker Configuration (wrangler.backup.toml)
```toml
name = "burrito-backup-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"
account_id = "your-account-id"

# Run backup every day at midnight UTC
[triggers]
crons = ["0 0 * * *"]

[[d1_databases]]
binding = "DB"
database_name = "burrito-rater-db"
database_id = "your-database-id"

[[r2_buckets]]
binding = "BACKUP_BUCKET"
bucket_name = "burrito-backup"
```

### Environment Variables
Required environment variables in `.env.local`:
- `CF_API_TOKEN`: Cloudflare API token with appropriate permissions
- `CF_ACCOUNT_ID`: Your Cloudflare account ID
- `DATABASE_URL`: Your D1 database name
- `BACKUP_BUCKET`: Your R2 bucket name

## Backup Process

### Scheduled Backups
- Runs automatically every day at midnight UTC
- Configured via cron trigger in wrangler.backup.toml
- Includes logging for monitoring and debugging
- Retries automatically on failure

### Manual Backups
- Triggered via HTTP GET request to the worker endpoint
- Returns JSON response with backup status
- Useful for on-demand backups or testing

### Backup Steps
1. **Database Schema Export**
   - Queries `sqlite_master` to get all table definitions
   - Excludes SQLite internal tables
   - Preserves complete table structure

2. **Data Export**
   - Exports all data from each table
   - Generates proper SQL INSERT statements
   - Handles NULL values and string escaping
   - Maintains data integrity

3. **Backup Storage**
   - Generates timestamped backup files
   - Format: `backup-YYYY-MM-DDTHH-mm-ss-sssZ.sql`
   - Stores in R2 with appropriate metadata
   - Includes content type and table count information

## Deployment

### Initial Setup
```bash
cd backup-worker
npm install
```

### Deployment Command
```bash
npm run deploy:backup
```

The deployment requires:
- Valid Cloudflare API token in environment variables
- Access to the D1 database
- Access to the R2 bucket

## API Endpoint

The backup worker exposes an HTTP endpoint:
- URL: `https://your-worker-name.your-account.workers.dev`
- Method: GET
- Response: JSON with backup status and details

### Success Response
```json
{
  "success": true,
  "message": "Backup completed successfully",
  "filename": "backup-2024-03-19T16-55-25-928Z.sql",
  "timestamp": "2024-03-19T16:55:25.928Z",
  "tableCount": 2,
  "stats": {
    "totalRows": 100,
    "totalSize": 1024000,
    "tables": [
      {
        "name": "ratings",
        "rowCount": 80,
        "schemaSize": 1024,
        "dataSize": 819200
      },
      {
        "name": "restaurants",
        "rowCount": 20,
        "schemaSize": 512,
        "dataSize": 204800
      }
    ],
    "duration": 1500
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Backup failed",
  "error": "Error message details"
}
```

## Monitoring

### Logging
The backup worker includes comprehensive logging:
- Backup start and completion timestamps
- Number of tables processed
- Individual table processing status
- Error details if backup fails

### Metadata
Each backup in R2 includes the following metadata:
- `contentType`: "application/sql"
- `timestamp`: ISO timestamp of backup creation
- `tableCount`: Number of tables included in backup
- `backupType`: "scheduled" or "manual"
- `totalRows`: Total number of rows across all tables
- `totalSize`: Total size of the backup in bytes
- `duration`: Backup process duration in milliseconds
- `tables`: Array of table-specific statistics

### Admin Interface Integration

The backup system is integrated into the admin interface with the following features:

1. **Backup Control**
   - Manual backup trigger button
   - Real-time backup status display
   - Detailed success/error messages
   - Loading states and error handling

2. **Recent Backups Display**
   - List of recent backups with timestamps
   - Backup type indicators (scheduled/manual)
   - Table count and row statistics
   - File size information
   - Newest and oldest backup indicators
   - Automatic refresh every 30 seconds

3. **Statistics Display**
   - Total number of tables
   - Total row count across all tables
   - Total backup size
   - Per-table statistics
   - Backup duration
   - Human-readable formatting for sizes and durations

## Troubleshooting

Common issues and solutions:

1. **Database Access Issues**
   - Verify database ID in wrangler.backup.toml
   - Check D1 database permissions
   - Ensure environment variables are set correctly

2. **R2 Storage Issues**
   - Verify R2 bucket exists
   - Check R2 bucket permissions
   - Ensure sufficient storage space

3. **Deployment Issues**
   - Verify Cloudflare API token permissions
   - Check wrangler.backup.toml configuration
   - Ensure all required environment variables are set

4. **Scheduled Backup Issues**
   - Check cron trigger configuration
   - Verify worker logs for execution details
   - Monitor for retry attempts on failure

## Best Practices

1. **Regular Backups**
   - Automatic daily backups at midnight UTC
   - Manual backups as needed
   - Monitor backup success/failure
   - Verify backup contents periodically

2. **Retention Policy**
   - Implement backup rotation
   - Maintain sufficient backup history
   - Monitor storage usage

3. **Security**
   - Use minimal-permission API tokens
   - Secure backup access
   - Monitor access logs
   - Never commit sensitive information to version control

## Future Improvements

Potential enhancements to consider:
1. Multiple backup schedules (daily, weekly, monthly)
2. Backup rotation and cleanup
3. Backup verification and testing
4. Compression of backup files
5. Backup restoration automation
6. Backup success notifications
7. Custom backup retention policies 