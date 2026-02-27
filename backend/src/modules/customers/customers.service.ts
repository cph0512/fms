import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/errors/AppError.js';
import { parsePagination, paginationMeta } from '../../shared/utils/pagination.js';

export async function listCustomers(
  companyId: string,
  query: { page?: string; limit?: string; search?: string; status?: string }
) {
  const { page, limit, skip, take } = parsePagination(query);

  const where: Record<string, unknown> = { company_id: companyId };

  if (query.search) {
    where.OR = [
      { customer_name: { contains: query.search, mode: 'insensitive' } },
      { customer_code: { contains: query.search, mode: 'insensitive' } },
      { contact_person: { contains: query.search, mode: 'insensitive' } },
      { tax_id: { contains: query.search } },
    ];
  }

  if (query.status) {
    where.status = query.status;
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where: where as any,
      skip,
      take,
      orderBy: { created_at: 'desc' },
    }),
    prisma.customer.count({ where: where as any }),
  ]);

  return { customers, meta: paginationMeta(total, page, limit) };
}

export async function getCustomerById(customerId: string, companyId: string) {
  const customer = await prisma.customer.findFirst({
    where: { customer_id: customerId, company_id: companyId },
  });

  if (!customer) {
    throw new AppError(404, 'NOT_FOUND', 'Customer not found');
  }

  return customer;
}

export async function createCustomer(
  data: {
    customer_name: string;
    short_name?: string;
    tax_id?: string;
    contact_person?: string;
    phone?: string;
    fax?: string;
    email?: string;
    address?: string;
    payment_terms?: number;
    credit_limit?: number;
    notes?: string;
  },
  companyId: string
) {
  // Auto-generate customer_code: C-0001, C-0002...
  const lastCustomer = await prisma.customer.findFirst({
    where: { company_id: companyId },
    orderBy: { customer_code: 'desc' },
    select: { customer_code: true },
  });

  let nextNum = 1;
  if (lastCustomer) {
    const match = lastCustomer.customer_code.match(/C-(\d+)/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }
  const customer_code = `C-${String(nextNum).padStart(4, '0')}`;

  const customer = await prisma.customer.create({
    data: {
      customer_code,
      customer_name: data.customer_name,
      short_name: data.short_name,
      tax_id: data.tax_id,
      contact_person: data.contact_person,
      phone: data.phone,
      fax: data.fax,
      email: data.email,
      address: data.address,
      payment_terms: data.payment_terms ?? 30,
      credit_limit: data.credit_limit ?? 0,
      notes: data.notes,
      company_id: companyId,
    },
  });

  return customer;
}

export async function updateCustomer(
  customerId: string,
  companyId: string,
  data: Record<string, unknown>
) {
  // Verify customer belongs to company
  const existing = await prisma.customer.findFirst({
    where: { customer_id: customerId, company_id: companyId },
  });

  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Customer not found');
  }

  const customer = await prisma.customer.update({
    where: { customer_id: customerId },
    data: data as any,
  });

  return customer;
}
