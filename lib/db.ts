import { D1Database } from '@cloudflare/workers-types';

export interface Rating {
  id: string;
  tenant_id: string;
  item_id: string;
  scores: {
    taste: number;
    value: number;
    overall: number;
  };
  review?: string;
  price_paid?: number;
  reviewer_info: {
    name?: string;
    emoji?: string;
    identity_hash?: string;
    ingredients?: string[];
  };
  visit_date?: string;
  image_urls: string[];
  status: string;
  confirmed_at?: string;
  confirmed_by?: string;
  created_at: string;
  updated_at: string;
}

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
  attributes: any;
  image_urls: string[];
  status: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: string;
  subdomain: string;
  name: string;
  category: string;
  subcategory?: string;
  owner_email?: string;
  status: string;
  config: any;
  branding?: any;
  settings?: any;
  created_at: string;
  updated_at: string;
}

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
}

export class Database {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // Get tenant by subdomain
  async getTenantBySubdomain(subdomain: string): Promise<Tenant | null> {
    const result = await this.db.prepare('SELECT * FROM tenants WHERE subdomain = ?').bind(subdomain).first<Tenant>();
    return result;
  }

  // Get all ratings for a tenant with item details
  async getAllRatingsForTenant(tenantId: string): Promise<LegacyRating[]> {
    const { results } = await this.db.prepare(`
      SELECT 
        r.*,
        i.name as item_name,
        i.venue_name,
        i.latitude,
        i.longitude,
        i.zipcode
      FROM ratings r
      JOIN items i ON r.item_id = i.id
      WHERE r.tenant_id = ? AND r.status = 'confirmed'
      ORDER BY r.created_at DESC
    `).bind(tenantId).all();
    
    return results.map(this.transformRatingForLegacyApi);
  }

  // Get rating by ID for a tenant
  async getRatingByIdForTenant(tenantId: string, id: string): Promise<LegacyRating | null> {
    const result = await this.db.prepare(`
      SELECT r.*, i.name as item_name, i.venue_name, i.latitude, i.longitude, i.zipcode
      FROM ratings r
      JOIN items i ON r.item_id = i.id
      WHERE r.tenant_id = ? AND r.id = ?
    `).bind(tenantId, id).first();
    
    return result ? this.transformRatingForLegacyApi(result) : null;
  }

  // Get ratings within a geographic bounding box for a tenant
  async getRatingsInBoundsForTenant(tenantId: string, north: number, south: number, east: number, west: number): Promise<LegacyRating[]> {
    const { results } = await this.db.prepare(`
      SELECT 
        r.*,
        i.name as item_name,
        i.venue_name,
        i.latitude,
        i.longitude,
        i.zipcode
      FROM ratings r
      JOIN items i ON r.item_id = i.id
      WHERE r.tenant_id = ? 
        AND r.status = 'confirmed'
        AND i.latitude BETWEEN ? AND ? 
        AND i.longitude BETWEEN ? AND ?
      ORDER BY r.created_at DESC
    `).bind(tenantId, south, north, west, east).all();
    
    return results.map(this.transformRatingForLegacyApi);
  }

  // Transform new schema data to legacy API format
  private transformRatingForLegacyApi(row: any): LegacyRating {
    const scores = JSON.parse(row.scores || '{}');
    const reviewerInfo = JSON.parse(row.reviewer_info || '{}');
    const imageUrls = JSON.parse(row.image_urls || '[]');
    const ingredients = reviewerInfo.ingredients || [];
    
    return {
      id: parseInt(row.id.replace('rating_', '')),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      restaurantName: row.venue_name,
      burritoTitle: row.item_name,
      latitude: row.latitude,
      longitude: row.longitude,
      zipcode: row.zipcode,
      rating: scores.overall || 3,
      taste: scores.taste || 3,
      value: scores.value || 3,
      price: row.price_paid || 0,
      hasPotatoes: ingredients.includes('potatoes'),
      hasCheese: ingredients.includes('cheese'),
      hasBacon: ingredients.includes('bacon'),
      hasChorizo: ingredients.includes('chorizo'),
      hasAvocado: ingredients.includes('avocado'),
      hasVegetables: ingredients.includes('vegetables'),
      review: row.review,
      reviewerName: reviewerInfo.name,
      identityPassword: reviewerInfo.identity_hash,
      generatedEmoji: reviewerInfo.emoji,
      reviewerEmoji: reviewerInfo.emoji
    };
  }

  // Legacy compatibility methods
  async getAllRatings(): Promise<LegacyRating[]> {
    return this.getAllRatingsForTenant('burritos');
  }

  async getRatingById(id: number): Promise<LegacyRating | null> {
    return this.getRatingByIdForTenant('burritos', `rating_${id}`);
  }

  async getRatingsByZipcode(zipcode: string): Promise<LegacyRating[]> {
    const { results } = await this.db.prepare(`
      SELECT 
        r.*,
        i.name as item_name,
        i.venue_name,
        i.latitude,
        i.longitude,
        i.zipcode
      FROM ratings r
      JOIN items i ON r.item_id = i.id
      WHERE r.tenant_id = 'burritos' 
        AND r.status = 'confirmed'
        AND i.zipcode = ?
      ORDER BY r.created_at DESC
    `).bind(zipcode).all();
    
    return results.map(this.transformRatingForLegacyApi);
  }

  async getRatingsInBounds(north: number, south: number, east: number, west: number): Promise<LegacyRating[]> {
    return this.getRatingsInBoundsForTenant('burritos', north, south, east, west);
  }

  // Placeholder methods for legacy compatibility
  async createRating(rating: Omit<LegacyRating, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ id: number }> {
    return { id: 0 };
  }

  async updateRating(id: number, rating: Partial<Omit<LegacyRating, 'id' | 'createdAt' | 'updatedAt'>>): Promise<boolean> {
    return false;
  }

  async deleteRating(id: number): Promise<boolean> {
    return false;
  }
}