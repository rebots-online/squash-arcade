---
checklist_id: "ARGON-SQUASH-DAG-002"
version: "2.2.0"
status: "PENDING_REVIEW_SIGNOFF"
architecture_ref: "DOCS/ARCHITECTURE.md (v2.2.0, §5 Planned Refinements)"
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

## Orchestration Task Graph (DAG)

```
[TASK-15: CourtGeometry — Lighter Back-Wall Out Line]
       │
       ├──► [TASK-16: FRONT_WALL_CAM Viewpoint Cycle]
       │           │
       ├──► [TASK-17: Two-Tier AI Serve Errors (Wrong Box + Foot Fault)]
       │           │
       │           ▼
       ├──► [TASK-18: Pre-Rendered Voice Pack (voice_lines + generator + playback)]
       │           │
       │           ▼
       └──► [TASK-19: Google Dependency Cleanup & Static-Host Boundary]
                   │
                   ▼
           [TASK-20: surge.sh Static Deploy Verification]
```

---

## Ordered Tasks & Acceptance Gates

### `TASK-15` — Lighter Back-Wall Out Line
- **Status**: `[ ] PENDING SIGNOFF`
- **Owner Module**: `src/squash/CourtGeometry.js`
- **Architecture Ref**: `§5.3`, Gate I
- **Depends On**: `[]`
- **kstore Key**: `argon.squash.v2.tasks.TASK-15`
- **Deliverables**:
  - New `materials.backOutLine` (`MeshBasicMaterial`, `transparent: true`, `opacity ≈ 0.38`, lighter red `0xf87171`) in `_createMaterials`.
  - Back-wall out mesh in `_buildCourtMarkings` switched from shared `materials.outLine` to `materials.backOutLine`.
  - Per-theme `backOutLine` styling in `applyTheme` for `psa_glass` / `hardwood_club` / `neon_studio`.
- **Acceptance Gate (I)**: Back-wall out line renders at reduced opacity/lighter tint in all three themes; front and side out lines unchanged.

### `TASK-16` — `FRONT_WALL_CAM` Viewpoint in Camera Cycle
- **Status**: `[ ] PENDING SIGNOFF`
- **Owner Modules**: `src/game_engine.js`, `src/squash/CourtGeometry.js`
- **Architecture Ref**: `§5.4`, Gate J
- **Depends On**: `["TASK-15"]`
- **kstore Key**: `argon.squash.v2.tasks.TASK-16`
- **Deliverables**:
  - `'FRONT_WALL_CAM'` added to `onCycleCamera` `modes` + `labels` (`'Front Wall'`).
  - `_computeTargetCameraPose` branch: `targetPos ≈ (0, 2.8, -4.4)`, `targetLook ≈ (0, 1.0, +3.5)` (front wall looking toward back glass).
  - `setFrontWallTransparency(true)` while `FRONT_WALL_CAM` is the effective mode; `false` on exit.
- **Acceptance Gate (J)**: `C` cycles through all five labels ending in `Front Wall`; front wall is transparent and full back court visible; wrap-around returns to `Back Glass`.

### `TASK-17` — Two-Tier AI Serve Errors (Wrong Box + Foot Fault)
- **Status**: `[ ] PENDING SIGNOFF`
- **Owner Modules**: `src/squash/RulesEngine.js`, `src/game_engine.js`, `src/squash/TuningConfig.js`, `src/squash/TuningPanel.js`, `src/mii_facial_fx.js` (flavor only)
- **Architecture Ref**: `§5.2`, Gate H
- **Depends On**: `["TASK-16"]`
- **kstore Key**: `argon.squash.v2.tasks.TASK-17`
- **Deliverables**:
  - `movementAndAI` tuning params: `aiServeWrongBoxChance` (≈0.06), `aiServeSelfCorrectChance` (≈0.55), `aiServeFootFaultChance` (≈0.015); sliders in `TuningPanel`.
  - `_getServeStandingPositions`: AI wrong-box roll flips `isRightBox` for server `targetPos` only; self-correct roll shows a mid-stance walk to the correct box plus a confused `FACIAL_STATES` expression.
  - `RulesEngine.evaluateServeStanceLegality(serverPos, serviceSide)` -> `'WRONG_BOX'` | `'FOOT_FAULT'` | `null` (half-court `|x| < 0.22` or `z < SHORT_LINE_Z + 0.02` at toss), checked in `_startServeToss`.
  - `formatRefereeCallout` prefixes: `'wrong box'` -> `Fault!`, `'foot fault'` -> `Foot fault!`; both lose the rally (handout) per WSF.
- **Acceptance Gate (H)**: `aiServeWrongBoxChance=1` forces a visible wrong-box approach; legality check returns fault kinds deterministically; `Fault!`/`Foot fault!` callouts fire and handout is awarded.

### `TASK-18` — Pre-Rendered Referee/Narrator Voice Pack
- **Status**: `[ ] PENDING SIGNOFF` (TTS provider choice outstanding: edge-tts/Kokoro $0 vs Google Cloud TTS ~pennies vs ElevenLabs)
- **Owner Modules**: `src/voice_lines.js` (new), `scripts/generate-voice-pack.mjs` (new), `src/audio_engine.js`, `public/assets/voice/` (new)
- **Architecture Ref**: `§5.1`, Gate G
- **Depends On**: `["TASK-17"]`
- **kstore Key**: `argon.squash.v2.tasks.TASK-18`
- **Deliverables**:
  - `voice_lines.js`: `FIXED_LINES` (~40 phrases) + `TOKEN_KIT` (~80 slot-indexed clips: numbers 0–20 in server/receiver slots, fault words, `handout`, `all`, `Game/Match Ball!`, `Fault!`, `Foot fault!`).
  - `generate-voice-pack.mjs` (dev-time): TTS -> `public/assets/voice/<id>.ogg` + `manifest.json`.
  - `AudioEngine`: populate `GEMINI_TTS_CLIPS` -> `VOICE_PACK_CLIPS`; `_playVoiceClip`/`announceScore` schedule decoded `AudioBuffer`s through `sfxGain`/`reverbSend` with 40–80ms token gaps; SpeechSynthesis fallback for unmapped text.
- **Acceptance Gate (G)**: `manifest.json` covers every declared id; calls play end-to-end from decoded buffers with `speechSynthesis` disabled; pack < ~1.5MB.

### `TASK-19` — Google Dependency Cleanup & Static-Host Boundary
- **Status**: `[ ] PENDING SIGNOFF`
- **Owner Modules**: `package.json`, `vite.config.ts`, `README.md`
- **Architecture Ref**: `§5.5`, `§3.16`
- **Depends On**: `["TASK-18"]`
- **kstore Key**: `argon.squash.v2.tasks.TASK-19`
- **Deliverables**:
  - Remove `@google/genai` (never imported) and the `GEMINI_API_KEY` define.
  - Rename `GEMINI_TTS_CLIPS` -> `VOICE_PACK_CLIPS` after TASK-18 lands.
  - README: document surge.sh solo-play boundary vs `/api/*` relay (multiplayer + phone controllers).
- **Acceptance Gate**: `npm run build` and `npm run dev` succeed with no Gemini/genai references remaining; `/api/*` middleware still works under `vite preview`.

### `TASK-20` — surge.sh Static Deploy Verification
- **Status**: `[ ] PENDING SIGNOFF`
- **Owner**: `dist/` (build output)
- **Architecture Ref**: `§3.16`
- **Depends On**: `["TASK-19"]`
- **kstore Key**: `argon.squash.v2.tasks.TASK-20`
- **Deliverables**:
  - `npm run build` -> `npx surge ./dist squash-arcade.surge.sh`; verify solo play end-to-end (rally, voice pack audio, jukebox, all camera modes).
  - Confirm companion/room flows degrade gracefully (no crash) where `/api/*` is absent.
- **Acceptance Gate**: Deployed site boots and rallies with voice-pack audio and zero console errors on a clean browser profile.

---

## Sign-off

- [ ] Architecture alignment approved (v2.2.0)
- [ ] TASK-15 .. TASK-20 scope + acceptance gates approved
- [ ] TTS provider selected for TASK-18

