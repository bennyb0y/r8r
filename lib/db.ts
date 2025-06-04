import { D1Database } from '@cloudflare/workers-types';

export interface Rating {
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

  // Get all ratings
  async getAllRatings(): Promise<Rating[]> {
    const { results } = await this.db.prepare('SELECT * FROM Rating ORDER BY createdAt DESC').all<Rating>();
    return results;
  }

  // Get rating by ID
  async getRatingById(id: number): Promise<Rating | null> {
    const result = await this.db.prepare('SELECT * FROM Rating WHERE id = ?').bind(id).first<Rating>();
    return result;
  }

  // Create a new rating
  async createRating(rating: Omit<Rating, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ id: number }> {
    const columns = Object.keys(rating).join(', ');
    const placeholders = Object.keys(rating).map(() => '?').join(', ');
    const values = Object.values(rating);

    const result = await this.db
      .prepare(`INSERT INTO Rating (${columns}) VALUES (${placeholders}) RETURNING id`)
      .bind(...values)
      .first<{ id: number }>();

    return result || { id: 0 };
  }

  // Update a rating
  async updateRating(id: number, rating: Partial<Omit<Rating, 'id' | 'createdAt' | 'updatedAt'>>): Promise<boolean> {
    const entries = Object.entries(rating);
    const setClause = entries.map(([key]) => `${key} = ?`).join(', ');
    const values = entries.map(([, value]) => value);

    const result = await this.db
      .prepare(`UPDATE Rating SET ${setClause} WHERE id = ?`)
      .bind(...values, id)
      .run();

    return result.success;
  }

  // Delete a rating
  async deleteRating(id: number): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM Rating WHERE id = ?')
      .bind(id)
      .run();

    return result.success;
  }

  // Get ratings by zipcode
  async getRatingsByZipcode(zipcode: string): Promise<Rating[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM Rating WHERE zipcode = ? ORDER BY createdAt DESC')
      .bind(zipcode)
      .all<Rating>();
    
    return results;
  }

  // Get ratings within a geographic bounding box
  async getRatingsInBounds(north: number, south: number, east: number, west: number): Promise<Rating[]> {
    const { results } = await this.db
      .prepare(
        'SELECT * FROM Rating WHERE latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ? ORDER BY createdAt DESC'
      )
      .bind(south, north, west, east)
      .all<Rating>();
    
    return results;
  }
} 