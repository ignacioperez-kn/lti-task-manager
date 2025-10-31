
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

let app: FirebaseApp | undefined;

async function getFirebaseApp() {
  if (app) return app;

  // On the server, we need a full URL. On the client, a relative one is fine.
  const host = typeof window === 'undefined' ? process.env.NEXT_PUBLIC_TOOL_HOST : window.location.origin;
  console.log('[firebase.ts] NEXT_PUBLIC_TOOL_HOST:', host);
  const configUrl = new URL('/api/firebase-config', host).toString();

  const res = await fetch(configUrl);
  if (!res.ok) {
    throw new Error('Failed to fetch Firebase config');
  }
  const firebaseConfig = await res.json();

  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  return app;
}

// Initialize Firestore lazily
let db: Firestore | undefined;
export async function getDb() {
  if (db) return db;
  const firebaseApp = await getFirebaseApp();
  db = getFirestore(firebaseApp);
  return db;
}

// For components that need the db instance directly,
// you might need to adjust them to handle the async nature.
// For now, we export a promise that resolves to the db.
export const dbPromise = getDb();
