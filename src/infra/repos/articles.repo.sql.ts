import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { ArticlesRepo } from '../../domain/articles/article.repo';
import { Article } from '../../domain/articles/article.types';
import { ArticleEntity, ArticleImageEntity } from '../sql/article.entity';

export class SqlArticlesRepo implements ArticlesRepo {
  private repo = this.dataSource.getRepository(ArticleEntity);
  private img = this.dataSource.getRepository(ArticleImageEntity);

  constructor(private dataSource: DataSource) {}

  async create(data: Partial<Article>): Promise<Article> {
    const a = await this.repo.save(
      this.repo.create({ ...data, id: randomUUID(), views: 0, deletedAt: null }),
    );
    return this.map(a, []);
  }

  async findById(id: string) {
    const a = await this.repo.findOne({ where: { id } });
    if (!a) return null;
    const imgs = await this.img.find({ where: { articleId: id } });
    return this.map(a, imgs);
  }

  async findBySlugPublic(slug: string) {
    const a = await this.repo.findOne({ where: { slug } });
    if (!a) return null;
    if (a.deletedAt) return null;
    const now = new Date();
    if (
      !(a.status === 'published' || (a.status === 'scheduled' && a.publishAt && a.publishAt <= now))
    )
      return null;
    const imgs = await this.img.find({ where: { articleId: a.id } });
    return this.map(a, imgs);
  }

  async listPublic(q: any) {
    const page = Number(q.page || 1),
      limit = Number(q.limit || 10),
      skip = (page - 1) * limit;
    const qb = this.repo
      .createQueryBuilder('a')
      .where('a.deletedAt IS NULL')
      .andWhere("(a.status = 'published' OR (a.status = 'scheduled' AND a.publishAt <= now()))")
      .orderBy('COALESCE(a.publishAt, a.createdAt)', 'DESC')
      .offset(skip)
      .limit(limit);
    if (q.tag)
      qb.andWhere(":tag = ANY(string_to_array(COALESCE(a.tags, ''), ','))", { tag: q.tag });
    const [rows, total] = await qb.getManyAndCount();
    return { items: rows.map((r) => this.map(r, [])), total };
  }

  async listAdmin(q: any) {
    const page = Number(q.page || 1),
      limit = Number(q.limit || 20),
      skip = (page - 1) * limit;
    const qb = this.repo
      .createQueryBuilder('a')
      .orderBy('COALESCE(a.publishAt, a.createdAt)', 'DESC')
      .offset(skip)
      .limit(limit);
    if (q.search) qb.andWhere('(a.title ILIKE :s OR a.content ILIKE :s)', { s: `%${q.search}%` });
    const [rows, total] = await qb.getManyAndCount();
    return { items: rows.map((r) => this.map(r, [])), total };
  }

  async update(id: string, patch: Partial<Article>) {
    await this.repo.update({ id }, patch as any);
    const a = await this.repo.findOneBy({ id });
    const imgs = await this.img.find({ where: { articleId: id } });
    return this.map(a!, imgs);
  }

  async softDelete(id: string) {
    await this.repo.update({ id }, { deletedAt: new Date() } as any);
  }

  async addImages(id: string, images: any[]) {
    for (const i of images) await this.img.save(this.img.create({ ...i, articleId: id }));
    const a = await this.repo.findOneBy({ id });
    const imgs = await this.img.find({ where: { articleId: id } });
    return this.map(a!, imgs);
  }

  async removeImage(id: string, imageId: string) {
    await this.img.delete({ id: imageId });
    const a = await this.repo.findOneBy({ id });
    const imgs = await this.img.find({ where: { articleId: id } });
    return this.map(a!, imgs);
  }

  private map = (e: ArticleEntity, imgs: ArticleImageEntity[]): Article => ({
    id: e.id,
    title: e.title,
    slug: e.slug,
    content: e.content,
    excerpt: e.excerpt || undefined,
    tags: e.tags ? e.tags.filter(Boolean) : [],
    categories: e.categories ? e.categories.filter(Boolean) : [],
    status: e.status,
    publishAt: e.publishAt,
    coverImage: e.coverImage,
    images: imgs.map((i) => ({
      id: i.id,
      filename: i.filename,
      url: i.url,
      alt: i.alt || undefined,
    })),
    views: e.views,
    authorId: e.authorId,
    deletedAt: e.deletedAt || undefined,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  });
}
