import { Controller, Post, Param, Delete, Body } from '@nestjs/common';
import { RolesService } from './roles.service';

@Controller('roles')
export class RolesController {
  constructor(private service: RolesService) {}

  @Post()
  create(@Body() body: any) {
    return this.service.create(body.name);
  }

  @Post(':id/permissions/:permId')
  addPermission(@Param('id') id: string, @Param('permId') permId: string) {
    return this.service.addPermission(id, permId);
  }

  @Delete(':id/permissions/:permId')
  removePermission(@Param('id') id: string, @Param('permId') permId: string) {
    return this.service.removePermission(id, permId);
  }
}