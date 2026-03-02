import { prisma } from '../../config/database.js';

export async function getDashboardSummary(companyId: string) {
  const today = new Date();

  const [
    customerCount,
    vendorCount,
    arAgg,
    apAgg,
    arOverdue,
    apOverdue,
    recentArInvoices,
    recentApBills,
  ] = await Promise.all([
    prisma.customer.count({ where: { company_id: companyId, status: 'ACTIVE' } }),
    prisma.vendor.count({ where: { company_id: companyId, status: 'ACTIVE' } }),
    prisma.arInvoice.aggregate({
      where: { company_id: companyId, status: { notIn: ['VOID'] } },
      _sum: { total_amount: true, paid_amount: true },
    }),
    prisma.apBill.aggregate({
      where: { company_id: companyId, status: { notIn: ['VOID'] } },
      _sum: { total_amount: true, paid_amount: true },
    }),
    prisma.arInvoice.aggregate({
      where: {
        company_id: companyId,
        status: { in: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'] },
        due_date: { lt: today },
      },
      _sum: { total_amount: true, paid_amount: true },
      _count: true,
    }),
    prisma.apBill.aggregate({
      where: {
        company_id: companyId,
        status: { in: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'] },
        due_date: { lt: today },
      },
      _sum: { total_amount: true, paid_amount: true },
      _count: true,
    }),
    prisma.arInvoice.findMany({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' },
      take: 5,
      include: { customer: { select: { customer_name: true } } },
    }),
    prisma.apBill.findMany({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' },
      take: 5,
      include: { vendor: { select: { vendor_name: true } } },
    }),
  ]);

  return {
    customers: customerCount,
    vendors: vendorCount,
    ar: {
      total: Number(arAgg._sum.total_amount ?? 0),
      paid: Number(arAgg._sum.paid_amount ?? 0),
      outstanding: Number(arAgg._sum.total_amount ?? 0) - Number(arAgg._sum.paid_amount ?? 0),
      overdue_count: arOverdue._count,
      overdue_amount: Number(arOverdue._sum.total_amount ?? 0) - Number(arOverdue._sum.paid_amount ?? 0),
    },
    ap: {
      total: Number(apAgg._sum.total_amount ?? 0),
      paid: Number(apAgg._sum.paid_amount ?? 0),
      outstanding: Number(apAgg._sum.total_amount ?? 0) - Number(apAgg._sum.paid_amount ?? 0),
      overdue_count: apOverdue._count,
      overdue_amount: Number(apOverdue._sum.total_amount ?? 0) - Number(apOverdue._sum.paid_amount ?? 0),
    },
    recent_ar_invoices: recentArInvoices,
    recent_ap_bills: recentApBills,
  };
}
