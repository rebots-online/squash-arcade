import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { db, hash, required, fail, providerKey } from './core.js';
import { plans, playProduct, basePlan } from './catalog.js';
import { claimPurchase } from './entitlements.js';

const publisher = () => google.androidpublisher({ version: 'v3', auth: new google.auth.GoogleAuth({ scopes: ['https://www.googleapis.com/auth/androidpublisher'] }) });
const packageName = () => required('PLAY_PACKAGE_NAME');
export async function verifyPlayPurchase(uid, { purchaseToken, productId }) {
  if (typeof purchaseToken !== 'string' || purchaseToken.length > 4096 || !purchaseToken || typeof productId !== 'string') fail('INVALID_PURCHASE', 'Invalid Google Play purchase.');
  const observedAt = Date.now(); const api = publisher();
  const existing = (await db.doc(`purchaseClaims/${providerKey('google_play', purchaseToken)}`).get()).data();
  if (existing && existing.ownerUid !== uid) fail('PURCHASE_OWNED', 'This purchase belongs to another account.', 409);
  if (existing && existing.productId !== productId) fail('INVALID_PRODUCT', 'Purchase product identity mismatch.', 409);
  if (existing?.supersededBy) return { id: existing.id, state: 'revoked' };
  const lifetime = existing ? existing.lifetime : productId === playProduct('lifetime');
  if (!existing && !lifetime && productId !== playProduct('monthly')) fail('INVALID_PRODUCT', 'Unrecognized Google Play product.');
  let data, plan, state, validUntil = null, acknowledged, orderId, paidAt;
  if (lifetime) {
    ({ data } = await api.purchases.products.get({ packageName: packageName(), productId, token: purchaseToken }));
    plan = 'lifetime';
    state = data.purchaseState === 0 ? 'active' : data.purchaseState === 2 ? 'pending' : 'revoked';
    acknowledged = data.acknowledgementState === 1; orderId = data.orderId || null; paidAt = Number(data.purchaseTimeMillis) || null;
    if (data.obfuscatedExternalAccountId !== hash(`play:${uid}`)) fail('ACCOUNT_BINDING_REQUIRED', 'Restore this purchase using its original application account.', 409);
  } else {
    ({ data } = await api.purchases.subscriptionsv2.get({ packageName: packageName(), token: purchaseToken }));
    if (data.externalAccountIdentifiers?.obfuscatedExternalAccountId !== hash(`play:${uid}`)) fail('ACCOUNT_BINDING_REQUIRED', 'Restore this purchase using its original application account.', 409);
    const line = data.lineItems?.filter(item => item.productId === productId).sort((a, b) => Date.parse(b.expiryTime) - Date.parse(a.expiryTime))[0];
    plan = existing?.basePlanId === line?.offerDetails?.basePlanId ? existing.plan : plans.find(candidate => candidate !== 'lifetime' && basePlan(candidate) === line?.offerDetails?.basePlanId);
    if (!line || !plan) fail('INVALID_PRODUCT', 'Unrecognized Google Play subscription base plan.');
    validUntil = Date.parse(line.expiryTime); if (!Number.isFinite(validUntil)) fail('INVALID_PURCHASE', 'Missing subscription expiry.', 502);
    const states = { SUBSCRIPTION_STATE_ACTIVE: 'active', SUBSCRIPTION_STATE_IN_GRACE_PERIOD: 'grace', SUBSCRIPTION_STATE_CANCELED: 'canceled_active', SUBSCRIPTION_STATE_PENDING: 'pending', SUBSCRIPTION_STATE_EXPIRED: 'expired', SUBSCRIPTION_STATE_ON_HOLD: 'expired', SUBSCRIPTION_STATE_PAUSED: 'expired', SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED: 'revoked' };
    state = states[data.subscriptionState]; if (!state) fail('INVALID_PURCHASE', 'Unrecognized subscription state.', 502);
    acknowledged = data.acknowledgementState === 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED'; orderId = data.latestOrderId || null;
    // startTime is subscription signup, not the latest renewal transaction time.
    paidAt = existing?.orderId === orderId ? existing.paidAt || null : null;
    if (data.linkedPurchaseToken) {
      const old = await db.doc(`purchaseClaims/${providerKey('google_play', data.linkedPurchaseToken)}`).get();
      if (old.exists && old.data().ownerUid !== uid) fail('PURCHASE_OWNED', 'The previous subscription belongs to another account.', 409);
      await claimPurchase(uid, { ...(old.exists ? old.data() : { provider: 'google_play', purchaseRef: data.linkedPurchaseToken, productId, plan, lifetime: false, validUntil: null, paidAt: null, acknowledged: false }), state: 'revoked', supersededBy: providerKey('google_play', purchaseToken), observedAt });
    }
  }
  const id = await claimPurchase(uid, { provider: 'google_play', purchaseRef: purchaseToken, productId, plan, basePlanId: lifetime ? null : data.lineItems?.find(item => item.productId === productId)?.offerDetails?.basePlanId || null, providerState: lifetime ? String(data.purchaseState) : data.subscriptionState, state, validUntil, lifetime, acknowledged, orderId, paidAt, observedAt });
  if (!acknowledged && ['active', 'grace', 'canceled_active'].includes(state)) {
    try {
      if (lifetime) await api.purchases.products.acknowledge({ packageName: packageName(), productId, token: purchaseToken, requestBody: {} });
      else await api.purchases.subscriptions.acknowledge({ packageName: packageName(), subscriptionId: productId, token: purchaseToken, requestBody: {} });
      await db.doc(`purchaseClaims/${id}`).update({ acknowledged: true, acknowledgementRetry: false });
    } catch {
      await db.doc(`purchaseClaims/${id}`).update({ acknowledgementRetry: true });
    }
  }
  return { id, state };
}
export async function handlePlayNotification(req) {
  const bearer = /^Bearer (.+)$/.exec(req.headers.authorization || '');
  if (!bearer) fail('INVALID_PUSH', 'Authentication required.', 401);
  const ticket = await new OAuth2Client().verifyIdToken({ idToken: bearer[1], audience: required('PLAY_PUSH_AUDIENCE') });
  const payload = ticket.getPayload();
  if (payload.email !== required('PLAY_PUSH_SERVICE_ACCOUNT') || !payload.email_verified) fail('INVALID_PUSH', 'Unrecognized push identity.', 403);
  if (req.body.subscription !== required('PLAY_PUBSUB_SUBSCRIPTION')) fail('INVALID_PUSH', 'Unrecognized subscription.', 403);
  const message = req.body.message;
  if (!message?.messageId || !message.data) fail('INVALID_PUSH', 'Missing notification.');
  const notification = JSON.parse(Buffer.from(message.data, 'base64').toString('utf8'));
  if (notification.packageName !== packageName()) fail('INVALID_PUSH', 'Package mismatch.', 403);
  const event = db.doc(`billingEvents/play_${hash(message.messageId)}`);
  if ((await event.get()).data()?.processedAt) return;
  await event.set({ receivedAt: Date.now(), type: 'play_notification' }, { merge: true });
  const token = notification.subscriptionNotification?.purchaseToken || notification.oneTimeProductNotification?.purchaseToken || notification.voidedPurchaseNotification?.purchaseToken;
  if (token) {
    const claim = await db.doc(`purchaseClaims/${providerKey('google_play', token)}`).get();
    if (claim.exists) await verifyPlayPurchase(claim.data().ownerUid, { purchaseToken: token, productId: claim.data().productId });
    // Unknown ownership is retained for later authenticated restore, never assigned by a notification.
  }
  await event.set({ processedAt: Date.now(), outcome: token ? 'reconciled_or_unclaimed' : 'notification_without_purchase' }, { merge: true });
}
export async function reconcilePlay(uid) {
  const claims = await db.collection('purchaseClaims').where('ownerUid', '==', uid).get();
  const failures = [];
  for (const doc of claims.docs) {
    const claim = doc.data();
    if (claim.provider !== 'google_play' || claim.supersededBy || claim.state === 'revoked') continue;
    // Expired subscription tokens eventually cease to be queryable. A new Play
    // purchase/RTDN is verified directly; historical terminal tokens cannot block it.
    if (claim.providerState === 'SUBSCRIPTION_STATE_EXPIRED' && claim.validUntil <= Date.now()) continue;
    try { await verifyPlayPurchase(uid, { purchaseToken: claim.purchaseRef, productId: claim.productId }); }
    catch (error) { failures.push(error); }
  }
  if (failures.length) throw failures[0];
}
