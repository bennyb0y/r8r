import { NextRequest, NextResponse } from 'next/server';
import { resolveTenantFromHost, isValidTenantId } from './lib/tenant';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;
  
  // Skip middleware for static assets and API routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/icon.svg') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  
  // Handle main platform domains (r8r.one, pages.dev URLs)
  if (
    hostname === 'r8r.one' || 
    hostname === 'www.r8r.one' ||
    hostname.includes('.pages.dev') ||
    hostname.includes('localhost')
  ) {
    // Main platform - let the root page handle the logic
    return NextResponse.next();
  }
  
  // Resolve tenant from hostname for subdomains
  const tenantId = resolveTenantFromHost(hostname);
  
  // Development environment handling
  if (process.env.NODE_ENV === 'development') {
    // In development, add tenant context to headers
    const response = NextResponse.next();
    if (tenantId) {
      response.headers.set('x-tenant-id', tenantId);
    }
    return response;
  }
  
  // Production tenant validation for self-service platform
  if (!tenantId || !isValidTenantId(tenantId)) {
    // Redirect to main platform site or show tenant not found page
    return NextResponse.redirect(new URL('/tenant-not-found', request.url));
  }
  
  // For self-service platform: validate tenant exists in database
  // This will be handled by the TenantContext - if tenant doesn't exist in DB,
  // it can show a "claim this subdomain" page instead of 404
  
  // Add tenant context to headers for use in pages/API
  const response = NextResponse.next();
  response.headers.set('x-tenant-id', tenantId);
  response.headers.set('x-tenant-subdomain', tenantId);
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Only match specific paths for static export compatibility
     * Exclude static files and handle tenant routing client-side
     */
    '/((?!_next|favicon.ico|icon.svg|public/).*)',
  ],
};