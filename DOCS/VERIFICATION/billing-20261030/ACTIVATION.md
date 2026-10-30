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