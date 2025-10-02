import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ required: true })
  @IsString()
  email: string = '';

  @ApiProperty({ required: true })
  @IsString()
  name: string = '';

  @ApiProperty({ required: true, enum: ['user', 'admin'] })
  @IsEnum(['user', 'admin'] as any)
  role: 'user' | 'admin' = 'user';

  @ApiProperty({ required: true })
  @IsString()
  @MinLength(8)
  password: string = 'ChangeMePlease!';
}
