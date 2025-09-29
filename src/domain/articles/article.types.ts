export interface ArticleImage {
  id: string;
  filename: string;
  url: string; // /uploads/<tenant>/<filename>
  alt?: string;
}

export type ArticleStatus = 'draft' | 'published' | 'scheduled';

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  tags: string[];
  categories: string[];
  status: ArticleStatus;
  publishAt?: Date | null;
  coverImage?: string | null;
  images: ArticleImage[];
  views: number;
  authorId: string;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
