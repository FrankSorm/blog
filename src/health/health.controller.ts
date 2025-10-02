// import { Controller, Get } from '@nestjs/common';

// @Controller('health')
// export class HealthController {
//   @Get()
//   health() {
//     return { ok: true };
//   }
// }

// src/health.controller.ts
import { Controller, Get, Req } from '@nestjs/common';
import { HealthService } from './health.service';
import { Request } from 'express';

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  async healthCheck(@Req() req: Request) {
    const tenantKey = (req as any).tenantKey || 'default';
    const result = await this.health.check(tenantKey);
    return { uptime: process.uptime(), ...result };
  }
}
