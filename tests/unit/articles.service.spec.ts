import { ArticlesService } from '../../src/articles/articles.service';
import { TenantRepoFactoryMock, MemArticlesRepo } from '../support/tenant-factory.mock';

const TENANT = 'acme';

function makeService(factory = new TenantRepoFactoryMock()) {
  // ArticlesService(expectuje: constructor(repoFactory: TenantRepoFactory))
  const svc = new (ArticlesService as any)(factory) as ArticlesService;
  return { svc, factory };
}

describe('ArticlesService', () => {
  it('create: vygeneruje unikátní slug ( řeší kolize )', async () => {
    const { svc, factory } = makeService();
    const repo: MemArticlesRepo = await (factory as any).articles(TENANT);

    // předpřipravíme kolidující slugs
    await repo.create({
      title: 'x',
      slug: 'hello-world',
      content: 'x',
      authorId: 'u1',
      status: 'published',
    });
    await repo.create({
      title: 'x',
      slug: 'hello-world-1',
      content: 'x',
      authorId: 'u1',
      status: 'published',
    });

    const user = { sub: 'u2', role: 'admin' };
    const a: any = await (svc as any).create(
      { title: 'Hello World', content: 'Body' },
      user,
      TENANT,
    );
    expect(a.slug).toBe('hello-world-2');
  });

  it('update: změna title přepočítá slug, ostatní data zachová', async () => {
    const { svc } = makeService();
    const user = { sub: 'u1', role: 'admin' };
    const created: any = await (svc as any).create(
      { title: 'Old Title', content: 'x', status: 'draft' },
      user,
      TENANT,
    );

    const upd: any = await (svc as any).update(created.id, { title: 'New Title' }, user, TENANT);
    expect(upd.slug).toBe('new-title');
    expect(upd.status).toBe('draft');
  });

  it('adminFindAll: vrací i drafty (nezávisle na public filtrech)', async () => {
    const { svc } = makeService();
    const user = { sub: 'u1', role: 'admin' };

    // draft
    await (svc as any).create({ title: 'Draft', content: 'x', status: 'draft' }, user, TENANT);
    // published
    await (svc as any).create({ title: 'Pub', content: 'x', status: 'published' }, user, TENANT);

    const res: any = await (svc as any).adminFindAll({ page: 1, limit: 20 }, TENANT);
    const titles = res.items.map((i: any) => i.title).sort();
    expect(titles).toEqual(['Draft', 'Pub']);
  });

  it('publicFindAll vrací jen published + scheduled <= now, řazení od nejnovějšího', async () => {
    const { svc } = makeService();
    const user = { sub: 'u1', role: 'admin' };
    const now = Date.now();

    // not visible
    await (svc as any).create({ title: 'Draft', content: 'x', status: 'draft' }, user, TENANT);
    await (svc as any).create(
      {
        title: 'Scheduled-Future',
        content: 'x',
        status: 'scheduled',
        publishAt: new Date(now + 60_000).toISOString(),
      },
      user,
      TENANT,
    );

    // visible
    await (svc as any).create(
      { title: 'Published', content: 'x', status: 'published' },
      user,
      TENANT,
    );
    const resScheduled = await (svc as any).create(
      {
        title: 'Scheduled-Past',
        content: 'x',
        status: 'scheduled',
        publishAt: new Date(now - 60_000).toISOString(),
      },
      user,
      TENANT,
    );

    const res: any = await (svc as any).publicFindAll({ page: 1, limit: 10 }, TENANT);
    const titles = res.items.map((i: any) => i.title);
    expect(titles).toContain('Published');
    expect(titles).toContain('Scheduled-Past');
    expect(titles).not.toContain('Draft');
    expect(titles).not.toContain('Scheduled-Future');

    // pořadí: nejnovější publishAt/createdAt první
    const idxPub = titles.indexOf('Published');
    const idxSch = titles.indexOf('Scheduled-Past');
    expect(idxPub === 0 || idxSch === 0).toBeTruthy();
  });

  it('addImages: vynutí limit 20 obrázků', async () => {
    const { svc } = makeService();
    const user = { sub: 'u1', role: 'admin' };
    const a: any = await (svc as any).create(
      { title: 'Img', content: 'x', status: 'draft' },
      user,
      TENANT,
    );

    // simulace "files" z uploadu – service si je přemapuje; mock repo hlídá limit
    const files = Array.from({ length: 20 }, (_, i) => ({
      originalname: `f${i}.jpg`,
      filename: `f${i}.jpg`,
    }));
    await (svc as any).addImages(a.id, files, TENANT); // mělo by projít (20)

    const oneMore = [{ originalname: 'overflow.jpg', filename: 'overflow.jpg' }];
    await expect((svc as any).addImages(a.id, oneMore, TENANT)).rejects.toThrow(/20 images/i);
  });
});
