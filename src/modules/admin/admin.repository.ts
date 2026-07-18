import { Admin, AdminDocument } from './admin.model';

export class AdminRepository {
  async findByEmail(email: string): Promise<AdminDocument | null> {
    return Admin.findOne({ email });
  }

  async findById(id: string): Promise<AdminDocument | null> {
    return Admin.findById(id);
  }

  async create(email: string, passwordHash: string): Promise<AdminDocument> {
    const admin = new Admin({ email, passwordHash });
    return admin.save();
  }

  async updateLastLogin(id: string): Promise<void> {
    await Admin.findByIdAndUpdate(id, { lastLogin: new Date() });
  }
}
