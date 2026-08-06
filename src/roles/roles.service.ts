import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class RolesService {
  constructor(private db: DatabaseService) {}

  async create(name: string) {
    const result = await this.db.query(
      `INSERT INTO auth.roles (name)
       VALUES ($1) RETURNING *`,
      [name]
    );
    return result.rows[0];
  }

  async addPermission(roleId: string, permId: string) {
    await this.db.query(
      `INSERT INTO auth.role_permissions (role_id, permission_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [roleId, permId]
    );
  }

  async removePermission(roleId: string, permId: string) {
    await this.db.query(
      `DELETE FROM auth.role_permissions
       WHERE role_id = $1 AND permission_id = $2`,
      [roleId, permId]
    );
  }
}