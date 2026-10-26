# Scripted platform build

The entry point is `npm run build` (alias `npm run build:all`). It builds Windows,
Linux AppImage, Android and PWA together. `npm ci` installs the locked JavaScript
dependencies on a new checkout. No manual version edit, icon conversion, Gradle
project generation or per-platform build command is required for subsequent runs.

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

Attempts and outputs live under `builds/<version>/<timestamp>/`. They are retained
after failure. `builds/<version>/SUCCESS.json` exists only after the complete matrix
succeeds. Missing/failed targets or edits during a build prevent the version bump.

## Working recipe details from the first runs

- Use PowerShell 7: Windows PowerShell 5.1 rejected the script and archive module
  under this host's execution policy. No machine policy change was needed.
- Execute the frozen worker scripts. Running a mutable shell script from the
  checkout can change a running build when that script is edited.
- For AppImage, use the WSL ext4 working tree and persistent Cargo/CLI caches;
  `APPIMAGE_EXTRACT_AND_RUN=1` supports the bundler without a FUSE mount.
- For Android, the script runs Tauri init, adds Internet/camera permissions with
  camera hardware optional, and requests both arm64 APK and AAB output.
- The icon master reuses `player1` from `src/mii_avatars.js`. It tilts the red Mii
  -13 degrees and the racquet +32 degrees. `npm run icons` generates the full set.
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
