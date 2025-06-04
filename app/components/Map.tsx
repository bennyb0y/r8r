'use client';

import React from 'react';
import dynamic from 'next/dynamic';

interface MapProps {
  refreshTrigger?: number;
}

const MapComponent = dynamic(() => import('./MapComponent'), {
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
    </div>
  ),
  ssr: false
});

export default function Map({ refreshTrigger = 0 }: MapProps) {
  return (
    <div className="h-screen w-full">
      <MapComponent refreshTrigger={refreshTrigger} />
    </div>
  );
} 