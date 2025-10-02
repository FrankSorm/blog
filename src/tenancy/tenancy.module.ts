import { Module, Global, Scope, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import * as fs from 'fs';
import configuration from '../config/configuration';
import { TenancyService } from './tenancy.service';
import { ConnectionRegistry } from './connection.registry';
import { TenantMiddleware } from './tenant.middleware';
import { TenantsStore } from './tenants.store';
import { TenantRepoFactory } from './tenant.repo.factory';

@Global()
@Module({
  providers: [
    {
      provide: 'TENANTS_CONFIG',
      useFactory: () => {
        const cfg = configuration();
        const path = cfg.tenancy.tenantsPath;
        return fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, 'utf-8')) : {};
      },
    },
    {
      provide: TenancyService,
      useFactory: (req: any, tenants: any) => new TenancyService(req, tenants),
      inject: [REQUEST, 'TENANTS_CONFIG'],
      scope: Scope.REQUEST,
    },
    TenantsStore,
    ConnectionRegistry,
    TenantRepoFactory,
  ],
  exports: [TenantsStore, ConnectionRegistry, TenantRepoFactory], // ⬅ exportuj singletony
})
export class TenancyModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
