export type DbKind = 'mongo' | 'postgres' | 'mariadb';

export interface TenantRateLimit { ttl: number; limit: number; }

export interface TenantConfig {
  key: string;
  dbKind: DbKind;
  rateLimit: TenantRateLimit;
  mongo?: { uri: string };
  sql?: { type: 'postgres'|'mariadb', host: string, port: number, username: string, password: string, database: string };
}
