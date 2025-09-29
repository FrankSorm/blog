import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ArticleDocument = HydratedDocument<Article>;

@Schema({ timestamps: true })
export class ArticleImage {
  @Prop({ required: true })
  id!: string;

  @Prop({ required: true })
  filename!: string;

  @Prop({ required: true })
  url!: string;

  @Prop()
  alt?: string;
}
const ArticleImageSchema = SchemaFactory.createForClass(ArticleImage);

@Schema({ timestamps: true })
export class Article {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, unique: true, index: true })
  slug!: string;

  @Prop({ required: true })
  content!: string;

  @Prop() excerpt?: string;

  @Prop([String])
  tags!: string[];

  @Prop([String])
  categories!: string[];

  @Prop({ type: String, enum: ['draft', 'published', 'scheduled'], default: 'draft' })
  status!: 'draft' | 'published' | 'scheduled';

  @Prop({ type: Date })
  publishAt?: Date;

  @Prop()
  coverImage?: string;

  @Prop({ type: [ArticleImageSchema], default: [] }) images!: ArticleImage[];

  @Prop({ type: Number, default: 0 })
  views!: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true }) author!: Types.ObjectId;

  @Prop({ type: Date, default: null })
  deletedAt!: Date | null;
}
export const ArticleSchema = SchemaFactory.createForClass(Article);
ArticleSchema.index({ title: 'text', content: 'text', tags: 1, categories: 1 });
