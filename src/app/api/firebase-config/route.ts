import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/env';

export async function GET() {
  const env = getEnv();
  const firebaseConfig = {
    apiKey: env.FIREBASE_API_KEY,
    authDomain: env.FIREBASE_AUTH_DOMAIN,
    projectId: env.FIREBASE_PROJECT_ID,
    storageBucket: env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
    appId: env.FIREBASE_APP_ID,
  };
  return NextResponse.json(firebaseConfig);
}
