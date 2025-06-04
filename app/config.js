// Configuration for the application

// API configuration
export const getApiUrl = (endpoint) => {
  // Use the environment variable for the API base URL
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://burrito-rater.bennyfischer.workers.dev';
  
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
  
  // Combine the base URL and endpoint
  return `${baseUrl}/${formattedEndpoint}`;
}; 