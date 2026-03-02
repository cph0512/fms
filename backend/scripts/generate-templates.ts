import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

const TEMPLATES_DIR = path.resolve(__dirname, '../../templates');

function generateDeliveryTripTemplate() {
  const wb = XLSX.utils.book_new();

  const data = [
    ['泰欣通運有限公司'],
    ['TO : [客戶名稱]'],
    ['日期區間：1月1日 ~ 1月31日'],
    ['日期', '請款內容', '內容', '趟次', '請款金額'],
    ['1月1日', '中原-明峰', '熟食', 1, 2400],
    ['1月5日', '平鎮-大溪', '冷凍', 2, 4800],
    ['1月10日', '中原-明峰', '熟食', 1, 2400],
    ['小計', '', '', '', 9600],
    ['營業稅 5%', '', '', '', 480],
    ['合計', '', '', '', 10080],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  ws['!cols'] = [
    { wch: 12 }, // 日期
    { wch: 18 }, // 請款內容
    { wch: 10 }, // 內容
    { wch: 8 },  // 趟次
    { wch: 12 }, // 請款金額
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

  const outputPath = path.join(TEMPLATES_DIR, 'delivery-trip-template.xlsx');
  XLSX.writeFile(wb, outputPath);
  console.log(`Created: ${outputPath}`);
}

function generateAccountsTemplate() {
  const wb = XLSX.utils.book_new();

  const data = [
    ['科目代碼', '科目名稱', '科目類型', '上層科目代碼', '說明'],
    ['1000', '資產', 'ASSET', '', '資產類科目'],
    ['1100', '流動資產', 'ASSET', '1000', ''],
    ['1101', '現金及約當現金', 'ASSET', '1100', ''],
    ['2000', '負債', 'LIABILITY', '', '負債類科目'],
    ['3000', '權益', 'EQUITY', '', ''],
    ['4000', '收入', 'REVENUE', '', ''],
    ['5000', '費用', 'EXPENSE', '', ''],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  ws['!cols'] = [
    { wch: 12 }, // 科目代碼
    { wch: 20 }, // 科目名稱
    { wch: 14 }, // 科目類型
    { wch: 14 }, // 上層科目代碼
    { wch: 20 }, // 說明
  ];

  XLSX.utils.book_append_sheet(wb, ws, '會計科目');

  const outputPath = path.join(TEMPLATES_DIR, 'accounts-template.xlsx');
  XLSX.writeFile(wb, outputPath);
  console.log(`Created: ${outputPath}`);
}

// Ensure output directory exists
if (!fs.existsSync(TEMPLATES_DIR)) {
  fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
}

generateDeliveryTripTemplate();
generateAccountsTemplate();
console.log('All templates generated successfully!');
