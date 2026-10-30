import Stripe from 'stripe';
import { required, fail } from './core.js';

export const plans = ['monthly', 'six_month', 'annual', 'lifetime'];
const suffix = { monthly: 'MONTHLY', six_month: 'SIX_MONTH', annual: 'ANNUAL', lifetime: 'LIFETIME' };
export const stripeClient = () => new Stripe(required('STRIPE_SECRET_KEY'), { apiVersion: '2025-02-24.acacia', maxNetworkRetries: 2 });
export const priceId = plan => required(`STRIPE_PRICE_${suffix[plan] || fail('INVALID_PLAN', 'Choose a supported plan.')}`);
export const playProduct = plan => required(plan === 'lifetime' ? 'PLAY_LIFETIME_PRODUCT_ID' : 'PLAY_SUBSCRIPTION_PRODUCT_ID');
export const basePlan = plan => plan === 'lifetime' ? null : required(`PLAY_BASE_PLAN_${suffix[plan]}`);
export function validateConfiguration() {
  for (const name of ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'CHECKOUT_SUCCESS_URL', 'CHECKOUT_CANCEL_URL', 'BILLING_RETURN_URL', 'ACCOUNT_AUTH_URL', 'BILLING_ALLOWED_ORIGINS', 'PLAY_PACKAGE_NAME', 'PLAY_PUSH_AUDIENCE', 'PLAY_PUSH_SERVICE_ACCOUNT', 'PLAY_PUBSUB_SUBSCRIPTION']) required(name);
  for (const plan of plans) { priceId(plan); playProduct(plan); basePlan(plan); }
  return true;
}
export async function validatePrice(plan, price) {
  const count = { monthly: 1, six_month: 6, annual: 12 }[plan];
  const months = price.recurring?.interval === 'year' ? price.recurring.interval_count * 12 : price.recurring?.interval === 'month' ? price.recurring.interval_count : null;
  if (!price.active || price.unit_amount == null || (plan === 'lifetime' ? price.type !== 'one_time' : price.type !== 'recurring' || months !== count)) fail('CATALOG_INVALID', `Provider price does not match ${plan}.`, 503);
  return price;
}
export async function loadCatalog(platform) {
  if (!['web', 'android'].includes(platform)) fail('INVALID_PLATFORM', 'Unsupported billing platform.');
  if (platform === 'android') return { offers: plans.map(plan => ({ plan, provider: 'google_play', productId: playProduct(plan), basePlanId: basePlan(plan), formattedPrice: null, currency: null, interval: plan })), playListingUrl: process.env.PLAY_LISTING_URL || null };
  const stripe = stripeClient();
  const offers = await Promise.all(plans.map(async plan => {
    const price = await validatePrice(plan, await stripe.prices.retrieve(priceId(plan), { expand: ['product'] }));
    const digits = new Intl.NumberFormat('en', { style: 'currency', currency: price.currency }).resolvedOptions().maximumFractionDigits;
    return { plan, provider: 'stripe', productId: typeof price.product === 'string' ? price.product : price.product.id, priceId: price.id, formattedPrice: new Intl.NumberFormat('en', { style: 'currency', currency: price.currency }).format(price.unit_amount / (10 ** digits)), currency: price.currency.toUpperCase(), interval: plan };
  }));
  return { offers, playListingUrl: process.env.PLAY_LISTING_URL || null };
}
export function planForPrice(id) { return plans.find(plan => priceId(plan) === id) || fail('CATALOG_INVALID', 'Unrecognized provider price.', 503); }
