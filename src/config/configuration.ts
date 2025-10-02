export default () => ({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  jwt: { secret: process.env.JWT_SECRET, expiresIn: process.env.JWT_EXPIRES_IN || '1d' },
  corsOrigin: (process.env.CORS_ORIGIN || '*').split(',').map(s => s.trim()),
  tenancy: {
    mode: (process.env.TENANCY_MODE || 'header') as 'single'|'header',
    header: process.env.TENANT_HEADER || 'X-Tenant',
    tenantsPath: process.env.TENANTS_CONFIG || './tenants.json'
  },
  graphqlPlayground: process.env.GRAPHQL_PLAYGROUND === 'true'
});
