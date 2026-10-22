# Squash Arcade — approved independent implementation checklist

Architecture: DOCS/ARCHITECTURE.md v2.6.4. User approved initial implementation on 2026-10-21; later requests are identified per item. Initial baseline: GitHub 7b1df9b. Historical tasks and operator gates remain in DOCS/HISTORY/CHECKLIST-before-smart-volleys.md; no older pending roadmap is silently included.

Four states: `[ ]` unstarted -> `[/]` undertaking -> `[X]` implemented with verification -> `✅` independently semantically validated. AP1–4 adopted; AP5 remains draft. No test-only sibling task and no external live service in coder Accept.

Current operator override: no automated tests for follow-up work. TASK-40–45 test commands below are historical completed-release instructions, not current gates. TASK-46–48 are independent on release 178584f; each includes its own implementation and focused browser observation. No task requires another follow-up task.

## TASK-58 — Keep one racket hand and remove backhand grip jumps

- **Status**: [/]
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
