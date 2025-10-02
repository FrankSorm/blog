import { Body, Controller, Delete, Get, Param, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@ApiTags('comments')
@Controller({ path: 'comments', version: '1' })
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('article/:articleId')
  list(@Param('articleId') articleId: string, @Req() req: any) {
    return this.commentsService.listByArticle(articleId, req.tenantKey);
  }

  @Post()
  create(
    @Body()
    dto: CreateCommentDto,
    @Req() req: any,
  ) {
    return this.commentsService.create(dto, req.tenantKey);
  }

  @Post(':id/vote')
  vote(@Param('id') id: string, @Body() b: { value: 1 | -1 }, @Req() req: any) {
    const ip = (
      req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.ip ||
      req.connection?.remoteAddress ||
      ''
    ).trim();
    return this.commentsService.vote(id, ip, b.value === 1 ? 1 : -1, req.tenantKey);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.commentsService.delete(id, req.tenantKey);
  }
}
