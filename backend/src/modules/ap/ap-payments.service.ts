import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/errors/AppError.js';

export async function createPayment(
  data: {
    bill_id: string;
    payment_date: string;
    amount: number;
    payment_method?: string;
    reference_no?: string;
    notes?: string;
  },
  companyId: string,
  userId: string
) {
  // Verify bill exists and belongs to company
  const bill = await prisma.apBill.findFirst({
    where: { bill_id: data.bill_id, company_id: companyId },
  });

  if (!bill) throw new AppError(404, 'NOT_FOUND', 'Bill not found');
  if (bill.status === 'VOID') throw new AppError(400, 'INVALID_STATUS', 'Cannot pay a voided bill');
  if (bill.status === 'PAID') throw new AppError(400, 'INVALID_STATUS', 'Bill is already fully paid');

  const remaining = Number(bill.total_amount) - Number(bill.paid_amount);
  if (data.amount > remaining) {
    throw new AppError(400, 'OVERPAYMENT', `Payment amount exceeds remaining balance of ${remaining}`);
  }

  // Create payment and update bill in a transaction
  const [payment] = await prisma.$transaction(async (tx) => {
    const payment = await tx.apPayment.create({
      data: {
        bill_id: data.bill_id,
        payment_date: new Date(data.payment_date),
        amount: data.amount,
        payment_method: (data.payment_method as any) || 'BANK_TRANSFER',
        reference_no: data.reference_no,
        notes: data.notes,
        company_id: companyId,
        created_by: userId,
      },
    });

    const newPaidAmount = Number(bill.paid_amount) + data.amount;
    const totalAmount = Number(bill.total_amount);
    const newStatus = newPaidAmount >= totalAmount ? 'PAID' : 'PARTIALLY_PAID';

    await tx.apBill.update({
      where: { bill_id: data.bill_id },
      data: {
        paid_amount: newPaidAmount,
        status: newStatus,
      },
    });

    return [payment];
  });

  return payment;
}
