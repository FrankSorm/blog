import { Injectable } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { TenantRepoFactory } from '../tenancy/tenant.repo.factory';
import { CreateCommentDto } from './dto/create-comment.dto';

export const pubsub = new PubSub();

@Injectable()
export class CommentsService {
  constructor(private readonly factory: TenantRepoFactory) {}

  async create(dto: CreateCommentDto, tenantKey: string) {
    const repo = await this.factory.comments(tenantKey);

    return repo.create(dto);
  }

  async listByArticle(articleId: string, tenantKey: string) {
    const repo = await this.factory.comments(tenantKey);
    return repo.listByArticle(articleId);
  }

  async vote(commentId: string, ip: string, value: 1 | -1, tenantKey: string) {
    const repo = await this.factory.comments(tenantKey);
    const res = await repo.vote(commentId, ip, value);
    await pubsub.publish('commentVoted', { commentVoted: res.comment });
    return res;
  }

  async delete(id: string, tenantKey: string) {
    const repo = await this.factory.comments(tenantKey);

    return repo.delete(id);
  }
}
