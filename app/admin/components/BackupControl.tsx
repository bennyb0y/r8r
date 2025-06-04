'use client';

import { useState } from 'react';

interface TableStats {
  name: string;
  rowCount: number;
  schemaSize: number;
  dataSize: number;
}

interface BackupResult {
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
}

export default function BackupControl() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BackupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatTimestamp = (timestamp: string): string => {
    // Convert from format like "2025-03-19T18-23-14-692Z" to "2025-03-19T18:23:14.692Z"
    return timestamp.replace(/-(\d{2})-(\d{2})-(\d{3})Z$/, ':$1:$2.$3Z');
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const triggerBackup = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setResult(null);

      const response = await fetch('https://burrito-backup-worker.bennyfischer.workers.dev', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      const data: BackupResult = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create backup');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Database Backup</h3>
      
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <button
            onClick={triggerBackup}
            disabled={isLoading}
            className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
              isLoading 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating Backup...
              </span>
            ) : (
              'Backup Now'
            )}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-md">
            <p className="font-medium">Error creating backup</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {result && result.success && (
          <div className="p-4 bg-green-50 text-green-700 rounded-md">
            <p className="font-medium">Backup created successfully!</p>
            
            {/* General Information */}
            <div className="mt-4 space-y-1 text-sm">
              <p><span className="font-medium">Filename:</span> {result.filename}</p>
              <p><span className="font-medium">Timestamp:</span> {result.timestamp ? new Date(formatTimestamp(result.timestamp)).toLocaleString() : 'N/A'}</p>
              <p><span className="font-medium">Duration:</span> {result.stats ? formatDuration(result.stats.duration) : 'N/A'}</p>
            </div>

            {/* Overall Statistics */}
            {result.stats && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Overall Statistics</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-100 p-3 rounded-md">
                    <p className="text-xs text-green-600 uppercase">Total Tables</p>
                    <p className="text-lg font-semibold">{result.tableCount}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-md">
                    <p className="text-xs text-green-600 uppercase">Total Rows</p>
                    <p className="text-lg font-semibold">{result.stats.totalRows}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-md">
                    <p className="text-xs text-green-600 uppercase">Total Size</p>
                    <p className="text-lg font-semibold">{formatBytes(result.stats.totalSize)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Table Details */}
            {result.stats?.tables && result.stats.tables.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Table Details</h4>
                <div className="space-y-2">
                  {result.stats.tables.map((table) => (
                    <div key={table.name} className="bg-green-100 p-3 rounded-md">
                      <p className="font-medium text-green-800">{table.name}</p>
                      <div className="mt-1 grid grid-cols-3 gap-2 text-sm">
                        <p><span className="text-green-600">Rows:</span> {table.rowCount}</p>
                        <p><span className="text-green-600">Schema:</span> {formatBytes(table.schemaSize)}</p>
                        <p><span className="text-green-600">Data:</span> {formatBytes(table.dataSize)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 