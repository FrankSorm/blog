import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Connection, createConnection as createMongooseConn } from 'mongoose';
import { DataSource } from 'typeorm';
import { TenancyService } from './tenancy.service';
import { TenantConfig } from './tenant.types';

@Injectable()
export class ConnectionRegistry implements OnModuleDestroy {
  private mongo = new Map<string, Connection>();
  private sql = new Map<string, DataSource>();

  constructor(private readonly tenancy: TenancyService) {}

  getTenant(): TenantConfig {
    return this.tenancy.getTenant();
  }

  async getMongo(): Promise<Connection> {
    const t = this.getTenant();
    if (!t.mongo?.uri) throw new Error(`Tenant ${t.key} nemá mongo.uri`);
    const key = t.key;
    if (this.mongo.has(key)) return this.mongo.get(key)!;
    const conn = await createMongooseConn(t.mongo.uri).asPromise();
    this.mongo.set(key, conn);
    return conn;
  }

  async getSql(): Promise<DataSource> {
    const t = this.getTenant();
    if (!t.sql) throw new Error(`Tenant ${t.key} nemá sql konfiguraci`);
    const key = t.key;
    if (this.sql.has(key)) return this.sql.get(key)!;
    const ds = new DataSource({
      type: t.sql.type,
      host: t.sql.host,
      port: t.sql.port,
      username: t.sql.username,
      password: t.sql.password,
      database: t.sql.database,
      entities: [
        /* sem přidej entity Users/Articles/Comments/Votes */
      ],
      synchronize: true, // DEV only
    });
    await ds.initialize();
    this.sql.set(key, ds);
    return ds;
  }

  async onModuleDestroy() {
    for (const [, c] of this.mongo) await c.close();
    for (const [, ds] of this.sql) await ds.destroy();
  }
}
