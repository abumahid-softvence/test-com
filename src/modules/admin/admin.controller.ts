import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service';
import { AdminRepository } from './admin.repository';

const adminService = new AdminService(new AdminRepository());

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body;
    const result = await adminService.register(email, password);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body;
    const result = await adminService.login(email, password);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
