import { Module } from '@nestjs/common';

import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    AuthModule,
  ],
})
export class AppModule {}