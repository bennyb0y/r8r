'use client';

import { useEffect, useState } from 'react';
import TenantPage from './components/TenantPage';

export default function Home() {
  const [pageType, setPageType] = useState<'loading' | 'platform' | 'tenant'>('loading');
  const [tenantId, setTenantId] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      
      // Check if this is the main platform domain
      const isMainPlatform = 
        hostname === 'r8r.one' || 
        hostname === 'www.r8r.one' ||
        hostname.includes('r8r-platform.pages.dev') ||
        hostname.includes('localhost');
      
      if (isMainPlatform) {
        setPageType('platform');
      } else {
        // Check if this is a tenant subdomain
        const tenantMatch = hostname.match(/^([^.]+)\.r8r\.one$/);
        if (tenantMatch && tenantMatch[1] !== 'www' && tenantMatch[1] !== 'api') {
          const tenant = tenantMatch[1];
          setTenantId(tenant);
          setPageType('tenant');
        } else {
          setPageType('platform'); // fallback
        }
      }
    }
  }, []);

  if (pageType === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (pageType === 'tenant') {
    return <TenantPage tenantId={tenantId} />;
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
                href="https://burgers.r8r.one" 
                style={{ display: 'block', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', textDecoration: 'none', color: 'inherit' }}
              >
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>🍔 Burger Reviews</h3>
                <p style={{ color: '#6b7280' }}>Rate and discover the best burgers</p>
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