import { Article } from './article.types';

export interface ArticlesRepo {
  create(data: Partial<Article>): Promise<Article>;

  findById(id: string): Promise<Article | null>;

  findBySlugPublic(slug: string): Promise<Article | null>;

  listPublic(query: {
    search?: string;
    tag?: string;
    category?: string;
    page: number;
    limit: number;
  }): Promise<{ items: Article[]; total: number }>;

  update(id: string, patch: Partial<Article>): Promise<Article>;

  softDelete(id: string): Promise<void>;
}
