import {
  Resolver,
  Query,
  Args,
  Mutation,
  Subscription,
  ObjectType,
  Field,
  ID,
  Context,
} from '@nestjs/graphql';
import { CommentsService, pubsub } from './comments.service';

@ObjectType()
class GqlComment {
  @Field(() => ID) id!: string;
  @Field() articleId!: string;
  @Field({ nullable: true }) parentId?: string;
  @Field() content!: string;
  @Field({ nullable: true }) authorName?: string;
  @Field() score!: number;
  @Field() createdAt!: Date;
  @Field() updatedAt!: Date;
}

@Resolver(() => GqlComment)
export class CommentsResolver {
  constructor(private readonly commentService: CommentsService) {}

  @Query(() => [GqlComment], { description: 'List comments for article (flat)' })
  commentsByArticle(@Args('articleId') articleId: string, @Context() ctx: any) {
    return this.commentService.listByArticle(articleId, ctx.tenantKey);
  }

  @Mutation(() => GqlComment, { description: 'Create a comment (or reply via parentId)' })
  createComment(
    @Args('articleId') articleId: string,
    @Args('content') content: string,
    @Args('authorName') authorName: string,
    @Args('parentId', { nullable: true }) parentId?: string,
    @Context() ctx?: any,
  ) {
    return this.commentService.create(
      {
        articleId,
        parentId: parentId ?? null,
        content,
        authorName,
      },
      ctx.tenantKey,
    );
  }

  @Mutation(() => GqlComment, { description: 'Vote for a comment (+1 or -1), per-IP unique' })
  async voteComment(
    @Args('commentId') commentId: string,
    @Args('value') value: number,
    @Context() ctx?: any,
  ) {
    const { comment } = await this.commentService.vote(
      commentId,
      'graphql-ctx',
      value === 1 ? 1 : -1,
      ctx.tenantKey,
    );
    return comment;
  }

  @Subscription(() => GqlComment, {
    filter: (payload, _vars, ctx) => payload.tenantKey === ctx.tenantKey, // tenant-isolated
  })
  commentVoted() {
    return pubsub.asyncIterator('commentVoted');
  }
}
