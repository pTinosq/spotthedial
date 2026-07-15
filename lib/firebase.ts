import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import { type Auth, getAuth, signInAnonymously } from "firebase/auth";
import { type Firestore, getFirestore } from "firebase/firestore";

/**
 * Firebase is entirely optional: the multiplayer "versus" feature is gated
 * behind these env vars. When they're absent the rest of the (static) site is
 * untouched and `/versus` shows a "not configured" notice. The keys are public
 * by design — Firestore security rules do the protecting, not secrecy.
 */
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  config.apiKey && config.authDomain && config.projectId && config.appId,
);

let app: FirebaseApp | null = null;

function getApp(): FirebaseApp {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured");
  }
  if (!app) {
    app = getApps()[0] ?? initializeApp(config);
  }
  return app;
}

export function getDb(): Firestore {
  return getFirestore(getApp());
}

function getAuthInstance(): Auth {
  return getAuth(getApp());
}

/**
 * Sign the player in anonymously and return their stable uid. The uid is what
 * the security rules key player-doc ownership on, so every write path calls
 * this first. Anonymous sign-in must be enabled in the Firebase console.
 */
export async function ensureUid(): Promise<string> {
  const auth = getAuthInstance();
  if (auth.currentUser) return auth.currentUser.uid;
  const cred = await signInAnonymously(auth);
  return cred.user.uid;
}
