import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/errors/AppError.js';
import { parsePagination, paginationMeta } from '../../shared/utils/pagination.js';

export async function listBills(
  companyId: string,
  query: { page?: string; limit?: string; status?: string; vendor_id?: string; from_date?: string; to_date?: string }
) {
  const { page, limit, skip, take } = parsePagination(query);

  const where: Record<string, unknown> = { company_id: companyId };

  if (query.status) where.status = query.status;
  if (query.vendor_id) where.vendor_id = query.vendor_id;
  if (query.from_date || query.to_date) {
    const dateFilter: Record<string, unknown> = {};
    if (query.from_date) dateFilter.gte = new Date(query.from_date);
    if (query.to_date) dateFilter.lte = new Date(query.to_date);
    where.bill_date = dateFilter;
  }

  const [bills, total] = await Promise.all([
    prisma.apBill.findMany({
      where: where as any,
      skip,
      take,
      orderBy: { created_at: 'desc' },
      include: {
        vendor: { select: { vendor_id: true, vendor_code: true, vendor_name: true } },
      },
    }),
    prisma.apBill.count({ where: where as any }),
  ]);

  return { bills, meta: paginationMeta(total, page, limit) };
}

export async function getBillById(billId: string, companyId: string) {
  const bill = await prisma.apBill.findFirst({
    where: { bill_id: billId, company_id: companyId },
    include: {
      vendor: { select: { vendor_id: true, vendor_code: true, vendor_name: true, short_name: true } },
      payments: { orderBy: { payment_date: 'desc' } },
    },
  });

  if (!bill) {
    throw new AppError(404, 'NOT_FOUND', 'Bill not found');
  }

  return bill;
}

export async function createBill(
  data: {
    vendor_id: string;
    bill_date: string;
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

  // Verify vendor belongs to this company
  const vendor = await prisma.vendor.findFirst({
    where: { vendor_id: data.vendor_id, company_id: companyId },
  });
  if (!vendor) throw new AppError(404, 'NOT_FOUND', 'Vendor not found');

  // Auto-generate bill_number: BIL-2026-0001
  const year = new Date(data.bill_date).getFullYear();
  const lastBill = await prisma.apBill.findFirst({
    where: {
      company_id: companyId,
      bill_number: { startsWith: `BIL-${year}-` },
    },
    orderBy: { bill_number: 'desc' },
    select: { bill_number: true },
  });

  let nextNum = 1;
  if (lastBill) {
    const match = lastBill.bill_number.match(/BIL-\d{4}-(\d+)/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }
  const bill_number = `BIL-${year}-${String(nextNum).padStart(4, '0')}`;

  // Calculate tax
  const taxRate = Number(company.tax_rate);
  const tax_amount = Math.round(data.subtotal * taxRate) / 100;
  const total_amount = data.subtotal + tax_amount;

  const bill = await prisma.apBill.create({
    data: {
      bill_number,
      vendor_id: data.vendor_id,
      bill_date: new Date(data.bill_date),
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
      vendor: { select: { vendor_id: true, vendor_code: true, vendor_name: true } },
    },
  });

  return bill;
}

export async function updateBill(
  billId: string,
  companyId: string,
  data: Record<string, unknown>
) {
  const existing = await prisma.apBill.findFirst({
    where: { bill_id: billId, company_id: companyId },
  });

  if (!existing) throw new AppError(404, 'NOT_FOUND', 'Bill not found');
  if (existing.status === 'VOID') throw new AppError(400, 'INVALID_STATUS', 'Cannot update a voided bill');
  if (existing.status === 'PAID') throw new AppError(400, 'INVALID_STATUS', 'Cannot update a paid bill');

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

  if (data.vendor_id) updateData.vendor_id = data.vendor_id;
  if (data.bill_date) updateData.bill_date = new Date(data.bill_date as string);
  if (data.due_date) updateData.due_date = new Date(data.due_date as string);
  if (data.status) updateData.status = data.status;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.notes !== undefined) updateData.notes = data.notes;

  const bill = await prisma.apBill.update({
    where: { bill_id: billId },
    data: updateData as any,
    include: {
      vendor: { select: { vendor_id: true, vendor_code: true, vendor_name: true } },
    },
  });

  return bill;
}

export async function voidBill(billId: string, companyId: string) {
  const existing = await prisma.apBill.findFirst({
    where: { bill_id: billId, company_id: companyId },
  });

  if (!existing) throw new AppError(404, 'NOT_FOUND', 'Bill not found');
  if (existing.status === 'VOID') throw new AppError(400, 'INVALID_STATUS', 'Bill is already voided');
  if (existing.status === 'PAID') throw new AppError(400, 'INVALID_STATUS', 'Cannot void a fully paid bill');

  const bill = await prisma.apBill.update({
    where: { bill_id: billId },
    data: { status: 'VOID' },
  });

  return bill;
}
