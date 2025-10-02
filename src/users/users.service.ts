import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { TenantRepoFactory } from '../tenancy/tenant.repo.factory';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly factory: TenantRepoFactory) {}

  async list(tenantKey: string) {
    return (await this.factory.users(tenantKey)).list();
  }

  async createByAdmin(input: CreateUserDto, tenantKey: string) {
    const repo = await this.factory.users(tenantKey);
    const hash = await bcrypt.hash(input.password, 10);
    return repo.create({
      email: input.email,
      name: input.name,
      passwordHash: hash,
      role: input.role ?? 'user',
    });
  }

  // constructor(@Inject('UsersRepo') private users: UsersRepo) {}
  // list() { return this.users.list(); }
  // async createByAdmin(input: { email: string; name: string; password: string; role?: 'user'|'admin' }) {
  //   const hash = await bcrypt.hash(input.password, 10);
  //   return this.users.create({ email: input.email, name: input.name, passwordHash: hash, role: input.role ?? 'user' });
  // }
  async update(id: string, patch: UpdateUserDto, tenantKey: string) {
    const repo = await this.factory.users(tenantKey);

    if (patch.password) {
      patch.password = await bcrypt.hash(patch.password, 10);
      delete patch.password;
    }
    return repo.update(id, patch);
  }
  async remove(id: string, tenantKey: string) {
    const repo = await this.factory.users(tenantKey);

    return repo.remove(id);
  }
}
