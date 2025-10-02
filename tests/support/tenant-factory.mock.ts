/* In-memory repos per tenant, bez DB. Vhodné pro unit i rychlé e2e testy. */

export type UserRole = 'user' | 'admin';

function now() {
  return new Date();
}
function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}
function byDateDesc(a: any, b: any) {
  const da = new Date(a || 0).getTime();
  const db = new Date(b || 0).getTime();
  return db - da;
}

/* ========== USERS ========== */
export class MemUsersRepo {
  private data: any[] = [];

  /** create očekává passwordHash a uloží ho do pole "password" (AuthService ho čte odtud) */
  async create(input: { email: string; name: string; passwordHash: string; role: UserRole }) {
    const u = {
      id: (this.data.length + 1).toString(),
      email: input.email.toLowerCase(),
      name: input.name,
      password: input.passwordHash, // ← důležité kvůli bcrypt.compare v AuthService
      role: input.role || 'user',
      createdAt: now(),
      updatedAt: now(),
    };
    this.data.push(u);
    return clone(u);
  }

  async findByEmail(email: string) {
    const u = this.data.find((x) => x.email === email.toLowerCase());
    return u ? clone(u) : null;
  }

  async findById(id: string) {
    const u = this.data.find((x) => x.id === id);
    return u ? clone(u) : null;
  }

  async list() {
    return this.data.map(clone);
  }

  async update(id: string, patch: Partial<{ name: string; role: UserRole; password: string }>) {
    const i = this.data.findIndex((x) => x.id === id);
    if (i < 0) throw new Error('user not found');
    this.data[i] = { ...this.data[i], ...patch, updatedAt: now() };
    return clone(this.data[i]);
  }

  async remove(id: string) {
    const i = this.data.findIndex((x) => x.id === id);
    if (i >= 0) this.data.splice(i, 1);
  }

  /* Test helpers */
  reset() {
    this.data = [];
  }
}

/* ========== ARTICLES ========== */
export type ArticleStatus = 'draft' | 'published' | 'scheduled';

export class MemArticlesRepo {
  private data: any[] = [];
  private images: Record<string, any[]> = {}; // articleId -> images[]

  async create(input: any) {
    const id = (this.data.length + 1).toString();
    const a = {
      id,
      title: input.title,
      slug: input.slug,
      content: input.content,
      excerpt: input.excerpt ?? null,
      tags: input.tags ?? [],
      categories: input.categories ?? [],
      status: (input.status as ArticleStatus) ?? 'draft',
      publishAt: input.publishAt ?? null,
      coverImage: input.coverImage ?? null,
      images: [],
      views: 0,
      authorId: input.authorId,
      deletedAt: null,
      createdAt: now(),
      updatedAt: now(),
    };
    this.data.push(a);
    this.images[id] = [];
    return clone(a);
  }

  async findById(id: string) {
    const a = this.data.find((x) => x.id === id && !x.deletedAt);
    if (!a) return null;
    const imgs = this.images[id] || [];
    return clone({ ...a, images: imgs });
  }

  async findBySlugPublic(slug: string) {
    const nowTs = Date.now();
    const a = this.data.find((x) => {
      if (x.slug !== slug || x.deletedAt) return false;
      if (x.status === 'published') return true;
      if (x.status === 'scheduled' && x.publishAt && new Date(x.publishAt).getTime() <= nowTs)
        return true;
      return false;
    });
    if (!a) return null;
    const imgs = this.images[a.id] || [];
    return clone({ ...a, images: imgs });
  }

  /** Admin list: nefiltruje status/soft-delete (kromě deletedAt), řazení publishAt/createdAt DESC */
  async listAdmin(q: { search?: string; page?: number; limit?: number }) {
    const page = Number(q.page || 1);
    const limit = Number(q.limit || 20);
    const skip = (page - 1) * limit;
    let arr = this.data.filter((x) => !x.deletedAt);
    if (q.search) {
      const s = String(q.search).toLowerCase();
      arr = arr.filter(
        (x) => x.title.toLowerCase().includes(s) || String(x.content).toLowerCase().includes(s),
      );
    }
    arr = arr.sort((a, b) => byDateDesc(a.publishAt || a.createdAt, b.publishAt || b.createdAt));
    const items = arr
      .slice(skip, skip + limit)
      .map((a) => clone({ ...a, images: this.images[a.id] || [] }));
    return { items, total: arr.length };
  }

  /** Public list: jen published nebo scheduled <= now, bez images (rychlejší) */
  async listPublic(q: {
    search?: string;
    tag?: string;
    category?: string;
    page: number;
    limit: number;
  }) {
    const page = Number(q.page || 1);
    const limit = Number(q.limit || 10);
    const skip = (page - 1) * limit;
    const nowTs = Date.now();
    let arr = this.data.filter((x) => {
      if (x.deletedAt) return false;
      if (x.status === 'published') return true;
      if (x.status === 'scheduled' && x.publishAt && new Date(x.publishAt).getTime() <= nowTs)
        return true;
      return false;
    });
    if (q.search) {
      const s = String(q.search).toLowerCase();
      arr = arr.filter(
        (x) => x.title.toLowerCase().includes(s) || String(x.content).toLowerCase().includes(s),
      );
    }
    if (q.tag) arr = arr.filter((x) => (x.tags || []).includes(String(q.tag)));
    if (q.category) arr = arr.filter((x) => (x.categories || []).includes(String(q.category)));
    arr = arr.sort((a, b) => byDateDesc(a.publishAt || a.createdAt, b.publishAt || b.createdAt));
    const items = arr.slice(skip, skip + limit).map((a) => {
      const { images, ...rest } = a;
      return clone(rest); // bez images, stejně jako v produkčním listu
    });
    return { items, total: arr.length };
  }

  async update(id: string, patch: any) {
    const i = this.data.findIndex((x) => x.id === id && !x.deletedAt);
    if (i < 0) throw new Error('article not found');
    const merged = { ...this.data[i], ...patch, updatedAt: now() };
    this.data[i] = merged;
    return clone({ ...merged, images: this.images[id] || [] });
  }

  async softDelete(id: string) {
    const i = this.data.findIndex((x) => x.id === id && !x.deletedAt);
    if (i < 0) return;
    this.data[i] = { ...this.data[i], deletedAt: now(), updatedAt: now() };
  }

  async addImages(
    id: string,
    images: { id: string; filename: string; url: string; alt?: string }[],
  ) {
    if (!this.images[id]) this.images[id] = [];
    const cur = this.images[id];
    if (cur.length + images.length > 20) throw new Error('Max 20 images per article');
    this.images[id].push(...images.map(clone));
    const a = await this.findById(id);
    return a!;
  }

  async removeImage(id: string, imageId: string) {
    if (!this.images[id]) this.images[id] = [];
    this.images[id] = this.images[id].filter((im) => im.id !== imageId);
    const a = await this.findById(id);
    return a!;
  }

  /* Test helpers */
  reset() {
    this.data = [];
    this.images = {};
  }
}

/* ========== COMMENTS ========== */
export class MemCommentsRepo {
  private comments: any[] = [];
  private votes: Map<string, Map<string, number>> = new Map(); // commentId -> (ip -> value)

  async create(input: {
    articleId: string;
    parentId?: string | null;
    content: string;
    authorName?: string | null;
  }) {
    const id = (this.comments.length + 1).toString();
    const c = {
      id,
      articleId: input.articleId,
      parentId: input.parentId ?? null,
      content: input.content,
      authorName: input.authorName ?? null,
      score: 0,
      createdAt: now(),
      updatedAt: now(),
    };
    this.comments.push(c);
    return clone(c);
  }

  async listByArticle(articleId: string) {
    return this.comments
      .filter((c) => c.articleId === articleId)
      .sort((a, b) => byDateDesc(a.createdAt, b.createdAt))
      .map(clone);
  }

  async delete(id: string) {
    this.comments = this.comments.filter((c) => c.id !== id);
    this.votes.delete(id);
  }

  async vote(commentId: string, ip: string, value: 1 | -1) {
    if (!this.votes.has(commentId)) this.votes.set(commentId, new Map());
    const map = this.votes.get(commentId)!;
    const prev = map.get(ip);
    if (prev !== value) map.set(ip, value);

    // recompute score
    let score = 0;
    for (const v of map.values()) score += v;

    const i = this.comments.findIndex((c) => c.id === commentId);
    if (i < 0) throw new Error('comment not found');
    this.comments[i] = { ...this.comments[i], score, updatedAt: now() };

    const vote = { id: `${commentId}:${ip}`, commentId, ip, value, createdAt: now() };
    return { comment: clone(this.comments[i]), vote };
  }

  /* Test helpers */
  reset() {
    this.comments = [];
    this.votes.clear();
  }
}

/* ========== FACTORY PER TENANT ========== */
export class TenantRepoFactoryMock {
  private usersPerTenant = new Map<string, MemUsersRepo>();
  private articlesPerTenant = new Map<string, MemArticlesRepo>();
  private commentsPerTenant = new Map<string, MemCommentsRepo>();

  async users(tenantKey: string) {
    if (!this.usersPerTenant.has(tenantKey)) this.usersPerTenant.set(tenantKey, new MemUsersRepo());
    return this.usersPerTenant.get(tenantKey)!;
  }

  async articles(tenantKey: string) {
    if (!this.articlesPerTenant.has(tenantKey))
      this.articlesPerTenant.set(tenantKey, new MemArticlesRepo());
    return this.articlesPerTenant.get(tenantKey)!;
  }

  async comments(tenantKey: string) {
    if (!this.commentsPerTenant.has(tenantKey))
      this.commentsPerTenant.set(tenantKey, new MemCommentsRepo());
    return this.commentsPerTenant.get(tenantKey)!;
  }

  /* Helpers pro testy */
  resetTenant(tenantKey: string) {
    this.usersPerTenant.get(tenantKey)?.reset?.();
    this.articlesPerTenant.get(tenantKey)?.reset?.();
    this.commentsPerTenant.get(tenantKey)?.reset?.();
  }
  resetAll() {
    for (const r of this.usersPerTenant.values()) r.reset?.();
    for (const r of this.articlesPerTenant.values()) r.reset?.();
    for (const r of this.commentsPerTenant.values()) r.reset?.();
  }
}
