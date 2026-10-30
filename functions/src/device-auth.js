import { randomBytes, timingSafeEqual } from 'node:crypto';
import { db, auth, hash, httpsUrl, fail, iso } from './core.js';
const token = () => randomBytes(32).toString('base64url');
export async function startDeviceAuthorization() {
  const id = token(); const secret = token(); const expiresAt = Date.now() + 300000;
  await db.doc(`deviceAuthorizations/${id}`).create({ secretHash: hash(secret), expiresAt, approvedUid: null, consumedAt: null });
  const url = new URL(httpsUrl('ACCOUNT_AUTH_URL')); url.searchParams.set('request', id);
  return { id, secret, url: url.href, expiresAt: iso(expiresAt) };
}
function deviceRef(id) { if (!/^[\w-]{43}$/.test(id || '')) fail('INVALID_REQUEST', 'Invalid account request.'); return db.doc(`deviceAuthorizations/${id}`); }
export async function approveDeviceAuthorization(uid, id) {
  const ref = deviceRef(id);
  await db.runTransaction(async tx => {
    const doc = await tx.get(ref); const data = doc.data();
    if (!data || data.expiresAt <= Date.now() || data.consumedAt) fail('REQUEST_EXPIRED', 'This account request expired.', 410);
    if (data.approvedUid && data.approvedUid !== uid) fail('REQUEST_OWNED', 'This request was approved by another account.', 409);
    tx.update(ref, { approvedUid: uid });
  });
  return { status: 'approved' };
}
export async function exchangeDeviceAuthorization(id, secret) {
  if (typeof secret !== 'string' || secret.length !== 43) fail('INVALID_REQUEST', 'Invalid account request.');
  const ref = deviceRef(id);
  const uid = await db.runTransaction(async tx => {
    const doc = await tx.get(ref); const data = doc.data();
    if (!data || !timingSafeEqual(Buffer.from(data.secretHash), Buffer.from(hash(secret)))) fail('INVALID_REQUEST', 'Invalid account request.', 403);
    if (data.expiresAt <= Date.now() || data.consumedAt) fail('REQUEST_EXPIRED', 'This account request expired. Start sign-in again.', 410);
    if (!data.approvedUid) return null;
    tx.update(ref, { consumedAt: Date.now() }); return data.approvedUid;
  });
  // Consumption precedes token issuance: an ambiguous response cannot mint a second token.
  return uid ? { status: 'approved', customToken: await auth.createCustomToken(uid) } : { status: 'pending' };
}
