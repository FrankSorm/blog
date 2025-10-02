import { Model } from 'mongoose';
import { UsersRepo } from '../../domain/users/user.repo';
import { User } from '../../domain/users/user.types';
import { randomUUID } from 'crypto';

export class MongoUsersRepo implements UsersRepo {
  constructor(private userModel: Model<any>) {}
  async create(data: {
    email: string;
    name: string;
    passwordHash: string;
    role: 'user' | 'admin';
  }): Promise<User> {
    const doc = await this.userModel.create({
      id: randomUUID(),
      email: data.email.toLowerCase(),
      name: data.name,
      password: data.passwordHash,
      role: data.role,
    });
    return this.map(doc);
  }

  async findByEmail(email: string) {
    const d = await this.userModel.findOne({ email: email.toLowerCase() }).exec();
    return d ? this.map(d) : null;
  }

  async findById(id: string) {
    const d = await this.userModel.findOne({ id }).exec();
    return d ? this.map(d) : null;
  }

  async list() {
    const arr = await this.userModel.find().exec();
    return arr.map(this.map);
  }

  async update(id: string, patch: Partial<User>) {
    const d = await this.userModel.findOneAndUpdate({ id }, { $set: patch }, { new: true }).exec();
    return this.map(d);
  }

  async remove(id: string) {
    await this.userModel.deleteOne({ id }).exec();
  }

  private map = (d: any): User => ({
    id: d.id,
    email: d.email,
    name: d.name,
    password: d.password,
    role: d.role,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  });
}
