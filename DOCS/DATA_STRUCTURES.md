# Squash billing data structures — implemented source and unfinished account work

Source inventory read on 2026-10-30 at repository HEAD `aac86ac2c0b4f6d09d4a6d21c1304948e2ac3ffa`. This document describes the current `functions/src` implementation, `firestore.rules`, `firebase.json`, and `firestore.indexes.json`. It does not assert that these collections exist in the selected live project or that this source has been deployed. No live records, credentials, builds, migrations or payment operations were inspected or changed for this inventory.

Scope is Squash only. The requested behavior is one Firebase Auth identity and one canonical user record, with Squash-owned data isolated from other product data. Example field names in earlier discussion are not adopted here as a schema. In particular, the literal example-derived account-field table currently in architecture §0.3 and the checklist must not be treated as an implemented or accepted storage contract. This document introduces no replacement field names.

## 1. Identity and value conventions already implemented

Firebase Auth supplies the canonical `uid`, email and display name. `identity()` verifies a Firebase ID token and uses its UID; clients do not choose an owner UID in purchase requests. `account()` reads the profile from Firebase Auth with `auth.getUser(uid)`. The backend does not currently copy email or display name into the Firestore user document and does not create an additional per-platform identity.

`hash(value)` is SHA-256 encoded as lowercase hexadecimal. `providerKey(provider, ref)` is SHA-256 of `provider + ':' + ref`. Current provider values are `stripe` and `google_play`; current plan values are `monthly`, `six_month`, `annual`, and `lifetime`.

Provider claims use epoch milliseconds for `validUntil`, `paidAt`, and `observedAt`. User access and purchase-history responses use ISO 8601 strings or null for dates. Money fields currently retain provider integer minor units and uppercase currency codes. Unknown Play payment amount/currency/date remains null; subscription signup time is not substituted for a renewal payment date.

The current IDs, hashes and query filters do **not** contain an application-product discriminator. A provider `productId` denotes a Stripe or Google catalog product, not an application namespace.

## 2. Current Firestore paths

| Actual path | Actual writer and purpose | Client access under current rules |
|---|---|---|
| `users/{uid}` | `claimPurchase()` merges the server access projection; clients may create/update `preferences` | Owner reads; owner writes only top-level `preferences`; no client deletion |
| `users/{uid}/purchases/{historyId}` | `claimPurchase()` and `recordInvoice()` write sanitized transaction history | Owner reads; no client writes |
| `billingAccounts/{uid}` | Stripe customer mapping, active checkout pointer and history completeness | Backend only |
| `purchaseClaims/{claimId}` | Verified provider ownership and entitlement records | Backend only |
| `checkoutIntents/{intentId}` | Durable Stripe checkout creation/resumption | Backend only |
| `billingEvents/{eventId}` | Provider notification receipt and processing markers | Backend only |
| `deviceAuthorizations/{id}` | Account-level system-browser/native sign-in handoff | Backend only |

These are the paths actually referenced by the source. There is currently no `products/...` namespace in the implementation.

### `users/{uid}`

The billing backend writes only an `access` map, using merge semantics:

| Field inside `access` | Type / current meaning |
|---|---|
| `state` | `none`, `pending`, `active`, `grace`, `canceled_active`, `expired`, or `revoked` |
| `provider` | Provider string or null |
| `plan` | Plan string or null |
| `validUntil` | ISO timestamp or null |
| `lifetime` | Boolean |
| `revision` | Incrementing numeric projection revision on accepted claim writes |
| `checkedAt` | ISO time when the projection was computed |

There is no implemented canonical product-specific paid Boolean. No product-specific detail field is written. `checking` and `error` are workflow/UI concepts; the current aggregate calculation does not persist them as user access states.

The projection combines **every** `purchaseClaims` record with this `ownerUid`, without an application-product filter. Valid active/grace/canceled records take priority, then pending, revoked, and expired history. Lifetime validity wins over finite validity. Superseded claims cannot grant. `isAllowed()` additionally checks expiry. Merely computing the account response does not persist the newly computed expiry projection.

`claimPurchase()` uses a Firestore transaction to verify ownership, reject an older `observedAt`, write the claim, update the projection/revision and write the corresponding history record. The transaction reads the user document as well as the owner's claims; checkout reservations also read them so concurrent fulfillment causes a transaction retry.

### `billingAccounts/{uid}`

Actual optional fields are `stripeCustomerId`, `activeIntentId`, and `historyIncomplete`.

There is no persisted Play account-binding field here. The Play binding returned to the client is computed as SHA-256 of `play:` plus the Firebase UID. This distinction matters because the architecture entity table currently describes a stored binding which the implementation does not write.

### `purchaseClaims/{claimId}`

`claimId = providerKey(provider, purchaseRef)`. For Stripe subscriptions, `purchaseRef` is the subscription ID. For Stripe lifetime purchases, it is the stable Checkout Session ID, including before a PaymentIntent exists. For Play, it is the purchase token. Tokens remain in this backend-only collection, not in the user-readable history.

Common fields: `id`, `ownerUid`, `provider`, `purchaseRef`, `productId`, `plan`, `state`, `validUntil`, `lifetime`, `paidAt`, and `observedAt`. Provider-specific fields are optional:

| Provider/type | Additional actual fields |
|---|---|
| Stripe subscription | `kind: subscription`, `priceId`, `amount`, `currency`, `invoiceId`, `settlement`, `receiptUrl` |
| Stripe lifetime | `kind: payment`, `sessionId`, `paymentIntentId`, `priceId`, `amount`, `currency`, `invoiceId`, `receiptUrl` |
| Google Play | `basePlanId`, `providerState`, `acknowledged`, `acknowledgementRetry`, `orderId` |
| Replaced Play token | `supersededBy`, referring to the replacement claim hash |

The owner UID is immutable: a second UID cannot claim an existing provider reference. Historical Stripe validation uses the stored claim/checkout-intent product, price and plan identity, so archiving a sale price does not invalidate an existing purchase. Play stores base-plan identity for the same purpose. Provider notifications re-query actual provider state before applying access changes.

### `users/{uid}/purchases/{historyId}`

`historyId = providerKey(provider, invoiceId || orderId || purchaseRef)`. Each observed invoice/order has its own record; later reconciliation updates that transaction's status rather than creating a fictitious new receipt.

Actual fields: `id`, `claimId`, `invoiceId`, `receiptUrl`, `orderId`, `provider`, `plan`, `productId`, `status`, `paidAt`, `amount`, `currency`, and `documentAvailable`. `recordInvoice()` uses invoice states such as `paid`, while `claimPurchase()` uses entitlement states such as `active`; `status` is therefore not currently a single normalized enum across all writers.

No application `product` discriminator is written. `/account` returns the entire user purchase subcollection without product filtering. `/purchases/:id/document` first reads the requested user's history record, then verifies the associated claim owner. It resolves the selected invoice's document/receipt; it does not substitute a later subscription receipt. Google documents open Google's payment history.

### `checkoutIntents/{intentId}`

`intentId = SHA256(uid + ':' + requestId)`. Actual fields are `ownerUid`, `plan`, `priceId`, `productId`, `state`, `createdAt`, and, after provider creation, `sessionId`, `url`, and `updatedAt`.

States written are `creating`, `pending`, `completed`, and `expired`. The account's active-intent pointer prevents a second checkout while one is creating or pending. Stripe creation uses idempotency key `checkout:{intentId}`. A creating intent older than 23 hours is held for reconciliation instead of blindly reissued. A completed unpaid asynchronous payment remains pending unless provider state confirms failure.

Neither this intent ID nor Stripe metadata `{firebaseUid, intentId}` currently includes application-product scope. The Stripe customer creation idempotency key is `customer:{SHA256(uid)}`.

### `billingEvents/{eventId}`

Stripe IDs use `stripe_` plus the Stripe event ID. Play IDs use `play_` plus SHA-256 of the Pub/Sub message ID. Records contain `receivedAt`, `type`, `processedAt` and `outcome` as processing progresses. There is no application-product field or namespace. A processed marker suppresses repeat handling; notification signatures/identity and current provider objects are verified before completion is recorded.

### `deviceAuthorizations/{id}`

`id` and the client secret each originate from 32 random bytes encoded as base64url. Stored fields are `secretHash`, `expiresAt`, `approvedUid`, and `consumedAt`. The browser receives the request ID but not the secret. An authenticated browser approval binds the UID; exchange validates the secret and atomically consumes the request before issuing a Firebase custom token. Expiry is five minutes. No cleanup/TTL field override is currently configured in `firestore.indexes.json`.

This remains account-level identity handoff, not a second user account or purchase entitlement.

## 3. Current response structures are not additional stored accounts

`GET /account`, successful restore and Play verification return:

| Response member | Current contents |
|---|---|
| `profile` | Auth-derived `uid`, `email`, `displayName` |
| `access` | Recomputed aggregate described above |
| `billing` | Derived `playObfuscatedAccountId`, `pendingCheckout`, `manageUrl`, persisted `historyIncomplete`, and sometimes reconciliation status |
| `purchases` | Sanitized history records |

`billing.pendingCheckout` is null or `{intentId, provider, plan, state, url, createdAt}`. A durable pending intent makes unresolved account access pending; independently valid access wins. `billing.manageUrl` is a server-derived Google subscription URL or null. Stripe management creates a fresh portal session. `billing.reconciliationIncomplete` can appear when an independent purchase was freshly verified despite another reconciliation failure.

`POST /match-access` currently returns `{allowed, access}`. Admission checks provider-refreshed validity; it does not read a canonical product-specific Boolean. Errors return `{error:{code,message}}`, not a false paid flag. The UI and backend still consume this response contract.

## 4. Exact differences from the requested account behavior

| Area | Current source | Unfinished requirement / contradiction |
|---|---|---|
| Canonical identity | One Firebase UID is already used; no per-platform user record is created | Keep this identity, do not add account linking or duplicate identities merely to scope billing |
| User validity | Writes generic `users/{uid}.access`; reads all owner claims | Squash must write/read only its product-owned part of the single canonical user record, preserving unrelated fields; exact final field names are not established by this document |
| Earlier example-derived specification | Architecture §0.3 and the checklist currently name literal example-derived account fields | Those names were rejected by the operator; correct those documents before treating them as a coder contract. Do not implement unrelated product balances |
| Private bookkeeping | Four global top-level billing collections | Architecture currently proposes `products/squash` bookkeeping paths, but none are implemented. Product isolation must cover every write/read/query and event/intent key together |
| Entitlement aggregation | Queries by `ownerUid` alone | A shared database could combine unrelated purchases unless the query/path itself scopes Squash |
| Public purchase history | User-owned history, no application discriminator, unfiltered list | Preserve ownership and distinguish/filter Squash transactions; provider product IDs alone are insufficient |
| API and admission | Returns and consumes generic `access` | API, UI and match admission must consume the final product-specific canonical record consistently; unknown verification is not false validity |
| Shared project rules | Owner user read/preferences write; all other paths denied | This single-application rules file has not been merged with actual shared-project rules. Deploying it as-is could disable unrelated application access |
| Reconciliation job | Pages every document in global `users` | Scope work to actual Squash billing membership, rather than assuming every account is a Squash customer |
| Live schema | Only source inspected for this inventory | No deployed collection shape, existing-data migration or shared-rule compatibility has been verified |

## 5. Minimal recommended correction sequence

1. Correct architecture/checklist wording to the operator's one-UID, product-owned-data requirement, removing rejected example-derived field commitments and unrelated product work. Establish the actual Squash field/path contract from the configured account schema rather than inventing a new one.
2. Centralize the selected Squash path references and product discriminator in the backend, then change all claim/customer/intent/event/history readers and writers together. Keep the canonical Firebase UID unchanged and preserve transaction ownership and idempotency relationships.
3. Atomically update only the final Squash-owned canonical validity/detail fields from verified provider state. Keep pending, verification error and paid-through cancellation distinct. Filter account history and reconciliation to Squash. Update response consumers and management/document routes in the same correction.
4. Inspect the selected project's existing user records and rules before migration or deployment. Preserve unrelated fields and rules; reconcile only verified Squash records. Do not create balances, duplicate user identities or infer ownership from matching email.
5. Review the complete resulting schema and customer journey, publish the correction through the supervising agent, and retain real purchase/restore/cancel/document/admission observation as unfinished until the real activation prerequisites are satisfied. The operator has authorized builds through `build_all.sh`; that prescribed build entry point supersedes the earlier build stop.

This inventory is documentation only. It does not migrate the current global collections, implement canonical product-specific fields, or mark the billing delivery complete.
