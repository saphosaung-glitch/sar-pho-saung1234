import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { initializeFirestore, memoryLocalCache, doc, getDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase SDK
console.log("Initializing Firebase with project:", firebaseConfig.projectId);
const app = initializeApp(firebaseConfig);

// Initialize Firestore with long polling to resolve connectivity issues in iframe/sandboxed environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
// Initialize Storage using the bucket from firebaseConfig (most robust)
export const storage = getStorage(app);
export { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, signInAnonymously };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

let isQuotaExceeded = false;
let quotaListeners: ((exceeded: boolean) => void)[] = [];

export function getIsQuotaExceeded() {
  return isQuotaExceeded;
}

export function onQuotaExceededChange(listener: (exceeded: boolean) => void) {
  quotaListeners.push(listener);
  return () => {
    quotaListeners = quotaListeners.filter(l => l !== listener);
  };
}

export function resetQuotaExceeded() {
  isQuotaExceeded = false;
  quotaListeners.forEach(l => l(false));
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  if (errorMessage.includes('resource-exhausted')) {
    isQuotaExceeded = true;
    quotaListeners.forEach(l => l(true));
  }
  
  if (errorMessage.includes('client is offline')) {
    console.warn("Firestore reports client is offline. This might be due to a strict network environment or database provisioning delay.");
  }

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // Notice: We log the error but don't strictly throw here if it's a listener error
  // to avoid crashing the whole React tree, though React Query or Error Boundaries usually handle this.
  // In this app, we catch it in the listeners.
}

async function testConnection() {
  console.log("Testing Firestore connection to database:", firebaseConfig.firestoreDatabaseId);
  // Wait a moment for Firebase to initialize
  await new Promise(resolve => setTimeout(resolve, 3000));
  try {
    const docRef = doc(db, 'test', 'connection');
    await getDoc(docRef);
    console.log("Firestore connection successful!");
  } catch (error) {
    console.error("Firestore connection test failed:", error);
    if(error instanceof Error && error.message.includes('unavailable')) {
      console.warn("Firestore reports backend is unavailable. This is often temporary in sandboxed environments. Retrying later via SDK...");
    }
  }
}
// Call with a small delay to allow SDK initialization
setTimeout(testConnection, 1000);
