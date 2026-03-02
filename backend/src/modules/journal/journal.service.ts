import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/errors/AppError.js';
import { parsePagination, paginationMeta } from '../../shared/utils/pagination.js';

export async function listEntries(
  companyId: string,
  query: { page?: string; limit?: string; status?: string; from_date?: string; to_date?: string }
) {
  const { page, limit, skip, take } = parsePagination(query);

  const where: Record<string, unknown> = { company_id: companyId };

  if (query.status) {
    where.status = query.status;
  }

  if (query.from_date || query.to_date) {
    where.entry_date = {};
    if (query.from_date) (where.entry_date as any).gte = new Date(query.from_date);
    if (query.to_date) (where.entry_date as any).lte = new Date(query.to_date);
  }

  const [entries, total] = await Promise.all([
    prisma.journalEntry.findMany({
      where: where as any,
      skip,
      take,
      orderBy: { entry_date: 'desc' },
      include: {
        lines: {
          include: { account: { select: { account_code: true, account_name: true } } },
          orderBy: { line_order: 'asc' },
        },
      },
    }),
    prisma.journalEntry.count({ where: where as any }),
  ]);

  return { entries, meta: paginationMeta(total, page, limit) };
}

export async function getEntryById(entryId: string, companyId: string) {
  const entry = await prisma.journalEntry.findFirst({
    where: { entry_id: entryId, company_id: companyId },
    include: {
      lines: {
        include: { account: { select: { account_id: true, account_code: true, account_name: true } } },
        orderBy: { line_order: 'asc' },
      },
    },
  });

  if (!entry) {
    throw new AppError(404, 'NOT_FOUND', 'Journal entry not found');
  }

  return entry;
}

export async function createEntry(
  data: {
    entry_date: string;
    description?: string;
    lines: Array<{
      account_id: string;
      debit_amount: number;
      credit_amount: number;
      description?: string;
    }>;
  },
  companyId: string,
  userId: string
) {
  // Validate debit = credit
  const totalDebit = data.lines.reduce((sum, l) => sum + l.debit_amount, 0);
  const totalCredit = data.lines.reduce((sum, l) => sum + l.credit_amount, 0);

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new AppError(400, 'UNBALANCED', 'Total debits must equal total credits');
  }

  // Each line must have either debit or credit (not both)
  for (const line of data.lines) {
    if (line.debit_amount > 0 && line.credit_amount > 0) {
      throw new AppError(400, 'INVALID_LINE', 'A line cannot have both debit and credit amounts');
    }
    if (line.debit_amount === 0 && line.credit_amount === 0) {
      throw new AppError(400, 'INVALID_LINE', 'A line must have either debit or credit amount');
    }
  }

  // Auto-generate entry_number: JE-YYYY-NNNN
  const year = new Date(data.entry_date).getFullYear();
  const lastEntry = await prisma.journalEntry.findFirst({
    where: {
      company_id: companyId,
      entry_number: { startsWith: `JE-${year}-` },
    },
    orderBy: { entry_number: 'desc' },
    select: { entry_number: true },
  });

  let nextNum = 1;
  if (lastEntry) {
    const match = lastEntry.entry_number.match(/JE-\d{4}-(\d+)/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }
  const entry_number = `JE-${year}-${String(nextNum).padStart(4, '0')}`;

  return prisma.journalEntry.create({
    data: {
      entry_number,
      entry_date: new Date(data.entry_date),
      description: data.description,
      company_id: companyId,
      created_by: userId,
      lines: {
        create: data.lines.map((line, index) => ({
          account_id: line.account_id,
          debit_amount: line.debit_amount,
          credit_amount: line.credit_amount,
          description: line.description,
          line_order: index,
        })),
      },
    },
    include: {
      lines: {
        include: { account: { select: { account_code: true, account_name: true } } },
        orderBy: { line_order: 'asc' },
      },
    },
  });
}

export async function updateEntry(
  entryId: string,
  companyId: string,
  data: {
    entry_date?: string;
    description?: string | null;
    lines?: Array<{
      account_id: string;
      debit_amount: number;
      credit_amount: number;
      description?: string;
    }>;
  }
) {
  const existing = await prisma.journalEntry.findFirst({
    where: { entry_id: entryId, company_id: companyId },
  });

  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Journal entry not found');
  }

  if (existing.status !== 'DRAFT') {
    throw new AppError(400, 'NOT_EDITABLE', 'Only DRAFT entries can be edited');
  }

  if (data.lines) {
    const totalDebit = data.lines.reduce((sum, l) => sum + l.debit_amount, 0);
    const totalCredit = data.lines.reduce((sum, l) => sum + l.credit_amount, 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new AppError(400, 'UNBALANCED', 'Total debits must equal total credits');
    }
  }

  return prisma.$transaction(async (tx) => {
    if (data.lines) {
      await tx.journalEntryLine.deleteMany({ where: { entry_id: entryId } });
      await tx.journalEntryLine.createMany({
        data: data.lines.map((line, index) => ({
          entry_id: entryId,
          account_id: line.account_id,
          debit_amount: line.debit_amount,
          credit_amount: line.credit_amount,
          description: line.description,
          line_order: index,
        })),
      });
    }

    return tx.journalEntry.update({
      where: { entry_id: entryId },
      data: {
        ...(data.entry_date && { entry_date: new Date(data.entry_date) }),
        ...(data.description !== undefined && { description: data.description }),
      },
      include: {
        lines: {
          include: { account: { select: { account_code: true, account_name: true } } },
          orderBy: { line_order: 'asc' },
        },
      },
    });
  });
}

export async function postEntry(entryId: string, companyId: string) {
  const existing = await prisma.journalEntry.findFirst({
    where: { entry_id: entryId, company_id: companyId },
  });

  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Journal entry not found');
  }

  if (existing.status !== 'DRAFT') {
    throw new AppError(400, 'INVALID_STATUS', 'Only DRAFT entries can be posted');
  }

  return prisma.journalEntry.update({
    where: { entry_id: entryId },
    data: { status: 'POSTED', posted_at: new Date() },
    include: {
      lines: {
        include: { account: { select: { account_code: true, account_name: true } } },
        orderBy: { line_order: 'asc' },
      },
    },
  });
}

export async function voidEntry(entryId: string, companyId: string) {
  const existing = await prisma.journalEntry.findFirst({
    where: { entry_id: entryId, company_id: companyId },
  });

  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Journal entry not found');
  }

  if (existing.status === 'VOID') {
    throw new AppError(400, 'ALREADY_VOID', 'Entry is already voided');
  }

  return prisma.journalEntry.update({
    where: { entry_id: entryId },
    data: { status: 'VOID', voided_at: new Date() },
  });
}
