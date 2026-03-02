import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import * as glController from './gl.controller.js';

const router = Router();

router.get('/ledger/:accountId', authenticate, authorize('accounting.read'), glController.ledgerHandler);
router.get('/trial-balance', authenticate, authorize('accounting.read'), glController.trialBalanceHandler);

export default router;
