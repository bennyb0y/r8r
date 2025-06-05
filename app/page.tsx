'use client';

export default function Home() {
  // Simple check without complex state management
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Check if this is a tenant subdomain
    const tenantMatch = hostname.match(/^([^.]+)\.r8r\.one$/);
    if (tenantMatch && tenantMatch[1] !== 'www' && tenantMatch[1] !== 'api') {
      const tenant = tenantMatch[1];
      if (tenant === 'burritos') {
        // Immediate redirect without state
        if (window.location.pathname === '/') {
          window.location.replace('/burritos');
          return null;
        }
      }
      
      // For other tenants, show not configured message
      if (window.location.pathname === '/') {
        return (
          <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6' }}>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
                {tenant.charAt(0).toUpperCase() + tenant.slice(1)} Community
              </h1>
              <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                This community is not yet configured.
              </p>
              <a 
                href="https://r8r.one" 
                style={{ color: '#2563eb', textDecoration: 'underline' }}
              >
                Return to R8R Platform
              </a>
            </div>
          </div>
        );
      }
    }
  }

  // Main platform landing page
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #eff6ff, #ffffff)' }}>
      <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '4rem 1rem' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
            R8R Platform
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#6b7280', marginBottom: '2rem' }}>
            Community-driven rating platform for anything and everything
          </p>
          
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '2rem', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>Featured Communities</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              <a 
                href="https://burritos.r8r.one" 
                style={{ display: 'block', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', textDecoration: 'none', color: 'inherit' }}
              >
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>🌯 Burrito Reviews</h3>
                <p style={{ color: '#6b7280' }}>Rate and discover the best burritos</p>
              </a>
              
              <a 
                href="https://sample.r8r.one" 
                style={{ display: 'block', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', textDecoration: 'none', color: 'inherit' }}
              >
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>📝 Sample Community</h3>
                <p style={{ color: '#6b7280' }}>Example rating community</p>
              </a>
            </div>
          </div>
          
          <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
            Create your own rating community at R8R Platform
          </div>
        </div>
      </div>
    </div>
  );
}