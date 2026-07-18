import { Schema, model, Document } from 'mongoose';

export interface ProductDocument extends Document {
  title: string;
  slug: string;
  description?: string;
  price: number;
  salePrice?: number;
  sku: string;
  stock: number;
  images: string[];
  status: 'active' | 'draft';
  categoryId: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<ProductDocument>(
  {
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    salePrice: {
      type: Number,
      min: 0,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    images: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'draft'],
      default: 'draft',
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
  },
  { timestamps: true }
);

productSchema.index({ categoryId: 1, status: 1, price: 1 });
productSchema.index({ categoryId: 1, slug: 1 }, { unique: true });

export const Product = model<ProductDocument>('Product', productSchema);
