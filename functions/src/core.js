import { createHash } from 'node:crypto';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) initializeApp();
export const db = getFirestore(required('FIRESTORE_DATABASE_ID'));
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
export function productId() {
  const value = required('SQUASH_PRODUCT_ID');
  if (!/^[a-z][a-z0-9_-]{0,63}$/.test(value)) fail('CONFIGURATION_INVALID', 'Invalid SQUASH_PRODUCT_ID.', 503);
  return value;
}
export const productCollection = name => db.collection(`products/${productId()}/${name}`);
export const productDoc = (name, id) => productCollection(name).doc(id);
export const historyCollection = uid => db.collection(`users/${uid}/products/${productId()}/purchases`);
export const historyDoc = (uid, id) => historyCollection(uid).doc(id);
export const providerKey = (provider, ref) => hash(`${productId()}:${provider}:${ref}`);
export const playAccountId = uid => hash(`${productId()}:play:${uid}`);
export function ownsMetadata(metadata, uid) { return metadata?.appProductId === productId() && metadata?.firebaseUid === uid; }
