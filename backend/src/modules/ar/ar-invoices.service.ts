import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/errors/AppError.js';
import { parsePagination, paginationMeta } from '../../shared/utils/pagination.js';

export async function listInvoices(
  companyId: string,
  query: { page?: string; limit?: string; status?: string; customer_id?: string; from_date?: string; to_date?: string }
) {
  const { page, limit, skip, take } = parsePagination(query);

  const where: Record<string, unknown> = { company_id: companyId };

  if (query.status) where.status = query.status;
  if (query.customer_id) where.customer_id = query.customer_id;
  if (query.from_date || query.to_date) {
    const dateFilter: Record<string, unknown> = {};
    if (query.from_date) dateFilter.gte = new Date(query.from_date);
    if (query.to_date) dateFilter.lte = new Date(query.to_date);
    where.invoice_date = dateFilter;
  }

  const [invoices, total] = await Promise.all([
    prisma.arInvoice.findMany({
      where: where as any,
      skip,
      take,
      orderBy: { created_at: 'desc' },
      include: {
        customer: { select: { customer_id: true, customer_code: true, customer_name: true } },
      },
    }),
    prisma.arInvoice.count({ where: where as any }),
  ]);

  return { invoices, meta: paginationMeta(total, page, limit) };
}

export async function getInvoiceById(invoiceId: string, companyId: string) {
  const invoice = await prisma.arInvoice.findFirst({
    where: { invoice_id: invoiceId, company_id: companyId },
    include: {
      customer: { select: { customer_id: true, customer_code: true, customer_name: true, short_name: true } },
      payments: { orderBy: { payment_date: 'desc' } },
    },
  });

  if (!invoice) {
    throw new AppError(404, 'NOT_FOUND', 'Invoice not found');
  }

  return invoice;
}

export async function createInvoice(
  data: {
    customer_id: string;
    invoice_date: string;
    due_date: string;
    subtotal: number;
    currency?: string;
    status?: string;
    description?: string;
    notes?: string;
  },
  companyId: string,
  userId: string
) {
  // Get company tax rate
  const company = await prisma.company.findUnique({
    where: { company_id: companyId },
    select: { tax_rate: true, default_currency: true },
  });
  if (!company) throw new AppError(404, 'NOT_FOUND', 'Company not found');

  // Verify customer belongs to this company
  const customer = await prisma.customer.findFirst({
    where: { customer_id: data.customer_id, company_id: companyId },
  });
  if (!customer) throw new AppError(404, 'NOT_FOUND', 'Customer not found');

  // Auto-generate invoice_number: INV-2026-0001
  const year = new Date(data.invoice_date).getFullYear();
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

  // Calculate tax
  const taxRate = Number(company.tax_rate);
  const tax_amount = Math.round(data.subtotal * taxRate) / 100;
  const total_amount = data.subtotal + tax_amount;

  const invoice = await prisma.arInvoice.create({
    data: {
      invoice_number,
      customer_id: data.customer_id,
      invoice_date: new Date(data.invoice_date),
      due_date: new Date(data.due_date),
      subtotal: data.subtotal,
      tax_amount,
      total_amount,
      currency: data.currency || company.default_currency,
      status: (data.status as any) || 'DRAFT',
      description: data.description,
      notes: data.notes,
      company_id: companyId,
      created_by: userId,
    },
    include: {
      customer: { select: { customer_id: true, customer_code: true, customer_name: true } },
    },
  });

  return invoice;
}

export async function updateInvoice(
  invoiceId: string,
  companyId: string,
  data: Record<string, unknown>
) {
  const existing = await prisma.arInvoice.findFirst({
    where: { invoice_id: invoiceId, company_id: companyId },
  });

  if (!existing) throw new AppError(404, 'NOT_FOUND', 'Invoice not found');
  if (existing.status === 'VOID') throw new AppError(400, 'INVALID_STATUS', 'Cannot update a voided invoice');
  if (existing.status === 'PAID') throw new AppError(400, 'INVALID_STATUS', 'Cannot update a paid invoice');

  const updateData: Record<string, unknown> = {};

  // If subtotal changes, recalculate tax
  if (data.subtotal !== undefined) {
    const company = await prisma.company.findUnique({
      where: { company_id: companyId },
      select: { tax_rate: true },
    });
    const taxRate = Number(company!.tax_rate);
    const subtotal = data.subtotal as number;
    updateData.subtotal = subtotal;
    updateData.tax_amount = Math.round(subtotal * taxRate) / 100;
    updateData.total_amount = subtotal + (updateData.tax_amount as number);
  }

  if (data.customer_id) updateData.customer_id = data.customer_id;
  if (data.invoice_date) updateData.invoice_date = new Date(data.invoice_date as string);
  if (data.due_date) updateData.due_date = new Date(data.due_date as string);
  if (data.status) updateData.status = data.status;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.notes !== undefined) updateData.notes = data.notes;

  const invoice = await prisma.arInvoice.update({
    where: { invoice_id: invoiceId },
    data: updateData as any,
    include: {
      customer: { select: { customer_id: true, customer_code: true, customer_name: true } },
    },
  });

  return invoice;
}

export async function voidInvoice(invoiceId: string, companyId: string) {
  const existing = await prisma.arInvoice.findFirst({
    where: { invoice_id: invoiceId, company_id: companyId },
  });

  if (!existing) throw new AppError(404, 'NOT_FOUND', 'Invoice not found');
  if (existing.status === 'VOID') throw new AppError(400, 'INVALID_STATUS', 'Invoice is already voided');
  if (existing.status === 'PAID') throw new AppError(400, 'INVALID_STATUS', 'Cannot void a fully paid invoice');

  const invoice = await prisma.arInvoice.update({
    where: { invoice_id: invoiceId },
    data: { status: 'VOID' },
  });

  return invoice;
}
