import { Injectable } from '@nestjs/common';
import { TenancyOptions, TenantConfig } from './tenant.types';

@Injectable()
export class TenancyService {
  private tenantKey: string;
  constructor(
    private readonly opts: TenancyOptions,
    private readonly req?: any,
  ) {
    this.tenantKey = this.resolveTenantKey();
  }

  private resolveTenantKey(): string {
    if (this.opts.mode === 'header') {
      const key = this.req?.headers?.[this.opts.headerName?.toLowerCase() || 'x-tenant'];
      return (Array.isArray(key) ? key[0] : key) || 'default';
    }
    return 'default';
  }

  getTenantKey() {
    return this.tenantKey;
  }

  getTenant(): TenantConfig {
    const tenant = this.opts.tenants[this.tenantKey] || this.opts.tenants['default'];
    if (!tenant) throw new Error(`Tenant config not found for key=${this.tenantKey}`);
    return tenant;
  }
}
