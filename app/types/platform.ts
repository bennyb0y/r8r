// R8R Platform Multi-Tenant Type Definitions

// ============================================================================
// TENANT TYPES
// ============================================================================

export interface Tenant {
  id: string;
  subdomain: string;
  name: string;
  category: string;
  subcategory?: string;
  owner_email?: string;
  status: 'active' | 'suspended' | 'pending';
  config: TenantConfig;
  branding?: TenantBranding;
  settings?: TenantSettings;
  created_at: string;
  updated_at: string;
}

export interface TenantConfig {
  ratingCategories: RatingCategory[];
  itemAttributes: ItemAttribute[];
  locationRequired: boolean;
  imageUploadEnabled: boolean;
  maxPriceRange?: number;
  currencySymbol?: string;
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
  type: 'text' | 'select' | 'multiselect' | 'scale' | 'boolean' | 'tags';
  required?: boolean;
  options?: string[];
  min?: number;
  max?: number;
  placeholder?: string;
}

export interface TenantBranding {
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  faviconUrl?: string;
  customCss?: string;
  tagline?: string;
}

export interface TenantSettings {
  requireModeration: boolean;
  allowAnonymousReviews: boolean;
  maxImagesPerRating: number;
  enableLocationValidation: boolean;
  timezoneId: string;
  language: string;
  features: {
    [key: string]: boolean;
  };
}

// ============================================================================
// ITEM TYPES
// ============================================================================

export interface Item {
  id: string;
  tenant_id: string;
  name: string;
  venue_name: string;
  venue_address?: string;
  latitude?: number;
  longitude?: number;
  zipcode?: string;
  price_range_min?: number;
  price_range_max?: number;
  attributes: Record<string, any>;
  image_urls?: string[];
  status: 'active' | 'inactive' | 'reported';
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateItemRequest {
  name: string;
  venue_name: string;
  venue_address?: string;
  latitude?: number;
  longitude?: number;
  zipcode?: string;
  price_range_min?: number;
  price_range_max?: number;
  attributes: Record<string, any>;
  image_urls?: string[];
}

// ============================================================================
// RATING TYPES
// ============================================================================

export interface Rating {
  id: string;
  tenant_id: string;
  item_id: string;
  scores: Record<string, number>;
  review?: string;
  price_paid?: number;
  reviewer_info: ReviewerInfo;
  visit_date?: string;
  image_urls?: string[];
  status: 'pending' | 'confirmed' | 'rejected';
  confirmed_at?: string;
  confirmed_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewerInfo {
  name?: string;
  emoji?: string;
  identity_hash: string;
  location?: string;
}

export interface CreateRatingRequest {
  item_id: string;
  scores: Record<string, number>;
  review?: string;
  price_paid?: number;
  reviewer_info: Omit<ReviewerInfo, 'identity_hash'>;
  visit_date?: string;
  image_urls?: string[];
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface RatingAnalytics {
  id: string;
  tenant_id: string;
  item_id: string;
  total_ratings: number;
  average_scores: Record<string, number>;
  last_rating_at?: string;
  updated_at: string;
}

// ============================================================================
// ADMIN TYPES
// ============================================================================

export interface TenantAdmin {
  id: string;
  tenant_id: string;
  email: string;
  role: 'owner' | 'admin' | 'moderator';
  permissions: AdminPermissions;
  created_at: string;
}

export interface AdminPermissions {
  canManageAdmins: boolean;
  canModerateRatings: boolean;
  canEditTenantConfig: boolean;
  canViewAnalytics: boolean;
  canManageItems: boolean;
  canExportData: boolean;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ============================================================================
// TENANT CONTEXT TYPES
// ============================================================================

export interface TenantContext {
  tenant: Tenant;
  config: TenantConfig;
  branding?: TenantBranding;
  isOwner: boolean;
  isAdmin: boolean;
  permissions: AdminPermissions;
}

// ============================================================================
// MIGRATION TYPES (for backward compatibility)
// ============================================================================

export interface LegacyRating {
  id: number;
  createdAt: string;
  updatedAt: string;
  restaurantName: string;
  burritoTitle: string;
  latitude: number;
  longitude: number;
  zipcode?: string;
  rating: number;
  taste: number;
  value: number;
  price: number;
  hasPotatoes: boolean;
  hasCheese: boolean;
  hasBacon: boolean;
  hasChorizo: boolean;
  hasAvocado: boolean;
  hasVegetables: boolean;
  review?: string;
  reviewerName?: string;
  identityPassword?: string;
  generatedEmoji?: string;
  reviewerEmoji?: string;
  confirmed: number;
  image?: string;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type TenantId = string;
export type ItemId = string;
export type RatingId = string;
export type UserId = string;

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  zipcode?: string;
}

export interface PriceRange {
  min: number;
  max: number;
  currency: string;
}

// ============================================================================
// CONFIGURATION TEMPLATES
// ============================================================================

export const TENANT_TEMPLATES = {
  burritos: {
    category: 'food',
    subcategory: 'mexican',
    config: {
      ratingCategories: [
        { id: 'overall', name: 'Overall Rating', required: true, weight: 1.0 },
        { id: 'taste', name: 'Taste', required: true, weight: 0.4 },
        { id: 'value', name: 'Value', required: true, weight: 0.3 }
      ],
      itemAttributes: [
        {
          id: 'ingredients',
          name: 'Ingredients',
          type: 'multiselect' as const,
          options: ['cheese', 'lettuce', 'beans', 'rice', 'salsa', 'avocado', 'potatoes', 'bacon', 'chorizo']
        }
      ],
      locationRequired: true,
      imageUploadEnabled: true,
      maxPriceRange: 25,
      currencySymbol: '$'
    }
  },
  pizza: {
    category: 'food',
    subcategory: 'italian',
    config: {
      ratingCategories: [
        { id: 'overall', name: 'Overall Rating', required: true, weight: 1.0 },
        { id: 'crust', name: 'Crust', required: true, weight: 0.3 },
        { id: 'sauce', name: 'Sauce', required: true, weight: 0.3 },
        { id: 'cheese', name: 'Cheese', required: true, weight: 0.2 }
      ],
      itemAttributes: [
        {
          id: 'style',
          name: 'Pizza Style',
          type: 'select' as const,
          options: ['neapolitan', 'new-york', 'sicilian', 'deep-dish', 'thin-crust']
        },
        {
          id: 'toppings',
          name: 'Toppings',
          type: 'multiselect' as const,
          options: ['pepperoni', 'mushrooms', 'sausage', 'peppers', 'onions', 'olives']
        }
      ],
      locationRequired: true,
      imageUploadEnabled: true,
      maxPriceRange: 50,
      currencySymbol: '$'
    }
  },
  coffee: {
    category: 'food',
    subcategory: 'beverages',
    config: {
      ratingCategories: [
        { id: 'overall', name: 'Overall Rating', required: true, weight: 1.0 },
        { id: 'taste', name: 'Taste', required: true, weight: 0.4 },
        { id: 'atmosphere', name: 'Atmosphere', required: true, weight: 0.3 },
        { id: 'service', name: 'Service', required: true, weight: 0.3 }
      ],
      itemAttributes: [
        {
          id: 'drinkType',
          name: 'Drink Type',
          type: 'select' as const,
          options: ['espresso', 'americano', 'latte', 'cappuccino', 'macchiato', 'cold-brew']
        },
        {
          id: 'milkType',
          name: 'Milk Type',
          type: 'select' as const,
          options: ['whole', 'skim', 'oat', 'almond', 'soy', 'coconut', 'none']
        }
      ],
      locationRequired: true,
      imageUploadEnabled: true,
      maxPriceRange: 15,
      currencySymbol: '$'
    }
  }
} as const;