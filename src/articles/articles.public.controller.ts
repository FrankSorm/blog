import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ArticlesService } from './articles.service';

@ApiTags('articles-public')
@Controller({ path: 'articles', version: '1' })
export class ArticlesPublicController {
  constructor(private readonly service: ArticlesService) {}

  @Get() list(@Query() query: any) {
    return this.service.findPublic(query);
  }

  @Get(':slug') detail(@Param('slug') slug: string) {
    return this.service.findBySlugPublic(slug);
  }
}
