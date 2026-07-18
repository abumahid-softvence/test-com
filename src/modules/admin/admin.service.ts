import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { UnauthorizedError } from '../../shared/errors';
import { AdminRepository } from './admin.repository';
import { AdminDocument } from './admin.model';

const SALT_ROUNDS = 12;

interface AdminResponse {
  id: string;
  email: string;
}

interface AuthResult {
  token: string;
  admin: AdminResponse;
}

export class AdminService {
  constructor(private adminRepository: AdminRepository) {}

  async register(email: string, password: string): Promise<AuthResult> {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const admin = await this.adminRepository.create(email, passwordHash);
    const token = this.generateToken(admin);
    return { token, admin: this.sanitize(admin) };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const admin = await this.adminRepository.findByEmail(email);
    if (!admin) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    await this.adminRepository.updateLastLogin(admin._id.toString());
    const token = this.generateToken(admin);
    return { token, admin: this.sanitize(admin) };
  }

  async verifyToken(token: string): Promise<AdminDocument | null> {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string };
      return this.adminRepository.findById(decoded.id);
    } catch {
      return null;
    }
  }

  private generateToken(admin: AdminDocument): string {
    return jwt.sign({ id: admin._id }, env.JWT_SECRET, { expiresIn: '7d' });
  }

  private sanitize(admin: AdminDocument): AdminResponse {
    return { id: admin._id.toString(), email: admin.email };
  }
}
