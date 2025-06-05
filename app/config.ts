// Configuration for the application

// Helper function to get current tenant from various sources
const getCurrentTenant = (): string => {
  if (typeof window === 'undefined') {
    return 'burritos'; // Default for SSR
  }
  
  // 1. Try to detect from hostname
  const hostname = window.location.hostname;
  const match = hostname.match(/^([^.]+)\.r8r\.one$/);
  if (match && match[1] !== 'www' && match[1] !== 'api') {
    return match[1];
  }
  
  // 2. Check for tenant in URL params
  const urlParams = new URLSearchParams(window.location.search);
  const tenantParam = urlParams.get('tenant');
  if (tenantParam) {
    return tenantParam;
  }
  
  // 3. Default to burritos
  return 'burritos';
};

// API configuration
export const getApiUrl = (endpoint: string, tenantId?: string): string => {
  // Use the environment variable for the API base URL or default to new worker
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://r8r-platform-api.bennyfischer.workers.dev';
  
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
  
  // Combine the base URL, endpoint, and tenant parameter
  return `${baseUrl}/${formattedEndpoint}?tenant=${tenant}`;
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