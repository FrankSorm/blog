import { AuthService } from '../../src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { TenantRepoFactoryMock, MemUsersRepo } from '../support/tenant-factory.mock';

describe('AuthService', () => {
  const jwt = new JwtService({ secret: 's', signOptions: { expiresIn: '1h' } });
  const TENANT = 'acme';

  function makeService(factory = new TenantRepoFactoryMock()) {
    // AuthService(expectuje: constructor(factory: TenantRepoFactory, jwt: JwtService))
    return { svc: new (AuthService as any)(factory, jwt) as AuthService, factory };
  }

  it.skip('register + login', async () => {
    const { svc } = makeService();

    const reg = await (svc as any).register(
      { email: 'a@a.com', name: 'A', password: 'Passw0rd!' },
      TENANT,
    );
    console.log(reg);

    expect(reg.access_token).toBeDefined();

    const login = await (svc as any).login('a@a.com', 'Passw0rd!', TENANT);

    console.log(login);

    expect(login.user.email).toBe('a@a.com');
    expect(login.user.role).toBe('user');
    expect(login.access_token).toBeDefined();
  });

  it('register odmítne duplicitní email', async () => {
    const { svc } = makeService();
    await (svc as any).register({ email: 'dup@a.com', name: 'A', password: 'Passw0rd!' }, TENANT);
    await expect(
      (svc as any).register({ email: 'dup@a.com', name: 'B', password: 'Passw0rd!' }, TENANT),
    ).rejects.toThrow(/Email already registered/i);
  });

  it('login selže na špatné heslo', async () => {
    const { svc, factory } = makeService();
    const usersRepo: MemUsersRepo = await (factory as any).users(TENANT);
    const hash = await bcrypt.hash('ok', 10);
    await usersRepo.create({ email: 'b@b.com', name: 'B', passwordHash: hash, role: 'user' });

    await expect((svc as any).login('b@b.com', 'bad', TENANT)).rejects.toThrow(
      /Invalid credentials/,
    );
  });
});
