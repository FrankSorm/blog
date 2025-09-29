import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CommentDocument = HydratedDocument<Comment>;
@Schema({ timestamps: true })
export class Comment {
  @Prop({ type: Types.ObjectId, ref: 'Article', index: true, required: true })
  articleId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Comment', default: null })
  parentId!: Types.ObjectId | null;

  @Prop({ required: true })
  content!: string;

  @Prop()
  authorName?: string;

  @Prop({ type: Number, default: 0 })
  score!: number;
}
export const CommentSchema = SchemaFactory.createForClass(Comment);
CommentSchema.index({ articleId: 1, parentId: 1, createdAt: -1 });

export type VoteDocument = HydratedDocument<Vote>;
@Schema({ timestamps: true })
export class Vote {
  @Prop({ type: Types.ObjectId, ref: 'Comment', index: true, required: true })
  commentId!: Types.ObjectId;

  @Prop({ required: true })
  ip!: string;

  @Prop({ type: Number, enum: [1, -1], required: true })
  value!: 1 | -1;
}
export const VoteSchema = SchemaFactory.createForClass(Vote);
VoteSchema.index({ commentId: 1, ip: 1 }, { unique: true }); // 1 IP -> max 1 hlas pro daný komentář
