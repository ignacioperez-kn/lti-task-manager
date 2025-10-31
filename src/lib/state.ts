
import { getEnv } from '@/lib/env';
import { sign, verify } from 'jsonwebtoken';
import { randomBytes } from 'crypto';

const STATE_COOKIE_NAME = 'lti_state';
const STATE_MAX_AGE_SECONDS = 90;

// Simple state management
type State = {
  ts: number;
  nonce: string;
};

export function newNonce() {
  return randomBytes(16).toString('hex');
}

export function signState(state: State): string {
  const env = getEnv();
  return sign(state, env.SESSION_SECRET);
}

export function verifyState(state: string): State {
  const env = getEnv();
  try {
    const payload = verify(state, env.SESSION_SECRET) as State;
    if (typeof payload !== 'object' || !payload.ts || !payload.nonce) {
      throw new Error('Invalid state payload');
    }
    const now = Math.floor(Date.now() / 1000);
    if (now - payload.ts > STATE_MAX_AGE_SECONDS) {
      throw new Error('State expired');
    }
    return payload;
  } catch (err: any) {
    throw new Error(`State verification failed: ${err.message}`);
  }
}
