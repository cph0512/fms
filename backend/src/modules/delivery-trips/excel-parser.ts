import * as XLSX from 'xlsx';

export interface ParsedRow {
  date: string;
  routeName: string;
  contentType: string;
  tripsCount: number;
  amount: number;
}

export interface ParsedSheet {
  sheetName: string;
  customerName: string;
  dateRange: string;
  rows: ParsedRow[];
}

// Skip rows that are summary/total lines
const SKIP_KEYWORDS = ['小計', '營業稅', '合計', '生效日'];

/**
 * Parse a date string in formats like "1月1日", "12月31日", etc.
 * Returns MM-DD string, or null if it cannot be parsed.
 */
function parseDateCell(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  const str = String(value).trim();
  if (!str) return null;

  // Handle "X月Y日" format
  const match = str.match(/(\d{1,2})月(\d{1,2})日/);
  if (match) {
    const month = match[1].padStart(2, '0');
    const day = match[2].padStart(2, '0');
    return `${month}-${day}`;
  }

  // Handle date objects from xlsx (serial numbers)
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      const month = String(date.m).padStart(2, '0');
      const day = String(date.d).padStart(2, '0');
      return `${month}-${day}`;
    }
  }

  return null;
}

export function parseDeliveryExcel(buffer: Buffer): ParsedSheet[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const result: ParsedSheet[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const jsonData: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

    let customerName = '';
    let dateRange = '';
    let headerRowIndex = -1;

    // Find customer name from "TO :" row
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row) continue;

      for (let j = 0; j < row.length; j++) {
        const cell = String(row[j] ?? '').trim();
        if (cell.startsWith('TO :') || cell.startsWith('TO:') || cell.startsWith('TO ：')) {
          customerName = cell.replace(/^TO\s*[:：]\s*/, '').trim();
          break;
        }
      }
      if (customerName) break;
    }

    // Find header row with expected columns
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row) continue;

      const rowStr = row.map((c) => String(c ?? '').trim()).join(',');
      if (rowStr.includes('日期') && rowStr.includes('趟次') && rowStr.includes('請款金額')) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex < 0) continue;

    // Determine column indices from header
    const headerRow = jsonData[headerRowIndex].map((c) => String(c ?? '').trim());
    const dateCol = headerRow.indexOf('日期');
    const routeCol = headerRow.indexOf('請款內容');
    const contentCol = headerRow.indexOf('內容');
    const tripsCol = headerRow.indexOf('趟次');
    const amountCol = headerRow.indexOf('請款金額');

    if (dateCol < 0 || tripsCol < 0 || amountCol < 0) continue;

    const rows: ParsedRow[] = [];

    for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row) continue;

      // Check if this is a summary row to skip
      const rowText = row.map((c) => String(c ?? '')).join('');
      if (SKIP_KEYWORDS.some((kw) => rowText.includes(kw))) continue;

      // Skip completely empty rows
      const hasData = row.some((c) => c !== null && c !== undefined && String(c).trim() !== '');
      if (!hasData) continue;

      const dateStr = parseDateCell(row[dateCol]);
      const routeName = routeCol >= 0 ? String(row[routeCol] ?? '').trim() : '';
      const contentType = contentCol >= 0 ? String(row[contentCol] ?? '').trim() : '';
      const tripsCount = Number(row[tripsCol]) || 0;
      const amount = Number(row[amountCol]) || 0;

      // Skip rows without essential data
      if (tripsCount <= 0 && amount <= 0) continue;

      rows.push({
        date: dateStr || '',
        routeName,
        contentType,
        tripsCount: tripsCount || 1,
        amount,
      });
    }

    if (rows.length > 0) {
      // Determine date range from parsed rows
      const dates = rows.map((r) => r.date).filter(Boolean);
      if (dates.length > 0) {
        dateRange = `${dates[0]} ~ ${dates[dates.length - 1]}`;
      }

      result.push({
        sheetName,
        customerName,
        dateRange,
        rows,
      });
    }
  }

  return result;
}
