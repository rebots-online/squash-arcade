import { db, auth, providerKey, iso, fail, hash } from './core.js';

export function computeAccess(purchases, revision = 0, now = Date.now()) {
  const valid = purchases.filter(p => !p.supersededBy && ['active', 'grace', 'canceled_active'].includes(p.state) && (p.lifetime || p.validUntil > now));
  valid.sort((a, b) => Number(b.lifetime) - Number(a.lifetime) || (b.validUntil || 0) - (a.validUntil || 0));
  const best = valid[0] || purchases.find(p => !p.supersededBy && p.state === 'pending') || purchases.find(p => !p.supersededBy && p.state === 'revoked');
  return { state: best?.state || (purchases.length ? 'expired' : 'none'), provider: best?.provider || null, plan: best?.plan || null, validUntil: iso(best?.validUntil), lifetime: !!best?.lifetime, revision, checkedAt: iso(now) };
}
export function isAllowed(access) { return ['active', 'grace', 'canceled_active'].includes(access.state) && (access.lifetime || Date.parse(access.validUntil) > Date.now()); }
export async function claimPurchase(uid, purchase) {
  const id = providerKey(purchase.provider, purchase.purchaseRef);
  const ref = db.doc(`purchaseClaims/${id}`); const user = db.doc(`users/${uid}`);
  await db.runTransaction(async tx => {
    const existing = await tx.get(ref);
    if (existing.exists && existing.data().ownerUid !== uid) fail('PURCHASE_OWNED', 'This purchase belongs to another account.', 409);
    const all = await tx.get(db.collection('purchaseClaims').where('ownerUid', '==', uid));
    const previousUser = await tx.get(user);
    if (existing.exists && existing.data().observedAt > purchase.observedAt) return;
    const record = { ...purchase, ownerUid: uid, id, ...(existing.data()?.supersededBy ? { supersededBy: existing.data().supersededBy, state: 'revoked' } : {}) };
    const aggregate = all.docs.filter(doc => doc.id !== id).map(doc => doc.data()).concat(record);
    const access = computeAccess(aggregate, (previousUser.data()?.access?.revision || 0) + 1);
    tx.set(ref, record, { merge: true });
    tx.set(user, { access }, { merge: true });
    const transactionRef = record.invoiceId || record.orderId || record.purchaseRef;
    const historyId = providerKey(record.provider, transactionRef);
    tx.set(db.doc(`users/${uid}/purchases/${historyId}`), { id: historyId, claimId: id, invoiceId: record.invoiceId || null, receiptUrl: record.receiptUrl || null, orderId: record.orderId || null, provider: record.provider, plan: record.plan, productId: record.productId, status: record.state, paidAt: iso(record.paidAt), amount: record.amount ?? null, currency: record.currency ?? null, documentAvailable: record.provider === 'google_play' ? !!record.orderId : !!(record.invoiceId || record.receiptUrl) });
  });
  return id;
}
export async function account(uid) {
  const [user, claims, purchases] = await Promise.all([auth.getUser(uid), db.collection('purchaseClaims').where('ownerUid', '==', uid).get(), db.collection(`users/${uid}/purchases`).get()]);
  const projection = await db.doc(`users/${uid}`).get();
  const billing = await db.doc(`billingAccounts/${uid}`).get();
  const intentId = billing.data()?.activeIntentId;
  const intent = intentId ? (await db.doc(`checkoutIntents/${intentId}`).get()).data() : null;
  const pendingCheckout = intent?.ownerUid === uid && ['creating', 'pending'].includes(intent.state) ? { intentId, provider: 'stripe', plan: intent.plan, state: intent.state, url: intent.url || null, createdAt: iso(intent.createdAt) } : null;
  let access = computeAccess(claims.docs.map(d => d.data()), projection.data()?.access?.revision || 0);
  if (pendingCheckout && !isAllowed(access)) access = { ...access, state: 'pending', provider: 'stripe', plan: intent.plan, lifetime: false, validUntil: null };
  return { profile: { uid, email: user.email || null, displayName: user.displayName || null }, billing: { playObfuscatedAccountId: hash(`play:${uid}`), pendingCheckout, historyIncomplete: !!billing.data()?.historyIncomplete }, access, purchases: purchases.docs.map(d => d.data()).sort((a, b) => (b.paidAt || '').localeCompare(a.paidAt || '')) };
}
export async function ownedPurchase(uid, id) {
  if (!/^[a-f0-9]{64}$/.test(id)) fail('NOT_FOUND', 'Purchase not found.', 404);
  const doc = await db.doc(`purchaseClaims/${id}`).get();
  if (!doc.exists || doc.data().ownerUid !== uid) fail('NOT_FOUND', 'Purchase not found.', 404);
  return doc.data();
}
