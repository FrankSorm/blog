import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Article, ArticleSchema } from './schemas/article.schema';
import { ArticlesService } from './articles.service';
import { ArticlesAdminController } from './articles.controller';
import { ArticlesPublicController } from './articles.public.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Article.name, schema: ArticleSchema }])],
  providers: [ArticlesService],
  controllers: [ArticlesAdminController, ArticlesPublicController],
  exports: [ArticlesService],
})
export class ArticlesModule {}
