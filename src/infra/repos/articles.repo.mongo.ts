import { Model } from 'mongoose';
import { ArticlesRepo } from '../../domain/articles/article.repo';
import { Article } from '../../domain/articles/article.types';
import { randomUUID } from 'crypto';

export class MongoArticlesRepo implements ArticlesRepo {
  constructor(private model: Model<any>) {}

  async create(data: Partial<Article>): Promise<Article> {
    const doc = await this.model.create({ ...data, id: randomUUID(), views: 0, deletedAt: null });
    return this.map(doc);
  }

  async findById(id: string) {
    const d = await this.model.findOne({ id }).exec();
    return d ? this.map(d) : null;
  }

  async findBySlugPublic(slug: string) {
    const now = new Date();
    const d = await this.model
      .findOne({
        slug,
        deletedAt: null,
        $or: [{ status: 'published' }, { status: 'scheduled', publishAt: { $lte: now } }],
      })
      .exec();
    return d ? this.map(d) : null;
  }

  async listPublic(q: any) {
    const page = Number(q.page || 1),
      limit = Number(q.limit || 10),
      skip = (page - 1) * limit;
    const filter: any = {
      deletedAt: null,
      $or: [{ status: 'published' }, { status: 'scheduled', publishAt: { $lte: new Date() } }],
    };
    if (q.search) filter.$text = { $search: String(q.search) };
    if (q.tag) filter.tags = String(q.tag);
    if (q.category) filter.categories = String(q.category);
    const items = await this.model
      .find(filter)
      .sort('-publishAt -createdAt')
      .skip(skip)
      .limit(limit)
      .select('-images')
      .exec();
    const total = await this.model.countDocuments(filter);
    return { items: items.map(this.map), total };
  }

  async listAdmin(q: any) {
    const page = Number(q.page || 1),
      limit = Number(q.limit || 20),
      skip = (page - 1) * limit;
    const filter: any = {}; // žádné deletedAt/status filtry pro admin list
    if (q.search) filter.$text = { $search: String(q.search) };
    const items = await this.model
      .find(filter)
      .sort('-publishAt -createdAt')
      .skip(skip)
      .limit(limit)
      .exec();
    const total = await this.model.countDocuments(filter);
    return { items: items.map(this.map), total };
  }

  async update(id: string, patch: Partial<Article>) {
    const d = await this.model.findOneAndUpdate({ id }, { $set: patch }, { new: true }).exec();
    return this.map(d);
  }

  async softDelete(id: string) {
    await this.model.updateOne({ id }, { $set: { deletedAt: new Date() } }).exec();
  }

  async addImages(id: string, images: any[]) {
    const d = await this.model
      .findOneAndUpdate({ id }, { $push: { images: { $each: images } } }, { new: true })
      .exec();
    return this.map(d);
  }

  async removeImage(id: string, imageId: string) {
    const d = await this.model
      .findOneAndUpdate({ id }, { $pull: { images: { id: imageId } } }, { new: true })
      .exec();
    return this.map(d);
  }
  private map = (d: any): Article => ({
    id: d.id,
    title: d.title,
    slug: d.slug,
    content: d.content,
    excerpt: d.excerpt,
    tags: d.tags || [],
    categories: d.categories || [],
    status: d.status,
    publishAt: d.publishAt || null,
    coverImage: d.coverImage || null,
    images: d.images || [],
    views: d.views || 0,
    authorId: d.authorId,
    deletedAt: d.deletedAt || null,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  });
}
