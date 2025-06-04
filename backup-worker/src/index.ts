import { ExecutionContext, D1Database, R2Bucket, ScheduledEvent } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
  BACKUP_BUCKET: R2Bucket;
}

interface TableStats {
  name: string;
  rowCount: number;
  schemaSize: number;
  dataSize: number;
}

interface BackupMetadata {
  filename: string;
  timestamp: string;
  tableCount: number;
  totalRows: number;
  totalSize: number;
  duration: number;
  backupType: 'manual' | 'scheduled';
}

async function performBackup(env: Env): Promise<{ 
  success: boolean; 
  message: string; 
  filename?: string; 
  timestamp?: string; 
  tableCount?: number; 
  error?: string;
  stats?: {
    totalRows: number;
    totalSize: number;
    tables: TableStats[];
    duration: number;
  }
}> {
  const startTime = Date.now();
  const stats: TableStats[] = [];
  let totalRows = 0;

  try {
    // Generate timestamp for filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql`;

    console.log(`Starting backup: ${filename}`);

    // Get all user tables from the database (excluding SQLite internal tables)
    const tables = await env.DB.prepare(
      "SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'"
    ).all<{ name: string }>();

    if (!tables.results || tables.results.length === 0) {
      throw new Error('No tables found to backup');
    }

    console.log(`Found ${tables.results.length} tables to backup`);
    let sqlDump = '';

    // For each table, get schema and data
    for (const table of tables.results) {
      const tableName = table.name;
      console.log(`Processing table: ${tableName}`);
      const tableStats: TableStats = {
        name: tableName,
        rowCount: 0,
        schemaSize: 0,
        dataSize: 0
      };

      try {
        // Get table schema
        const schema = await env.DB.prepare(
          `SELECT sql FROM sqlite_schema WHERE type='table' AND name=?`
        ).bind(tableName).first();

        if (schema?.sql) {
          const schemaSql = `DROP TABLE IF EXISTS ${tableName};\n${schema.sql};\n\n`;
          sqlDump += schemaSql;
          tableStats.schemaSize = schemaSql.length;
        } else {
          console.warn(`No schema found for table: ${tableName}`);
          continue;
        }

        // Get row count
        const countResult = await env.DB.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).first<{ count: number }>();
        tableStats.rowCount = countResult?.count ?? 0;
        totalRows += tableStats.rowCount;
        console.log(`Table ${tableName} has ${tableStats.rowCount} rows`);

        // Get table data
        const data = await env.DB.prepare(`SELECT * FROM ${tableName}`).all();
        
        if (data.results && data.results.length > 0) {
          // Generate INSERT statements
          let tableData = '';
          for (const row of data.results) {
            const columns = Object.keys(row);
            const values = Object.values(row).map(value => {
              if (value === null) return 'NULL';
              if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
              return value;
            });

            const insertStatement = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
            tableData += insertStatement;
          }
          sqlDump += tableData;
          tableStats.dataSize = tableData.length;
        }
        sqlDump += '\n';
        stats.push(tableStats);
        
        console.log(`Completed processing ${tableName}:`, {
          rows: tableStats.rowCount,
          schemaSize: `${(tableStats.schemaSize / 1024).toFixed(2)} KB`,
          dataSize: `${(tableStats.dataSize / 1024).toFixed(2)} KB`
        });

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error(`Error processing table ${tableName}:`, error);
        throw new Error(`Failed to process table ${tableName}: ${errorMessage}`);
      }
    }

    const totalSize = sqlDump.length;
    const duration = Date.now() - startTime;

    // Upload to R2
    await env.BACKUP_BUCKET.put(filename, sqlDump, {
      httpMetadata: {
        contentType: 'application/sql'
      },
      customMetadata: {
        timestamp: timestamp,
        tableCount: tables.results.length.toString(),
        totalRows: totalRows.toString(),
        totalSize: totalSize.toString(),
        duration: duration.toString(),
        backupType: 'manual'
      }
    });

    console.log(`Backup completed successfully:`, {
      filename,
      duration: `${(duration / 1000).toFixed(2)} seconds`,
      totalTables: tables.results.length,
      totalRows,
      totalSize: `${(totalSize / 1024).toFixed(2)} KB`
    });

    return {
      success: true,
      message: 'Backup completed successfully',
      filename,
      timestamp,
      tableCount: tables.results.length,
      stats: {
        totalRows,
        totalSize,
        tables: stats,
        duration
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Backup failed:', error);
    return {
      success: false,
      message: 'Backup failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      stats: {
        totalRows,
        totalSize: 0,
        tables: stats,
        duration
      }
    };
  }
}

export default {
  // HTTP request handler
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle list backups endpoint
    if (url.pathname === '/list' && request.method === 'GET') {
      try {
        // List objects in R2 bucket
        const objects = await env.BACKUP_BUCKET.list({
          prefix: 'backup-',
          limit: 20
        });

        // Sort objects by uploaded date (most recent first)
        objects.objects.sort((a, b) => 
          new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime()
        );

        // Extract metadata from each object
        const backups: BackupMetadata[] = await Promise.all(
          objects.objects.map(async (obj) => {
            const metadata = await env.BACKUP_BUCKET.head(obj.key);
            if (!metadata) {
              return {
                filename: obj.key,
                timestamp: '',
                tableCount: 0,
                totalRows: 0,
                totalSize: 0,
                duration: 0,
                backupType: 'manual' as const
              };
            }
            return {
              filename: obj.key,
              timestamp: metadata.customMetadata?.timestamp || '',
              tableCount: parseInt(metadata.customMetadata?.tableCount || '0'),
              totalRows: parseInt(metadata.customMetadata?.totalRows || '0'),
              totalSize: parseInt(metadata.customMetadata?.totalSize || '0'),
              duration: parseInt(metadata.customMetadata?.duration || '0'),
              backupType: metadata.customMetadata?.backupType as 'manual' | 'scheduled' || 'manual'
            };
          })
        );

        return new Response(JSON.stringify({ backups }, null, 2), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }), {
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }

    // Handle backup creation endpoint
    const result = await performBackup(env);
    return new Response(JSON.stringify(result, null, 2), {
      status: result.success ? 200 : 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  },

  // Scheduled event handler
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`Starting scheduled backup at ${new Date().toISOString()}`);
    const result = await performBackup(env);
    if (!result.success) {
      // Throw error to trigger retry mechanism
      throw new Error(`Scheduled backup failed: ${result.error}`);
    }
    console.log('Scheduled backup completed:', {
      filename: result.filename,
      duration: `${(result.stats?.duration || 0 / 1000).toFixed(2)} seconds`,
      totalTables: result.tableCount,
      totalRows: result.stats?.totalRows,
      totalSize: `${(result.stats?.totalSize || 0 / 1024).toFixed(2)} KB`
    });
  }
}; 