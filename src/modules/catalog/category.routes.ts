import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authGuard } from '../../middleware/auth.guard';
import { createCategorySchema, updateCategorySchema } from './category.validator';
import { getTree, getBySlug, create, update, remove } from './category.controller';

const router = Router();
const adminRouter = Router();

router.get('/', getTree);
router.get('/:slug', getBySlug);

adminRouter.use(authGuard);
adminRouter.post('/', validate({ body: createCategorySchema }), create);
adminRouter.put('/:id', validate({ body: updateCategorySchema }), update);
adminRouter.delete('/:id', remove);

export { router as categoryRouter, adminRouter as categoryAdminRouter };
