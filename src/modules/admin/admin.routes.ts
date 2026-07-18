import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { registerSchema, loginSchema } from './admin.validator';
import { register, login } from './admin.controller';

const router = Router();

router.post('/register', validate({ body: registerSchema }), register);
router.post('/login', validate({ body: loginSchema }), login);

export { router as adminRouter };
