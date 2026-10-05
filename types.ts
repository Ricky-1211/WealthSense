
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  subcategory?: string;
  type: TransactionType;
  date: string;
  description: string;
}

export interface Budget {
  category: string;
  limit: number;
  period?: 'monthly' | 'weekly';
  rollover?: boolean;
  alertThreshold?: number; // Percentage (e.g., 80 for 80%)
  type?: 'need' | 'want' | 'neutral'; // For needs vs wants analysis
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
  goalId?: string; // Link to a specific goal
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: 'emergency' | 'vacation' | 'home' | 'car' | 'education' | 'retirement' | 'other';
  autoContribution?: number; // Monthly auto-contribution amount
  createdAt: string;
}

export interface SavingsData {
  monthlySalary: number;
  entries: SavingsEntry[];
  goals?: SavingsGoal[];
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

export type InvestmentType = 'stock' | 'mutual_fund' | 'etf' | 'sip' | 'gold' | 'crypto';

export interface Investment {
  id: string;
  type: InvestmentType;
  name: string;
  symbol?: string;
  units: number;
  investedAmount: number;
  currentValue: number;
  purchaseDate: string;
  dividends?: number;
  xirr?: number; // Extended Internal Rate of Return
}

export interface InvestmentData {
  investments: Investment[];
  portfolioAllocation: Record<InvestmentType, number>;
  totalInvested: number;
  totalCurrentValue: number;
  totalProfitLoss: number;
  totalReturns: number;
}

export interface AppState {
  transactions: Transaction[];
  budgets: Budget[];
  user: User | null;
  preferences?: Record<string, boolean>;
  savings?: SavingsData;
  tracking?: TrackingData;
  investments?: InvestmentData;
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

export const SUBCATEGORIES: Record<string, string[]> = {
  'Food': ['Groceries', 'Dining Out', 'Snacks', 'Beverages'],
  'Transport': ['Fuel', 'Public Transit', 'Ride Share', 'Parking', 'Maintenance'],
  'Entertainment': ['Movies', 'Games', 'Streaming', 'Events', 'Hobbies'],
  'Shopping': ['Clothing', 'Electronics', 'Home', 'Gifts'],
  'Health': ['Medical', 'Pharmacy', 'Insurance', 'Fitness'],
  'Investment': ['Stocks', 'Mutual Funds', 'ETFs', 'SIP', 'Gold', 'Crypto'],
  'Other': ['Miscellaneous']
};

export const INCOME_CATEGORIES = ['Salary', 'Investment', 'Other'];
export const EXPENSE_CATEGORIES = CATEGORIES.filter(c => !INCOME_CATEGORIES.includes(c));
