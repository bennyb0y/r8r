'use client';

import React from 'react';
import Link from 'next/link';

export default function UserGuidePage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-blue-600 mb-6">Burrito Rater User Guide</h1>
        
        <div className="space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Welcome to Burrito Rater!</h2>
            <p className="text-gray-700 mb-4">
              Burrito Rater helps you discover and rate the best breakfast burritos in your area. 
              This guide will walk you through the main features of the application.
            </p>
          </section>

          {/* Map View */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Map View</h2>
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h3 className="text-lg font-medium text-blue-800 mb-2">Finding Restaurants</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Use the search box at the top left to find restaurants</li>
                <li>Click on a location to see details and add a rating</li>
                <li>Existing ratings appear as colored circles with a burrito icon</li>
                <li>The color indicates the overall rating (red = low, green = high)</li>
              </ol>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-blue-800 mb-2">Adding a Rating</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Search for a restaurant or click on the map</li>
                <li>Click the &ldquo;Rate a Burrito Here&rdquo; button</li>
                <li>Fill out the rating form with your experience</li>
                <li>Click &ldquo;Submit Rating&rdquo; to share your review</li>
              </ol>
            </div>
          </section>

          {/* List View */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">List View</h2>
            <div className="bg-green-50 p-4 rounded-lg mb-4">
              <h3 className="text-lg font-medium text-green-800 mb-2">Browsing Ratings</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>View all ratings in a convenient list format</li>
                <li>Each entry shows the restaurant, burrito name, and rating</li>
                <li>Click &ldquo;View on Map&rdquo; to see the location on the map</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-green-800 mb-2">Filtering and Sorting</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Filter by zipcode to find burritos in your area</li>
                <li>Sort by rating or price to find the best or most affordable options</li>
                <li>Toggle between high-to-low and low-to-high sorting</li>
              </ul>
            </div>
          </section>

          {/* Rating System */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Rating System</h2>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-yellow-800 mb-2">Understanding Ratings</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>Overall Rating:</strong> General score from 1-5</li>
                <li><strong>Taste:</strong> How delicious the burrito is</li>
                <li><strong>Value:</strong> Quality relative to price</li>
                <li><strong>Price:</strong> Actual cost in dollars</li>
                <li><strong>Ingredients:</strong> What&apos;s inside the burrito (potatoes, cheese, etc.)</li>
              </ul>
            </div>
          </section>

          {/* Tips */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Tips and Tricks</h2>
            <div className="bg-purple-50 p-4 rounded-lg">
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Click on burrito markers to see detailed ratings</li>
                <li>Add your name and choose an emoji to personalize your ratings</li>
                <li>Some locations may have multiple ratings - use the navigation arrows to browse them</li>
                <li>The map automatically updates when new ratings are added</li>
              </ul>
            </div>
          </section>
        </div>

        <div className="mt-10 flex justify-center">
          <Link 
            href="/"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Rating Burritos!
          </Link>
        </div>
      </div>
    </div>
  );
} 