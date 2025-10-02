import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class TenantThrottlerGuard extends ThrottlerGuard {
  protected override generateKey(context: ExecutionContext, suffix: string): string {
    const req = context.switchToHttp().getRequest();
    const tenant = (req && req.tenantKey) || 'default';
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    return `${tenant}:${ip}:${context.getClass().name}-${context.getHandler().name}-${suffix}`;
  }
}
