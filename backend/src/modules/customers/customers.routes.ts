import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { customerListSchema, createCustomerSchema, updateCustomerSchema } from './customers.schema.js';
import * as customersController from './customers.controller.js';

const router = Router();

router.get('/', authenticate, authorize('customer.read'), validate(customerListSchema), customersController.listHandler);
router.get('/:id', authenticate, authorize('customer.read'), customersController.getByIdHandler);
router.post('/', authenticate, authorize('customer.write'), validate(createCustomerSchema), customersController.createHandler);
router.put('/:id', authenticate, authorize('customer.write'), validate(updateCustomerSchema), customersController.updateHandler);

export default router;
