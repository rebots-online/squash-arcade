# Squash Arcade — approved independent implementation checklist

Architecture: DOCS/ARCHITECTURE.md v2.8.0, billing architecture commit 47ae44ec515cdfee0a2eb0904dc1e74b063ae714 (remote verified). User approved BILL-01 on 2026-10-30. Historical work below remains outside this change.

Current four-state vocabulary: NOT_STARTED, IN_PROGRESS, BLOCKED, COMPLETE. COMPLETE requires implementation, supervising semantic acceptance and mapped real continuous demonstration. Source-only progress stays IN_PROGRESS. BLOCKED names the exact external input. Older symbolic markers below are historical records, not completion claims for BILL-01.

## BILL-01 — Purchase and account delivery (one cohesive cycle)

Status: IN_PROGRESS. Requirement authority: DOCS/ARCHITECTURE.md §0. Architecture committed/pushed before this checklist. Only this change's architecture is in progress. Build/sign/deploy remain stopped by operator; do not run them, including npm build, Tauri, Gradle or build_all.sh. No automated tests; source syntax and semantic review only until real observation is possible. No fakes, mock providers, fixture purchases or temporary customer-facing payment facade.

### BILL-01-A — Design and Figma contract

Status: IN_PROGRESS. Design source reviewed and published at 42a5e77 / 4ce1be2; high-fidelity Figma context and corrected screenshot obtained. Rendered implementation comparison remains blocked by activation/build stop. Owner: design coder. Scope: DESIGN.md and Figma file QotfEXkcNAg4dBllelZ1qw; no runtime code. Read architecture §0.2, existing CourtHUD/CSS, invoked Stitch taste and Figma skills. Write scoped slate/gold design contract preserving court identity, purchase rows, persistent Account and menu route, 44px targets, selectable identifiers, accessible full-screen mobile dialog, no glow, no decorative perpetual financial animation. Create editable Figma views for signed-out account and genuine no-purchase state, plus textual interaction annotations for provider-sourced plan/status/receipt data; never invent a customer, invoice, transaction or active provider price. Obtain get_design_context with screenshot and figma-design-to-code skillNames before UI code; return exact file/node IDs and asset/download instructions. Inspect screenshot geometry. Acceptance: design source and screenshot are usable by the UI coder, mobile/desktop hierarchy is explicit and runtime dynamic slots are documented without fabricated data. Commit/push this boundary via supervisor. Full visual acceptance waits for rendered implementation under BILL-01-E.

### BILL-01-B — Firebase ownership and provider backend

Status: BLOCKED. Missing inputs: Firebase project selection, Stripe reconnection/merchant and real catalog bindings, Play publisher/catalog/RTDN binding. Independent source work may be IN_PROGRESS but activation remains BLOCKED. Owner: backend coder. Exclusive files: functions/**, firebase.json, firestore.rules, firestore.indexes.json. Do not alter project selection, provision cloud resources, make charges, create fictitious products or edit frontend/native files.

Implement exactly §0.3–0.5 APIs and entities using Firebase Admin/Functions, Stripe Checkout/Portal and Google Android Publisher. Verify ID tokens; server owns access and provider mappings; transaction claims have one UID. Validate required real env configuration, exact product IDs/periods and return origins. Use provider prices, deterministic checkout idempotency and pending-intent recovery. Reconcile provider state before deriving access; canceled_active retains access, lifetime is non-consumable, one revoked purchase cannot erase another active one. Signature-verify Stripe webhooks and authenticate Play Pub/Sub, then re-query authoritative objects. Handle asynchronous completion, renewals, failures, refunds and disputes. Acknowledge Play only after durable access; record/retry acknowledgment failures. Validate Play obfuscatedAccountId and reject ownership mismatch. Server-browser native identity flow uses a five-minute one-use request and hashed client secret that never appears in browser URL. Receipt/document endpoints authorize the requesting UID and return actual provider documents only. Match-access endpoint enforces verified expiry. Firestore rules deny client access writes and provider secrets.

Return exact exported interfaces, dependencies and required configuration names, plus static checks and unresolved provider bindings. Do not run tests or deployment. Supervisor reviews all fulfillment/identity transitions and sends defects back to this same coder. Commit/push source and each correction separately. COMPLETE requires the real purchase/restore/cancel/document rubric, not just source syntax.

### BILL-01-C — Account UI, authentication and game integration

Status: IN_PROGRESS. Source implementation and same-coder corrections published at 586b180 / 5b629c8; syntax and semantic review completed, real runtime acceptance blocked. Owner: UI coder, after A supplies high-fidelity design context. Exclusive files src/account/** except native-billing.js, public/account.css, account-auth.html, index.html, src/squash/CourtHUD.js, src/game_engine.js; dependency changes coordinated with supervisor. Implement AccountController and AccountView against B's fixed API. Retain direct text Account beside Menu, menu duplicate route and context-sensitive Start Match admission. Signed-out users see real catalog and authenticate before purchase. Use Firebase SDK real sign-in, persistence, sign-out and browser/native handoff; no local fake user. Pause via engine's computed modal ownership, suppress automatic briefings, isolate capture-phase replay/game input and make email/order IDs selectable. Native dialog owns focus over sound gate. Closing restores focus and never loses pending checkout state.

Implement actual catalog rows, provider checkout, checking/pending/confirming/active/canceled/error states, restore, correct-provider cancellation, paid-through dates, genuine receipts and lifetime account presentation. Active/pending purchase prevents duplicate provider purchase. Google Play balance route explains Android purchase and same-account restore; never accepts codes or suggests Stripe can charge Play balance. Open external provider URLs through correct system-browser route on native and ordinary navigation on web. No billing feature is deployed with missing bindings. Verify syntax, compare source to Figma design and enumerate unobserved runtime states. Return deficiencies to same coder; commit/push source/corrections. No build or automated test.

### BILL-01-D — Native Android Play Billing bridge

Status: BLOCKED. Missing inputs: real Play products/base plans, publisher binding and available Play install track. Owner: Android coder. Exclusive files src-tauri/plugins/play-billing/**, src/account/native-billing.js and native registration/config changes coordinated with supervisor. Implement Tauri plugin with Kotlin BillingClient, Rust invoke/event wiring and explicit capabilities; add plugin to generated Android builds through supported Tauri plugin dependency, not untracked hand-edited generated output. Query SUBS/INAPP catalog and purchases at startup/resume, use actual offer token, launch native purchase sheet, report pending/cancel/purchased and reconcile through /play/verify. Native platform detection cannot equate Android browser/PWA with native Play build. Never consume lifetime, collect gift codes, grant from local callback alone or hardcode fake catalog. Preserve request/listener identity, lifecycle reconnect and cancellation. Include known configuration names and source verification; no Gradle/Tauri build. Supervisor reviews plugin registration through final native code path and sends corrections to same coder. COMPLETE requires real device/provider observation.

### BILL-01-E — Integration, configuration, review and continuous demonstration

Status: BLOCKED. Dependencies: A–D reviewed source, real project/provider bindings, operator's build stop lifted, authorized real transaction observation. Owner: supervisor. Preserve all existing .env.example comments/names, add full annotated billing/auth schema with genuine general prices only, all installation/provider bindings blank; reconstruct internal .env as annotated union with canonical pointers and no literal secrets. Configure real project/store catalogs only against selected accounts; do not count defaults as live prices. Bind functions URL, Auth domains, native browser handoff and provider return routes, then review actual failure and recovery transitions across modules. Static source checks are not product acceptance.

Preauthored rubric is DOCS/TEST_RUBRIC.md BILL-01. Record a real continuous session after implementation/corrections and when builds are authorized, mapping requirement, task, source commit and recording timecode. Demonstrate purchase-to-access, restart restore, duplicate-click recovery, cancel renewal with retained access, real document, cross-platform account ownership, and Android native sheet/device behavior. Preserve actual artifact and update status only from evidence. Any observed defect returns to its same coder before re-recording. Commit/push each boundary with remote SHA verification; preserve unrelated files and avoid Git LFS hooks.

### BILL-01 current evidence — 2026-10-30

Architecture and checklist boundaries are remote verified. Backend source published at 36656f6 and same-coder corrections at 70b949d; native Play source at 7d9f2e6; Figma design at 42a5e77 / 4ce1be2. UI implementation and integration have passed source syntax and supervising semantic review, including repeated corrections returned to their original coders. Exact findings and publication evidence: DOCS/VERIFICATION/billing-20261030/REVIEW.md.

- A: IN_PROGRESS — editable design and screenshot reviewed; running UI comparison unobserved.
- B: BLOCKED — backend source implemented/reviewed; actual Firebase/Stripe/Play bindings and deployment remain absent.
- C: IN_PROGRESS — persistent purchase/account UI, browser handoff and game admission source implemented/reviewed; runtime acceptance blocked.
- D: BLOCKED — native bridge source reviewed; compilation, production signing/Play installation and purchase callbacks unobserved under build stop.
- E: BLOCKED — annotated config/locks/entry routing completed in source; canonical live pointers, service activation, authorized real transactions and continuous recordings remain outstanding.

No task is marked COMPLETE from code, dependency installation or Figma. Public prices are configurable provisioning defaults, never fake provider offers. No application build, signing, deployment, automated test or purchase was run during this implementation cycle.

Current operator override: no automated tests for follow-up work. TASK-40–45 test commands below are historical completed-release instructions, not current gates. TASK-46–48 are independent on release 178584f; each includes its own implementation and focused browser observation. No task requires another follow-up task.

## TASK-63 — Concurrent Windows, AppImage, Android and PWA release build

## TASK-67 — Any-key replay skip despite retained button focus

- **Status**: [/]
- **Contract**: Keep pointer exceptions for start/menu/audio controls, but route every keyboard down/up through PointPresentation while the point presentation owns input. A fresh non-repeat keydown skips even after a lost keyup; repeats from a held rally key do not. Consume the skip gesture through release so it cannot also serve, open a menu or change a shot.
- **Verification**: Inspect the capture-handler and release path; observe focused-button keyboard skipping and subsequent serve input in the browser when available. No automated tests. Build and deploy only with build_all.sh, publish all twelve packages in dist, and commit/push with remote readback.
- **Observed delivery**: Source 6a2a5a4 is live in 1.18.86681 on all three domains, 36/36 file hashes each. All twelve packages hash-verified. Browser control timed out and stopped, so interactive replay-skip acceptance remains open; no automated tests were run.

## TASK-68 — Publish web while native builds continue; recover completed releases

- **Status**: [X]
- **Contract**: User correction 2026-10-28. Keep build_all.sh as sole entry and launch all platform workers concurrently, but publish the web/PWA output immediately after those two workers succeed. Keep full matrix completion, automatic minor increment and native acceptance separate. Add hash-verified scripted recovery after successful compilation but failed finalization; never require recompiling identical completed packages.
- **Verification**: JavaScript/shell syntax checks and review of completion promises. Exercise shared web publication through build_all.sh --recover-release 1.18.86681; verify twelve artifact hashes, source increment and all three live domains. The next normal run must supply actual overlapping web/native timing evidence. No automated tests.
- **Observed delivery**: Recovery exited 0 with 12/12 package hashes and 36/36 served-file hashes on each domain. Source automatically advanced to 1.19.86701. A direct-write retry still hit the Windows package.json lock; atomic same-directory replacement succeeded. Scheduling syntax/review complete; next-normal-run timing remains unobserved.

## TASK-66 — Complete speech inventory and current OpenRouter TTS research

- **Status**: [X]
- **Contract**: Architecture speech inventory/research correction. Implement scripts/catalog-speech.mjs and invoke only via build_all.sh --inventory-speech or its normal preparation. Produce exact fixed text, dynamic templates, source links/hashes, current sink/caller coverage, retired/uncertain wiring and a bounded score bank generated from the actual RulesEngine. Record the unbounded win-by-two/open API domains explicitly. Recover the older voice-pack proposal and removal event from Git, and audit interrupted build state without claiming completion.
- **Accept**: Inspect generated JSON/Markdown coverage and counts; confirm exact red-player identity sentence and all fixed briefing scripts. Research the November 30 promotion against current OpenRouter model metadata and official TTS docs, recording model/voices/date/pricing/format/control limitations and naturalness-listening status. Recommend fixed pre-rendered voice assets for device consistency. Do not silently replace runtime synthesis, generate paid audio, or claim listening/device acceptance. No automated tests.

## TASK-63 — Concurrent Windows, AppImage, Android and PWA release build

- **Status**: [X]
- **Dependencies**: [] (aa2edb3; existing web game).
- **Current correction**: Only root build_all.sh may start builds or deployment; helpers reject direct invocation. Five concurrent workers must produce twelve packages directly in dist: Windows standalone/installer EXEs, MSI/MSIX; Linux AppImage/DEB/RPM; Android APK/AAB/native-symbol ZIP; ordinary web ZIP and PWA ZIP. Generated Android resources must be replaced by the red Mii set and verified in the packaged APK. Run the shell entry, verify all output hashes, automatic source minor transition and three-domain deployment. No manual per-platform builds or automated tests.
- **Observed release**: build_all.sh exited 0 for 1.17.84079; all five workers succeeded, twelve root-dist packages hash-match, source advanced immediately to 1.18.84088, and 36/36 public files match on each of three HTTPS domains. APK debug data is separately archived; install APK is 29,834,989 bytes and 16 KB aligned. Actual APK launcher pixels match the red Mii. Returning cached session showed old 1.14 title; update was requested, but browser control then timed out, so automatic client-transition observation remains unconfirmed. No automated tests or device/signing acceptance claimed.
- **Brand/update correction**: Preserve primary Virtual Squash identity and ROCHE court wordmark; remove legacy visible Argon/Remix text from page, soundtrack, companion and tuning UI. Match native/PWA/title labels and fail pre-build on drift. Make PWA updates apply to legacy/current clients automatically; inspect the returning-client transition and served titles at all three URLs. No user refresh instruction or direct/manual build.
- **Contract**: Architecture §4.23. Add Tauri 2 shell and one locked `npm run build` / `build:all` coordinator. Freeze and hash source/frontend, launch five isolated packaging workers concurrently, preserve logs/partial failures, require all artifacts, and write hashes and timings. Reuse shared Windows/Android and WSL tooling. Preserve existing gameplay; no separate Tauri-repository access.
- **Accept**: Run the real coordinator; inspect five worker start times, exit codes and installer/AppImage/APK/AAB/PWA hashes. Workers write durable packages directly into tracked root dist from launch; partial outputs remain there with stamped incomplete inventory. Never rename/empty dist or ignore release packages. Use slug-first versioned names, tracked binaries and the configured available remote; do not add an unavailable service dependency or GitHub LFS. Verify Android fresh-snapshot bridge generation with shared caches. Report compilation and launch/device/signing limitations accurately. No automated tests.

## TASK-64 — Advance the source minor immediately after successful build

- **Status**: [X]
- **Dependencies**: [] (aa2edb3).
- **Contract**: Architecture §4.23. Replace the pre-build minor bump with metadata-only preparation. Freeze canonical version in artifacts; immediately bump source MINOR only after complete successful matrix, with edit-during-build detection and single-run locking. Advance this new source from the already published 1.12 version before compiling. Keep package/version/native configuration in agreement.
- **Accept**: Observe real success retaining built N in artifacts and source at next minor; inspect failed-attempt behavior and lock cleanup without adding/running automated tests. Commit/push actual changes and receipts.

## TASK-65 — Red Mii favicon, app icons and installable offline PWA

- **Status**: [X]
- **Dependencies**: [] (aa2edb3; existing red Mii SVG and web frontend).
- **Contract**: Architecture §4.23. Reuse player1 identity in a slightly tilted composition, with held squash racquet tilted oppositely. Generate deterministic SVG/PNG/ICO sizes, including maskable safe-area icon. Wire favicon, PWA manifest/install metadata, production-only service worker with versioned local asset precache and safe updates, and native icon config.
- **Accept**: Inspect actual icon at small and app sizes; observe manifest/service-worker/offline reload in the browser. Build and inspect native icon outputs. No automated tests; separate local offline game from remote optional features.
## TASK-61 — Solve the lob to the rear corner away from the receiver

- **Status**: [X]
- **Dependencies**: [] (c6cc371).
- **Contract**: Architecture §4.22. In src/squash/ShotController.js pass opponent.pos to solveCornerLob, choose its opposite side with contact-side tie-break, target (±2.75,0,4.45), and replace coarse charge-limited scanning with bounded continuous launch solves using existing ShotTrajectorySolver._linearStep. Probe front heights 4.42 through 1.9 m, score actual landing/descent, and preserve the steepest converged legal candidate. Track all collision legality and floor/front/back ordering in _simulateLobCandidate; reclassify actual AI overhit output. Preserve other shot families and live physics. No new test files.
- **Accept**: Observe front/mid/rear contacts on both sides, both receiver sides and low/high contacts with the real physics; inspect front-to-floor event order, rear landing, out flags and descent. Observe rendered lob flight. Record limits without claiming exhaustive gameplay acceptance. Commit/push and verify publication; release with the requested entry changes.

## TASK-62 — Immediate start, optional spin and spoken red identity

- **Status**: [X]
- **Dependencies**: [] (c6cc371).
- **Contract**: Architecture §4.22. CourtHUD places #btn-start-match first in the menu, adds visible #btn-quick-start outside it and a persisted unchecked #setting-racket-spin under settings. CourtHUD.update shows quick start only for demo/title/intro/match-over, avoiding gameplay obstruction. All quick-start input stays out of shot handlers and unlocks existing audio. startNewMatch captures the opt-in once; _setupPointServe consumes it once; ceremony generation invalidates stale timers. RulesEngine's red-first score default remains. AudioEngine welcome and ArcadeBriefing placement narration contain the exact red-player sentence. Keep existing controls, camera/phone journeys and candy style. Retain START MATCH in HudUI difficulty updates. A bundled identity WAV plays through _playIdentityFallback if browser speech is missing/fails/ends without starting; cancellation/mute shares the narration owner.
- **Accept**: Observe initial desktop and narrow portrait start without menu/scroll, click into red service with spin off, opt in/reload/spin, then disable/reload/red-first; inspect zero-all let handling. Observe the exact protected narration request and report actual audio availability separately. Build, commit/push, deploy and verify public bytes. No automated tests.

## TASK-59 — Clear the court and surface three play methods

- **Status**: [X]
- **Dependencies**: [] (78aec6d; independent of native packaging, billing and queued tactics).
- **Requirements**: HUD-1, HUD-2 (§4.20).
- **Files**: src/squash/CourtHUD.js; public/court-hud.css; index.html; src/game_engine.js. Read-only: existing HudUI IDs/callbacks, MotionController RELAY_ENABLED/enableWebcam and shot selectors.
- **Do**: Reparent the existing bottom settings/music controls into the collapsed hamburger setup at every width. Put the existing red shot choice and descriptive continuum in the upper HUD, keep six usable shot/Let chips along the lower edge. Preserve IDs/listeners and camera/gameplay. Add three prominent start methods. Keyboard uses existing match callback; phone/camera show their instructions, with self-contained textual fallback if ArcadeBriefing is absent. Phone pairing is capability-gated; camera starts only after explicit permission succeeds. Keep recovery and menu access.
- **Accept**: Follow scenes A, C–G in DOCS/TEST_RUBRIC.md with this entity's controls. All settings remain reachable, no lower settings obstruction, no implicit timing mapping or static API polling. Desktop/portrait/landscape and keyboard focus remain usable. No sibling-task dependency; implement simple instruction fallback within this item.
- **Observed delivery**: v1.11.82396 published to Surge. Menu/three methods, responsive layout, keyboard match entry, unavailable-camera recovery and zero static relay requests observed. Physical phone/camera play and the exhaustive camera sweep remain unobserved; see DOCS/VERIFICATION/arcade-briefing/OBSERVED-RUN.md. This marker records implementation with scoped runtime evidence, not independent semantic acceptance.

## TASK-60 — Animated arcade briefings with protected narration

- **Status**: [X]
- **Dependencies**: [] (78aec6d; engine and original menu are sufficient).
- **Requirements**: BRIEF-1–3 (§4.21).
- **Files**: src/squash/ArcadeBriefing.js; src/squash/ArcadeSchematic.js; public/arcade-briefing.css; src/audio_engine.js; src/game_engine.js; index.html. Read-only: existing menu/start callbacks, MotionController and IntroDirector.
- **Do**: Implement the full three-chapter lifecycle/content, narrated priority channel, local animated isometric diagrams and responsive accessible overlay specified in §4.21. Wire existing narrator invite and controls-guide entry even without TASK-59. Background scoring/replays stay live but cannot replace speech or foreground content. Include cleanup, reduced motion, silent reading time, focus/input isolation and mode start/recovery.
- **Accept**: Follow scenes A–G in DOCS/TEST_RUBRIC.md, observing actual chapter animations, scoring beneath narration, automatic and requested flows, exits, browser visibility and capability recovery. Capture integrated evidence after both items; no intermediary test/reviewer gate. Source/build/publication markers do not certify physical phone or camera play.
- **Observed delivery**: Public automatic placement/phone/camera sequence, moving diagrams and scoring behind the foreground, requested guide, reduced motion, focus/Escape, mute/unmute and human help pause/resume observed. Browser speech ended immediately on this host, so audible delivery is unverified. Screen captures contain no audio and do not certify every rubric scene continuously; see DOCS/VERIFICATION/arcade-briefing/OBSERVED-RUN.md.

## TASK-58 — Keep one racket hand and remove backhand grip jumps

- **Status**: [X]
- **Dependencies**: [] (baseline 60176e6; independent of billing and queued tactics).
- **Files**: src/racket_kinematics.js; src/squash/RacketGrip.js (new); src/squash/StrokeMotion.js; src/game_engine.js. Read-only: mii_body_animation.js and existing rig/recorded pose structure.
- **Do**: Implement §4.19: dominant-hand ownership through the stroke, complete left-handed mirroring, shared preparation side, actual-pose swing start, neutral recovery, and final selected-hand grip synchronization with a separate balancing hand. Preserve live physics/contact, torso turn/foot planting and replay poses.
- **Verify / Accept**: Observe the reported overlapping hands in the deployed backhand; inspect corrected forehand/backhand grip attachment, free-hand separation, continuity through swing start/recovery, explicit left-handed selection and replay. No automated tests. Build, commit/push each sensible change, deploy and verify public release bytes. Record focused runtime evidence and limits.

## TASK-57 — Stop unconditional polling of unavailable relay APIs

- **Status**: [X]
- **Dependencies**: [] (baseline 97a1192; independent of queued tasks).
- **Files**: src/motion_controls.js; src/game_engine.js; src/hud_ui.js. Read-only: vite.config.ts relay responses and existing room/input callbacks.
- **Do**: Implement architecture §4.18 completely: static-build capability off by default, explicit backend opt-in, demand-driven session start/stop, single cancellable timeout chain, request timeout, response validation, bounded error backoff and terminal failure stop. Gate automatic feedback and snapshot writes; preserve local controls/vibration and phone event decoding. Reconfigure safely on room changes and stop on disposal.
- **Verify / Accept**: Inspect live static-build network requests during spectator and solo play and after requesting pairing; no automatic relay calls. Inspect enabled local relay pairing and stop behavior with one request in flight at most. Build, record observed evidence and limits, commit/push and deploy; verify public release bytes. No automated tests.

## TASK-56 — Keep replay shadows with the recorded players and ball

- **Status**: [X]
- **Dependencies**: [] (baseline ac7032f; independent of queued tasks).
- **Files**: src/game_engine.js. Read-only: PointPresentation.apply and updateCharacterContactShadow in src/mii_model_overhaul.js.
- **Do**: Update both actor contact shadows in the replay animation bypass, deriving hop height from the displayed root and recorded actor position. Preserve the bypass of live body/racket/face animation. Track the ball core caster and disable its hard cast shadow only during POINT_REPLAY; keep the soft ball contact shadow and restore the caster in normal play. Preserve physics, recorded transforms, scoring, tin and camera.
- **Verify / Accept**: Observe the reported stale shadow positions and isolate the apparent second floor ball in a held live replay. Observe corrected early/mid/late replay shadows following both recorded actors and the single rendered ball without the displaced hard shadow. Observe normal replay completion and skip restoring the ball caster and live shadows. Record focused browser evidence and limits in DOCS/VERIFICATION/gameplay-followup.md. No automated tests. Build, commit/push, deploy and verify served release bytes; preserve prior dist for rollback.

## TASK-55 — Announce the actual let ruling

- **Status**: [X]
- **Dependencies**: [] (baseline 43f2ba8; independent of queued tasks).
- **Files**: src/squash/RulesEngine.js; src/game_engine.js. Read-only: AudioEngine announceScore/playVoiceCallout and existing appeal resolver.
- **Do**: Pass authoritative appeal metadata into the shared referee callout formatter. Map NO_LET, YES_LET and STROKE explicitly before interpreting prose; distinguish text-only denied lets before any granted-let fallback. Use the same result for the banner and speech. Preserve ruling/scoring, score/handout/game/match wording, actual let replay and sound settings.
- **Verify / Accept**: Observe an invalid appeal in the running browser, confirm the point is awarded against the caller and both banner and speech request begin "No let!". Inspect granted-let/stroke handling and ordinary score path. Record browser observation versus actual listening scope in DOCS/VERIFICATION/gameplay-followup.md. No automated tests. Build once, commit/push and deploy; verify the public build and preserve the previous release for rollback.

## TASK-53 — Roll up mobile setup and make player identity readable

- **Status**: [X]
- **Dependencies**: [] (baseline eb63836; independent of TASK-54 and queued tasks).
- **Files**: index.html; public/styles.css; src/game_engine.js. Read-only: HudUI show/hide and existing control callbacks.
- **Do**: Start setup collapsed before initial game load on widths up to 900px and coarse-pointer widths up to 1200px. Provide one Menu handle to open/roll up configuration without resetting the rally or control mode. Reserve the compact top bar for both avatars, score, legible YOU/red label outside the clipped portrait and Menu. Retain secondary functions through the expanded panel/secondary controls; include camera, replay and tuning access. Make expanded setup scrollable and the sound-unlock prompt compact. Preserve arcade styling, desktop setup, red shot-choice feedback and whole-court camera.
- **Verify / Accept**: Observe fresh mobile-width load, menu expansion/collapse, score and avatar separation, readable YOU and reachable secondary actions. Inspect portrait phone, fold/tablet width and landscape plus desktop; confirm opening configuration does not restart play. Record actual browser viewport scope in DOCS/VERIFICATION/gameplay-followup.md; no automated tests or physical-device claim. Build, commit/push and deploy the complete item.

## TASK-54 — Keep a translucent red tin boundary in replay

- **Status**: [X]
- **Dependencies**: [] (baseline eb63836; independent of TASK-53 and queued tasks).
- **Files**: src/squash/CourtGeometry.js; src/game_engine.js. Read-only: PointPresentation camera path and physical tin height/collision rules.
- **Do**: Replace replay-only tin hiding with visible darker translucent tin panel and translucent red top strip for front-wall viewpoints. Slightly darken the normal panel; retain scene depth testing and physical boundary position. Restore normal material treatment on viewpoint exit and skip. Keep ball/players readable through the overlay and preserve camera orbit, framing and scoring.
- **Verify / Accept**: Observe a front-facing replay opening and orbit, then skip/finish to normal play; inspect the tin boundary on light and dark court themes and a compact viewport. Confirm visible objects/material restoration and unchanged height. Record scope in DOCS/VERIFICATION/gameplay-followup.md. No automated tests. Build, commit/push and deploy the complete item.

## TASK-52 — Prevent replay rotation from reversing later gameplay

- **Status**: [X]
- **Dependencies**: [] (baseline 63adb65; independent of queued TASK-50/51).
- **Files**: src/game_engine.js; src/squash/StrokeMotion.js; src/squash/PlayerMovement.js. Read-only: PointPresentation quaternion pose playback and character hierarchy.
- **Do**: Replace partial root yaw writes with complete yaw-only `(0, yaw, 0)` rotations wherever gameplay owns actor facing, including setup, serve/showcase, locomotion, preparation, stroke and recovery. Recorded replay quaternions can yield equivalent Euler X/Z components of PI; clear those components on gameplay ownership instead of carrying them into the next rally. Preserve the replay's recorded poses, local hip/head/limb motion, stroke side, contact, physics and camera.
- **Verify / Accept**: Capture the defect in the deployed game, inspect the complete root orientation, and confirm the same frozen pose faces correctly when residual X/Z rotation is cleared. Observe actual rallies after natural replay completion and early skip on the corrected build, including both players and forehand/backhand strokes. Record scope in DOCS/VERIFICATION/gameplay-followup.md. No automated tests. Build, commit/push and deploy the corrected version; verify public version and bundle bytes. This correction does not implement queued serve/volley tactics.
- **Evidence**: Deployed 1.5.77385 from source 99aa48e; observed natural replay exits, manual opening skip and both actors' forehand/backhand contact poses. Public version, HTML, metadata and bundle bytes verified. See DOCS/VERIFICATION/gameplay-followup.md and facing-replay-fix-live.png. Human feel evaluation remains separate from these focused observations.

## TASK-50 — Choose volley placement around the opponent (queued)

- **Status**: [ ]
- **Dependencies**: [] (complete implementation can start from release 63adb65).
- **Files**: src/squash/VolleyPlanner.js; src/squash/OpponentAI.js; src/squash/ShotController.js; src/game_engine.js as needed for choice feedback. Read-only: existing physics, contact timing and chip-display interfaces.
- **Do**: Evaluate opponent coverage of the intended landing and interception lane. When the opponent waits in front, prefer a high-enough deep straight or crosscourt volley into the rear corner away from them; do not default to a volley drop, including an easily covered opposite-front-corner drop. Retain opportunistic drops against an opponent unable to cover the front. Preserve physical reach, smart length, back-wall sit-up timing and explicit human shot-family choice. Apply to both AI roles and keep red's displayed choice accurate. This tactical correction precedes the experimental serve work in the queue but has no task dependency.
- **Verify / Accept**: Observe front-court and deep opponents, both actors and court sides, and reachable front/mid/back-court volleys in the running game. Record actual shot choices and trajectories: front coverage discourages drops; good deep placement clears interception; an exposed front still permits a volley drop. Include all tuning and feedback changes in this task. No automated tests. Record the observation scope and remaining feel questions in DOCS/VERIFICATION/gameplay-followup.md; build and publish when this task is implemented.

## TASK-51 — Explore and enable shot chips for serves (queued)

- **Status**: [ ]
- **Dependencies**: [] (complete implementation can start from release 63adb65).
- **Files**: src/game_engine.js; src/motion_controls.js; src/squash/ShotController.js; src/squash/TuningConfig.js; src/squash/TuningPanel.js; index.html; public/styles.css as needed. Read-only: current serve state machine, readiness, rules and physics.
- **Do**: Experiment with useful legal serve ranges and connect chips/keys 1–5 to red's serve in human and spectator-influence modes. Candidate meanings: Drive = typical hard serve; Lob = lob serve; Boast = corkscrew-style experiment; Drop = unresolved; Kill = potentially an extra-hard serve. Do not treat tentative mappings or numerical ranges as settled. Resolve and describe useful behaviour before exposing a family, recording any unsuccessful corkscrew/Drop experiments. Own selection timing through toss/contact, trajectory construction, tuning, labels and red-choice blink/hold feedback within this item. Preserve existing readiness, legal validation and rally behaviour.
- **Verify / Accept**: Observe every offered serve from both service boxes, with human chip/keyboard input and spectator influence on red. Document useful trajectory ranges, faults, practical distinctions and unresolved choices; no guaranteed winners or hidden fallback contradicting the displayed family. No automated tests. Record evidence in DOCS/VERIFICATION/gameplay-followup.md; build and publish when this task is implemented. This is queued exploration, not a change to the current evaluation build.

## TASK-46 — Correct backward-facing backhand rotation

- **Status**: [X]
- **Dependencies**: [] (baseline 178584f).
- **Files**: src/squash/StrokeMotion.js; src/squash/PlayerMovement.js; src/game_engine.js; src/racket_kinematics.js. Read-only: character rig geometry.
- **Do**: Honour explicit actor-relative forehand/backhand choice and unify stroke, locomotion and ready-pose yaw with the model's front-wall-facing PI yaw. Preserve handed stance, opposite-foot step and live contact. Remove the tracking-angle discontinuity at the centre line.
- **Verify / Accept**: Inspect rendered forehand/backhand poses, including front and back court; backhand closes toward its ball side and opens toward the front wall without a backward turn. Reach, timing and shot family remain unchanged. Record actual observation in DOCS/VERIFICATION/gameplay-followup.md. No automated tests.

## TASK-47 — Keep bounced-ball reception current

- **Status**: [X]
- **Dependencies**: [] (baseline 178584f).
- **Files**: src/squash/PlayerMovement.js; src/squash/OpponentAI.js; src/game_engine.js. Read-only: current ball/prediction, VolleyPlanner and live contact rules.
- **Do**: Use remaining prediction time, discard expired bounced-ball samples and commit the approach when contact is due. Release the cancelled swing's cooldown after a failed contact while the incoming ball remains playable, allowing a fresh real attempt. Keep successful recovery, existing volley priority and valid back-wall sit-up behaviour.
- **Verify / Accept**: Observe receiver movement and actual return around the service box in the running game; confirm a deep ball still receives the established back-wall treatment. No artificial contact/reach, no automated tests. Record evidence in DOCS/VERIFICATION/gameplay-followup.md.

## TASK-48 — Rearward-facing opening for every point replay

- **Status**: [X]
- **Dependencies**: [] (baseline 178584f).
- **Files**: src/squash/PointPresentation.js; src/game_engine.js; index.html; public/styles.css. Read-only: CourtGeometry front-wall transparency and existing camera restoration.
- **Do**: Open every recorded point replay from the front side looking rearward, cut into the opening, then orbit and zoom. Apply front-wall transparency while needed; restore on exit. Replace the central replay banner with a small bordered corner toast and brief pulse. Preserve recorded action, scoring, settling and input skip.
- **Verify / Accept**: Observe front- and rear-court replay openings and return to the normal whole-court camera. No automated tests. Record evidence in DOCS/VERIFICATION/gameplay-followup.md.

## TASK-49 — Red-player identity and visible shot decisions

- **Status**: [X]
- **Dependencies**: [] (baseline 178584f).
- **Files**: src/game_engine.js; src/motion_controls.js; src/squash/OpponentAI.js; index.html; public/styles.css. Read-only: existing character torso, HudUI, shot execution and spectator nudge flow.
- **Do**: Mark both sides of red's jersey YOU. Label red ownership in scoreboard and shot controls for solo/spectator play. Display red's planned and committed shot family on the five chips, blinking once per new choice/change and holding the highlight; blue cannot overwrite it. Show volley context without changing input selection or AI tactics. Respect reduced motion.
- **Verify / Accept**: Observe red jersey and mode guidance, a red shot choice/change and its persistent chip through blue's turn; inspect spectator influence and solo controls. No automated tests. Record observations in DOCS/VERIFICATION/gameplay-followup.md.

## TASK-40 — AI attacking execution accuracy

- **Status**: ✅
- **Dependencies**: [] (each task can be implemented and verified on 7b1df9b). Integrate serially because existing files overlap.
- **Files**: src/squash/OpponentAI.js; src/squash/ShotController.js; src/squash/TuningConfig.js; src/squash/TuningPanel.js; tests/ai-accuracy.test.mjs. Read-only baseline interfaces: BallPhysics, RulesEngine, CourtGeometry, StrokeMotion, tuningStore and existing tests.
- **Architecture**: §4.2; complete behavior contract is reproduced in Do and Accept here.
- **Do**: Change winner-margin chance to configurable 0.20. Add configurable yaw/elevation/pace bounds and sample once at committed AI low-attack execution. Apply after the physical solver, skip intentional errors, preserve humans/drives/lobs. Expose tuning sliders. Add focused behavioral regressions first and observe failure. Implement and re-read affected contact/state paths. Record evidence in DOCS/VERIFICATION/smart-volleys/RESULTS.md.
- **Verify**: focused named test file in Files, then `node --test tests/*.test.mjs` and `npm --ignore-scripts run lint` on native Windows.
- **Accept**: Seeded actual-physics distribution reduces nick successes; mirrored finite results, bounded perturbation, deterministic random use, intentional errors and human trajectories unchanged. Named commands exit 0, no skipped tests/placeholders and no relaxed existing assertions. [X] only records implementation.
- **Independent validation**: reviewer evaluates this entity against architecture and tests; actual rendered protocol is recorded separately per TEST_RUBRIC.

## TASK-41 — Reachable volleys and volley drops across the court

- **Status**: ✅
- **Dependencies**: [] (each task can be implemented and verified on 7b1df9b). Integrate serially because existing files overlap.
- **Files**: src/squash/VolleyPlanner.js (new); src/squash/OpponentAI.js; src/squash/ShotController.js; src/squash/PlayerMovement.js; src/game_engine.js; tests/volley-planner.test.mjs; tests/engine-fixture.mjs (baseline-compatible fixture). Read-only baseline interfaces: BallPhysics, RulesEngine, CourtGeometry, StrokeMotion, tuningStore and existing tests.
- **Architecture**: §4.3; complete behavior contract is reproduced in Do and Accept here.
- **Do**: Implement the pure contact planner with sample age, movement/reaction/preparation/reach and interference. AI chooses it before all back-wall patience gates. Integrate human queued chip/key input and automatic movement within 0.52 s. Keep the live scheduled contact and bounced-ball fallback. Set isVolley from actual bounce count at any depth and preserve requested family/disguise. Add safe cross-corner drop assistance while honoring explicit aim. Add focused behavioral regressions first and observe failure. Implement and re-read affected contact/state paths. Record evidence in DOCS/VERIFICATION/smart-volleys/RESULTS.md.
- **Verify**: focused named test file in Files, then `node --test tests/*.test.mjs` and `npm --ignore-scripts run lint` on native Windows.
- **Accept**: Mirrored front/mid/rear volleys and drops; deny unreachable/too-high/blocked/expired contacts; good deep length stays unvolleyable for a poorly placed actor; existing post-bounce solves pass; human early drop and family labels pass. Named commands exit 0, no skipped tests/placeholders and no relaxed existing assertions. [X] only records implementation.
- **Independent validation**: reviewer evaluates this entity against architecture and tests; actual rendered protocol is recorded separately per TEST_RUBRIC.

## TASK-42 — Visible aftermath and actual cinematic point replay

- **Status**: ✅
- **Dependencies**: [] (each task can be implemented and verified on 7b1df9b). Integrate serially because existing files overlap.
- **Files**: src/squash/PointPresentation.js (new); src/game_engine.js; index.html; tests/point-presentation.test.mjs; tests/engine-fixture.mjs (self-contained fixture with optional presentation injection). Read-only baseline interfaces: BallPhysics, RulesEngine, CourtGeometry, StrokeMotion, tuningStore and existing tests.
- **Architecture**: §4.4; complete behavior contract is reproduced in Do and Accept here.
- **Do**: Implement bounded recorded snapshots and collision focus; cloned live-physics settle without rules; recorded four-second replay with orbit/zoom; scoring once and deferred next-serve/game/match transitions. Record/render actual actor/racket transforms. Capture any fresh key/pointer gesture and swallow repeat/up/click chain; cancel on restart and respect pause. Keep onboarding demo separate. Add focused behavioral regressions first and observe failure. Implement and re-read affected contact/state paths. Record evidence in DOCS/VERIFICATION/smart-volleys/RESULTS.md.
- **Verify**: focused named test file in Files, then `node --test tests/*.test.mjs` and `npm --ignore-scripts run lint` on native Windows.
- **Accept**: Actual recorded frames reproduce without random/rule calls; settle bounds, rolling nick/out/tin motion, one score, match/game deferral, skip input swallowing and reset/cancel pass. Named commands exit 0, no skipped tests/placeholders and no relaxed existing assertions. [X] only records implementation.
- **Independent validation**: reviewer evaluates this entity against architecture and tests; actual rendered protocol is recorded separately per TEST_RUBRIC.

## TASK-43 — Serve positioning and stable readiness

- **Status**: ✅
- **Dependencies**: [] (each task can be implemented and verified on 7b1df9b). Integrate serially because existing files overlap.
- **Files**: src/squash/ServeSetup.js (new); src/game_engine.js; tests/serve-setup.test.mjs; tests/engine-fixture.mjs (baseline-compatible fixture; no sibling module imports). Read-only baseline interfaces: BallPhysics, RulesEngine, CourtGeometry, StrokeMotion, tuningStore and existing tests.
- **Architecture**: §4.5; complete behavior contract is reproduced in Do and Accept here.
- **Do**: Implement authoritative-side setup readiness and correction targets. Gate toss and contact; wait for arrival and 0.2 s stability. Announce/correct wrong-box crowding with no point penalty, retain true contact foot faults. Invalidate delayed setup operations with point tokens. Add focused behavioral regressions first and observe failure. Implement and re-read affected contact/state paths. Record evidence in DOCS/VERIFICATION/smart-volleys/RESULTS.md.
- **Verify**: focused named test file in Files, then `node --test tests/*.test.mjs` and `npm --ignore-scripts run lint` on native Windows.
- **Accept**: Both service sides/server roles, moving/non-arrived server, same-box receiver and overlap rejected; clear receiver anywhere outside protected box accepted; correction no scoring; stable legal setup serves; stale callback cannot move/score later point. Named commands exit 0, no skipped tests/placeholders and no relaxed existing assertions. [X] only records implementation.
- **Independent validation**: reviewer evaluates this entity against architecture and tests; actual rendered protocol is recorded separately per TEST_RUBRIC.




## TASK-44 — Human attack precision rewards actual contact quality

- **Status**: ✅
- **Dependencies**: [] (standalone on 7b1df9b; recognize explicit AI execution ownership within this task if absent).
- **Files**: src/squash/ShotController.js; src/squash/OpponentAI.js; src/game_engine.js; tests/human-contact-quality.test.mjs; tests/diagnostic-randomness.test.mjs (explicit AI ownership, unchanged assertions). Read-only: BallPhysics, CourtGeometry, existing motion and solver tests.
- **Architecture**: §4.6, added from operator clarification that easy killer shots teach poor real-world tactics.
- **Do**: Evaluate actual contact pocket/balance once at human committed low attack. Preserve exact precision only in compact balanced contact pocket; deterministic margin opens on stretch, mistiming and rushed movement. No random human misses. Explicit shot family/aim remain, no contact teleport. Expose useful contact-quality feedback. AI ownership is explicit, independent of actor role; manual spectator nudges are human execution.
- **Verify**: node --test tests/human-contact-quality.test.mjs; full Node suite and lint.
- **Accept**: Perfect-pocked and poor-pocket attacks have distinct real-physics nick rates; repeated same human input produces same result without random calls; drive/lob unchanged; real missing contact still misses; all existing motion and solver invariants pass. [X] is implementation only.
- **Independent validation**: inspect contact quality behavior and UI feedback, preserve operator feel assessment separately.




## TASK-45 — Keep the whole court in the gameplay viewport

- **Status**: ✅
- **Dependencies**: [] (standalone on 7b1df9b).
- **Files**: src/squash/CourtCamera.js; src/game_engine.js; tests/court-camera.test.mjs. Read-only: CourtGeometry, Three perspective projection.
- **Architecture**: §4.7; operator meant normal camera, not numbered View 8.
- **Do**: Fit all court floor corners and legal wall envelope within the actual perspective frustum plus HUD margin. Keep existing direction, FOV and bounded lateral tracking. Apply to normal rally/auto and serve views; resize must fit immediately. On cinematic exit restore gameplay framing. Inspect real desktop and mobile-width rendering. Historical source camera constants match; observed regression cause is not attributed to an unverified commit.
- **Verify**: node --test tests/court-camera.test.mjs; full tests and lint; actual browser screenshots for landscape/portrait.
- **Accept**: All named court boundary projections fit inside specified screen margins at desktop, landscape and portrait aspects and extreme actor/ball lateral positions; camera transitions/resize do not crop live play. Independent visual gate separate.


Independent source/deterministic review accepted all six entities at d8ad00d after follow-up repairs. Review evidence and the separate browser/deployment gates: DOCS/VERIFICATION/smart-volleys/RESULTS.md.
