import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { CommentsResolver } from './comments.resolver';
import { TenantRepoFactory } from '../tenancy/tenant.repo.factory';

@Module({
  providers: [TenantRepoFactory, CommentsService, CommentsResolver],
  controllers: [CommentsController],
  exports: [TenantRepoFactory, CommentsService],
})
export class CommentsModule {}
