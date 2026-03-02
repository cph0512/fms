import * as XLSX from 'xlsx';

export interface BillingDetailRow {
  tripDate: Date;       // actual Date for Excel serial number
  routeName: string;    // e.g. "中原-明峰"
  contentType: string;  // e.g. "熟食"
  tripsCount: number;
  amount: number;
}

export interface BillingDetailData {
  companyName: string;     // "泰欣通運有限公司"
  companyAddress: string;  // "桃園市桃園區新埔六街95號16樓"
  companyPhone: string;    // "Tel：02-77565318#8866"
  customerName: string;    // "家福股份有限公司-中原頂好"
  dateRangeLabel: string;  // "1/1-1/31"
  yearMonthLabel: string;  // "115年1月份報價帳單"
  effectiveDate: string;   // "115/1"
  rows: BillingDetailRow[];
  subtotal: number;
  taxRate: number;         // e.g. 5 (percent)
  taxAmount: number;
  total: number;
}

/**
 * Build a billing detail Excel file matching the format of 115年家樂福.xlsx
 * Returns an xlsx Buffer ready to be sent as a response.
 */
export function buildBillingDetailExcel(data: BillingDetailData): Buffer {
  const wb = XLSX.utils.book_new();

  // Build array-of-arrays for the sheet (7 columns: A-G)
  const sheetData: unknown[][] = [];

  // Row 0: Company name (merged A:G)
  sheetData.push([data.companyName, '', '', '', '', '', '']);
  // Row 1: Company address (merged A:G)
  sheetData.push([data.companyAddress, '', '', '', '', '', '']);
  // Row 2: Year-month billing title (merged A:G)
  sheetData.push([data.yearMonthLabel, '', '', '', '', '', '']);
  // Row 3: TO : customer name
  sheetData.push(['', `TO :${data.customerName}`, '', '', '', '', '']);
  // Row 4: Billing date range + phone
  sheetData.push(['', `請款日期：${data.dateRangeLabel}`, '', '', '', data.companyPhone, '']);
  // Row 5: Headers
  sheetData.push(['', '日期', '請款內容', '內容', '趟次', '請款金額', '備註']);

  // Data rows (Row 6+)
  for (const row of data.rows) {
    // Convert JS Date to Excel serial number
    const excelDate = dateToExcelSerial(row.tripDate);
    sheetData.push(['', excelDate, row.routeName, row.contentType, row.tripsCount, row.amount, '']);
  }

  // Footer rows
  const footerStart = sheetData.length;
  sheetData.push(['', '', '小計:', '', '', data.subtotal, '']);
  sheetData.push(['', '', `營業稅:`, '', '', data.taxAmount, '']);
  sheetData.push(['', '', '合計:', '', '', data.total, '']);
  sheetData.push(['', '', '', '', '', '', `生效日：${data.effectiveDate}`]);

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Merge cells for rows 0-2 (company info)
  ws['!merges'] = [
    { s: { c: 0, r: 0 }, e: { c: 6, r: 0 } }, // Row 0: A1:G1
    { s: { c: 0, r: 1 }, e: { c: 6, r: 1 } }, // Row 1: A2:G2
    { s: { c: 0, r: 2 }, e: { c: 6, r: 2 } }, // Row 2: A3:G3
  ];

  // Set column widths
  ws['!cols'] = [
    { wch: 3 },  // A: spacer
    { wch: 10 }, // B: date
    { wch: 30 }, // C: route name (請款內容)
    { wch: 8 },  // D: content type (內容)
    { wch: 6 },  // E: trips count (趟次)
    { wch: 12 }, // F: amount (請款金額)
    { wch: 14 }, // G: notes (備註)
  ];

  // Apply date format to date cells (column B, rows 6 to footerStart-1)
  for (let r = 6; r < footerStart; r++) {
    const cellRef = XLSX.utils.encode_cell({ c: 1, r });
    const cell = ws[cellRef];
    if (cell && typeof cell.v === 'number') {
      cell.t = 'n';
      cell.z = 'm/d'; // date format like "1/5"
    }
  }

  // Apply number format to amount cells (column F)
  for (let r = 6; r < sheetData.length; r++) {
    const cellRef = XLSX.utils.encode_cell({ c: 5, r });
    const cell = ws[cellRef];
    if (cell && typeof cell.v === 'number') {
      cell.t = 'n';
      cell.z = '#,##0'; // number with comma separator
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

/**
 * Convert a JavaScript Date to Excel serial number.
 * Excel dates are days since 1899-12-30 (with the Lotus 1-2-3 bug where 1900 is treated as leap year).
 */
function dateToExcelSerial(date: Date): number {
  // Excel epoch is 1899-12-30 (serial 0)
  // The "Lotus bug" means we add 1 for dates after Feb 28, 1900
  const epoch = new Date(Date.UTC(1899, 11, 30)); // Dec 30, 1899
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const diff = utcDate.getTime() - epoch.getTime();
  const days = Math.round(diff / (24 * 60 * 60 * 1000));
  // Add 1 for the Lotus 1-2-3 leap year bug (dates after Feb 28, 1900)
  return days > 59 ? days + 1 : days;
}
