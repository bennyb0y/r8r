'use client';

import { useState, useEffect } from 'react';

interface Rating {
  id: string;
  restaurantName: string;
  burritoTitle: string;
  rating: number;
  price: number;
  reviewerName?: string;
  zipcode?: string;
  createdAt?: string;
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
    itemName: 'pizza',
    itemNamePlural: 'pizzas', 
    bgColor: '#fef2f2',
    primaryColor: '#991b1b',
    secondaryColor: '#dc2626',
    accentColor: '#ef4444',
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

  const config = TENANT_CONFIGS[tenantId as keyof typeof TENANT_CONFIGS] || TENANT_CONFIGS.default;

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
        
        // Filter confirmed ratings only
        const confirmedRatings = data.filter((rating: Rating) => 
          rating.id && rating.restaurantName && rating.burritoTitle
        );
        
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: config.bgColor }}>
      <div style={{ maxWidth: '96rem', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: config.primaryColor, marginBottom: '0.5rem' }}>
            {config.emoji} {config.name}
          </h1>
          <p style={{ fontSize: '1.25rem', color: config.secondaryColor, marginBottom: '1rem' }}>
            Discover the best {config.itemNamePlural} in your area
          </p>
          <div style={{ fontSize: '1.125rem', fontWeight: '600', color: config.accentColor }}>
            {ratings.length} reviews found
          </div>
        </div>

        {/* Reviews List */}
        {ratings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{config.emoji}</div>
            <div style={{ fontSize: '1.25rem', color: '#6b7280' }}>No reviews yet</div>
            <div style={{ color: '#9ca3af', marginTop: '0.5rem' }}>Be the first to review a {config.itemName}!</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
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
                  <p style={{ color: '#6b7280' }}>{rating.burritoTitle}</p>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: config.accentColor }}>
                      {rating.rating}
                    </span>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280', marginLeft: '0.25rem' }}>/5</span>
                  </div>
                  <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#059669' }}>
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
        )}
        
        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '3rem', paddingTop: '2rem', borderTop: `1px solid ${config.bgColor}` }}>
          <p style={{ color: '#6b7280' }}>
            <a href="https://r8r.one" style={{ color: config.accentColor, textDecoration: 'none' }}>
              ← Back to R8R Platform
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}