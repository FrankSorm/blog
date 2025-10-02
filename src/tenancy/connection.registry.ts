import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Connection, createConnection } from 'mongoose';
import { DataSource } from 'typeorm';

interface SqlCfg {
  type: 'postgres' | 'mariadb';
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}
interface MongoCfg {
  uri: string;
}

@Injectable()
export class ConnectionRegistry implements OnModuleDestroy {
  private mongo = new Map<string, Connection>();
  private sql = new Map<string, DataSource>();

  async getMongo(tenantKey: string, cfg: MongoCfg): Promise<Connection> {
    if (!cfg?.uri) throw new Error(`Tenant ${tenantKey} has no mongo.uri`);
    if (this.mongo.has(tenantKey)) return this.mongo.get(tenantKey)!;
    const conn = await createConnection(cfg.uri).asPromise();
    this.mongo.set(tenantKey, conn);
    return conn;
  }

  async getSql(tenantKey: string, cfg: SqlCfg): Promise<DataSource> {
    if (!cfg) throw new Error(`Tenant ${tenantKey} has no SQL config`);
    if (this.sql.has(tenantKey)) return this.sql.get(tenantKey)!;
    const ds = new DataSource({
      type: cfg.type,
      host: cfg.host,
      port: cfg.port,
      username: cfg.username,
      password: cfg.password,
      database: cfg.database,
      entities: [__dirname + '/../**/*.entity.{ts,js}'],
      synchronize: true, // DEV only
    });
    await ds.initialize();
    this.sql.set(tenantKey, ds);
    return ds;
  }

  async onModuleDestroy() {
    for (const [, c] of this.mongo) await c.close();
    for (const [, ds] of this.sql) await ds.destroy();
  }
}
