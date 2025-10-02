import { Injectable, NestMiddleware } from '@nestjs/common';
import { TenancyService } from './tenancy.service';
import * as fs from 'fs';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenancy: TenancyService) {}
  use(req: any, _res: any, next: () => void) {
    const t = this.tenancy.getTenant();
    req.tenantKey = t.key;
    const dir = `./uploads/${t.key}`;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    next();
  }
}
