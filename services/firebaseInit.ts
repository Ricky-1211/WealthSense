import { doc, getDoc, setDoc, collection } from "firebase/firestore";
import { db, auth } from "./firebase";
import { Budget } from "../types";

/**
 * Default budgets to initialize for new users
 */
const DEFAULT_BUDGETS: Budget[] = [
  { category: 'Food', limit: 500 },
  { category: 'Transport', limit: 200 },
  { category: 'Rent', limit: 1200 }
];

/**
 * Initialize user document with default data structure
 * This ensures the user collection exists with proper structure
 */
export const initializeUserDocument = async (userId: string): Promise<void> => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    // If document doesn't exist, create it with default structure
    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        budgets: DEFAULT_BUDGETS,
        createdAt: new Date().toISOString()
      });
      console.log(`✅ Initialized user document for ${userId}`);
    } else {
      // Ensure required fields exist (migration support)
      const data = userDoc.data();
      const updates: any = {};

      if (!data.budgets || !Array.isArray(data.budgets)) {
        updates.budgets = DEFAULT_BUDGETS;
      }

      if (!data.createdAt) {
        updates.createdAt = new Date().toISOString();
      }

      // Only update if there are changes needed
      if (Object.keys(updates).length > 0) {
        await setDoc(userDocRef, updates, { merge: true });
        console.log(`✅ Updated user document structure for ${userId}`);
      }
    }
  } catch (error) {
    console.error('❌ Error initializing user document:', error);
    throw error;
  }
};

/**
 * Initialize transactions collection (creates collection reference)
 * Collections are created automatically in Firestore on first write operation.
 * This function is a placeholder - the collection will be created implicitly
 * when the first transaction is added via addDoc().
 */
export const initializeTransactionsCollection = async (userId: string): Promise<void> => {
  // No-op: Collection will be created automatically on first transaction write
  // Firestore creates collections implicitly when you add the first document
  console.log(`✅ Transactions collection will be created on first transaction for ${userId}`);
};

/**
 * Initialize all Firebase collections and structures for the current user
 * Call this after user authentication
 */
export const initializeFirebaseCollections = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No authenticated user found');
  }

  try {
    console.log(`🚀 Initializing Firebase collections for user: ${user.uid}`);
    
    // Initialize user document
    await initializeUserDocument(user.uid);
    
    // Initialize transactions collection
    await initializeTransactionsCollection(user.uid);
    
    console.log(`✅ All Firebase collections initialized successfully`);
  } catch (error) {
    console.error('❌ Error initializing Firebase collections:', error);
    throw error;
  }
};

/**
 * Auto-initialize collections when Firebase connects
 * This can be called on app startup or auth state change
 */
export const autoInitializeOnConnect = async (): Promise<void> => {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          await initializeFirebaseCollections();
        } catch (error) {
          console.error('Auto-initialization error:', error);
        }
      }
      unsubscribe(); // Only run once
      resolve();
    });
  });
};

