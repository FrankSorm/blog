import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CommentsRepo } from '../../domain/comments/comment.repo';
import { Comment as CommentDoc, Vote as VoteDoc } from '../schemas/comment.schema';
import { Comment } from '../../domain/comments/comment.types';

export class MongoCommentsRepo implements CommentsRepo {
  constructor(
    @InjectModel(CommentDoc.name) private commentModel: Model<any>,
    @InjectModel(VoteDoc.name) private voteModel: Model<any>,
  ) {}

  async create(input: {
    articleId: string;
    parentId?: string | null;
    content: string;
    authorName?: string | null;
  }) {
    const doc = await this.commentModel.create({
      articleId: new Types.ObjectId(input.articleId),
      parentId: input.parentId ? new Types.ObjectId(input.parentId) : null,
      content: input.content,
      authorName: input.authorName || null,
    });
    return this.toComment(doc);
  }

  async listByArticle(articleId: string): Promise<Comment[]> {
    const list = await this.commentModel
      .find({ articleId /*deletedAt?:*/ })
      .sort({ createdAt: 1 })
      .exec();
    return list.map(this.toComment);
  }

  async delete(id: string): Promise<void> {
    await this.commentModel.findByIdAndDelete(id).exec(); // (volitelně) kaskádově smazat děti + hlasy
    await this.voteModel.deleteMany({ commentId: id }).exec();
  }

  async vote(commentId: string, ip: string, value: 1 | -1) {
    // upsert hlasu: pokud existuje a stejná hodnota → no-op, pokud jiná → update
    const existing = await this.voteModel.findOne({ commentId, ip }).exec();
    if (!existing) {
      await this.voteModel.create({ commentId, ip, value });
    } else if (existing.value !== value) {
      existing.value = value;
      await existing.save();
    } // else: stejné, nic

    // dopočítej score
    const agg = await this.voteModel.aggregate([
      { $match: { commentId: new Types.ObjectId(commentId) } },
      { $group: { _id: '$commentId', sum: { $sum: '$value' } } },
    ]);
    const score = agg.length ? agg[0].sum : 0;
    const c = await this.commentModel
      .findByIdAndUpdate(commentId, { $set: { score } }, { new: true })
      .exec();
    return {
      comment: this.toComment(c),
      vote: { id: existing?._id?.toString() ?? '', commentId, ip, value, createdAt: new Date() },
    };
  }

  private toComment = (d: any): Comment => ({
    id: d._id.toString(),
    articleId: d.articleId.toString(),
    parentId: d.parentId ? d.parentId.toString() : null,
    content: d.content,
    authorName: d.authorName || null,
    score: d.score || 0,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  });
}
