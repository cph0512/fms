import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/errors/AppError.js';
import { parsePagination, paginationMeta } from '../../shared/utils/pagination.js';

export async function listVendors(
  companyId: string,
  query: { page?: string; limit?: string; search?: string; status?: string }
) {
  const { page, limit, skip, take } = parsePagination(query);

  const where: Record<string, unknown> = { company_id: companyId };

  if (query.search) {
    where.OR = [
      { vendor_name: { contains: query.search, mode: 'insensitive' } },
      { vendor_code: { contains: query.search, mode: 'insensitive' } },
      { contact_person: { contains: query.search, mode: 'insensitive' } },
      { tax_id: { contains: query.search } },
    ];
  }

  if (query.status) {
    where.status = query.status;
  }

  const [vendors, total] = await Promise.all([
    prisma.vendor.findMany({
      where: where as any,
      skip,
      take,
      orderBy: { created_at: 'desc' },
    }),
    prisma.vendor.count({ where: where as any }),
  ]);

  return { vendors, meta: paginationMeta(total, page, limit) };
}

export async function getVendorById(vendorId: string, companyId: string) {
  const vendor = await prisma.vendor.findFirst({
    where: { vendor_id: vendorId, company_id: companyId },
  });

  if (!vendor) {
    throw new AppError(404, 'NOT_FOUND', 'Vendor not found');
  }

  return vendor;
}

export async function createVendor(
  data: {
    vendor_name: string;
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
  // Auto-generate vendor_code: V-0001, V-0002...
  const lastVendor = await prisma.vendor.findFirst({
    where: { company_id: companyId },
    orderBy: { vendor_code: 'desc' },
    select: { vendor_code: true },
  });

  let nextNum = 1;
  if (lastVendor) {
    const match = lastVendor.vendor_code.match(/V-(\d+)/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }
  const vendor_code = `V-${String(nextNum).padStart(4, '0')}`;

  const vendor = await prisma.vendor.create({
    data: {
      vendor_code,
      vendor_name: data.vendor_name,
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

  return vendor;
}

export async function updateVendor(
  vendorId: string,
  companyId: string,
  data: Record<string, unknown>
) {
  const existing = await prisma.vendor.findFirst({
    where: { vendor_id: vendorId, company_id: companyId },
  });

  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Vendor not found');
  }

  const vendor = await prisma.vendor.update({
    where: { vendor_id: vendorId },
    data: data as any,
  });

  return vendor;
}
