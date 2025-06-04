'use client';

import React, { useState, useEffect } from 'react';
import Map from './components/Map';

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mapError, setMapError] = useState<boolean>(false);
  
  useEffect(() => {
    // Set up periodic refresh (every 5 minutes)
    const intervalId = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 300000);

    // Listen for admin actions
    const handleAdminAction = () => {
      setRefreshTrigger(prev => prev + 1);
    };

    // Subscribe to admin actions
    window.addEventListener('burrito-rating-updated', handleAdminAction);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('burrito-rating-updated', handleAdminAction);
    };
  }, []);

  return (
    <div className="flex-1 w-full h-[calc(100vh-4rem)]">
      {!mapError ? (
        <Map refreshTrigger={refreshTrigger} />
      ) : (
        <div className="flex items-center justify-center h-full bg-gray-100">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Map Unavailable</h2>
            <p className="text-gray-600 mb-4">There was an error loading the map.</p>
            <button
              onClick={() => setMapError(false)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
