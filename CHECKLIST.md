# Squash Arcade — approved independent implementation checklist

Architecture: DOCS/ARCHITECTURE.md v2.4.0. User approved implementation on 2026-10-21. Baseline: GitHub 7b1df9b. Historical tasks and operator gates remain in DOCS/HISTORY/CHECKLIST-before-smart-volleys.md; no older pending roadmap is silently included.

Four states: `[ ]` unstarted -> `[/]` undertaking -> `[X]` implemented with verification -> `✅` independently semantically validated. AP1–4 adopted; AP5 remains draft. No test-only sibling task and no external live service in coder Accept.

## TASK-40 — AI attacking execution accuracy

- **Status**: [X]
- **Dependencies**: [] (each task can be implemented and verified on 7b1df9b). Integrate serially because existing files overlap.
- **Files**: src/squash/OpponentAI.js; src/squash/ShotController.js; src/squash/TuningConfig.js; src/squash/TuningPanel.js; tests/ai-accuracy.test.mjs. Read-only baseline interfaces: BallPhysics, RulesEngine, CourtGeometry, StrokeMotion, tuningStore and existing tests.
- **Architecture**: §4.2; complete behavior contract is reproduced in Do and Accept here.
- **Do**: Change winner-margin chance to configurable 0.20. Add configurable yaw/elevation/pace bounds and sample once at committed AI low-attack execution. Apply after the physical solver, skip intentional errors, preserve humans/drives/lobs. Expose tuning sliders. Add focused behavioral regressions first and observe failure. Implement and re-read affected contact/state paths. Record evidence in DOCS/VERIFICATION/smart-volleys/RESULTS.md.
- **Verify**: focused named test file in Files, then `node --test tests/*.test.mjs` and `npm --ignore-scripts run lint` on native Windows.
- **Accept**: Seeded actual-physics distribution reduces nick successes; mirrored finite results, bounded perturbation, deterministic random use, intentional errors and human trajectories unchanged. Named commands exit 0, no skipped tests/placeholders and no relaxed existing assertions. [X] only records implementation.
- **Independent validation**: reviewer evaluates this entity against architecture and tests; actual rendered protocol is recorded separately per TEST_RUBRIC.

## TASK-41 — Reachable volleys and volley drops across the court

- **Status**: [X]
- **Dependencies**: [] (each task can be implemented and verified on 7b1df9b). Integrate serially because existing files overlap.
- **Files**: src/squash/VolleyPlanner.js (new); src/squash/OpponentAI.js; src/squash/ShotController.js; src/squash/PlayerMovement.js; src/game_engine.js; tests/volley-planner.test.mjs. Read-only baseline interfaces: BallPhysics, RulesEngine, CourtGeometry, StrokeMotion, tuningStore and existing tests.
- **Architecture**: §4.3; complete behavior contract is reproduced in Do and Accept here.
- **Do**: Implement the pure contact planner with sample age, movement/reaction/preparation/reach and interference. AI chooses it before all back-wall patience gates. Integrate human queued chip/key input and automatic movement within 0.52 s. Keep the live scheduled contact and bounced-ball fallback. Set isVolley from actual bounce count at any depth and preserve requested family/disguise. Add safe cross-corner drop assistance while honoring explicit aim. Add focused behavioral regressions first and observe failure. Implement and re-read affected contact/state paths. Record evidence in DOCS/VERIFICATION/smart-volleys/RESULTS.md.
- **Verify**: focused named test file in Files, then `node --test tests/*.test.mjs` and `npm --ignore-scripts run lint` on native Windows.
- **Accept**: Mirrored front/mid/rear volleys and drops; deny unreachable/too-high/blocked/expired contacts; good deep length stays unvolleyable for a poorly placed actor; existing post-bounce solves pass; human early drop and family labels pass. Named commands exit 0, no skipped tests/placeholders and no relaxed existing assertions. [X] only records implementation.
- **Independent validation**: reviewer evaluates this entity against architecture and tests; actual rendered protocol is recorded separately per TEST_RUBRIC.

## TASK-42 — Visible aftermath and actual cinematic point replay

- **Status**: [X]
- **Dependencies**: [] (each task can be implemented and verified on 7b1df9b). Integrate serially because existing files overlap.
- **Files**: src/squash/PointPresentation.js (new); src/game_engine.js; tests/point-presentation.test.mjs; tests/engine-fixture.mjs (self-contained fixture with optional presentation injection). Read-only baseline interfaces: BallPhysics, RulesEngine, CourtGeometry, StrokeMotion, tuningStore and existing tests.
- **Architecture**: §4.4; complete behavior contract is reproduced in Do and Accept here.
- **Do**: Implement bounded recorded snapshots and collision focus; cloned live-physics settle without rules; recorded four-second replay with orbit/zoom; scoring once and deferred next-serve/game/match transitions. Record/render actual actor/racket transforms. Capture any fresh key/pointer gesture and swallow repeat/up/click chain; cancel on restart and respect pause. Keep onboarding demo separate. Add focused behavioral regressions first and observe failure. Implement and re-read affected contact/state paths. Record evidence in DOCS/VERIFICATION/smart-volleys/RESULTS.md.
- **Verify**: focused named test file in Files, then `node --test tests/*.test.mjs` and `npm --ignore-scripts run lint` on native Windows.
- **Accept**: Actual recorded frames reproduce without random/rule calls; settle bounds, rolling nick/out/tin motion, one score, match/game deferral, skip input swallowing and reset/cancel pass. Named commands exit 0, no skipped tests/placeholders and no relaxed existing assertions. [X] only records implementation.
- **Independent validation**: reviewer evaluates this entity against architecture and tests; actual rendered protocol is recorded separately per TEST_RUBRIC.

## TASK-43 — Serve positioning and stable readiness

- **Status**: [X]
- **Dependencies**: [] (each task can be implemented and verified on 7b1df9b). Integrate serially because existing files overlap.
- **Files**: src/squash/ServeSetup.js (new); src/game_engine.js; tests/serve-setup.test.mjs; tests/engine-fixture.mjs (baseline-compatible fixture; no sibling module imports). Read-only baseline interfaces: BallPhysics, RulesEngine, CourtGeometry, StrokeMotion, tuningStore and existing tests.
- **Architecture**: §4.5; complete behavior contract is reproduced in Do and Accept here.
- **Do**: Implement authoritative-side setup readiness and correction targets. Gate toss and contact; wait for arrival and 0.2 s stability. Announce/correct wrong-box crowding with no point penalty, retain true contact foot faults. Invalidate delayed setup operations with point tokens. Add focused behavioral regressions first and observe failure. Implement and re-read affected contact/state paths. Record evidence in DOCS/VERIFICATION/smart-volleys/RESULTS.md.
- **Verify**: focused named test file in Files, then `node --test tests/*.test.mjs` and `npm --ignore-scripts run lint` on native Windows.
- **Accept**: Both service sides/server roles, moving/non-arrived server, same-box receiver and overlap rejected; clear receiver anywhere outside protected box accepted; correction no scoring; stable legal setup serves; stale callback cannot move/score later point. Named commands exit 0, no skipped tests/placeholders and no relaxed existing assertions. [X] only records implementation.
- **Independent validation**: reviewer evaluates this entity against architecture and tests; actual rendered protocol is recorded separately per TEST_RUBRIC.




## TASK-44 — Human attack precision rewards actual contact quality

- **Status**: [X]
- **Dependencies**: [] (standalone on 7b1df9b; recognize explicit AI execution ownership within this task if absent).
- **Files**: src/squash/ShotController.js; src/squash/OpponentAI.js; src/game_engine.js; tests/human-contact-quality.test.mjs. Read-only: BallPhysics, CourtGeometry, existing motion and solver tests.
- **Architecture**: §4.6, added from operator clarification that easy killer shots teach poor real-world tactics.
- **Do**: Evaluate actual contact pocket/balance once at human committed low attack. Preserve exact precision only in compact balanced contact pocket; deterministic margin opens on stretch, mistiming and rushed movement. No random human misses. Explicit shot family/aim remain, no contact teleport. Expose useful contact-quality feedback. AI ownership is explicit, independent of actor role; manual spectator nudges are human execution.
- **Verify**: node --test tests/human-contact-quality.test.mjs; full Node suite and lint.
- **Accept**: Perfect-pocked and poor-pocket attacks have distinct real-physics nick rates; repeated same human input produces same result without random calls; drive/lob unchanged; real missing contact still misses; all existing motion and solver invariants pass. [X] is implementation only.
- **Independent validation**: inspect contact quality behavior and UI feedback, preserve operator feel assessment separately.




## TASK-45 — Keep the whole court in the gameplay viewport

- **Status**: [X]
- **Dependencies**: [] (standalone on 7b1df9b).
- **Files**: src/squash/CourtCamera.js; src/game_engine.js; tests/court-camera.test.mjs. Read-only: CourtGeometry, Three perspective projection.
- **Architecture**: §4.7; operator meant normal camera, not numbered View 8.
- **Do**: Fit all court floor corners and legal wall envelope within the actual perspective frustum plus HUD margin. Keep existing direction, FOV and bounded lateral tracking. Apply to normal rally/auto and serve views; resize must fit immediately. On cinematic exit restore gameplay framing. Inspect real desktop and mobile-width rendering. Historical source camera constants match; observed regression cause is not attributed to an unverified commit.
- **Verify**: node --test tests/court-camera.test.mjs; full tests and lint; actual browser screenshots for landscape/portrait.
- **Accept**: All named court boundary projections fit inside specified screen margins at desktop, landscape and portrait aspects and extreme actor/ball lateral positions; camera transitions/resize do not crop live play. Independent visual gate separate.

