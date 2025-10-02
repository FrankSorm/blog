import { Injectable, UnauthorizedException, ConflictException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TenantRepoFactory } from '../tenancy/tenant.repo.factory';
import { User, UserJwt } from '../domain/users/user.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly factory: TenantRepoFactory,
    private jwt: JwtService,
  ) {}

  async register(input: RegisterDto, tenantKey: string) {
    const users = await this.factory.users(tenantKey);
    const exists = await users.findByEmail(input.email);

    if (exists) throw new ConflictException('Email already registered');
    const hash = await bcrypt.hash(input.password, 10);
    const created = await users.create({
      email: input.email,
      name: input.name,
      passwordHash: hash,
      role: input.role ?? 'user',
    });
    return this.sign(created, tenantKey);
  }

  async login(login: LoginDto, tenantKey: string) {
    const users = await this.factory.users(tenantKey);
    const user = await users.findByEmail(login.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(login.password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return this.sign(user, tenantKey);
  }

  private sign(user: User, tenantKey: string) {
    const payload: UserJwt = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      tenant: tenantKey,
    };
    return {
      access_token: this.jwt.sign(payload),
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }
}
