import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { listRoutesSchema, createRouteSchema, updateRouteSchema, batchCreateSchema } from './delivery-routes.schema.js';
import * as routesController from './delivery-routes.controller.js';

const router = Router();

router.get('/', authenticate, authorize('delivery.read'), validate(listRoutesSchema), routesController.listHandler);
router.get('/customer/:customerId', authenticate, authorize('delivery.read'), routesController.getByCustomerHandler);
router.get('/:id', authenticate, authorize('delivery.read'), routesController.getByIdHandler);
router.post('/', authenticate, authorize('delivery.write'), validate(createRouteSchema), routesController.createHandler);
router.put('/:id', authenticate, authorize('delivery.write'), validate(updateRouteSchema), routesController.updateHandler);
router.post('/batch', authenticate, authorize('delivery.write'), validate(batchCreateSchema), routesController.batchCreateHandler);

export default router;
