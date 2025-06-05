// Configuration for the R8R multi-tenant platform
import { getCurrentTenant } from '../lib/tenant';

// API configuration with tenant context
export const getApiUrl = (endpoint: string, tenantId?: string): string => {
  // Use platform API URL for multi-tenant setup
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.r8r.one';
  
  // Get tenant ID from parameter or current context
  const currentTenant = tenantId || getCurrentTenant();
  
  console.log(`Using API base URL: ${baseUrl} for tenant: ${currentTenant}`);
  
  // Ensure the endpoint has the correct format
  let formattedEndpoint = endpoint;
  
  // Add /api/ prefix if not already present
  if (!endpoint.startsWith('/api/') && !endpoint.startsWith('api/')) {
    formattedEndpoint = `api/${endpoint}`;
  } else if (endpoint.startsWith('/')) {
    formattedEndpoint = endpoint.substring(1);
  }
  
  // Combine the base URL and endpoint
  return `${baseUrl}/${formattedEndpoint}`;
};

// Platform configuration
export const PLATFORM_CONFIG = {
  domain: process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'r8r.one',
  apiUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.r8r.one',
  isDevelopment: process.env.NODE_ENV === 'development',
  defaultTenant: process.env.NEXT_PUBLIC_DEV_TENANT_ID || 'burritos'
};

// Tenant context provider for client-side
export function getTenantContext() {
  if (typeof window === 'undefined') return null;
  
  const tenant = getCurrentTenant();
  if (!tenant) return null;
  
  return {
    tenantId: tenant,
    subdomain: tenant,
    // Additional context will be loaded from API
  };
} 