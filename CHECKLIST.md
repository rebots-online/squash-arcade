---
checklist_id: "ARGON-SQUASH-DAG-002"
version: "2.3.0"
status: "FOUR_STATE_DISCIPLINE_ADOPTED_PENDING_SIGNOFF"
architecture_ref: "DOCS/ARCHITECTURE.md (v2.3.0, §5.9 Honest Shot Law + §5 Planned Refinements)"
target_executor: "GLM-5.3 / Non-Reasoning Execution Agent"
kstore_meta:
  namespace: "argon.squash.v2.tasks"
  execution_policy: "sequential_dag_verified"
  rollback_strategy: "module_level_preset_snapshot"
  deterministic_seed_default: 20261015
supersedes: "ARGON-SQUASH-DAG-001 (TASK-01..14 all COMPLETED)"
---

# ARGON SQUASH — EXECUTION CHECKLIST (`CHECKLIST.md`)

Dependency-ordered recipe for the **remaining outstanding work** defined in `DOCS/ARCHITECTURE.md` §5. The TASK-01..14 core engine build is complete; this checklist covers only the approved refinements plus deployment cleanup, for operator review and sign-off before implementation.

---

## Task Marker Discipline (four-state, canonical)

> `[ ]` Task → `[/]` Undertaken Task → `[X]` Completed Task → `✅` Orchestrator-semantically-validated-as-complete Task

- `[ ]` — one-coder-one-task logical execution block; sum-total of `[ ]` tasks comprises the assembly of `ARCHITECTURE.md`.
- `[/]` — flipped by the assigned coder to acknowledge assignment (task line suffixed with coder session id where possible).
- `[X]` — flipped by the coder on completion of `Do` with `Verify` run.
- `✅` — flipped ONLY by the Orchestrator upon semantic validation against the architecture entity row (never proxy attestation — a grep/exit code alone never justifies ✅; a grep/exit code plus direct semantic evaluation of the entity does).

Historical tasks TASK-15..TASK-24 are recorded `[X]` (implemented and committed in prior sessions); ✅ backfill for that group is an operator action, not assumed here. Every `Accept` clause below is an idempotent end-state assertion (AP-1..AP-5): observable from any starting state, including post-success.

---

## Orchestration Task Graph (DAG)

```
COMPLETED GROUP ([X], TASK-15..24 — prior sessions):

[TASK-15 Back-Wall Line]─►[TASK-16 FRONT_WALL_CAM]─►[TASK-17 Serve Errors]
        └►[TASK-18 G-Dependency Cleanup]─►[TASK-19 surge Deploy]
[TASK-20 Skills Demo] [TASK-21 Audio] [TASK-22 Original-7] [TASK-23 Retrieval] [TASK-24 Ceremony]

FIX GROUP (§5.9 shot law + §5.10 jukebox — all `[ ]` PENDING, NO inter-task dependencies — any order, one coder per task):

  [TASK-25 COR]   [TASK-26 Envelopes+Params]   [TASK-27 solveCornerLob]   [TASK-28 Serve+Corkscrew]
  [TASK-29 Punish+Errors]   [TASK-30 Difficulty+Fatigue]   [TASK-31 Grades+Rating]   [TASK-32 test_shot_law_lob]
  [TASK-33 Jukebox De-Argon + All-14 Default]
```


### Order Independence (any task, any order, one coder per task)

Every task in the §5.9 group is self-contained and may be coded and dispatched in ANY order, on a fresh clone, with no sibling task landed:
- Each task codes ONLY against **shipped** interfaces (`BallPhysics.simulateTrajectory`, existing params objects, existing methods) — never a static import of another task's new symbol.
- Cross-task values pass through runtime lookups with **fallback defaults** pinned in the task text (e.g. `params.movementAndAI.aiExecutionSkill ?? 0.65`), so the code is correct in isolation and automatically composes when the sibling lands.
- Accept clauses are idempotent end-state assertions that **fail cleanly** (assert false, never crash/halt) while their subject entity is absent, and pass once it exists — consistent truth from any starting state (AP-1).
- Same-file pairs (TASK-27/28 on `ShotController.js`, TASK-30/31 on `game_engine.js`) are each additive in disjoint regions; the sequential commit policy (`kstore_meta.execution_policy`) serializes their landings — no merge window.

---

## Ordered Tasks & Acceptance Gates

### `TASK-15` — Lighter Back-Wall Out Line
- **Status**: `[X]` COMPLETED
- **Owner Module**: `src/squash/CourtGeometry.js`
- **Architecture Ref**: `§5.2`, Gate H
- **Depends On**: `[]`
- **kstore Key**: `argon.squash.v2.tasks.TASK-15`
- **Deliverables**:
  - New `materials.backOutLine` (`MeshBasicMaterial`, `transparent: true`, `opacity ≈ 0.38`, lighter red `0xf87171`) in `_createMaterials`.
  - Back-wall out mesh in `_buildCourtMarkings` switched from shared `materials.outLine` to `materials.backOutLine`.
  - Per-theme `backOutLine` styling in `applyTheme` for `psa_glass` / `hardwood_club` / `neon_studio`.
- **Acceptance Gate (H)**: Back-wall out line renders at reduced opacity/lighter tint in all three themes; front and side out lines unchanged.

### `TASK-16` — `FRONT_WALL_CAM` Viewpoint in Camera Cycle
- **Status**: `[X]` COMPLETED
- **Owner Modules**: `src/game_engine.js`, `src/squash/CourtGeometry.js`
- **Architecture Ref**: `§5.3`, Gate I
- **Depends On**: `["TASK-15"]`
- **kstore Key**: `argon.squash.v2.tasks.TASK-16`
- **Deliverables**:
  - `'FRONT_WALL_CAM'` added to `onCycleCamera` `modes` + `labels` (`'Front Wall'`).
  - `_computeTargetCameraPose` branch: `targetPos ≈ (0, 2.8, -4.4)`, `targetLook ≈ (0, 1.0, +3.5)` (front wall looking toward back glass).
  - `setFrontWallTransparency(true)` while `FRONT_WALL_CAM` is the effective mode; `false` on exit.
- **Acceptance Gate (I)**: `C` cycles through all five labels ending in `Front Wall`; front wall is transparent and full back court visible; wrap-around returns to `Back Glass`.

### `TASK-17` — Two-Tier AI Serve Errors (Wrong Box + Foot Fault)
- **Status**: `[X]` COMPLETED
- **Owner Modules**: `src/squash/RulesEngine.js`, `src/game_engine.js`, `src/squash/TuningConfig.js`, `src/squash/TuningPanel.js`, `src/mii_facial_fx.js` (flavor only)
- **Architecture Ref**: `§5.1`, Gate G
- **Depends On**: `["TASK-16"]`
- **kstore Key**: `argon.squash.v2.tasks.TASK-17`
- **Deliverables**:
  - `movementAndAI` tuning params: `aiServeWrongBoxChance` (≈0.06), `aiServeSelfCorrectChance` (≈0.55), `aiServeFootFaultChance` (≈0.015); sliders in `TuningPanel`.
  - `_getServeStandingPositions`: AI wrong-box roll flips `isRightBox` for server `targetPos` only; self-correct roll shows a mid-stance walk to the correct box plus a confused `FACIAL_STATES` expression.
  - `RulesEngine.evaluateServeStanceLegality(serverPos, serviceSide)` -> `'WRONG_BOX'` | `'FOOT_FAULT'` | `null` (half-court `|x| < 0.22` or `z < SHORT_LINE_Z + 0.02` at toss), checked in `_startServeToss`.
  - `formatRefereeCallout` prefixes: `'wrong box'` -> `Fault!`, `'foot fault'` -> `Foot fault!`; both lose the rally (handout) per WSF.
- **Acceptance Gate (G)**: `aiServeWrongBoxChance=1` forces a visible wrong-box approach; legality check returns fault kinds deterministically; `Fault!`/`Foot fault!` callouts fire and handout is awarded.

### `TASK-18` — Google Dependency Cleanup & Static-Host Boundary
- **Status**: `[X]` COMPLETED
- **Owner Modules**: `package.json`, `vite.config.ts`, `README.md`
- **Architecture Ref**: `§5.4`, `§3.16`
- **Depends On**: `["TASK-17"]`
- **kstore Key**: `argon.squash.v2.tasks.TASK-18`
- **Deliverables**:
  - Remove `@google/genai` (never imported) and the `GEMINI_API_KEY` define.
  - README: document surge.sh solo-play boundary vs `/api/*` relay (multiplayer + phone controllers).
- **Acceptance Gate**: `npm run build` and `npm run dev` succeed with no Gemini/genai references remaining; `/api/*` middleware still works under `vite preview`.

### `TASK-19` — surge.sh Static Deploy Verification
- **Status**: `[X]` COMPLETED
- **Owner**: `dist/` (build output)
- **Architecture Ref**: `§3.16`
- **Depends On**: `["TASK-18"]`
- **kstore Key**: `argon.squash.v2.tasks.TASK-19`
- **Deliverables**:
  - `npm run build` -> `npx surge ./dist squash-arcade.surge.sh`; verify solo play end-to-end (rally, referee callouts, jukebox, all camera modes).
  - Confirm companion/room flows degrade gracefully (no crash) where `/api/*` is absent.
- **Acceptance Gate**: Deployed site boots and rallies with zero console errors on a clean browser profile.

### `TASK-20` — Skills Demonstration Onboarding (Wonder-Demo Rework)
- **Status**: `[X]` COMPLETED
- **Owner Modules**: `src/squash/IntroDirector.js`, `src/squash/NickCollisionModel.js`, `src/hud_ui.js`, `index.html` (copy)
- **Architecture Ref**: `§5.5`, `§3.8`, Gate J
- **Depends On**: `["TASK-17"]`
- **kstore Key**: `argon.squash.v2.tasks.TASK-20`
- **Deliverables**:
  - Reframe the two-part "wonder demo" intro as an enumerated **Skills Demonstration**: Serve, Straight Drive, Cross-Court Drive, Drop/Cut Drop, Boast (2-wall + back-wall), Lob, Volley, Nick finish — each step labeled `SKILL n/8 — <NAME>` with a one-line description.
  - New `NickCollisionModel.getNickLabScenario` entries for skills not yet scripted; slow-mo replay inspection stays as capstone; `skipToPlayableMatch` unchanged.
  - Copy sweep: remove "wonder"/mystery framing from HUD banners, intro copy, and menu strings; keep the physical demo shots identical (same physics, new labels).
- **Acceptance Gate (J)**: Onboarding presents a clearly labeled skills walkthrough; each demonstrated shot is named for its squash skill on screen; skip-to-play still works; no unexplained "wonder" framing remains in user-facing text.

### `TASK-21` — Audio Autoplay & Jukebox Rotation Restoration
- **Status**: `[X]` COMPLETED
- **Owner Modules**: `src/audio_engine.js`
- **Architecture Ref**: `§5.6`, `§3.12` (runtime invariants)
- **Depends On**: `["TASK-19"]`
- **kstore Key**: `mba.robin.squasharcade.tasks.TASK-21`
- **Deliverables**:
  - Muted-start autoplay: `el.muted=true` before `el.play()`, unmute on `'playing'` — audible music on load for `'audio'` tracks without a gesture.
  - `STATE_TO_TRACK` restore: boot-visible states back to the 4 legacy mp3s (`title/menu/select→menu_theme`, `serve*/rally/playing/match/point→match_rally`, `intro/start/flyover→court_intro`, `victory/win/match_over/celebration→victory_fanfare`, `replay/gamepoint/game_won→match_rally`/`victory_fanfare`); 7 synth originals remain jukebox-only.
  - Remove silent auto-`'locked'` in `nextJukeboxTrack`/`prevJukeboxTrack` — manual skip is not a lock.
  - Audio-track rotation: `ended` → shuffle→random next / auto→sequential next / locked→replay; `el.loop` toggled `track.loop && mode==='locked'`.
  - `_welcomePlayed` set only after `_ensureContext()` succeeds.
- **Acceptance Gate**: Hard-reload of deployed site produces audible title music with zero clicks; jukebox ⏭/⏮ skips without disabling rotation; auto mode advances across mp3 tracks on `ended`; no console errors.

---

## TASK-22 — Original-7 first: state map revert, sound-gate, per-track timbre, camera pill

- **Status**: `[X]` COMPLETED (deployed; pending user audio-verify)
- **Owner Modules**: `src/audio_engine.js`, `index.html`, `public/styles.css`, `src/game_engine.js` (camera pill)
- **Architecture Ref**: `ARCHITECTURE.md §5.6`; Gate — audio autoplay + `§5.3` camera cycle
- **Depends On**: `["TASK-21"]`

**Why**: TASK-21's mp3 remap made the game open on legacy Argon Tennis tracks (jukebox #12 "CLASSIC"). Operator directive: begin on track #1 of the NEW 7 Argon Squash originals; the 7 originals must sound distinct (they read as variants of #8); browsers still gate AudioContext behind a gesture — addressed with an explicit, prominent unlock control instead of mp3 fallback.

- **Deliverables**:
  - `STATE_TO_TRACK` reverted to the 7 original synths (`title/menu/select->argon_glass_overture`, `intro/start/flyover->crimson_tin_fanfare`, `serve*/rally/point/match->physical_chess_protocol`, `gamepoint->nick_roller_overdrive`, `replay->alexandria_showcourt_nights`, `victory/win/match_over/celebration->psa_championship_crown`, `game_won->forearm_cut_funk`). Tennis mp3s stay jukebox-only. (Muted-start/`ended`/no-auto-lock fixes retained for 'audio' tracks.)
  - **Sound-gate**: `#btn-sound-gate` "CLICK HERE FOR SOUND" — fixed pulsing CTA in `index.html`/`styles.css`; hides via `AudioContext statechange` the instant audio runs, so it NEVER renders in native builds (WebView `mediaPlaybackRequiresUserGesture=false` starts ctx 'running') and vanishes on first gesture in browsers.
  - **Timbre differentiation** (`_playSynthStep`): `TRACK_DRUM_KIT` per-track kick pitch/decay, snare BP, hat density (sparse/eighth/sixteenth); `drive` waveshaper (tanh) param on `_triggerSynthVoice`; signature voices — #1 fifth-swell pad, #2 chess-clock "tock", #3 unison brass stab + 65Hz timpani, #4 acid arp now driven (drive 3.2) + 49Hz sub-thump, #5 Hijaz marimba filter-sweep + ney-like drone pad, #6 slap-bass pops + palm-muted chick, #7 crowd crash + 3-voice supersaw lead.
  - **Camera**: `btn-top-camera-cycle` was never bound (dead pill) — now bound alongside `btn-camera-cycle`; `updateCameraLabel` drives both `camera-mode-label` and `camera-mode-label-top`. Cycle reaches FRONT_WALL_CAM.
- **Verification**: `node --check` both edited files pass; `vite build` clean; deployed `index-DGvXiZp4.js` live — bundle contains sound-gate, TRACK_DRUM_KIT, top-pill binding, original-7 map.
- **Pending user verify**: hard-refresh shows the sound gate (not silent-confusing), one click starts Argon Glass Overture; jukebox skips differentiate tracks audibly; Cam pill cycles to "Front Wall".

**Later / suggestions**:
- Operator suggestion noted: mail feedback opposing browser autoplay kneecapping (control ceded to abuse-driven policy) to **Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA** (USPS letter campaign idea — "flood them"). If in Canada and budget allows: preprinted postage-included **"Don't Be Evil" reminder** mailers for the same campaign.
- DEFERRED: prerender the 7 synth tracks to vendored audio files (OfflineAudioContext render + lamejs/ffmpeg encode) so they too can bypass the gesture gate. shelved per operator.

---

## TASK-23 — Retrieval Mechanics: timed arrival + hip-drive swing

- **Status**: `[X]` COMPLETED (deployed; supersedes the arrive-plant-flap bug — see body)
- **Owner Modules**: `src/squash/PlayerMovement.js`, `src/squash/OpponentAI.js`, `src/game_engine.js`
- **Architecture Ref**: `ARCHITECTURE.md §5.7` (all bullets except the recorded-failed deep-lob line)
- **Depends On**: `["TASK-19"]`

**Shipped**: `PlayerMovement._estimateContactTimeSec` (nearest trajectory-sample `t`; distance/speed fallback post-back-wall), `_applyTimedArrival` (paces `targetPos` to a fraction of remaining distance that fits inside contact lead — arrive ~100ms early still stepping; drives `strokeWindupYaw` closed-stance ramp last 0.55s), hip-snap yaw override in `stepActorLocomotion` (closed→open smoothstep 0.3→0.82 of swing progress, follow-through over-rotate). Wired for both human receiver (`updatePlayerRallyTarget`) and AI receiver (`OpponentAI.updateAI` + windup reset on recovery). Live bundle `index-B3-_Hh1S.js`.

**Bug**: Actors lerp straight to the intercept and stand flat-footed waiting for the ball — the #1 real-squash bad habit. Worst in back corners where it reads as silver-platter retrieval. Swing is arm-flap, no body drive.

**Requirement** (operator): arrive *just before* contact; power comes from hips OPENING UP toward the front wall — not arms.

**Grounded anchors**:
- `PlayerMovement.updatePlayerRallyTarget` (`src/squash/PlayerMovement.js` ~L31-116): sets `targetPos` = intercept (firstFloorBouncePos) + 0.42m lateral spacing — no time awareness.
- `PlayerMovement.stepActorLocomotion` (~L125): accel/inertia + arrivalRamp → decelerates to full stop at target; yaw lerp at ~L194 already faces front wall with subtle ball-turn — natural hook for hip rotation.
- Intercept source: `currentPredictedTrajectory?.firstFloorBouncePos` (`game_engine.js` ~L3521); ball flight gives contact time.
- Swing trigger: `pendingUserSwing` / `_attemptPlayerRallyStrike` / `shotController.updatePreparation`.

**Plan**:
1. **Contact-time model** — derive `tContact` for the receiver from the predicted trajectory (time until ball reaches the strike point/second-bounce window). Compute actor travel time `dist/(maxSpeed * recoveryScale)`.
2. **Staged approach** — when `travelTime < tContact - margin`, hold a staging point *behind the ball's line* (between T and intercept); only release to final target so the actor is still decelerating/moving through the shot at contact. Back-corner intercepts (z>~3, |x|>~1.5) keep incoming momentum — lunge lean, no stop-then-hit. (Split-step optional/de-emphasized per operator — the visible point is: never arrive-plant-flap.)
3. **Hip opening = power** — closed-stance windup (root yaw rotated ~0.3-0.5 rad off front wall + racket back), then yaw snaps open through the front-wall direction AT contact; swing speed/power scale with hip angular velocity. Reuse the existing yaw lerp target + add torso/lean terms; racket arm follows the body, not vice-versa.
4. **Recovery unchanged** — post-shot T-recovery path (`getTRecoveryPosition`) already exists; ensure arrival staging doesn't break it.

**Acceptance**: in spectate + play, receiver visibly arrives within ~150ms of contact (no waiting stance), hips visibly open through every groundstroke — reads as body-driven power, never arrive-plant-flap; back-corner retrievals show momentum carry-through.

**Not doing**: free-orbit camera (rejected), prerendered audio (shelved).

---

## TASK-24 — Match ceremony, Shot-Select onboarding & identity

- **Status**: `[X]` COMPLETED (deployed)
- **Owner Modules**: `src/game_engine.js`, `src/hud_ui.js`, `index.html`, `src/squash/OpponentAI.js`
- **Architecture Ref**: `ARCHITECTURE.md §5.8` (note: body line "deep lob physics front wall y≈4.12, spin.x=-4" records the PRE-`2f68ee9` state and is superseded by §5.7's failure record + §5.9)
- **Depends On**: `["TASK-23"]`

**Shipped** (see ARCHITECTURE.md §5.7–§5.8):
- Racket-spin "who serves first" ceremony: `RACKET_SPIN` phase gates the first `_setupPointServe` of a fresh real-play match; call UP/DOWN, winner elects serve, AI always takes serve. Spoken + visual explainer teaches Shot-Select Mode mid-ceremony.
- Shot-Select Mode branded as the default everywhere (HUD pill `SHOT-SELECT: ON`, setup step-4, Guide §1); WASD framed as advanced.
- `onStartMatch` invariant: Play Match Now can never route to `ai_vs_ai` (coerces stale selection to `pro`).
- AI back-glass strike quality: sit-up/descend pocket gate (`y ≤ 0.72` or `y < 1.15 && vy < -0.35`), corner-cycling mix (55% same-corner counter-drive + cross/lob/boast/drop), deep lob physics (front wall `y≈4.12`, `spin.x=-4` — no mid-court floaters).
- YOU-ARE-RED identity cues: red/blue score digits, YOU chip, red-ringed avatar, red nameplate + setup tag.

Commits: `775a340`, `fff35d8`, `c97d67e`, `7cc02ae`, `457d739`, `2f50cae` — all deployed.

---

# §5.9 + §5.10 FIX TASK GROUP — three fixes: LOB (TASK-25/26/27/28), MID-COURT FREEZE (TASK-29), JUKEBOX (TASK-33) — all `[ ]` PENDING

Source of truth: `DOCS/ARCHITECTURE.md` v2.3.0 §5.9 (entity rows are cited verbatim below so a coder need not open the architecture doc). Bounded brownfield contract: touch ONLY the files named in your task; do not restructure neighboring modules; work additively with timestamped backups beside every file you edit.

### `TASK-25` — Front-Wall Viscoelastic COR
- **Status**: `[X]`
- **Owner Module**: `src/squash/BallPhysics.js`
- **Architecture Ref**: §5.9 entity row "Front-wall viscoelastic COR"
- **Depends On**: `[]`
- **kstore Key**: `mba.robin.squasharcade.tasks.TASK-25`
- **Do**: At `BallPhysics.js:65` replace `const cor = Math.min(0.88, (bp.frontWallRestitution ?? 0.68) * tempFactor);` with the §5.9 v2 plateau curve: `const cor = Math.min(0.88, THREE.MathUtils.lerp(0.88, 0.66, THREE.MathUtils.clamp((impactSpeed - 13) / 15, 0, 1)) * tempFactor);` — `impactSpeed` is already computed at `BallPhysics.js:59`. Side-wall (`:121`), back-wall (`:150`), and floor (`:215`) restitutions remain untouched.
- **Verify**: `npm run lint` exits 0.
- **Accept (AP-1)**: `grep -c "lerp(0.88, 0.66" src/squash/BallPhysics.js` reports exactly 1; `grep -c "bp.frontWallRestitution" src/squash/BallPhysics.js` reports 0; `npm run lint` exits 0. (Semantic: 7–13 m/s lob contacts respond 0.88, 15 → 0.853, ≥20 m/s drives ≤ 0.677 — full numeric attestation lands in TASK-32.)

### `TASK-26` — Charge Envelopes, Skill Scalar & Error/Fatigue Params
- **Status**: `[X]`
- **Owner Module**: `src/squash/TuningConfig.js`
- **Architecture Ref**: §5.9 entity rows "`SHOT_CHARGE_ENVELOPES`", "AI error params", "Fatigue error multiplier"
- **Depends On**: `[]`
- **kstore Key**: `mba.robin.squasharcade.tasks.TASK-26`
- **Do**:
  1. New frozen export `SHOT_CHARGE_ENVELOPES` beside `DEFAULT_TUNING_PARAMS` (`TuningConfig.js:49`): `LOB { minPaceMps: 9.0, maxPaceMps: 15.5, emergentContactBandM: [4.10, 4.90] }`, `KILL { minPaceMps: 24.0, maxPaceMps: 31.0, emergentContactBandM: null }` (charge sharpens pace only), `DROP { minPaceMps: 6.0, maxPaceMps: 9.5, emergentContactBandM: null }` (charge adds depth only), `DRIVE`/`BOAST`: `null` (existing charge behavior unchanged). `emergentContactBandM` is descriptive (validator input), never a solver input.
  2. New pure export `aiErrorChannelsFromSkill(skill)` returning `{ aiKillTinChance, aiKillOutChance, aiLobOutChance, aiExecutionNoiseSigma, aiAimJitterDeg }` — fixed monotone functions of the ONE scalar, calibrated through the anchors: casual skill 0.65 → `{ 0.22, ~0.11, 0.30, 0.08, ~3.5° }`, pro 0.93 → `{ 0.04, ~0.02, 0.06, 0.02, ~0.8° }`. Exact closed forms: `killTin = clamp(0.638 − 0.643·skill, 0.02, 0.34)`; `killOut = clamp(0.318 − 0.318·skill, 0.02, 0.18)`; `lobOut = clamp(0.857 − 0.857·skill, 0.03, 0.45)`; `sigma = clamp(0.219 − 0.214·skill, 0.01, 0.12)`; `jitterDeg = clamp(10.4 − 10.3·skill, 0.5, 4.5)`.
  3. In the `movementAndAI` block (`TuningConfig.js:97-102`, `_envNum`/`VITE_SA_*` pattern per §5.1): add `aiExecutionSkill: _envNum('VITE_SA_AI_EXECUTION_SKILL', 0.65)`, `aiFlairAttemptChance: _envNum('VITE_SA_AI_FLAIR_ATTEMPT_CHANCE', 0.04)`, and fatigue coefficients `aiFatiguePerGame: 0.04`, `aiFatiguePerPoint: 0.004`, `aiFatiguePerRallyStroke: 0.015`, `aiFatigueCap: 1.6`. The runtime multiplier is computed at runtime by the engine's difficulty wiring (`game_engine.js`), not stored: `min(aiFatigueCap, 1 + aiFatiguePerGame·gamesPlayed + aiFatiguePerPoint·pointsPlayed + aiFatiguePerRallyStroke·lastRallyStrokeCount)`; it scales ALL error channels uniformly and never changes shot selection.
- **Verify**: `npm run lint`; `node -e "import('./src/squash/TuningConfig.js').then(m=>{const a=m.aiErrorChannelsFromSkill(0.65),b=m.aiErrorChannelsFromSkill(0.93);if(Math.abs(a.aiKillTinChance-0.22)>1e-3||Math.abs(b.aiKillTinChance-0.04)>1e-3||m.SHOT_CHARGE_ENVELOPES.LOB.maxPaceMps!==15.5)process.exit(1)})"` exits 0.
- **Accept (AP-1)**: the node assertion above exits 0 from any starting state; `grep -c "SHOT_CHARGE_ENVELOPES" src/squash/TuningConfig.js` ≥ 1; `grep -c "VITE_SA_AI_EXECUTION_SKILL" src/squash/TuningConfig.js` = 1.

### `TASK-27` — `ShotController.solveCornerLob` (replaces the 4.85/11.2 branch)
- **Status**: `[ ]`
- **Owner Module**: `src/squash/ShotController.js`
- **Architecture Ref**: §5.9 entity rows "`ShotController.solveCornerLob`", "`SHOT_CHARGE_ENVELOPES`"; §5.7 failure record (what must NOT return)
- **Depends On**: `[]` — order-independent: the search runs against LIVE `simulateTrajectory` (correct under any COR state); LOB envelope values are inlined locally, preferring `SHOT_CHARGE_ENVELOPES.LOB` at runtime if present.
- **kstore Key**: `mba.robin.squasharcade.tasks.TASK-27`
- **Do**: Replace the fixed lob branch at `ShotController.js:260-274` with `solveCornerLob({ actorPos, contactPos, targetCornerSign, chargeNormalized, params }) -> { vel, spin, solvedContactY, paceMps, solveStatus }`, `solveStatus ∈ 'LEGAL_CORNER' | 'ATTEMPT_OUT' | 'ATTEMPT_SHORT'`:
  1. **Decision variables are LAUNCH CONDITIONS** (pace × launch angle; spin FIXED at `spin.x = −2.5, spin.y = 0, spin.z = 0`). Objective = the landing: steep first drop in the back-corner zone (`|x| ≥ 1.6 && z ≥ 3.0`), T-band (z ∈ [0.5, 2.5]) clearance > 2.6 m **measured on the POST-WALL flight only** (samples with `t` later than the front-wall event's `t` — the pre-wall outbound leg is the hitter's own ball, not a volley opportunity), evaluated by iterating `BallPhysics.simulateTrajectory` over candidate launch conditions (samples are `{ t, pos, vel, ... }` objects — read `sample.pos.z`). **Pinned search space:** elevation angle 30°→65° scanned with ≥4 steps (bring-up measured the sweet spot at 33–39°; 40°+ contacts ≥4.8 → OUT by construction); pace = charge-lerped value in [9.0, 15.5] m/s scanned ±2.0 m/s (≤ 24 total evaluations, deterministic scan order: elevation outer, pace inner); **both back corners searched** (operator decision 2026-10-21: the goal is whichever back corner is a reachable steep drop from the current position; the front-wall aim is only the result of the solve) — lateral aim = corner mirrored through the front-wall plane, corrected twice from the simulated landing, per corner; ≤ 52 early-stopped sims. **Selection order (preference, never a filter):** legal contact AND corner reached → closest to corner ref `(±2.35, 4.2)` = `LEGAL_CORNER`; else a legal corner landing that is flat (T-band clearance not met) = `CATCHABLE_CORNER` — the honest result of a lob from mid/back court; if neither exists at the charged pace, the pace steps up from the charged pace (1 m/s, ending exactly on the LOB envelope ceiling) until a legal corner landing exists; only if none exists anywhere in the envelope does the player aim at the OUT location that WOULD have solved a back corner (corner reached, legality ignored; elevations widened to 80°, pace ascending from the charged pace and capped at the LOB envelope — a lob is never full power) classified by contact; only if no corner-reaching trajectory exists at all, the closest landing, classified `ATTEMPT_OUT` (contact ≥ 4.57) / `ATTEMPT_SHORT`. AI `aiErrorMode 'OUT'` on a lob = pace × 1.14 on the solve output, status re-derived via `classifyExecutedLob` (no wall-height override).
  2. `solvedContactY` is the EMERGENT front-wall contact height of the winning trajectory — an OUTPUT for classification and HUD (surface `solveStatus` through the existing timing-grade/detail popup path when the lob executes), never a search input. NO aim point, NO legality filter, NO clamp of `solvedContactY` anywhere in the path: if the best attempt's contact is ≥ 4.57 it executes and is classified `ATTEMPT_OUT`; if no candidate reaches the corner zone the best carry is classified `ATTEMPT_SHORT`.
  3. Charge lerps commitment inside `SHOT_CHARGE_ENVELOPES.LOB` (9.0–15.5 m/s band); low charge = same intent under-executed. Calibration reference (measured 2026-10-21 against the speed-dependent viscoelastic COR): deep-corner solves ≈ pace 15 → corner; mid-court ≈ 13.5 → corner, 15 → out; front ≈ 12 → corner; deep-center → no corner solve at any pace (the "should not be played" zone).
  4. Wire `computeShotExecution`'s `isLobRequest` branch to route through `solveCornerLob`, preserving label/cutAngle/pronation fields.
- **Verify**: `npm run lint`; `grep -n "4.85\|/ 11.2" src/squash/ShotController.js` reports no matches in the lob path.
- **Accept (AP-1)**: `grep -c "solveCornerLob" src/squash/ShotController.js` ≥ 2 (definition + call site); `grep -cE "Math.min\(4\.5|clamp.*4\.57" src/squash/ShotController.js` = 0 (no legality clamp exists); lint exits 0.

### `TASK-28` — Serve Re-Anchor to Landing-Goal Solve + Corkscrew Flair Variant
- **Status**: `[ ]`
- **Owner Module**: `src/squash/ShotController.js`
- **Architecture Ref**: §5.9 principle 4 (generalized solve semantics + flair attempts); §3.5 `computeServeExecution`
- **Depends On**: `[]` — order-independent: serve re-anchor touches only `computeServeExecution`; corkscrew keyed off `inputEvent.variant`, absent by default.
- **kstore Key**: `mba.robin.squasharcade.tasks.TASK-28`
- **Do**:
  1. Re-anchor `computeServeExecution` (`ShotController.js:95-96` wall-aim `frontWallHitX/Y` solve) to a landing-goal solve mirroring the lob solver: decision variables = launch conditions (elevation 12°→40° in 4° steps; pace 8→14 m/s in 1.0 steps; ≤ 24 evaluations, deterministic order); objective = `firstFloorBouncePos` inside the **opposite rear quarter, defined exactly: `z ∈ [0.565, 4.875]` AND `sign(x) = −sign(serverBoxX)`**; front-wall contact is emergent output. Tie-break: deepest legal bounce toward quarter center `(−sign(serverBoxX) · 2.4, 3.2)`. Serve legality margins unchanged (`1.78 < y < 4.57` contact; quarter landing; existing `RulesEngine` judging untouched).
  2. Add the corkscrew flair variant: identical solve, `spin = (4, −Math.sign(targetQuarterX) · 9, 0)` — swerve from EXISTING lateral Magnus coupling, never scripted; selected when the caller passes `variant: 'corkscrew'` (AI only, `aiFlairAttemptChance`-gated). Ordinary serve rules are the only judge.
- **Verify**: `npm run lint`; manual determinism spot: two identical corkscrew calls produce identical `vel`/`spin`.
- **Accept (AP-1)**: `grep -c "frontWallHitY" src/squash/ShotController.js` = 0; `grep -c "corkscrew" src/squash/ShotController.js` ≥ 1; lint exits 0.

### `TASK-29` — AI Anti-Float Punish, Lob Selection Discipline & Error Application
- **Status**: `[ ]`
- **Owner Module**: `src/squash/OpponentAI.js`
- **Architecture Ref**: §5.9 entity row "Anti-float punish rule"; principles 3 & 4 (one discriminator; correlated errors; out-surface realism)
- **Depends On**: `[]` — order-independent: the punish gate is pure ball-state logic; error channels computed locally (killTin = clamp(0.638 − 0.643·s, 0.02, 0.34); killOut = clamp(0.318 − 0.318·s, 0.02, 0.18); lobOut = clamp(0.857 − 0.857·s, 0.03, 0.45); sigma = clamp(0.219 − 0.214·s, 0.01, 0.12); jitterDeg = clamp(10.4 − 10.3·s, 0.5, 4.5); where s = `params.movementAndAI.aiExecutionSkill ?? 0.65`; fatigue read as `engine.getFatigueErrorMultiplier?.() ?? 1`.
- **kstore Key**: `mba.robin.squasharcade.tasks.TASK-29`
- **Do**:
  1. **Anti-float punish** (fixes the §5.9 mid-court freeze defect record): in the poach/patience gate at `OpponentAI.js:234-249`, add: incoming ball `speed < 6 m/s` AND `y <= 1.9` AND `bounceCountOnFloor === 0` → bypass the `suboptimalContact` early-return entirely and route directly into the strike branch with `VOLLEY_KILL` selection, REGARDLESS of hitter depth (today's `player.z > 1.6` condition stops covering mid-court floaters). Balls crossing the T band above 2.6 m remain exempt (same discriminator, both outcomes — principle 3).
  2. **Lob selection weighting** (not a ban): `chooseTacticalShot` weights the lob by position — full weight in deep/back-court contexts (`opponent.pos.z > ~2.6` or off-back-glass recovery), collapsing toward 0 from mid/front court and in the deep-center no-solve zone. No hard prohibition: the repertoire stays open, and if context ever justifies it the AI takes the shot and owns the outcome. **Invariant: selection ALWAYS resolves to a shot on the AI's turn** — position changes *which* shot, never *whether* to take one (§5.9 Selection-always-resolves).
  3. **Error application**: before executing any solved shot, compute the channels locally via the inline closed forms above (`s = params.movementAndAI.aiExecutionSkill ?? 0.65`; at runtime prefer the `TuningConfig` export if it exists) and multiply by `(engine.getFatigueErrorMultiplier?.() ?? 1)`. Roll each channel once; on a failed roll, perturb the SOLVE OUTPUTS (pace multiplier draw from `aiExecutionNoiseSigma`, contact-height offset, `aiAimJitterDeg` rotation) — never pick the out surface; `BallPhysics` alone decides whether the errant ball departs via front wall > 4.57, back glass > 2.13, or the sloped side line. Serve error chances (§5.1) and `aiFlairAttemptChance` corkscrew selection ride the same rolls.
- **Verify**: `npm run lint`; spectate a casual match — mid-court floaters are volley-killed, not waited on.
- **Accept (AP-1)**: `grep -c "speed < 6" src/squash/OpponentAI.js` ≥ 1 (punish gate present); local skill-channel helper present (`grep -cE "killTin = clamp|localChannelsFromSkill" src/squash/OpponentAI.js` ≥ 1); lint exits 0. Semantic (operator/✅ time): from a mid-court feed, the punish fires without the deep-hitter condition; a deep legal lob over 2.6 m is still waited out.

### `TASK-30` — Difficulty Skill-Scalar Wiring & Fatigue Multiplier
- **Status**: `[ ]`
- **Owner Module**: `src/game_engine.js`
- **Architecture Ref**: §5.9 entity rows "AI error params", "Fatigue error multiplier"; §3.11 `_applyDifficultyTuning`
- **Depends On**: `[]` — order-independent: params read with `??` defaults matching the specified values.
- **kstore Key**: `mba.robin.squasharcade.tasks.TASK-30`
- **Do**: In `_applyDifficultyTuning` (`game_engine.js:642`): set `aiExecutionSkill` — `casual` 0.65, `pro` 0.93, `ai_vs_ai` uses the pro table, `1v1` untouched (human opponent). Track fatigue state on the engine: `gamesPlayed`, `pointsPlayed`, `lastRallyStrokeCount` (updated in the engine's point-over handling, i.e. wherever `rulesEngine.awardPoint` is invoked; `lastRallyStrokeCount` from `ball.rallyStrokeCount` at the same moment), and expose `getFatigueErrorMultiplier() = min(aiFatigueCap, 1 + 0.04·games + 0.004·points + 0.015·lastRallyStrokes)` consumed by TASK-29's rolls. Fatigue scales ALL channels uniformly and never changes selection.
- **Verify**: `npm run lint`; casual match shows measurably more AI errors late-game than early.
- **Accept (AP-1)**: `grep -c "aiExecutionSkill" src/game_engine.js` ≥ 2 (casual + pro branches); `grep -c "getFatigueErrorMultiplier" src/game_engine.js` ≥ 1; lint exits 0.

### `TASK-31` — Choice Grades, Blessings Framing & Tactical Rating Memory
- **Status**: `[ ]`
- **Owner Modules**: `src/squash/RulesEngine.js`, `src/hud_ui.js`, `src/game_engine.js` (victory card wiring)
- **Architecture Ref**: §5.9 entity row "Choice grades"; §5.8 victory rating
- **Depends On**: `[]` — order-independent: grade logic no-ops on absent `solveStatus` until the solver lands; victory-rating accumulator works standalone.
- **kstore Key**: `mba.robin.squasharcade.tasks.TASK-31`
- **Do**:
  1. `formatRefereeCallout` (`RulesEngine.js:512`) accepts shot-context (`solveStatus` + striker zone) and appends choice-grade text: punished poor choice → "POOR — lob from mid-court"; AI-error bailout of a bad player shot → "LUCKY — count your blessings, that sat up" (names the player's choice as the cause even when the point survives); corner-death solve → "GOOD — deep defensive lob".
  2. `HudUI.showTimingPopup` displays the same grade on the timing popup channel.
  3. Victory-card tactical rating: displayed number = existing base (1145 win / 1020 loss, `#skill-rating-value`) **+ 8 × GOOD − 12 × POOR** (LUCKY counts 0 — it is the warning, not the penalty). Counters live on the engine; the scoreboard forgets, the rating remembers.
- **Verify**: `npm run lint`; play one casual match — each punished lob shows a named grade; bailout shows the LUCKY framing.
- **Accept (AP-1)**: `grep -c "count your blessings" src/squash/RulesEngine.js` ≥ 1 (case-insensitive); `grep -c "solveStatus" src/squash/RulesEngine.js` ≥ 1; lint exits 0.

### `TASK-32` — `test_shot_law_lob` Invariant & Tuning-Panel Surface
- **Status**: `[ ]`
- **Owner Modules**: `src/squash/TestHarness.js`, `src/squash/TuningPanel.js`
- **Architecture Ref**: §5.9 "Verification" paragraph; §3.9
- **Depends On**: `[]` — order-independent: tests are written against the specified public contracts and fail cleanly (assert, never crash) while subjects are absent.
- **kstore Key**: `mba.robin.squasharcade.tasks.TASK-32`
- **Do**:
  1. New static `TestHarness.test_shot_law_lob` in `runAll`: contact-grid sweep over the four pinned points — deep-corner `(2.40, 0.85, 3.80)`, deep-center `(0.20, 0.90, 3.60)`, mid-court `(1.50, 0.90, 1.50)`, front-court `(−1.20, 0.60, 0.20)` — × charge `{0.4, 0.8, 1.0}`. COR check method: ratio = |vel.z after| ÷ |vel.z before| at the first `front_wall` event returned by `stepBallPhysics` asserting (a) deep-zone full-charge → `LEGAL_CORNER` with wall contact < 4.5 m, min T-band height > 2.6 m, first drop `|x| ≥ 1.6 && z ≥ 3.0`; (b) failure classes exist and are reachable (mid-court top-charge → `ATTEMPT_OUT`; deep-center → no corner solve); (c) emergent contacts stay inside the LOB band (`SHOT_CHARGE_ENVELOPES?.LOB?.emergentContactBandM ?? [4.10, 4.90]`); (d) COR response: ~7 m/s contact ratio ≥ 0.80, ≥20 m/s ratio ≤ 0.70.
  2. `TuningPanel` Movement & AI tab gains sliders for `aiExecutionSkill`, `aiFlairAttemptChance`, and the four fatigue coefficients (persist via existing store; §5.1 env-override precedence preserved).
- **Verify**: `npm run lint`; open Tuning Lab → run Diagnostics → `test_shot_law_lob` PASSES.
- **Accept (AP-1)**: `grep -c "test_shot_law_lob" src/squash/TestHarness.js` ≥ 2; `TestHarness.runAll` executed from a fresh clone reports the test present — FAILING cleanly (assertion, never crash) while the §5.9 solver/COR entities are absent, passing once they exist; lint exits 0.

### `TASK-33` — Jukebox De-Argon & All-14 Default Rotation
- **Status**: `[ ]`
- **Owner Module**: `src/audio_engine.js`
- **Architecture Ref**: §5.10 entity rows "`JUKEBOX_TRACK_LIST` reorder", "De-Argon rename map", "Default rotation semantics"
- **Depends On**: `[]` — order-independent: all changes confined to `audio_engine.js` (verified: no other file references the renamed id).
- **kstore Key**: `mba.robin.squasharcade.tasks.TASK-33`
- **Do**:
  1. **Rename** `argon_glass_overture` → `glass_overture` at all five sites: `LYRIA_TRACKS` entry, `TRACK_DRUM_KIT` key, `ORIGINAL_DEFAULT_TRACK_IDS`, `STATE_TO_TRACK` values, title strings ('Argon Glass Overture' → 'Glass Overture', incl. '(Original #1)' forms).
  2. **Strip every remaining argon token** in the file (14 lines today): 'Argon Original Soundtrack' → 'Squash Original Soundtrack'; 'ARGON SQUASH DEFAULT SOUNDTRACK' → 'SQUASH DEFAULT SOUNDTRACK'; comments likewise de-Argonned; '🎙️ WELCOME TO ARGON SQUASH • CHOOSE YOUR WAY TO PLAY' → '🎙️ WELCOME TO SQUASH ARCADE • CHOOSE YOUR WAY TO PLAY'. Engine class names elsewhere are out of scope.
  3. **Pin `JUKEBOX_TRACK_LIST`** to the explicit 14-entry order (replace `Object.values(LYRIA_TRACKS)`): `virtua_arcade_95, t_zone_cyber, cairo_glass_finals, match_rally, menu_theme, court_intro, victory_fanfare,` then the 7 synth originals in existing relative order (`glass_overture, physical_chess_protocol, crimson_tin_fanfare, nick_roller_overdrive, alexandria_showcourt_nights, forearm_cut_funk, psa_championship_crown`).
  4. **Default rotation**: `jukeboxMode='auto'` plays the pinned list sequentially with wrap-around; boot starts at index 0 (`virtua_arcade_95`). Demote `STATE_TO_TRACK` from the default path — `playMusicForState` becomes a no-op in `'auto'` mode (map stays for explicit/locked selection). Retain §5.6 muted-start/no-auto-lock/`ended` fixes unchanged.
- **Verify**: `npm run lint`; `node -e "import('./src/audio_engine.js').then(m=>{const L=m.JUKEBOX_TRACK_LIST;if(L.length!==14||L[0].id!=='virtua_arcade_95'||L.slice(0,7).some(t=>t.id==='glass_overture'))process.exit(1)})"` exits 0.
- **Accept (AP-1)**: `grep -ci argon src/audio_engine.js` reports 0; `grep -c "glass_overture" src/audio_engine.js` ≥ 4 (LYRIA + DRUM_KIT + DEFAULT_IDS + STATE_TO_TRACK); the node assertion above exits 0 from any starting state; lint exits 0.

---

## Sign-off

- [ ] Architecture alignment approved (`DOCS/ARCHITECTURE.md` v2.3.0)
- [ ] TASK-15 .. TASK-24 historical `[X]` records confirmed (✅ backfill at operator discretion)
- [ ] TASK-25 .. TASK-33 scope + idempotent acceptance gates approved for dispatch
