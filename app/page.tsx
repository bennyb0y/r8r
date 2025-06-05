'use client';

import React, { useState, useEffect } from 'react';
import Map from './components/Map';
import DevelopmentNotice from './components/DevelopmentNotice';
import { useTenant } from './contexts/TenantContext';
import PlatformLanding from './platform/page';


export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mapError, setMapError] = useState<boolean>(false);
  const [isPlatformDomain, setIsPlatformDomain] = useState(false);
  const { tenant, tenantConfig, isLoading, error } = useTenant();

  // Check if we're on the main platform domain
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const isMainPlatform = 
        hostname === 'r8r.one' || 
        hostname === 'www.r8r.one' ||
        (hostname.includes('.pages.dev') && !hostname.includes('burritos')) ||
        hostname.includes('localhost');
      setIsPlatformDomain(isMainPlatform);
    }
  }, []);

  // Set up refresh and event listeners (only for tenant pages)
  useEffect(() => {
    if (isPlatformDomain) return; // Skip for platform landing page

    // Set up periodic refresh (every 5 minutes)
    const intervalId = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 300000);

    // Listen for admin actions (now tenant-aware)
    const handleAdminAction = () => {
      setRefreshTrigger(prev => prev + 1);
    };

    // Subscribe to admin actions
    window.addEventListener('rating-updated', handleAdminAction);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('rating-updated', handleAdminAction);
    };
  }, [isPlatformDomain]);

  // If this is the main platform domain, show the landing page
  if (isPlatformDomain) {
    return <PlatformLanding />;
  }

  // Show loading state while tenant is being resolved
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading community...</p>
        </div>
      </div>
    );
  }

  // Show error state if tenant couldn't be loaded
  if (error || !tenant) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Community Not Found</h2>
          <p className="text-gray-600 mb-4">
            {error || 'This community does not exist or is not available.'}
          </p>
          <a
            href="https://r8r.one"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors inline-block"
          >
            Back to R8R Platform
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full h-[calc(100vh-4rem)]">
      <DevelopmentNotice />
      {!mapError ? (
        <Map refreshTrigger={refreshTrigger} />
      ) : (
        <div className="flex items-center justify-center h-full bg-gray-100">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Map Unavailable</h2>
            <p className="text-gray-600 mb-4">There was an error loading the map for {tenant.name}.</p>
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
