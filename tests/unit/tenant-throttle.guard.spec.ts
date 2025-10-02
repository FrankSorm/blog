import { ExecutionContext } from '@nestjs/common';
import { TenantThrottlerGuard } from '../../src/common/guards/tenant-throttle.guard';

function ctx(tenantKey: string, ip = '1.2.3.4'): ExecutionContext {
  const req = { ip, tenantKey };
  const handler = () => {};
  const klass = function Klass() {};
  return {
    switchToHttp: () => ({ getRequest: () => req }) as any,
    getHandler: () => handler,
    getClass: () => klass as any,
  } as any;
}

describe('TenantThrottlerGuard', () => {
  it('generuje klíč s tenantem a IP', () => {
    const g = new (TenantThrottlerGuard as any)();
    const key = g.generateKey(ctx('acme'), '1');
    expect(key).toContain('acme:1.2.3.4');
  });
});
