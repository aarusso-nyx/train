import { Controller, Post, Get, Body } from '@nestjs/common';
import { PermissionsService } from './permissions.service';

@Controller('permissions')
export class PermissionsController {
  constructor(private service: PermissionsService) {}

  @Post()
  create(@Body() body: any) {
    return this.service.create(body.name);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }
}