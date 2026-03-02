import { Request, Response, NextFunction } from 'express';
import * as tripsService from './delivery-trips.service.js';
import { successResponse } from '../../shared/utils/response.js';

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await tripsService.listTrips(req.user!.companyId, req.query as any);
    res.json(successResponse(result.trips, result.meta));
  } catch (err) {
    next(err);
  }
}

export async function getByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const trip = await tripsService.getTripById(req.params.id as string, req.user!.companyId);
    res.json(successResponse(trip));
  } catch (err) {
    next(err);
  }
}

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const trip = await tripsService.createTrip(req.body, req.user!.companyId, req.user!.userId);
    res.status(201).json(successResponse(trip));
  } catch (err) {
    next(err);
  }
}

export async function batchCreateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await tripsService.batchCreateTrips(req.body, req.user!.companyId, req.user!.userId);
    res.status(201).json(successResponse(result));
  } catch (err) {
    next(err);
  }
}

export async function updateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const trip = await tripsService.updateTrip(req.params.id as string, req.user!.companyId, req.body);
    res.json(successResponse(trip));
  } catch (err) {
    next(err);
  }
}

export async function confirmHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await tripsService.confirmTrips(req.body.trip_ids, req.user!.companyId);
    res.json(successResponse(result));
  } catch (err) {
    next(err);
  }
}

export async function voidHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const trip = await tripsService.voidTrip(req.params.id as string, req.user!.companyId);
    res.json(successResponse(trip));
  } catch (err) {
    next(err);
  }
}

export async function generateInvoiceHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await tripsService.generateInvoice(req.user!.companyId, req.user!.userId, req.body);
    res.status(201).json(successResponse(result));
  } catch (err) {
    next(err);
  }
}

export async function importPreviewHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'Excel file is required' } });
      return;
    }
    const result = await tripsService.importPreview(req.file.buffer, req.user!.companyId);
    res.json(successResponse(result));
  } catch (err) {
    next(err);
  }
}

export async function exportBillingDetailHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { buffer, filename } = await tripsService.exportBillingDetail(req.user!.companyId, req.body);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}

export async function importConfirmHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await tripsService.importConfirm(req.body, req.user!.companyId, req.user!.userId);
    res.status(201).json(successResponse(result));
  } catch (err) {
    next(err);
  }
}
