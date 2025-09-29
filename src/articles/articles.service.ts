import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Article, ArticleDocument } from './schemas/article.schema';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { slugify } from '../common/utils/slugify';

@Injectable()
export class ArticlesService {
  constructor(@InjectModel(Article.name) private articleModel: Model<ArticleDocument>) {}
  async create(dto: CreateArticleDto, authorId: string) {
    const slug = await this.generateUniqueSlug(dto.title);
    const article = await this.articleModel.create({
      ...dto,
      slug,
      author: authorId,
      publishAt: dto.publishAt ? new Date(dto.publishAt) : undefined,
    });
    return article;
  }

  async generateUniqueSlug(title: string) {
    const base = slugify(title);
    let slug = base;
    let i = 1;
    while (await this.articleModel.exists({ slug })) slug = base + '-' + i++;
    return slug;
  }

  async findPublic(query: {
    search?: string;
    tag?: string;
    category?: string;
    page?: number;
    limit?: number;
    sort?: string;
  }) {
    var page = query.page ? Number(query.page) : 1;
    var limit = query.limit ? Number(query.limit) : 10;
    var sort = query.sort ? String(query.sort) : '-publishAt -createdAt';
    const filter: FilterQuery<ArticleDocument> = {
      deletedAt: null,
      $or: [{ status: 'published' }, { status: 'scheduled', publishAt: { $lte: new Date() } }],
    };
    if (query.search) (filter as any).$text = { $search: String(query.search) };
    if (query.tag) (filter as any).tags = String(query.tag);
    if (query.category) (filter as any).categories = String(query.category);
    const skip = (page - 1) * limit;
    const items = await this.articleModel
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-images')
      .exec();
    const total = await this.articleModel.countDocuments(filter);
    return { items: items, total: total, page: page, limit: limit };
  }

  async findBySlugPublic(slug: string) {
    const now = new Date();
    const article = await this.articleModel
      .findOne({
        slug: slug,
        deletedAt: null,
        $or: [{ status: 'published' }, { status: 'scheduled', publishAt: { $lte: now } }],
      })
      .populate('author', 'name')
      .exec();
    if (!article) throw new NotFoundException('Article not found');
    article.views += 1;
    await article.save();
    return article;
  }

  async adminFindAll(query: { page?: number; limit?: number; sort?: string; author?: string }) {
    var page = query.page ? Number(query.page) : 1;
    var limit = query.limit ? Number(query.limit) : 20;
    var sort = query.sort ? String(query.sort) : '-createdAt';
    const filter: FilterQuery<ArticleDocument> = {};
    if (query.author) (filter as any).author = String(query.author);
    const skip = (page - 1) * limit;
    const items = await this.articleModel.find(filter).sort(sort).skip(skip).limit(limit);
    const total = await this.articleModel.countDocuments(filter);
    return { items: items, total: total, page: page, limit: limit };
  }

  async findById(id: string) {
    const article = await this.articleModel.findById(id).exec();
    if (!article) throw new NotFoundException('Article not found');
    return article;
  }

  async update(id: string, dto: UpdateArticleDto, user: { sub: string; role: string }) {
    const article = await this.findById(id);
    if (user.role !== 'admin' && String(article.author) !== user.sub)
      throw new ForbiddenException('You can edit only your own articles');
    if (dto.title && dto.title !== article.title)
      article.slug = await this.generateUniqueSlug(dto.title);
    Object.assign(article, {
      ...dto,
      publishAt: dto.publishAt ? new Date(dto.publishAt) : article.publishAt,
    });
    await article.save();
    return article;
  }

  async softDelete(id: string, user: { sub: string; role: string }) {
    const article = await this.findById(id);
    if (user.role !== 'admin' && String(article.author) !== user.sub)
      throw new ForbiddenException('You can delete only your own articles');
    article.deletedAt = new Date();
    await article.save();
    return { deleted: true };
  }

  async addImages(id: string, files: Express.Multer.File[]) {
    const article = await this.findById(id);
    if ((article.images ? article.images.length : 0) + files.length > 20)
      throw new ForbiddenException('Max 20 images per article');
    const toAdd = files.map(function (f) {
      return {
        id: uuidv4(),
        filename: f.filename,
        url: '/uploads/' + f.filename,
        alt: f.originalname,
      };
    });
    article.images = (article.images || []).concat(toAdd);
    await article.save();
    return article.images;
  }

  async removeImage(id: string, imageId: string) {
    const article = await this.findById(id);
    article.images = (article.images || []).filter(function (img) {
      return img.id !== imageId;
    });
    await article.save();
    return article.images;
  }
}
