import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import rawConfig from '../../firebase-applet-config.json';

// Safe configuration with fallback support for Vercel and production deployments
const metaEnv = (import.meta as unknown as { env?: Record<string, string> })?.env || {};

const config = {
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || rawConfig?.projectId || "substantial-decoder-3cf5x",
  appId: metaEnv.VITE_FIREBASE_APP_ID || rawConfig?.appId || "1:905835235167:web:12aa4bce2e135981ff58ea",
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || rawConfig?.apiKey || "AIzaSyBmvbul9ynGt1WI759NalBFKojKwDxbxXM",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || rawConfig?.authDomain || "substantial-decoder-3cf5x.firebaseapp.com",
  firestoreDatabaseId: metaEnv.VITE_FIREBASE_DATABASE_ID || rawConfig?.firestoreDatabaseId || "ai-studio-heafoundation-af084eb7-f0d3-4583-b98d-0acd94952e05",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || rawConfig?.storageBucket || "substantial-decoder-3cf5x.firebasestorage.app",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || rawConfig?.messagingSenderId || "905835235167",
};

// Initialize Firebase App safely
const app = getApps().length > 0 ? getApp() : initializeApp(config);

// Initialize Firestore safely
const customDbId = config.firestoreDatabaseId;
export const db = (customDbId && customDbId !== "(default)")
  ? getFirestore(app, customDbId) 
  : getFirestore(app);

// Initialize Auth safely
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};
