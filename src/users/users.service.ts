import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private db: DatabaseService) {}

  async create(data: any) {
    const hash = await bcrypt.hash(data.password, 10);

    const result = await this.db.query(
      `INSERT INTO auth.users (username, fullname, email, password)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [data.username, data.fullname, data.email, hash]
    );

    return result.rows[0];
  }

  async findById(id: string) {
    const result = await this.db.query(
      `
      SELECT 
        u.username,
        ARRAY_AGG(DISTINCT r.name) AS roles,
        ARRAY_AGG(DISTINCT p.name) AS permissions
      FROM auth.users u
      LEFT JOIN auth.user_roles ur ON ur.user_id = u.id
      LEFT JOIN auth.roles r ON r.id = ur.role_id
      LEFT JOIN auth.role_permissions rp ON rp.role_id = r.id
      LEFT JOIN auth.permissions p ON p.id = rp.permission_id
      WHERE u.id = $1
      GROUP BY u.id
      `,
      [id]
    );

    return result.rows[0];
  }

  async addRole(userId: string, roleId: string) {
    await this.db.query(
      `INSERT INTO auth.user_roles (user_id, role_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [userId, roleId]
    );
  }

  async removeRole(userId: string, roleId: string) {
    await this.db.query(
      `DELETE FROM auth.user_roles
       WHERE user_id = $1 AND role_id = $2`,
      [userId, roleId]
    );
  }
}