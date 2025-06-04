'use client';

import { useState, useEffect } from 'react';

interface BackupMetadata {
  filename: string;
  timestamp: string;
  tableCount: number;
  totalRows: number;
  totalSize: number;
  duration: number;
  backupType: 'manual' | 'scheduled';
}

export default function RecentBackups() {
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentBackups();
  }, []);

  const formatTimestamp = (timestamp: string): string => {
    // Convert from format like "2025-03-19T18-23-14-692Z" to "2025-03-19T18:23:14.692Z"
    return timestamp.replace(/-(\d{2})-(\d{2})-(\d{3})Z$/, ':$1:$2.$3Z');
  };

  const fetchRecentBackups = async () => {
    try {
      const response = await fetch('https://burrito-backup-worker.bennyfischer.workers.dev/list');
      const data = await response.json();
      setBackups(data.backups);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recent backups');
    } finally {
      setIsLoading(false);
    }
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

  const getNewestBackup = () => {
    if (!backups.length) return null;
    return backups[0];
  };

  const getOldestBackup = () => {
    if (!backups.length) return null;
    return backups[backups.length - 1];
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Recent Backups</h3>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-md"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Recent Backups</h3>
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          <p className="font-medium">Error loading backups</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const newestBackup = getNewestBackup();
  const oldestBackup = getOldestBackup();

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Recent Backups</h3>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          {newestBackup && (
            <div className="flex items-center gap-1">
              <span>↑</span>
              <span>Newest: {new Date(formatTimestamp(newestBackup.timestamp)).toLocaleString()}</span>
            </div>
          )}
          {oldestBackup && (
            <div className="flex items-center gap-1">
              <span>↓</span>
              <span>Oldest: {new Date(formatTimestamp(oldestBackup.timestamp)).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
      <div className="space-y-4">
        {backups.map((backup) => (
          <div key={backup.filename} className="border rounded-lg p-4 hover:bg-gray-50">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{backup.filename}</p>
                <p className="text-sm text-gray-500">
                  {new Date(formatTimestamp(backup.timestamp)).toLocaleString()}
                </p>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${
                backup.backupType === 'manual' 
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {backup.backupType}
              </span>
            </div>
            
            <div className="mt-3 grid grid-cols-3 gap-4">
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-xs text-gray-500">Tables</p>
                <p className="font-medium">{backup.tableCount}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-xs text-gray-500">Rows</p>
                <p className="font-medium">{backup.totalRows}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-xs text-gray-500">Size</p>
                <p className="font-medium">{formatBytes(backup.totalSize)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 