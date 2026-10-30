import { db, auth, required, httpsUrl, fail, hash, providerKey } from './core.js';
import { stripeClient, priceId, validatePrice, planForPrice } from './catalog.js';
import { account, claimPurchase, isAllowed, computeAccess } from './entitlements.js';

const objectId = value => typeof value === 'string' ? value : value?.id;
async function historicalPlan(uid, purchaseRef, price, metadata) {
  const existing = (await db.doc(`purchaseClaims/${providerKey('stripe', purchaseRef)}`).get()).data();
  let identity = existing;
  if (existing && existing.ownerUid !== uid) fail('PURCHASE_OWNED', 'Purchase account mismatch.', 409);
  if (!identity && /^[a-f0-9]{64}$/.test(metadata?.intentId || '')) {
    const intent = (await db.doc(`checkoutIntents/${metadata.intentId}`).get()).data();
    if (intent?.ownerUid === uid) identity = intent;
  }
  const plan = identity?.plan || planForPrice(price.id);
  if (identity?.priceId && identity.priceId !== price.id || identity?.productId && identity.productId !== objectId(price.product)) fail('PURCHASE_IDENTITY_CHANGED', 'The purchase catalog identity needs reconciliation.', 409);
  await validatePrice(plan, price, { forSale: false });
  return plan;
}
async function customerFor(uid) {
  const ref = db.doc(`billingAccounts/${uid}`); const existing = await ref.get();
  if (existing.data()?.stripeCustomerId) return existing.data().stripeCustomerId;
  const user = await auth.getUser(uid);
  const customer = await stripeClient().customers.create({ ...(user.email ? { email: user.email } : {}), metadata: { firebaseUid: uid } }, { idempotencyKey: `customer:${hash(uid)}` });
  await db.runTransaction(async tx => {
    const latest = await tx.get(ref);
    if (latest.data()?.stripeCustomerId && latest.data().stripeCustomerId !== customer.id) fail('CUSTOMER_CONFLICT', 'Account billing needs reconciliation.', 409);
    tx.set(ref, { stripeCustomerId: customer.id }, { merge: true });
  });
  return customer.id;
}
async function paidState(stripe, paymentIntent) {
  if (!paymentIntent) return { revoked: false, receiptUrl: null };
  const pi = await stripe.paymentIntents.retrieve(objectId(paymentIntent), { expand: ['latest_charge'] });
  const charge = pi.latest_charge;
  let disputed = false;
  if (charge?.disputed) {
    const disputes = await stripe.disputes.list({ payment_intent: pi.id, limit: 100 });
    disputed = disputes.data.some(d => !['won', 'warning_closed'].includes(d.status));
  }
  return { revoked: !!charge && (charge.refunded || disputed), receiptUrl: charge?.receipt_url || null, paymentSucceeded: pi.status === 'succeeded', paymentStatus: pi.status };
}
export async function reconcileStripePurchase(uid, purchase) {
  const stripe = stripeClient(); const observedAt = Date.now();
  let record;
  if (purchase.kind === 'subscription') {
    const sub = await stripe.subscriptions.retrieve(purchase.purchaseRef, { expand: ['latest_invoice'] });
    if (sub.metadata.firebaseUid !== uid) fail('PURCHASE_OWNED', 'Subscription account mismatch.', 409);
    const item = sub.items.data[0]; if (sub.items.data.length !== 1) fail('INVALID_PRODUCT', 'Unsupported subscription contents.', 502);
    const plan = await historicalPlan(uid, sub.id, item.price, sub.metadata);
    const invoice = typeof sub.latest_invoice === 'object' ? sub.latest_invoice : null;
    const payment = await paidState(stripe, invoice?.payment_intent);
    // A provider-settled invoice may use customer credits or be paid out of band
    // and have no card PaymentIntent. Stripe's paid coverage is authoritative.
    const paidCoverage = invoice?.status === 'paid' && invoice.amount_remaining === 0;
    let state = sub.status === 'active' && paidCoverage ? (sub.cancel_at_period_end ? 'canceled_active' : 'active') : ['active', 'incomplete'].includes(sub.status) ? 'pending' : 'expired';
    if (payment.revoked) state = 'revoked';
    record = { provider: 'stripe', kind: 'subscription', purchaseRef: sub.id, priceId: item.price.id, productId: objectId(item.price.product), plan, state, lifetime: false, validUntil: sub.current_period_end * 1000, paidAt: invoice?.status_transitions?.paid_at ? invoice.status_transitions.paid_at * 1000 : null, amount: invoice?.amount_paid ?? null, currency: invoice?.currency?.toUpperCase() || null, invoiceId: invoice?.id || null, settlement: invoice?.status === 'paid' ? (invoice.paid_out_of_band ? 'out_of_band' : invoice.payment_intent ? 'payment_intent' : 'invoice_settlement') : null, receiptUrl: payment.receiptUrl, observedAt };
  } else {
    const session = await stripe.checkout.sessions.retrieve(purchase.sessionId || purchase.purchaseRef, { expand: ['line_items'] });
    if (session.metadata.firebaseUid !== uid) fail('PURCHASE_OWNED', 'Purchase account mismatch.', 409);
    const item = session.line_items?.data[0];
    if (session.line_items?.data.length !== 1 || !item?.price) fail('INVALID_PRODUCT', 'Unsupported checkout contents.', 502);
    const plan = await historicalPlan(uid, session.id, item.price, session.metadata);
    if (plan !== 'lifetime') fail('INVALID_PRODUCT', 'Lifetime price required.', 502);
    const payment = await paidState(stripe, session.payment_intent);
    const failed = session.status === 'expired' || session.status === 'complete' && ['canceled', 'requires_payment_method'].includes(payment.paymentStatus);
    record = { provider: 'stripe', kind: 'payment', sessionId: session.id, purchaseRef: session.id, paymentIntentId: objectId(session.payment_intent) || null, priceId: item.price.id, productId: objectId(item.price.product), plan, state: payment.revoked ? 'revoked' : session.payment_status === 'paid' && payment.paymentSucceeded ? 'active' : failed ? 'expired' : 'pending', lifetime: true, validUntil: null, paidAt: session.payment_status === 'paid' ? session.created * 1000 : null, amount: session.amount_total, currency: session.currency?.toUpperCase() || null, invoiceId: objectId(session.invoice) || null, receiptUrl: payment.receiptUrl, observedAt };
  }
  await claimPurchase(uid, record);
}
export async function reconcileStripe(uid, { history = true } = {}) {
  const failures = [];
  const attempt = async work => { try { await work(); } catch (error) { failures.push(error); } };
  const claims = await db.collection('purchaseClaims').where('ownerUid', '==', uid).get();
  for (const doc of claims.docs) {
    const claim = doc.data();
    if (claim.provider === 'stripe' && !claim.supersededBy && !(claim.state === 'expired' && claim.validUntil && claim.validUntil < Date.now())) await attempt(() => reconcileStripePurchase(uid, claim));
  }
  const billing = await db.doc(`billingAccounts/${uid}`).get();
  if (billing.data()?.activeIntentId) await attempt(() => reconcileIntent(uid, billing.data().activeIntentId));
  const customer = billing.data()?.stripeCustomerId;
  if (!customer || !history) { if (failures.length) throw failures[0]; return; }
  const stripe = stripeClient();
  // Recovery is independent of webhook arrival order and the current intent.
  // Only this application's metadata-bound records are eligible for restoration.
  await attempt(async () => { for await (const sub of stripe.subscriptions.list({ customer, status: 'all', limit: 100 })) {
    if (sub.metadata.firebaseUid === uid && !['canceled', 'incomplete_expired'].includes(sub.status)) await attempt(() => reconcileStripePurchase(uid, { kind: 'subscription', purchaseRef: sub.id }));
  } });
  await attempt(async () => { for await (const session of stripe.checkout.sessions.list({ customer, limit: 100 })) {
    if (session.metadata?.firebaseUid !== uid) continue;
    if (session.mode === 'payment' && session.status !== 'expired') await attempt(() => reconcileStripePurchase(uid, { kind: 'payment', sessionId: session.id }));
    const intentId = session.metadata?.intentId;
    if (intentId && /^[a-f0-9]{64}$/.test(intentId)) {
      const ref = db.doc(`checkoutIntents/${intentId}`); const intent = (await ref.get()).data();
      if (intent?.ownerUid === uid && !intent.sessionId) await ref.update({ sessionId: session.id, url: session.url || null });
      if (intent?.ownerUid === uid) await attempt(() => reconcileIntent(uid, intentId));
    }
  } });
  // Backfill actual historical invoice documents, including missed renewal events.
  let historyIncomplete = false;
  try { for await (const invoice of stripe.invoices.list({ customer, limit: 100 })) {
    try { await recordInvoice(uid, invoice.id); } catch { historyIncomplete = true; }
  } } catch { historyIncomplete = true; }
  await db.doc(`billingAccounts/${uid}`).set({ historyIncomplete }, { merge: true });
  if (failures.length) throw failures[0];
}
async function reconcileIntent(uid, intentId) {
  const ref = db.doc(`checkoutIntents/${intentId}`); const doc = await ref.get(); const intent = doc.data();
  if (!intent || intent.ownerUid !== uid || !intent.sessionId) return intent;
  const session = await stripeClient().checkout.sessions.retrieve(intent.sessionId);
  if (session.status === 'complete') {
    if (session.subscription) await reconcileStripePurchase(uid, { kind: 'subscription', purchaseRef: objectId(session.subscription) });
    else await reconcileStripePurchase(uid, { kind: 'payment', sessionId: session.id });
  }
  let state = session.status === 'expired' ? 'expired' : session.status === 'complete' && session.payment_status === 'paid' ? 'completed' : 'pending';
  if (session.status === 'complete' && session.payment_status !== 'paid') {
    if (session.subscription) {
      const subscription = await stripeClient().subscriptions.retrieve(objectId(session.subscription));
      if (['canceled', 'incomplete_expired'].includes(subscription.status)) state = 'expired';
    } else {
      const payment = await paidState(stripeClient(), session.payment_intent);
      if (['canceled', 'requires_payment_method'].includes(payment.paymentStatus)) state = 'expired';
    }
  }
  await ref.update({ state, url: session.url || null, updatedAt: Date.now() });
  return { ...intent, state, url: session.url || null };
}
export async function createCheckout(uid, { plan, requestId }) {
  if (!/^[\w-]{16,100}$/.test(requestId || '')) fail('INVALID_REQUEST', 'A stable checkout request ID is required.');
  const stripe = stripeClient(); const price = await validatePrice(plan, await stripe.prices.retrieve(priceId(plan)));
  await reconcileStripe(uid, { history: false });
  const current = await account(uid);
  if (isAllowed(current.access)) fail('ALREADY_ACTIVE', 'Your account already has access.', 409);
  if (current.access.state === 'pending' && !current.billing.pendingCheckout) fail('PAYMENT_PENDING', 'Your existing payment is still pending. Refresh its status.', 409);
  const customer = await customerFor(uid); const billingRef = db.doc(`billingAccounts/${uid}`);
  const requestedId = hash(`${uid}:${requestId}`);
  const intentId = await db.runTransaction(async tx => {
    const billing = await tx.get(billingRef); const activeId = billing.data()?.activeIntentId;
    const active = activeId ? await tx.get(db.doc(`checkoutIntents/${activeId}`)) : null;
    // Conflict with the same user projection written by webhook fulfillment.
    await tx.get(db.doc(`users/${uid}`));
    const claims = await tx.get(db.collection('purchaseClaims').where('ownerUid', '==', uid));
    const access = computeAccess(claims.docs.map(doc => doc.data()));
    if (isAllowed(access)) fail('ALREADY_ACTIVE', 'Your account already has access.', 409);
    if (access.state === 'pending' && !(active?.exists && ['creating', 'pending'].includes(active.data().state))) fail('PAYMENT_PENDING', 'Your existing payment is still pending.', 409);
    if (active?.exists && ['creating', 'pending'].includes(active.data().state)) return activeId;
    const ref = db.doc(`checkoutIntents/${requestedId}`); const previous = await tx.get(ref);
    if (previous.exists) return requestedId;
    tx.create(ref, { ownerUid: uid, plan, priceId: price.id, productId: objectId(price.product), state: 'creating', createdAt: Date.now() });
    tx.set(billingRef, { activeIntentId: requestedId }, { merge: true }); return requestedId;
  });
  const ref = db.doc(`checkoutIntents/${intentId}`); const intent = (await ref.get()).data();
  if (intent.plan !== plan) fail('PAYMENT_PENDING', 'Continue the existing checkout before choosing another plan.', 409);
  if (intent.sessionId) {
    const fresh = await reconcileIntent(uid, intentId);
    if (fresh.state !== 'pending' || !fresh.url) fail('PAYMENT_PENDING', 'Refresh your account to see the payment status.', 409);
    return { url: fresh.url, intentId };
  }
  // Stripe retains idempotency keys for at least 24h; never recreate an ambiguous old request.
  if (Date.now() - intent.createdAt > 23 * 3600000) fail('PAYMENT_RECONCILIATION_REQUIRED', 'The previous checkout needs account reconciliation.', 409);
  const metadata = { firebaseUid: uid, intentId };
  const session = await stripe.checkout.sessions.create({ customer, mode: plan === 'lifetime' ? 'payment' : 'subscription', line_items: [{ price: intent.priceId, quantity: 1 }], success_url: httpsUrl('CHECKOUT_SUCCESS_URL'), cancel_url: httpsUrl('CHECKOUT_CANCEL_URL'), client_reference_id: uid, metadata, ...(plan === 'lifetime' ? { payment_intent_data: { metadata }, invoice_creation: { enabled: true } } : { subscription_data: { metadata } }) }, { idempotencyKey: `checkout:${intentId}` });
  await ref.update({ sessionId: session.id, state: 'pending', url: session.url, updatedAt: Date.now() });
  return { url: session.url, intentId };
}
export async function createPortal(uid) {
  const billing = await db.doc(`billingAccounts/${uid}`).get();
  if (!billing.data()?.stripeCustomerId) fail('NO_STRIPE_ACCOUNT', 'This account has no Stripe purchases.', 404);
  const portal = await stripeClient().billingPortal.sessions.create({ customer: billing.data().stripeCustomerId, return_url: httpsUrl('BILLING_RETURN_URL') });
  return { url: portal.url };
}
export async function getStripeDocument(purchase) {
  const stripe = stripeClient();
  if (purchase.invoiceId) {
    const invoice = await stripe.invoices.retrieve(purchase.invoiceId);
    if (invoice.hosted_invoice_url || invoice.invoice_pdf) return { url: invoice.hosted_invoice_url || invoice.invoice_pdf };
    const payment = await paidState(stripe, invoice.payment_intent);
    if (payment.receiptUrl) return { url: payment.receiptUrl };
    fail('DOCUMENT_PENDING', 'Your payment document is not available yet.', 409);
  }
  if (purchase.receiptUrl) return { url: purchase.receiptUrl };
  fail('DOCUMENT_PENDING', 'Your payment document is not available yet.', 409);
}
async function recordInvoice(uid, invoiceId) {
  const stripe = stripeClient(); const invoice = await stripe.invoices.retrieve(invoiceId);
  const billing = await db.doc(`billingAccounts/${uid}`).get();
  if (objectId(invoice.customer) !== billing.data()?.stripeCustomerId) fail('PURCHASE_OWNED', 'Invoice account mismatch.', 409);
  let purchaseRef = objectId(invoice.subscription);
  if (!purchaseRef && invoice.payment_intent) {
    const sessions = await stripe.checkout.sessions.list({ payment_intent: objectId(invoice.payment_intent), limit: 100 });
    purchaseRef = sessions.data.find(session => session.metadata?.firebaseUid === uid && objectId(session.customer) === objectId(invoice.customer))?.id;
  }
  if (!purchaseRef) return;
  const claimId = providerKey('stripe', purchaseRef);
  const claim = await db.doc(`purchaseClaims/${claimId}`).get();
  if (!claim.exists || claim.data().ownerUid !== uid) return;
  const payment = await paidState(stripe, invoice.payment_intent);
  const id = providerKey('stripe', invoice.id);
  await db.doc(`users/${uid}/purchases/${id}`).set({ id, claimId, invoiceId: invoice.id, receiptUrl: payment.receiptUrl, orderId: null, provider: 'stripe', plan: claim.data().plan, productId: claim.data().productId, status: payment.revoked ? 'revoked' : invoice.status === 'paid' ? 'paid' : invoice.status, paidAt: invoice.status_transitions?.paid_at ? new Date(invoice.status_transitions.paid_at * 1000).toISOString() : null, amount: invoice.amount_paid, currency: invoice.currency.toUpperCase(), documentAvailable: !!(invoice.hosted_invoice_url || invoice.invoice_pdf || payment.receiptUrl) });
}
export async function handleStripeWebhook(req) {
  const stripe = stripeClient(); let event;
  try { event = stripe.webhooks.constructEvent(req.rawBody, req.headers['stripe-signature'], required('STRIPE_WEBHOOK_SECRET')); }
  catch { fail('INVALID_SIGNATURE', 'Invalid webhook signature.', 400); }
  const ref = db.doc(`billingEvents/stripe_${event.id}`);
  if ((await ref.get()).data()?.processedAt) return;
  await ref.set({ receivedAt: Date.now(), type: event.type }, { merge: true });
  const relevant = /^(checkout\.session\.|invoice\.|customer\.subscription\.|charge\.refunded|charge\.dispute\.|radar\.early_fraud_warning\.)/.test(event.type);
  if (relevant) {
    let object = event.data.object; let customerId = objectId(object.customer);
    if (!customerId && object.charge) { object = await stripe.charges.retrieve(objectId(object.charge)); customerId = objectId(object.customer); }
    if (customerId) {
      const users = await db.collection('billingAccounts').where('stripeCustomerId', '==', customerId).get();
      for (const user of users.docs) {
        if (event.type.startsWith('checkout.session.')) {
          const session = await stripe.checkout.sessions.retrieve(event.data.object.id);
          if (session.subscription) await reconcileStripePurchase(user.id, { kind: 'subscription', purchaseRef: objectId(session.subscription) });
          else if (session.mode === 'payment') await reconcileStripePurchase(user.id, { kind: 'payment', sessionId: session.id });
        }
        await reconcileStripe(user.id);
        // Historical refunds change that transaction's history. Current access is
        // backed by the latest paid coverage invoice, not an older paid period.
        const invoiceId = event.type.startsWith('invoice.') ? event.data.object.id : objectId(object.invoice);
        if (invoiceId) await recordInvoice(user.id, invoiceId);
      }
    }
  }
  await ref.set({ processedAt: Date.now(), outcome: relevant ? 'provider_reconciled' : 'ignored_event_type' }, { merge: true });
}
