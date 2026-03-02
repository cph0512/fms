import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import * as reportsController from './reports.controller.js';

const router = Router();

router.get('/balance-sheet', authenticate, authorize('accounting.read'), reportsController.balanceSheetHandler);
router.get('/income-statement', authenticate, authorize('accounting.read'), reportsController.incomeStatementHandler);

export default router;
