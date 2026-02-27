import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { invoiceListSchema, createInvoiceSchema, updateInvoiceSchema, voidInvoiceSchema } from './ar-invoices.schema.js';
import { createPaymentSchema } from './ar-payments.schema.js';
import * as invoicesController from './ar-invoices.controller.js';
import * as paymentsController from './ar-payments.controller.js';

const router = Router();

// Invoices
router.get('/invoices', authenticate, authorize('ar.read'), validate(invoiceListSchema), invoicesController.listHandler);
router.get('/invoices/:id', authenticate, authorize('ar.read'), invoicesController.getByIdHandler);
router.post('/invoices', authenticate, authorize('ar.write'), validate(createInvoiceSchema), invoicesController.createHandler);
router.put('/invoices/:id', authenticate, authorize('ar.write'), validate(updateInvoiceSchema), invoicesController.updateHandler);
router.put('/invoices/:id/void', authenticate, authorize('ar.write'), validate(voidInvoiceSchema), invoicesController.voidHandler);

// Payments
router.post('/payments', authenticate, authorize('ar.write'), validate(createPaymentSchema), paymentsController.createHandler);

export default router;
