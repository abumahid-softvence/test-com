import { Schema, model, Document } from 'mongoose';

export interface CategoryDocument extends Document {
  name: string;
  slug: string;
  parentId?: CategoryDocument['_id'];
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<CategoryDocument>(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
    },
  },
  { timestamps: true }
);

categorySchema.index({ parentId: 1 });
categorySchema.index({ parentId: 1, slug: 1 }, { unique: true });

export const Category = model<CategoryDocument>('Category', categorySchema);
