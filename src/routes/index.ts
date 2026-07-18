import { Router } from 'express';
import { adminRouter } from '../modules/admin/admin.routes';
import { categoryRouter, categoryAdminRouter } from '../modules/catalog/category.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

router.use('/api/admin', adminRouter);
router.use('/api/categories', categoryRouter);
router.use('/api/admin/categories', categoryAdminRouter);

export { router };
