import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { vendorListSchema, createVendorSchema, updateVendorSchema } from './vendors.schema.js';
import * as vendorsController from './vendors.controller.js';

const router = Router();

router.get('/', authenticate, authorize('vendor.read'), validate(vendorListSchema), vendorsController.listHandler);
router.get('/:id', authenticate, authorize('vendor.read'), vendorsController.getByIdHandler);
router.post('/', authenticate, authorize('vendor.write'), validate(createVendorSchema), vendorsController.createHandler);
router.put('/:id', authenticate, authorize('vendor.write'), validate(updateVendorSchema), vendorsController.updateHandler);

export default router;
