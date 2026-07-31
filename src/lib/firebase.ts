// File: src/lib/firebase.ts
// Purpose: Single Firebase client initialization (Auth + Firestore).
// Security: uses NEXT_PUBLIC config only; access control lives in firestore.rules.

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const required = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function assertFirebaseConfigured(): string | null {
  const missing = required.filter((k) => !process.env[k]);
  return missing.length > 0 ? `Missing environment variables: ${missing.join(", ")}` : null;
}

let app: FirebaseApp | null = null;

function getApp(): FirebaseApp {
  if (!app) {
    app = getApps()[0] ?? initializeApp(firebaseConfig);
  }
  return app;
}

export function auth(): Auth {
  return getAuth(getApp());
}

export function db(): Firestore {
  return getFirestore(getApp());
}
