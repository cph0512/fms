import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/errors/AppError.js';
import { parsePagination, paginationMeta } from '../../shared/utils/pagination.js';

export async function listRoutes(
  companyId: string,
  query: {
    page?: string;
    limit?: string;
    customer_id?: string;
    content_type?: string;
    search?: string;
    is_active?: string;
  }
) {
  const { page, limit, skip, take } = parsePagination(query);

  const where: Record<string, unknown> = { company_id: companyId };

  if (query.customer_id) where.customer_id = query.customer_id;
  if (query.content_type) where.content_type = query.content_type;
  if (query.is_active !== undefined) where.is_active = query.is_active === 'true';

  if (query.search) {
    where.OR = [
      { route_name: { contains: query.search, mode: 'insensitive' } },
      { origin: { contains: query.search, mode: 'insensitive' } },
      { content_type: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [routes, total] = await Promise.all([
    prisma.deliveryRoute.findMany({
      where: where as any,
      skip,
      take,
      orderBy: { created_at: 'desc' },
      include: {
        customer: { select: { customer_id: true, customer_code: true, customer_name: true, short_name: true } },
      },
    }),
    prisma.deliveryRoute.count({ where: where as any }),
  ]);

  return { routes, meta: paginationMeta(total, page, limit) };
}

export async function getRouteById(routeId: string, companyId: string) {
  const route = await prisma.deliveryRoute.findFirst({
    where: { route_id: routeId, company_id: companyId },
    include: {
      customer: { select: { customer_id: true, customer_code: true, customer_name: true, short_name: true } },
    },
  });

  if (!route) {
    throw new AppError(404, 'NOT_FOUND', 'Delivery route not found');
  }

  return route;
}

export async function createRoute(
  data: {
    customer_id: string;
    origin: string;
    route_name: string;
    content_type: string;
    standard_price: number;
    notes?: string;
  },
  companyId: string
) {
  // Verify customer belongs to this company
  const customer = await prisma.customer.findFirst({
    where: { customer_id: data.customer_id, company_id: companyId },
  });
  if (!customer) throw new AppError(404, 'NOT_FOUND', 'Customer not found');

  // Check unique constraint
  const existing = await prisma.deliveryRoute.findFirst({
    where: {
      company_id: companyId,
      customer_id: data.customer_id,
      route_name: data.route_name,
      content_type: data.content_type,
    },
  });
  if (existing) {
    throw new AppError(409, 'DUPLICATE', 'A route with the same customer, route name, and content type already exists');
  }

  const route = await prisma.deliveryRoute.create({
    data: {
      customer_id: data.customer_id,
      origin: data.origin,
      route_name: data.route_name,
      content_type: data.content_type,
      standard_price: data.standard_price,
      notes: data.notes,
      company_id: companyId,
    },
    include: {
      customer: { select: { customer_id: true, customer_code: true, customer_name: true } },
    },
  });

  return route;
}

export async function updateRoute(
  routeId: string,
  companyId: string,
  data: Record<string, unknown>
) {
  const existing = await prisma.deliveryRoute.findFirst({
    where: { route_id: routeId, company_id: companyId },
  });

  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Delivery route not found');
  }

  // If changing customer, verify it belongs to the company
  if (data.customer_id) {
    const customer = await prisma.customer.findFirst({
      where: { customer_id: data.customer_id as string, company_id: companyId },
    });
    if (!customer) throw new AppError(404, 'NOT_FOUND', 'Customer not found');
  }

  const route = await prisma.deliveryRoute.update({
    where: { route_id: routeId },
    data: data as any,
    include: {
      customer: { select: { customer_id: true, customer_code: true, customer_name: true } },
    },
  });

  return route;
}

export async function batchCreateRoutes(
  routes: Array<{
    customer_id: string;
    origin: string;
    route_name: string;
    content_type: string;
    standard_price: number;
    notes?: string;
  }>,
  companyId: string
) {
  let created = 0;
  let updated = 0;

  for (const routeData of routes) {
    // Verify customer belongs to this company
    const customer = await prisma.customer.findFirst({
      where: { customer_id: routeData.customer_id, company_id: companyId },
    });
    if (!customer) {
      throw new AppError(404, 'NOT_FOUND', `Customer ${routeData.customer_id} not found`);
    }

    const existing = await prisma.deliveryRoute.findFirst({
      where: {
        company_id: companyId,
        customer_id: routeData.customer_id,
        route_name: routeData.route_name,
        content_type: routeData.content_type,
      },
    });

    if (existing) {
      await prisma.deliveryRoute.update({
        where: { route_id: existing.route_id },
        data: {
          origin: routeData.origin,
          standard_price: routeData.standard_price,
          notes: routeData.notes,
          is_active: true,
        },
      });
      updated++;
    } else {
      await prisma.deliveryRoute.create({
        data: {
          customer_id: routeData.customer_id,
          origin: routeData.origin,
          route_name: routeData.route_name,
          content_type: routeData.content_type,
          standard_price: routeData.standard_price,
          notes: routeData.notes,
          company_id: companyId,
        },
      });
      created++;
    }
  }

  return { created, updated };
}

export async function getRoutesByCustomer(customerId: string, companyId: string) {
  const routes = await prisma.deliveryRoute.findMany({
    where: {
      company_id: companyId,
      customer_id: customerId,
      is_active: true,
    },
    orderBy: { route_name: 'asc' },
  });

  return routes;
}
