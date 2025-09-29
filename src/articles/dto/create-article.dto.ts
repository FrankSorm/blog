import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateArticleDto {
  @ApiProperty()
  @IsString()
  @MaxLength(140)
  title!: string;

  @ApiProperty()
  @IsString()
  content!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  categories?: string[];

  @ApiProperty({ required: false, enum: ['draft', 'published', 'scheduled'] })
  @IsOptional()
  @IsEnum(['draft', 'published', 'scheduled'] as any)
  status?: 'draft' | 'published' | 'scheduled';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  publishAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  coverImage?: string;
}
