import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ListArticlesDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  @MaxLength(140)
  sort?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  authorId?: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsString()
  limit?: string;
}

export class ListArticlesPublicDto {
  @ApiProperty()
  @IsString()
  @MaxLength(140)
  search!: string;

  @ApiProperty()
  @IsString()
  tag!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsString()
  limit?: string;
}
