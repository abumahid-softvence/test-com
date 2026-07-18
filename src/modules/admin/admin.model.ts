import { Schema, model, Document } from 'mongoose';

export interface AdminDocument extends Document {
  email: string;
  passwordHash: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const adminSchema = new Schema<AdminDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const Admin = model<AdminDocument>('Admin', adminSchema);
