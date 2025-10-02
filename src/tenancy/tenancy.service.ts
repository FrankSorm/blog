import configuration from '../config/configuration';
import { TenantConfig } from './tenant.types';

export class TenancyService {
  private tenantKey: string;
  private tenants: Record<string, any>;
  constructor(private readonly req: any, tenantsJson: any) {
    this.tenants = tenantsJson || {};
    const cfg = configuration();
    if (cfg.tenancy.mode === 'header') {
      const hdr = (cfg.tenancy.header || 'X-Tenant').toLowerCase();
      const key = this.req?.headers?.[hdr];
      this.tenantKey = (Array.isArray(key) ? key[0] : key) || 'default';
    } else {
      this.tenantKey = 'default';
    }
  }
  getTenantKey() { return this.tenantKey; }
  getTenant(): TenantConfig {
    const t = this.tenants[this.tenantKey] || this.tenants['default'];
    if (!t) throw new Error(`Tenant config not found for key=${this.tenantKey}`);
    return { key: this.tenantKey, ...t };
  }
}
