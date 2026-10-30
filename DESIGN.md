# Virtual Squash — purchase and account design

Scope: BILL-01, governed by DOCS/ARCHITECTURE.md §0. This is a scoped account surface inside the existing arcade. The animated court, game colors and game logo remain the product backdrop. Financial decisions receive a quiet, legible surface. Density 4/10, variance 4/10, motion 2/10. The architecture's restrained financial motion overrides the Stitch skill's decorative perpetual-motion baseline.

## Editable design evidence

Figma file: https://www.figma.com/design/QotfEXkcNAg4dBllelZ1qw

- Wrapper 3:135: BILL-01 account design contract.
- Desktop signed-out account 3:136, width 1024px.
- Mobile authoritative empty receipts 3:152, width 390px.
- Desktop purchase catalog loading 3:165, width 1024px.
- Figma session: 2c0e3fc2-fd48-4d2d-93df-eb0f28e0d9c1.

The file contains editable text, auto-layout frames and a reusable Simple Design System Restore button instance (component set key cc8b558dc7d9684011b6b99ce8e6509399bc836b). Revised structural readback: 32 frames, 43 text nodes and 1 instance. All editable text is Geist. One image node, 4:55, contains the exact Google pre-approved light rectangular sign-in button, aspect-fitted within a189x44px target. The asset was obtained from Google's official signin-assets.zip, uploaded to Figma, then downloaded from the design context into public/assets/google-sign-in.png; it must be used unchanged with object-fit:contain. Branding authority: https://developers.google.com/identity/branding-guidelines. Design context with screenshots was obtained using figma-design-to-code for every revised screen before implementation. Mobile wrapping, action sizing, product identity, discrete Close/navigation controls and email authentication were corrected after supervisory review. The library's React `primitives` Button mapping has no matching module in this vanilla DOM game; implement equivalent semantics with native HTML buttons and scoped CSS, without adding another UI framework.

The receipt empty state describes a real runtime condition: it appears only after the server successfully returns no purchases. It is not evidence that a real customer's record was queried. No fictional customer, price, transaction or entitlement appears in the design. The catalog loading rows are noninteractive until actual provider offers arrive. Active-account and receipt data are governed by the bindings below, not invented design samples.

## Atmosphere and color

Slate Night #0f172a is the dialog surface. Slate Raised #1e293b is a selected row or secondary action. Slate Border #475569 separates groups. Slate Ink #f8fafc is primary text; Slate Soft #cbd5e1 is supporting text. Arcade Gold #d4b46a is the single accent, reserved for primary action fill, selection and links; dark text sits on gold. Backdrop #020617 at 76% opacity separates the court. No glow, gradients, pure black, purple, neon or decorative payment confetti. Errors use text, icon-free border emphasis and explicit recovery copy; meaning never depends on color.

## Typography and layout

Use locally bundled Geist Variable, sans-serif, with Geist Mono Variable for selectable order identifiers. Heading 36px desktop / 28px mobile, weight600, tight tracking; body16px, leading1.45; supporting copy14px. Never force text heights: wrap and let content determine height. Max reading width65ch. Minimum control size44px, primary48px. Gaps8/12/16/20/28/32px. Financial text is selectable despite the game-wide user-select:none rule.

Desktop dialog width min(64rem, viewport minus32px), maximum90dvh, internal overflow scroll. At widths below768px use one column and a full-height sheet using100dvh with safe-area padding. Header has VIRTUAL SQUASH and a separate44px Close button aligned right. Three real navigation buttons, Purchase / Account / Receipts, sit below; selection uses the gold underline shown in the revised Figma frames. Keep header and navigation reachable while content scrolls. Do not use three promotional cards or overlapping positioned content.

## Discoverability and game ownership

Persistent text Account button sits beside the existing top-right menu button. Account & purchases is also a menu action. Start Match stays prominent; known no-access changes its action to Get access to play. Unresolved ownership shows Checking access with a bounded retry path. A failed network request never becomes an assertion that the user has no access.

Use native HTML dialog/showModal so sound controls and z-index9000 game overlays cannot cover payment/account UI. Close existing briefing, pause game input and automatic briefing, then focus the dialog. Escape closes it, focus returns to its invoker. Opening an external provider leaves the account dialog visible with pending/checking status. Modal pause must participate in the engine's computed pause state, and capture-phase replay/game keys must respect the dialog. No keyboard shortcut starts a match under the dialog. AI showcase and instructions stay free; server admission protects human-match start, and an admitted current match may finish.

## Purchase

Title: Your next match starts here. Supporting copy: One account. Full match access across your devices. Render four vertically stacked native radio rows from catalog: Monthly, 6 months, Annual, Lifetime. Each real provider offer supplies localized formattedPrice and its actual renewal period. Lifetime says one-time purchase, never subscription. No fallback price or marketing saving is displayed. Missing catalog exposes Retry, with no enabled checkout action. During load show structural skeletons and a concise loading status, without invented prices.

Before purchase authenticate with Google, then re-query account to prevent duplicate payment. One primary action: Continue with Google Play on native Android, Continue to checkout on web/desktop. Show the selected provider price and renewal terms next to that action. Restore purchases stays reachable. Active, pending, unresolved or returning-checkout states suppress a new checkout until reconciliation resolves ownership. A canceled sheet returns to selection without claiming failure or success. A submitted/pending payment stays pending until server verification.

Secondary Use Google Play balance explains redemption through Google Play and purchase in the Android app with the same account, followed by restore here. Show a Play listing link only when the backend supplies the actual configured listing. Never collect gift-card codes; never imply Stripe accepts Google Play balance or that a PWA is native Play Billing.

## Account and receipts

Signed-out account title: Your game. Your account. Labeled empty Email and Password fields support Sign in, Create account and Reset password through Firebase Auth. Their max width450px becomes100% on mobile. Primary Sign in is gold; create/reset are neutral. The official Sign in with Google button provides the alternate identity route. Explain cross-platform ownership; Restore remains accessible and requests sign-in as necessary. Native sign-in uses the system browser and one-use device approval, with cancel and five-minute expiry; the hosted page offers both email and Google routes and native exchanges the approved one-use code. Web uses Firebase Auth directly. Password reset confirmation reflects successful SDK request; never invent sign-in success.

Signed-in account binds real profile.email/displayName, access.provider/plan/state/validUntil/lifetime. Active renewal, canceled-but-valid access, grace, expired, revoked, pending and checking/error are distinct text states. Do not invent a renewal date from expiry if the API does not provide renewal information. Actions: Refresh access, Restore purchases, Manage subscription, Receipts, Sign out. Lifetime has no cancel action. Managing opens the owning provider's portal; returning refreshes authoritative state. Cancellation retains access through the verified expiry.

Receipts is a list with date, plan, provider, amount and document action only when real returned data exists. Missing amount/date is omitted, not zeroed. Stripe documents use the authorized server document endpoint; Google Play uses purchase history. Order IDs remain selectable. A failed query shows Retry, never No purchases yet. No document URL is fabricated. The authoritative empty state uses the exact inspected mobile composition.

## Motion, recovery and acceptance

Optional160ms opacity transition and1px tactile button press; honor prefers-reduced-motion. No looping decoration in financial screens. Live status uses polite announcements and aria-busy. Pending operations disable duplicate submission but retain close/navigation. Restore, receipt and portal errors remain inline and actionable without discarding valid access. Returning from external browser refreshes state; sign-out clears the local account view and ownership.

Implementation must meet BILL-01 rubric in DOCS/TEST_RUBRIC.md. Design source/context is not runtime proof. Builds, tests, signing and deployment remain stopped by the operator. Live provider activation and continuous cross-platform purchase evidence require the configured real Firebase, Stripe and Play bindings.
