import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserJwt } from '../domain/users/user.types';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }
  async validate(payload: UserJwt) {
    console.log(payload);
    return {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      name: payload.name,
      tenant: payload.tenant,
    };
  }
}
