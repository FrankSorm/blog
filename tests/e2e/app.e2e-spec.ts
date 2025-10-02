import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { JwtService } from '@nestjs/jwt';

// jednoduché in-memory repo implementace
class MemUsers {
  data: any[] = [];
  async create(d: any) {
    const u = { id: 'u1', email: d.email, name: d.name, password: d.passwordHash, role: d.role };
    this.data.push(u);
    return u;
  }
  async findByEmail(email: string) {
    return this.data.find((u) => u.email === email) || null;
  }
  async list() {
    return this.data;
  }
  async update() {
    throw new Error('not needed');
  }
  async remove() {
    throw new Error('not needed');
  }
}
class MemArticles {
  data: any[] = [];
  async create(d: any) {
    const a = { ...d, id: String(this.data.length + 1) };
    this.data.push(a);
    return a;
  }
  async findBySlugPublic(slug: string) {
    return this.data.find((a) => a.slug === slug) || null;
  }
  async findById(id: string) {
    return this.data.find((a) => a.id === id) || null;
  }
  async listPublic() {
    return {
      items: this.data.filter((a) => a.status === 'published' || a.status === 'scheduled'),
      total: this.data.length,
    };
  }
  async listAdmin(q: any) {
    return { items: this.data.slice(0, q.limit || 20), total: this.data.length };
  }
  async update(id: string, patch: any) {
    const i = this.data.findIndex((a) => a.id === id);
    this.data[i] = { ...this.data[i], ...patch };
    return this.data[i];
  }
  async softDelete() {}
  async addImages() {
    return { images: [] };
  }
  async removeImage() {}
}
class MemComments {
  async create() {
    return { id: 'c1' };
  }
  async listByArticle() {
    return [];
  }
  async delete() {}
  async vote() {
    return { comment: { id: 'c1', score: 1 }, vote: { id: 'v1' } };
  }
}
class TenantRepoFactoryMock {
  usersMap = new Map<string, MemUsers>();
  artsMap = new Map<string, MemArticles>();
  commMap = new Map<string, MemComments>();
  async users(t: string) {
    if (!this.usersMap.has(t)) this.usersMap.set(t, new MemUsers());
    return this.usersMap.get(t)!;
  }
  async articles(t: string) {
    if (!this.artsMap.has(t)) this.artsMap.set(t, new MemArticles());
    return this.artsMap.get(t)!;
  }
  async comments(t: string) {
    if (!this.commMap.has(t)) this.commMap.set(t, new MemComments());
    return this.commMap.get(t)!;
  }
}

describe('App e2e', () => {
  let app: INestApplication;
  const TENANT = 'acme';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider('TenantRepoFactory')
      .useValue(new TenantRepoFactoryMock())
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('register + login + create article + admin list', async () => {
    // register
    const reg = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .set('X-Tenant', TENANT)
      .send({ email: 'a@a.com', name: 'A', password: 'Passw0rd!' })
      .expect(201);
    expect(reg.body.access_token).toBeDefined();

    // login
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('X-Tenant', TENANT)
      .send({ email: 'a@a.com', password: 'Passw0rd!' })
      .expect(200);
    const token = login.body.access_token;

    // create article
    const create = await request(app.getHttpServer())
      .post('/api/v1/admin/articles')
      .set('X-Tenant', TENANT)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Hello SQL', content: 'lorem', status: 'draft' })
      .expect(201);
    expect(create.body.slug).toBeDefined();

    // admin list – uvidí draft
    const list = await request(app.getHttpServer())
      .get('/api/v1/admin/articles')
      .set('X-Tenant', TENANT)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(list.body.items.length).toBeGreaterThan(0);
  });
});
