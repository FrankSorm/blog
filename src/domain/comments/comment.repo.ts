import { Comment, Vote } from './comment.types';

export interface CommentsRepo {
  create(input: {
    articleId: string;
    parentId?: string | null;
    content: string;
    authorName?: string | null;
  }): Promise<Comment>;

  listByArticle(articleId: string): Promise<Comment[]>; // FE si poskládá strom (nebo doplníme server-side)

  delete(id: string): Promise<void>;

  // Voting
  vote(commentId: string, ip: string, value: 1 | -1): Promise<{ comment: Comment; vote: Vote }>;
}
