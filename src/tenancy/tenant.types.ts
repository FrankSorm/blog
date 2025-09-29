export type DbKind = 'mongo' | 'postgres' | 'mariadb';

export interface TenantConfig {
  key: string;
  dbKind: DbKind;
  mongo?: { uri: string };
  sql?: {
    type: 'postgres' | 'mariadb';
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };
}

export interface TenancyOptions {
  mode: 'single' | 'header';
  headerName?: string;
  tenants: Record<string, TenantConfig>;
}
