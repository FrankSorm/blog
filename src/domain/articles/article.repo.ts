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

  listAdmin(query: {
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ items: Article[]; total: number }>;

  update(id: string, patch: Partial<Article>): Promise<Article>;

  softDelete(id: string): Promise<void>;

  addImages(
    id: string,
    images: { id: string; filename: string; url: string; alt?: string }[],
  ): Promise<Article>;

  removeImage(id: string, imageId: string): Promise<Article>;
}
