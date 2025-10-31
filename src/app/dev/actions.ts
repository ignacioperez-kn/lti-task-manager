'use server';

export async function logEnv() {
  console.log('--- Logging environment variables from server action ---');
  console.log(process.env);
}
