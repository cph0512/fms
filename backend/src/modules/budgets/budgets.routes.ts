import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { budgetListSchema, createBudgetSchema, updateBudgetSchema } from './budgets.schema.js';
import * as budgetsController from './budgets.controller.js';

const router = Router();

router.get('/', authenticate, authorize('budget.read'), validate(budgetListSchema), budgetsController.listHandler);
router.get('/:id', authenticate, authorize('budget.read'), budgetsController.getByIdHandler);
router.get('/:id/vs-actual', authenticate, authorize('budget.read'), budgetsController.vsActualHandler);
router.post('/', authenticate, authorize('budget.write'), validate(createBudgetSchema), budgetsController.createHandler);
router.put('/:id', authenticate, authorize('budget.write'), validate(updateBudgetSchema), budgetsController.updateHandler);

export default router;
