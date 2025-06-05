'use client';


'use client';

import React from 'react';
import Link from 'next/link';


export default function TenantNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Community Not Available
            </h2>
            
            <p className="mt-2 text-sm text-gray-600">
              This community doesn't exist yet, but you can create it!
            </p>
            
            <div className="mt-6 space-y-3">
              <Link
                href="https://r8r.one/create-community"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create This Community
              </Link>
              
              <div className="text-center">
                <Link
                  href="https://r8r.one"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  or browse existing communities
                </Link>
              </div>
            </div>
            
            <div className="mt-6 text-xs text-gray-500">
              <p>Popular communities:</p>
              <div className="mt-2 space-x-4">
                <a
                  href="https://burritos.r8r.one"
                  className="text-blue-600 hover:text-blue-500"
                >
                  burritos.r8r.one
                </a>
                <a
                  href="https://pizza.r8r.one"
                  className="text-blue-600 hover:text-blue-500"
                >
                  pizza.r8r.one
                </a>
                <a
                  href="https://coffee.r8r.one"
                  className="text-blue-600 hover:text-blue-500"
                >
                  coffee.r8r.one
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}