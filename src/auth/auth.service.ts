import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.userModel.exists({ email: dto.email.toLowerCase() });
    if (exists) throw new ConflictException('Email already registered');
    const hash = await bcrypt.hash(dto.password, 10);
    const created = await this.userModel.create({
      email: dto.email.toLowerCase(),
      name: dto.name,
      password: hash,
      role: dto.role ?? 'user',
    });
    return this.sign(created);
  }

  async validateUser(email: string, password: string) {
    const user = await this.userModel.findOne({ email: email.toLowerCase() }).exec();
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    return this.sign(user);
  }

  private sign(user: UserDocument) {
    const payload = {
      userId: user.userId,
      email: user.email,
      role: user.role,
      name: user.name,
    };
    return {
      accessToken: this.jwtService.sign(payload),
      user: { id: user._id, email: user.email, name: user.name, role: user.role },
    };
  }
}
