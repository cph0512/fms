import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { billListSchema, createBillSchema, updateBillSchema, voidBillSchema } from './ap-bills.schema.js';
import { createPaymentSchema } from './ap-payments.schema.js';
import * as billsController from './ap-bills.controller.js';
import * as paymentsController from './ap-payments.controller.js';

const router = Router();

// Bills
router.get('/bills', authenticate, authorize('ap.read'), validate(billListSchema), billsController.listHandler);
router.get('/bills/:id', authenticate, authorize('ap.read'), billsController.getByIdHandler);
router.post('/bills', authenticate, authorize('ap.write'), validate(createBillSchema), billsController.createHandler);
router.put('/bills/:id', authenticate, authorize('ap.write'), validate(updateBillSchema), billsController.updateHandler);
router.put('/bills/:id/void', authenticate, authorize('ap.write'), validate(voidBillSchema), billsController.voidHandler);

// Payments
router.post('/payments', authenticate, authorize('ap.write'), validate(createPaymentSchema), paymentsController.createHandler);

export default router;
