import { plainToInstance } from 'class-transformer';
import { IsEnum, IsOptional, IsString, validateSync } from 'class-validator';

class EnvVars {
  @IsEnum(['development','test','production'] as any) NODE_ENV!: string;
  @IsString() JWT_SECRET!: string;
  @IsOptional() @IsString() JWT_EXPIRES_IN?: string;
  @IsOptional() @IsString() PORT?: string;
  @IsString() TENANCY_MODE!: string;
  @IsString() TENANT_HEADER!: string;
  @IsString() TENANTS_CONFIG!: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvVars, config, { enableImplicitConversion: true });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length) throw new Error(errors.toString());
  return validated;
}
