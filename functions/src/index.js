import { onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import { db, identity, required, fail } from './core.js';
import { loadCatalog } from './catalog.js';
import { account, ownedPurchase, isAllowed } from './entitlements.js';
import { createCheckout, createPortal, getStripeDocument, handleStripeWebhook, reconcileStripe } from './stripe.js';
import { verifyPlayPurchase, handlePlayNotification, reconcilePlay } from './play.js';
import { startDeviceAuthorization, approveDeviceAuthorization, exchangeDeviceAuthorization } from './device-auth.js';

export async function reconcilePurchases(uid) { await reconcileStripe(uid); await reconcilePlay(uid); return account(uid); }

export const billingApi = onRequest({ region: 'us-central1', timeoutSeconds: 120, memory: '256MiB' }, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const origin = req.headers.origin;
    if (origin) {
      const origins = required('BILLING_ALLOWED_ORIGINS').split(',').map(s => s.trim());
      if (!origins.includes(origin)) fail('ORIGIN_REJECTED', 'This application origin is not configured.', 403);
      res.set('Access-Control-Allow-Origin', origin); res.set('Vary', 'Origin');
      res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type'); res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    }
    if (req.method === 'OPTIONS') { res.status(204).end(); return; }
    const path = req.path.replace(/\/$/, '') || '/'; const route = `${req.method} ${path}`;
    if (route === 'POST /webhooks/stripe') { await handleStripeWebhook(req); res.json({ received: true }); return; }
    if (route === 'POST /webhooks/play') { await handlePlayNotification(req); res.json({ received: true }); return; }
    if (route === 'GET /catalog') { res.json(await loadCatalog(req.query.platform || 'web')); return; }
    if (route === 'POST /device/start') { res.json(await startDeviceAuthorization()); return; }
    if (route === 'POST /device/exchange') { res.json(await exchangeDeviceAuthorization(req.body?.id, req.body?.secret)); return; }
    const user = await identity(req); const uid = user.uid;
    let result;
    switch (route) {
      case 'GET /account': result = await account(uid); break;
      case 'POST /checkout':
        // Reconcile all providers before creating a different provider's checkout.
        await reconcilePlay(uid); result = await createCheckout(uid, req.body || {}); break;
      case 'POST /portal': result = await createPortal(uid); break;
      case 'POST /restore': result = await reconcilePurchases(uid); break;
      case 'POST /play/verify': await verifyPlayPurchase(uid, req.body || {}); result = await account(uid); break;
      case 'POST /match-access': { const current = await reconcilePurchases(uid); result = { allowed: isAllowed(current.access), access: current.access }; break; }
      case 'POST /device/approve': result = await approveDeviceAuthorization(uid, req.body?.id); break;
      default: {
        const document = /^\/purchases\/([a-f0-9]{64})\/document$/.exec(path);
        if (req.method !== 'GET' || !document) fail('NOT_FOUND', 'Endpoint not found.', 404);
        const history = await db.doc(`users/${uid}/purchases/${document[1]}`).get();
        if (!history.exists || !history.data().documentAvailable) fail('DOCUMENT_PENDING', 'Your payment document is not available yet.', 409);
        const purchase = await ownedPurchase(uid, history.data().claimId);
        purchase.invoiceId = history.data().invoiceId || null;
        result = purchase.provider === 'stripe' ? await getStripeDocument(purchase) : { url: 'https://payments.google.com/payments/u/0/home#activity' };
      }
    }
    res.json(result);
  } catch (error) {
    const status = error.status || 502;
    // Do not emit payment tokens, request bodies, provider errors or credentials.
    logger.warn('Billing request did not complete', { code: error.code || 'PROVIDER_ERROR', status });
    res.status(status).json({ error: { code: error.code || 'PROVIDER_ERROR', message: error.status ? error.message : 'Your account could not be verified. Retry without purchasing again.' } });
  }
});

export const reconcileBilling = onSchedule({ schedule: 'every 30 minutes', region: 'us-central1', timeoutSeconds: 540, memory: '256MiB' }, async () => {
  // Page the server-owned user ledger; every failed owner is retried next run.
  let cursor = null;
  for (;;) {
    let query = db.collection('users').orderBy('__name__').limit(100);
    if (cursor) query = query.startAfter(cursor);
    const page = await query.get(); if (page.empty) break;
    for (const user of page.docs) {
      try { await reconcilePurchases(user.id); }
      catch { logger.warn('Scheduled billing reconciliation needs retry', { accountRef: user.id }); }
    }
    cursor = page.docs.at(-1);
  }
});
