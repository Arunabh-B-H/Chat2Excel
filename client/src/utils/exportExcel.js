import * as XLSX from 'xlsx';

/**
 * Format raw object keys into readable headers
 */
function formatHeader(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const EXCLUDED_KEYS = new Set(['_id', 'id', '__v', 'userId', 'rawInputSnippet']);

/**
 * Universal dynamic Excel (.xlsx) exporter
 * Formats columns, auto-sizes column widths based on contents.
 */
export const exportToExcel = (records, fileName = 'Data_Entry_Export.xlsx') => {
  if (!records || !Array.isArray(records) || records.length === 0) {
    return;
  }

  // Collect all unique keys
  const allKeys = [];
  records.forEach((record) => {
    if (record && typeof record === 'object') {
      Object.keys(record).forEach((k) => {
        if (!EXCLUDED_KEYS.has(k) && !allKeys.includes(k)) {
          allKeys.push(k);
        }
      });
    }
  });

  if (allKeys.length === 0) return;

  // Generate standardized rows
  const rows = records.map((record, index) => {
    const row = { '#': index + 1 };
    allKeys.forEach((key) => {
      const header = formatHeader(key);
      const val = record[key];
      row[header] = val !== undefined && val !== null ? val : '—';
    });
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Dynamic auto-fit column widths based on cell text length
  const colWidths = [{ wch: 6 }]; // First column '#'
  allKeys.forEach((key) => {
    const header = formatHeader(key);
    let maxLen = header.length;
    records.forEach((r) => {
      const valStr = r[key] !== undefined && r[key] !== null ? String(r[key]) : '';
      if (valStr.length > maxLen) {
        maxLen = valStr.length;
      }
    });
    colWidths.push({ wch: Math.min(Math.max(maxLen + 3, 12), 50) });
  });

  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Extracted Records');
  XLSX.writeFile(workbook, fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`);
};

/**
 * Append newly extracted records on top of any uploaded existing spreadsheet workbook (.xlsx)
 * Enables users to upload their master spreadsheet and merge new daily batches without overwriting columns.
 */
export const appendToExistingWorkbook = async (
  existingFileBlob,
  newRecords,
  outputFileName = 'Merged_Master_Workbook.xlsx'
) => {
  if (!existingFileBlob) {
    throw new Error('Please select an existing Excel workbook (.xlsx)');
  }
  if (!newRecords || newRecords.length === 0) {
    throw new Error('No new records to append');
  }

  const data = await existingFileBlob.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0] || 'Sheet1';
  const existingSheet = workbook.Sheets[firstSheetName];

  const existingData = XLSX.utils.sheet_to_json(existingSheet);

  // Format new records to match headers
  const sanitizedNewRecords = newRecords.map((r, i) => {
    const clean = {};
    Object.keys(r).forEach((k) => {
      if (!EXCLUDED_KEYS.has(k)) {
        clean[formatHeader(k)] = r[k];
      }
    });
    if (!clean['#']) {
      clean['#'] = existingData.length + i + 1;
    }
    return clean;
  });

  const combinedData = [...existingData, ...sanitizedNewRecords];
  const updatedSheet = XLSX.utils.json_to_sheet(combinedData);

  // Auto-fit widths for combined data
  if (combinedData.length > 0) {
    const colWidths = Object.keys(combinedData[0]).map((key) => {
      const maxLen = Math.max(
        key.length,
        ...combinedData.slice(0, 50).map((r) => (r[key] ? String(r[key]).length : 0))
      );
      return { wch: Math.min(Math.max(maxLen + 3, 12), 50) };
    });
    updatedSheet['!cols'] = colWidths;
  }

  workbook.Sheets[firstSheetName] = updatedSheet;
  XLSX.writeFile(workbook, outputFileName.endsWith('.xlsx') ? outputFileName : `${outputFileName}.xlsx`);
};

/**
 * Universal dynamic CSV (.csv) exporter
 */
export const exportToCSV = (records, fileName = 'Data_Entry_Export.csv') => {
  if (!records || !Array.isArray(records) || records.length === 0) {
    throw new Error('No record data available to export');
  }

  const allKeys = [];
  records.forEach((record) => {
    if (record && typeof record === 'object') {
      Object.keys(record).forEach((k) => {
        if (!EXCLUDED_KEYS.has(k) && !allKeys.includes(k)) {
          allKeys.push(k);
        }
      });
    }
  });

  const rows = records.map((record, index) => {
    const row = { '#': index + 1 };
    allKeys.forEach((key) => {
      const header = formatHeader(key);
      const val = record[key];
      row[header] = val !== undefined && val !== null ? String(val) : '';
    });
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);

  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', fileName.endsWith('.csv') ? fileName : `${fileName}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
