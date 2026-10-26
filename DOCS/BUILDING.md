# Scripted platform build

The entry point is `npm run build` (alias `npm run build:all`). It builds Windows,
Linux AppImage, Android and PWA together. `npm ci` installs the locked JavaScript
dependencies on a new checkout. No manual version edit, icon conversion, Gradle
project generation or per-platform build command is required for subsequent runs.

`npm run deploy` publishes the last complete matrix's web output to all three
configured domains and verifies every public file hash. It refuses a web tree
that differs from its frozen successful build. `npm run release` runs build then
deployment. Build and deployment are distinct commands so local artifact builds
do not implicitly publish. Public HTTPS is verified on the Surge domain; custom
Host routing is verified directly at the public Surge edge to accommodate LAN
split DNS. The deployment receipt records the route used for each domain.

## Provisioned host

- Windows with PowerShell 7 (`pwsh.exe`), Node, Git and the shared
  `E:/DevTools/pearl-build-env.ps1` environment. The Windows/Android worker sources
  that file itself, selecting MSVC, Rust, JDK, Android SDK/NDK and the E:-based caches.
- WSL `Ubuntu-24.04` with Rust and WebKitGTK 4.1 development libraries. The Linux
  worker selects the existing Node 24 installation and installs its pinned Tauri
  CLI in a reusable WSL cache on first use.
- Overrides: `SQUASH_POWERSHELL`, `SQUASH_WINDOWS_ENV`, `SQUASH_WSL_DISTRO`,
  `SQUASH_LINUX_NODE`.

## What the command does

1. Acquire `.build-lock`; regenerate icons and ensure the existing game assets.
2. Freeze the canonical source version and hash the app/build inputs into an
   isolated source snapshot. Generate metadata without advancing the minor.
3. Build the common frontend once and generate its local-file PWA precache.
4. Prepare isolated copies, then spawn all four packaging workers concurrently.
   Each executes scripts from its frozen copy. Native Cargo targets use separate
   caches, and the Linux source copy lives on the WSL filesystem.
5. Collect a Windows NSIS installer, Linux AppImage, Android arm64 APK and AAB,
   and PWA ZIP/web tree. Require every output, record SHA-256 hashes, worker
   timestamps, exit codes and logs in the attempt manifest.
6. After every worker succeeds, check the source fingerprint again and immediately
   advance the working source MINOR. Artifacts retain the version they were built
   with. Publish the successful web tree to root `dist/`, retaining the old tree
   inside the attempt directory for rollback.

Durable packages are produced directly under tracked root `dist/` from worker
launch: `dist/squash-arcade-v<version>/<attempt>/<platform>/`. Filenames start
`squash-arcade-v<version>-`. They are never withheld outside dist pending matrix
success. Failed targets retain available packages there and a stamped incomplete
inventory records hashes, missing outputs and exit codes. A completed compiler
matrix writes `dist/squash-arcade-v<version>-build-manifest.json`; this is not a
production acceptance manifest or a public release pointer.

Root dist is never moved, emptied or ignored. Frozen source/frontend and
intermediates are isolated under ignored `dist/.work/`; shared toolchain caches
remain disposable. Existing package versions and web files are preserved. Current operator override treats the unavailable Git service as permanently
absent. Use the configured available remote; no unavailable service may block
a build. Current packages fit the ordinary GitHub per-file limit and are
tracked as ordinary Git binaries; do not enable GitHub LFS. The deployment command reads the built version's durable PWA web tree.

## Working recipe details from the first runs

- Use PowerShell 7: Windows PowerShell 5.1 rejected the script and archive module
  under this host's execution policy. No machine policy change was needed.
- Execute the frozen worker scripts. Running a mutable shell script from the
  checkout can change a running build when that script is edited.
- Redirect each worker directly to its log file. Piped logs may stay open when
  SDK background processes inherit a pipe, leaving the coordinator alive after
  artifact completion. The corrected recipe closes the parent file descriptor.
- For AppImage, use the WSL ext4 working tree and persistent Cargo/CLI caches;
  `APPIMAGE_EXTRACT_AND_RUN=1` supports the bundler without a FUSE mount.
- For Android, the script runs Tauri init, adds Internet/camera permissions with
  camera hardware optional, and requests both arm64 APK and AAB output.
  It invalidates the cached Android `tauri` package before compilation: its
  build script writes Kotlin into each fresh snapshot but does not track the
  changing output-directory environment variable. Otherwise a reused Cargo
  cache can leave the new project without `TauriActivity.kt`.
- The icon master reuses `player1` from `src/mii_avatars.js`. It tilts the red Mii
  -13 degrees and the racquet +32 degrees. `npm run icons` generates the full set.
  Unchanged, complete icon sets are reused; `npm run icons -- --force` regenerates.
- Android versionCode is derived explicitly from the canonical version using
  `MAJOR*100000000 + MINOR*100000 + BUILD`, with platform-limit validation. This
  preserves ordering when the five-digit BUILD rolls over and MINOR advances.
- A production service worker caches the local frontend/assets. Chrome's initial
  candidate reported zero installability errors and loaded/started a match with
  networking disabled. A force reload that explicitly bypasses service workers
  is not an offline launch; the normal reload was observed successfully.

## Artifact and acceptance boundaries

Windows release installers and Android APK/AAB output are currently unsigned.
Production signing, installation and device gameplay are separate steps. The
Windows bundle has a recorded 16-bit-compatible OS version projection while its
in-game version, artifact filename and release identity retain MAJOR.MINOR.BUILD.
The AppImage baseline is Ubuntu 24.04; older Linux compatibility is not asserted.
Offline PWA startup covers local game files; remote music, camera models and
phone/multiplayer services retain their existing network requirements.

No automated tests are added/run under the current follow-up override. The build
manifest records actual compiler/bundler outcomes; runtime observations are kept
in `DOCS/VERIFICATION/platform-build-20261026/`.
