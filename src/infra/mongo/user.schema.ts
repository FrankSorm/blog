import { Schema } from 'mongoose';

export const UserSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    id: { type: String, index: true, unique: true }, // uuid
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  { timestamps: true },
);
