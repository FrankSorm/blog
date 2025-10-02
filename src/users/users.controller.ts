import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'admin/users', version: '1' })
export class UsersController {
  constructor(private readonly users: UsersService) {}
  @Get()
  list(@Req() req: any) {
    return this.users.list(req.tenantKey);
  }

  @Post()
  create(@Body() dto: CreateUserDto, @Req() req: any) {
    return this.users.createByAdmin(dto, req.tenantKey);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @Req() req: any) {
    return this.users.update(id, dto, req.tenantKey);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.users.remove(id, req.tenantKey);
  }
}
