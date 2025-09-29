import { Inject, Injectable } from '@nestjs/common';
import { CommentsRepo } from '../domain/comments/comment.repo';
import { PubSub } from 'graphql-subscriptions';

export const pubsub = new PubSub();

@Injectable()
export class CommentsService {
  // constructor(private readonly commentsRepo: CommentsRepo) {}
  constructor(@Inject('CommentsRepo') private readonly commentsRepo: CommentsRepo) {}

  async create(input: {
    articleId: string;
    parentId?: string | null;
    content: string;
    authorName?: string | null;
  }) {
    const c = await this.commentsRepo.create(input);
    await pubsub.publish('commentCreated', { commentCreated: c });
    return c;
  }

  listByArticle(articleId: string) {
    return this.commentsRepo.listByArticle(articleId);
  }

  async vote(commentId: string, ip: string, value: 1 | -1) {
    const res = await this.commentsRepo.vote(commentId, ip, value);
    await pubsub.publish('commentVoted', { commentVoted: res.comment });
    return res;
  }

  async delete(id: string) {
    return this.commentsRepo.delete(id);
  }
}
