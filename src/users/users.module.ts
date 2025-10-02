import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TenantRepoFactory } from '../tenancy/tenant.repo.factory';

@Module({
  providers: [TenantRepoFactory, UsersService],
  controllers: [UsersController],
  exports: [TenantRepoFactory],
})
export class UsersModule {}
