'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Rating {
  id: string;
  restaurantName: string;
  itemTitle: string;
  quality: 'up' | 'neutral' | 'down';
  value: boolean;
  price: number;
  reviewerName?: string;
  zipcode?: string;
  createdAt?: string;
  latitude?: number;
  longitude?: number;
}

interface TenantConfig {
  emoji: string;
  name: string;
  itemName: string;
  itemNamePlural: string;
  bgColor: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

interface MapboxComponentProps {
  ratings: Rating[];
  config: TenantConfig;
  isMobile: boolean;
}

export default function MapboxComponent({ ratings, config, isMobile }: MapboxComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const currentPopup = useRef<mapboxgl.Popup | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Set Mapbox access token
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

    if (!mapboxgl.accessToken) {
      console.error('Mapbox access token is required');
      return;
    }

    // Choose map style based on tenant theme
    const getMapStyle = () => {
      // Use tenant primary color to determine best map style
      const primaryColor = config.primaryColor;
      
      if (primaryColor.includes('#9a3412') || primaryColor.includes('#92400e')) {
        // Warm colors (burritos, burgers) - use satellite streets for food vibes
        return 'mapbox://styles/mapbox/satellite-streets-v11';
      } else if (primaryColor.includes('#991b1b')) {
        // Red colors (pizza) - use dark for dramatic effect
        return 'mapbox://styles/mapbox/dark-v10';
      } else {
        // Default and others - use standard streets
        return 'mapbox://styles/mapbox/streets-v11';
      }
    };

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: getMapStyle(),
      center: [-122.4194, 37.7749], // Default to San Francisco
      zoom: 10,
      attributionControl: false
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Wait for map to load
    map.current.on('load', () => {
      setMapLoaded(true);
    });

    // Close popup when clicking on map (but not on markers)
    map.current.on('click', (e) => {
      // Only close if we didn't click on a marker
      if (!e.originalEvent.defaultPrevented && currentPopup.current) {
        currentPopup.current.remove();
        currentPopup.current = null;
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [config.primaryColor]);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Close any existing popup and clear reference
    if (currentPopup.current) {
      currentPopup.current.remove();
      currentPopup.current = null;
    }

    // Clear existing markers
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Filter ratings with valid coordinates
    const ratingsWithCoords = ratings.filter(rating => 
      rating.latitude && rating.longitude && 
      !isNaN(rating.latitude) && !isNaN(rating.longitude)
    );

    if (ratingsWithCoords.length === 0) {
      // No valid coordinates, keep default view
      return;
    }

    // Add markers for each rating
    ratingsWithCoords.forEach((rating) => {
      if (!rating.latitude || !rating.longitude) return;

      // Create custom marker element
      const markerElement = document.createElement('div');
      markerElement.className = 'custom-marker';
      markerElement.style.width = '30px';
      markerElement.style.height = '30px';
      markerElement.style.borderRadius = '50%';
      markerElement.style.cursor = 'pointer';
      markerElement.style.display = 'flex';
      markerElement.style.alignItems = 'center';
      markerElement.style.justifyContent = 'center';
      markerElement.style.fontSize = '16px';
      markerElement.style.fontWeight = 'bold';
      markerElement.style.color = 'white';
      markerElement.style.border = '2px solid white';
      markerElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      markerElement.style.pointerEvents = 'auto';
      markerElement.style.zIndex = '500';
      markerElement.style.transition = 'opacity 0.2s ease, box-shadow 0.2s ease';
      
      // Add hover effects without transform
      markerElement.onmouseenter = () => {
        markerElement.style.opacity = '0.8';
        markerElement.style.boxShadow = '0 4px 8px rgba(0,0,0,0.5)';
      };
      markerElement.onmouseleave = () => {
        markerElement.style.opacity = '1';
        markerElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      };
      
      // Color based on quality rating
      if (rating.quality === 'up') {
        markerElement.style.backgroundColor = '#059669'; // Green
        markerElement.textContent = '👍';
      } else if (rating.quality === 'down') {
        markerElement.style.backgroundColor = '#dc2626'; // Red  
        markerElement.textContent = '👎';
      } else {
        markerElement.style.backgroundColor = '#6b7280'; // Gray
        markerElement.textContent = '😐';
      }

      // Create popup content
      const popupContent = `
        <div style="padding: 0.5rem; min-width: 200px;">
          <h3 style="margin: 0 0 0.5rem 0; font-size: 1rem; font-weight: 600; color: ${config.primaryColor};">
            ${rating.restaurantName}
          </h3>
          <p style="margin: 0 0 0.5rem 0; color: #6b7280; font-size: 0.875rem;">
            ${rating.itemTitle}
          </p>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 1rem;">
              <div style="display: flex; align-items: center;">
                <span style="font-size: 0.75rem; color: #6b7280; margin-right: 0.25rem;">Quality:</span>
                <span style="font-size: 1.25rem;">
                  ${rating.quality === 'up' ? '👍' : rating.quality === 'down' ? '👎' : '😐'}
                </span>
              </div>
              <div style="display: flex; align-items: center;">
                <span style="font-size: 0.75rem; color: #6b7280; margin-right: 0.25rem;">Value:</span>
                <span style="font-size: 0.875rem; font-weight: 600; color: ${rating.value ? '#059669' : '#dc2626'};">
                  ${rating.value ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
            <div style="font-size: 1rem; font-weight: 700; color: #059669;">
              $${rating.price?.toFixed(2) || '0.00'}
            </div>
          </div>
          ${rating.reviewerName ? `<p style="margin: 0; font-size: 0.75rem; color: #9ca3af;">By ${rating.reviewerName}</p>` : ''}
        </div>
      `;

      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: true,
        closeOnMove: true,
        className: 'custom-popup'
      }).setHTML(popupContent);

      // Create marker 
      new mapboxgl.Marker(markerElement)
        .setLngLat([rating.longitude, rating.latitude])
        .addTo(map.current!);

      // Add multiple event listeners to ensure click is captured
      const handleClick = (e: Event) => {
        e.stopPropagation();
        e.preventDefault();
        
        // Close any existing popup
        if (currentPopup.current) {
          currentPopup.current.remove();
          currentPopup.current = null;
        }
        
        // Open new popup and store reference
        if (rating.longitude && rating.latitude) {
          popup.setLngLat([rating.longitude, rating.latitude]);
          popup.addTo(map.current!);
          currentPopup.current = popup;
        }
      };

      markerElement.onclick = handleClick;
      markerElement.addEventListener('click', handleClick);
      markerElement.addEventListener('mousedown', handleClick);
      markerElement.addEventListener('touchstart', handleClick);
    });

    // Fit map to show all markers
    if (ratingsWithCoords.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      ratingsWithCoords.forEach(rating => {
        if (rating.latitude && rating.longitude) {
          bounds.extend([rating.longitude, rating.latitude]);
        }
      });
      
      map.current.fitBounds(bounds, {
        padding: isMobile ? 20 : 50,
        maxZoom: 15
      });
    } else if (ratingsWithCoords.length === 1) {
      const rating = ratingsWithCoords[0];
      if (rating.latitude && rating.longitude) {
        map.current.setCenter([rating.longitude, rating.latitude]);
        map.current.setZoom(13);
      }
    }
  }, [ratings, mapLoaded, config, isMobile]);

  if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
    return (
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: isMobile ? '0' : '0.5rem', 
        padding: isMobile ? '2rem 1rem' : '2rem', 
        textAlign: 'center',
        border: isMobile ? 'none' : `1px solid ${config.bgColor}`,
        minHeight: isMobile ? 'calc(100vh - 200px)' : '500px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🗺️</div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: config.primaryColor, marginBottom: '0.5rem' }}>
          Map Configuration Required
        </h3>
        <p style={{ color: config.secondaryColor, marginBottom: '1rem' }}>
          Mapbox access token needed for interactive maps
        </p>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        .mapboxgl-popup {
          z-index: 1001 !important;
          max-width: 300px !important;
        }
        .mapboxgl-popup-content {
          z-index: 1001 !important;
          position: relative !important;
          background: white !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
          padding: 0 !important;
        }
        .mapboxgl-popup-tip {
          z-index: 1001 !important;
          border-top-color: white !important;
        }
        .mapboxgl-popup-close-button {
          z-index: 1002 !important;
          color: #666 !important;
          font-size: 16px !important;
          right: 8px !important;
          top: 8px !important;
        }
        .custom-popup {
          z-index: 1001 !important;
        }
      `}</style>
      <div 
        ref={mapContainer}
        style={{ 
          width: '100%',
          height: '100%',
          borderRadius: '0',
          border: 'none',
          position: 'relative'
        }}
      />
    </>
  );
}