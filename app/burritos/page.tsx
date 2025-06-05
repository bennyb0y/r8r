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

export default function BurritosPage() {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        console.log('Fetching burritos data...');
        
        // Direct API call to worker with explicit burritos tenant
        const response = await fetch('https://r8r-platform-api.bennyfischer.workers.dev/ratings?tenant=burritos', {
          headers: {
            'X-Tenant-ID': 'burritos'
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
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🌯</div>
          <div className="text-xl text-gray-700">Loading burrito reviews...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <div className="text-xl text-red-600 mb-2">Error loading reviews</div>
          <div className="text-gray-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-orange-900 mb-2">
            🌯 Burrito Reviews
          </h1>
          <p className="text-xl text-orange-700">
            Discover the best burritos in your area
          </p>
          <div className="mt-4 text-lg font-semibold text-orange-800">
            {ratings.length} reviews found
          </div>
        </div>

        {/* Reviews List */}
        {ratings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🌯</div>
            <div className="text-xl text-gray-600">No reviews yet</div>
            <div className="text-gray-500 mt-2">Be the first to review a burrito!</div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ratings.map((rating) => (
              <div
                key={rating.id}
                className="bg-white rounded-lg shadow-md p-6 border border-orange-200"
              >
                <div className="mb-4">
                  <h3 className="font-bold text-lg text-gray-900">
                    {rating.restaurantName}
                  </h3>
                  <p className="text-gray-600">{rating.burritoTitle}</p>
                </div>
                
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center">
                    <span className="text-2xl font-bold text-orange-600">
                      {rating.rating}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">/5</span>
                  </div>
                  <div className="text-lg font-semibold text-green-600">
                    ${rating.price?.toFixed(2)}
                  </div>
                </div>
                
                <div className="text-sm text-gray-500">
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
        
        {/* Simple Footer */}
        <div className="text-center mt-12 pt-8 border-t border-orange-200">
          <p className="text-gray-600">
            <a href="https://r8r.one" className="text-orange-600 hover:text-orange-800">
              ← Back to R8R Platform
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}