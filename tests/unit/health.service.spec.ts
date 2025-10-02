import { HealthService } from '../../src/health/health.service';

describe('HealthService', () => {
  const tenants = {
    get: (k: string) =>
      k === 'acme'
        ? {
            dbKind: 'postgres',
            sql: {
              type: 'postgres',
              host: 'x',
              port: 5432,
              username: 'u',
              password: 'p',
              database: 'd',
            },
          }
        : { dbKind: 'mongo', mongo: { uri: 'mongodb://x' } },
  } as any;

  it('SQL ok', async () => {
    const registry = { getSql: async () => ({ query: async () => [{ ok: 1, db: 'd' }] }) } as any;
    const svc = new HealthService(tenants, registry);
    const res = await svc.check('acme');
    expect(res.ok).toBe(true);
    expect(res.dbKind).toBe('postgres');
  });

  it('Mongo ok', async () => {
    const registry = {
      getMongo: async () => ({
        db: { admin: () => ({ command: async () => ({ ok: 1 }) }) },
        host: 'h',
        name: 'db',
      }),
    } as any;
    const svc = new HealthService(tenants, registry);
    const res = await svc.check('default');
    expect(res.ok).toBe(true);
    expect(res.dbKind).toBe('mongo');
  });
});
