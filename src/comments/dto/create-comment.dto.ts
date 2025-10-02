import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty()
  @IsString()
  articleId!: string;

  @ApiProperty()
  @IsString()
  authorName!: string;

  @ApiProperty()
  @IsString()
  parentId!: string | null;

  @ApiProperty()
  @IsString()
  content!: string;
}
