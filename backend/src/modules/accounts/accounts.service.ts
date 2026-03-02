import * as XLSX from 'xlsx';
import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/errors/AppError.js';
import { parsePagination, paginationMeta } from '../../shared/utils/pagination.js';

export async function listAccounts(
  companyId: string,
  query: { page?: string; limit?: string; search?: string; account_type?: string; is_active?: string }
) {
  const { page, limit, skip, take } = parsePagination(query);

  const where: Record<string, unknown> = { company_id: companyId };

  if (query.search) {
    where.OR = [
      { account_code: { contains: query.search, mode: 'insensitive' } },
      { account_name: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  if (query.account_type) {
    where.account_type = query.account_type;
  }

  if (query.is_active !== undefined) {
    where.is_active = query.is_active === 'true';
  }

  const [accounts, total] = await Promise.all([
    prisma.account.findMany({
      where: where as any,
      skip,
      take,
      orderBy: { account_code: 'asc' },
      include: { parent: { select: { account_id: true, account_code: true, account_name: true } } },
    }),
    prisma.account.count({ where: where as any }),
  ]);

  return { accounts, meta: paginationMeta(total, page, limit) };
}

export async function getAccountTree(companyId: string) {
  const accounts = await prisma.account.findMany({
    where: { company_id: companyId },
    orderBy: { account_code: 'asc' },
  });

  // Build tree structure
  const map = new Map<string, any>();
  const roots: any[] = [];

  for (const acc of accounts) {
    map.set(acc.account_id, { ...acc, children: [] });
  }

  for (const acc of accounts) {
    const node = map.get(acc.account_id);
    if (acc.parent_account_id && map.has(acc.parent_account_id)) {
      map.get(acc.parent_account_id).children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export async function getAccountById(accountId: string, companyId: string) {
  const account = await prisma.account.findFirst({
    where: { account_id: accountId, company_id: companyId },
    include: {
      parent: { select: { account_id: true, account_code: true, account_name: true } },
      children: { select: { account_id: true, account_code: true, account_name: true }, orderBy: { account_code: 'asc' } },
    },
  });

  if (!account) {
    throw new AppError(404, 'NOT_FOUND', 'Account not found');
  }

  return account;
}

export async function createAccount(
  data: {
    account_code: string;
    account_name: string;
    account_type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
    parent_account_id?: string;
    description?: string;
    is_active?: boolean;
  },
  companyId: string
) {
  // Check duplicate code
  const existing = await prisma.account.findFirst({
    where: { company_id: companyId, account_code: data.account_code },
  });
  if (existing) {
    throw new AppError(409, 'DUPLICATE', 'Account code already exists');
  }

  let level = 1;
  if (data.parent_account_id) {
    const parent = await prisma.account.findFirst({
      where: { account_id: data.parent_account_id, company_id: companyId },
    });
    if (!parent) {
      throw new AppError(404, 'NOT_FOUND', 'Parent account not found');
    }
    level = parent.level + 1;
  }

  return prisma.account.create({
    data: {
      account_code: data.account_code,
      account_name: data.account_name,
      account_type: data.account_type,
      parent_account_id: data.parent_account_id,
      description: data.description,
      is_active: data.is_active ?? true,
      level,
      company_id: companyId,
    },
  });
}

export async function updateAccount(
  accountId: string,
  companyId: string,
  data: Record<string, unknown>
) {
  const existing = await prisma.account.findFirst({
    where: { account_id: accountId, company_id: companyId },
  });

  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Account not found');
  }

  // Recalculate level if parent changed
  if (data.parent_account_id !== undefined) {
    if (data.parent_account_id === null) {
      data.level = 1;
    } else {
      const parent = await prisma.account.findFirst({
        where: { account_id: data.parent_account_id as string, company_id: companyId },
      });
      if (!parent) {
        throw new AppError(404, 'NOT_FOUND', 'Parent account not found');
      }
      data.level = parent.level + 1;
    }
  }

  return prisma.account.update({
    where: { account_id: accountId },
    data: data as any,
  });
}

// ── Import from Excel ──────────────────────────────────────────────────

export interface ImportPreviewRow {
  account_code: string;
  account_name: string;
  account_type: string;
  parent_code: string;
  description: string;
  parent_matched: boolean;
  exists: boolean;
}

export interface ImportPreviewResult {
  accounts: ImportPreviewRow[];
  total: number;
  new_count: number;
  update_count: number;
}

const VALID_ACCOUNT_TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];

export async function importPreview(buffer: Buffer, companyId: string): Promise<ImportPreviewResult> {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new AppError(400, 'INVALID_FILE', 'Excel file has no sheets');
  }

  const sheet = workbook.Sheets[sheetName];
  const jsonData: unknown[][] = XLSX.utils.sheet_to_json(sheet!, { header: 1, defval: '' });

  // Find header row
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(jsonData.length, 10); i++) {
    const row = jsonData[i];
    if (!row) continue;
    const rowStr = row.map((c) => String(c ?? '').trim()).join(',');
    if (rowStr.includes('科目代碼') && rowStr.includes('科目名稱')) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex < 0) {
    throw new AppError(400, 'INVALID_FORMAT', 'Cannot find header row with 科目代碼 and 科目名稱');
  }

  const headerRow = jsonData[headerRowIndex].map((c) => String(c ?? '').trim());
  const codeCol = headerRow.indexOf('科目代碼');
  const nameCol = headerRow.indexOf('科目名稱');
  const typeCol = headerRow.indexOf('科目類型');
  const parentCol = headerRow.indexOf('上層科目代碼');
  const descCol = headerRow.indexOf('說明');

  if (codeCol < 0 || nameCol < 0) {
    throw new AppError(400, 'INVALID_FORMAT', 'Missing required columns: 科目代碼, 科目名稱');
  }

  // Get existing accounts for this company
  const existingAccounts = await prisma.account.findMany({
    where: { company_id: companyId },
    select: { account_code: true },
  });
  const existingCodes = new Set(existingAccounts.map((a) => a.account_code));

  // Parse rows
  const parsedRows: ImportPreviewRow[] = [];
  const allCodes = new Set<string>();

  for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row) continue;

    const accountCode = String(row[codeCol] ?? '').trim();
    const accountName = String(row[nameCol] ?? '').trim();
    const accountType = typeCol >= 0 ? String(row[typeCol] ?? '').trim().toUpperCase() : '';
    const parentCode = parentCol >= 0 ? String(row[parentCol] ?? '').trim() : '';
    const description = descCol >= 0 ? String(row[descCol] ?? '').trim() : '';

    // Skip empty rows
    if (!accountCode && !accountName) continue;

    if (!accountCode) {
      throw new AppError(400, 'INVALID_DATA', `Row ${i + 1}: missing account code`);
    }
    if (!accountName) {
      throw new AppError(400, 'INVALID_DATA', `Row ${i + 1}: missing account name`);
    }
    if (accountType && !VALID_ACCOUNT_TYPES.includes(accountType)) {
      throw new AppError(400, 'INVALID_DATA', `Row ${i + 1}: invalid account type "${accountType}"`);
    }

    allCodes.add(accountCode);

    parsedRows.push({
      account_code: accountCode,
      account_name: accountName,
      account_type: accountType || 'ASSET',
      parent_code: parentCode,
      description,
      parent_matched: false,
      exists: existingCodes.has(accountCode),
    });
  }

  // Check parent matching
  for (const row of parsedRows) {
    if (!row.parent_code) {
      row.parent_matched = true; // No parent needed
    } else {
      // Parent exists in DB or in the import batch
      row.parent_matched = existingCodes.has(row.parent_code) || allCodes.has(row.parent_code);
    }
  }

  const newCount = parsedRows.filter((r) => !r.exists).length;
  const updateCount = parsedRows.filter((r) => r.exists).length;

  return {
    accounts: parsedRows,
    total: parsedRows.length,
    new_count: newCount,
    update_count: updateCount,
  };
}

export async function importConfirm(
  data: {
    accounts: Array<{
      account_code: string;
      account_name: string;
      account_type: string;
      parent_code?: string;
      description?: string;
    }>;
  },
  companyId: string
) {
  let created = 0;
  let updated = 0;

  // First pass: create/update accounts without parent relationships
  // so that parent references can be resolved in the second pass
  for (const row of data.accounts) {
    const existing = await prisma.account.findFirst({
      where: { company_id: companyId, account_code: row.account_code },
    });

    if (existing) {
      await prisma.account.update({
        where: { account_id: existing.account_id },
        data: {
          account_name: row.account_name,
          account_type: row.account_type as 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE',
          description: row.description || null,
        },
      });
      updated++;
    } else {
      await prisma.account.create({
        data: {
          account_code: row.account_code,
          account_name: row.account_name,
          account_type: row.account_type as 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE',
          description: row.description || null,
          level: 1,
          company_id: companyId,
        },
      });
      created++;
    }
  }

  // Second pass: update parent relationships and levels
  for (const row of data.accounts) {
    if (!row.parent_code) continue;

    const parent = await prisma.account.findFirst({
      where: { company_id: companyId, account_code: row.parent_code },
    });
    if (!parent) continue;

    const account = await prisma.account.findFirst({
      where: { company_id: companyId, account_code: row.account_code },
    });
    if (!account) continue;

    await prisma.account.update({
      where: { account_id: account.account_id },
      data: {
        parent_account_id: parent.account_id,
        level: parent.level + 1,
      },
    });
  }

  return { created, updated, total: created + updated };
}
