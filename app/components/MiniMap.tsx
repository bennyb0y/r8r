'use client';

import React, { useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Libraries } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%'
};

// Custom CSS to hide Google attribution and terms
const mapContainerClassName = "google-map-no-attribution";

const libraries = ['places'];

interface MiniMapProps {
  latitude: number;
  longitude: number;
  rating: number;
  restaurantName: string;
  burritoTitle: string;
}

const MiniMap: React.FC<MiniMapProps> = ({ latitude, longitude, rating, restaurantName, burritoTitle }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: libraries as Libraries
  });

  const getRatingColor = (rating: number, isStroke = false) => {
    const colors = {
      1: isStroke ? '#DC2626' : '#FEE2E2',
      2: isStroke ? '#F97316' : '#FEF3C7',
      3: isStroke ? '#EAB308' : '#FEF9C3',
      4: isStroke ? '#22C55E' : '#DCFCE7',
      5: isStroke ? '#16A34A' : '#BBF7D0',
    };
    const roundedRating = Math.round(rating);
    return colors[roundedRating as keyof typeof colors] || colors[3];
  };

  useEffect(() => {
    if (loadError) {
      console.error('Error loading Google Maps:', loadError);
    }
  }, [loadError]);

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
        <div className="text-center">
          <p className="text-sm text-gray-500">Map unavailable</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  try {
    return (
      <div className="relative w-full h-full rounded-lg overflow-hidden">
        <style jsx global>{`
          .google-map-no-attribution .gmnoprint,
          .google-map-no-attribution .gm-style-cc,
          .google-map-no-attribution a[href^="https://maps.google.com/maps"],
          .google-map-no-attribution .gm-style a img {
            display: none !important;
          }
        `}</style>
        <GoogleMap
          mapContainerStyle={containerStyle}
          mapContainerClassName={mapContainerClassName}
          center={{ lat: latitude, lng: longitude }}
          zoom={15}
          options={{
            disableDefaultUI: true,
            zoomControl: false,
            mapTypeControl: false,
            scaleControl: false,
            streetViewControl: false,
            rotateControl: false,
            fullscreenControl: false,
            gestureHandling: 'none',
            clickableIcons: false,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              },
              {
                featureType: 'transit',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              },
              {
                featureType: 'administrative.land_parcel',
                stylers: [{ visibility: 'off' }]
              },
              {
                featureType: 'administrative.neighborhood',
                stylers: [{ visibility: 'off' }]
              }
            ]
          }}
        >
          <Marker
            position={{ lat: latitude, lng: longitude }}
            title={`${restaurantName}: ${burritoTitle}`}
            label={{
              text: '🌯',
              fontSize: '24px',
              className: 'marker-label'
            }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 16,
              fillColor: getRatingColor(rating),
              fillOpacity: 0.7,
              strokeWeight: 2,
              strokeColor: getRatingColor(rating, true)
            } as google.maps.Symbol}
          />
        </GoogleMap>
      </div>
    );
  } catch (error) {
    console.error('Error rendering map:', error);
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
        <div className="text-center">
          <p className="text-sm text-gray-500">Map unavailable</p>
        </div>
      </div>
    );
  }
};

export default MiniMap; 