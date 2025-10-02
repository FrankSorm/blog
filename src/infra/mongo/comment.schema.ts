import { Schema } from 'mongoose';
export const CommentSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    id: { type: String, index: true, unique: true }, // uuid
    articleId: { type: String, index: true, required: true }, // uuid
    parentId: { type: String, default: null }, // uuid
    authorName: { type: String, default: null },
    content: { type: String, required: true },
    score: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const VoteSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    id: { type: String, index: true, unique: true }, // uuid
    commentId: { type: String, index: true, required: true }, // uuid
    ip: { type: String, required: true },
    value: { type: Number, enum: [1, -1], required: true },
  },
  { timestamps: true },
);
VoteSchema.index({ commentId: 1, ip: 1 }, { unique: true });
