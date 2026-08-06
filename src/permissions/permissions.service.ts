import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class PermissionsService {
  constructor(private db: DatabaseService) {}

  async create(name: string) {
    const result = await this.db.query(
      `INSERT INTO auth.permissions (name)
       VALUES ($1) RETURNING *`,
      [name]
    );
    return result.rows[0];
  }

  async findAll() {
    const result = await this.db.query(
      `SELECT * FROM auth.permissions`
    );
    return result.rows;
  }
}