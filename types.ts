
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  type: TransactionType;
  date: string;
  description: string;
}

export interface Budget {
  category: string;
  limit: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  password?: string; // Only for simulated backend storage
}

export interface SavingsEntry {
  id: string;
  date: string;
  amount: number;
  description?: string;
}

export interface SavingsData {
  monthlySalary: number;
  entries: SavingsEntry[];
  createdAt?: string;
  updatedAt?: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  accountType: 'savings' | 'current' | 'salary';
  balance?: number;
  createdAt: string;
}

export interface Document {
  id: string;
  type: 'aadhaar' | 'pan' | 'upi';
  number: string;
  name?: string;
  upiId?: string;
  createdAt: string;
}

export interface Receipt {
  id: string;
  transactionId?: string;
  imageUrl: string;
  ocrText?: string;
  amount?: number;
  merchant?: string;
  date?: string;
  createdAt: string;
}

export interface PaymentMethod {
  id: string;
  type: 'cash' | 'card' | 'upi' | 'bank_transfer';
  name: string;
  last4Digits?: string;
  bankName?: string;
  createdAt: string;
}

export interface LockSettings {
  enabled: boolean;
  pinHash?: string;
  createdAt?: string;
  lastUnlock?: string;
}

export interface TrackingData {
  bankAccounts: BankAccount[];
  documents: Document[];
  receipts: Receipt[];
  paymentMethods: PaymentMethod[];
  lockSettings: LockSettings;
}

export interface AppState {
  transactions: Transaction[];
  budgets: Budget[];
  user: User | null;
  preferences?: Record<string, boolean>;
  savings?: SavingsData;
  tracking?: TrackingData;
}

export const CATEGORIES = [
  'Food',
  'Rent',
  'Transport',
  'Entertainment',
  'Shopping',
  'Health',
  'Salary',
  'Investment',
  'Other'
];

export const INCOME_CATEGORIES = ['Salary', 'Investment', 'Other'];
export const EXPENSE_CATEGORIES = CATEGORIES.filter(c => !INCOME_CATEGORIES.includes(c));
