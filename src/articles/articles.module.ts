import { Module } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ArticlesAdminController } from './articles.controller';
import { ArticlesPublicController } from './articles.public.controller';
import { TenantRepoFactory } from '../tenancy/tenant.repo.factory';

@Module({
  providers: [TenantRepoFactory, ArticlesService],
  controllers: [ArticlesAdminController, ArticlesPublicController],
  exports: [TenantRepoFactory, ArticlesService],
})
export class ArticlesModule {}
