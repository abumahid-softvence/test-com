import { config } from 'dotenv';
config();

import { connectDatabase } from '../src/config/database';
import { AdminRepository } from '../src/modules/admin/admin.repository';
import { AdminService } from '../src/modules/admin/admin.service';

async function seedAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set');
    process.exit(1);
  }

  await connectDatabase();

  const repository = new AdminRepository();
  const existing = await repository.findByEmail(email);

  if (existing) {
    console.log(`Admin with email ${email} already exists`);
    process.exit(0);
  }

  const service = new AdminService(repository);
  const result = await service.register(email, password);
  console.log(`Admin created successfully: ${result.admin.email}`);
  process.exit(0);
}

seedAdmin();
