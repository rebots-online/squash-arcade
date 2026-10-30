import { productId as applicationProductId, productDoc, productCollection, historyDoc, historyCollection, playAccountId, db, auth, providerKey, iso, fail, required } from './core.js';

export function computeAccess(purchases, revision = 0, now = Date.now()) {
  const valid = purchases.filter(p => !p.supersededBy && ['active', 'grace', 'canceled_active'].includes(p.state) && (p.lifetime || p.validUntil > now));
  valid.sort((a, b) => Number(b.lifetime) - Number(a.lifetime) || (b.validUntil || 0) - (a.validUntil || 0));
  const best = valid[0] || purchases.find(p => !p.supersededBy && p.state === 'pending') || purchases.find(p => !p.supersededBy && p.state === 'revoked') || purchases.filter(p => !p.supersededBy).sort((a, b) => (b.validUntil || b.observedAt || 0) - (a.validUntil || a.observedAt || 0))[0];
  const state = valid[0] ? best.state : ['pending', 'revoked'].includes(best?.state) ? best.state : purchases.length ? 'expired' : 'none';
  return { paid: valid.length > 0, state, provider: best?.provider || null, plan: best?.plan || null, validUntil: iso(best?.validUntil), lifetime: !!best?.lifetime, revision, checkedAt: iso(now) };
}
export function isAllowed(access) { return ['active', 'grace', 'canceled_active'].includes(access.state) && (access.lifetime || Date.parse(access.validUntil) > Date.now()); }
export async function claimPurchase(uid, purchase) {
  const id = providerKey(purchase.provider, purchase.purchaseRef);
  const ref = productDoc('purchaseClaims', id); const user = db.doc(`users/${uid}`);
  await db.runTransaction(async tx => {
    const existing = await tx.get(ref);
    if (existing.exists && existing.data().ownerUid !== uid) fail('PURCHASE_OWNED', 'This purchase belongs to another account.', 409);
    const all = await tx.get(productCollection('purchaseClaims').where('ownerUid', '==', uid));
    const previousUser = await tx.get(user);
    if (existing.exists && existing.data().observedAt > purchase.observedAt) return;
    const record = { ...purchase, appProductId: applicationProductId(), ownerUid: uid, id, ...(existing.data()?.supersededBy ? { supersededBy: existing.data().supersededBy, state: 'revoked' } : {}) };
    const aggregate = all.docs.filter(doc => doc.id !== id).map(doc => doc.data()).concat(record);
    const access = computeAccess(aggregate, (previousUser.data()?.access?.[applicationProductId()]?.revision || 0) + 1);
    tx.set(ref, record, { merge: true });
    // One provider's update must not turn another expired-but-unrefreshed active
    // claim into a persisted false flag. Full successful reconciliation resolves it.
    const unresolvedOther = aggregate.some(claim => claim.id !== id && !claim.supersededBy && ['active', 'grace', 'canceled_active'].includes(claim.state) && !claim.lifetime && claim.validUntil <= Date.now());
    if (access.paid || !unresolvedOther) tx.set(user, { access: { [applicationProductId()]: access } }, { merge: true });
    tx.set(productDoc('billingAccounts', uid), { appProductId: applicationProductId(), ownerUid: uid }, { merge: true });
    const transactionRef = record.invoiceId || record.orderId || record.purchaseRef;
    const historyId = providerKey(record.provider, transactionRef);
    tx.set(historyDoc(uid, historyId), { appProductId: applicationProductId(), id: historyId, claimId: id, invoiceId: record.invoiceId || null, receiptUrl: record.receiptUrl || null, orderId: record.orderId || null, provider: record.provider, plan: record.plan, productId: record.productId, status: record.state, paidAt: iso(record.paidAt), amount: record.amount ?? null, currency: record.currency ?? null, documentAvailable: record.provider === 'google_play' ? !!record.orderId : !!(record.invoiceId || record.receiptUrl) });
  });
  return id;
}
export async function account(uid) {
  const [user, claims, purchases] = await Promise.all([auth.getUser(uid), productCollection('purchaseClaims').where('ownerUid', '==', uid).get(), historyCollection(uid).get()]);
  const projection = await db.doc(`users/${uid}`).get();
  const billing = await productDoc('billingAccounts', uid).get();
  const intentId = billing.data()?.activeIntentId;
  const intent = intentId ? (await productDoc('checkoutIntents', intentId).get()).data() : null;
  const pendingCheckout = intent?.ownerUid === uid && ['creating', 'pending'].includes(intent.state) ? { intentId, provider: 'stripe', plan: intent.plan, state: intent.state, url: intent.url || null, createdAt: iso(intent.createdAt) } : null;
  let access = computeAccess(claims.docs.map(d => d.data()), projection.data()?.access?.[applicationProductId()]?.revision || 0);
  if (pendingCheckout && !isAllowed(access)) access = { ...access, paid: false, state: 'pending', provider: 'stripe', plan: intent.plan, lifetime: false, validUntil: null };
  let manageUrl = null;
  if (access.provider === 'google_play' && !access.lifetime) {
    const purchase = claims.docs.map(doc => doc.data()).find(claim => claim.provider === 'google_play' && claim.plan === access.plan && !claim.supersededBy && !claim.lifetime);
    if (purchase) {
      const url = new URL('https://play.google.com/store/account/subscriptions');
      url.searchParams.set('sku', purchase.productId); url.searchParams.set('package', required('PLAY_PACKAGE_NAME')); manageUrl = url.href;
    }
  }
  return { profile: { uid, email: user.email || null, displayName: user.displayName || null }, billing: { playObfuscatedAccountId: playAccountId(uid), pendingCheckout, manageUrl, historyIncomplete: !!billing.data()?.historyIncomplete }, access, purchases: purchases.docs.map(d => d.data()).sort((a, b) => (b.paidAt || '').localeCompare(a.paidAt || '')) };
}
export async function persistVerifiedAccess(uid) {
  await db.runTransaction(async tx => {
    const userRef = db.doc(`users/${uid}`);
    const user = await tx.get(userRef);
    const claims = await tx.get(productCollection('purchaseClaims').where('ownerUid', '==', uid));
    if (claims.empty) return; // No default account/product flag for a never-purchasing user.
    const access = computeAccess(claims.docs.map(doc => doc.data()), (user.data()?.access?.[applicationProductId()]?.revision || 0) + 1);
    tx.set(userRef, { access: { [applicationProductId()]: access } }, { merge: true });
  });
}
export async function ownedPurchase(uid, id) {
  if (!/^[a-f0-9]{64}$/.test(id)) fail('NOT_FOUND', 'Purchase not found.', 404);
  const doc = await productDoc('purchaseClaims', id).get();
  if (!doc.exists || doc.data().ownerUid !== uid) fail('NOT_FOUND', 'Purchase not found.', 404);
  return doc.data();
}
