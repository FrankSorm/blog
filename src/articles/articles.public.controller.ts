import { Controller, Get, Param, Query, Req } from '@nestjs/common';

import { ApiTags } from '@nestjs/swagger';
import { ArticlesService } from './articles.service';
import { ListArticlesPublicDto } from './dto/list-articles.dto';
@ApiTags('articles-public')
@Controller({ path: 'articles', version: '1' })
export class ArticlesPublicController {
  constructor(private readonly service: ArticlesService) {}
  @Get()
  list(@Query() query: ListArticlesPublicDto, @Req() req: any) {
    return this.service.publicList(query, req.tenantKey);
  }

  @Get(':slug')
  detail(@Param('slug') slug: string, @Req() req: any) {
    return this.service.publicBySlug(slug, req.tenantKey);
  }
}
