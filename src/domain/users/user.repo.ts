import { User } from './user.types';
export interface UsersRepo {
  create(data: {
    email: string;
    name: string;
    passwordHash: string;
    role: 'user' | 'admin';
  }): Promise<User>;

  findByEmail(email: string): Promise<User | null>;

  findById(id: string): Promise<User | null>;

  list(): Promise<User[]>;

  update(id: string, patch: Partial<Pick<User, 'name' | 'role' | 'password'>>): Promise<User>;

  remove(id: string): Promise<void>;
}
