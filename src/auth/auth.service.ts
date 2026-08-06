import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private db: DatabaseService) {}

  async login(username: string, password: string) {
    const result = await this.db.query(
      `SELECT * FROM auth.users WHERE username = $1`,
      [username]
    );

    const user = result.rows[0];

    if (!user) return { ok: false };

    const match = await bcrypt.compare(password, user.password);

    return { ok: match };
  }
}