import { CommentsService, pubsub } from '../../src/comments/comments.service';

class CommentsRepoMock {
  async vote(commentId: string, ip: string, value: 1 | -1) {
    return {
      comment: {
        id: commentId,
        score: value,
        articleId: 'a1',
        content: 'x',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      vote: { id: 'v1', commentId, ip, value, createdAt: new Date() },
    };
  }
  async create() {
    return { id: 'c1' };
  }
  async listByArticle() {
    return [];
  }
  async delete() {}
}

describe('CommentsService', () => {
  it('vote publikuje commentVoted', async () => {
    const svc = new CommentsService({ comments: async () => new CommentsRepoMock() } as any);
    const spy = jest.spyOn(pubsub, 'publish').mockResolvedValueOnce(undefined as any);
    await svc.vote('c1', '1.1.1.1', 1, 'acme');
    expect(spy).toHaveBeenCalledWith(
      'commentVoted',
      expect.objectContaining({ commentVoted: expect.objectContaining({ id: 'c1' }) }),
    );
  });
});
