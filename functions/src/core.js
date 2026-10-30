import { createHash } from 'node:crypto';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) initializeApp();
export const db = getFirestore();
export const auth = getAuth();
export const hash = value => createHash('sha256').update(value).digest('hex');
export const iso = value => value ? new Date(value).toISOString() : null;
export function fail(code, message, status = 400) { throw Object.assign(new Error(message), { code, status }); }
export function required(name) {
  const value = process.env[name]?.trim();
  if (!value || /^(kstore:|secret:|pointer:)/i.test(value)) fail('CONFIGURATION_REQUIRED', `Required runtime binding: ${name}`, 503);
  return value;
}
export function httpsUrl(name) {
  const value = required(name); const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password) fail('CONFIGURATION_INVALID', `HTTPS URL required: ${name}`, 503);
  return value;
}
export async function identity(req) {
  const match = /^Bearer (.+)$/.exec(req.headers.authorization || '');
  if (!match) fail('SIGN_IN_REQUIRED', 'Sign in to continue.', 401);
  try { return await auth.verifyIdToken(match[1], true); }
  catch { fail('SIGN_IN_REQUIRED', 'Your session needs to be refreshed.', 401); }
}
export const providerKey = (provider, ref) => hash(`${provider}:${ref}`);
