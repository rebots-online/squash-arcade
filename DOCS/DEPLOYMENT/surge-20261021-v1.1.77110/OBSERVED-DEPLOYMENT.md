# Surge evaluation deployment v1.1.77110

Operator authorization: Robin requested squash-arcade.surge.sh deployment for evaluation, plus the missing bottom-right version/build display. Original Arcade only; no Tauri repository access.

**Deployment complete:** https://squash-arcade.surge.sh/?v=1.1.77110

- Canonical/bundled/public version: **v1.1.77110**. Build stamped once at2026-10-21T23:50:04.157Z (19:50 EDT).
- Source checkpoint:913b3f37f9d01b4b82dd325171138a10f42bcfe8. Generated artifact/version commit:86590362611a7108eca620e0b87b49308adbd2ce.
- `npm run build` succeeded: asset downloader then Vite,32 modules,26-file lint had0defects. Build warnings: public styles.css resolved at runtime; main chunk exceeds500KB. The public CSS was independently retrieved and hash-matched.
- `npm run deploy` succeeded via installed authenticated Surge CLI; revision1792626656613-squash-arcade.surge.sh,18files/34.2MB. Prior revision1792571904021 remains in Surge history; previous local dist backed up in Admin-Manual staging before Vite replacement.
- Independent HTTPS verification retrieved **all18 published files**, including HTML, main JavaScript, CSS, deployment metadata, models and MediaPipe assets; each SHA-256 equals the built artifact. Details: `public-hash-verification.json` and `ARTIFACT_SHA256SUMS`.
- Direct public-browser observation at1280x800 and390x844: actual rendered game, visible bottom-right **v1.1.77110**, no button overlaps with the badge. Screenshots: `public-desktop.png` and `public-mobile.png`. This is viewport testing, not physical-phone acceptance.
- Reloaded the actual public URL at mobile viewport, then clicked **Play Match Now** through the real UI. The racket-spin ceremony opened, spectator/autoplay becamefalse, and the same version remained visible. Evidence: `public-match-start.png`. No physics/shot simulation replaced this UI observation.

The badge imports package version into the built bundle; it does not query another release or calculate a version at runtime. `version.txt` is canonical, the build script advances MINOR and stamps the five-digit epoch-minute BUILD once, and `deployment.json` records the same version/source/build time. Existing missing surge-deploy wrapper was replaced by the installed Surge CLI in the package deploy script. Root dist is tracked for rollback/recovery; nested dist ignores remain.

Robin's requested deployment and build-identity display are verified. Shot softness/timing and didactic clarity remain **INCOMPLETE—pending-operator** evaluation. No native release or broad mobile usability verdict is asserted.

Archival correction: mandatory turn archival/correction is KStore-mediated. The earlier retired task_event connection failure was misclassified as a separate central ledger requirement and is not evidence of KStore archive failure. The correction was saved through KStore with verified byte-exact readback. KStore's actual native blocking review remains authoritative.
