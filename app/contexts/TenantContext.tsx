'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { TenantContext as TenantContextType, TenantConfig, DEFAULT_TENANT_CONFIGS } from '../../lib/tenant';
import { getCurrentTenant } from '../../lib/tenant';
import { getApiUrl } from '../config';

interface TenantContextProps {
  tenant: TenantContextType | null;
  tenantConfig: TenantConfig | null;
  isLoading: boolean;
  error: string | null;
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextProps>({
  tenant: null,
  tenantConfig: null,
  isLoading: true,
  error: null,
  refreshTenant: async () => {}
});

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

interface TenantProviderProps {
  children: React.ReactNode;
  initialTenantId?: string;
}

export function TenantProvider({ children, initialTenantId }: TenantProviderProps) {
  const [tenant, setTenant] = useState<TenantContextType | null>(null);
  const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTenant = async (tenantId?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const currentTenantId = tenantId || initialTenantId || getCurrentTenant();
      
      if (!currentTenantId) {
        throw new Error('No tenant ID found');
      }

      // For Pages deployments, skip API calls entirely and use default config
      const isPagesDeploy = typeof window !== 'undefined' && window.location.hostname.includes('.pages.dev');
      
      if (isPagesDeploy) {
        console.log('Pages deployment detected, using default config without API call');
        const defaultConfig = DEFAULT_TENANT_CONFIGS[currentTenantId] || DEFAULT_TENANT_CONFIGS.burritos;
        setTenant({
          tenantId: currentTenantId,
          subdomain: currentTenantId,
          name: `${currentTenantId.charAt(0).toUpperCase() + currentTenantId.slice(1)} Community`,
          config: defaultConfig
        });
        setTenantConfig(defaultConfig as TenantConfig);
      } else {
        // Try to load tenant from API for production deployments
        let apiSuccess = false;
        
        try {
          const response = await fetch(getApiUrl(`tenants/${currentTenantId}`), {
            headers: {
              'X-Tenant-ID': currentTenantId
            }
          });
          
          if (response.ok) {
            const tenantData = await response.json();
            setTenant({
              tenantId: tenantData.id,
              subdomain: tenantData.subdomain,
              name: tenantData.name,
              config: tenantData.config
            });
            setTenantConfig(tenantData.config);
            apiSuccess = true;
          }
        } catch (apiError) {
          console.warn('Failed to load tenant from API, using default config:', apiError);
        }
        
        // Fallback if API failed
        if (!apiSuccess) {
          const defaultConfig = DEFAULT_TENANT_CONFIGS[currentTenantId] || DEFAULT_TENANT_CONFIGS.burritos;
          setTenant({
            tenantId: currentTenantId,
            subdomain: currentTenantId,
            name: `${currentTenantId.charAt(0).toUpperCase() + currentTenantId.slice(1)} Community`,
            config: defaultConfig
          });
          setTenantConfig(defaultConfig as TenantConfig);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tenant');
      console.error('Error loading tenant:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTenant = async () => {
    await loadTenant();
  };

  useEffect(() => {
    loadTenant();
  }, [initialTenantId]);

  const contextValue: TenantContextProps = {
    tenant,
    tenantConfig,
    isLoading,
    error,
    refreshTenant
  };

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
}