import { Body, Controller, Delete, Get, Param, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CommentsService } from './comments.service';

@ApiTags('comments')
@Controller({ path: 'comments', version: '1' })
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('article/:articleId')
  list(@Param('articleId') articleId: string) {
    return this.commentsService.listByArticle(articleId);
  }

  @Post()
  create(
    @Body()
    dto: {
      articleId: string;
      parentId?: string | null;
      content: string;
      authorName?: string | null;
    },
  ) {
    return this.commentsService.create(dto);
  }

  @Post(':id/vote')
  vote(@Param('id') id: string, @Body() dto: { value: 1 | -1 }, @Req() req: any) {
    const ip = (
      req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.ip ||
      req.connection?.remoteAddress ||
      ''
    ).trim();
    return this.commentsService.vote(id, ip, dto.value);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.commentsService.delete(id);
  }
}
