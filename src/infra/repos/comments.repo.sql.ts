import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { CommentsRepo } from '../../domain/comments/comment.repo';
import { Comment } from '../../domain/comments/comment.types';
import { CommentEntity, VoteEntity } from '../sql/comment.entity';

export class SqlCommentsRepo implements CommentsRepo {
  private comments = this.ds.getRepository(CommentEntity);
  private votes = this.ds.getRepository(VoteEntity);
  constructor(private ds: DataSource) {}

  async create(input: {
    articleId: string;
    parentId?: string | null;
    content: string;
    authorName?: string | null;
  }) {
    const e = await this.comments.save(
      this.comments.create({
        id: randomUUID(),
        articleId: input.articleId,
        parentId: input.parentId ?? null,
        content: input.content,
        authorName: input.authorName ?? null,
        score: 0,
      }),
    );
    return this.map(e);
  }

  async listByArticle(articleId: string): Promise<Comment[]> {
    const rows = await this.comments.find({ where: { articleId }, order: { createdAt: 'ASC' } });
    return rows.map(this.map);
  }

  async delete(id: string): Promise<void> {
    await this.votes.delete({ commentId: id });
    await this.comments.delete({ id });
  }

  async vote(commentId: string, ip: string, value: 1 | -1) {
    const ex = await this.votes.findOne({ where: { commentId, ip } });
    const id = randomUUID();
    if (!ex) await this.votes.save(this.votes.create({ id, commentId, ip, value }));
    else if (ex.value !== value) {
      ex.value = value;
      await this.votes.save(ex);
    }
    const sum = (await this.votes
      .createQueryBuilder('v')
      .select('COALESCE(SUM(v.value),0)', 'score')
      .where('v.commentId = :id', { id: commentId })
      .getRawOne<{ score: string }>()) || { score: '0' };
    const score = parseInt(sum.score, 10) || 0;
    const updated = await this.comments.save({ id: commentId, score });
    return {
      comment: this.map(updated),
      vote: { id: ex?.id || id, commentId, ip, value, createdAt: new Date() },
    };
  }

  private map = (e: CommentEntity): Comment => ({
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
