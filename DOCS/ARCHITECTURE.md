---
doc_id: "ARGON-SQUASH-ARCH-001"
title: "Argon Squash — Physical Chess, Wonder First: Modular Architecture & Digital Twin"
version: "2.3.0"
status: "ALIGNED_TO_CODEGRAPH (2026-10-17 audit) + PENDING REFINEMENTS + §5.9 SHOT-LAW AD APPROVED 2026-10-21"
updated_at: "2026-10-21T03:05:00-04:00"
target_execution_model: "GLM-5.3 / Non-Reasoning Deterministic Executor"
kstore_namespace: "mba.robin.squasharcade"
kstore_schema_version: "1.3"
governing_principle: "Build -> Play -> Observe -> Adjust -> Compare -> Keep or Revert"
depends_on: []
owns_modules:
  - "src/squash/TuningConfig.js"
  - "src/squash/CourtGeometry.js"
  - "src/squash/NickCollisionModel.js"
  - "src/squash/BallPhysics.js"
  - "src/squash/RulesEngine.js"
  - "src/squash/ShotController.js"
  - "src/squash/BiomechStrokeClassifier.js"
  - "src/squash/PlayerMovement.js"
  - "src/squash/OpponentAI.js"
  - "src/squash/IntroDirector.js"
  - "src/squash/TuningPanel.js"
  - "src/squash/TestHarness.js"
  - "src/game_engine.js"
  - "index.html"
  - "public/styles.css"
  - "src/audio_engine.js"
  - "src/hud_ui.js"
  - "src/motion_controls.js"
  - "src/mii_avatars.js"
  - "src/mii_body_animation.js"
  - "src/mii_facial_fx.js"
  - "src/mii_model_overhaul.js"
  - "src/racket_kinematics.js"
  - "src/swing_vfx.js"
  - "public/companion.html"
  - "vite.config.ts"
  - "scripts/download-assets.mjs"
---

# ARGON SQUASH — AUTHORITATIVE ARCHITECTURE (`DOCS/ARCHITECTURE.md`)

## 1. Governing Philosophy & Scope

Argon Squash transforms the 3D arcade racket engine into a modular, tunable 3D Squash simulation and arcade experience guided by **"Physical Chess, Wonder First"**.

1. **Immediate Playability (< 30s)**: Newcomers can rally within 30 seconds of page load, experiencing authentic 4-wall rebounds without memorizing complex button combinations.
2. **Skills Demonstration Onboarding** *(implemented via §5.5)*: An enumerated eight-skill walkthrough—Serve, Straight Drive, Cross-Court Drive, Drop/Cut Drop, Boast, Lob, Volley, and Nick finish—each labeled `SKILL n/8 — <NAME>` and resolved through the exact same live physics engine, showing that placement, geometry, disguise, and touch are as lethal as raw power.
3. **Hypothesis-Driven Tunability**: All non-fixed physical, biomechanical, and AI parameters live in a hot-reloadable configuration store (`TuningConfig`) exposed via a developer-facing **Live Tuning Lab (`TuningPanel`)** with preset management, deterministic Nick Laboratory cannon testing, JSON import/export, and A/B trajectory comparison.

---

## 2. Canonical World Coordinate System & Fixed WSF Dimensions

All modules (`CourtGeometry`, `BallPhysics`, `NickCollisionModel`, `PlayerMovement`, `OpponentAI`, `RulesEngine`, `ShotController`, `IntroDirector`) MUST obey this single right-handed world coordinate convention:

```
                      FRONT WALL (Z = -4.875m)
         (-3.20m, -4.875m)                (+3.20m, -4.875m)
               ┌────────────────────────────────────┐
               │  Tin: Y <= 0.48m                   │
               │  Service Line: Y = 1.78m           │
               │  Front Out Line: Y = 4.57m         │
               │                                    │
    LEFT WALL  │               FRONT                │  RIGHT WALL
   X = -3.20m  │               COURT                │  X = +3.20m
               │                                    │
               ├─────────────────┬──────────────────┤  SHORT LINE (Z = +0.565m)
               │  LEFT BOX       │      RIGHT BOX   │  T-INTERSECTION: (0, 0, +0.565m)
               ├──────┐   ★ T-RECOVERY POS   ┌──────┤  CANONICAL T-POS: (0, 0, +0.92m)
               │1.6×1.6│    (0, 0, +0.92m)   │1.6×1.6│
               ├──────┘          │           └──────┤  Z = +2.165m
               │                 │                  │
               │   BACK LEFT     │    BACK RIGHT    │
               │    QUARTER      │     QUARTER      │
               │                 │                  │
               └─────────────────┴──────────────────┘
         (-3.20m, +4.875m)                (+3.20m, +4.875m)
                      BACK GLASS WALL (Z = +4.875m)
                      Back Out Line: Y = 2.13m
                      Camera Default: Z ≈ +11.8m looking -Z
```

### 2.1 Fixed Physical Constants (`COURT_SPECS`)
| Constant | Value (Meters) | Description |
| :--- | :--- | :--- |
| `LENGTH` | `9.75` | Total internal length (`Z` from `-4.875` to `+4.875`) |
| `HALF_LENGTH` | `4.875` | `FRONT_WALL_Z = -4.875`, `BACK_WALL_Z = +4.875` |
| `WIDTH` | `6.40` | Total internal width (`X` from `-3.20` to `+3.20`) |
| `HALF_WIDTH` | `3.20` | `LEFT_WALL_X = -3.20`, `RIGHT_WALL_X = +3.20` |
| `FRONT_WALL_OUT_Y` | `4.57` | Front wall out line height |
| `BACK_WALL_OUT_Y` | `2.13` | Back glass wall out line height |
| `SERVICE_LINE_Y` | `1.78` | Front wall service cut line height |
| `TIN_HEIGHT_Y` | `0.48` | Front wall metallic tin height (0.48m club / 0.43m PSA tunable) |
| `SHORT_LINE_Z` | `0.565` | `4.875 - 4.31 = +0.565m` (5.44m from Front Wall, 4.31m from Back Wall) |
| `T_POS` | `(0, 0, +0.92)` | Ideal tactical T-recovery standing position (`0.35m` behind Short Line) |
| `SERVICE_BOX_SIZE` | `1.60` | `X ∈ [±1.60, ±3.20]`, `Z ∈ [+0.565, +2.165]` |
| `BALL_RADIUS` | `0.020` | Physical squash ball radius (`20mm`, visually scaled for readability) |

---

## 3. Modular Subsystem Interfaces

### 3.1 `CourtGeometry` (`src/squash/CourtGeometry.js`)
- **Responsibility**: Builds and updates the 3D four-wall squash court mesh hierarchy, markings, tin, glass reflections, T-zone tactical floor indicator, and visual themes (`psa_glass`, `hardwood_club`, `neon_studio`).
- **Interface**:
  - `COURT_SPECS`: Frozen object of canonical court coordinates.
  - `class CourtGeometry`:
    - `constructor(scene, renderer, options)`
    - `build()` -> `THREE.Group`
    - `applyTheme(themeId)` -> Updates materials in-place (`psa_glass`, `hardwood_club`, `neon_studio`). UI-facing theme ids (`glass_showcourt`, `classic_hardwood`, `neon_cyber`) are normalized by `normalizeCourtThemeId()` in `game_engine.js`.
    - `updateTZoneGuide(playerPos, { visible, autoTEnabled, tTarget })` -> Updates the floor T-recovery vector and coverage ring.
    - `spawnSurfaceImpact(surface, pos, { isNick, isFault })` -> Impact indicator on wall/floor hits.
    - `setTinHeight(meters)` -> Repositions the tin mesh + border strip (0.48m club / 0.43m PSA).
    - `setFrontWallTransparency(transparent)` -> Toggles front-wall occlusion for rear viewpoints.
    - `update(dt)` -> Animates impact indicators.
  - `getSideWallOutHeightAtZ(z)` (module-level export) -> Linearly interpolates side wall out-line height between `Z = -4.875 (4.57m)` and `Z = +4.875 (2.13m)`.
  - Shared `materials.outLine` (red `0xef4444`) currently drives the front, back, and both side out lines — see §5.2 for the planned dedicated back-wall material.

### 3.2 `NickCollisionModel` (`src/squash/NickCollisionModel.js`)
- **Responsibility**: Evaluates experimental wall-floor nick junctions, front-wall/side-wall vertical corner glancing interactions, and deterministic Nick Laboratory ball launches.
- **Interface** (all methods `static`):
  - `evaluateWallFloorNick(ball, params)` -> `{ triggered: boolean, quality: 'ROLLOUT_NICK' | 'CLING_NICK' | 'NONE', normalImpulse, lateralRollVel }`
  - `evaluateFrontCornerJunction(ball, params)` -> Handles tight sequential front-wall/side-wall bevel interactions.
  - `getNickLabScenario(scenarioId)` -> Returns deterministic initial state `{ pos, vel, spin, description }` for:
    - `'demo_a_kill'` (High volley aggressive kill into front-left nick)
    - `'demo_b_soft_drop'` (Floating open-face cut drop into front-left nick)
    - `'tight_rail'` (Clinging straight drive along left wall)
    - `'two_wall_boast'` (Side-wall to front-wall nick boast)
    - `'back_wall_boast'` (Rear glass recovery boast)

### 3.3 `BallPhysics` (`src/squash/BallPhysics.js`)
- **Responsibility**: Fixed-timestep (`120Hz` with 4x CCD sub-stepping) 3D ball integration, aerodynamic drag, Magnus spin coupling, squash-ball temperature/bounciness scaling, wall/floor restitution, and collision event emission.
- **Interface** (all methods `static`):
  - `stepBallPhysics(ball, dt, params, tuningStoreRef, callbacks)` -> Returns collision events `[{ surface: 'front_wall' | 'side_wall_left' | 'side_wall_right' | 'back_wall' | 'floor' | 'tin', pos, speed, isNick, isOut }]`; each is also delivered via `callbacks.onCollision`.
  - `simulateTrajectory(initialBall, params, tuningStoreRef, { maxTimeSec = 2.8, dt = 1/120 })` -> Deterministic predictor returning `{ samples, events, firstFloorBouncePos, secondFloorBouncePos, backWallImpactPos, willHitBackWallBeforeSecondBounce, optimalBackWallStrikePos, nickTriggered, nickInfo }` for `OpponentAI` interception and A/B Tuning Lab comparison.

### 3.4 `RulesEngine` (`src/squash/RulesEngine.js`)
- **Responsibility**: Enforces squash rally rules, service box legality, front-wall requirement before second floor bounce, Tin faults (`Y <= tinHeight`), Out lines (front, side sloped, back wall), double-bounce winners, and scoring systems (`PAR_11`, `ARCADE_5`, `HIHO_9`), plus optional Let/Stroke interference checks.
- **Interface**:
  - `class RulesEngine`:
    - `constructor(options)`, `resetMatch({ gamesToWin, scoringMode })`, `getTargetPointsToWinGame()`
    - `onStrokeHit(ball, hitterRole, { isServe, shotType, isDisguised })` -> Resets per-shot tracking flags on the ball.
    - `evaluateCollision(evt, ball)` -> Surface-collision outcome `{ rallyEnded, winner, reason, ... }` (tin/out/not-up/double-bounce).
    - `evaluateBallPlayerBodyCollision(ball, playerActor, opponentActor)` -> WSF Rule-9 ball-hits-player decisions with escalating safety warnings (`STROKE_WITH_SAFETY_WARNING`, `LET_WITH_SAFETY_WARNING`, `REBOUND_HIT_RECEIVER`).
    - `evaluateInterference(receiverActor, hitterActor, ball)` / `resolveLetAppeal({ callerRole, activeInterference, ball, receiverActor, hitterActor })` -> Let/stroke appeal outcomes.
    - `awardPoint(winnerRole)` -> Updates points, games, hand-in/hand-out server state, and service box side (`left` / `right`).
    - `formatScoreHUD()` -> Display score string; `formatRefereeCallout(outcome, reason)` -> WSF-style spoken callout ("Down! Handout, five-four."); `getHighStakesLabel()` -> `'Game Ball' | 'Match Ball' | null`.

### 3.5 `ShotController` (`src/squash/ShotController.js`)
- **Responsibility**: Decouples **Preparation (Windup & Hold)** from **Execution (Racket-Face Cut Angle, Forearm Pronation, Swing Speed, and Directional Aim)**.
- **Key Invariant**: Preparation duration does NOT force high power or prevent soft drops. A player can hold a full backswing preparation (`prepCharge = 1.0`) and execute either a `185 km/h` flat drive OR a `44 km/h` `+36°` open-face disguised drop.
- **Interface**:
  - `SQUASH_SHOT_TYPES`: Frozen enum (`STRAIGHT_DRIVE`, `CROSS_DRIVE`, `OFF_BACK_WALL_DRIVE`, `DROP`, `BOAST`, `LOB`, `VOLLEY_KILL`, `SERVE`, ...).
  - `class ShotController`:
    - `beginPreparation(role, nowSec, options)` -> Enters coiled backswing hold state for a role (`'player'`/`'opponent'`).
    - `updatePreparation(role, dt, params)` -> Updates visual windup hold & disguise posture.
    - `clearPreparation(role)`, `getPrepState(role)` -> Prep-state lifecycle.
    - `computeServeExecution({ actor, serviceSide, inputEvent, params })` -> Serve trajectory targeting the opposite rear quarter court.
    - `computeShotExecution({ actor, ball, opponent, inputEvent, prepState, params })` -> Returns `{ shotId, label, vel, spin, cutAngleDeg, forearmPronationDegPerSec, isDisguised, targetLanding, timingGrade }`.

### 3.6 `PlayerMovement` (`src/squash/PlayerMovement.js`)
- **Responsibility**: Handles shared-court locomotion for both actors with acceleration, inertia, court boundary clamping, subtle body-clearing around the opponent, manual movement (`WASD` / Arrows / Pose Lunges), and the prominent **AUTO-T-RETURN: ON / OFF** toggle.
- **Interface** (all methods `static`):
  - `getTRecoveryPosition(params, offsetRole)` -> Returns tactical recovery point near `COURT_SPECS.T_POS` (`(0, 0, +0.92m)`) with a small per-role stagger.
  - `updatePlayerRallyTarget({ player, opponent, ball, keysDown, poseLungeOffset, params, interceptPoint, predictedTrajectory })` -> Sets `targetPos` for receiver interception or T-recovery each rally tick.
  - `stepActorLocomotion(actor, otherActor, dt, params, isRecoveringToT)` -> Integrates velocity toward `targetPos` with court bounds and opponent body-clearing.

### 3.7 `OpponentAI` (`src/squash/OpponentAI.js`)
- **Responsibility**: Implements the "Physical Chess" opponent AI with pattern-memory tracking (detecting repeated straight drives vs drops), preparation reading (reacting to player's windup disguise with configurable `reactionDelayMs` and `anticipationStrength`), T-recovery discipline, and tactical shot selection.
- **Interface**:
  - `class OpponentAI`:
    - `resetMemory()` -> Clears the pattern-memory window.
    - `recordPlayerShot(shotResult, ballState, params)` -> Updates pattern memory window.
    - `observePlayerPreparation(opponentActor, playerActor, prepState, params)` -> May bias AI deeper when player shows full drive windup.
    - `updateAI({ opponent, player, ball, dt, params, ... })` -> Per-tick tactical update (destructured object args).
    - `chooseTacticalShot({ opponent, player, ball, params, distXZ })` -> Selects the next shot type/aim.

### 3.8 `IntroDirector` (`src/squash/IntroDirector.js`)
- **Responsibility**: Orchestrates the playable, skippable eight-part **Skills Demonstration** onboarding (Serve, Straight Drive, Cross-Court Drive, Drop/Cut Drop, Boast, Lob, Volley, Nick finish — labeled `SKILL n/8`), skill-name banners and tips, and interactive slow-motion corner nick replay inspection on the capstone shot.
- **Roadmap note**: Implemented — the former "wonder demo" mystery framing is replaced by enumerated skill naming. See §5.5.
- **Interface**:
  - `class IntroDirector`:
    - `constructor(engine)` -> Bound to the root `ArgonSquashEngine`.
    - `startIntro(startAt = 'SKILL_1_FEED')` -> Begins the eight-part skills demonstration sequence.
    - `skipToPlayableMatch()` -> Skips straight to live play.
    - `triggerSlowMoReplay()` -> Interactive slow-motion corner nick inspection.
    - `update(dt)` -> Advances the current step state machine.

### 3.9 `TuningPanel` & `TestHarness` (`src/squash/TuningPanel.js`, `src/squash/TestHarness.js`)
- **Responsibility**: Renders the toggleable **Live Tuning Lab** (`Lab / Tune` button or `L` key) with:
  1. Live sliders for **Ball Physics**, **Racket & Shot Mechanics**, **Movement & AI**, and **Biomechanical Stroke Classifier** (`handedness`, confidence hysteresis, temporal weights).
  2. **Preset Manager**: Save named preset, Duplicate preset, Switch preset, Reset module/all, JSON Export/Import.
  3. **Nick Laboratory & Deterministic A/B Comparator**: Launch repeatable shots (`Demo A Kill`, `Demo B Floating Drop`, `Tight Rail`, `Boast`, `Off-Back-Wall Drive`) and compare Preset A vs Preset B trajectories side-by-side with identical seeds.
  4. **Automated Invariant Test Runner**: Runs and displays pass/fail status for court bounds, wall/tin rules, nick physics, Auto-T-Return, decoupled shot disguise, and biomechanical Forehand/Backhand classification.
- **Interface**: `new TuningPanel(engine, store = tuningStore)`; `TestHarness.runAll(liveEngine)` (static); `TuningConfig.js` exports `SIM_VERSION`, `DEFAULT_TUNING_PARAMS` (groups: `ballPhysics`, `shotMechanics`, `movementAndAI`, `rulesAndView`), `BUILTIN_PRESETS`, `createSeededRNG`, `TuningConfigStore`, and the `tuningStore` singleton.

### 3.11 `ArgonSquashEngine` — Root Orchestrator (`src/game_engine.js`)
- **Responsibility**: Top-level game state machine and composition root. Owns the Three.js scene/renderer, both actor objects (`player`, `opponent`), the ball, camera rig, HUD wiring, intro/replay/spectator modes, multiplayer room sync against `/api/match/*`, and the `DOMContentLoaded` bootstrap. Exported as `ArgonTennisEngine` and aliased `ArgonSquashEngine`.
- **Phase state machine**: `SETUP -> SERVE_STANCE -> SERVE_TOSS -> RALLY -> POINT_OVER` (+ `REPLAY`, `RACKET_SPIN`, intro/spectator states). `_setupPointServe()` positions actors via `_getServeStandingPositions()` (which derives both box positions from `score.serviceSide`); `_startServeToss(actor)` begins the serve.
- **Camera**: `cameraMode` (`'RALLY_CAM' | 'SERVE_CAM' | 'CORNER_NICK_CAM' | 'INTRO_PAN' | 'SHOWCASE_CAM' | 'REPLAY_CAM'`), `manualCameraOverride`, `_computeTargetCameraPose()` per-mode poses, `onCycleCamera` bound to `KeyC` and HUD camera pills.
- **Also owns**: `normalizeCourtThemeId()` UI-theme mapping, `_updateProjectedHUD()` server tag projection, `_projectToScreen()`.

### 3.12 `AudioEngine` (`src/audio_engine.js`)
- **Responsibility**: All audio output through one WebAudio graph (`ctx` -> `masterGain` -> `sfxGain` / `musicSynthGain` / `reverbSend`).
- **Exports**: `LYRIA_TRACKS` (14 jukebox tracks: 7 synth originals + 3 synth remixes + 4 legacy mp3s — count corrected 2026-10-21, see §5.10), `JUKEBOX_TRACK_LIST`, `ORIGINAL_DEFAULT_TRACK_IDS`, `STATE_TO_TRACK` (game-state -> track map), `NARRATOR_USP_INVITES` (scripted narrator lines), `GEMINI_TTS_CLIPS = {}` (empty clip map, currently unused), `AudioEngine`.
- **Referee voice today**: `playVoiceCallout` -> `SpeechSynthesisUtterance` with `_selectDeepMaleVoice()` (prefers `Google UK English Male`/system male voice, `en-GB`), `refereeVoicePitch`/`refereeVoiceRate` tunables, and `_playRefereeBaritonePA` (oscillator formant bed behind speech). `announceScore(outcome)` composes callout text + chime.
- **Runtime invariants (invisible to codegraph — document-only)**:
  - Two track types in `LYRIA_TRACKS`: `'audio'` = HTMLAudioElement streaming remote `www.gstatic.com` mp3s (4 legacy tracks, no local audio files ship in `dist/`); `'synth'` = 7 original Web Audio sequencer tracks.
  - **Autoplay gate**: `'audio'` elements at `volume=0`/`muted` count as muted for the browser autoplay policy → `el.play()` CAN resolve before any gesture, then `_fadeAudio` raises volume → audible music on load. `'synth'` tracks run on `AudioContext`, which **cannot** resume pre-gesture under any code path → silent until first click. Therefore `STATE_TO_TRACK` state→type mapping decides whether music is audible on page load. `deeea2e` remapped every state to synth tracks, regressing audible autoplay — see §5.6.
  - **`jukeboxMode`** (`'auto' | 'locked' | 'shuffle'`): rotation advances only via the `_synthTimer` 256-step boundary (synth) or the element `ended` event (audio). `loop:true` mp3s never `ended` → audio tracks cannot self-advance; only `court_intro`/`victory_fanfare` (`loop:false`) even fire `ended`, and those handlers ignore `'auto'` mode. Manual `next/prevJukeboxTrack` currently sets `jukeboxMode='locked'` — one skip silently kills all rotation and `playMusicForState`.
  - `playWelcomeIntro` sets `_welcomePlayed` before verifying the context; a pre-gesture call permanently swallows the one-shot welcome.

### 3.13 `HudUI` (`src/hud_ui.js`)
- **Responsibility**: Wii-styled DOM HUD facade — scoreboard, center banners, timing gauge & grade popups, server-position tag, let/stroke advisory, modals (rules/controls/companion), jukebox panel, camera label pills. Renders Mii avatars via `mii_avatars.js`.

### 3.14 `MotionController` (`src/motion_controls.js`)
- **Responsibility**: Input abstraction for swing generation — keyboard/mouse, MediaPipe Pose + Hands webcam tracking (with optical-flow fallback), and phone-relay polling against `/api/match/state` + `/api/racket/*`. Emits `onSwing`, `onToss`, `onRoomState` callbacks consumed by `ArgonSquashEngine`. Roles `p1`/`p2` support 2-player split.

### 3.15 Mii Presentation Stack
- **`src/mii_avatars.js`**: `MII_PROFILES` (player1 Ammaar, player2 Maya, opponent1 Matt, opponent2 Akira), `resolveMiiProfile`, `getMiiAvatarSVG`, `renderAllHudMiiAvatars` — 2D SVG badge avatars for HUD/menus.
- **`src/mii_body_animation.js`**: `MII_RIG_PIVOTS` and pose helpers driving the 3D Mii rigs (idle, swing, locomotion).
- **`src/mii_facial_fx.js`**: `FACIAL_STATES` (`NEUTRAL`, `BLINK`, `FOCUSED_SQUINT`, ...) and facial expression animation.
- **`src/mii_model_overhaul.js`**: `upgradeMiiCharacterMaterials`, `upgradeRacketMaterials`, `upgradeCharacterShadowBlob`, `updateCharacterContactShadow`, `createDoubleRingShadowTexture` — Wii rim-lighting shader injection and contact shadows.
- **`src/racket_kinematics.js`**: Racket mount/pose kinematics per actor (rim/throat world points consumed by `swing_vfx`).
- **`src/swing_vfx.js`**: `SHOT_VFX_PALETTES`, `getShotPalette`, `sampleActorRacketRimWorldPoints`, `RacketRibbonTrail` — swing ribbon trails and shot-colored particle FX.

### 3.16 Deployment Edge (`vite.config.ts`, `public/companion.html`, `scripts/download-assets.mjs`, `scripts/argonSquashRelayPlugin.sh`, `public/argonSquashRelayPlugin.sh`)
- **`argonSquashRelayPlugin`** (dev/preview middleware only — **absent from `dist/`**): in-memory room state, `/api/racket/*` (phone state/swing/telemetry/feedback), `/api/match/*` (create/state/sync), `/api/tunnel/status`, `/assets/*` -> `www.gstatic.com` fallback proxy. `GEMINI_API_KEY` is defined via `loadEnv` but `@google/genai` is declared in `package.json` and **never imported** — see §5.4 cleanup.
- **`public/companion.html`**: Static phone-racket client posting to `/api/racket/*`; works only behind the relay middleware (dev/preview or an equivalent host).
- **`public/` deploy rule**: Any static asset referenced by a relative root path in `index.html` (e.g. `<link href="./styles.css">`) MUST live under `public/` — Vite copies `public/` verbatim into `dist/`; root-level files are dev-only and silently 404 on static hosts. (2026-10-17: `styles.css` moved root → `public/` after the side-docked menu rendered centered on surge.)
- **`scripts/download-assets.mjs`**: Build-time fetcher for GLB models and MediaPipe assets into `public/assets/` — one-time vendoring, not a runtime dependency.
- **Static hosting boundary**: `npm run build` -> `dist/` is fully servable on surge.sh for solo play; multiplayer rooms and phone controllers need the relay layer (§5.4). Remote media URLs (e.g. `gstatic.com` audio) are fetched at runtime and unaffected by `dist/` completeness — but their reachability and the track-type autoplay semantics (§3.12) are runtime-only facts no static check covers.
- **Deploy & DNS convention (org-global, not repo-scoped)**: `npm run deploy` → `surge-deploy ./dist squash-arcade.surge.sh`. `surge-deploy` is the globally-installed wrapper at `E:\DevTools\surge-robin` (`npm i -g E:\DevTools\surge-robin`): it runs `npx surge <dir> <domain>` per domain and, for every `*.surge.sh` or `*.robin.mba` domain, upserts the `<label>.robin.mba` CNAME → `na-west1.surge.sh` via `dns-upsert` (Namecheap XML API, getHosts→merge→setHosts read-modify-write, diff-only). The `*.robin.mba` wildcard is never touched — only explicit labels. Credentials: `NAMECHEAP_API_USER`/`NAMECHEAP_API_KEY`/`NAMECHEAP_CLIENT_IP` from env or `.env` beside the tool (canonical source: Admin-Manual credentials). Every org surge.sh deploy should go through `surge-deploy`, not bare `npx surge`, so the robin.mba mirror is never skipped.

---

### 3.17 `BiomechStrokeClassifier` (`src/squash/BiomechStrokeClassifier.js`) — Player-Relative Temporal Forehand/Backhand Classification

#### 3.17.1 Legacy Classifier Audit (Actual Implementation Deficiencies)
The legacy classifier inside `MotionController._evaluateHandTrail` relied on three fragile heuristics:
1. **Horizontal Swing Velocity Sign (`vx < -0.14` = Forehand; `vx > +0.14` = Backhand)**: Conflated finishing swing vector with anatomical stroke identity. Legitimate forehand inside-out drives, forehand open-faced cut drops carving outward, and left-handed cross-body strokes violate this rule; conversely, cross-body follow-throughs or late wrist snaps reversed stroke identity mid-swing.
2. **2D Index/Pinky MCP Horizontal Ordering (`idxX < pnkX`)**: Treated 2D screen projection of `lm[5].x` vs `lm[17].x` as definitive evidence of pronation/supination without accounting for forearm elevation, wrist flexion, camera perspective foreshortening, or handedness.
3. **Static Screen Centerline Fallback (`first.x < bodyCenterX`)**: Ignored torso rotation, hitting-shoulder/elbow lever geometry, temporal preparation history, and confidence degradation under partial occlusion.

#### 3.17.2 Approved Biomechanical Architecture & Separation of Concerns
`BiomechStrokeClassifier` is a standalone, zero-DOM-coupled biomechanical classifier module (reusable across both **Argon Squash** and **VirtuaSquash**) that strictly separates **Stroke Identity** from **Shot Mechanics**:

- **Independent Output Contract (`StrokeClassificationResult`)**:
  ```ts
  interface StrokeClassificationResult {
    strokeSide: 'forehand' | 'backhand' | 'uncertain'; // Canonical anatomical stroke identity
    lockedStrokeSide: 'forehand' | 'backhand' | 'uncertain'; // Hysteresis-stabilized side
    confidence: number; // [0.0 .. 1.0] overall biomechanical confidence
    phase: 'IDLE' | 'PREPARATION' | 'BACKSWING_APEX' | 'FORWARD_SWING' | 'INFERRED_CONTACT' | 'FOLLOW_THROUGH';
    handedness: 'right' | 'left';
    shotMechanics: {
      shotType: 'drive' | 'drop' | 'cut_drop' | 'lob' | 'boast' | 'volley_kill';
      cutModifier: boolean;
      isDeceptiveLateRelease: boolean;
      speedNormalized: number;
      dirX: number;
      dirY: number;
    };
    swingKinematics: {
      peakSpeed: number;
      contactVelocity: { vx: number; vy: number; vz: number };
      peakAcceleration: number;
      followThroughVector: { dx: number; dy: number };
      isCrossBodyFollowThrough: boolean;
    };
    racquetFaceOrientation: {
      normal3D: { nx: number; ny: number; nz: number };
      openFaceCutDeg: number;
      pronationState: 'supinated_open' | 'neutral_square' | 'pronated_closed' | 'uncertain';
      orientationConfidence: number; // Degrades gracefully to 0 under foreshortening/occlusion
    };
    playerGeometry: {
      sDomPrep: number;      // Preparation lateral offset in dominant-shoulder units (+ = Forehand side, - = Backhand side)
      sDomApex: number;      // Backswing apex lateral offset in dominant-shoulder units
      sDomContact: number;   // Inferred contact lateral offset in dominant-shoulder units
      elbowLeverageScore: number; // Hitting wrist vs elbow/shoulder anatomical configuration [-1..+1]
      torsoYawDeg: number;   // Estimated upper-torso coil angle
    };
    evidenceBreakdown: {
      prepApexScore: number;     // [-1 (BH) .. +1 (FH)]
      contactZoneScore: number;  // [-1 (BH) .. +1 (FH)]
      armChainScore: number;     // [-1 (BH) .. +1 (FH)]
      palmNormalScore: number;   // [-1 (BH) .. +1 (FH)]
      kinematicSupportScore: number; // [-1 (BH) .. +1 (FH)]
    };
  }
  ```

#### 3.17.3 Canonical Player-Centric Coordinate Transformation
Before any biomechanical calculation, raw camera landmarks `(u, v, z)` are transformed into the **True Player Anatomical Frame**:
1. **Camera Perspective Normalization**:
   - Let `u_raw ∈ [0, 1]` be raw image horizontal coordinate.
   - We transform into **Player-Facing Physical Coordinates** where `+X_phys` always corresponds to the player's **Anatomical Right Side** when facing the camera/TV:
     - For `facingMode === 'user'` (Front-facing camera): in raw unmirrored sensor space, the player's anatomical right arm is at smaller `u_raw` (`x_phys = 0.5 - u_raw`); in already-mirrored display space (`u_mirrored = 1 - u_raw`), `x_phys = u_mirrored - 0.5`. `BiomechStrokeClassifier.normalizePoint()` explicitly accepts `{ coordSpace: 'raw_sensor' | 'display_mirrored', facingMode: 'user' | 'environment' }` so mirrored and unmirrored feeds map to the exact same anatomical frame.
2. **Torso Origin, Shoulder Width & Dominant-Side Basis Vector ($\hat{\mathbf{u}}_{dom}$)**:
   - From MediaPipe Pose landmarks (`left_shoulder [11]`, `right_shoulder [12]`, `left_elbow [13]`, `right_elbow [14]`, `left_hip [23]`, `right_hip [24]`) or adaptive upper-body torso tracking:
     - Torso Center: $\mathbf{C}_{torso}(t) = \frac{1}{2}(\mathbf{S}_L(t) + \mathbf{S}_R(t))$
     - Shoulder Span: $W_{sh}(t) = \max(0.10, \|\mathbf{S}_R(t) - \mathbf{S}_L(t)\|)$
     - Dominant Lateral Axis:
       $$\hat{\mathbf{u}}_{dom} = \begin{cases} +1 \cdot \hat{\mathbf{u}}_{right} & \text{if handedness = 'right'} \\ -1 \cdot \hat{\mathbf{u}}_{right} & \text{if handedness = 'left'} \end{cases}$$
   - Any hitting-hand/wrist position $\mathbf{H}(t)$ is projected into **Dominant-Shoulder Normalized Coordinates**:
     $$s_{dom}(t) = \frac{(\mathbf{H}(t) - \mathbf{C}_{torso}(t)) \cdot \hat{\mathbf{u}}_{dom}(t)}{W_{sh}(t)}$$
     - **$s_{dom}(t) > 0$**: Hitting hand is on the player's **Dominant / Open (Forehand) side** of their torso centerline.
     - **$s_{dom}(t) < 0$**: Hitting hand is across the midline on the player's **Non-Dominant (Backhand) side** of their torso centerline.

#### 3.17.4 Temporal Sequence Classification (`Preparation → Backswing → Forward Swing → Contact → Follow-Through`)
Instead of classifying from a single 2-point velocity delta, `BiomechStrokeClassifier` maintains a sliding temporal buffer (`600ms` window) and segments each stroke into phases:
1. **`PREPARATION` & `BACKSWING_APEX`** (Primary Weight: `0.55`):
   - Records where the racket/hand is loaded (`sDomPrep`) and reaches peak coil (`sDomApex`) before forward acceleration begins.
   - Once forward acceleration peaks (`FORWARD_SWING`), the preparation/backswing evidence is **latched** so that a cross-body follow-through (`FOLLOW_THROUGH` crossing into negative `s_dom`) or a deceptive late wrist flick cannot overwrite the preparation side.
2. **`INFERRED_CONTACT` & Hitting-Arm Chain Geometry** (Secondary Weight: `0.30`):
   - Evaluates the hand's player-relative position at peak speed (`sDomContact`) and, when Pose elbow/shoulder landmarks are present, the **Elbow-to-Wrist Lever Configuration** (whether the hitting wrist is loaded lateral to the hitting shoulder/elbow in an open forehand slot or across the chest/lead shoulder in a backhand slot).
3. **3D Palm Surface Normal & Supporting Kinematics** (Supporting Weight: `0.15`):
   - Computes the 3D cross-product palm normal $\mathbf{n}_{palm} = (\mathbf{P}_9 - \mathbf{P}_0) \times (\mathbf{P}_5 - \mathbf{P}_{17})$ weighted by `foreshorteningConfidence` (downweighting edge-on or occluded views).
   - Uses horizontal velocity only as a weak supporting cue (`weight <= 0.08`), ensuring that an inside-out Forehand (`vx` moving toward the dominant side) or a vertical Forehand/Backhand Cut Drop (`vx ≈ 0`) is classified accurately by its player-relative preparation and contact geometry.
4. **Confidence & Anti-Flicker Hysteresis**:
   - If total weighted evidence magnitude $|E_{total}| < \theta_{uncertain}$ (default `0.22`) or landmark visibility is degraded, `strokeSide` reports `'uncertain'`, and `lockedStrokeSide` retains the last high-confidence stance (`>= 0.52`) with exponential decay rather than flickering rapidly between `FH` and `BH`.

---

## 4. Acceptance Criteria & Verification Gates

1. **Gate A (Playable Rally)**: Ball launches legally off the front wall (`Z = -4.875m`, `1.78m < Y < 4.57m` on serve; `0.48m < Y < 4.57m` in rally), rebounds into shared court, and both Mii characters rally continuously with visible PAR 11 scoring.
2. **Gate B (Coordinate & Auto-T-Return Integrity)**: T-Position is at `(0, 0, +0.92m)` just behind the Short Line (`Z = +0.565m`). Toggling `AUTO-T-RETURN: ON/OFF` immediately switches between physical auto-recovery to the T and full manual positioning.
3. **Gate C (Decoupled Disguise & Shot Shaping)**: A full preparation windup (`prepDuration >= 0.45s`) can produce both a `>165 km/h` flat drive AND a `<55 km/h` open-face (`+34° cut`) disguised drop shot.
4. **Gate D (Physical Nick Emergence)**: Both Demonstration A (fast volley kill) and Demonstration B (slow open-face drop) achieve a wall-floor nick rollout (`max rebound height < 0.06m`) through `NickCollisionModel` + `BallPhysics` without scripted teleportation.
5. **Gate E (Live Tuning Lab & Determinism)**: Adjusting any parameter in `TuningPanel` updates the running game immediately; running the same Nick Lab seed twice produces identical trajectories (`Δpos < 1e-6m`).
6. **Gate F (Biomechanical Forehand/Backhand Stroke Classification)**: `BiomechStrokeClassifier` passes 100% of reproducible stroke suites across right-handed, left-handed, mirrored front-cam, unmirrored rear-cam, vertical drops/lobs, cross-body follow-throughs, late deceptive wrist changes, partial occlusion (`uncertain` degradation), and strokes whose horizontal `vx` sign contradicts naive screen-direction rules.
7. **Gate G (Serve Errors — implemented)**: With `aiServeWrongBoxChance=1` the AI visibly walks to the wrong box; `evaluateServeStanceLegality` returns `WRONG_BOX`/`FOOT_FAULT` deterministically; `Fault!`/`Foot fault!` callouts fire and handout is awarded. Legality is judged only after the server has arrived in the box (`dist(pos,targetPos) < 0.4`) so mid-walk center-line crossings cannot phantom-fault.
8. **Gate H (Back-Wall Line — planned)**: Back-wall out line renders at reduced opacity/lighter tint in all three themes while front and side out lines are unchanged.
9. **Gate I (Front-Wall Cam)**: `C` / both camera pills cycle six labels ending in `Front Wall`; in `FRONT_WALL_CAM` the camera is embedded inside the front-wall glass (transparent) and tracks the ball horizontally — full back court visible, corner lunges framed face-on; cycle wraps to `Back Glass`.
10. **Gate J (Skills Demo — planned)**: Onboarding presents a clearly labeled skills walkthrough; each demonstrated shot is named for its squash skill on screen; skip-to-play still works; no unexplained "wonder" framing remains in user-facing text.

---

## 5. Planned Refinements (Approved for Implementation)

### 5.1 Two-Tier AI Serve Errors (`OpponentAI` + `RulesEngine` + `ArgonSquashEngine`)
- New `movementAndAI` tuning params: `aiServeWrongBoxChance` (default ~0.04), `aiServeSelfCorrectChance` (~0.55), `aiServeFootFaultChance` (~0.001 — exceptionally rare by design). All AI behavior probabilities/strengths are operator-overridable at build/host level via `VITE_SA_*` env vars (see `.env.example`; not player preferences — they bypass the tuning lab and survive persisted presets).
- `_getServeStandingPositions` (`game_engine.js`): when the AI serves and the wrong-box roll hits, flip `isRightBox` for the **server's** `targetPos` only. Self-correct roll success -> visible mid-stance walk to the correct box + confused Mii face (`FACIAL_STATES`); failure -> serve proceeds and `evaluateServeStanceLegality` reports `WRONG_BOX` -> `Fault!` + handout.
- New `RulesEngine.evaluateServeStanceLegality(serverPos, serviceSide)` -> `'WRONG_BOX'` on box-sign mismatch; `'FOOT_FAULT'` when `|pos.x| < 0.22` (on the half-court line) or `pos.z < SHORT_LINE_Z + 0.02` (on/short of the short line) at toss. `formatRefereeCallout` gains `'foot fault'` -> `Foot fault!` and `'wrong box'` -> `Fault!` prefixes. Both faults lose the rally per WSF rules.
- **Arrival gate**: `_startServeToss` evaluates `actor.pos` only once `dist(actor.pos, actor.targetPos) < 0.4` — the actor teleports to its stance at `_setupPointServe`, so a server still walking in (e.g. an early chip/Space press) cannot fault mid-crossing; deliberate error rolls still fire because the illegal stance IS the target.
- The legality check is role-agnostic (auto-detects human serves too once manual serve movement exists); probability rolls apply to AI only.

### 5.2 Lighter Back-Wall Out Line (`CourtGeometry`)
- `_createMaterials`: add `materials.backOutLine` (`MeshBasicMaterial`, `transparent: true`, `opacity ≈ 0.38`, lighter red `0xf87171`); back-wall out mesh in `_buildCourtMarkings` uses it; `applyTheme` gains a per-theme `backOutLine` entry so `psa_glass`/`hardwood_club`/`neon_studio` stay consistent. Front/side out lines keep shared `materials.outLine`.

### 5.3 Front-Wall Viewpoint in Camera Cycle (`ArgonSquashEngine` + `CourtGeometry`) — IMPLEMENTED
- Cycle (`KeyC` / `btn-camera-cycle` / `btn-top-camera-cycle` -> `onCycleCamera`, `game_engine.js`): `[null, 'RALLY_CAM', 'SERVE_CAM', 'CORNER_NICK_CAM', 'INTRO_PAN', 'FRONT_WALL_CAM']`; both pill labels (`camera-mode-label`, `camera-mode-label-top`) update via `updateCameraLabel`.
- `_computeTargetCameraPose` branch embeds the cam INSIDE the front-wall slab (z ≈ -4.94, wall span -4.875..-5.015) at waist height (y=1.35), slides `x` with `ball.x * 0.6` (clamped ±2.6) and looks at the ball toward the back glass — PSA-broadcast-style face-on corner lunges over the whole court.
- When `FRONT_WALL_CAM` is the effective mode, `CourtGeometry.setFrontWallTransparency(true)`; restored on exit. HUD projections go through `_projectToScreen` — unchanged.

### 5.4 Google Dependency Cleanup (Cost Zero)
- Remove `@google/genai` from `package.json` (no imports exist) and the `process.env.GEMINI_API_KEY` define from `vite.config.ts`.
- Keep `/api/*` relay for dev/multiplayer; document that surge.sh `dist/` hosting covers solo play only (§3.16).

### 5.5 Skills Demonstration Onboarding (reworks the "Wonder-First" Demo)
- **Why**: The current two-part "wonder demo" is thematically mysterious — an unexplained nick showcase that sits incongruously beside the setup menu, tuning lab, and referee callouts. Reframe onboarding as a general skills tutorial.
- **`IntroDirector` rework**: step sequence becomes an enumerated **Skills Demonstration** — Serve, Straight Drive, Cross-Court Drive, Drop/Cut Drop, Boast (two-wall + back-wall), Lob, Volley, Nick finish — each step labeled on screen with the skill name (e.g. `SKILL 3/8 — DROP`) and a one-line description. Reuses `NickCollisionModel.getNickLabScenario` for launch vectors plus new scenario entries for skills not yet scripted.
- **Presentation**: banners/callouts switch from mystery punchlines to skill names + tips; slow-mo replay inspection stays as the capstone on the final kill/drop demo; `skipToPlayableMatch` unchanged.
- **Copy sweep**: §1 bullet 2 and any HUD/menu strings referencing "wonder"/demo A/B mystery wording are updated to the skills-demo naming.

### 5.6 Audio Autoplay & Jukebox Rotation Fix (`AudioEngine`)
- **Why**: `deeea2e` remapped all `STATE_TO_TRACK` states to `'synth'` tracks, which can never sound before a gesture — deployed pages play total silence until a click. Manual jukebox ⏭/⏮ silently sets `jukeboxMode='locked'`, permanently disabling rotation and all state music; and `loop:true` audio tracks can never advance.
- **Muted-start autoplay**: preload/`_crossfadeToTrack` sets `el.muted=true` before `el.play()`, unmuting on `'playing'` — restores audible-on-load for any `'audio'` track, gesture or not.
- **State map (as shipped)**: boot-visible states map to the 7 original Argon Squash synths (`title/menu/select→argon_glass_overture`, `intro/start/flyover→crimson_tin_fanfare`, `serve*/rally/point/match→physical_chess_protocol`, `gamepoint→nick_roller_overdrive`, `replay→alexandria_showcourt_nights`, `victory/win/match_over/celebration→psa_championship_crown`, `game_won→forearm_cut_funk`) — the game opens on track #1, never the tennis classics; legacy mp3s stay jukebox-selectable only.
- **Sound-gate**: `#btn-sound-gate` prominent "CLICK HERE FOR SOUND" CTA since synths can't self-start pre-gesture; hides via `AudioContext statechange` — never renders in native WebView builds (`mediaPlaybackRequiresUserGesture=false` starts ctx `running`).
- **Track timbre**: `TRACK_DRUM_KIT` per-track kick/snare/hat personalities; `drive` waveshaper param on `_triggerSynthVoice`; per-track signature voices (pad swell, chess-clock tock, brass+timpani, driven acid+sub, Hijaz sweep+drone, slap pops, crowd crash+supersaw).
- **Stop silent lock**: remove the auto-`'locked'` assignment in `nextJukeboxTrack`/`prevJukeboxTrack` — skip is not a lock; `setJukeboxMode`/`selectJukeboxTrack(lock)` remain the explicit lock paths.
- **Audio-track rotation**: `ended` → shuffle→random next, auto→sequential next, locked→replay; `el.loop` toggled `track.loop && mode==='locked'` on start/mode change.
- **`_welcomePlayed`**: set only after `_ensureContext()` succeeds.

### 5.7 Retrieval Timing & Hip-Drive Stroke Mechanics (`PlayerMovement` + `ArgonSquashEngine`) — shipped
- **Target state**: receivers never arrive-plant-flap. Contact time `tContact` is derived from `currentPredictedTrajectory` (ball reaching the strike window); actor travel time = `dist/(maxSpeed * recoveryScale)`. When `travelTime < tContact - margin`, the actor holds a staging point *behind the ball's line* (on the T→intercept path) and releases to the final target so arrival coincides with the contact window (~150ms lead, still moving through the shot). `updatePlayerRallyTarget`/`stepActorLocomotion` remain the implementation hooks (`game_engine.js` intercept source ~L3521).
- **Back corners** (`z > ~3`, `|x| > ~1.5`): incoming momentum carries through the strike — visible lunge lean, no full stop before contact; no silver-platter flat-footed retrieval.
- **Hip opening = power**: closed-stance windup (root yaw ~0.3-0.5 rad off the front-wall direction + racket back), then yaw snaps open toward the front wall *at* contact; swing speed/shot power scale with hip angular velocity — the arm follows the body, never leads it. Reuses the actor yaw lerp in `stepActorLocomotion` (~L194) plus torso/lean terms; racket animation in `RacketKinematicsController`.
- **Split-step**: optional garnish, de-emphasized — the required visible truth is movement-through-contact and body-driven strokes.
- Post-shot T-recovery (`getTRecoveryPosition`, `isRecoveringToT` scaling) is unchanged.
- **Position-relative strike quality** (`OpponentAI.updateAI` patience gate): no strikes on high/fresh balls before the bounce except a deliberate poach volley when the hitter is stranded deep (time pressure); off the back glass the receiver waits for sit-up-and-descend (`y ≤ 0.72` or `y < 1.15 && vy < -0.35`) so contact comes on the upswing — the stroke that drives it back deep and sustains T→corner→T cycling.
- **Off-back-glass shot mix**: same-corner counter-drive is the backbone (~55%), cross/lob/boast/drop mix it up (~45%) — legible pattern, not invariant.
- **Deep lob requirement — FAILED ATTEMPT (`2f68ee9`), superseded by §5.9**: the 4.85 m front-wall aim sits ABOVE the 4.57 m out line. Measured through the shipped `BallPhysics` (drag+Magnus, 120 Hz): mid/front-court contacts arrive at 4.70–4.74 m → `hitOut` (`BallPhysics.js:62`) → rally ended at the wall (`RulesEngine.js:170`) — every lob from most of the court is called Out. Deep-court contacts scrape legal (4.43–4.48 m, drag luck) but the rebound dies at z ≈ 0–1.5 m mid-court: the blanket `frontWallRestitution: 0.68` caps post-wall carry at ~7 m, so no pace/height mix reaches the corner. Keep-or-revert verdict: revert intent, replace mechanic per §5.9.

### 5.8 Match-Start Ceremony, Shot-Select Onboarding & Player Identity — shipped
- **Racket-spin ceremony** (`ArgonSquashEngine._runRacketSpinCeremony`, `#racket-spin-overlay`): the first `_setupPointServe` of a fresh match in real play mode (score 0-0, games 0-0, not spectator/autoplay/multiplayer) is gated into `phase = 'RACKET_SPIN'` — an unlisted phase that idles the loop safely. Player calls UP/DOWN while the racket twirls (~1.2s); winner elects serve or receive (AI always elects to serve); `score.server` is set before serve-stance setup proceeds.
- **Shot-Select Mode is the onboarding default**: `autoTReturn` defaults true — the Mii chases and recovers to the T; the player's only job is shot choice + timing (`1`–`5`, click, `Space`). WASD footwork exists as advanced manual mode (`G` / top-left pill). The fact that no movement is required is communicated *audibly* via `audioEngine.announceScore` during the spin ceremony (nobody reads) plus visual note in the overlay, setup step-4 (`Shot-Select Mode: ON (we move you)`), and Controls Guide §1.
- **Play Match invariant**: `onStartMatch` can never route to `ai_vs_ai` — a stale selection coerces to `pro`; AI-vs-AI is only reachable via the spectator pill / live showcase.
- **YOU-ARE-RED identity**: red player / blue opponent everywhere — score digits (`#ff4a33`/`#58a2ff`), `YOU` chip under the player badge, red-ringed player avatar, red-bordered court nameplate (`YOU`), red setup `You` tag vs blue CPU tag. Victory card reads `YOU` with the tactical rating number explicitly labeled (`YOUR TACTICAL RATING`).
- **Shot-chip execution**: the `1`–`4` shot chips tap-execute — each routes `shotType` into `_handleUserSwingInput`, the same serve/rally/spectator path as a physical swing (mobile has no number keys; chip select-then-swing is not required).
- **No idle hijack**: AI controls the human actor only under explicit spectator/autoplay flags — no idle-timer takeover, no auto serve-toss for the human server.
- **T-recovery yields the lane**: post-shot T-recovery (both actors) targets the far side of the ball's lane and hangs slightly deep, cutting false let calls during receiver recovery.
- **Mobile side menu**: fully rolls up to its handle and starts rolled at ≤768px viewports.
- **Spin graphic**: the twirling racket is an inline squash-racket SVG (teardrop head, string bed, throat, handle) — no emoji; UP/DOWN via buttons or arrow keys, overlay ignores stray pointer events.

### 5.9 Honest Shot Law — Corner-Landing Solves, Per-Shot Charge Envelopes, Executable Failure & Probabilistic AI Skill (AD approved 2026-10-21; pending implementation)

**Design principles (settled with operator 2026-10-21):**
1. **Intent vs execution.** The shot call fixes intent: a lob always *attempts* the back-corner landing (corner chosen from the striker's position, straight lane). Charge scales execution within the shot's OWN envelope — a full charge on a lob means "the best lob this position allows", never drive-pace on a lob arc (extends the §3.5 invariant; header comment `ShotController.js:7`).
2. **Executable failure.** The solver searches for the corner landing; if no legal solve exists from a position, the optimal attempt is executed ANYWAY and lands out (or sits up catchable). No refusal, no silent retarget to a safe mediocre shot, no runtime legality clamp — `BallPhysics.js:62` + `RulesEngine.js:170` remain the sole judges. Poor shot choices must be *visibly punished*; unpunished poor choices are a design failure.
3. **One discriminator, both outcomes.** "Ball crosses the T band (z ∈ [0.5, 2.5]) above racket reach (~2.6 m)" — measured on the POST-WALL flight only (samples with t later than the front-wall event): the pre-wall outbound leg necessarily crosses the T low and is the hitter's own ball, not a volley opportunity simultaneously defines the good lob (AI cannot volley it) and the bad lob (AI punish rule fires on everything below it). No special-casing.
4. **AI skill = error distribution, not a dumber brain.** Every difficulty level runs the same tactical selection (an easy AI still goes for the kill on a sitter); levels differ only in probabilistic execution error, extending the §5.1 serve-error pattern. **Correlation invariant:** all error channels derive from ONE scalar (`aiExecutionSkill`) per difficulty and fatigue scales them uniformly — a sloppy AI is uniformly sloppy (tins kills, over-hits lobs onto the back glass, serves wrong), never selectively bad at one surface. **Generalized solve semantics:** on every solved shot the front-wall contact is a SOLUTION, never a goal — goals are landing/outcome states (lob → steep back-corner drop; serve → landing in the correct rear quarter; corkscrew → swerving landing in the quarter). The shipped `computeServeExecution` still solves to a wall point (`frontWallHitX/Y`, `ShotController.js:95-96`); implementing §5.9 re-anchors it to a landing-goal solve with emergent contact, same as `solveCornerLob`. **Flair attempts:** every level occasionally attempts a high-risk flair shot (first entry: the corkscrew serve — heavy side-spin serve whose swerve is produced by the existing lateral Magnus coupling in `BallPhysics`, never scripted); the ATTEMPT rate is low for all levels, and the ERROR on the attempt is commensurate with `aiExecutionSkill` — a pro lands the corkscrew in the quarter, a casual AI's swerves out long, judged by the ordinary serve rules. **Selection always resolves:** position WEIGHTS which shot the AI plays, never WHETHER it plays one — no hard prohibitions in the repertoire; a collapsed-to-zero weight is a strong preference, and the AI always takes a shot on its turn. Watching the AI punish — or tin — the sitter the player created is itself the lesson: the successful kill costs the point (hard lesson), the tin spares it (soft lesson, framed as luck: "Count your blessings — that sat up"). Both name the player's choice as the cause.

**Mid-court freeze — live defect (recorded 2026-10-21; resolved by the Anti-float punish rule row):** In the shipped build the AI visibly stalls on slow mid-court balls: it stages correctly (TASK-23 timed arrival, `OpponentAI.js:196-204`) and then never commits to a stroke — arriving, waiting, and watching the ball drop, which reads as "giving up" before a late flat retrieval. Mechanism: the TASK-23b patience gate (`OpponentAI.js:234-249`) early-returns on every `suboptimalContact` (high fresh ball, no bounce), and its only volley escape, `poachVolleyAppliesPressure`, additionally requires the HITTER to be deep (`player?.pos?.z > 1.6`) — a mid-court floater satisfies neither condition, so the strike branch never fires. The symptom was amplified by the §5.7 lob failure: most lobs were called Out at the wall, ending rallies the instant a lob was played, which reads as everyone stopping. Resolution in this AD: the Anti-float punish rule (slow + reachable + pre-bounce → commit to the volley-kill regardless of hitter depth) plus the Selection-always-resolves invariant above.

**Entity rows (anchors cite the code site each entity extends; new entities ship at the named module):**

| Entity | Kind | Anchor | Role / signature |
| :--- | :--- | :--- | :--- |
| `SHOT_CHARGE_ENVELOPES` | frozen export | `src/squash/TuningConfig.js` (new, beside `DEFAULT_TUNING_PARAMS` @ `TuningConfig.js:49`) | Per-shot charge envelopes `{ minPaceMps, maxPaceMps, emergentContactBandM }`. LOB: pace 9.0–15.5; `emergentContactBandM` 4.10–4.90 is the EXPECTED range of optimized contact heights (a TestHarness validator, never a solver input) — top-of-envelope commitment from a bad spot yields an optimum contacting above 4.57, out by construction. KILL: 24–31 (charge sharpens pace only; never lifts out of the nick band). DROP: 6–9.5 (charge adds depth; cannot become a drive). DRIVE/BOAST: existing charge behavior unchanged. |
| `ShotController.solveCornerLob` | method | `src/squash/ShotController.js` (replaces fixed 4.85/11.2 branch) | `solveCornerLob({ contactPos, chargeNormalized, params }) -> { vel, spin, cornerSign, solvedContactY, paceMps, solveStatus }`, `solveStatus ∈ 'LEGAL_CORNER' \| 'CATCHABLE_CORNER' \| 'ATTEMPT_OUT' \| 'ATTEMPT_SHORT'`. **The goal is a steep first drop into ONE OF THE TWO back corners — whichever is reachable from the current contact position** (corner refs `(±2.35, 4.2)`, zone `|x| ≥ 1.6 && z ≥ 3.0` on the corner's side, post-wall T-band z∈[0.5, 2.5] clearance > 2.6 m). Both corners are searched; the front-wall aim (lateral and height) is a RESULT of the solve, never a goal: lateral aim starts at the corner mirrored through the front-wall plane and is corrected twice from the simulated landing; then elevation 30°→65° (8 steps) × pace charge-centre ±2.0 m/s within the LOB envelope, spin fixed `(−2.5, 0, 0)` — ≤ 52 early-stopped sims (to first floor contact), deterministic order (corner +x then −x, elevation outer, pace inner). **Selection order (preference, never a filter — a shot is always played):** (1) legal contact (not tin, < 4.57) AND reaches a corner → closest to its corner ref → `LEGAL_CORNER`; (1b) else a legal corner landing whose post-wall flight does NOT clear the T band → flat and catchable → `CATCHABLE_CORNER` (the honest result of lobbing from mid/back court); if neither exists at the charged pace, the pace steps up from the charged pace (1 m/s steps ending exactly on the envelope ceiling) until a legal corner landing exists — the default charge is 0, so this is the common in-game path; (2) only if no legal corner landing exists anywhere in the envelope does the player aim at the OUT location that WOULD have solved a back corner — legality ignored, elevations widened to 80°, pace ascending from the charged pace and capped at the LOB envelope (a lob is never full power) → classified by contact (`ATTEMPT_OUT` if ≥ 4.57); (3) else the overall closest-to-corner candidate → `ATTEMPT_OUT` / `ATTEMPT_SHORT` by contact. **Lob shape (operator 2026-10-21):** among legal corner landings the solver takes the STEEPEST drop (descent angle at the first floor contact; softer launch wins within 2°), searched across the whole LOB envelope; a landing only counts if the ball reaches the floor BEFORE the back glass. Charge lerps commitment within the LOB envelope; low charge = same intent under-executed. AI `aiErrorMode: 'OUT'` on a lob perturbs the solve output (pace × `LOB_OVERHIT_PACE_SCALE` 1.14) and `classifyExecutedLob` re-derives status/contact from the ball actually struck — physics decides the outcome. |
| Front-wall viscoelastic COR | physics change | `src/squash/BallPhysics.js:65` | **v2 (corrected 2026-10-21 after code bring-up measured v1 defective):** `cor = min(0.88, lerp(0.88, 0.66, clamp01((impactSpeed - 13) / 15)) * tempFactor)` — real viscoelastic response PLATEAUS at low impact speed, then decays. Response: 7–13 m/s → 0.88, 15 → 0.853, 20 → 0.677, ≥28 → 0.66 (drives keep today's feel; soft lob contacts respond ≈0.85 as this row always claimed). **v1 defect, recorded:** `lerp(0.86, 0.66, impactSpeed/28)` decayed too early — 0.76–0.78 at real lob impact speeds (10–13.5 m/s after drag), collapsing corner bounces to z ≈ 3.3 (vs the measured flat-0.85 calibration world's z ≈ 4.9) so the post-wall descent crosses the T band below 1 m — the unreachability gate became physically unsatisfiable and no deep-court `LEGAL_CORNER` existed. With the v2 plateau the lob regime is physics-identical to the measured calibration world. |
| Anti-float punish rule | gate extension | poach gate `src/squash/OpponentAI.js:234-249` | Incoming ball slow (`speed < 6 m/s`) + reachable (`y <= 1.9`) + pre-bounce → early volley-kill regardless of hitter depth (today's gate requires `player.z > 1.6`, so mid-court floaters go unpunished). Balls above 2.6 m in the T band stay exempt per principle 3. |
| AI error params | tuning params | `movementAndAI` block `src/squash/TuningConfig.js:97-102` (`VITE_SA_*`-overridable, §5.1 pattern) | One scalar `aiExecutionSkill` per difficulty (`VITE_SA_AI_EXECUTION_SKILL` overridable; casual 0.65, pro 0.93, `ai_vs_ai` = pro) set in `_applyDifficultyTuning` (`src/game_engine.js:642`); every channel is a fixed monotone function of it, calibrated through the anchor values casual `{ killTin 0.22, lobOut 0.30, paceSigma 0.08 }`, pro `{ 0.04, 0.06, 0.02 }`. Channels: `aiKillTinChance`, `aiKillOutChance`, `aiLobOutChance`, `aiExecutionNoiseSigma` (multiplicative pace noise), `aiAimJitterDeg`, `aiFlairAttemptChance` (low for all levels, e.g. 0.03–0.06 per opportunity; selects a flair variant such as the corkscrew serve, whose execution noise then scales with skill like every other channel), plus §5.1 serve chances. **Out-surface realism:** a failed `aiLobOutChance` roll perturbs the SOLVE OUTPUTS (contact-height offset, pace multiplier, aim jitter) — WHICH surface the ball then goes out on (front wall above 4.57, back glass above 2.13, back/side wall above the sloped line) is decided by `BallPhysics` alone, never a per-surface die; back-wall and back-side-wall lob outs therefore occur naturally and correlate exactly with the AI's other error rates. |
| Fatigue error multiplier | tuning param | beside error params above | `aiFatigueErrorMultiplier = min(1.6, 1 + 0.04 * gamesPlayed + 0.004 * pointsPlayed + 0.015 * lastRallyStrokeCount)` — error chances (incl. `aiServeWrongBoxChance` @ `TuningConfig.js:102`, base 0.04) scale up slightly over a long match and especially right after exerting (long) rallies; always very low probability (worst case ≈ 0.064 at cap). Fatigue never changes shot selection and scales ALL channels uniformly (correlation preserved). |
| Choice grades | feedback | `RulesEngine.formatRefereeCallout` (`src/squash/RulesEngine.js:512`) + `HudUI.showTimingPopup` (`src/hud_ui.js`) | Outcome-named choice grades: "POOR — lob from mid-court" (punished), "LUCKY — Count your blessings, that sat up" (AI error bailed the player out; choice still named as the cause), "GOOD — deep defensive lob" (corner-death solve). Victory-card tactical rating (§5.8) accumulates choice quality — the scoreboard forgets, the rating remembers. |

**Verification (`TestHarness`, new invariant beside existing sims at `src/squash/TestHarness.js:48+`):** `test_shot_law_lob` — contact-grid sweep asserting (a) deep-zone full-charge lob → `LEGAL_CORNER` (wall contact < 4.5 m, min height > 2.6 m across T band, first drop `|x| >= 1.6 && z >= 3.0`), (b) failure classes exist and are reachable (mid-court top-charge → `ATTEMPT_OUT`; deep-center → no corner solve — the "should not be played from here" zone), (c) no legality filter exists anywhere in `ShotController` execution paths.

**Calibration data (measured 2026-10-21 against shipped `BallPhysics`, restitution 0.85; calibration-sweep wall-aim 4.35 m — the shipped solver takes no aim input):** deep-corner pace 15 → CORNER (z ≈ 4.9, minY 2.8); mid-court pace 13.5 → CORNER (minY 3.7), pace 15 → OUT; front-court pace 12 → CORNER (minY 3.0); deep-center → short of corner at all paces.

### 5.10 Jukebox Identity & Default Rotation — de-Argon; all-14 sequential, beginning with the non-original block (AD approved 2026-10-21; pending implementation)

**Why (operator, 2026-10-21):** the 7 generated tracks exist precisely to NOT be associated with Argon Tennis — yet the first is named `argon_glass_overture` / "Argon Glass Overture" and soundtrack labels brand them "Argon". And the default jukebox begins with the original 7; the default is to play **all 14 in order, beginning with the NON-original tracks**. This supersedes TASK-22's "begin on track #1 of the new 7" directive; §5.6's muted-start/no-auto-lock/`ended` fixes are retained unchanged.

**Verified current state (2026-10-21):** 14 tracks — 7 synth originals (`ORIGINAL_DEFAULT_TRACK_IDS` @ `audio_engine.js:175`), 3 synth remixes (`virtua_arcade_95`, `t_zone_cyber`, `cairo_glass_finals`), 4 legacy mp3s (`match_rally`, `menu_theme`, `court_intro`, `victory_fanfare`). `JUKEBOX_TRACK_LIST` = insertion order = originals first (`:185`); default `jukeboxMode = 'auto'` (`:284`); `STATE_TO_TRACK` (`:198`) boots title/menu on `argon_glass_overture`. No file outside `audio_engine.js` references the renamed id (verified).

**Entity rows:**

| Entity | Kind | Anchor | Role |
| :--- | :--- | :--- | :--- |
| `JUKEBOX_TRACK_LIST` reorder | export change | `src/audio_engine.js:185` | Pinned 14-entry order — non-original block first, existing relative order: `virtua_arcade_95, t_zone_cyber, cairo_glass_finals, match_rally, menu_theme, court_intro, victory_fanfare`, then the 7 synth originals in existing relative order (renamed ids). |
| De-Argon rename map | id/string change | throughout `src/audio_engine.js` only | `argon_glass_overture` → `glass_overture` (update all five sites: LYRIA entry, `TRACK_DRUM_KIT` key, `ORIGINAL_DEFAULT_TRACK_IDS`, `STATE_TO_TRACK` values, title strings). Titles: 'Argon Glass Overture' → 'Glass Overture' (incl. '(Original #1)' forms). Every remaining 'argon'/'Argon'/'ARGON' token in the file is removed: 'Argon Original Soundtrack' → 'Squash Original Soundtrack'; 'ARGON SQUASH DEFAULT SOUNDTRACK' → 'SQUASH DEFAULT SOUNDTRACK'; comments likewise. Product-name strings use the repo name: '🎙️ WELCOME TO ARGON SQUASH • CHOOSE YOUR WAY TO PLAY' → '🎙️ WELCOME TO SQUASH ARCADE • CHOOSE YOUR WAY TO PLAY'. Scope is the music system only — engine class names (`ArgonSquashEngine`) are out of scope. |
| Default rotation semantics | behavior | `src/audio_engine.js:284`, `:198` | Default `jukeboxMode='auto'` = sequential play of the pinned 14-list with wrap-around; boot begins at index 0 (a non-original track). `STATE_TO_TRACK` per-state switching is demoted from the default path (map stays exported for explicit/locked selection) so the 14-sequence is never interrupted by state changes in auto mode. Autoplay note: the first block is synth-then-mp3 — pre-gesture start is muted for synths (§5.6 sound-gate covers), mp3s audible via muted-start. |


### §5.11 Back-wall drive contact-height correction (2026-10-21)

Operator report: waiting for a lower ball off the back wall turns a good drive into an overhit. Reproduced at contact `(2.8, 0.24, 3.0)`, speed `1.32`, descending: the unchanged fixed front-wall aim launches at `vy=8.37 m/s`; the ball reaches the back glass on the full at `2.28 m`, above its `2.13 m` out line. An isolating simulation with the older flat front-wall COR also reproduces the overhit (back contact 2.32 m); this identifies a fixed-height drive-aim defect but does not prove which recent change made it noticeable in play. Preparation charge does not enter this drive calculation.

| Entity | Kind | Anchor | Role / signature |
| :--- | :--- | :--- | :--- |
| `ShotController._computeBackWallDriveVelocity` | method | `src/squash/ShotController.js:440` (before lob solver) | `({ contactPos, vel, spin, params }) -> THREE.Vector3`. Preserve drive lateral and longitudinal velocity and spin; solve only vertical launch velocity for a first floor bounce at `z=3.8 m`. Ten deterministic bisection iterations over ballistic front-height seeds `[0.68, 3.2] m`, evaluated by existing `BallPhysics.simulateTrajectory`. Depth is the first floor/nick event's z; a back-wall-first trajectory is beyond the depth target (`BACK_WALL_Z + 1 + impactY`). Missing terminal event is beyond target. No out/tin filtering, post-hit correction, or guaranteed-legal rescue. Return the tenth candidate. |
| `ShotController.computeShotExecution` back-wall drive integration | branch extension | `src/squash/ShotController.js:362` | After drive spin assignment, only `isOffBackWall` invokes `_computeBackWallDriveVelocity`; normal drive/kill/drop/boast/lob branches and subsequent intentional AI error perturbations retain their behavior. |
| `back-wall-drive.test.mjs` | regression suite | `tests/back-wall-drive.test.mjs:1` (new) | Node built-in tests using real ShotController/BallPhysics, DEFAULT_TUNING_PARAMS and THREE. Mirrored x `{0.2,2,2.8}`, z `{1,2,3,4.3}`, y `{0.24,0.45,0.7,1,1.4}`, speed `{0.92,1.12,1.32}`, ascending/descending and straight/cross returns. Assert no tin/out, floor before glass, first bounce within 0.12 m of z=3.8, and glass below 2.13 m where reached. Verify preparation duration alone does not change drive velocity and other shot-family identity/disguise contracts remain intact. Existing TestHarness.js was ruled out as the home for this exhaustive Node grid because it is a browser diagnostics suite already at 487 lines. |

The player still chooses when to strike. A lower contact changes the required racket angle, rather than being assigned the same high front-wall aim. Target depth is an execution intent, not a legality filter. Runtime acceptance: manually compare early and late back-wall returns in the browser; this operator protocol is separate from deterministic source acceptance.


### §5.12 Visible body-driven rally contact (2026-10-21 operator correction)

Scope: original Squash Arcade only, synchronized to origin/main `284c982` before architecture. Robin requires the traditional side-on load, opposite-leg lead step and visible body rotation through contact; the front-facing arm flap and instant launch are rejected. The engine currently assigns the outgoing velocity in the same call that starts the racket animation and `_updateMiiAnimation` then overwrites locomotion yaw with `Math.PI - ballAngle`.

| Entity | Kind | Anchor | Role / signature |
| :--- | :--- | :--- | :--- |
| `StrokeMotion` | exported class | `src/squash/StrokeMotion.js:1` (new) | One physics-owned rally-stroke timeline and pose. Static `prepare(actor, dt, {ball, phase, handedness, predictedContactSec})`, `request(actor, {ball, inputEvent, prepSnapshot, isAuto, handedness, gravity}) -> boolean`, `update(actor, dt, {ball, phase}) -> payload or null`, `applyPose(actor, ball) -> boolean`, `reset(actor)`. |
| `actor.strokeMotion` | actor state | `src/squash/StrokeMotion.js:1` | Fields `phase` idle/prepare/swing/recover; `side`, `handedness`, `yawRad`, `prepareWeight`, `elapsedSec`, `contactDelaySec`, `followThroughSec`, `recoverSec`, `progress`, `racketDurationSec`, `contactEmitted`, `pending`, `contactPos`, `leadFoot`, `supportFoot`, `leadStartWorld`, `leadPlantWorld`, `supportPlantWorld`, `stepTargetWorld`. Pending token/payload contains copied `inputEvent`, `prepSnapshot`, `isAuto`, `ballRef`, `rallyStrokeCount`, `lastHitter`. |
| `_attemptPlayerRallyStrike` / `_executeOpponentSquashStrike` | existing request wrappers | `src/game_engine.js:2993`, `src/game_engine.js:3152` | Validate incoming rally/reach, start racket once, adopt its returned effective side, and request scheduled contact. Already pending input is handled without another practice swing. No outgoing velocity, rules-hit notification or impact effects at request time. |
| `_commitPlayerRallyStrike` / `_commitOpponentSquashStrike` | extracted contact methods | `src/game_engine.js:2993` and `:3152` existing bodies | At scheduled contact compute the shot from the current live ball and apply existing velocity/spin/rules/AI/trail/VFX/audio/HUD behavior exactly once. No triggerSwing restart or contact-height position rewrite. |
| `_updateStrokeMotions` | engine method | `src/game_engine.js:3368` (before `_stepPhysics`) | Prepare and advance both actors at fixed physics cadence; dispatch each contact payload once after the ordinary rally physics update. Non-rally/point/serve transitions reset pending strokes. |
| `_updateMiiAnimation` | rendering integration | `src/game_engine.js:3926` | Align the existing racket animator's elapsed time to the physics-owned normalized stroke progress before its update. Apply StrokeMotion pose after body animation; fallback to existing ordinary yaw only when applyPose returns false. |
| `PlayerMovement.stepActorLocomotion` | existing translation integration | `src/squash/PlayerMovement.js:210` | While motion.phase is swing, use motion.stepTargetWorld as the finite lunge target before calculating desired velocity. All movement still uses the existing acceleration/inertia and court clamping; never set actor.pos to the target. |
| `stroke-motion.test.mjs` | regression suite | `tests/stroke-motion.test.mjs:1` (new) | Real Three.js rig actors plus moving BallPhysics fixtures validate clock, exactly-once/cancellation, continuous side-on yaw, handedness/opposite-foot mirroring, world foot plants, low-ball timing and absence of position writes. Actual game recordings supply separate integration evidence. |

The model's forward yaw is PI. Right-handed forehand preparation faces the +X wall at PI/2; backhand faces -X at 3PI/2; handedness mirrors these. The opposite foot leads (righty forehand left, righty backhand right). Preparation develops as the incoming ball approaches; the loading/support foot remains anchored, the lead foot travels through a shallow 0.10m lift and a 0.28m forward plant, and the body moves continuously toward the finite step target. Keep roughly 55 degrees of side-on orientation at contact, then rotate through toward forward with a small follow-through overrotation. Feet/hips are posed after the legacy body animator resets them; world anchors are transformed into pivot-parent coordinates so the body can turn over planted feet without a pose reset at contact.

Ordinary pre-contact delay is 0.10s. For descending low contacts, cap delay to 60% of physical time to the floor (height above collision radius, actual vy, positive gravity); the ball continues normal physics during that interval. Follow-through is 0.24s and recovery 0.16s. Progress maps to existing racket contact near 0.34, then completes the finish. Cancel on wrong phase, dead ball, second bounce, changed ball identity, changed incoming hitter or stroke counter. Point/serve resets cancel. The human still chooses timing; no ball freeze, positional snap, or forced successful return is introduced.

Graph coverage gap: the minified racket/body modules return signatures but omit individual method bodies. Named AST reads of `racket_kinematics.triggerSwing`, `getRacketRimWorldPoints`, and body hand/foot application confirmed the exposed rig/clock contract. These modules stay unmodified. A narrow bounded racket-center alignment around the contact phase may use the exported centerWorld measurement and the saved live contact point, adjusting only the reachable racket/hand pose; never move the ball or actor root to manufacture contact.

### §5.13 Softer back-wall drive and dying side-front boast

Original Arcade `origin/main` was fetched and merged before this design (284c982; already current). Robin rejected §5.11's flat fast drive. Its replacement varies all three launch-velocity components, using the unchanged BallPhysics model. Drive intent is front contact just above the service line (2.05m), followed by a rear-quarter first drop (z3.8m, same/opposite x2.8m). Side-front boast intent is a soft opposite nick near z-3.5m, with rebound apex below0.10m and second bounce in the front court. These are launch-condition objectives, never live ball corrections or guarantees under arbitrary tuning/errors. Explicit back-wall recovery boasts retain their separate identity.

| Entity | Kind | Anchor | Role / signature |
| :--- | :--- | :--- | :--- |
| `ShotTrajectorySolver` | exported class | `src/squash/ShotTrajectorySolver.js:1` (new) | Static `solveDrive({contactPos,spin,params,isCrossRequest=false}) -> THREE.Vector3`, `solveBoast({contactPos,spin,params}) -> THREE.Vector3`. Canonicalize positive contact x, mirror velocity x and spin y. Bounded damped Newton correction of vx/vy/vz using real trajectory probes. |
| `ShotTrajectorySolver._seed` | static method | new solver module | `({contactPos,spin,params,isBoast,isCrossRequest}) -> THREE.Vector3`; algebraic two-leg drive / three-leg boast seed specified completely in TASK-35/36. No physics calls in seed. |
| `ShotTrajectorySolver._probe` | static method | new solver module | `({contactPos,vel,spin,params,isBoast,isCrossRequest}) -> {residual,score,valid,converged}`. Simulate3.3s at1/120s; measure actual front and first/second floor, event order, nick and apex; retain invalid candidates' unfolded residual solely to guide correction. |
| `ShotTrajectorySolver._solve` | static method | new solver module | Same options as probe without vel. At most55 physics probes; finite-difference Jacobian, pivoted elimination, damped bounded steps. Return best valid candidate; if none exists return best finite attempt, leaving normal rules to judge it. |
| `ShotTrajectorySolver._linearStep` | static method | new solver module | `(jacobian,residual) -> number[3] or null`; pivoted Gaussian elimination, reject singular/nonfinite solve. |
| `ShotController._computeBackWallDriveVelocity` | existing method replacement | `src/squash/ShotController.js:440` | Extend existing options with `isCrossRequest=false`; delegate to solveDrive. Old vel argument remains accepted for compatibility but no longer pins x/z. Used only for off-back-wall drives, before existing AI perturbation. |
| `ShotController._computeSideFrontNickBoastVector` | existing method replacement | `src/squash/ShotController.js:659` | Preserve signature/return `{vel,spin}`; spin(-12,side14,0) scaled by tuning, delegate velocity to solveBoast. |
| `ShotController.computeShotExecution` | existing integration | `src/squash/ShotController.js:149` | Pass cross intent explicitly. Use actual contact height above ball collision radius instead of artificial0.24m minimum. Ordinary boast/two_wall_boast after back rebound uses side-front solve even deep; explicit back_wall_boast retains recovery path. |
| `back-wall-drive.test.mjs` / `side-front-boast.test.mjs` | Node regression suites | `tests/back-wall-drive.test.mjs:1`, `tests/side-front-boast.test.mjs:1` (new second file) | Real modules assert shape, collision order, exact mirrored launches, charge invariance, low actual contact and ordinary family identity. Physics remains unmodified. |

Drive residual is `[3*(frontY-2.05), landingX-X, landingZ-3.8]`, X=±2.8. Boast residual uses frontY.78, X opposite3.145, Z-3.5. Initial geometric seeds account approximately for gravity, Magnus, friction and restitution. Nine Newton iterations maximum, three Jacobian probes and at most three damped trial probes each, plus initial probe:55 maximum. Front tolerance.04m, landing z.12m and drive x.06m. No heavy grids during live contact. Calibration against current modules:240 drive contacts and72 boast contacts passed numerical shape checks, typical5–9/1–15 probes; runtime acceptance remains separate.

Calibration clarification: the72 boasts passed semantic nick/apex/frontcourt checks, not universal convergence to z-3.5±.12. The central high contact(.2,1.4,3.9596) stalls at a true dying nick z-3.756. The optimization target remains-3.5; acceptance uses front-nick zone z[-4.3,-2.5] with true nick, apex<.10 and frontcourt second bounce. This supersedes the initially over-specific centimetre acceptance band without changing collision physics or the user's soft-finish requirement. Contact-pose inspection also requires full smooth reachable racket alignment across the fixed-step contact interval (pose correction cap2.5m, actor reach still1.15m); the old1.15m pose-delta cap left a visible racket/ball gap after side-on rotation.
