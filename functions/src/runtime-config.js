export const BILLING_CONFIG_SECRET = 'SQUASH_ARCADE_BILLING_CONFIG';
export const runtimeBindings = [
  'FIRESTORE_DATABASE_ID', 'SQUASH_PRODUCT_ID', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_MONTHLY', 'STRIPE_PRICE_SIX_MONTH', 'STRIPE_PRICE_ANNUAL', 'STRIPE_PRICE_LIFETIME',
  'CHECKOUT_SUCCESS_URL', 'CHECKOUT_CANCEL_URL', 'BILLING_RETURN_URL', 'ACCOUNT_AUTH_URL',
  'BILLING_ALLOWED_ORIGINS', 'PLAY_PACKAGE_NAME', 'PLAY_SUBSCRIPTION_PRODUCT_ID',
  'PLAY_BASE_PLAN_MONTHLY', 'PLAY_BASE_PLAN_SIX_MONTH', 'PLAY_BASE_PLAN_ANNUAL',
  'PLAY_LIFETIME_PRODUCT_ID', 'PLAY_PUSH_AUDIENCE', 'PLAY_PUSH_SERVICE_ACCOUNT', 'PLAY_PUBSUB_SUBSCRIPTION'
];
export const optionalRuntimeBindings = ['PLAY_LISTING_URL'];
let parsed;
export function runtimeValue(name) {
  const injected = process.env[BILLING_CONFIG_SECRET];
  if (injected !== undefined) {
    if (!parsed) {
      try {
        parsed = JSON.parse(injected);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
      } catch { throw Object.assign(new Error(`Invalid runtime binding: ${BILLING_CONFIG_SECRET}`), { code: 'CONFIGURATION_INVALID', status: 503 }); }
    }
    // When a config secret is injected, it is authoritative. Missing keys must
    // not silently pick up an obsolete environment variable from another deploy.
    return Object.hasOwn(parsed, name) ? parsed[name] : undefined;
  }
  return process.env[name];
}
