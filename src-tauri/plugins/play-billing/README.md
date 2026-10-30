# Virtual Squash Google Play bridge

This local Tauri plugin is registered in the app's Cargo dependencies and plugin
builder. Its build script declares the Android library so Tauri includes the
Kotlin project in generated Android projects. Tauri 2.11.3's `webview/mod.rs`
routes plugin commands not handled in Rust to registered mobile methods after
ACL validation; this is also the official barcode-scanner plugin's pattern.
Do not hand-edit generated Gradle
output. Android uses Google Play Billing Library 9.1.0. Ordinary desktop builds
only expose native platform identity and use the app's Stripe route.

The JavaScript wrapper in `src/account/native-billing.js` exposes:

- `isNativeAndroid()` resolves from the native OS command; Android browser/PWA is false.
- `queryPlayProducts(offers)` returns actual localized Play catalog rows. Input is
  the backend catalog's `plan`, `productId`, `basePlanId`, and optionally a lifetime
  `purchaseOptionId`. Only the configured base plans without promotional offers
  are sold. No local price fallback is supplied.
- `listenPlayPurchases(callback)` returns an async unsubscribe function. Register
  before querying purchases and retain the listener for the authenticated session.
- `queryPlayPurchases()` reads subscription and non-consumable ownership, including
  pending/suspended subscriptions. Run on account sign-in and explicit restoration.
  Native load/resume also queries and emits `purchases` events.
- `purchasePlayOffer(offer, account.billing.playObfuscatedAccountId)` re-queries
  ownership and fresh ProductDetails before opening the sheet, rejects simultaneous
  or pending purchase attempts and changed prices, and passes the server-derived
  account hash. Before this call the account controller verifies all purchased
  tokens and refreshes server access to prevent duplicate cross-provider purchases;
  native PURCHASED evidence alone cannot distinguish suspended/expired access.

Events contain `status` (`purchased`, `pending`, `canceled`, `error`, `restored`),
`code`, and `purchases`. Each purchase contains `purchaseToken`, `products`, `state`,
`acknowledged`, and `suspended`. Tokens must not be logged or persisted in frontend
storage. Send each `state === 'purchased'` product/token to authenticated
`POST /play/verify`. A local PURCHASED state never grants access, including for
suspended subscriptions: only the server projection does. Pending is not paid.
Do not acknowledge or consume on the device; backend fulfillment acknowledges
after durable ownership, and lifetime is never consumed. Server restoration and
reconciliation cover expired/revoked purchases absent from the device query.

Activation requires the real Play catalog/base plans, package/store track,
publisher/RTDN configuration, Firebase account/backend bindings, and an authorized
production-signed Play-installed artifact. No signing configuration or key is
contained here. Build/sign/deploy are currently stopped by the operator; this
source has not been compiled or exercised on a device, and source review does not
establish Play acceptance.

Reference contracts:

- https://v2.tauri.app/develop/plugins/develop-mobile/
- https://developer.android.com/google/play/billing/integrate
- https://developer.android.com/google/play/billing/migrate-gpblv9
- https://developer.android.com/google/play/billing/security
