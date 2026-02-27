import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { createUserSchema, updateUserSchema, assignRolesSchema, userListSchema } from './users.schema.js';
import * as usersController from './users.controller.js';

const router = Router();

router.get('/', authenticate, authorize('user.manage'), validate(userListSchema), usersController.listHandler);
router.get('/roles', authenticate, usersController.rolesHandler);
router.get('/:id', authenticate, authorize('user.manage'), usersController.getByIdHandler);
router.post('/', authenticate, authorize('user.manage'), validate(createUserSchema), usersController.createHandler);
router.put('/:id', authenticate, authorize('user.manage'), validate(updateUserSchema), usersController.updateHandler);
router.put('/:id/roles', authenticate, authorize('user.manage'), validate(assignRolesSchema), usersController.assignRolesHandler);

export default router;
