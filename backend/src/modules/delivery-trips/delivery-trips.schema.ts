import { z } from 'zod';

export const listTripsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    from_date: z.string().optional(),
    to_date: z.string().optional(),
    customer_id: z.string().uuid().optional(),
    status: z.enum(['PENDING', 'CONFIRMED', 'BILLED', 'VOID']).optional(),
    driver_name: z.string().optional(),
  }),
});

export const createTripSchema = z.object({
  body: z.object({
    trip_date: z.string(),
    route_id: z.string().uuid(),
    trips_count: z.number().int().positive().default(1),
    driver_name: z.string().max(100).optional(),
    vehicle_no: z.string().max(20).optional(),
    notes: z.string().optional(),
  }),
});

export const batchCreateTripsSchema = z.object({
  body: z.object({
    trip_date: z.string(),
    driver_name: z.string().max(100).optional(),
    vehicle_no: z.string().max(20).optional(),
    trips: z.array(
      z.object({
        route_id: z.string().uuid(),
        trips_count: z.number().int().positive().default(1),
      })
    ).min(1),
  }),
});

export const updateTripSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    trip_date: z.string().optional(),
    route_id: z.string().uuid().optional(),
    trips_count: z.number().int().positive().optional(),
    driver_name: z.string().max(100).nullable().optional(),
    vehicle_no: z.string().max(20).nullable().optional(),
    notes: z.string().nullable().optional(),
  }),
});

export const confirmTripsSchema = z.object({
  body: z.object({
    trip_ids: z.array(z.string().uuid()).min(1),
  }),
});

export const voidTripSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const generateInvoiceSchema = z.object({
  body: z.object({
    customer_id: z.string().uuid(),
    from_date: z.string(),
    to_date: z.string(),
    description: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const importConfirmSchema = z.object({
  body: z.object({
    sheets: z.array(
      z.object({
        sheetName: z.string(),
        customerName: z.string(),
        customerId: z.string().uuid().optional(),
        rows: z.array(
          z.object({
            date: z.string(),
            routeName: z.string(),
            contentType: z.string(),
            tripsCount: z.number().int().positive(),
            amount: z.number(),
          })
        ),
      })
    ),
    trip_date_fallback: z.string().optional(),
    driver_name: z.string().optional(),
    vehicle_no: z.string().optional(),
    auto_confirm: z.boolean().optional(),
  }),
});
