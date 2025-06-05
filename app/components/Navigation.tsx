'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTenant } from '../contexts/TenantContext';

export default function Navigation() {
  const pathname = usePathname();
  const { tenant, tenantConfig, isLoading } = useTenant();

  const getLinkClass = (path: string) => {
    return pathname === path
      ? "text-blue-600 border-b-2 border-blue-600 px-3 py-2 rounded-md text-sm sm:text-base font-semibold"
      : "text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm sm:text-base font-semibold";
  };

  // Show minimal navigation while loading
  if (isLoading || !tenant) {
    return (
      <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-16">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-48"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Get tenant-specific navigation elements
  const getTenantEmoji = () => {
    switch (tenant.tenantId) {
      case 'burritos': return '🌯';
      case 'pizza': return '🍕';
      case 'coffee': return '☕';
      default: return '⭐';
    }
  };

  const getTenantName = () => {
    return tenant.name || `${tenant.tenantId.charAt(0).toUpperCase() + tenant.tenantId.slice(1)} Community`;
  };

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-base sm:text-lg font-bold text-blue-600">
              {getTenantEmoji()} {getTenantName()} {getTenantEmoji()}
            </h1>
          </div>
          <div className="flex items-center space-x-4 mt-2 sm:mt-0">
            <Link
              href="/"
              className={getLinkClass("/")}
            >
              Map View
            </Link>
            <Link
              href="/list"
              className={getLinkClass("/list")}
            >
              List View
            </Link>
            <Link
              href="/guide"
              className={getLinkClass("/guide")}
            >
              User Guide
            </Link>
            {/* Platform link for development */}
            {process.env.NODE_ENV === 'development' && (
              <a
                href="https://r8r.one"
                className="text-gray-500 hover:text-blue-600 px-3 py-2 rounded-md text-xs font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                Platform
              </a>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 