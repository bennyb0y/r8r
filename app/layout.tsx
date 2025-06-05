import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';
import NavigationWrapper from './components/NavigationWrapper';
import { TenantProvider } from './contexts/TenantContext';
import { resolveTenantFromHost } from '../lib/tenant';

const inter = Inter({ subsets: ['latin'] });

// Removed dynamic rendering for static export compatibility

export const metadata: Metadata = {
  title: "R8R Platform - Community Rating Platform",
  description: 'Create and discover community-driven rating sites for any category',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // For static export, tenant resolution is handled client-side
  const tenantId = null;
  
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <TenantProvider initialTenantId={tenantId || undefined}>
          <div className="flex flex-col h-full">
            <NavigationWrapper />
            <main className="flex-1 relative pt-16">
              {children}
            </main>
          </div>
        </TenantProvider>
      </body>
    </html>
  );
}
