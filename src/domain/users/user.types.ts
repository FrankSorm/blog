export type UserRole = 'user' | 'admin';

export interface User {
  id: string; // uuid4
  email: string;
  name: string;
  password: string; // hashed, never returned to API
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserJwt {
  id: string; // uuid4
  email: string;
  name: string;
  role: UserRole;
  tenant: string;
}
