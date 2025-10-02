import { Module } from '@nestjs/common';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { TenantThrottlerGuard } from './guards/tenant-throttle.guard';
import { HttpExceptionFilter } from './filters/http-exception.filter';

@Module({
  providers: [
    { provide: APP_GUARD, useClass: TenantThrottlerGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter }
  ],
})
export class CommonModule {}
