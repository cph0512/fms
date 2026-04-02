import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { submitFormSchema, listSubmissionsSchema, reviewSubmissionSchema } from './form-submissions.schema.js';
import * as controller from './form-submissions.controller.js';

const router = Router();

// Public route — no auth required
router.post('/public', validate(submitFormSchema), controller.submitHandler);

// Admin routes — require auth
router.get('/', authenticate, authorize('delivery.read'), validate(listSubmissionsSchema), controller.listHandler);
router.get('/:id', authenticate, authorize('delivery.read'), controller.getByIdHandler);
router.put('/:id/review', authenticate, authorize('delivery.write'), validate(reviewSubmissionSchema), controller.reviewHandler);

export default router;
