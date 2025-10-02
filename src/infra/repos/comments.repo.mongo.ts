import { Model } from 'mongoose';
import { CommentsRepo } from '../../domain/comments/comment.repo';
import { Comment } from '../../domain/comments/comment.types';
import { randomUUID } from 'crypto';

export class MongoCommentsRepo implements CommentsRepo {
  constructor(
    private commentModel: Model<any>,
    private voteModel: Model<any>,
  ) {}
  async create(input: {
    articleId: string;
    parentId?: string | null;
    content: string;
    authorName?: string | null;
  }) {
    const doc = await this.commentModel.create({
      id: randomUUID(),
      articleId: input.articleId,
      parentId: input.parentId ?? null,
      content: input.content,
      authorName: input.authorName ?? null,
      score: 0,
    });
    return this.map(doc);
  }
  async listByArticle(articleId: string): Promise<Comment[]> {
    const arr = await this.commentModel.find({ articleId }).sort({ createdAt: 1 }).exec();
    return arr.map(this.map);
  }
  async delete(id: string): Promise<void> {
    await this.voteModel.deleteMany({ commentId: id }).exec();
    await this.commentModel.deleteOne({ id }).exec();
  }
  async vote(commentId: string, ip: string, value: 1 | -1) {
    const ex = await this.voteModel.findOne({ commentId, ip }).exec();
    const id = randomUUID();

    if (!ex) await this.voteModel.create({ id, commentId, ip, value });
    else if (ex.value !== value) {
      ex.value = value;
      await ex.save();
    }
    const agg = await this.voteModel.aggregate([
      { $match: { commentId } },
      { $group: { _id: '$commentId', sum: { $sum: '$value' } } },
    ]);
    const score = agg.length ? agg[0].sum : 0;
    const c = await this.commentModel
      .findOneAndUpdate({ id: commentId }, { $set: { score } }, { new: true })
      .exec();
    return {
      comment: this.map(c),
      vote: { id: ex?.id || id, commentId, ip, value, createdAt: new Date() },
    };
  }
  private map = (d: any): Comment => ({
    id: d.id,
    articleId: d.articleId,
    parentId: d.parentId || null,
    content: d.content,
    authorName: d.authorName || null,
    score: d.score || 0,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  });
}
