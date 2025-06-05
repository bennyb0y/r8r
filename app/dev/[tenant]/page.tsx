import TenantPage from '../../components/TenantPage';

interface DevTenantPageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default async function DevTenantPage({ params }: DevTenantPageProps) {
  const { tenant } = await params;
  return <TenantPage tenantId={tenant} />;
}

// Generate static params for common tenants
export async function generateStaticParams() {
  return [
    { tenant: 'burritos' },
    { tenant: 'burgers' },
    { tenant: 'pizza' },
    { tenant: 'coffee' },
  ];
}

// Generate metadata for the page
export async function generateMetadata({ params }: DevTenantPageProps) {
  const { tenant } = await params;
  const tenantName = tenant.charAt(0).toUpperCase() + tenant.slice(1);
  
  return {
    title: `${tenantName} Reviews - R8R Platform (Dev)`,
    description: `Development preview of ${tenantName} community reviews`,
  };
}