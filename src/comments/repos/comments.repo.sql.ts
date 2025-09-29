import { DataSource, Repository } from 'typeorm';
import { CommentsRepo } from '../../domain/comments/comment.repo';
import { Comment, Vote } from '../../domain/comments/comment.types';
import { CommentEntity, VoteEntity } from '../entities/comment.entity';

export class SqlCommentsRepo implements CommentsRepo {
  private comments: Repository<CommentEntity>;
  private votes: Repository<VoteEntity>;
  constructor(ds: DataSource) {
    this.comments = ds.getRepository(CommentEntity);
    this.votes = ds.getRepository(VoteEntity);
  }

  async create(input: {
    articleId: string;
    parentId?: string | null;
    content: string;
    authorName?: string | null;
  }): Promise<Comment> {
    const e = await this.comments.save(
      this.comments.create({
        articleId: input.articleId,
        parentId: input.parentId ?? null,
        content: input.content,
        authorName: input.authorName ?? null,
      }),
    );
    return this.toComment(e);
  }

  async listByArticle(articleId: string): Promise<Comment[]> {
    const rows = await this.comments.find({ where: { articleId }, order: { createdAt: 'ASC' } });
    return rows.map(this.toComment);
  }

  async delete(id: string): Promise<void> {
    await this.votes.delete({ commentId: id });
    await this.comments.delete({ id });
  }

  async vote(commentId: string, ip: string, value: 1 | -1) {
    const existing = await this.votes.findOne({ where: { commentId, ip } });
    if (!existing) {
      await this.votes.save(this.votes.create({ commentId, ip, value }));
    } else if (existing.value !== value) {
      existing.value = value;
      await this.votes.save(existing);
    }
    const sum = (await this.votes
      .createQueryBuilder('v')
      .select('COALESCE(SUM(v.value),0)', 'score')
      .where('v.commentId = :commentId', { commentId })
      .getRawOne<{ score: string }>()) || { score: '0' };
    const score = parseInt(sum.score, 10) || 0;
    const updated = await this.comments.save({ id: commentId, score });
    return {
      comment: this.toComment(updated),
      vote: { id: existing?.id ?? '', commentId, ip, value, createdAt: new Date() },
    };
  }

  private toComment = (e: CommentEntity): Comment => ({
    id: e.id,
    articleId: e.articleId,
    parentId: e.parentId,
    content: e.content,
    authorName: e.authorName,
    score: e.score,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  });
}
