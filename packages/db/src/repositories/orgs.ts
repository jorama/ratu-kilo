import { DatabaseClient } from '../client';
import { v4 as uuidv4 } from 'uuid';

export interface Organization {
  org_id: string;
  name: string;
  slug: string;
  settings: any;
  created_at: Date;
  updated_at: Date;
}

export class OrganizationRepository {
  constructor(private db: DatabaseClient) {}

  async create(data: {
    name: string;
    slug: string;
    settings?: any;
  }): Promise<Organization> {
    const orgId = uuidv4();
    const result = await this.db.query<Organization>(
      `INSERT INTO organizations (org_id, name, slug, settings)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [orgId, data.name, data.slug, data.settings || {}]
    );
    return result.rows[0];
  }

  async findById(orgId: string): Promise<Organization | null> {
    const result = await this.db.query<Organization>(
      'SELECT * FROM organizations WHERE org_id = $1',
      [orgId]
    );
    return result.rows[0] || null;
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    const result = await this.db.query<Organization>(
      'SELECT * FROM organizations WHERE slug = $1',
      [slug]
    );
    return result.rows[0] || null;
  }

  async update(orgId: string, data: Partial<Organization>): Promise<Organization | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.settings) {
      updates.push(`settings = $${paramCount++}`);
      values.push(data.settings);
    }

    if (updates.length === 0) {
      return await this.findById(orgId);
    }

    updates.push(`updated_at = NOW()`);
    values.push(orgId);

    const result = await this.db.query<Organization>(
      `UPDATE organizations SET ${updates.join(', ')} WHERE org_id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  async delete(orgId: string): Promise<boolean> {
    const result = await this.db.query(
      'DELETE FROM organizations WHERE org_id = $1',
      [orgId]
    );
    return (result.rowCount || 0) > 0;
  }

  async list(limit: number = 100, offset: number = 0): Promise<Organization[]> {
    const result = await this.db.query<Organization>(
      'SELECT * FROM organizations ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }
}