// Configuration for the application

// Helper function to get current tenant from various sources
const getCurrentTenant = (): string => {
  if (typeof window === 'undefined') {
    console.log('SSR: defaulting to burritos tenant');
    return 'burritos'; // Default for SSR
  }
  
  // 1. Try to detect from hostname
  const hostname = window.location.hostname;
  console.log('Detecting tenant from hostname:', hostname);
  const match = hostname.match(/^([^.]+)\.r8r\.one$/);
  if (match && match[1] !== 'www' && match[1] !== 'api') {
    console.log('Detected tenant from hostname:', match[1]);
    return match[1];
  }
  
  // 2. Check for tenant in URL params
  const urlParams = new URLSearchParams(window.location.search);
  const tenantParam = urlParams.get('tenant');
  if (tenantParam) {
    console.log('Detected tenant from URL param:', tenantParam);
    return tenantParam;
  }
  
  // 3. Default to burritos
  console.log('No tenant detected, defaulting to burritos');
  return 'burritos';
};

// API configuration
export const getApiUrl = (endpoint: string, tenantId?: string): string => {
  // Always use the worker directly since Next.js API routes don't work on Cloudflare Pages
  const baseUrl = 'https://r8r-platform-api.bennyfischer.workers.dev';
  
  console.log(`Using API base URL: ${baseUrl}`);
  
  // Ensure the endpoint has the correct format
  let formattedEndpoint = endpoint;
  
  // Remove /api/ prefix if present (since our worker doesn't use this prefix)
  if (formattedEndpoint.startsWith('/api/')) {
    formattedEndpoint = formattedEndpoint.substring(5);
  } else if (formattedEndpoint.startsWith('api/')) {
    formattedEndpoint = formattedEndpoint.substring(4);
  }
  
  // Remove leading slash if present
  if (formattedEndpoint.startsWith('/')) {
    formattedEndpoint = formattedEndpoint.substring(1);
  }
  
  // Add tenant parameter if not provided directly
  const tenant = tenantId || getCurrentTenant();
  const finalUrl = `${baseUrl}/${formattedEndpoint}?tenant=${tenant}`;
  
  console.log('Generated API URL:', finalUrl);
  
  // Combine the base URL, endpoint, and tenant parameter
  return finalUrl;
};

// Helper function to get headers with tenant information
export const getTenantHeaders = (tenantId?: string, includeContentType: boolean = true): Record<string, string> => {
  const tenant = tenantId || getCurrentTenant();
  const headers: Record<string, string> = {
    'X-Tenant-ID': tenant
  };
  
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  
  return headers;
}; 