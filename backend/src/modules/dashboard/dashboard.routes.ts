import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import * as dashboardController from './dashboard.controller.js';

const router = Router();

router.get('/summary', authenticate, dashboardController.summaryHandler);

export default router;
