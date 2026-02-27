import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { createCompanySchema, updateCompanySchema, switchCompanySchema } from './companies.schema.js';
import * as companiesController from './companies.controller.js';

const router = Router();

router.get('/', authenticate, companiesController.listHandler);
router.get('/:id', authenticate, companiesController.getByIdHandler);
router.post('/', authenticate, authorize('company.manage'), validate(createCompanySchema), companiesController.createHandler);
router.put('/:id', authenticate, authorize('company.manage'), validate(updateCompanySchema), companiesController.updateHandler);
router.post('/:id/switch', authenticate, validate(switchCompanySchema), companiesController.switchHandler);

export default router;
