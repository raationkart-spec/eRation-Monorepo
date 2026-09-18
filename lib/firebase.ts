import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBkLYwRSwDMfAMuGyicx0dN1rdj0M6xk3A",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "rationcart-22688.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "rationcart-22688",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "rationcart-22688.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "148639493611",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:148639493611:web:dfaad18f5b0ea2aa5bfdae",
};

// Initialize Firebase App singleton
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google Auth Provider with account selection prompt
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

/**
 * Sign in using Firebase Google Auth with account picker
 */
export async function signInWithGoogleFirebase() {
  const { signInWithPopup } = await import("firebase/auth");
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

