import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/env';

export async function GET() {
  const env = getEnv();
  try {
    const publicKey = JSON.parse(env.PUBLIC_KEY);
    // Ensure the kid is present, as Moodle expects it
    if (!publicKey.kid) {
      publicKey.kid = 'default-kid'; // Or generate a unique one if needed
    }
    return NextResponse.json({ keys: [publicKey] });
  } catch (error) {
    console.error('Error parsing public key:', error);
    return new NextResponse('Internal Server Error: Invalid public key configuration', { status: 500 });
  }
}
