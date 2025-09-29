import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Exclude } from 'class-transformer';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  userId!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  @Exclude()
  password!: string;

  @Prop({ type: String, enum: ['user', 'admin'], default: 'user' })
  role!: 'user' | 'admin';
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });
