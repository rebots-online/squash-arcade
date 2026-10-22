---
doc_id: "ARGON-SQUASH-ARCH-001"
title: "Argon Squash — Physical Chess, Wonder First: Modular Architecture & Digital Twin"
version: "2.5.0"
status: "TARGET — facing correction; opponent-aware volleys and serve repertoire queued"
updated_at: "2026-10-22"
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

## 4. Preserved mechanics and complete target behavior

This document defines the integrated target. Implementation and independent validation states are recorded separately in CHECKLIST.md. The historical proposal register is retained in [HISTORY/ARCHITECTURE-before-smart-volleys.md](HISTORY/ARCHITECTURE-before-smart-volleys.md); it is not an additional prerequisite for this release. Older front-court-only volley, mandatory back-wall patience, flat-drive and wrong-box handout instructions are superseded here.

### 4.1 Preserved physical and presentation invariants

BallPhysics remains the sole flight, collision, nick and bounce authority at 120 Hz with four substeps. Court coordinates and rules in sections 2–3 remain authoritative. ShotTrajectorySolver retains the bounded 55-probe drive/boast solver: a soft back-wall drive reaches the front around 2.05 m, first lands around rear z=3.8 m and x=±2.8 m, then rebounds naturally. Intentional side-front boasts retain their physical solution before AI execution variation. Ideal shot solves remain exact; committed human attacks apply the actual contact-quality contract in section 4.6. Preparation controls disguise and pose, independently of power. Existing lob, scoring, audio, identity, candy spectacle, controls and ordinary tactical variety remain.

StrokeMotion keeps side-on preparation, opposite-foot step, hip rotation and a single scheduled contact against the moving live ball. No teleport, fake reach, frozen ball or instant hit. The engine revalidates phase, hitter token, floor bounce and 1.15 m horizontal reach at contact. When no volley is reachable, preserve the current floor–back-wall–sit-up timing.

### 4.2 AI attacking accuracy (TASK-40)

Winner-margin chance defaults to 0.20 instead of 0.38. TuningConfig and TuningPanel expose chance and execution yaw/elevation/pace bounds. For AI drop, kill and attacking side-front boast only, sample a bounded yaw ±0.75°, elevation ±0.5° and pace ±2% from the injected random source once at committed shot execution. Apply to the final launch vector after any precise solver. This random variation never applies to human inputs, drives, lobs or explicit intentional tin/out errors; deterministic human contact quality is specified in section 4.6. Real physics determines the resulting nick, miss or bounce. Never manufacture a winner classification. Compare actual seeded nick frequency with unperturbed launches.

### 4.3 Opportunity-driven volleys (TASK-41)

VolleyPlanner exports planVolleyContact({actor, opponent, ball, predictedTrajectory, params, requestedShot}) -> plan|null. A plan contains contact time relative to now, contact position, movement target, shot family and target corner. Inspect future trajectory samples after front-wall contact and before the first floor bounce, subtracting the current shot age from sample time. Account for movement speed/acceleration, reaction, stroke preparation, physical reach, height, body and shot-lane clearance. Court depth is never a volley exclusion.

AI tests the volley opportunity before back-wall and bounced-ball patience gates. Commit only when the real scheduled stroke can reach the ball. A drop is desirable when the opponent cannot cover the front placement; prefer the opposite front corner when both players are on the same side and the lane is clear. Otherwise use a safe volley drive or the requested suitable family. Human early chip/1–5 inputs use the same planner within the existing 0.52 s input buffer; 2 means drop, including volley drop. Explicit directional aim wins over assistance. At actual contact, zero floor bounces means isVolley=true at every depth; combine volley and disguise in labels. Preserve explicit shot-family identity.

Good length is arcing placement into the rear quarter, denying reachable interceptions through height, wall proximity and depth. Waiting is the result of that placement. There is no artificial requirement to let a reachable volley bounce.

### 4.4 Point aftermath and recorded replay (TASK-42)

PointPresentation owns a bounded rolling recording of ball, actor, racket and collision state. RALLY -> POINT_SETTLE finalizes scoring once, clears pending strokes/inputs and disables gameplay. Continue a cloned ball through the real collision integrator without rule adjudication: the nick rolls out, tin/out balls fall, bounce and dribble. Settle lasts at least 1.5 s, ends after speed below 0.2 m/s for 0.3 s, and is bounded at 5 s.

POINT_REPLAY plays the actual recorded final action and aftermath over four seconds, including recorded actor/racket transforms. It never reruns AI, rules or randomness. Orbit and zoom around the recorded decisive event, with a wider framing that retains the approaching ball. Restore normal camera state before serve/result. Awarded game/match outcomes wait for the finish presentation before results. The canned NickLab replay is onboarding-only.

Any fresh keydown or pointerdown skips the entire remaining finish sequence. Capture and consume its repeat/release/click chain before all gameplay and HUD handlers; held input from the winning shot does not skip. Pause suspends playback; restarting cancels recording/presentation and invalidates delayed callbacks. No skip gesture may toss, swing or activate an underlying button.

### 4.5 Serve readiness (TASK-43)

ServeSetup exports evaluateServeSetup({server,receiver,serviceSide,params}) -> {ready,reason,correctionTargets}. RulesEngine score.serviceSide is authoritative. Test server arrival in the selected box, receiver clearance from that box, inter-player distance/swing clearance and stable movement. Both toss and serve contact require readiness; require 0.2 s stable readiness before toss. Moving toward the box is not permission to toss.

Wrong-box staging/crowding pauses setup, announces the correction and moves both actors to safe service-staging targets using ordinary locomotion, with visible guidance. A setup correction does not award a point. A genuine foot fault at actual legal-side contact retains existing adjudication. Do not invent a blanket receiver-half rule. Each setup has a point token; delayed correction/input cannot affect a later point.

### 4.6 Human attacking precision (TASK-44; operator clarification)

Successful contact alone must not grant an exact nick. At committed human drop/kill/attacking-boast contact, derive deterministic contact quality from the actual ball relative to the actor's strike pocket and the actor's balance/movement. A compact sweet pocket preserves full precision; late, stretched or hurried contacts open the target margin and leave a more retrievable ball. This is not a random human error lottery. Explicit manual aim and family remain, and no contact is fabricated. Drives/lobs retain their existing reliable placement. Feedback explains balanced versus stretched timing. Direct pure-solver tests describe ideal launch construction, never human gameplay success rates. AI execution variation remains its separate skill model.

### 4.7 Whole-court gameplay framing (TASK-45; operator correction)

The normal Rally/Auto and serve cameras must show all four floor corners and the legal wall envelope at desktop, landscape and portrait aspect ratios, even during lateral tracking. Fit the court envelope to the actual perspective frustum with HUD margin rather than a fixed camera distance. Preserve the existing view direction, field of view and bounded lateral tracking, pulling back only as required. Cinematic replay is temporary and must restore the selected gameplay camera immediately on exit. Keep orbit cameras inside side walls to avoid opaque wall occlusion. The source camera constants in 96c84d4, the recovered local snapshot and 7b1df9b match; do not claim a particular synced commit caused the observed viewport change.

### 4.8 Stroke orientation and mirrored backhands (TASK-46)

The character rig's eyes and chest face local +Z. Root yaw PI faces the front wall; positive offset closes a right-handed backhand toward the left wall, negative offset closes a forehand toward the right wall. Stroke preparation, contact, follow-through, recovery and locomotion use that same convention, with handedness mirroring the stance once. The ordinary ball-tracking yaw is continuous across the actor's centre line. The racket controller honours an explicit stroke side selected relative to the actor; its legacy court-half anticipation must never replace that side. Preserve opposite-foot planting, existing racket paths and scheduled live contact; orientation must not alter reach, ball physics or shot selection.

### 4.9 Live reception timing (TASK-47)

Predicted sample timestamps are measured from the shot, so all approach decisions subtract the ball's current shot age. Bounced-ball receivers choose remaining legal samples before the second bounce, never a sample already passed. A used-up prediction falls back to the live ball. Stop staging when contact is due so receivers actually close the last distance. If a scheduled contact fails while the same incoming ball is still legally playable, reset the cancelled swing's cooldown so a new real stroke can be prepared. Successful contact retains normal cooldown and recovery. Preserve reachable volley priority and real deep-length/back-wall rebound patience; this correction applies to both AI roles and human automatic footwork.

### 4.10 Clear rearward-facing replay openings (TASK-48)

Every automatic point replay opens on the front-wall side of the decisive event, looking toward the rear wall, then orbits and zooms on the recorded ball. Enter with a camera cut so the opening does not sweep through players from the previous gameplay view. Keep the orbit inside the side walls. Make the front wall transparent while the replay camera is in front of it, restoring normal wall treatment and the selected whole-court gameplay view on exit. A compact bordered corner toast announces replay and the skip gesture, with a brief pulse respecting reduced-motion preferences. No central replay banner obscures the action. Recorded poses, scoring, aftermath duration and skip behaviour remain unchanged.

### 4.11 Red-player ownership and learning from shot choices (TASK-49)

The red player is the user's player in solo play and the target of spectator shot influence. Mark the front and back of that jersey YOU; repeat the red identity in the scoreboard and above the shot controls with mode-appropriate guidance. Keep existing explicit second-player controls separate.

The shot chips display red's current chosen family while watching AI play, including a changed plan before contact and the final executed family. Blink once when a new shot is chosen or the family changes, then retain one highlight until the next choice; never blink every frame. Blue's shots must not replace that highlight. Normalise drive/topspin, drop/slice, boast, lob and kill/smash to the existing five chips. Keep visible volley context in the choice label. Display updates do not alter human-selected input, AI decisions, or shot timing. During replay retain red's last choice without inventing new decisions.

### 4.12 Opponent-aware volley placement (TASK-50; queued)

An available volley is an opportunity to take time away, not an automatic drop. Evaluate the opponent's ability to reach the intended placement, including their current position and travel time. When the opponent is waiting in the front court, prefer a legal deep straight or crosscourt volley that clears their interception height and reaches the rear corner away from them. Merely choosing the opposite front corner does not make a drop sensible when the opponent can cover it. Retain volley drops when the opponent cannot cover the front placement. Choose trajectory height and depth intelligently within the existing physical solver; do not force a flat interceptible drive, guarantee a winner, or alter ball speed after contact. If no useful volley is reachable, retain the established deep-length/back-wall sit-up reception. Apply the tactical decision to both AI players and reflect red's final choice on the existing chips without overriding an explicit human shot-family choice.

### 4.13 Selectable serve repertoire (TASK-51; exploratory queue)

Allow the five shot chips and keys 1–5 to select red's serve family in human play and influence red's serve in spectator mode. Preserve the existing toss, service-box readiness, legal serve validation and red-choice feedback. Serve trajectories need their own observed tuning ranges; rally parameters must not be copied blindly. Candidate mappings are Drive = ordinary hard serve, Lob = high lob serve, Boast = experimental corkscrew-style attempt, Drop = unresolved, and Kill = potentially a faster hard serve. These are hypotheses for live experimentation, not approved numerical ranges or a claim that every proposed trajectory is viable. Establish a useful, clearly described legal meaning for each offered family before exposing it; if Drop or corkscrew cannot be made useful, record the finding and resolve that choice explicitly. Include the complete selection, trajectory, feedback and both-service-box observations within this task. No serve experimentation is included in the current deployed evaluation build.

## 5. Acceptance and release protocol

DOCS/TEST_RUBRIC.md maps the six complete entities to behavior evidence. Each CHECKLIST item contains all production changes, tests and deterministic acceptance needed to stand alone on baseline 7b1df9b. Shared files are integrated serially; no task imports another task's new module or depends on another task's acceptance. Existing interfaces are explicit prerequisites, not hidden sibling tasks.

For follow-up work the operator explicitly directs no automated tests: do not add or run them. Diagnose the reported behaviour, inspect the affected runtime paths, observe focused examples in the running game, and build for deployment. Older test instructions in completed tasks are historical evidence only. Implementation [X], independent semantic review ✅, rendered observation and human feel evaluation remain distinct; never imply that browser observation proves every possible rally.

Source and generated build are committed and pushed. Back up prior dist outside the public directory, build once for the release (version.txt and package version plus public/deployment.json sourceCommit/builtAt), deploy exactly that dist, and verify served bytes against hashes excluding CNAME. Inspect desktop and mobile-width public gameplay. Browser viewport evidence does not assert physical mobile/controller acceptance.
