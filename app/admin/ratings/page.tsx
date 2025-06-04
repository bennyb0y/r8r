'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, Table, TableRow, TableCell, TableHead, TableHeaderCell, TableBody } from '@tremor/react';

interface Rating {
  id: number;
  restaurantName: string;
  burritoTitle: string;
  rating: number;
  taste: number;
  value: number;
  price: number;
  reviewerName: string;
  reviewerEmoji?: string;
  review?: string;
  confirmed: number;
  createdAt: string;
  zipcode?: string;
  hasPotatoes: boolean;
  hasCheese: boolean;
  hasBacon: boolean;
  hasChorizo: boolean;
  hasAvocado: boolean;
  hasVegetables: boolean;
  image?: string;
}

export default function RatingsPage() {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState<Rating | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'confirmed' | 'unconfirmed'>('all');
  const [zipcodeFilter, setZipcodeFilter] = useState<string>('');
  const [uniqueZipcodes, setUniqueZipcodes] = useState<string[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Add periodic refresh
  useEffect(() => {
    // Set up periodic refresh (every 5 minutes)
    const intervalId = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 300000);

    // Listen for rating submissions
    const handleNewRating = () => {
      setRefreshTrigger(prev => prev + 1);
    };

    // Subscribe to rating submissions
    window.addEventListener('burrito-rating-submitted', handleNewRating);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('burrito-rating-submitted', handleNewRating);
    };
  }, []);

  const notifyRatingUpdate = () => {
    window.dispatchEvent(new Event('burrito-rating-updated'));
  };

  const fetchRatings = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/ratings`);
      if (!response.ok) {
        throw new Error('Failed to fetch ratings');
      }
      const data = await response.json();
      
      // Extract unique zipcodes
      const zipcodes = data
        .map((rating: Rating) => rating.zipcode)
        .filter((zipcode: string | undefined) => zipcode && zipcode.trim() !== '')
        .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index)
        .sort();
      setUniqueZipcodes(zipcodes);

      // Filter ratings based on status
      let filteredRatings = data;
      if (filterStatus === 'confirmed') {
        filteredRatings = data.filter((rating: Rating) => rating.confirmed === 1);
      } else if (filterStatus === 'unconfirmed') {
        filteredRatings = data.filter((rating: Rating) => rating.confirmed !== 1);
      }
      
      setRatings(filteredRatings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ratings');
      console.error('Error fetching ratings:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings, refreshTrigger]);

  const handleConfirm = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/ratings/${id}/confirm`, {
        method: 'PUT',
      });
      if (!response.ok) {
        throw new Error('Failed to confirm rating');
      }
      setRatings(prevRatings =>
        prevRatings.map(rating =>
          rating.id === id ? { ...rating, confirmed: 1 } : rating
        )
      );
      setRefreshTrigger(prev => prev + 1);
      notifyRatingUpdate();
    } catch (err) {
      console.error('Error confirming rating:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this rating?')) {
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/ratings/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete rating');
      }
      setRatings(prevRatings => prevRatings.filter(rating => rating.id !== id));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setRefreshTrigger(prev => prev + 1);
      notifyRatingUpdate();
    } catch (err) {
      console.error('Error deleting rating:', err);
    }
  };

  const handleConfirmSelected = async () => {
    if (selectedIds.size === 0) {
      alert('Please select items to confirm');
      return;
    }

    setIsConfirming(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/ratings/confirm-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to confirm ratings');
      }
      
      setRatings(prevRatings => 
        prevRatings.map(rating => 
          selectedIds.has(rating.id) ? { ...rating, confirmed: 1 } : rating
        )
      );
      setSelectedIds(new Set());
      setRefreshTrigger(prev => prev + 1);
      notifyRatingUpdate();
    } catch (err) {
      console.error('Error confirming ratings:', err);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) {
      alert('Please select items to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} rating(s)?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const deletePromises = Array.from(selectedIds).map(id =>
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/ratings/${id}`, {
          method: 'DELETE',
        })
      );

      await Promise.all(deletePromises);
      setRatings(prevRatings => prevRatings.filter(rating => !selectedIds.has(rating.id)));
      setSelectedIds(new Set());
      setRefreshTrigger(prev => prev + 1);
      notifyRatingUpdate();
    } catch (err) {
      console.error('Error deleting ratings:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === ratings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(ratings.map(r => r.id)));
    }
  };

  const renderIngredientBadge = (hasIngredient: boolean, name: string) => {
    return hasIngredient ? (
      <span className="px-2 py-1 mr-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
        {name}
      </span>
    ) : null;
  };

  // Apply filters
  const filteredRatings = ratings.filter(rating => 
    !zipcodeFilter || rating.zipcode === zipcodeFilter
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-red-600 p-4">Error: {error}</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-2">
        <div className="flex justify-between items-center py-2">
          <h1 className="text-lg font-bold text-black">Ratings Management</h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-xs text-black">Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'confirmed' | 'unconfirmed')}
                className="text-xs border border-gray-300 rounded px-1 py-0.5 text-black"
              >
                <option value="all">All</option>
                <option value="confirmed">Confirmed</option>
                <option value="unconfirmed">Unconfirmed</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-black">Zip:</span>
              <select
                value={zipcodeFilter}
                onChange={(e) => setZipcodeFilter(e.target.value)}
                className="text-xs border border-gray-300 rounded px-1 py-0.5 text-black w-20"
              >
                <option value="">All</option>
                {uniqueZipcodes.map(zipcode => (
                  <option key={zipcode} value={zipcode}>{zipcode}</option>
                ))}
              </select>
            </div>
            <div className="text-xs text-black">
              {filteredRatings.length} found
            </div>
          </div>
        </div>

        <div className="flex gap-1">
          <button
            onClick={handleConfirmSelected}
            disabled={selectedIds.size === 0 || isConfirming}
            className={`px-2 py-0.5 text-xs rounded ${
              selectedIds.size === 0 || isConfirming
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isConfirming ? 'Confirming...' : `Confirm (${selectedIds.size})`}
          </button>
          <button
            onClick={handleDeleteSelected}
            disabled={selectedIds.size === 0 || isDeleting}
            className={`px-2 py-0.5 text-xs rounded ${
              selectedIds.size === 0 || isDeleting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {isDeleting ? 'Deleting...' : `Delete (${selectedIds.size})`}
          </button>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHead>
                <TableRow className="text-black text-xs bg-gray-50">
                  <TableHeaderCell className="w-4 py-1">
                    <input
                      type="checkbox"
                      checked={selectedIds.size > 0 && selectedIds.size === filteredRatings.length}
                      onChange={handleSelectAll}
                      className="h-3 w-3"
                    />
                  </TableHeaderCell>
                  <TableHeaderCell className="text-black text-xs py-1">ID</TableHeaderCell>
                  <TableHeaderCell className="text-black text-xs py-1">📷</TableHeaderCell>
                  <TableHeaderCell className="text-black text-xs py-1">Restaurant</TableHeaderCell>
                  <TableHeaderCell className="text-black text-xs py-1">Burrito</TableHeaderCell>
                  <TableHeaderCell className="text-black text-xs py-1">Rating</TableHeaderCell>
                  <TableHeaderCell className="text-black text-xs py-1">Price</TableHeaderCell>
                  <TableHeaderCell className="text-black text-xs py-1">Reviewer</TableHeaderCell>
                  <TableHeaderCell className="text-black text-xs py-1">Status</TableHeaderCell>
                  <TableHeaderCell className="text-black text-xs py-1">Date</TableHeaderCell>
                  <TableHeaderCell className="text-black text-xs py-1">Actions</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRatings.map((rating) => (
                  <TableRow key={rating.id} className="text-black text-xs hover:bg-gray-50">
                    <TableCell className="w-4 py-1">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(rating.id)}
                        onChange={() => handleToggleSelect(rating.id)}
                        className="h-3 w-3"
                      />
                    </TableCell>
                    <TableCell className="text-black text-xs py-1">{rating.id}</TableCell>
                    <TableCell className="text-black text-xs py-1">
                      {rating.image && (
                        <button
                          onClick={() => setSelectedRating(rating)}
                          className="hover:opacity-70 transition-opacity"
                        >
                          📷
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="text-black text-xs py-1">{rating.restaurantName}</TableCell>
                    <TableCell className="text-black text-xs py-1">{rating.burritoTitle}</TableCell>
                    <TableCell className="text-black text-xs py-1">
                      {rating.rating.toFixed(1)} ({rating.taste.toFixed(1)}/{rating.value.toFixed(1)})
                    </TableCell>
                    <TableCell className="text-black text-xs py-1">${rating.price.toFixed(2)}</TableCell>
                    <TableCell className="text-black text-xs py-1">
                      {rating.reviewerEmoji} {rating.reviewerName || 'Anonymous'}
                    </TableCell>
                    <TableCell className="py-1">
                      <span
                        className={`inline-flex items-center px-1 py-0.5 rounded-full text-[10px] font-medium ${
                          rating.confirmed
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {rating.confirmed ? 'Confirmed' : 'Pending'}
                      </span>
                    </TableCell>
                    <TableCell className="text-black text-xs py-1">{new Date(rating.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="py-1">
                      <div className="flex gap-1 text-[10px]">
                        <button
                          onClick={() => setSelectedRating(rating)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        {!rating.confirmed && (
                          <button
                            onClick={() => handleConfirm(rating.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Confirm
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(rating.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Rating Details Modal */}
        {selectedRating && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold text-black">Rating Details</h2>
                  <button
                    onClick={() => setSelectedRating(null)}
                    className="text-black hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-black mb-2">{selectedRating.restaurantName}</h3>
                      <p className="text-black">{selectedRating.burritoTitle}</p>
                    </div>
                    
                    <div>
                      <div className="flex items-center mb-2">
                        <span className="font-semibold text-black mr-2">Overall:</span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {selectedRating.rating.toFixed(1)}/5
                        </span>
                      </div>
                      <div className="flex items-center mb-2">
                        <span className="font-semibold text-black mr-2">Taste:</span>
                        <span className="text-black">{selectedRating.taste.toFixed(1)}/5</span>
                      </div>
                      <div className="flex items-center mb-2">
                        <span className="font-semibold text-black mr-2">Value:</span>
                        <span className="text-black">{selectedRating.value.toFixed(1)}/5</span>
                      </div>
                      <div className="flex items-center mb-2">
                        <span className="font-semibold text-black mr-2">Price:</span>
                        <span className="text-black">${selectedRating.price.toFixed(2)}</span>
                      </div>
                    </div>

                    <div>
                      <span className="font-semibold text-black block mb-1">Reviewer:</span>
                      <div className="flex items-center">
                        <span className="text-black">{selectedRating.reviewerName || 'Anonymous'}</span>
                        {selectedRating.reviewerEmoji && (
                          <span className="ml-2 text-2xl">{selectedRating.reviewerEmoji}</span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <span className="font-semibold text-black block mb-1">Date:</span>
                      <span className="text-black">{new Date(selectedRating.createdAt).toLocaleString()}</span>
                    </div>
                    
                    <div>
                      <span className="font-semibold text-black block mb-1">Status:</span>
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          selectedRating.confirmed
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {selectedRating.confirmed ? 'Confirmed' : 'Unconfirmed'}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    {selectedRating.image && (
                      <div>
                        <span className="font-semibold text-black block mb-1">Burrito Photo:</span>
                        <div className="relative w-full aspect-[4/3] rounded-lg shadow-md overflow-hidden">
                          <img 
                            src={`https://images.benny.com/cdn-cgi/image/width=800,height=600,format=webp,quality=80/${selectedRating.image.replace('/images/', '')}`}
                            alt={`${selectedRating.burritoTitle} at ${selectedRating.restaurantName}`}
                            className="absolute inset-0 w-full h-full object-contain bg-gray-50"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {selectedRating.review && (
                  <div className="mb-4">
                    <span className="font-semibold text-black block mb-1">Review:</span>
                    <p className="text-black bg-gray-50 p-3 rounded">{selectedRating.review}</p>
                  </div>
                )}
                
                <div className="mb-4">
                  <span className="font-semibold text-black block mb-2">Ingredients:</span>
                  <div className="flex flex-wrap gap-2">
                    {renderIngredientBadge(selectedRating.hasPotatoes, 'Potatoes')}
                    {renderIngredientBadge(selectedRating.hasCheese, 'Cheese')}
                    {renderIngredientBadge(selectedRating.hasBacon, 'Bacon')}
                    {renderIngredientBadge(selectedRating.hasChorizo, 'Chorizo')}
                    {renderIngredientBadge(selectedRating.hasAvocado, 'Avocado')}
                    {renderIngredientBadge(selectedRating.hasVegetables, 'Vegetables')}
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    onClick={() => setSelectedRating(null)}
                    className="px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300 text-xs"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleDelete(selectedRating.id);
                      setSelectedRating(null);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                  >
                    Delete
                  </button>
                  {!selectedRating.confirmed && (
                    <button
                      onClick={() => {
                        handleConfirm(selectedRating.id);
                        setSelectedRating(null);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                    >
                      Confirm
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 