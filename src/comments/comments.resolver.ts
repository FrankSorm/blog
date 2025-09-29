import {
  Resolver,
  Query,
  Args,
  Mutation,
  Subscription,
  ObjectType,
  Field,
  ID,
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
  constructor(private readonly svc: CommentsService) {}

  /**
   * Vrátí komentáře k článku v chronologickém pořadí.
   */
  @Query(() => [GqlComment], { description: 'List comments for a given article (flat list)' })
  commentsByArticle(@Args('articleId') articleId: string) {
    return this.svc.listByArticle(articleId);
  }

  /**
   * Vytvoří komentář nebo odpověď (pokud předán parentId).
   */
  @Mutation(() => GqlComment, { description: 'Create a comment (optionally reply via parentId)' })
  createComment(
    @Args('articleId') articleId: string,
    @Args('content') content: string,
    @Args('parentId', { nullable: true }) parentId?: string,
    @Args('authorName', { nullable: true }) authorName?: string,
  ) {
    return this.svc.create({
      articleId,
      content,
      parentId: parentId ?? null,
      authorName: authorName ?? null,
    });
  }

  /**
   * Hlasování: value = +1 nebo -1. Per-IP enforced na úrovni úložiště.
   */
  @Mutation(() => GqlComment, {
    description: 'Vote for a comment (+1 or -1). IP uniqueness enforced.',
  })
  async voteComment(@Args('commentId') commentId: string, @Args('value') value: number) {
    // IP v GraphQL nemáme – v praxi použij Request context (custom plugin) nebo oddělené REST volání.
    const fakeIp = 'graphql-ctx'; // -> v reálu propojit s req.ip přes GraphQL context
    const { comment } = await this.svc.vote(commentId, fakeIp, value === 1 ? 1 : -1);
    return comment;
  }

  /**
   * Subscriptions
   */
  @Subscription(() => GqlComment, { description: 'Subscribe to newly created comments' })
  commentCreated() {
    return pubsub.asyncIterator('commentCreated');
  }

  @Subscription(() => GqlComment, { description: 'Subscribe to vote updates (score changes)' })
  commentVoted() {
    return pubsub.asyncIterator('commentVoted');
  }
}
