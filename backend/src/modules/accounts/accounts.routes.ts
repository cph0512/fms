import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { accountListSchema, createAccountSchema, updateAccountSchema } from './accounts.schema.js';
import * as accountsController from './accounts.controller.js';

const router = Router();

router.get('/', authenticate, authorize('accounting.read'), validate(accountListSchema), accountsController.listHandler);
router.get('/tree', authenticate, authorize('accounting.read'), accountsController.treeHandler);
router.get('/:id', authenticate, authorize('accounting.read'), accountsController.getByIdHandler);
router.post('/', authenticate, authorize('accounting.write'), validate(createAccountSchema), accountsController.createHandler);
router.put('/:id', authenticate, authorize('accounting.write'), validate(updateAccountSchema), accountsController.updateHandler);

export default router;
