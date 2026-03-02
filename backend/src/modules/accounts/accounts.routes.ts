import { Router } from 'express';
import multer from 'multer';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { accountListSchema, createAccountSchema, updateAccountSchema, importConfirmSchema } from './accounts.schema.js';
import * as accountsController from './accounts.controller.js';

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

router.get('/', authenticate, authorize('accounting.read'), validate(accountListSchema), accountsController.listHandler);
router.get('/tree', authenticate, authorize('accounting.read'), accountsController.treeHandler);
router.post('/import/preview', authenticate, authorize('accounting.write'), upload.single('file'), accountsController.importPreviewHandler);
router.post('/import/confirm', authenticate, authorize('accounting.write'), validate(importConfirmSchema), accountsController.importConfirmHandler);
router.get('/:id', authenticate, authorize('accounting.read'), accountsController.getByIdHandler);
router.post('/', authenticate, authorize('accounting.write'), validate(createAccountSchema), accountsController.createHandler);
router.put('/:id', authenticate, authorize('accounting.write'), validate(updateAccountSchema), accountsController.updateHandler);

export default router;
