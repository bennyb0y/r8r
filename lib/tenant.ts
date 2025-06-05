// Multi-tenant utility functions for R8R platform

export interface TenantContext {
  tenantId: string;
  subdomain: string;
  name: string;
  config?: Partial<TenantConfig>;
}

export interface TenantConfig {
  ratingCategories: RatingCategory[];
  itemAttributes: ItemAttribute[];
  locationRequired: boolean;
  imageUploadEnabled: boolean;
  branding?: TenantBranding;
}

export interface RatingCategory {
  id: string;
  name: string;
  required: boolean;
  weight?: number;
  min?: number;
  max?: number;
}

export interface ItemAttribute {
  id: string;
  name: string;
  type: 'text' | 'select' | 'multiselect' | 'scale' | 'boolean';
  options?: string[];
  required?: boolean;
}

export interface TenantBranding {
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  faviconUrl?: string;
  customCSS?: string;
}

/**
 * Resolves tenant from hostname
 * Supports: burritos.r8r.one → "burritos", pizza-nyc.r8r.one → "pizza-nyc"
 * Also supports Cloudflare Pages deployments: abc123.r8r-platform.pages.dev → "burritos" (default)
 */
export function resolveTenantFromHost(host: string): string | null {
  if (!host) return null;
  
  // Development environment fallback
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return process.env.NEXT_PUBLIC_DEV_TENANT_ID || 'burritos';
  }
  
  // Cloudflare Pages deployment URLs (e.g., abc123.r8r-platform.pages.dev)
  if (host.includes('.pages.dev')) {
    // For Pages deployments, use default tenant or environment variable
    return process.env.NEXT_PUBLIC_PAGES_TENANT_ID || 'burritos';
  }
  
  // Production subdomain extraction (r8r.one domains)
  const match = host.match(/^([^.]+)\.r8r\.one$/);
  if (match && match[1] !== 'www') {
    return match[1];
  }
  
  // Main domain (r8r.one or www.r8r.one) - no tenant
  if (host === 'r8r.one' || host === 'www.r8r.one') {
    return null;
  }
  
  return null;
}

/**
 * Builds tenant-aware URL
 */
export function buildTenantUrl(tenantId: string, path: string = ''): string {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    const port = process.env.PORT || '3000';
    return `http://localhost:${port}${path}`;
  }
  
  return `https://${tenantId}.r8r.one${path}`;
}

/**
 * Gets current tenant context from request headers or browser
 */
export function getCurrentTenant(): string | null {
  if (typeof window !== 'undefined') {
    // Client-side: extract from current hostname
    return resolveTenantFromHost(window.location.hostname);
  }
  
  // Server-side: will be resolved from request headers in middleware
  return null;
}

/**
 * Validates if tenant ID is in correct format
 */
export function isValidTenantId(tenantId: string): boolean {
  if (!tenantId || typeof tenantId !== 'string') return false;
  
  // Allow alphanumeric, hyphens, underscores
  // Must be 2-32 characters
  return /^[a-z0-9-_]{2,32}$/.test(tenantId);
}

/**
 * Default tenant configurations for common use cases
 */
export const DEFAULT_TENANT_CONFIGS: Record<string, Partial<TenantConfig>> = {
  burritos: {
    ratingCategories: [
      { id: 'overall', name: 'Overall Rating', required: true, weight: 0.4 },
      { id: 'taste', name: 'Taste', required: true, weight: 0.3 },
      { id: 'value', name: 'Value', required: true, weight: 0.2 },
      { id: 'price', name: 'Price', required: false, weight: 0.1 }
    ],
    itemAttributes: [
      {
        id: 'ingredients',
        name: 'Ingredients',
        type: 'multiselect',
        options: ['potatoes', 'cheese', 'bacon', 'chorizo', 'avocado', 'vegetables']
      },
      {
        id: 'spice_level',
        name: 'Spice Level',
        type: 'select',
        options: ['mild', 'medium', 'hot', 'very_hot']
      }
    ],
    locationRequired: true,
    imageUploadEnabled: true
  },
  
  pizza: {
    ratingCategories: [
      { id: 'overall', name: 'Overall Rating', required: true, weight: 0.4 },
      { id: 'crust', name: 'Crust Quality', required: true, weight: 0.25 },
      { id: 'sauce', name: 'Sauce', required: true, weight: 0.2 },
      { id: 'cheese', name: 'Cheese', required: true, weight: 0.15 }
    ],
    itemAttributes: [
      {
        id: 'style',
        name: 'Pizza Style',
        type: 'select',
        options: ['neapolitan', 'new_york', 'sicilian', 'chicago', 'detroit']
      },
      {
        id: 'toppings',
        name: 'Toppings',
        type: 'multiselect',
        options: ['pepperoni', 'mushrooms', 'sausage', 'peppers', 'onions', 'olives']
      }
    ],
    locationRequired: true,
    imageUploadEnabled: true
  },
  
  coffee: {
    ratingCategories: [
      { id: 'overall', name: 'Overall Rating', required: true, weight: 0.4 },
      { id: 'flavor', name: 'Flavor', required: true, weight: 0.3 },
      { id: 'aroma', name: 'Aroma', required: true, weight: 0.2 },
      { id: 'value', name: 'Value', required: false, weight: 0.1 }
    ],
    itemAttributes: [
      {
        id: 'roast_level',
        name: 'Roast Level',
        type: 'select',
        options: ['light', 'medium', 'medium_dark', 'dark', 'extra_dark']
      },
      {
        id: 'brewing_method',
        name: 'Brewing Method',
        type: 'select',
        options: ['espresso', 'drip', 'french_press', 'pour_over', 'cold_brew']
      }
    ],
    locationRequired: false,
    imageUploadEnabled: true
  }
};