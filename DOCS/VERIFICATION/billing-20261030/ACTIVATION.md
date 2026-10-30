# BILL-01 activation evidence — 2026-10-30

## Canonical Android signing recovery

The exact previously operator-authorized Admin-Manual recovery file was present at the declared Windows UNC path. No filesystem search or WSL launch was used. scripts/recover-android-signing.ps1, published at 8b5c2b9, verified the existing organization keystore using keytool, restored the missing canonical CREDENTIALS/prefetch-android-signing.md in admin-manual, and verified exact content plus all five normalized bindings by readback. Internal live configuration now contains quoted pointers to this canonical document; ordinary builds resolve it from KStore.

Verified public certificate SHA-256: 56:C1:36:74:EF:22:DF:95:DE:B1:E5:C4:68:82:0E:8C:FA:3E:A2:F5:22:51:17:49:AB:7B:6E:5B:DE:3B:D9:43. This verifies the existing key, not a newly built APK/AAB. No replacement key, credential rotation or artifact signing occurred in recovery.

## Firebase configuration actually observed and applied

Selected project: rochemediaservices-infra. Google sign-in was already enabled. Email/password sign-in was enabled and read back. Added the three actual application domains to the existing authorized-domain set, preserving its previous entries: squash.robin.mba, squash-arcade.robin.mba, squash-arcade.surge.sh. This is configuration evidence, not successful end-user login evidence.

The required Secret Manager API was enabled through serviceusage; its operation completed. A bounded metadata-only query for declared Stripe/Squash secret names then returned HTTP200, no matching resources and no continuation token. No arbitrary secret values were fetched. The Stripe connector still reported reauthentication required; the inspected browser session displayed Stripe sign-in. No merchant account, price catalog or runtime key was inferred from those failures.

Canonical PROJECTS/SquashArcade/CONFIG/backend.md now records the verified named database, product/package identity, configured deployment project/CLI, and actual application return/account URLs with exact readback. Provider credentials/catalog/notification bindings remain empty until recovered from their real authority. These intended return routes are not yet claimed as a deployed new account service.

Auth API reference used for the scoped update: https://docs.cloud.google.com/identity-platform/docs/reference/rest/v2/projects/updateConfig . Only authorizedDomains and signIn.email enabled/passwordRequired were patched; unrelated project configuration was retained.

## Remaining acceptance

Deploy actual billing functions and named-database rules through build_all.sh --deploy-account, verify runtime identity/config secret and actual service URL, complete all native/web builds through build_all.sh, verify final artifact signatures, and execute the existing continuous customer-journey rubric. No successful purchase, new release artifact or completed delivery is claimed by this record.
## Prescribed invocations after published source 799ed59

`build_all.sh --deploy-account` exited1 before cloud deployment on these fourteen unresolved provider bindings: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_MONTHLY, STRIPE_PRICE_SIX_MONTH, STRIPE_PRICE_ANNUAL, STRIPE_PRICE_LIFETIME, PLAY_SUBSCRIPTION_PRODUCT_ID, PLAY_BASE_PLAN_MONTHLY, PLAY_BASE_PLAN_SIX_MONTH, PLAY_BASE_PLAN_ANNUAL, PLAY_LIFETIME_PRODUCT_ID, PLAY_PUSH_AUDIENCE, PLAY_PUSH_SERVICE_ACCOUNT, PLAY_PUBSUB_SUBSCRIPTION. Other required deployment bindings resolved successfully.

The subsequent default `build_all.sh` exited1 before compilation with only VITE_SQUASH_API_BASE_URL unresolved. The five signing bindings, four Firebase app bindings and account-auth route resolved. No build processes are running from these invocations, and no new artifacts were produced. The remaining real provider bindings are required to activate the intended purchase flow; no fallback endpoint or payment facade was inserted.

Supervising review covered exact canonical resolution, secret version preservation, CLI discovery isolation, named-database targeting and rules preservation, injected runtime configuration, actual service URL readback and no broad credential search. Same-coder corrections handled lazy database initialization, optional listing configuration, exact canonical write ownership and URL/origin validation. Source syntax checks passed; actual cloud deployment, runtime purchases and complete platform outputs remain unverified.

## Repeated dependency audit

At remote source 328103f, a fresh exact KStore read confirmed all fourteen required provider bindings remain empty. The explicitly declared STRIPE_SECRET_KEY was also checked in Robin's configured interactive WSL runtime and was unset; no shell history, filesystem search or other environment values were inspected. The prior Stripe connector/browser checks required sign-in, and selected-project Secret Manager metadata contained no declared Stripe/Squash secret resources. No canonical source change, running deployment handle or active build can satisfy these missing provider inputs. This same provider-access dependency has persisted across three consecutive goal turns. Source, signing recovery and configuration work remain preserved; release completion and customer acceptance are not achieved.
