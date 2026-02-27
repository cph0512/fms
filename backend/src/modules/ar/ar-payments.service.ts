import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/errors/AppError.js';

export async function createPayment(
  data: {
    invoice_id: string;
    payment_date: string;
    amount: number;
    payment_method?: string;
    reference_no?: string;
    notes?: string;
  },
  companyId: string,
  userId: string
) {
  // Verify invoice exists and belongs to company
  const invoice = await prisma.arInvoice.findFirst({
    where: { invoice_id: data.invoice_id, company_id: companyId },
  });

  if (!invoice) throw new AppError(404, 'NOT_FOUND', 'Invoice not found');
  if (invoice.status === 'VOID') throw new AppError(400, 'INVALID_STATUS', 'Cannot pay a voided invoice');
  if (invoice.status === 'PAID') throw new AppError(400, 'INVALID_STATUS', 'Invoice is already fully paid');

  const remaining = Number(invoice.total_amount) - Number(invoice.paid_amount);
  if (data.amount > remaining) {
    throw new AppError(400, 'OVERPAYMENT', `Payment amount exceeds remaining balance of ${remaining}`);
  }

  // Create payment and update invoice in a transaction
  const [payment] = await prisma.$transaction(async (tx) => {
    const payment = await tx.arPayment.create({
      data: {
        invoice_id: data.invoice_id,
        payment_date: new Date(data.payment_date),
        amount: data.amount,
        payment_method: (data.payment_method as any) || 'BANK_TRANSFER',
        reference_no: data.reference_no,
        notes: data.notes,
        company_id: companyId,
        created_by: userId,
      },
    });

    const newPaidAmount = Number(invoice.paid_amount) + data.amount;
    const totalAmount = Number(invoice.total_amount);
    const newStatus = newPaidAmount >= totalAmount ? 'PAID' : 'PARTIALLY_PAID';

    await tx.arInvoice.update({
      where: { invoice_id: data.invoice_id },
      data: {
        paid_amount: newPaidAmount,
        status: newStatus,
      },
    });

    return [payment];
  });

  return payment;
}
