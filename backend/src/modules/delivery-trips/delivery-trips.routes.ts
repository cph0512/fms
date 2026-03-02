import { Router } from 'express';
import multer from 'multer';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import {
  listTripsSchema,
  createTripSchema,
  batchCreateTripsSchema,
  updateTripSchema,
  confirmTripsSchema,
  voidTripSchema,
  generateInvoiceSchema,
  exportBillingDetailSchema,
  importConfirmSchema,
} from './delivery-trips.schema.js';
import * as tripsController from './delivery-trips.controller.js';

const router = Router();

// Multer for file upload (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
    }
  },
});

router.get('/', authenticate, authorize('delivery.read'), validate(listTripsSchema), tripsController.listHandler);
router.get('/:id', authenticate, authorize('delivery.read'), tripsController.getByIdHandler);
router.post('/', authenticate, authorize('delivery.write'), validate(createTripSchema), tripsController.createHandler);
router.post('/batch', authenticate, authorize('delivery.write'), validate(batchCreateTripsSchema), tripsController.batchCreateHandler);
router.put('/confirm', authenticate, authorize('delivery.write'), validate(confirmTripsSchema), tripsController.confirmHandler);
router.put('/:id', authenticate, authorize('delivery.write'), validate(updateTripSchema), tripsController.updateHandler);
router.put('/:id/void', authenticate, authorize('delivery.write'), validate(voidTripSchema), tripsController.voidHandler);
router.post('/generate-invoice', authenticate, authorize('delivery.write', 'ar.write'), validate(generateInvoiceSchema), tripsController.generateInvoiceHandler);
router.post('/export/billing-detail', authenticate, authorize('delivery.read'), validate(exportBillingDetailSchema), tripsController.exportBillingDetailHandler);
router.post('/import/preview', authenticate, authorize('delivery.write'), upload.single('file'), tripsController.importPreviewHandler);
router.post('/import/confirm', authenticate, authorize('delivery.write'), validate(importConfirmSchema), tripsController.importConfirmHandler);

export default router;
