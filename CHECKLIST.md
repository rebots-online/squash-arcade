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
       └──► [TASK-18: Google Dependency Cleanup & Static-Host Boundary]
       │           │
       │           ▼
       │   [TASK-19: surge.sh Static Deploy Verification]
       │
       └──► [TASK-20: Skills Demonstration Onboarding (Wonder-Demo Rework)]
```

---

## Ordered Tasks & Acceptance Gates

### `TASK-15` — Lighter Back-Wall Out Line
- **Status**: `[x] COMPLETED`
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
- **Status**: `[x] COMPLETED`
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
- **Status**: `[x] COMPLETED`
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
- **Status**: `[x] COMPLETED`
- **Owner Modules**: `package.json`, `vite.config.ts`, `README.md`
- **Architecture Ref**: `§5.4`, `§3.16`
- **Depends On**: `["TASK-17"]`
- **kstore Key**: `argon.squash.v2.tasks.TASK-18`
- **Deliverables**:
  - Remove `@google/genai` (never imported) and the `GEMINI_API_KEY` define.
  - README: document surge.sh solo-play boundary vs `/api/*` relay (multiplayer + phone controllers).
- **Acceptance Gate**: `npm run build` and `npm run dev` succeed with no Gemini/genai references remaining; `/api/*` middleware still works under `vite preview`.

### `TASK-19` — surge.sh Static Deploy Verification
- **Status**: `[x] COMPLETED`
- **Owner**: `dist/` (build output)
- **Architecture Ref**: `§3.16`
- **Depends On**: `["TASK-18"]`
- **kstore Key**: `argon.squash.v2.tasks.TASK-19`
- **Deliverables**:
  - `npm run build` -> `npx surge ./dist squash-arcade.surge.sh`; verify solo play end-to-end (rally, referee callouts, jukebox, all camera modes).
  - Confirm companion/room flows degrade gracefully (no crash) where `/api/*` is absent.
- **Acceptance Gate**: Deployed site boots and rallies with zero console errors on a clean browser profile.

### `TASK-20` — Skills Demonstration Onboarding (Wonder-Demo Rework)
- **Status**: `[x] COMPLETED`
- **Owner Modules**: `src/squash/IntroDirector.js`, `src/squash/NickCollisionModel.js`, `src/hud_ui.js`, `index.html` (copy)
- **Architecture Ref**: `§5.5`, `§3.8`, Gate J
- **Depends On**: `["TASK-17"]`
- **kstore Key**: `argon.squash.v2.tasks.TASK-20`
- **Deliverables**:
  - Reframe the two-part "wonder demo" intro as an enumerated **Skills Demonstration**: Serve, Straight Drive, Cross-Court Drive, Drop/Cut Drop, Boast (2-wall + back-wall), Lob, Volley, Nick finish — each step labeled `SKILL n/8 — <NAME>` with a one-line description.
  - New `NickCollisionModel.getNickLabScenario` entries for skills not yet scripted; slow-mo replay inspection stays as capstone; `skipToPlayableMatch` unchanged.
  - Copy sweep: remove "wonder"/mystery framing from HUD banners, intro copy, and menu strings; keep the physical demo shots identical (same physics, new labels).
- **Acceptance Gate (J)**: Onboarding presents a clearly labeled skills walkthrough; each demonstrated shot is named for its squash skill on screen; skip-to-play still works; no unexplained "wonder" framing remains in user-facing text.

---

## Sign-off

- [ ] Architecture alignment approved (v2.2.0)
- [ ] TASK-15 .. TASK-20 scope + acceptance gates approved

