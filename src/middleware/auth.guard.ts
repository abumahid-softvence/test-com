import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../modules/admin/admin.service';
import { AdminRepository } from '../modules/admin/admin.repository';
import { UnauthorizedError } from '../shared/errors';
import { AdminDocument } from '../modules/admin/admin.model';

const adminService = new AdminService(new AdminRepository());

declare global {
  namespace Express {
    interface Request {
      admin?: AdminDocument;
    }
  }
}

export async function authGuard(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Invalid or expired token'));
  }

  const token = authHeader.split(' ')[1];
  const admin = await adminService.verifyToken(token);
  if (!admin) {
    return next(new UnauthorizedError('Invalid or expired token'));
  }

  req.admin = admin;
  next();
}
