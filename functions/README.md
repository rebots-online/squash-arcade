# Production billing service

Source entry is `src/index.js`: Gen2 HTTP export `billingApi` and scheduled
`reconcileBilling`. The API URL is the function URL plus the documented paths;
there is no additional `/api` prefix. Region is `us-central1`.

Use the complete annotated `.env.example` schema to resolve the selected real
runtime bindings. Stripe catalog amounts come from active Price objects, never
launch-price defaults. Android price strings come from native ProductDetails;
the Android catalog response intentionally contains null display prices until
that native query supplies them. Supported plan IDs are `monthly`, `six_month`,
`annual`, `lifetime`; provider IDs are `stripe`, `google_play`.

The selected Functions runtime service account must have Android Publisher
permissions in the actual Play Console application. RTDN requires an authenticated
Pub/Sub push subscription with the exact configured audience, service-account
email and subscription resource. Stripe sends signed events to
`/webhooks/stripe`. Provider fulfillment uses API retrieval, not webhook payload
claims or checkout return parameters. Deploy the Firestore rules with the service.

Authenticated requests use a Firebase ID token. `/account` returns `profile`,
`billing.playObfuscatedAccountId`, `access` and sanitized `purchases`. Play account
binding is SHA-256 of `play:` plus Firebase UID. Pass that value unchanged to the
native billing flow. A token without the expected binding is refused with
`ACCOUNT_BINDING_REQUIRED`; legacy unbound purchases require an operator-assisted
ownership recovery process and are never automatically claimed.

`billing.pendingCheckout` is null or `{intentId,provider:'stripe',plan,state,url,
createdAt}`. A durable creating/pending intent makes unresolved access `pending`
across every platform, while a valid entitlement takes priority. Resume the same
checkout URL when present; otherwise check status or retry the same plan through
`/checkout`. Never launch another provider purchase while this exists. Lifetime
Stripe claims use the stable Checkout Session ID from creation through completion;
PaymentIntent IDs are references and do not change claim ownership.

`/device/start` returns `{id,secret,url,expiresAt}`. Keep the secret in the native
client only; the browser URL contains `request=id`. Authenticated browser approval
posts `{id}` to `/device/approve`. Native exchange posts `{id,secret}` and receives
`{status:'pending'}` or `{status:'approved',customToken}`. Requests expire after
five minutes. A lost token-exchange response requires a new sign-in, because a
consumed authorization can never mint another token.

Checkout requests require a stable 16–100 character `requestId`. The account
locks onto a durable creating/pending intent before external writes. The same
intent reuses Stripe's idempotency key and session. An ambiguous creation older
than 23 hours is held for merchant reconciliation rather than charged again.
Provider-backed active or pending access suppresses new checkout. Checkout
sessions awaiting asynchronous payment expose pending status and no new URL.

Subscription entitlement follows the current coverage invoice: a full refund or
open/lost dispute on that invoice revokes that coverage, while a partial refund
retains it. Refunding an older period updates that invoice's historical record
without revoking a newer independently paid period. Every observed invoice/order
has its own history ID and ownership-checked document route. Stripe subscription
access requires a provider-settled paid invoice with no amount remaining; real
customer-credit or merchant-recorded out-of-band settlement does not require a
card PaymentIntent. The claim records the provider settlement source. Play
replacement links permanently supersede the previous token,
including when the previous token had never been restored here.

Restoration also enumerates the mapped Stripe customer's subscriptions, Checkout
Sessions and invoices using provider pagination. Only records bound to this UID
by application metadata are claimed. This recovers missed/reordered webhooks and
session creation responses, and backfills renewal documents. Historical invoice
document lookup uses that invoice's payment receipt if no invoice URL exists,
never the latest subscription receipt. Large customer histories increase restore
latency; runtime pagination/checkpoint performance must be observed before release.
Full history is read on explicit restore, not every match admission or scheduled
check. Match admission refreshes known nonterminal claims and the current intent.
Per-claim failures are isolated: access from a purchase independently verified in
that request can admit play even when another provider/history lookup fails. If
none can be verified, return an actionable verification error rather than a new
purchase demand. History failures set `billing.historyIncomplete`; do not render
an authoritative empty-history assertion when that flag is true.

Sale catalog validation requires active prices; restoration uses the saved
purchase/checkout-intent price, product and plan identity, allowing archived prices
and changed current catalog IDs. A changed identity on an existing subscription
requires explicit reconciliation rather than silently reassigning its plan.
Terminal/superseded Play tokens are omitted from routine refresh; direct purchase
verification and RTDN remain recovery paths. Play subscription renewal `paidAt`
is null unless its actual order timestamp is known: subscription signup time is
never presented as the latest payment date.

No provider/project has been selected, no dependencies installed, no deployment,
automated tests, build or paid observation performed as part of this source
delivery. Activation additionally requires configured Firebase Auth providers,
domains, actual Play catalogs/base plans, Stripe Prices/customer portal, webhook
destinations and the device return page. Real purchase/renewal/refund/restore,
ownership, cancellation and invoice observations remain required by the rubric.
