// src/health.service.ts
import { Injectable } from '@nestjs/common';
import { TenantsStore } from '../tenancy/tenants.store';
import { ConnectionRegistry } from '../tenancy/connection.registry';

@Injectable()
export class HealthService {
  constructor(
    private readonly tenants: TenantsStore,
    private readonly registry: ConnectionRegistry,
  ) {}

  async check(tenantKey?: string) {
    const key = tenantKey || 'default';
    const t = this.tenants.get(key);
    if (!t) return { ok: false, tenant: key, error: `Tenant '${key}' not found` };

    try {
      if (t.dbKind === 'mongo') {
        const conn = await this.registry.getMongo(key, t.mongo);
        const res = await conn.db?.admin().command({ ping: 1 });
        return {
          ok: res?.ok === 1,
          tenant: key,
          dbKind: 'mongo',
          details: { host: conn.host, name: conn.name },
        };
      }

      // SQL ping – vynutíme integer a vytáhneme i current_database()
      const ds = await this.registry.getSql(key, t.sql);
      const rows = await ds.query('SELECT 1::int AS ok, current_database() AS db');
      const okNum = Number(rows?.[0]?.ok ?? 0);
      return {
        ok: okNum === 1,
        tenant: key,
        dbKind: t.sql.type,
        details: { db: rows?.[0]?.db, host: t.sql.host },
      };
    } catch (e: any) {
      // ať v odpovědi vidíš konkrétní problém
      return {
        ok: false,
        tenant: key,
        dbKind: t.dbKind,
        error: e?.message || String(e),
      };
    }
  }
}
