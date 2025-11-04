
import { getEnv } from '@/lib/env';
import { JWK, JWS } from 'node-jose';
import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { LtiClaims } from './lti-claims';

const LTI_SESSION_COOKIE_NAME = 'lti-session';

export interface LtiSessionData {
  sub: string;
  roles: string[];
  contextId: string | undefined;
  deploymentId: string;
  name?: string;
  email?: string;
  taskId?: string;
  isInstructor?: boolean;
  cohortId?: number | null;
}

export async function verifyIdToken(id_token: string, nonce: string): Promise<any> {
  const env = getEnv();
  const parts = id_token.split('.');
  if (parts.length !== 3) throw new Error('Invalid id_token format');

  const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
  const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

  if (payload.iss !== env.PLATFORM_ISS) throw new Error('Invalid issuer');
  if (payload.aud !== env.PLATFORM_CLIENT_ID) throw new Error('Invalid audience');
  if (payload.nonce !== nonce) throw new Error('Invalid nonce');

  const jwks = await fetch(env.PLATFORM_JWKS_ENDPOINT).then((res) => res.json());
  const keystore = await JWK.asKeyStore(jwks);
  const key = await JWK.asKey(keystore.get(header.kid));

  const verifier = JWS.createVerify(key);
  const verified = await verifier.verify(id_token);

  return JSON.parse(verified.payload.toString());
}

async function getLtiSession(): Promise<IronSession<LtiSessionData>> {
  const LTI_SESSION_COOKIE_PASSWORD = getEnv().SESSION_SECRET;
  return getIronSession<LtiSessionData>(await cookies(), {
    password: LTI_SESSION_COOKIE_PASSWORD,
    cookieName: LTI_SESSION_COOKIE_NAME,
    cookieOptions: {
      sameSite: 'none',
      secure: true,
      httpOnly: true,
    },
  });
}

export async function setLtiSessionCookie(data: LtiSessionData) {
  const session = await getLtiSession();
  Object.assign(session, data);
  await session.save();
}

export async function getLtiSessionCookie(): Promise<LtiSessionData | null> {
  const session = await getLtiSession();
  if (!session.sub) return null;
  return {
    sub: session.sub,
    roles: session.roles,
    contextId: session.contextId,
    deploymentId: session.deploymentId,
    name: session.name,
    email: session.email,
    taskId: session.taskId,
    isInstructor: session.isInstructor,
    cohortId: session.cohortId,
  };
}
