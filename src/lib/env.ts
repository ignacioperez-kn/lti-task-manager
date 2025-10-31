
import { z } from 'zod';

const EnvSchema = z.object({
  PLATFORM_ISS: z.string().url(),
  PLATFORM_CLIENT_ID: z.string(),
  PLATFORM_AUTHORIZATION_ENDPOINT: z.string().url(),
  PLATFORM_TOKEN_ENDPOINT: z.string().url(),
  PLATFORM_JWKS_ENDPOINT: z.string().url(),
  NEXT_PUBLIC_TOOL_HOST: z.string().url(),
  TOOL_PRIVATE_KEY: z.string(),
  PUBLIC_KEY: z.string(),
  SESSION_SECRET: z.string(),
  MOODLE_API_TOKEN: z.string(),
  MOODLE_API_URL: z.string().url(),
  FIREBASE_API_KEY: z.string(),
  FIREBASE_AUTH_DOMAIN: z.string(),
  FIREBASE_PROJECT_ID: z.string(),
  FIREBASE_STORAGE_BUCKET: z.string(),
  FIREBASE_MESSAGING_SENDER_ID: z.string(),
  FIREBASE_APP_ID: z.string(),
});

type Env = z.infer<typeof EnvSchema>;
let _env: Env | null = null;

/** Parse env ONLY when first needed (runtime), not at build/import time. */
export function getEnv(): Env {
  if (_env) return _env;
  _env = EnvSchema.parse(process.env);
  return _env;
}
