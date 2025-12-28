
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile 
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy,
  updateDoc,
  Timestamp
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { Transaction, Budget, User, AppState, SavingsData, SavingsEntry, TrackingData, BankAccount, Document, Receipt, PaymentMethod, LockSettings } from "../types";
import { initializeUserDocument } from "./firebaseInit";
import { hashPIN, verifyPIN, getEncryptionKey, encrypt, decrypt } from "./encryption";

class WealthSenseAPI {
  // --- AUTHENTICATION ---
  async login(email: string, password: string): Promise<User> {
    try {
      console.log('🔐 Logging in user:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Ensure user document and collections are initialized
      await initializeUserDocument(firebaseUser.uid);
      console.log('✅ Login successful');
      
      return {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || "User",
        email: firebaseUser.email || email,
        avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
      };
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  }

  async register(name: string, email: string, password: string): Promise<User> {
    try {
      console.log('📝 Registering new user:', email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`;
      await updateProfile(firebaseUser, { displayName: name, photoURL: avatar });
      
      // Reload user to get updated profile
      await firebaseUser.reload();

      // Initialize user document with default collections structure
      await initializeUserDocument(firebaseUser.uid);
      console.log('✅ Registration successful');

      return {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || name,
        email: firebaseUser.email || email,
        avatar: firebaseUser.photoURL || avatar
      };
    } catch (error) {
      console.error('❌ Registration error:', error);
      throw error;
    }
  }

  async logout() {
    await signOut(auth);
  }

  // --- DATA ---
  async getAppState(): Promise<AppState> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error('Unauthorized');

    try {
      console.log('📥 Fetching app state for user:', firebaseUser.uid);

      // Reload user to ensure we have latest profile data
      await firebaseUser.reload();

      // Ensure user document is initialized (handles new users and migrations)
      await initializeUserDocument(firebaseUser.uid);

      // Fetch User Settings
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        console.warn('⚠️ User document does not exist, initializing...');
        await initializeUserDocument(firebaseUser.uid);
      }
      
      const budgets: Budget[] = userDoc.data()?.budgets || [];
      const preferences: Record<string, boolean> = userDoc.data()?.preferences || {};
      console.log('✅ Loaded budgets:', budgets.length);
      console.log('✅ Loaded preferences:', preferences);

      // Fetch Transactions
      const txCollectionRef = collection(db, "users", firebaseUser.uid, "transactions");
      
      let transactions: Transaction[] = [];
      try {
        // Try to query with orderBy - requires index if date is Timestamp
        const q = query(txCollectionRef, orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Convert Firestore Timestamp to ISO string if needed
          let dateStr = data.date;
          if (data.date && data.date.toDate) {
            dateStr = data.date.toDate().toISOString().split('T')[0];
          } else if (data.date instanceof Timestamp) {
            dateStr = data.date.toDate().toISOString().split('T')[0];
          }
          
          transactions.push({ 
            id: doc.id, 
            ...data,
            date: dateStr
          } as Transaction);
        });
      } catch (queryError: any) {
        console.warn('⚠️ Query with orderBy failed, trying without order:', queryError.message);
        // Fallback: get all docs without ordering
        const querySnapshot = await getDocs(txCollectionRef);
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          let dateStr = data.date;
          if (data.date && data.date.toDate) {
            dateStr = data.date.toDate().toISOString().split('T')[0];
          } else if (data.date instanceof Timestamp) {
            dateStr = data.date.toDate().toISOString().split('T')[0];
          }
          
          transactions.push({ 
            id: doc.id, 
            ...data,
            date: dateStr
          } as Transaction);
        });
        // Sort manually by date
        transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }

      console.log('✅ Loaded transactions:', transactions.length);

      // Get user info with fallbacks
      const userInfo: User = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || "User",
        email: firebaseUser.email || "",
        avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.email || firebaseUser.uid}`
      };

      // Get savings data
      const savings: SavingsData | null = userDoc.data()?.savings || null;

      // Get tracking data
      const tracking: TrackingData | null = userDoc.data()?.tracking || null;

      console.log('✅ User info loaded:', userInfo);

      return {
        transactions,
        budgets,
        user: userInfo,
        preferences,
        savings: savings || undefined,
        tracking: tracking || undefined
      };
    } catch (error: any) {
      console.error('❌ Error fetching app state:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      throw error;
    }
  }

  async createTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      console.error('❌ Cannot create transaction: No authenticated user');
      throw new Error('Unauthorized');
    }

    try {
      console.log('💾 Creating transaction for user:', firebaseUser.uid, transaction);

      // Convert date string to Firestore Timestamp for proper storage and querying
      const dateTimestamp = Timestamp.fromDate(new Date(transaction.date));
      
      const transactionData = {
        ...transaction,
        date: dateTimestamp, // Store as Timestamp
        createdAt: Timestamp.now() // Add creation timestamp
      };

      const txCollectionRef = collection(db, "users", firebaseUser.uid, "transactions");
      const docRef = await addDoc(txCollectionRef, transactionData);
      
      console.log('✅ Transaction created successfully with ID:', docRef.id);
      
      return {
        ...transaction,
        id: docRef.id
      };
    } catch (error: any) {
      console.error('❌ Error creating transaction:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      throw error;
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      console.error('❌ Cannot delete transaction: No authenticated user');
      throw new Error('Unauthorized');
    }

    try {
      console.log('🗑️ Deleting transaction:', id);
      const txDocRef = doc(db, "users", firebaseUser.uid, "transactions", id);
      await deleteDoc(txDocRef);
      console.log('✅ Transaction deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting transaction:', error);
      throw error;
    }
  }

  async updateBudget(budget: Budget): Promise<Budget> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      console.error('❌ Cannot update budget: No authenticated user');
      throw new Error('Unauthorized');
    }

    try {
      console.log('💾 Updating budget:', budget);
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      let newBudgets: Budget[] = [];
      if (userDoc.exists()) {
        const currentBudgets: Budget[] = userDoc.data().budgets || [];
        const index = currentBudgets.findIndex(b => b.category === budget.category);
        newBudgets = [...currentBudgets];
        if (index >= 0) newBudgets[index] = budget;
        else newBudgets.push(budget);
      } else {
        newBudgets = [budget];
      }
      
      await setDoc(userDocRef, { budgets: newBudgets }, { merge: true });
      console.log('✅ Budget updated successfully');
      return budget;
    } catch (error) {
      console.error('❌ Error updating budget:', error);
      throw error;
    }
  }

  // --- NOTES ---
  async saveNote(date: string, note: string): Promise<void> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      console.error('❌ Cannot save note: No authenticated user');
      throw new Error('Unauthorized');
    }

    try {
      console.log('💾 Saving note for date:', date);
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      let notes: Record<string, string> = {};
      if (userDoc.exists()) {
        notes = userDoc.data()?.notes || {};
      }
      
      notes[date] = note;
      
      await setDoc(userDocRef, { notes }, { merge: true });
      console.log('✅ Note saved successfully');
    } catch (error) {
      console.error('❌ Error saving note:', error);
      throw error;
    }
  }

  async getNote(date: string): Promise<string | null> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      console.error('❌ Cannot get note: No authenticated user');
      throw new Error('Unauthorized');
    }

    try {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const notes: Record<string, string> = userDoc.data()?.notes || {};
        return notes[date] || null;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting note:', error);
      throw error;
    }
  }

  // --- USER PROFILE ---
  async updateUser(name?: string, avatar?: string): Promise<User> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      console.error('❌ Cannot update user: No authenticated user');
      throw new Error('Unauthorized');
    }

    try {
      console.log('💾 Updating user profile');
      const updates: { displayName?: string; photoURL?: string } = {};
      
      if (name !== undefined) {
        updates.displayName = name;
      }
      if (avatar !== undefined) {
        updates.photoURL = avatar;
      }

      if (Object.keys(updates).length > 0) {
        await updateProfile(firebaseUser, updates);
        await firebaseUser.reload();
      }

      return {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || "User",
        email: firebaseUser.email || "",
        avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.email || firebaseUser.uid}`
      };
    } catch (error) {
      console.error('❌ Error updating user:', error);
      throw error;
    }
  }

  // --- USER PREFERENCES ---
  async updateUserPreferences(preferences: Record<string, boolean>): Promise<void> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      console.error('❌ Cannot update preferences: No authenticated user');
      throw new Error('Unauthorized');
    }

    try {
      console.log('💾 Updating user preferences:', preferences);
      const userDocRef = doc(db, "users", firebaseUser.uid);
      await setDoc(userDocRef, { preferences }, { merge: true });
      console.log('✅ Preferences updated successfully');
    } catch (error) {
      console.error('❌ Error updating preferences:', error);
      throw error;
    }
  }

  async getUserPreferences(): Promise<Record<string, boolean>> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      console.error('❌ Cannot get preferences: No authenticated user');
      throw new Error('Unauthorized');
    }

    try {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        return userDoc.data()?.preferences || {};
      }
      
      return {};
    } catch (error) {
      console.error('❌ Error getting preferences:', error);
      throw error;
    }
  }

  // --- SAVINGS ---
  async getSavingsData(): Promise<SavingsData | null> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      console.error('❌ Cannot get savings: No authenticated user');
      throw new Error('Unauthorized');
    }

    try {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const savings = userDoc.data()?.savings;
        if (savings) {
          return savings as SavingsData;
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting savings:', error);
      throw error;
    }
  }

  async updateSavingsData(savings: SavingsData): Promise<SavingsData> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      console.error('❌ Cannot update savings: No authenticated user');
      throw new Error('Unauthorized');
    }

    try {
      console.log('💾 Updating savings data:', savings);
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const updatedSavings = {
        ...savings,
        updatedAt: new Date().toISOString()
      };
      await setDoc(userDocRef, { savings: updatedSavings }, { merge: true });
      console.log('✅ Savings updated successfully');
      return updatedSavings;
    } catch (error) {
      console.error('❌ Error updating savings:', error);
      throw error;
    }
  }

  async addSavingsEntry(entry: Omit<SavingsEntry, 'id'>): Promise<SavingsEntry> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      console.error('❌ Cannot add savings entry: No authenticated user');
      throw new Error('Unauthorized');
    }

    try {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      let savings: SavingsData = {
        monthlySalary: 0,
        entries: []
      };
      
      if (userDoc.exists()) {
        savings = userDoc.data()?.savings || savings;
      }
      
      const newEntry: SavingsEntry = {
        ...entry,
        id: Date.now().toString()
      };
      
      savings.entries.push(newEntry);
      savings.entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      await this.updateSavingsData(savings);
      return newEntry;
    } catch (error) {
      console.error('❌ Error adding savings entry:', error);
      throw error;
    }
  }

  async deleteSavingsEntry(entryId: string): Promise<void> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      console.error('❌ Cannot delete savings entry: No authenticated user');
      throw new Error('Unauthorized');
    }

    try {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const savings: SavingsData = userDoc.data()?.savings;
        if (savings) {
          savings.entries = savings.entries.filter(e => e.id !== entryId);
          await this.updateSavingsData(savings);
        }
      }
    } catch (error) {
      console.error('❌ Error deleting savings entry:', error);
      throw error;
    }
  }

  // --- TRACKING DATA ---
  async getTrackingData(): Promise<TrackingData | null> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      console.error('❌ Cannot get tracking data: No authenticated user');
      throw new Error('Unauthorized');
    }

    try {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const tracking = userDoc.data()?.tracking;
        if (tracking) {
          return tracking as TrackingData;
        }
      }
      
      // Return default tracking data
      return {
        bankAccounts: [],
        documents: [],
        receipts: [],
        paymentMethods: [],
        lockSettings: { enabled: false }
      };
    } catch (error) {
      console.error('❌ Error getting tracking data:', error);
      throw error;
    }
  }

  async updateTrackingData(tracking: TrackingData): Promise<TrackingData> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      console.error('❌ Cannot update tracking data: No authenticated user');
      throw new Error('Unauthorized');
    }

    try {
      console.log('💾 Updating tracking data');
      const userDocRef = doc(db, "users", firebaseUser.uid);
      await setDoc(userDocRef, { tracking }, { merge: true });
      console.log('✅ Tracking data updated successfully');
      return tracking;
    } catch (error) {
      console.error('❌ Error updating tracking data:', error);
      throw error;
    }
  }

  // --- LOCK SYSTEM ---
  async setupLock(pin: string): Promise<void> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      throw new Error('Unauthorized');
    }

    try {
      const pinHash = hashPIN(pin);
      const tracking = await this.getTrackingData() || {
        bankAccounts: [],
        documents: [],
        receipts: [],
        paymentMethods: [],
        lockSettings: { enabled: false }
      };

      tracking.lockSettings = {
        enabled: true,
        pinHash,
        createdAt: new Date().toISOString()
      };

      await this.updateTrackingData(tracking);
    } catch (error) {
      console.error('❌ Error setting up lock:', error);
      throw error;
    }
  }

  async verifyLockPin(pin: string): Promise<boolean> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      throw new Error('Unauthorized');
    }

    try {
      const tracking = await this.getTrackingData();
      if (!tracking?.lockSettings?.pinHash) {
        return false;
      }

      const isValid = verifyPIN(pin, tracking.lockSettings.pinHash);
      if (isValid) {
        // Update last unlock time
        tracking.lockSettings.lastUnlock = new Date().toISOString();
        await this.updateTrackingData(tracking);
      }
      return isValid;
    } catch (error) {
      console.error('❌ Error verifying PIN:', error);
      return false;
    }
  }

  async updateLockSettings(enabled: boolean, pin?: string): Promise<void> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      throw new Error('Unauthorized');
    }

    try {
      const tracking = await this.getTrackingData() || {
        bankAccounts: [],
        documents: [],
        receipts: [],
        paymentMethods: [],
        lockSettings: { enabled: false }
      };

      if (enabled && pin) {
        tracking.lockSettings = {
          enabled: true,
          pinHash: hashPIN(pin),
          createdAt: tracking.lockSettings?.createdAt || new Date().toISOString()
        };
      } else {
        tracking.lockSettings = {
          enabled: false,
          pinHash: tracking.lockSettings?.pinHash,
          createdAt: tracking.lockSettings?.createdAt
        };
      }

      await this.updateTrackingData(tracking);
    } catch (error) {
      console.error('❌ Error updating lock settings:', error);
      throw error;
    }
  }

  // --- BANK ACCOUNTS ---
  async addBankAccount(account: Omit<BankAccount, 'id' | 'createdAt'>): Promise<BankAccount> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error('Unauthorized');

    const tracking = await this.getTrackingData() || {
      bankAccounts: [],
      documents: [],
      receipts: [],
      paymentMethods: [],
      lockSettings: { enabled: false }
    };

    const key = getEncryptionKey(firebaseUser.uid);
    const encryptedAccountNumber = encrypt(account.accountNumber, key);
    const encryptedIFSC = encrypt(account.ifscCode, key);

    const newAccount: BankAccount = {
      ...account,
      accountNumber: encryptedAccountNumber,
      ifscCode: encryptedIFSC,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };

    tracking.bankAccounts.push(newAccount);
    await this.updateTrackingData(tracking);
    return newAccount;
  }

  async deleteBankAccount(accountId: string): Promise<void> {
    const tracking = await this.getTrackingData();
    if (tracking) {
      tracking.bankAccounts = tracking.bankAccounts.filter(a => a.id !== accountId);
      await this.updateTrackingData(tracking);
    }
  }

  // --- DOCUMENTS ---
  async addDocument(doc: Omit<Document, 'id' | 'createdAt'>): Promise<Document> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error('Unauthorized');

    const tracking = await this.getTrackingData() || {
      bankAccounts: [],
      documents: [],
      receipts: [],
      paymentMethods: [],
      lockSettings: { enabled: false }
    };

    const key = getEncryptionKey(firebaseUser.uid);
    const encryptedNumber = encrypt(doc.number, key);

    const newDoc: Document = {
      ...doc,
      number: encryptedNumber,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };

    tracking.documents.push(newDoc);
    await this.updateTrackingData(tracking);
    return newDoc;
  }

  async deleteDocument(docId: string): Promise<void> {
    const tracking = await this.getTrackingData();
    if (tracking) {
      tracking.documents = tracking.documents.filter(d => d.id !== docId);
      await this.updateTrackingData(tracking);
    }
  }

  // --- PAYMENT METHODS ---
  async addPaymentMethod(method: Omit<PaymentMethod, 'id' | 'createdAt'>): Promise<PaymentMethod> {
    const tracking = await this.getTrackingData() || {
      bankAccounts: [],
      documents: [],
      receipts: [],
      paymentMethods: [],
      lockSettings: { enabled: false }
    };

    const newMethod: PaymentMethod = {
      ...method,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };

    tracking.paymentMethods.push(newMethod);
    await this.updateTrackingData(tracking);
    return newMethod;
  }

  async deletePaymentMethod(methodId: string): Promise<void> {
    const tracking = await this.getTrackingData();
    if (tracking) {
      tracking.paymentMethods = tracking.paymentMethods.filter(m => m.id !== methodId);
      await this.updateTrackingData(tracking);
    }
  }

  // --- RECEIPTS ---
  async addReceipt(receipt: Omit<Receipt, 'id' | 'createdAt'>): Promise<Receipt> {
    const tracking = await this.getTrackingData() || {
      bankAccounts: [],
      documents: [],
      receipts: [],
      paymentMethods: [],
      lockSettings: { enabled: false }
    };

    const newReceipt: Receipt = {
      ...receipt,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };

    tracking.receipts.push(newReceipt);
    await this.updateTrackingData(tracking);
    return newReceipt;
  }

  async deleteReceipt(receiptId: string): Promise<void> {
    const tracking = await this.getTrackingData();
    if (tracking) {
      tracking.receipts = tracking.receipts.filter(r => r.id !== receiptId);
      await this.updateTrackingData(tracking);
    }
  }
}

export const api = new WealthSenseAPI();
