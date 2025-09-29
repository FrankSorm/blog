export interface Comment {
  id: string;
  articleId: string;
  parentId?: string | null;
  authorName?: string | null; // volitelně anonym/registrovaný
  content: string;
  score: number; // derivováno (pos - neg), ale držíme pro rychlé čtení
  createdAt: Date;
  updatedAt: Date;
}

export interface Vote {
  id: string;
  commentId: string;
  ip: string;
  value: 1 | -1;
  createdAt: Date;
}
