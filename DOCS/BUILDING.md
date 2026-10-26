# Canonical build and deployment

Only ./build_all.sh may build or deploy. On this Windows host invoke it with
C:/Program Files/Git/bin/bash.exe. Never invoke build/deploy helpers, Cargo,
Tauri, Gradle or individual platform build commands directly. Helpers reject
execution outside the shell entry's inherited context. npm aliases enter that
same script; they are not separate recipes.

The default action builds all targets concurrently, automatically advances the
working source minor immediately after complete compilation, then deploys the
completed PWA web bytes and verifies all three domains. Retry deployment with
./build_all.sh --deploy-existing; this reuses built bytes without rebuilding or
advancing their source version.

## Required output

All twelve stamped package files are directly in tracked root dist:
- Windows standalone EXE, installer EXE, MSI and unsigned MSIX.
- Linux AppImage, DEB and RPM.
- Android arm64 APK, AAB and native debug-symbol ZIP.
- Ordinary non-PWA web ZIP and separate installable PWA ZIP.

Names are squash-arcade-vVERSION-QUALIFIER. Versioned web/PWA directories,
inventories, logs, manifests and icon evidence also live in dist. Root dist is
never renamed, emptied or ignored. Partial outputs remain there with their
incomplete inventory. Only frozen inputs/intermediates belong in dist/.work
or shared disposable compiler caches. Final packages do not wait outside dist
until the whole matrix succeeds.

The ordinary web/native frontend has no manifest/service worker. Only the PWA
variant enables registration and carries the generated precache.

## Working host recipe and corrections

Use shared E:/DevTools/pearl-build-env.ps1 tooling and PowerShell 7 for Windows
and Android, existing Ubuntu-24.04 WSL/WebKitGTK for Linux, and persistent
compiler/Node/Tauri caches. Windows uses NSIS, WiX and SDK MakeAppx. Linux uses
an ext4 working copy and APPIMAGE_EXTRACT_AND_RUN.

Freeze worker scripts before launch. Direct file log descriptors prevent SDK
background tools keeping coordinator logging pipes alive after completion.

Android init must explicitly copy the red Mii resources into generated app res,
hash-check them, and invalidate cached Tauri Kotlin code generation. Prefix
appended Gradle declarations with a newline. After packaging, use aapt2 to
resolve actual APK launcher resource paths, extract PNGs and compare decoded
pixels to the canonical red Mii resources. Merely generating source icons did
not prove Android packaging and was an earlier verification error. Keep native
release symbols separately. Signing/device acceptance remain separate gates.

Windows OS metadata has a recorded 16-bit-compatible version projection; the
game badge and artifact identity retain the canonical source version. HTTPS
readback preserves hostname/SNI/certificate validation and uses public edge
resolution for custom domains to avoid LAN split DNS.

Use the configured available GitHub destination. No unavailable Git service is
a build or publication dependency. Do not enable GitHub LFS. Current packages
fit ordinary file limits; larger artifacts require an available supported
publication path, never an unapproved storage service.

No automated tests are added/run under the operator override. Compiler output,
package inspection, icon pixels, hashes and browser observation are distinct
evidence; none alone establishes installed-device or production acceptance.

Observed 2026-10-26 full-matrix attempt: Windows four packages, Linux three packages and both web variants succeeded. Android's reused Java daemon (2h43m lifetime) crashed on native allocation; its crash log showed 1.2GB physical RAM free. The recipe now uses a fresh single-use Gradle JVM, two workers/active processors, a 1536MB heap with bounded metaspace/code cache and in-process Kotlin, plus bounded Cargo jobs. All targets still start together. Failed-version retries copy prior packages to stamped retained paths in root dist before replacing current files; the inventory correlates hashes. No manual platform retry is allowed.

