// Cloudflare Worker for handling wildcard subdomain routing
// This worker will route *.r8r.one to the appropriate Pages deployment

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const hostname = url.hostname;
    
    console.log(`Routing request for: ${hostname}`);
    
    // Handle main domain (r8r.one)
    if (hostname === 'r8r.one' || hostname === 'www.r8r.one') {
      // Route to Pages deployment
      const pagesUrl = new URL(request.url);
      pagesUrl.hostname = 'r8r-platform.pages.dev';
      
      const modifiedRequest = new Request(pagesUrl.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });
      
      return await fetch(modifiedRequest);
    }
    
    // Handle API subdomain (route to API worker)
    if (hostname === 'api.r8r.one') {
      console.log(`Routing API request to r8r-platform-api worker`);
      
      // Route to API worker
      const workerUrl = new URL(request.url);
      workerUrl.hostname = 'r8r-platform-api.bennyfischer.workers.dev';
      
      const modifiedRequest = new Request(workerUrl.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });
      
      return await fetch(modifiedRequest);
    }
    
    // Handle subdomains (tenant-specific sites)
    const subdomain = hostname.split('.')[0];
    if (hostname.endsWith('.r8r.one') && subdomain !== 'www' && subdomain !== 'api') {
      console.log(`Routing subdomain: ${subdomain}`);
      
      // Route to Pages deployment but preserve the original hostname
      // so the app can detect the tenant
      const pagesUrl = new URL(request.url);
      pagesUrl.hostname = 'r8r-platform.pages.dev';
      
      const modifiedRequest = new Request(pagesUrl.toString(), {
        method: request.method,
        headers: {
          ...request.headers,
          'Host': hostname, // Preserve original hostname for tenant detection
          'X-Original-Host': hostname,
          'X-Tenant-Subdomain': subdomain,
        },
        body: request.body,
      });
      
      return await fetch(modifiedRequest);
    }
    
    // Fallback - redirect unknown domains to main site
    return Response.redirect('https://r8r.one', 302);
  },
};