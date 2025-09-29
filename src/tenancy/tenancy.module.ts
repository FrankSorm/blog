import { Module, Global, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import * as fs from 'fs';

import { TenancyService } from './tenancy.service';
import { TenancyOptions } from './tenant.types';
import { ConnectionRegistry } from './connection.registry';

@Global()
@Module({
  providers: [
    {
      provide: 'TENANCY_OPTIONS',
      useFactory: (): TenancyOptions => {
        const mode = (process.env.TENANCY_MODE || 'single') as 'single' | 'header';
        const headerName = process.env.TENANT_HEADER || 'X-Tenant';
        const cfgPath = process.env.TENANTS_CONFIG || './tenants.json';
        const tenants = fs.existsSync(cfgPath) ? JSON.parse(fs.readFileSync(cfgPath, 'utf-8')) : {};
        return { mode, headerName, tenants };
      },
    },
    {
      provide: TenancyService,
      useFactory: (opts: TenancyOptions, req?: Request) => new TenancyService(opts, req as any),
      inject: ['TENANCY_OPTIONS', REQUEST],
      scope: Scope.REQUEST,
    },
    ConnectionRegistry, // singleton (může být default scope), drží pooly
  ],
  exports: [TenancyService, ConnectionRegistry],
})
export class TenancyModule {}
