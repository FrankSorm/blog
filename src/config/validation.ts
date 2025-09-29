import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, validateSync } from 'class-validator';
class EnvironmentVariables {
  @IsEnum(['development','test','production'] as any) NODE_ENV!: 'development'|'test'|'production';
  @IsString() MONGODB_URI!: string;
  @IsString() JWT_SECRET!: string;
  @IsOptional() @IsString() JWT_EXPIRES_IN?: string;
  @IsOptional() @IsNumber() PORT?: number;
}
export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, { enableImplicitConversion: true });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length) throw new Error(errors.toString());
  return validated;
}
