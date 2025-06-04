// Configuration for the application

// API configuration
export const getApiUrl = (endpoint: string): string => {
  // Use the same API URL for both development and production
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://your-worker-name.your-account.workers.dev';
  
  console.log(`Using API base URL: ${baseUrl}`);
  
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