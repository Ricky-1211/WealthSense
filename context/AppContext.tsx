
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Transaction, Budget, User, AppState, SavingsData, SavingsEntry, TrackingData, BankAccount, Document, Receipt, PaymentMethod } from '../types';
import { api } from '../services/api';
import { auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface AppContextType extends AppState {
  isLoading: boolean;
  isSyncing: boolean;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
  addTransaction: (t: Omit<Transaction, 'id'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateBudget: (budget: Budget) => Promise<void>;
  updateUser: (name?: string, avatar?: string) => Promise<void>;
  updateUserPreferences: (preferences: Record<string, boolean>) => Promise<void>;
  updateSavingsData: (savings: SavingsData) => Promise<void>;
  addSavingsEntry: (entry: Omit<SavingsEntry, 'id'>) => Promise<void>;
  deleteSavingsEntry: (entryId: string) => Promise<void>;
  updateTrackingData: (tracking: TrackingData) => Promise<void>;
  addBankAccount: (account: Omit<BankAccount, 'id' | 'createdAt'>) => Promise<void>;
  deleteBankAccount: (accountId: string) => Promise<void>;
  addDocument: (doc: Omit<Document, 'id' | 'createdAt'>) => Promise<void>;
  deleteDocument: (docId: string) => Promise<void>;
  addPaymentMethod: (method: Omit<PaymentMethod, 'id' | 'createdAt'>) => Promise<void>;
  deletePaymentMethod: (methodId: string) => Promise<void>;
  addReceipt: (receipt: Omit<Receipt, 'id' | 'createdAt'>) => Promise<void>;
  deleteReceipt: (receiptId: string) => Promise<void>;
  setupLock: (pin: string) => Promise<void>;
  verifyLockPin: (pin: string) => Promise<boolean>;
  updateLockSettings: (enabled: boolean, pin?: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    transactions: [],
    budgets: [],
    user: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchInitialData = useCallback(async () => {
    try {
      console.log('🔄 Fetching initial app data...');
      setIsLoading(true);
      const data = await api.getAppState();
      setState(data);
      console.log('✅ App data loaded successfully');
      console.log('User:', data.user);
      console.log('Transactions:', data.transactions.length);
      console.log('Budgets:', data.budgets.length);
    } catch (error: any) {
      console.error('❌ Failed to fetch user data:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      
      // If it's a permissions error, show helpful message
      if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
        console.error('⚠️ PERMISSION DENIED - Check Firestore security rules!');
        alert('Permission denied. Please check Firestore security rules in Firebase Console.');
      }
      
      // Set empty state on error to prevent app from being stuck
      // But keep user if authenticated
      const currentUser = auth.currentUser;
      if (currentUser) {
        setState({ 
          transactions: [], 
          budgets: [], 
          user: {
            id: currentUser.uid,
            name: currentUser.displayName || "User",
            email: currentUser.email || "",
            avatar: currentUser.photoURL || ""
          }
        });
      } else {
        setState({ transactions: [], budgets: [], user: null });
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen for Firebase Auth State Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        fetchInitialData();
      } else {
        setIsAuthenticated(false);
        setIsLoading(false);
        setState({ transactions: [], budgets: [], user: null });
      }
    });

    return () => unsubscribe();
  }, [fetchInitialData]);

  const login = async (email: string, pass: string) => {
    setIsSyncing(true);
    try {
      await api.login(email, pass);
      // Wait a bit for auth state to update, then refresh data
      setTimeout(() => {
        fetchInitialData();
      }, 500);
    } catch (error) {
      console.error('❌ Login failed in context:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const register = async (name: string, email: string, pass: string) => {
    setIsSyncing(true);
    try {
      await api.register(name, email, pass);
      // Wait a bit for auth state to update, then refresh data
      setTimeout(() => {
        fetchInitialData();
      }, 500);
    } catch (error) {
      console.error('❌ Registration failed in context:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const logout = async () => {
    await api.logout();
  };

  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
    setIsSyncing(true);
    try {
      const newT = await api.createTransaction(t);
      setState(prev => ({ ...prev, transactions: [newT, ...prev.transactions] }));
      console.log('✅ Transaction added to state');
    } catch (error: any) {
      console.error('❌ Failed to add transaction:', error);
      // Re-throw so UI can handle it
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteTransaction = async (id: string) => {
    setIsSyncing(true);
    try {
      await api.deleteTransaction(id);
      setState(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }));
    } finally {
      setIsSyncing(false);
    }
  };

  const updateBudget = async (budget: Budget) => {
    setIsSyncing(true);
    try {
      await api.updateBudget(budget);
      setState(prev => {
        const existing = prev.budgets.findIndex(b => b.category === budget.category);
        let newBudgets = [...prev.budgets];
        if (existing >= 0) newBudgets[existing] = budget;
        else newBudgets.push(budget);
        return { ...prev, budgets: newBudgets };
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const updateUser = async (name?: string, avatar?: string) => {
    setIsSyncing(true);
    try {
      const updatedUser = await api.updateUser(name, avatar);
      setState(prev => ({ ...prev, user: updatedUser }));
    } finally {
      setIsSyncing(false);
    }
  };

  const updateUserPreferences = async (preferences: Record<string, boolean>) => {
    setIsSyncing(true);
    try {
      await api.updateUserPreferences(preferences);
      setState(prev => ({ ...prev, preferences }));
    } finally {
      setIsSyncing(false);
    }
  };

  const updateSavingsData = async (savings: SavingsData) => {
    setIsSyncing(true);
    try {
      await api.updateSavingsData(savings);
      setState(prev => ({ ...prev, savings }));
    } finally {
      setIsSyncing(false);
    }
  };

  const addSavingsEntry = async (entry: Omit<SavingsEntry, 'id'>) => {
    setIsSyncing(true);
    try {
      const newEntry = await api.addSavingsEntry(entry);
      const currentSavings = state.savings || { monthlySalary: 0, entries: [] };
      const updatedSavings: SavingsData = {
        ...currentSavings,
        entries: [newEntry, ...currentSavings.entries]
      };
      setState(prev => ({ ...prev, savings: updatedSavings }));
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteSavingsEntry = async (entryId: string) => {
    setIsSyncing(true);
    try {
      await api.deleteSavingsEntry(entryId);
      const currentSavings = state.savings;
      if (currentSavings) {
        const updatedSavings: SavingsData = {
          ...currentSavings,
          entries: currentSavings.entries.filter(e => e.id !== entryId)
        };
        setState(prev => ({ ...prev, savings: updatedSavings }));
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const updateTrackingData = async (tracking: TrackingData) => {
    setIsSyncing(true);
    try {
      await api.updateTrackingData(tracking);
      setState(prev => ({ ...prev, tracking }));
    } finally {
      setIsSyncing(false);
    }
  };

  const addBankAccount = async (account: Omit<BankAccount, 'id' | 'createdAt'>) => {
    setIsSyncing(true);
    try {
      const newAccount = await api.addBankAccount(account);
      const currentTracking = state.tracking || {
        bankAccounts: [],
        documents: [],
        receipts: [],
        paymentMethods: [],
        lockSettings: { enabled: false }
      };
      const updatedTracking: TrackingData = {
        ...currentTracking,
        bankAccounts: [...currentTracking.bankAccounts, newAccount]
      };
      setState(prev => ({ ...prev, tracking: updatedTracking }));
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteBankAccount = async (accountId: string) => {
    setIsSyncing(true);
    try {
      await api.deleteBankAccount(accountId);
      const currentTracking = state.tracking;
      if (currentTracking) {
        const updatedTracking: TrackingData = {
          ...currentTracking,
          bankAccounts: currentTracking.bankAccounts.filter(a => a.id !== accountId)
        };
        setState(prev => ({ ...prev, tracking: updatedTracking }));
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const addDocument = async (doc: Omit<Document, 'id' | 'createdAt'>) => {
    setIsSyncing(true);
    try {
      const newDoc = await api.addDocument(doc);
      const currentTracking = state.tracking || {
        bankAccounts: [],
        documents: [],
        receipts: [],
        paymentMethods: [],
        lockSettings: { enabled: false }
      };
      const updatedTracking: TrackingData = {
        ...currentTracking,
        documents: [...currentTracking.documents, newDoc]
      };
      setState(prev => ({ ...prev, tracking: updatedTracking }));
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteDocument = async (docId: string) => {
    setIsSyncing(true);
    try {
      await api.deleteDocument(docId);
      const currentTracking = state.tracking;
      if (currentTracking) {
        const updatedTracking: TrackingData = {
          ...currentTracking,
          documents: currentTracking.documents.filter(d => d.id !== docId)
        };
        setState(prev => ({ ...prev, tracking: updatedTracking }));
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const addPaymentMethod = async (method: Omit<PaymentMethod, 'id' | 'createdAt'>) => {
    setIsSyncing(true);
    try {
      const newMethod = await api.addPaymentMethod(method);
      const currentTracking = state.tracking || {
        bankAccounts: [],
        documents: [],
        receipts: [],
        paymentMethods: [],
        lockSettings: { enabled: false }
      };
      const updatedTracking: TrackingData = {
        ...currentTracking,
        paymentMethods: [...currentTracking.paymentMethods, newMethod]
      };
      setState(prev => ({ ...prev, tracking: updatedTracking }));
    } finally {
      setIsSyncing(false);
    }
  };

  const deletePaymentMethod = async (methodId: string) => {
    setIsSyncing(true);
    try {
      await api.deletePaymentMethod(methodId);
      const currentTracking = state.tracking;
      if (currentTracking) {
        const updatedTracking: TrackingData = {
          ...currentTracking,
          paymentMethods: currentTracking.paymentMethods.filter(m => m.id !== methodId)
        };
        setState(prev => ({ ...prev, tracking: updatedTracking }));
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const addReceipt = async (receipt: Omit<Receipt, 'id' | 'createdAt'>) => {
    setIsSyncing(true);
    try {
      const newReceipt = await api.addReceipt(receipt);
      const currentTracking = state.tracking || {
        bankAccounts: [],
        documents: [],
        receipts: [],
        paymentMethods: [],
        lockSettings: { enabled: false }
      };
      const updatedTracking: TrackingData = {
        ...currentTracking,
        receipts: [...currentTracking.receipts, newReceipt]
      };
      setState(prev => ({ ...prev, tracking: updatedTracking }));
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteReceipt = async (receiptId: string) => {
    setIsSyncing(true);
    try {
      await api.deleteReceipt(receiptId);
      const currentTracking = state.tracking;
      if (currentTracking) {
        const updatedTracking: TrackingData = {
          ...currentTracking,
          receipts: currentTracking.receipts.filter(r => r.id !== receiptId)
        };
        setState(prev => ({ ...prev, tracking: updatedTracking }));
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const setupLock = async (pin: string) => {
    setIsSyncing(true);
    try {
      await api.setupLock(pin);
      const currentTracking = state.tracking || {
        bankAccounts: [],
        documents: [],
        receipts: [],
        paymentMethods: [],
        lockSettings: { enabled: false }
      };
      const updatedTracking: TrackingData = {
        ...currentTracking,
        lockSettings: {
          enabled: true,
          pinHash: '***',
          createdAt: new Date().toISOString()
        }
      };
      setState(prev => ({ ...prev, tracking: updatedTracking }));
    } finally {
      setIsSyncing(false);
    }
  };

  const verifyLockPin = async (pin: string): Promise<boolean> => {
    return await api.verifyLockPin(pin);
  };

  const updateLockSettings = async (enabled: boolean, pin?: string) => {
    setIsSyncing(true);
    try {
      await api.updateLockSettings(enabled, pin);
      const currentTracking = state.tracking || {
        bankAccounts: [],
        documents: [],
        receipts: [],
        paymentMethods: [],
        lockSettings: { enabled: false }
      };
      const updatedTracking: TrackingData = {
        ...currentTracking,
        lockSettings: {
          ...currentTracking.lockSettings,
          enabled
        }
      };
      setState(prev => ({ ...prev, tracking: updatedTracking }));
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <AppContext.Provider 
      value={{ 
        ...state, 
        isLoading, 
        isSyncing, 
        isAuthenticated,
        login,
        register,
        logout,
        addTransaction, 
        deleteTransaction, 
        updateBudget,
        updateUser,
        updateUserPreferences,
        updateSavingsData,
        addSavingsEntry,
        deleteSavingsEntry,
        updateTrackingData,
        addBankAccount,
        deleteBankAccount,
        addDocument,
        deleteDocument,
        addPaymentMethod,
        deletePaymentMethod,
        addReceipt,
        deleteReceipt,
        setupLock,
        verifyLockPin,
        updateLockSettings,
        refresh: fetchInitialData 
      }}
    >
      {isLoading ? (
        <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold animate-pulse text-xs tracking-widest uppercase">Initializing Cloud</p>
          </div>
        </div>
      ) : children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
