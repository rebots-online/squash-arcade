# Platform build observations — 2026-10-26

The operator required one scripted concurrent Windows/AppImage/Android/PWA build, a source minor bump immediately after successful compilation, and the red Mii/racquet favicon and app icons. CodeGraph was checked before implementation; the current build path was web-only and bumped before Vite. The replacement recipe is documented in ../../BUILDING.md and implemented in checked-in scripts.

## Attempts and exact boundaries

- Source 1.13.83621, attempt 2026-10-26T12-23-20.817Z: workers started within 27 ms. Windows/Android were blocked by Windows PowerShell 5.1 script policy; its archive module blocked PWA packaging. Linux compiled and bundled an AppImage, but the wrapper failed after a mutable shell script was edited while it was running. The matrix returned failure and version.txt remained 1.13.83621. This established the PowerShell 7 and frozen-worker-script corrections. Full attempt logs remain under builds/1.13.83621/2026-10-26T12-23-20.817Z/.
- Source 1.13.83621, attempt 2026-10-26T12-29-32.836Z: all four workers produced required artifacts, exit codes 0, starting within 17 ms. The coordinator advanced source to 1.14.83639. The retained receipt is artifact-matrix-before-logging-fix.json. An inherited SDK log pipe kept the coordinator process alive after artifact completion; that known process was stopped, and logging was changed to direct file descriptors. This attempt is artifact/version-transition evidence, not proof of clean command exit.
- Source 1.14.83639, attempt 2026-10-26T12-46-00.308Z: Windows, AppImage and PWA succeeded; Android failed Kotlin compilation because the fresh Gradle project lacked generated TauriActivity.kt. The command returned exit 1 cleanly and source stayed 1.14.83639. The shared Cargo cache retained Tauri build-script side effects in a previous snapshot. The recipe now invalidates only the cached Android tauri package before compilation so its Kotlin bridge is regenerated.
- The following 1.14.83639 command also automatically collects all five packages and a verified hash manifest under dist/releases/1.14.83639/. Its final result is recorded below when complete.

## Browser observation before the final run

The first frozen PWA candidate reported zero Chrome installability errors, an activated controlling service worker and 35 cached local files. With this tab's network disabled, normal reload loaded the game and clicking START MATCH reached SERVE_STANCE with server=player and version v1.13.83621. State/image are retained with a first-attempt suffix. A deliberate force reload with ignoreCache=true bypassed the service worker and failed offline; that is not represented as a normal offline startup failure. Tab networking was restored afterwards.

The existing red player1 SVG supplies the Mii identity. The image was inspected at 512px and 32px: Mii tilt -13 degrees and racquet +32 degrees, with a hand around the grip. All icon formats derive from that source. No image-generation service or placeholder character was substituted.

Native outputs are unsigned; no installed Windows gameplay, physical Android play, Store acceptance or Linux runtime compatibility beyond the recorded build baseline is claimed. No automated tests were added or run under the current follow-up override.

## Final complete command

Source commit f135fdce1b104a68d7e995cf7de8e14d8aa457e8, version 1.14.83639, attempt 2026-10-26T12-54-17.065Z: npm run build returned exit 0. Four workers started within 15 ms and all returned 0. Five packages were automatically copied and hash-verified in dist/releases/1.14.83639 with manifest.json. Source advanced immediately to 1.15.83658; the lock was removed. See complete-matrix.json for exact artifact hashes, start/end times and platform metadata.

The final frozen PWA candidate at localhost:43840 reported zero Chrome installability errors, a controlling service worker and 35 cached files. Offline normal reload loaded v1.14.83639, and clicking START MATCH entered SERVE_STANCE with the red player. The screenshot and state receipt are pwa-offline-play.png and pwa-offline-state.json. Tab networking was restored. This is browser observation, not installed native/device acceptance.


## Operator correction: durable dist convention

The 1.14 build's post-success copying into ignored dist/releases was not compliant with CC12. The coordinator was corrected to give workers durable output paths in tracked root dist at launch, retaining partial inventories immediately and never renaming/emptying root dist. New names are slug-first squash-arcade-vVERSION-QUALIFIER. Disposable snapshots are separated under dist/.work. CodeGraph and KStore CC12/CC13 were reread before the correction. A dated infrastructure notice was incorrectly treated as the standing instruction. The operator corrected it: the unavailable Git service is permanently absent, must not be mentioned or probed, and must not be a build/publication dependency. That current instruction supersedes the earlier interpretation. CLAUDE.md, architecture, checklist and build documentation now record it. The configured available GitHub remote is used; current packages are ordinary tracked binaries below its per-file limit, without GitHub LFS.

The previous scripted deployment published web 1.14.83639, but readback succeeded only on the Surge HTTPS domain (36/36 files); custom Host edge checks failed (0/36 each), so npm run deploy correctly returned exit 1. This is not a fully verified three-domain deployment.


## Verified direct-dist build

Attempt 2026-10-26T13-13-10.414Z, source commit 81d1dc6: npm run build exited 0 for version 1.15.83658. All four workers started within 26 ms, five packages were produced directly in tracked dist, and independent SHA-256 readback matched every artifact. Complete generated evidence: dist/squash-arcade-v1.15.83658-build-manifest.json and the per-attempt stamped verification. Earlier failed attempt retained its partial packages and failed inventory in dist. No dist rename/emptying occurred. Source advanced to 1.16.83680 automatically and the lock was removed. Signing and native/device acceptance remain separate.

The latest standing override was saved and read back in KStore INFRASTRUCTURE.md revision 5 and TOOLING_CONVENTIONS/global-agent-rules.md revision 3. The configured available GitHub destination is used; no unavailable service is a dependency.

