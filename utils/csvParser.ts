import { Transaction } from '../types';

// Simple CSV Parser helper
// In a real production app, we might use PapaParse, but here we implement a lightweight version
// to handle basic CSV structures without extra dependencies if possible, 
// but sticking to standard split logic for simplicity in this demo.

export const parseCSV = (content: string, source: 'BANK' | 'BOOK'): Transaction[] => {
  const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  // Basic heuristic to find columns
  const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('วันที่'));
  const descIdx = headers.findIndex(h => h.includes('desc') || h.includes('detail') || h.includes('รายการ'));
  const amountIdx = headers.findIndex(h => h.includes('amount') || h.includes('ยอด') || h.includes('จำนวน'));
  
  if (dateIdx === -1 || amountIdx === -1) {
    throw new Error(`ไม่สามารถระบุคอลัมน์ Date หรือ Amount ในไฟล์ ${source} ได้`);
  }

  const transactions: Transaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    // Handle CSV quoting basics
    const row = parseCSVLine(lines[i]);
    
    if (row.length < headers.length) continue;

    const rawDate = row[dateIdx];
    const rawAmount = row[amountIdx];
    const description = descIdx !== -1 ? row[descIdx] : 'No Description';

    // Normalize Data
    const amount = parseFloat(rawAmount.replace(/,/g, ''));
    
    if (!isNaN(amount)) {
      transactions.push({
        id: `${source}-${i}-${Math.random().toString(36).substr(2, 9)}`,
        date: formatDate(rawDate),
        description: description.replace(/"/g, ''),
        amount: amount,
        source: source,
        originalRow: row
      });
    }
  }

  return transactions;
};

// Handle basic quoted CSV fields
const parseCSVLine = (text: string): string[] => {
  const result: string[] = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      inQuote = !inQuote;
    } else if (char === ',' && !inQuote) {
      result.push(cur);
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur);
  return result;
};

const formatDate = (dateStr: string): string => {
  // Attempt to parse various date formats
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return dateStr; // Fallback
};
