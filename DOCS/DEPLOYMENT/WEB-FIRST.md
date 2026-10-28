# Web deployment before native completion

The 2026-10-28 user correction makes the playable web release available as soon as its two packaging workers finish. Root `build_all.sh` remains the only build/deployment entry.

- Normal invocation starts all five platform workers together. Web and PWA completion triggers deployment to all three configured domains without waiting for Windows, Linux or Android.
- A separate `dist/squash-arcade-vVERSION-web-build-manifest.json` records successful web/PWA packages. Deployment verifies their package hashes, frozen web files and served file hashes. A live web release does not imply native completion.
- Native workers continue concurrently. The full twelve-package matrix must still succeed before the source minor version increments automatically. All durable packages, inventories and logs remain directly in `dist/`.
- A native failure retains the already deployed web release and all partial native evidence; it does not undo the available evaluation build. A web deployment failure is reported separately and makes the overall command fail.
- `./build_all.sh --deploy-existing` republishes the prepared web release and verifies all three domains without compilation or a version increment.
- `./build_all.sh --recover-release VERSION` recovers a full package matrix that finished before finalization failed. It requires all five workers to have exited successfully and verifies every required package's size and SHA-256 before advancing the source version once. It expands the verified PWA ZIP and publishes through the same web deployment helper. It never compiles a platform.
- Version files are replaced atomically with bounded retries for temporary Windows locks. The canonical `version.txt` is written last; recovery records its intended successor before updating files.

For 1.18.86681, every platform succeeded, but a Windows open error on package.json interrupted version finalization and prevented the previous deploy-after-all sequence. Recovery reused all twelve packages. The early-deployment scheduling change applies to subsequent normal runs; recovery exercises the shared publication path but does not prove overlapping web/native timing by itself.
