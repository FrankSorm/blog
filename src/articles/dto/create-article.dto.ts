import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ArticleStatusEnum } from '../../interfaces/article-status.enum';
export class CreateArticleDto {
  @ApiProperty({ example: 'Title' })
  @IsString()
  @MaxLength(140)
  title!: string;

  @ApiProperty({ example: 'Title' })
  @IsString()
  content!: string;

  @ApiProperty({ required: false, example: 'Short perex' })
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiProperty({ type: [String], required: false, example: ['test'] })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiProperty({ type: [String], required: false, example: ['Programming'] })
  @IsOptional()
  @IsArray()
  categories?: string[];

  @ApiProperty({ required: false, enum: ArticleStatusEnum, example: ArticleStatusEnum.draft })
  @IsOptional()
  @IsEnum(ArticleStatusEnum)
  status?: ArticleStatusEnum;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  publishAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  slug?: string;
}
