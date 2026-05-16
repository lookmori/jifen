import * as XLSX from 'xlsx';

export function parseExcelFile(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: string[] = [];
        const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { header: 1 });
        for (const row of json) {
          if (Array.isArray(row)) {
            const name = String(row[0] || '').trim();
            if (name) rows.push(name);
          }
        }
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsBinaryString(file);
  });
}
