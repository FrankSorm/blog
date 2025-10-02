import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { slugify } from '../common/utils/slugify';
import { randomUUID } from 'crypto';
import { TenantRepoFactory } from '../tenancy/tenant.repo.factory';
import { CreateArticleDto } from './dto/create-article.dto';
import { User } from '../domain/users/user.types';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ListArticlesDto, ListArticlesPublicDto } from './dto/list-articles.dto';

@Injectable()
export class ArticlesService {
  constructor(private readonly factory: TenantRepoFactory) {}

  async create(dto: CreateArticleDto, user: User, tenantKey: string) {
    const repo = await this.factory.articles(tenantKey);
    const base = slugify(dto.title);
    let slug = base;
    let i = 1;
    while (await repo.findBySlugPublic(slug)) slug = base + '-' + i++;
    return repo.create({
      ...dto,
      slug,
      authorId: user.id,
      publishAt: dto.publishAt ? new Date(dto.publishAt) : null,
      images: [],
    });
  }

  async publicFindAll(q: ListArticlesPublicDto, tenantKey: string) {
    const repo = await this.factory.articles(tenantKey);
    const page = Number(q.page ?? 1);
    const limit = Number(q.limit ?? 10);
    return repo.listPublic({ search: q.search, tag: q.tag, category: q.category, page, limit });
  }

  async adminFindAll(q: ListArticlesDto, tenantKey: string) {
    return (await this.factory.articles(tenantKey)).listAdmin({
      page: Number(q.page || 1),
      limit: Number(q.limit || 20),
    });
  }

  async findById(id: string, tenantKey: string) {
    const repo = await this.factory.articles(tenantKey);
    const a = await repo.findById(id);
    if (!a) throw new NotFoundException('Article not found');
    return a;
  }

  async update(id: string, dto: UpdateArticleDto, user: User, tenantKey: string) {
    const repo = await this.factory.articles(tenantKey);
    const article = await this.findById(id, tenantKey);
    if (user.role !== 'admin' && article.authorId !== user.id)
      throw new ForbiddenException('Only own article');
    if (dto.title && dto.title !== article.title) {
      const base = slugify(dto.title);
      let slug = base;
      let i = 1;
      while (await repo.findBySlugPublic(slug)) slug = base + '-' + i++;
      dto.slug = slug;
    }
    return repo.update(id, {
      ...dto,
      publishAt: dto.publishAt ? new Date(dto.publishAt) : article.publishAt,
    });
  }

  async softDelete(id: string, user: User, tenantKey: string) {
    const repo = await this.factory.articles(tenantKey);
    const a = await this.findById(id, tenantKey);
    if (user.role !== 'admin' && a.authorId !== user.id)
      throw new ForbiddenException('Only own article');
    return repo.softDelete(id);
  }

  async addImages(id: string, files: any[], tenantKey: string) {
    const repo = await this.factory.articles(tenantKey);
    const a = await this.findById(id, tenantKey);
    if ((a.images?.length || 0) + files.length > 20)
      throw new ForbiddenException('Max 20 images per article');
    const toAdd = files.map((f) => ({
      id: randomUUID(),
      filename: f.filename,
      url: `/uploads/${tenantKey}/${f.filename}`,
      alt: f.originalname,
    }));
    return repo.addImages(id, toAdd);
  }

  async removeImage(id: string, imageId: string, tenantKey: string) {
    const repo = await this.factory.articles(tenantKey);
    return repo.removeImage(id, imageId);
  }

  async publicList(q: any, tenantKey: string) {
    const repo = await this.factory.articles(tenantKey);
    return repo.listPublic({ ...q, page: Number(q.page || 1), limit: Number(q.limit || 10) });
  }

  async publicBySlug(slug: string, tenantKey: string) {
    const repo = await this.factory.articles(tenantKey);
    return repo.findBySlugPublic(slug);
  }
}
