import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { journalListSchema, createJournalEntrySchema, updateJournalEntrySchema, journalIdSchema } from './journal.schema.js';
import * as journalController from './journal.controller.js';

const router = Router();

router.get('/entries', authenticate, authorize('accounting.read'), validate(journalListSchema), journalController.listHandler);
router.get('/entries/:id', authenticate, authorize('accounting.read'), journalController.getByIdHandler);
router.post('/entries', authenticate, authorize('accounting.write'), validate(createJournalEntrySchema), journalController.createHandler);
router.put('/entries/:id', authenticate, authorize('accounting.write'), validate(updateJournalEntrySchema), journalController.updateHandler);
router.put('/entries/:id/post', authenticate, authorize('accounting.write'), validate(journalIdSchema), journalController.postHandler);
router.put('/entries/:id/void', authenticate, authorize('accounting.write'), validate(journalIdSchema), journalController.voidHandler);

export default router;
