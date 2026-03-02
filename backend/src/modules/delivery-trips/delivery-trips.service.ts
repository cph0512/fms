import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/errors/AppError.js';
import { parsePagination, paginationMeta } from '../../shared/utils/pagination.js';
import { parseDeliveryExcel, ParsedSheet } from './excel-parser.js';
import { buildBillingDetailExcel } from './billing-export.js';

export async function listTrips(
  companyId: string,
  query: {
    page?: string;
    limit?: string;
    from_date?: string;
    to_date?: string;
    customer_id?: string;
    status?: string;
    driver_name?: string;
  }
) {
  const { page, limit, skip, take } = parsePagination(query);

  const where: Record<string, unknown> = { company_id: companyId };

  if (query.status) where.status = query.status;
  if (query.driver_name) {
    where.driver_name = { contains: query.driver_name, mode: 'insensitive' };
  }

  if (query.from_date || query.to_date) {
    const dateFilter: Record<string, unknown> = {};
    if (query.from_date) dateFilter.gte = new Date(query.from_date);
    if (query.to_date) dateFilter.lte = new Date(query.to_date);
    where.trip_date = dateFilter;
  }

  if (query.customer_id) {
    where.route = { customer_id: query.customer_id };
  }

  const [trips, total] = await Promise.all([
    prisma.deliveryTrip.findMany({
      where: where as any,
      skip,
      take,
      orderBy: { trip_date: 'desc' },
      include: {
        route: {
          select: {
            route_id: true,
            route_name: true,
            origin: true,
            content_type: true,
            standard_price: true,
            customer: {
              select: { customer_id: true, customer_code: true, customer_name: true, short_name: true },
            },
          },
        },
      },
    }),
    prisma.deliveryTrip.count({ where: where as any }),
  ]);

  return { trips, meta: paginationMeta(total, page, limit) };
}

export async function getTripById(tripId: string, companyId: string) {
  const trip = await prisma.deliveryTrip.findFirst({
    where: { trip_id: tripId, company_id: companyId },
    include: {
      route: {
        include: {
          customer: { select: { customer_id: true, customer_code: true, customer_name: true, short_name: true } },
        },
      },
      invoice: {
        select: { invoice_id: true, invoice_number: true, status: true },
      },
    },
  });

  if (!trip) {
    throw new AppError(404, 'NOT_FOUND', 'Delivery trip not found');
  }

  return trip;
}

export async function createTrip(
  data: {
    trip_date: string;
    route_id: string;
    trips_count?: number;
    driver_name?: string;
    vehicle_no?: string;
    notes?: string;
  },
  companyId: string,
  userId: string
) {
  // Lookup route for unit_price
  const route = await prisma.deliveryRoute.findFirst({
    where: { route_id: data.route_id, company_id: companyId, is_active: true },
  });
  if (!route) throw new AppError(404, 'NOT_FOUND', 'Delivery route not found or inactive');

  const tripsCount = data.trips_count ?? 1;
  const unitPrice = Number(route.standard_price);
  const amount = tripsCount * unitPrice;

  const trip = await prisma.deliveryTrip.create({
    data: {
      trip_date: new Date(data.trip_date),
      route_id: data.route_id,
      trips_count: tripsCount,
      unit_price: unitPrice,
      amount,
      driver_name: data.driver_name,
      vehicle_no: data.vehicle_no,
      notes: data.notes,
      company_id: companyId,
      created_by: userId,
    },
    include: {
      route: {
        select: {
          route_id: true,
          route_name: true,
          origin: true,
          content_type: true,
          customer: { select: { customer_id: true, customer_code: true, customer_name: true } },
        },
      },
    },
  });

  return trip;
}

export async function batchCreateTrips(
  data: {
    trip_date: string;
    driver_name?: string;
    vehicle_no?: string;
    trips: Array<{ route_id: string; trips_count?: number }>;
  },
  companyId: string,
  userId: string
) {
  const createdTrips = [];

  for (const item of data.trips) {
    const route = await prisma.deliveryRoute.findFirst({
      where: { route_id: item.route_id, company_id: companyId, is_active: true },
    });
    if (!route) throw new AppError(404, 'NOT_FOUND', `Route ${item.route_id} not found or inactive`);

    const tripsCount = item.trips_count ?? 1;
    const unitPrice = Number(route.standard_price);
    const amount = tripsCount * unitPrice;

    const trip = await prisma.deliveryTrip.create({
      data: {
        trip_date: new Date(data.trip_date),
        route_id: item.route_id,
        trips_count: tripsCount,
        unit_price: unitPrice,
        amount,
        driver_name: data.driver_name,
        vehicle_no: data.vehicle_no,
        company_id: companyId,
        created_by: userId,
      },
    });
    createdTrips.push(trip);
  }

  return { created: createdTrips.length, trips: createdTrips };
}

export async function updateTrip(
  tripId: string,
  companyId: string,
  data: Record<string, unknown>
) {
  const existing = await prisma.deliveryTrip.findFirst({
    where: { trip_id: tripId, company_id: companyId },
  });

  if (!existing) throw new AppError(404, 'NOT_FOUND', 'Delivery trip not found');
  if (existing.status !== 'PENDING') {
    throw new AppError(400, 'INVALID_STATUS', 'Only PENDING trips can be updated');
  }

  const updateData: Record<string, unknown> = {};

  if (data.trip_date) updateData.trip_date = new Date(data.trip_date as string);
  if (data.driver_name !== undefined) updateData.driver_name = data.driver_name;
  if (data.vehicle_no !== undefined) updateData.vehicle_no = data.vehicle_no;
  if (data.notes !== undefined) updateData.notes = data.notes;

  // If route or trips_count changed, recalculate amount
  let routeId = existing.route_id;
  let tripsCount = existing.trips_count;

  if (data.route_id) {
    routeId = data.route_id as string;
    updateData.route_id = routeId;
  }
  if (data.trips_count !== undefined) {
    tripsCount = data.trips_count as number;
    updateData.trips_count = tripsCount;
  }

  if (data.route_id || data.trips_count !== undefined) {
    const route = await prisma.deliveryRoute.findFirst({
      where: { route_id: routeId, company_id: companyId, is_active: true },
    });
    if (!route) throw new AppError(404, 'NOT_FOUND', 'Delivery route not found or inactive');

    const unitPrice = Number(route.standard_price);
    updateData.unit_price = unitPrice;
    updateData.amount = tripsCount * unitPrice;
  }

  const trip = await prisma.deliveryTrip.update({
    where: { trip_id: tripId },
    data: updateData as any,
    include: {
      route: {
        select: {
          route_id: true,
          route_name: true,
          origin: true,
          content_type: true,
          customer: { select: { customer_id: true, customer_code: true, customer_name: true } },
        },
      },
    },
  });

  return trip;
}

export async function confirmTrips(tripIds: string[], companyId: string) {
  // Verify all trips exist, belong to company, and are PENDING
  const trips = await prisma.deliveryTrip.findMany({
    where: {
      trip_id: { in: tripIds },
      company_id: companyId,
    },
  });

  if (trips.length !== tripIds.length) {
    throw new AppError(404, 'NOT_FOUND', 'One or more trips not found');
  }

  const nonPending = trips.filter((t) => t.status !== 'PENDING');
  if (nonPending.length > 0) {
    throw new AppError(400, 'INVALID_STATUS', `${nonPending.length} trip(s) are not in PENDING status`);
  }

  const result = await prisma.deliveryTrip.updateMany({
    where: {
      trip_id: { in: tripIds },
      company_id: companyId,
      status: 'PENDING',
    },
    data: { status: 'CONFIRMED' },
  });

  return { confirmed: result.count };
}

export async function voidTrip(tripId: string, companyId: string) {
  const existing = await prisma.deliveryTrip.findFirst({
    where: { trip_id: tripId, company_id: companyId },
  });

  if (!existing) throw new AppError(404, 'NOT_FOUND', 'Delivery trip not found');
  if (existing.status === 'BILLED') {
    throw new AppError(400, 'INVALID_STATUS', 'Cannot void a billed trip');
  }
  if (existing.status === 'VOID') {
    throw new AppError(400, 'INVALID_STATUS', 'Trip is already voided');
  }

  const trip = await prisma.deliveryTrip.update({
    where: { trip_id: tripId },
    data: { status: 'VOID' },
  });

  return trip;
}

export async function generateInvoice(
  companyId: string,
  userId: string,
  data: {
    customer_id: string;
    from_date: string;
    to_date: string;
    description?: string;
    notes?: string;
  }
) {
  // 1. Find all CONFIRMED trips for customer in date range
  const confirmedTrips = await prisma.deliveryTrip.findMany({
    where: {
      company_id: companyId,
      status: 'CONFIRMED',
      route: { customer_id: data.customer_id },
      trip_date: {
        gte: new Date(data.from_date),
        lte: new Date(data.to_date),
      },
    },
    include: {
      route: { select: { route_name: true, content_type: true } },
    },
  });

  if (confirmedTrips.length === 0) {
    throw new AppError(400, 'NO_TRIPS', 'No confirmed trips found for the specified customer and date range');
  }

  // 2. Calculate subtotal
  const subtotal = confirmedTrips.reduce((sum, trip) => sum + Number(trip.amount), 0);

  // 3. Get company tax_rate
  const company = await prisma.company.findUnique({
    where: { company_id: companyId },
    select: { tax_rate: true, default_currency: true },
  });
  if (!company) throw new AppError(404, 'NOT_FOUND', 'Company not found');

  const taxRate = Number(company.tax_rate);
  const tax_amount = Math.round(subtotal * taxRate) / 100;
  const total_amount = subtotal + tax_amount;

  // 4. Auto-generate invoice number INV-YYYY-NNNN
  const year = new Date().getFullYear();
  const lastInvoice = await prisma.arInvoice.findFirst({
    where: {
      company_id: companyId,
      invoice_number: { startsWith: `INV-${year}-` },
    },
    orderBy: { invoice_number: 'desc' },
    select: { invoice_number: true },
  });

  let nextNum = 1;
  if (lastInvoice) {
    const match = lastInvoice.invoice_number.match(/INV-\d{4}-(\d+)/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }
  const invoice_number = `INV-${year}-${String(nextNum).padStart(4, '0')}`;

  // Build description from trip data if not provided
  const invoiceDescription = data.description ||
    `Delivery trips ${data.from_date} ~ ${data.to_date} (${confirmedTrips.length} trips)`;

  // 5. Create invoice and update trips in a transaction
  const invoice = await prisma.$transaction(async (tx) => {
    // Verify customer
    const customer = await tx.customer.findFirst({
      where: { customer_id: data.customer_id, company_id: companyId },
    });
    if (!customer) throw new AppError(404, 'NOT_FOUND', 'Customer not found');

    // Calculate due date based on customer payment terms
    const invoiceDate = new Date();
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + customer.payment_terms);

    const newInvoice = await tx.arInvoice.create({
      data: {
        invoice_number,
        customer_id: data.customer_id,
        invoice_date: invoiceDate,
        due_date: dueDate,
        subtotal,
        tax_amount,
        total_amount,
        currency: company.default_currency,
        status: 'ISSUED',
        description: invoiceDescription,
        notes: data.notes,
        company_id: companyId,
        created_by: userId,
      },
      include: {
        customer: { select: { customer_id: true, customer_code: true, customer_name: true } },
      },
    });

    // Update all trips: status=BILLED, invoice_id=new invoice
    await tx.deliveryTrip.updateMany({
      where: {
        trip_id: { in: confirmedTrips.map((t) => t.trip_id) },
      },
      data: {
        status: 'BILLED',
        invoice_id: newInvoice.invoice_id,
      },
    });

    return newInvoice;
  });

  return { invoice, tripsCount: confirmedTrips.length, subtotal, tax_amount, total_amount };
}

export async function importPreview(buffer: Buffer, companyId: string) {
  const sheets = parseDeliveryExcel(buffer);

  // Match customers and routes
  const previewSheets = [];
  const newRoutesMap = new Map<string, { route_name: string; content_type: string; customer_name: string; standard_price: number }>();
  let totalTrips = 0;
  let totalAmount = 0;

  for (const sheet of sheets) {
    // Try to find matching customer by name
    let matchedCustomer: { customer_id: string; customer_code: string; customer_name: string } | null = null;
    if (sheet.customerName) {
      matchedCustomer = await prisma.customer.findFirst({
        where: {
          company_id: companyId,
          OR: [
            { customer_name: { contains: sheet.customerName, mode: 'insensitive' } },
            { short_name: { contains: sheet.customerName, mode: 'insensitive' } },
          ],
        },
        select: { customer_id: true, customer_code: true, customer_name: true },
      });
    }

    // Try to match routes + collect new routes
    const rowsWithMatch = [];
    let sheetTripCount = 0;
    let sheetTotalAmount = 0;

    for (const row of sheet.rows) {
      let matchedRoute = null;
      if (matchedCustomer && row.routeName) {
        matchedRoute = await prisma.deliveryRoute.findFirst({
          where: {
            company_id: companyId,
            customer_id: matchedCustomer.customer_id,
            route_name: { contains: row.routeName, mode: 'insensitive' },
            content_type: row.contentType ? { contains: row.contentType, mode: 'insensitive' } : undefined,
          },
          select: { route_id: true, route_name: true, content_type: true, standard_price: true },
        });
      }

      if (!matchedRoute && row.routeName) {
        const key = `${sheet.customerName}|${row.routeName}|${row.contentType}`;
        if (!newRoutesMap.has(key)) {
          const unitPrice = row.tripsCount > 0 ? row.amount / row.tripsCount : row.amount;
          newRoutesMap.set(key, {
            route_name: row.routeName,
            content_type: row.contentType || 'general',
            customer_name: sheet.customerName,
            standard_price: unitPrice,
          });
        }
      }

      sheetTripCount += row.tripsCount;
      sheetTotalAmount += row.amount;

      rowsWithMatch.push({
        ...row,
        matched_route_id: matchedRoute?.route_id || null,
      });
    }

    totalTrips += sheetTripCount;
    totalAmount += sheetTotalAmount;

    // Parse date range
    const dates = sheet.rows.map((r) => r.date).filter(Boolean);
    const dateFrom = dates.length > 0 ? dates[0] : '';
    const dateTo = dates.length > 0 ? dates[dates.length - 1] : '';

    previewSheets.push({
      sheet_name: sheet.sheetName,
      customer_name: sheet.customerName,
      customer_id: matchedCustomer?.customer_id || null,
      date_range: { from: dateFrom, to: dateTo },
      trip_count: sheetTripCount,
      total_amount: sheetTotalAmount,
      rows: rowsWithMatch,
    });
  }

  return {
    sheets: previewSheets,
    new_routes: Array.from(newRoutesMap.values()),
    total_trips: totalTrips,
    total_amount: totalAmount,
  };
}

export async function importConfirm(
  data: {
    sheets: Array<{
      sheetName: string;
      customerName: string;
      customerId?: string;
      rows: Array<{
        date: string;
        routeName: string;
        contentType: string;
        tripsCount: number;
        amount: number;
      }>;
    }>;
    trip_date_fallback?: string;
    driver_name?: string;
    vehicle_no?: string;
    auto_confirm?: boolean;
  },
  companyId: string,
  userId: string
) {
  let routesCreated = 0;
  let tripsCreated = 0;

  for (const sheet of data.sheets) {
    if (!sheet.customerId) continue;

    // Verify customer
    const customer = await prisma.customer.findFirst({
      where: { customer_id: sheet.customerId, company_id: companyId },
    });
    if (!customer) continue;

    for (const row of sheet.rows) {
      // Find or create route
      let route = await prisma.deliveryRoute.findFirst({
        where: {
          company_id: companyId,
          customer_id: sheet.customerId,
          route_name: row.routeName,
          content_type: row.contentType || 'general',
        },
      });

      if (!route) {
        // Calculate unit price from amount and trips count
        const unitPrice = row.tripsCount > 0 ? row.amount / row.tripsCount : row.amount;
        route = await prisma.deliveryRoute.create({
          data: {
            customer_id: sheet.customerId,
            origin: '',
            route_name: row.routeName,
            content_type: row.contentType || 'general',
            standard_price: unitPrice,
            company_id: companyId,
          },
        });
        routesCreated++;
      }

      // Determine trip date
      let tripDate: Date;
      const currentYear = new Date().getFullYear();
      if (row.date) {
        // date is in MM-DD format
        tripDate = new Date(`${currentYear}-${row.date}`);
      } else if (data.trip_date_fallback) {
        tripDate = new Date(data.trip_date_fallback);
      } else {
        tripDate = new Date();
      }

      const unitPrice = Number(route.standard_price);
      const amount = row.tripsCount * unitPrice;

      await prisma.deliveryTrip.create({
        data: {
          trip_date: tripDate,
          route_id: route.route_id,
          trips_count: row.tripsCount,
          unit_price: unitPrice,
          amount,
          driver_name: data.driver_name,
          vehicle_no: data.vehicle_no,
          status: data.auto_confirm ? 'CONFIRMED' : 'PENDING',
          company_id: companyId,
          created_by: userId,
        },
      });
      tripsCreated++;
    }
  }

  return { routesCreated, tripsCreated };
}

export async function exportBillingDetail(
  companyId: string,
  data: { customer_id: string; from_date: string; to_date: string }
): Promise<{ buffer: Buffer; filename: string }> {
  // 1. Fetch company info
  const company = await prisma.company.findUnique({
    where: { company_id: companyId },
    select: { company_name: true, address: true, phone: true, tax_rate: true },
  });
  if (!company) throw new AppError(404, 'NOT_FOUND', 'Company not found');

  // 2. Fetch customer
  const customer = await prisma.customer.findFirst({
    where: { customer_id: data.customer_id, company_id: companyId },
    select: { customer_name: true, short_name: true, phone: true },
  });
  if (!customer) throw new AppError(404, 'NOT_FOUND', 'Customer not found');

  // 3. Fetch CONFIRMED or BILLED trips in date range
  const trips = await prisma.deliveryTrip.findMany({
    where: {
      company_id: companyId,
      status: { in: ['CONFIRMED', 'BILLED'] },
      route: { customer_id: data.customer_id },
      trip_date: {
        gte: new Date(data.from_date),
        lte: new Date(data.to_date),
      },
    },
    include: {
      route: { select: { route_name: true, content_type: true } },
    },
    orderBy: { trip_date: 'asc' },
  });

  if (trips.length === 0) {
    throw new AppError(400, 'NO_TRIPS', 'No trips found for the specified customer and date range');
  }

  // 4. Calculate totals
  const subtotal = trips.reduce((sum, t) => sum + Number(t.amount), 0);
  const taxRate = Number(company.tax_rate);
  const taxAmount = Math.round(subtotal * taxRate / 100);
  const total = subtotal + taxAmount;

  // 5. Build date labels
  const fromDate = new Date(data.from_date);
  const toDate = new Date(data.to_date);
  const fromMonth = fromDate.getMonth() + 1;
  const fromDay = fromDate.getDate();
  const toMonth = toDate.getMonth() + 1;
  const toDay = toDate.getDate();
  const dateRangeLabel = `${fromMonth}/${fromDay}-${toMonth}/${toDay}`;

  // ROC year (民國年)
  const rocYear = fromDate.getFullYear() - 1911;
  const yearMonthLabel = `${rocYear}年${fromMonth}月份報價帳單`;
  const effectiveDate = `${rocYear}/${fromMonth}`;

  // 6. Build rows
  const rows = trips.map((t) => ({
    tripDate: new Date(t.trip_date),
    routeName: t.route.route_name,
    contentType: t.route.content_type,
    tripsCount: t.trips_count,
    amount: Number(t.amount),
  }));

  // 7. Build Excel
  const buffer = buildBillingDetailExcel({
    companyName: company.company_name,
    companyAddress: company.address || '',
    companyPhone: company.phone ? `Tel：${company.phone}` : '',
    customerName: customer.customer_name,
    dateRangeLabel,
    yearMonthLabel,
    effectiveDate,
    rows,
    subtotal,
    taxRate,
    taxAmount,
    total,
  });

  const displayName = customer.short_name || customer.customer_name;
  const filename = `請款明細_${displayName}_${rocYear}年${fromMonth}月.xlsx`;

  return { buffer, filename };
}
