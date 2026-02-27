import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { loginSchema, refreshSchema, changePasswordSchema } from './auth.schema.js';
import * as authController from './auth.controller.js';

const router = Router();

router.post('/login', validate(loginSchema), authController.loginHandler);
router.post('/logout', authenticate, authController.logoutHandler);
router.post('/refresh', validate(refreshSchema), authController.refreshHandler);
router.put('/password', authenticate, validate(changePasswordSchema), authController.changePasswordHandler);

export default router;
