import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Helper function to get tenant from request
function getTenantFromRequest(request: Request): string {
  // 1. Check for X-Tenant-ID header
  const tenantHeader = request.headers.get('X-Tenant-ID');
  if (tenantHeader) {
    return tenantHeader;
  }
  
  // 2. Check for tenant query parameter
  const url = new URL(request.url);
  const tenantParam = url.searchParams.get('tenant');
  if (tenantParam) {
    return tenantParam;
  }
  
  // 3. Try to detect from Host header
  const host = request.headers.get('Host') || request.headers.get('X-Original-Host');
  if (host) {
    // Check for *.r8r.one pattern
    const match = host.match(/^([^.]+)\.r8r\.one$/);
    if (match && match[1] !== 'www' && match[1] !== 'api') {
      return match[1];
    }
  }
  
  // 4. Default to 'burritos' for backward compatibility
  return 'burritos';
}

export async function PUT(
  request: Request,
  context: any
) {
  const { params } = context;
  try {
    const tenant = getTenantFromRequest(request);
    const id = params.id;
    
    console.log(`Proxying confirm rating ${id} for tenant: ${tenant}`);
    
    // Forward to the worker with tenant information
    const workerUrl = `${process.env.API_BASE_URL}/ratings/${id}/confirm`;
    
    const response = await fetch(workerUrl, {
      method: 'PUT',
      headers: {
        'X-Tenant-ID': tenant,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying rating confirmation:', error);
    return NextResponse.json(
      { error: 'Failed to confirm rating' },
      { status: 500 }
    );
  }
}