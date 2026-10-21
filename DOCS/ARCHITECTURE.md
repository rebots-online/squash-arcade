---
doc_id: "ARGON-SQUASH-ARCH-001"
title: "Argon Squash — Physical Chess, Wonder First: Modular Architecture & Digital Twin"
version: "2.3.0"
status: "ALIGNED_TO_CODEGRAPH (2026-10-17 audit) + PENDING REFINEMENTS + §5.9 SHOT-LAW AD APPROVED 2026-10-21"
updated_at: "2026-10-21T01:55:00-04:00"
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
- **Exports**: `LYRIA_TRACKS` (12 jukebox tracks incl. Lyria-sourced remixes), `JUKEBOX_TRACK_LIST`, `ORIGINAL_DEFAULT_TRACK_IDS`, `STATE_TO_TRACK` (game-state -> track map), `NARRATOR_USP_INVITES` (scripted narrator lines), `GEMINI_TTS_CLIPS = {}` (empty clip map, currently unused), `AudioEngine`.
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
3. **One discriminator, both outcomes.** "Ball crosses the T band (z ∈ [0.5, 2.5]) above racket reach (~2.6 m)" simultaneously defines the good lob (AI cannot volley it) and the bad lob (AI punish rule fires on everything below it). No special-casing.
4. **AI skill = error distribution, not a dumber brain.** Every difficulty level runs the same tactical selection (an easy AI still goes for the kill on a sitter); levels differ only in probabilistic execution error, extending the §5.1 serve-error pattern. Watching the AI punish — or tin — the sitter the player created is itself the lesson: the successful kill costs the point (hard lesson), the tin spares it (soft lesson, framed as luck: "Count your blessings — that sat up"). Both name the player's choice as the cause.

**Entity rows (anchors cite the code site each entity extends; new entities ship at the named module):**

| Entity | Kind | Anchor | Role / signature |
| :--- | :--- | :--- | :--- |
| `SHOT_CHARGE_ENVELOPES` | frozen export | `src/squash/TuningConfig.js` (new, beside `DEFAULT_TUNING_PARAMS` @ `TuningConfig.js:49`) | Per-shot charge envelopes `{ minPaceMps, maxPaceMps, contactHeightBandM }`. LOB: pace 9.0–15.5, contact aim 4.10–4.90 (crosses 4.57 near envelope top — full charge from a bad spot is out by construction). KILL: 24–31 (charge sharpens pace only; never lifts out of the nick band). DROP: 6–9.5 (charge adds depth; cannot become a drive). DRIVE/BOAST: existing charge behavior unchanged. |
| `ShotController.solveCornerLob` | method | replaces fixed 4.85/11.2 branch `src/squash/ShotController.js:260-274` | `solveCornerLob({ actorPos, contactPos, targetCornerSign, chargeNormalized, params }) -> { vel, spin, targetFrontY, paceMps, solveStatus }`, `solveStatus ∈ 'LEGAL_CORNER' \| 'ATTEMPT_OUT' \| 'ATTEMPT_SHORT'`. Straight lane only (`targetX = sideSign * 2.35`; cross-court lobs measured side-wall-bound 131/180 sweeps). Solve = bisection over `(targetFrontY, pace)` using `BallPhysics.simulateTrajectory`; legality is classification of the best solve, NEVER a filter. Charge lerps within the LOB envelope; low charge = same intent under-executed (short, catchable — also a lesson). |
| Front-wall viscoelastic COR | physics change | `src/squash/BallPhysics.js:65` | `cor = min(0.88, lerp(0.86, 0.66, clamp01(impactSpeed / 28)) * tempFactor)` — restitution rises as impact speed drops (real viscoelastic response). Drives (≥20 m/s) keep today's ≈0.66–0.68 feel; soft lob contacts respond ≈0.85. REQUIRED for solve convergence: at flat 0.68 every measured lob stays catchable (see §5.7 failure record). |
| Anti-float punish rule | gate extension | poach gate `src/squash/OpponentAI.js:234-249` | Incoming ball slow (`speed < 6 m/s`) + reachable (`y <= 1.9`) + pre-bounce → early volley-kill regardless of hitter depth (today's gate requires `player.z > 1.6`, so mid-court floaters go unpunished). Balls above 2.6 m in the T band stay exempt per principle 3. |
| AI error params | tuning params | `movementAndAI` block `src/squash/TuningConfig.js:97-102` (`VITE_SA_*`-overridable, §5.1 pattern) | `aiKillTinChance`, `aiKillOutChance`, `aiLobOutChance`, `aiExecutionNoiseSigma` (multiplicative pace noise), `aiAimJitterDeg`. Difficulty presets set in `_applyDifficultyTuning` (`src/game_engine.js:642`): casual `{ tin 0.22, lobOut 0.30, sigma 0.08 }`, pro `{ 0.04, 0.06, 0.02 }`, `ai_vs_ai` uses the pro table. |
| Fatigue error multiplier | tuning param | beside error params above | `aiFatigueErrorMultiplier = min(1.6, 1 + 0.04 * gamesPlayed + 0.004 * pointsPlayed + 0.015 * lastRallyStrokeCount)` — error chances (incl. `aiServeWrongBoxChance` @ `TuningConfig.js:102`, base 0.04) scale up slightly over a long match and especially right after exerting (long) rallies; always very low probability (worst case ≈ 0.064 at cap). Fatigue never changes shot selection. |
| Choice grades | feedback | `RulesEngine.formatRefereeCallout` (`src/squash/RulesEngine.js:512`) + `HudUI.showTimingPopup` (`src/hud_ui.js`) | Outcome-named choice grades: "POOR — lob from mid-court" (punished), "LUCKY — Count your blessings, that sat up" (AI error bailed the player out; choice still named as the cause), "GOOD — deep defensive lob" (corner-death solve). Victory-card tactical rating (§5.8) accumulates choice quality — the scoreboard forgets, the rating remembers. |

**Verification (`TestHarness`, new invariant beside existing sims at `src/squash/TestHarness.js:48+`):** `test_shot_law_lob` — contact-grid sweep asserting (a) deep-zone full-charge lob → `LEGAL_CORNER` (wall contact < 4.5 m, min height > 2.6 m across T band, first drop `|x| >= 1.6 && z >= 3.0`), (b) failure classes exist and are reachable (mid-court top-charge → `ATTEMPT_OUT`; deep-center → no corner solve — the "should not be played from here" zone), (c) no legality filter exists anywhere in `ShotController` execution paths.

**Calibration data (measured 2026-10-21 against shipped `BallPhysics`, restitution 0.85, aim 4.35 m, straight lane):** deep-corner pace 15 → CORNER (z ≈ 4.9, minY 2.8); mid-court pace 13.5 → CORNER (minY 3.7), pace 15 → OUT; front-court pace 12 → CORNER (minY 3.0); deep-center → short of corner at all paces.
