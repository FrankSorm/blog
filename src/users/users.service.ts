import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}
  async findAll() {
    return this.userModel.find().select('-password').exec();
  }
  async findById(id: string) {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
  async update(id: string, dto: UpdateUserDto) {
    const user = await this.findById(id);
    if (dto.password) user.password = await bcrypt.hash(dto.password, 10);
    if (dto.name) user.name = dto.name;
    if (dto.role) user.role = dto.role;
    await user.save();
    (user as any).password = undefined;
    return user;
  }
  async remove(id: string) {
    await this.userModel.findByIdAndDelete(id).exec();
    return { deleted: true };
  }
}
