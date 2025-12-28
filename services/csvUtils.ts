/**
 * CSV/Excel Import and Export Utilities
 */

import { Transaction } from '../types';

export interface CSVTransaction {
  date: string;
  description: string;
  amount: string;
  type: string;
  category: string;
}

// Export transactions to CSV
export const exportToCSV = (transactions: Transaction[]): string => {
  const headers = ['Date', 'Description', 'Amount', 'Type', 'Category'];
  const rows = transactions.map(t => [
    t.date,
    t.description,
    t.amount.toString(),
    t.type,
    t.category
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
};

// Download CSV file
export const downloadCSV = (transactions: Transaction[], filename: string = 'transactions.csv') => {
  const csv = exportToCSV(transactions);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Parse CSV file
export const parseCSV = (csvText: string): CSVTransaction[] => {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const transactions: CSVTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    if (values.length !== headers.length) continue;

    const transaction: any = {};
    headers.forEach((header, index) => {
      transaction[header.toLowerCase()] = values[index];
    });

    transactions.push(transaction as CSVTransaction);
  }

  return transactions;
};

// Convert CSV transactions to app transactions
export const convertCSVToTransactions = (csvTransactions: CSVTransaction[]): Omit<Transaction, 'id'>[] => {
  return csvTransactions.map(t => ({
    date: t.date || new Date().toISOString().split('T')[0],
    description: t.description || '',
    amount: parseFloat(t.amount) || 0,
    type: (t.type?.toLowerCase() === 'income' ? 'income' : 'expense') as 'income' | 'expense',
    category: t.category || 'Other'
  }));
};

// Read file as text
export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

