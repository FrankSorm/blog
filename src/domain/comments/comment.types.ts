export interface Comment {
  id: string;                // uuid4
  articleId: string;         // uuid of article
  parentId?: string | null;  // uuid of parent comment
  authorName?: string | null;
  content: string;
  score: number;
  createdAt: Date; updatedAt: Date;
}
export interface Vote {
  id: string; commentId: string; ip: string; value: 1|-1; createdAt: Date;
}
