import { Schema } from 'mongoose';
const ArticleImageSchema = new Schema(
  { id: String, filename: String, url: String, alt: String },
  { _id: false },
);
export const ArticleSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    id: { type: String, index: true, unique: true }, // uuid
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    content: { type: String, required: true },
    excerpt: String,
    tags: [String],
    categories: [String],
    status: { type: String, enum: ['draft', 'published', 'scheduled'], default: 'draft' },
    publishAt: Date,
    coverImage: String,
    images: { type: [ArticleImageSchema], default: [] },
    views: { type: Number, default: 0 },
    authorId: { type: String, required: true }, // uuid
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
