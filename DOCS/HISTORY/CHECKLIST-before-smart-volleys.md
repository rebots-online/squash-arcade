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
  1. **Decision variables are LAUNCH CONDITIONS** (pace × launch angle; spin FIXED at `spin.x = −2.5, spin.y = 0, spin.z = 0`). Objective = the landing: steep first drop in the back-corner zone (`|x| ≥ 1.6 && z ≥ 3.0`), T-band (z ∈ [0.5, 2.5]) clearance > 2.6 m **measured on the POST-WALL flight only** (samples with `t` later than the front-wall event's `t` — the pre-wall outbound leg is the hitter's own ball, not a volley opportunity), evaluated by iterating `BallPhysics.simulateTrajectory` over candidate launch conditions (samples are `{ t, pos, vel, ... }` objects — read `sample.pos.z`). **Pinned search space:** elevation angle 30°→65° scanned with ≥4 steps (bring-up measured the sweet spot at 33–39°; 40°+ contacts ≥4.8 → OUT by construction); pace = charge-lerped value in [9.0, 15.5] m/s scanned ±2.0 m/s (≤ 24 total evaluations, deterministic scan order: elevation outer, pace inner); **both back corners searched** (operator decision 2026-10-21: the goal is whichever back corner is a reachable steep drop from the current position; the front-wall aim is only the result of the solve) — lateral aim = corner mirrored through the front-wall plane, corrected twice from the simulated landing, per corner; ≤ 52 early-stopped sims. **Selection order (preference, never a filter):** legal contact AND corner reached → closest to corner ref `(±2.35, 4.2)` = `LEGAL_CORNER`; else a legal corner landing that is flat (T-band clearance not met) = `CATCHABLE_CORNER` — the honest result of a lob from mid/back court; if neither exists at the charged pace, the pace steps up from the charged pace (1 m/s, ending exactly on the LOB envelope ceiling) until a legal corner landing exists; only if none exists anywhere in the envelope does the player aim at the OUT location that WOULD have solved a back corner (corner reached, legality ignored; elevations widened to 80°, pace ascending from the charged pace and capped at the LOB envelope — a lob is never full power) classified by contact; only if no corner-reaching trajectory exists at all, the closest landing, classified `ATTEMPT_OUT` (contact ≥ 4.57) / `ATTEMPT_SHORT`. **Lob shape (operator 2026-10-21):** among legal corner landings the solver takes the STEEPEST drop (descent angle at the first floor contact; softer launch wins within 2°), searched across the whole LOB envelope; a landing only counts if the ball reaches the floor BEFORE the back glass. AI `aiErrorMode 'OUT'` on a lob = pace × 1.14 on the solve output, status re-derived via `classifyExecutedLob` (no wall-height override).
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


### `TASK-34` — Back-wall drive contact-height correction
- **Status**: `[X]` — implementation retained as history; operator rejected the demonstrated shot shape and stroke sequence on 2026-10-21; superseded by the correction contracts below.
- **Owner Modules**: `src/squash/ShotController.js`, `tests/back-wall-drive.test.mjs` (new).
- **Architecture Ref**: §5.11. Current operator bug report authorizes this bounded correction.
- **Depends On**: `[]`.
- **Do**:
  1. Add `ShotController._computeBackWallDriveVelocity({ contactPos, vel, spin, params }) -> THREE.Vector3` before the existing lob solver. Clone `vel`; preserve x/z and `spin`. Let `flightSec = (COURT_SPECS.FRONT_WALL_Z - contactPos.z) / vel.z`, `g = Number(params.ballPhysics?.gravity ?? 9.81)`. Lower/upper vy seeds are `(height - contactPos.y + 0.5*g*flightSec*flightSec)/flightSec` for heights `0.68` and `3.2`. Repeat 10 times: candidate y = midpoint; call existing `BallPhysics.simulateTrajectory({pos: contactPos, vel: candidate, spin}, params)`. Find first event whose surface is `floor`, `nick`, `back_wall`, or `tin`. Depth = event.pos.z, except back_wall => `COURT_SPECS.BACK_WALL_Z + 1 + event.pos.y`; no terminal event => `COURT_SPECS.BACK_WALL_Z + 1`. If depth > 3.8, move upper bound to candidate y; otherwise move lower bound. Return tenth candidate. Never filter isOut/isTin, change shared physics, or add legality rescue.
  2. In drive branch immediately after `spin.set(14 * spinScale, 0, 0)`, only when `isOffBackWall`, copy that helper's output into `vel`. Keep existing shot identity/labels, x/z pace and spin, preparation/disguise, and intentional AI-error code intact. Do not modify lob/drop/kill/boast/ordinary-drive execution.
  3. Create `tests/back-wall-drive.test.mjs` using `node:test` and `node:assert/strict`, importing THREE, ShotController, BallPhysics, DEFAULT_TUNING_PARAMS from their existing module paths. Exhaustively simulate mirrored x `{0.2,2,2.8}`, z `{1,2,3,4.3}`, y `{0.24,0.45,0.7,1,1.4}`, speed `{0.92,1.12,1.32}`, vy sign `{1,-1}` and shotType `topspin`/`cross`. Incoming ball bounceCountOnFloor=1, hitBackWallThisShot=true, vel.z=-2. New struck ball resets hit flags/bounce count; simulate real physics. Every case: first floor/nick exists before back glass, depth within 0.12 m of 3.8; no tin/out; back contact when present below 2.13 m. Include exact reported reproduction `(2.8,0.24,3)`, descending, speed1.32. Verify changing prep charge0/0.45/1 alone leaves drive velocity identical; assert lob/kill/drop/boast identities and full-prep drop disguise remain intact using ordinary contact `(-1,0.95,0.8)`. No new dependencies or package scripts.
- **Verify**: `node --test tests/back-wall-drive.test.mjs`; `npm run lint`.
- **Accept**: Both commands exit 0; all exhaustive trajectory assertions pass using actual modules. Mark `[X]` only after observing acceptance; report exact grid count.
- **Operator verification protocol**: Play successive back-wall returns, waiting until the ball falls into a low contact; confirm the drive stays a deep low-bouncing return. Browser gameplay feel remains unverified until observed.


**Acceptance record — review correction, 2026-10-21**

The former ✅ marker overstated acceptance. Source review, 1,440 deterministic trajectory cases, four regression tests, and lint verify the implementation and calculation. BW34-R1 subsequently passed direct inspection of two controlled live-game recordings, documented in `DOCS/VERIFICATION/back-wall-drive-20261021/OBSERVED-RUN.md`. Robin subsequently rejected BW34-R2: the drive is too flat/hard, the second example reads as a side-wall boast, and the stroke lacks visible side-on opposite-leg step-through. The overall requirement is unsatisfied; the earlier numeric R1 result is historical evidence only, with no SHIP-READY verdict. Public sites have not been redeployed.

| ID | Requirement | Driver | Steps / PASS criteria | Severity | Evidence / state |
| :--- | :--- | :--- | :--- | :--- | :--- |
| BW34-R1 | Delayed back-wall drive in the actual game | AUTO | On the local corrected game, allow a return off the back glass to fall into a low contact, then drive; directly observe a deep first bounce before the next back-glass contact, with no out-line crossing. Repeat straight and cross-court. Capture the sequence. | HIGH | PASS — controlled live-game straight/cross recordings visually inspected; falling contact y=0.2646 m; first bounces z=3.7855/3.7780 m precede glass impacts y=0.2082/0.2883 m, no out. Evidence and fixture limits: `DOCS/VERIFICATION/back-wall-drive-20261021/OBSERVED-RUN.md`. |
| BW34-R2 | Operator timing and shot-feel acceptance | OPERATOR | Compare an earlier contact with waiting for the lower ball after the back-wall rebound; confirm the later good contact remains a usable drive rather than an excessive high launch/bounce. | HIGH | REJECTED — Robin observed the examples and requested higher/softer drive shape, a dying boast, and visible side-on opposite-leg step-through (2026-10-21). |

The existing AI-rally diagnostic also failed before the edit and passed on the final run; its intermittency remains unresolved and is not certified repaired by TASK-34.


### `TASK-37` — Side-on opposite-leg step-through and timed rally contact
- **Status**: `[X]` — implementation checks pass; rendered/runtime acceptance remains open.
- **Owner Modules**: `src/squash/StrokeMotion.js` (new), `src/game_engine.js`, `src/squash/PlayerMovement.js`, `tests/stroke-motion.test.mjs` (new). Named read-only interfaces: `src/racket_kinematics.js` triggerSwing/update/getRacketRimWorldPoints; `src/mii_body_animation.js` exposed rig pivots; `src/squash/BallPhysics.js`; `src/squash/CourtGeometry.js`; `src/squash/RulesEngine.js`; `src/squash/TestHarness.js`.
- **Architecture Ref**: §5.12. Current user requests explicitly authorize this correction in the original Arcade repository only.
- **Do**:
  1. Add exported `StrokeMotion` class with static `prepare(actor,dt,{ball,phase,handedness,predictedContactSec})`, `request(actor,{ball,inputEvent,prepSnapshot,isAuto,handedness,gravity}) -> boolean`, `update(actor,dt,{ball,phase}) -> pending payload or null`, `applyPose(actor,ball) -> boolean`, and `reset(actor)`. Store the explicit state fields: phase idle/prepare/swing/recover; side forehand/backhand/overhead; handedness; yawRad; prepareWeight; elapsedSec; contactDelaySec; followThroughSec; recoverSec; progress; racketDurationSec; contactEmitted; pending; contactPos; leadFoot/supportFoot; leadStartWorld/leadPlantWorld/supportPlantWorld; stepTargetWorld. Pending contains copies of inputEvent/prepSnapshot/isAuto and identity token ballRef/rallyStrokeCount/lastHitter. Initialize lazily. No ball mutations or actor.pos writes anywhere in this module.
  2. `prepare` turns a receiving actor continuously toward the appropriate side wall as the live ball comes within approximately 3.2m; weight approaches1 within1.6m (exponential smoothing, rate10/sec). Use model forward PI, righty forehand PI/2, backhand3PI/2, mirrored lefty; choose side from actual racket effective side if active, otherwise input/relative ball side and handedness. Overhead preserves overhead mechanics. Keep internal yawRad independent of legacy yaw writes. Never reset yaw when request arrives. Righty FH lead left/support right; BH lead right/support left; mirror lefty. Capture world foot anchors on request from exposed rig pivots, after current matrices are updated. Lead plant is 0.28m toward front wall, support anchored during load; actor stepTargetWorld is actor.pos + (0,0,-0.28), court-bounded. All root translation remains PlayerMovement inertia.
  3. `request` handles an already pending stroke as true without resetting it. Start phase swing, contactDelaySec=.10, followThroughSec=.24, recoverSec=.16. For actual vy<0, h=max(0,ball.pos.y-COURT_SPECS.BALL_RADIUS*1.65), remainingFloorTime=(vy+sqrt(vy*vy+2*g*h))/g; cap contactDelaySec to .60*remainingFloorTime (minimum positive interval one millisecond, no guaranteed hit). Keep racketDurationSec=.34 for mapping. Before contact progress=.34*elapsed/contactDelay; after contact progress=.34+.66*elapsedAfter/.24; recovery follows. Emit copied payload exactly once, clearing pending before commit. Reject/cancel pending if phase not RALLY, !inPlay, bounceCountOnFloor>=2, ball ref changed, lastHitter changed, or rallyStrokeCount changed. Continue follow-through after successful commit; any failed commit resets motion. reset clears pending/timing/anchors and leaves actor/ball positions untouched.
  4. `applyPose` after legacy body animator sets authoritative root yaw using shortest-angle continuous interpolation: full side-on during load, ~55deg off forward at contact, through forward to slight opposite overrotation during follow-through, recovery blends to ordinary facing. Keep lead/support world foot anchors; convert desired world positions with pivot.parent.worldToLocal. Lead swings via smoothstep to plant with sin(PI*u)*.10m foot lift; plant by contact. Support heel releases/trails after contact; recovery blends into that frame's ordinary animated foot poses. Add small hip loading crouch (~.06m), weight shift (~.08m), and torso opening coordinated with phase; do not reset pose at impact. If needed, a smooth bounded contact-phase correction aligns actual racket centerWorld to saved live contactPos around progress .34; only adjust reachable racket/hand pose, never root/ball position. Re-align rig hand pivot with the moved racket grip so it stays attached. Return false only when no stroke/preparation/recovery pose applies.
  5. Split existing `_attemptPlayerRallyStrike` into a request wrapper and `_commitPlayerRallyStrike(payload)`, and `_executeOpponentSquashStrike` into request wrapper plus `_commitOpponentSquashStrike(payload)`. Existing names remain callers' public entrypoints. Request guards phase/inPlay/incoming and pending-first handling; accept actual horizontal reach <=1.15m (both manual/auto) instead of the old2.85/3.6m invisible reach. Snapshot preparation once. Start existing racket triggerSwing once, adopt its returned swingSide, then schedule with StrokeMotion.request and set cooldown so AI cannot issue duplicates. Trigger does not impart recoil/audio/rules. Commit revalidates live incoming ball/reach and computes ShotController from current ball and saved input/prep. Retain existing shot application, rules, observer AI, trajectory, trail/VFX/audio/facial/HUD at commit. Do not restart swing animation. Remove player/opponent contactPos y clamps and ball.pos.copy contact rewrites; snapshot actual live pos for VFX/contactPos. Remove obsolete commit-time cooldown guard because request already owns it. Preserve intentional shot errors and serve execution unchanged. Overhead contact gets same scheduling, with appropriate pose.
  6. Add engine `_updateStrokeMotions(dt)` using both actors: prepare, advance fixed-step motion, and dispatch emitted payload to its actor's commit method. At start of `_stepPhysics`, clear motion on nonRALLY transitions; within RALLY, advance pending strokes after ordinary BallPhysics collision handling has either kept the rally live or ended it. Ordinary ball physics must continue before contact. `StrokeMotion.prepare` also runs while receivers approach. Reset both actors explicitly in `_setupPointServe`. In PlayerMovement.stepActorLocomotion, if strokeMotion.phase is swing and stepTargetWorld exists, use that as target before computing dx/dz; preserve all acceleration, collision separation and court bounds.
  7. Import StrokeMotion in engine. Immediately before existing racket update, while motion is swing, align racket clock: effectiveDt=clamp(Number(dt||1/60),.0005,.05); k.swingElapsed=motion.progress*motion.racketDurationSec-effectiveDt; k.swingDuration=motion.racketDurationSec; k.swingActive=true. Existing update adds that dt and renders the physics-owned progress. Keep actor swing fields synchronized. Apply StrokeMotion.applyPose after bodyAnimator; only use old ballAngle/PI facing fallback if it returns false. Remove unconditional yaw override. Avoid minified-module rewrites. Pending duplicate human input must return handled=true so _handleUserSwingInput does not trigger fallback/practice swing.
  8. Add Node built-in `tests/stroke-motion.test.mjs` exercising right/left FH/BH yaw/lead mirrors, continuity/no position jumps, foot plant/lift and recovery using Three rigs, request leaves ball velocity and hit counters unchanged, moving BallPhysics ball changes before scheduled contact, exactly one payload, duplicate request, stale token/second-bounce/phase reset cancellation, and short low-descending-ball delay. Test real exported module. Do not fake production contact or weaken unrelated assertions. Re-read changed regions.
- **Verify**: `node --test tests/stroke-motion.test.mjs`; `npm run lint`; existing `TestHarness.runAll` through Node or browser, report every failure without loosening its six-second rally requirement.
- **Accept (implementation)**: named test command and lint exit0 with no placeholder bodies; source review confirms shot/rules/impact execution only at scheduled contact and normal ball integration while pending. Mark `[X]` for this implementation result only.
- **Operator/runtime protocol**: Directly record live forehand/backhand drive and boast, with normal actor approach enabled. Observe side-wall facing, opposite-foot step/load, rotation through contact, attached racket/hand, actual racket-ball contact area, continued ball motion before contact and smooth recovery. Record body and ball telemetry as support, never a substitute for rendered observation. No overall acceptance until shape and movement match Robin's requirement.

### `TASK-35` — Higher, softer back-wall drive with rear-quarter first drop
- **Status**: `[X]` — implementation and numerical regressions passed; rendered acceptance remains separate.
- **Owner Modules**: `src/squash/ShotController.js`, `src/squash/ShotTrajectorySolver.js` (new), `tests/back-wall-drive.test.mjs`. Named read-only interfaces: `BallPhysics.js`, `CourtGeometry.js`, `TuningConfig.js`. Coordinate shared solver with TASK-36; one coder owns both.
- **Architecture Ref**: §5.13 supersedes §5.11. Original Arcade only; do not access any Tauri repository. Parent owns architecture/docs/git publication. Preserve other worker edits.
- **Do**:
  1. Add readable exported `ShotTrajectorySolver` class with static `solveDrive({contactPos,spin,params,isCrossRequest=false})`, `solveBoast({contactPos,spin,params})` returning THREE.Vector3. Internal exact names `_seed(options)`, `_probe(options)`, `_solve(options)`, `_linearStep(jacobian,residual)`. Options contain contactPos/spin/params/isBoast/isCrossRequest, plus vel for probe. Canonicalize contact x=abs(x), copy spin with positive-side y; mirror output vx and spin.y for original negative side. Never mutate supplied inputs.
  2. Shared constants: radius=COURT_SPECS.BALL_RADIUS*1.65 (~.033); C=HALF_WIDTH-radius (~3.167), F=FRONT_WALL_Z+radius (~-4.842), friction f=ballPhysics.surfaceFriction default.80, gravity g default9.81, magnus default.012, spinSurfaceBite from actual tuning. Drive target H2.05,Z3.8,X=(cross?-2.8:2.8). Define d=contactZ-F,a=Z-F,g0=g+spin.x*magnus*8.5,g1=g+.68*spin.x*magnus*8.5,b=spin.x*spinSurfaceBite. Geometric drive seed: k=a/(.82*d); A=.5*f*g0*k+.5*g1*k*k; B=-b*k; D=radius-H-f*k*(H-contactY); t=(-B+sqrt(B*B-4*A*D))/(2*A); p=1.19*d/t; vx=(X-contactX)*p/(d+f/.82*a); vy=(H-contactY+.5*g0*t*t)/t; vz=-p. Guard nonfinite/degenerate algebra with finite geometric fallback (no throw/no refused shot).
  3. `_probe` uses real BallPhysics.simulateTrajectory({pos:contactPos,vel,spin},params,null,{dt:1/120,maxTimeSec:3.3}). Return residual `[3*(frontY-H),landingX-X,landingZ-Z]`, score=sum squares+50 if invalid order/out/tin+(.1 if boast without nick), valid/converged. Actual front event and firstFloorBouncePos are required; evaluate events only through first floor for drive order/out/tin, plus boast second-floor/apex criteria. Drive valid: front first, no side/back wall/floor before front, no side/back wall between front and first floor, no tin/out. Boast order defined TASK36. When rejected candidate hits glass before first floor, use unfolded landingZ=2*(BACK_WALL_Z-radius)-actualLandingZ for residual continuity; for boast far-side-before-floor unfold landingX=-2*C-actualLandingX. Missing front/floor gets finite penalized residual from finalPos, never falsified as valid. Converged additionally |frontY-H|<=.04, |landingZ-Z|<=.12, drive |landingX-X|<=.06, boast true nick/apex<.10/secondFloorZ<-1.5.
  4. `_solve`: initial seed probe then at most9 iterations; stop when converged. Forward Jacobian increments vx.16,vy.12,vz.16; `_linearStep` uses pivoted Gaussian elimination J*delta=-residual, rejects singular/nonfinite. Clamp delta x/z±3,y±2. Try damp scales[1,.5,.25], accepting first lower score. Keep best valid candidate separately from best finite attempt; return best valid when any exists, otherwise best finite attempt. Strict maximum55 physics probes; no additional scan/grid. Degenerate solve stops, never modifies physics/rules/ball. Runtime errors remain real attempts.
  5. Replace `_computeBackWallDriveVelocity` body with delegation, add isCrossRequest=false to its options and pass isCrossRequest from drive branch only when isOffBackWall. Preserve existing normal drive branch and subsequent intentional AI errors. Preserve spin14*scale and prep independence. Replace artificial contactPos y lower clamp .24 with actual collision radius; no ball movement. Keep all unrelated lob/drop/kill/serve code unchanged.
  6. Update existing real-module exhaustive 1440-case test to assert actual frontY2.05±.10, first floor z3.8±.12 beforeglass, straight/cross landingx same/opposite2.8±.10, and no side wall beforefloor. Keep prep invariance/shot identity tests. Include additional actual low contacts y.10/.15 with exact controlled delayed contact x2.8,z3.96; assert shape where feasible and escalate any physically infeasible case instead of hiding it. Include exact mirrored output velocities and deterministic bounded probe instrumentation by wrapping/restoring simulateTrajectory in isolated test. No production testing hooks/dependencies.
- **Verify**: `node --test tests/back-wall-drive.test.mjs tests/side-front-boast.test.mjs`; `npm run lint`. Count cases/probes and report failures precisely.
- **Accept (implementation)**: named commands exit0 and all shape/order assertions pass; `[X]` records implementation only. Operator runtime/feel acceptance stays separate.

### `TASK-36` — Soft side-front boast that dies near opposite nick
- **Status**: `[X]` — implementation and numerical regressions passed under the explicit semantic nick-zone amendment; rendered acceptance remains separate.
- **Owner Modules**: same coder/shared solver as TASK35; `src/squash/ShotController.js`, `src/squash/ShotTrajectorySolver.js`, `tests/side-front-boast.test.mjs` (new). Same read-only interfaces.
- **Architecture Ref**: §5.13.
- **Do**:
  1. Keep `_computeSideFrontNickBoastVector(contactPos,sideSign,params={}) -> {vel,spin}`. Spin=(-12*scale,sideSign*14*scale,0), velocity from ShotTrajectorySolver.solveBoast. For deep ordinary boast/two_wall_boast after back-wall rebound, use side-front branch; explicit back_wall_boast always preserves back-glass recovery. Preserve ordinary trapped non-rebound recovery semantics.
  2. Boast geometric `_seed`: use TASK35 constants, H=.78,Z=-3.5,X=-3.145,a=Z-F,d=contactZ-F, dSide=C-contactX. cS=min(.86,(sideWallRestitution default.66)*temperatureFactor), temperatureFactor=max(.76,min(1.18,1+((ballTemperatureC default36)-36)*.011)); cF=.88. r=(2*C+cS/f*dSide)/(cS/f*d+cS/cF*a)+.04. For trial p: tSide=dSide/(r*p); tSF=(d-dSide/r)/(f*p); tAF=a/(f*cF*p); g0=g+spinX*magnus*8.5; gS=g+.75*spinX*magnus*8.5; gF=g+.75*.68*spinX*magnus*8.5; vy=(H-contactY+g0*(.5*tSide*tSide+f*tSide*tSF)+.5*gS*tSF*tSF)/(tSide+f*tSF); frontVy=f*(f*(vy-g0*tSide)-gS*tSF)+.75*spinX*spinSurfaceBite; predictedFloorY=H+frontVy*tAF-.5*gF*tAF*tAF. Twenty cheap algebraic bisections p[4,30] for predictedFloorY=radius (higherp gives higher predicted y; reduce upper if above). Seed(vx=r*p*1.14,vy,vz=-p*1.14). No physics calls in this bisection.
  3. Shared `_probe` boast valid order: near side wall before front, front before first floor/nick, no back wall, no extra far side before first floor; first nick's simultaneous side/floor event is allowed. Require no out/tin, front .78±.04 and landingz-3.5±.12 for numerical convergence; true nick, maxBounceHeightAfterFirst<.10 and secondFloorBouncePos.z<-1.5. The optimized z-3.5 is a search target; semantic acceptance is a dying front nick in z[-4.3,-2.5]. Keep penalty/fallback as TASK35, never return refused shot. Real nick may be surface nick/isNick. Shared Newton must retain true-nick best candidate.
  4. New Node built-in test mirrored x{.2,1.65,2.8},z{1,1.85,3,3.9596},y{.24,.7,1.4} =72 cases (including mirror), actual params/spin. Assert side->front->floor/nick, no out/tin/glass, actual front .78±.10, landing near opposite wall |x|>=3.05 in frontcourt z[-4.3,-2.5], true nick, apex<.10, secondfloorz<-1.5. Add deep-rebound ordinary boasts route TWO_WALL_BOAST while explicit back_wall_boast remains BACK_WALL_BOAST; charge invariance and mirrored velocities. Extend low y.10/.15 reproduction as feasible; escalate failures without weakening intended assertions. Calibration correction: initial test over-specified z-3.5±.15; actual high central contact(.2,1.4,3.9596) produces a true dying nick at z-3.756 after12 probes. That meets the operator's shape goal; retain the unchanged solver target and explicit semantic zone rather than adding an expensive search solely to hit an arbitrary centimetre target.
- **Verify**: commands in TASK35.
- **Accept (implementation)**: test and lint exit0, numeric/order requirements observed. Mark `[X]` only. Direct live boast and swing-through observation and Robin's feel verdict remain separate gates.

### `TASK-38` — Make the existing six-second AI exchange diagnostic reproducible
- **Status**: `[X]` — callback-only dependency change verified; eight full diagnostic runs each15/15 with original720steps/both-hit criteria unchanged.
- **Owner Modules**: `src/squash/OpponentAI.js`, `src/squash/ShotController.js`, `src/squash/TestHarness.js`, `tests/diagnostic-randomness.test.mjs` (new). Read-only interfaces `TuningConfig.js`, `BallPhysics.js`, `PlayerMovement.js`, existing tests. Original Arcade only; no Tauri access. Parent owns docs/git.
- **Architecture Ref**: §5.14. Current integrated run14/15; same20 streams baseline284c982 failed9/10/11, corrected39d9844 failed6/9/10/11/17. Actual live engine31/31 commits over80simulationseconds. Do not claim baseline equivalence or gameplay perfection.
- **Do**:
  1. Extend OpponentAI constructor to `(role='opponent',randomSource=Math.random)`, store `this.randomSource=randomSource`; replace every Math.random call in the class methods with this.randomSource(), without changing conditions, weights, timings or error rates. No unrelated AI selection/approach edits.
  2. Extend ShotController constructor `(randomSource=Math.random)`, store callback; replace only its three intentional-error Math.random draws with callback. Other signatures and ordinary callers unchanged; no engine/physics edits.
  3. In TestHarness's existing section8 just before two-AI construction, define `let rallyRandomState=1; const rallyRandom=()=>{rallyRandomState=(Math.imul(rallyRandomState,1664525)+1013904223)>>>0;return rallyRandomState/4294967296;}; const rallyShotCtrl=new ShotController(rallyRandom);`. Both new OpponentAI role constructors receive same rallyRandom. Only section8's two computeShotExecution callsites use rallyShotCtrl instead of shared shotCtrl. Keep initial actor/ball state, real physics, exact720steps/1/120 dt, and original p2Hits>=1&&p1Hits>=1 assertion unchanged. Explain pinned exchange scenario tests repeatable mechanics; random tactical distribution belongs to separately observed gameplay. Never replace process-global Math.random in production diagnostics. If seed1 still fails escalate, don't search for a passing seed silently.
  4. Add meaningful Node regression: run TestHarness.runAll eight times, compare exact result arrays ignoring timestamp; require all15 and unchanged original Math.random function identity. Test injected AI and shot intentional-error draws deterministic with same stream and ordinary no-argument construction still consumes normal random draws (isolate test override with try/finally). No weakened/skipped assertions, shortened simulation, mocked physics or modified tactical choice.
- **Verify**: `node --test tests/diagnostic-randomness.test.mjs tests/back-wall-drive.test.mjs tests/side-front-boast.test.mjs tests/stroke-motion.test.mjs`; `npm run lint`; repeated unchanged-dimension TestHarness15/15. Report exact results and any escalation.
- **Accept**: named checks pass; source confirms callback-only dependency change in game modules and scenario-local fixed stream, preserved original6second criteria. `[X]` is implementation verification, not broad AI acceptance.

**TASK35–38 execution record (2026-10-21):**29 integrated Node tests passed, lint25files/0defects, eight diagnostic repetitions15/15 and fresh loaded-browser diagnostics15/15. Four final live recordings with ordinary approach/VFX were directly inspected for side-on load, opposite-foot step, contact/follow-through and shot flight. Supporting actual engine events/pose telemetry and the separate31-contact AI run are retained at `DOCS/VERIFICATION/shot-shape-step-20261021/OBSERVED-RUN.md`. Operator rowBW35/36/37-OP remains OPEN; overall acceptance INCOMPLETE—pending-operator. No public/native deployment is asserted. Original stochastic diagnostic failures and the explicit nick-zone correction remain documented rather than erased.

### `TASK-39` — Versioned Surge evaluation build
- **Status**: `[X]` — v1.1.77110 built, tracked, pushed and deployed to authorized Surge domain;18/18 served files hash-match; public desktop/mobile badge and Play Match entry directly observed. Gameplay feel remains operator evaluation.
- **Owner Modules**: `package.json`, `.gitignore`, new `version.txt`, new `scripts/stamp-build.mjs`, new `src/build_version.js`, `index.html`, `public/styles.css`; generated `public/deployment.json`. Named readonly interfaces: existing `scripts/download-assets.mjs`, `vite.config.ts`, `DOCS/ARCHITECTURE.md` entity5.15 text replicated here. Parent owns docs/Git/build/deploy. Original Arcade only; no Tauri access.
- **Do**:
  1. Initialize canonical version.txt from existing package.version1.0.0. Implement stamp-build.mjs with node:fs/promises and node:child_process execFileSync('git',['rev-parse','HEAD']); parse canonical version using strict three-integer regex; preserve major, increment minor once, BUILD=floor(Date.now()/60000)%100000 padded5. Write version.txt, package.json.version, public/deployment.json `{version,sourceCommit,builtAt}`. JSON.parse must be try/caught with actionable failure. No tokens/env credentials read or printed; no source timestamps recomputed at runtime. Parent invokes actual npm build after source checkpoint; do not stamp/build yourself during coding.
  2. package build command becomes `node scripts/stamp-build.mjs && node scripts/download-assets.mjs && vite build`, deploy becomes `surge ./dist squash-arcade.surge.sh`. Preserve prebuild/predev/prelint and dependencies. Root dist must be tracked: replace dist/ ignore with nested **/dist/ exclusion plus !/dist/ exception, preserving unrelated ignores.
  3. Add src/build_version.js: import package JSON version, find document.getElementById('build-version') and populate textContent='v'+version. Add standalone output#build-version aria-label Application version before existing body-closing scripts and a module script for new module. No placeholder/version hardcode, no runtime fetch/date. Text is exactly vMAJOR.MINOR.BUILD.
  4. Append readable CSS for #build-version, fixed bottom right (right max(8px,env(safe-area-inset-right)); bottom max(4px,env(safe-area-inset-bottom))), dark contrasting background, 11–12px monospace/tabular digits, z-index above existing modal/sound gate, pointer-events:none. Reserve32px bottom for #bottom-right-dock so no controls overlap. Preserve mobile layout and all other UI. Parent inspects desktop/mobile public rendering.
  5. Re-read edited regions; npm run lint. No implementation-mirroring tests for simple badge. Do not edit gameplay or unrelated files, stage/commit/push/deploy, run build, or access Tauri repo.
- **Verify (worker)**: npm run lint exits0. Parent actual npm run build must generate same stamped version in version.txt/package/public deployment and built badge, then inspect compiled/public runtime.
- **Accept (idempotent implementation)**: lint0; generated deployment.version equals canonical/package version after build; git ls-files dist/index.html tracked after parent artifact publication. Build/deploy themselves are operational steps, not side-effecting Accept assertions.
- **Runtime/deployment protocol**: Parent publishes source checkpoint, runs sanctioned manual build, records artifact hashes, deploys with npm run deploy to authorized Surge domain, independently verifies public HTML/JS/CSS/metadata hashes and browser badge/menu/game at desktop/mobile widths. Operator evaluates corrected strokes in the wild.
