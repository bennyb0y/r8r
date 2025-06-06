'use client';

import { useState, useEffect } from 'react';
import MapboxComponent from './MapboxComponent';

interface Rating {
  id: string;
  restaurantName: string;
  itemTitle: string;
  rating: number; // Average of quality ratings (for display)
  quality: 'up' | 'neutral' | 'down'; // Thumbs system
  price: number;
  value: boolean; // Yes/No for good value
  reviewerName?: string;
  zipcode?: string;
  createdAt?: string;
  latitude?: number;
  longitude?: number;
}

interface TenantPageProps {
  tenantId: string;
}

// Tenant configurations
const TENANT_CONFIGS = {
  burritos: {
    emoji: '🌯',
    name: 'Burrito Reviews',
    itemName: 'burrito',
    itemNamePlural: 'burritos',
    bgColor: '#fef3e2',
    primaryColor: '#9a3412',
    secondaryColor: '#c2410c',
    accentColor: '#ea580c',
  },
  burgers: {
    emoji: '🍔',
    name: 'Burger Reviews', 
    itemName: 'burger',
    itemNamePlural: 'burgers',
    bgColor: '#fef7cd',
    primaryColor: '#92400e',
    secondaryColor: '#b45309',
    accentColor: '#d97706',
  },
  pizza: {
    emoji: '🍕',
    name: 'Pizza Reviews',
    itemName: 'slice',
    itemNamePlural: 'pizzas', 
    bgColor: '#fef2f2',
    primaryColor: '#991b1b',
    secondaryColor: '#dc2626',
    accentColor: '#ef4444',
  },
  coffee: {
    emoji: '☕',
    name: 'Coffee Reviews',
    itemName: 'coffee',
    itemNamePlural: 'coffees',
    bgColor: '#fef7ed',
    primaryColor: '#9a3412',
    secondaryColor: '#c2410c',
    accentColor: '#ea580c',
  },
  default: {
    emoji: '⭐',
    name: 'Reviews',
    itemName: 'item',
    itemNamePlural: 'items',
    bgColor: '#f8fafc',
    primaryColor: '#1e293b',
    secondaryColor: '#475569',
    accentColor: '#64748b',
  }
};

export default function TenantPage({ tenantId }: TenantPageProps) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'list' | 'map'>('list');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const config = TENANT_CONFIGS[tenantId as keyof typeof TENANT_CONFIGS] || TENANT_CONFIGS.default;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        console.log(`Fetching ${tenantId} data...`);
        
        const response = await fetch(`https://r8r-platform-api.bennyfischer.workers.dev/ratings?tenant=${tenantId}`, {
          headers: {
            'X-Tenant-ID': tenantId
          }
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Fetched ratings:', data.length);
        
        // Transform legacy data to new format and filter confirmed ratings
        const confirmedRatings = data
          .filter((rating: any) => 
            rating.id && rating.restaurantName && (rating.itemTitle || rating.burritoTitle)
          )
          .map((rating: any) => ({
            ...rating,
            // Handle legacy field name
            itemTitle: rating.itemTitle || rating.burritoTitle || 'Unknown Item',
            // Convert legacy numeric ratings to thumbs system
            quality: rating.quality || (rating.rating >= 4 ? 'up' : rating.rating <= 2 ? 'down' : 'neutral'),
            // Convert legacy value rating to boolean (>3 = good value)
            value: rating.value !== undefined ? rating.value : (rating.valueRating ? rating.valueRating > 3 : true),
            // Ensure price is a number
            price: rating.price || 0
          }));
        
        setRatings(confirmedRatings);
      } catch (err) {
        console.error('Error fetching ratings:', err);
        setError(err instanceof Error ? err.message : 'Failed to load ratings');
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, [tenantId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: config.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{config.emoji}</div>
          <div style={{ fontSize: '1.25rem', color: config.secondaryColor }}>Loading {config.itemNamePlural}...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: config.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
          <div style={{ fontSize: '1.25rem', color: '#dc2626', marginBottom: '0.5rem' }}>Error loading reviews</div>
          <div style={{ color: '#6b7280' }}>{error}</div>
        </div>
      </div>
    );
  }

  // Full-screen map view
  if (currentView === 'map') {
    return (
      <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
        {/* Compact header for map view */}
        <div style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${config.bgColor}`,
          padding: '0.75rem 1rem',
          pointerEvents: 'auto'
        }}>
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h1 style={{ fontSize: '1rem', fontWeight: 'bold', color: config.primaryColor, margin: 0 }}>
                {config.emoji} {config.name}
              </h1>
              <span style={{ fontSize: '0.75rem', color: config.secondaryColor }}>
                {ratings.length} reviews
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={() => setCurrentView('list')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: config.bgColor,
                  color: config.secondaryColor,
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}
              >
                <span style={{ marginRight: '0.25rem' }}>📋</span>
                List
              </button>
              <a 
                href="https://r8r.one" 
                style={{ 
                  color: config.accentColor, 
                  textDecoration: 'none',
                  fontSize: '0.75rem'
                }}
              >
                ← R8R
              </a>
            </div>
          </div>
        </div>

        {/* Full-screen map */}
        <div style={{ height: '100vh', width: '100vw', pointerEvents: 'auto' }}>
          <MapboxComponent 
            ratings={ratings} 
            config={config} 
            isMobile={isMobile}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: config.bgColor }}>
      {/* Mobile Top Navigation */}
      {isMobile && (
        <div style={{ 
          backgroundColor: 'white',
          borderBottom: `1px solid ${config.bgColor}`,
          padding: '1rem'
        }}>
          {/* Header */}
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: config.primaryColor, margin: 0 }}>
                {config.emoji} {config.name}
              </h1>
              <p style={{ fontSize: '0.875rem', color: config.secondaryColor, margin: 0 }}>
                {ratings.length} reviews found
              </p>
            </div>
            <a 
              href="https://r8r.one" 
              style={{ 
                color: config.accentColor, 
                textDecoration: 'none', 
                fontSize: '0.875rem'
              }}
            >
              ← R8R
            </a>
          </div>

          {/* View Toggle Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setCurrentView('list')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.75rem',
                backgroundColor: currentView === 'list' ? config.accentColor : config.bgColor,
                color: currentView === 'list' ? 'white' : config.secondaryColor,
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}
            >
              <span style={{ marginRight: '0.5rem' }}>📋</span>
              List
            </button>
            
            <button
              onClick={() => setCurrentView('map')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.75rem',
                backgroundColor: (currentView as string) === 'map' ? config.accentColor : config.bgColor,
                color: (currentView as string) === 'map' ? 'white' : config.secondaryColor,
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}
            >
              <span style={{ marginRight: '0.5rem' }}>🗺️</span>
              Map
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', minHeight: isMobile ? 'auto' : '100vh' }}>
        {/* Desktop Sidebar Navigation */}
        {!isMobile && (
          <div style={{ 
            width: '280px',
            backgroundColor: 'white', 
            borderRight: `1px solid ${config.bgColor}`,
            padding: '2rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            position: 'sticky',
            top: 0,
            height: '100vh'
          }}>
            {/* Logo/Header */}
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: config.primaryColor, marginBottom: '0.5rem' }}>
                {config.emoji} {config.name}
              </h1>
              <p style={{ fontSize: '0.875rem', color: config.secondaryColor }}>
                {ratings.length} reviews found
              </p>
            </div>

            {/* Navigation Menu */}
            <nav style={{ marginBottom: '2rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: config.secondaryColor, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  View Options
                </h3>
              </div>
              
              <button
                onClick={() => setCurrentView('list')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  padding: '0.75rem 1rem',
                  marginBottom: '0.5rem',
                  backgroundColor: currentView === 'list' ? config.bgColor : 'transparent',
                  color: currentView === 'list' ? config.primaryColor : config.secondaryColor,
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: currentView === 'list' ? '600' : '400',
                  textAlign: 'left'
                }}
              >
                <span style={{ marginRight: '0.75rem', fontSize: '1rem' }}>📋</span>
                List View
              </button>
              
              <button
                onClick={() => setCurrentView('map')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  padding: '0.75rem 1rem',
                  marginBottom: '0.5rem',
                  backgroundColor: (currentView as string) === 'map' ? config.bgColor : 'transparent',
                  color: (currentView as string) === 'map' ? config.primaryColor : config.secondaryColor,
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: (currentView as string) === 'map' ? '600' : '400',
                  textAlign: 'left'
                }}
              >
                <span style={{ marginRight: '0.75rem', fontSize: '1rem' }}>🗺️</span>
                Map View
              </button>
            </nav>

            {/* Back to Platform Link */}
            <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: `1px solid ${config.bgColor}` }}>
              <a 
                href="https://r8r.one" 
                style={{ 
                  color: config.accentColor, 
                  textDecoration: 'none', 
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <span style={{ marginRight: '0.5rem' }}>←</span>
                Back to R8R Platform
              </a>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div style={{ 
          flex: 1, 
          padding: isMobile ? '1rem' : '2rem',
          width: isMobile ? '100%' : 'auto'
        }}>
          {/* Desktop Header */}
          {!isMobile && (
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: config.primaryColor, marginBottom: '0.5rem' }}>
                Discover the best {config.itemNamePlural} in your area
              </h2>
              <p style={{ color: config.secondaryColor }}>
                {currentView === 'list' ? 'Browse all reviews in a detailed list format' : 'Explore reviews on an interactive map'}
              </p>
            </div>
          )}

          {/* Content based on current view */}
          {currentView === 'list' ? (
            // List View
            ratings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{config.emoji}</div>
                <div style={{ fontSize: '1.25rem', color: '#6b7280' }}>No reviews yet</div>
                <div style={{ color: '#9ca3af', marginTop: '0.5rem' }}>Be the first to review a {config.itemName}!</div>
              </div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(350px, 1fr))', 
                gap: '1.5rem' 
              }}>
                {ratings.map((rating) => (
                  <div
                    key={rating.id}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      padding: '1.5rem',
                      border: `1px solid ${config.bgColor}`,
                    }}
                  >
                    <div style={{ marginBottom: '1rem' }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.25rem' }}>
                        {rating.restaurantName}
                      </h3>
                      <p style={{ color: '#6b7280' }}>{rating.itemTitle}</p>
                    </div>
                    
                    {/* Quality and Price Row */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: isMobile ? 'flex-start' : 'center', 
                      marginBottom: '0.75rem',
                      flexDirection: isMobile ? 'column' : 'row',
                      gap: isMobile ? '0.75rem' : '1rem'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: isMobile ? '1.5rem' : '1rem',
                        flexWrap: 'wrap'
                      }}>
                        {/* Quality Rating */}
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.875rem', color: '#6b7280', marginRight: '0.5rem' }}>Quality:</span>
                          <span style={{ fontSize: '1.5rem' }}>
                            {rating.quality === 'up' ? '👍' : rating.quality === 'down' ? '👎' : '😐'}
                          </span>
                        </div>
                        
                        {/* Value Rating */}
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.875rem', color: '#6b7280', marginRight: '0.5rem' }}>Value:</span>
                          <span style={{ fontSize: '1rem', fontWeight: '600', color: rating.value ? '#059669' : '#dc2626' }}>
                            {rating.value ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Price */}
                      <div style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: '700', 
                        color: '#059669',
                        alignSelf: isMobile ? 'flex-end' : 'center'
                      }}>
                        ${rating.price?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                    
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {rating.reviewerName && (
                        <div>Reviewed by {rating.reviewerName}</div>
                      )}
                      {rating.zipcode && (
                        <div>📍 {rating.zipcode}</div>
                      )}
                      {rating.createdAt && (
                        <div>{new Date(rating.createdAt).toLocaleDateString()}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            // Map View
            <div style={{
              width: isMobile ? 'calc(100% + 2rem)' : 'auto',
              marginLeft: isMobile ? '-1rem' : '0',
              marginRight: isMobile ? '-1rem' : '0',
              marginTop: isMobile ? '-1rem' : '0'
            }}>
              <MapboxComponent 
                ratings={ratings} 
                config={config} 
                isMobile={isMobile}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}