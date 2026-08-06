import { Controller, Post, Get, Param, Body, Delete } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private service: UsersService) {}

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Get(':id')
  find(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post(':id/roles/:roleId')
  addRole(@Param('id') id: string, @Param('roleId') roleId: string) {
    return this.service.addRole(id, roleId);
  }

  @Delete(':id/roles/:roleId')
  removeRole(@Param('id') id: string, @Param('roleId') roleId: string) {
    return this.service.removeRole(id, roleId);
  }
}