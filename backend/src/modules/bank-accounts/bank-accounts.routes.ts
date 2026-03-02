import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { bankAccountListSchema, createBankAccountSchema, updateBankAccountSchema } from './bank-accounts.schema.js';
import * as bankAccountsController from './bank-accounts.controller.js';

const router = Router();

router.get('/', authenticate, authorize('bank.read'), validate(bankAccountListSchema), bankAccountsController.listHandler);
router.get('/:id', authenticate, authorize('bank.read'), bankAccountsController.getByIdHandler);
router.post('/', authenticate, authorize('bank.write'), validate(createBankAccountSchema), bankAccountsController.createHandler);
router.put('/:id', authenticate, authorize('bank.write'), validate(updateBankAccountSchema), bankAccountsController.updateHandler);

export default router;
