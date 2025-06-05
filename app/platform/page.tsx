'use client';


'use client';

import React from 'react';
import Link from 'next/link';


export default function PlatformLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-blue-600">R8R Platform</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/create-community"
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Create Community
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
            Create Your Own
            <span className="text-blue-600"> Rating Community</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Build a custom rating site for any category. From burritos to pizza, coffee to books - 
            create a community where people can discover and rate the best of anything.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/create-community"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Start Your Community
            </Link>
            
            <Link
              href="#examples"
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-50 transition-colors"
            >
              See Examples
            </Link>
          </div>
        </div>

        {/* Examples Section */}
        <div id="examples" className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">🌯</div>
            <h3 className="text-xl font-semibold mb-2">Food Communities</h3>
            <p className="text-gray-600 mb-4">Rate burritos, pizza, coffee shops, restaurants</p>
            <a
              href="https://burritos.r8r.one"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Visit burritos.r8r.one →
            </a>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">🎬</div>
            <h3 className="text-xl font-semibold mb-2">Entertainment</h3>
            <p className="text-gray-600 mb-4">Movies, books, games, streaming shows</p>
            <a
              href="https://movies.r8r.one"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Visit movies.r8r.one →
            </a>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">🏢</div>
            <h3 className="text-xl font-semibold mb-2">Local Services</h3>
            <p className="text-gray-600 mb-4">Gyms, salons, mechanics, contractors</p>
            <a
              href="https://gyms-nyc.r8r.one"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Visit gyms-nyc.r8r.one →
            </a>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-center mb-8">Everything You Need</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Instant Setup</h3>
              <p className="text-gray-600 text-sm">Your community goes live immediately</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Custom Categories</h3>
              <p className="text-gray-600 text-sm">Define your own rating criteria</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Map Integration</h3>
              <p className="text-gray-600 text-sm">Location-based ratings and discovery</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m0 0v14a2 2 0 01-2 2H9a2 2 0 01-2-2V4m0 0H5" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Zero Maintenance</h3>
              <p className="text-gray-600 text-sm">We handle hosting, scaling, and updates</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}