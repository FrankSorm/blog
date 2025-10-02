import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { UsersRepo } from '../../domain/users/user.repo';
import { User } from '../../domain/users/user.types';
import { UserEntity } from '../sql/user.entity';

export class SqlUsersRepo implements UsersRepo {
  private repo = this.ds.getRepository(UserEntity);
  constructor(private ds: DataSource) {}
  async create(data: {
    email: string;
    name: string;
    passwordHash: string;
    role: 'user' | 'admin';
  }): Promise<User> {
    const ent = await this.repo.save(
      this.repo.create({
        id: randomUUID(),
        email: data.email.toLowerCase(),
        name: data.name,
        password: data.passwordHash,
        role: data.role,
      }),
    );
    return this.map(ent);
  }
  async findByEmail(email: string) {
    const e = await this.repo.findOne({ where: { email: email.toLowerCase() } });
    return e ? this.map(e) : null;
  }
  async findById(id: string) {
    const e = await this.repo.findOne({ where: { id } });
    return e ? this.map(e) : null;
  }
  async list() {
    const arr = await this.repo.find();
    return arr.map(this.map);
  }
  async update(id: string, patch: Partial<User>) {
    await this.repo.update({ id }, patch);
    const e = await this.repo.findOneBy({ id });
    return this.map(e!);
  }
  async remove(id: string) {
    await this.repo.delete({ id });
  }
  private map = (e: UserEntity): User => ({
    id: e.id,
    email: e.email,
    name: e.name,
    password: e.password,
    role: e.role,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  });
}
