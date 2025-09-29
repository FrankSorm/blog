import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ArticlesService } from '../src/articles/articles.service';
import { Article } from '../src/articles/schemas/article.schema';

describe('ArticlesService', () => {
  let service: ArticlesService;
  let model: Model<any>;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ArticlesService, { provide: getModelToken(Article.name), useValue: Model }],
    }).compile();
    service = module.get<ArticlesService>(ArticlesService);
    model = module.get<Model<any>>(getModelToken(Article.name));
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(model).toBeDefined();
  });
});
