# Squash Arcade design audit — evidence ledger

Date: 2026-10-17. Scope: **PREIMPLEMENTATION ONLY**.

## Deliverables and preview

- Preview: http://127.0.0.1:47531/index.html
- `index.html`: self-contained operator comparison. Inline CSS, JavaScript and embedded PNGs; no external libraries, font downloads or image hotlinks.
- `PROPOSAL.md`: three directions, one recommendation, 18 prioritized findings with observation, source/media, change, aesthetic/human-factors rationale, tradeoff, dependencies, testable acceptance and operator decision.
- `brand-spec.md`: six supplied palette tokens in OKLch, font stacks and visual rules.
- `media/`: original before PNGs, rendered proposed after PNGs, and the real cropped court asset. All permanent files are in this project directory.
- `media-manifest.json`: exact PNG dimensions, SHA-256 and modification time for every capture.
- `source-manifest.json`: SHA-256 of reviewed source/document files at verification time.
- `live-actions.json`, `layout-checks.json`, `verification.json`: interaction observations, layout metrics and static checks.
- `build_proposal.py`, `verify_proposal.py`, `verification.js`: reproducible artifact construction and syntax/static validation, not game application implementation.

## Requested and actual model

Requested: the specialized frontier model for this existing project's audit. The supervising session commissioned the design pass through OpenDesign MCP with the explicit model override `gpt-6-astra`, using the installed Codex runtime returned by the agent catalogue. OpenDesign accepted that request. The design session identifies itself as **Codex based on GPT-6**, but its exact executed model ID is not exposed in the returned run status. Thus the requested model is recorded precisely; actual model routing is not independently attested. The commissioned design pass did not dispatch another design run or call a model-provider API directly.

## Baseline reconciliation

The brief supplied these parent-reported facts:

- GitHub main: `e9b5acb6f05ef81846bd8f6cc82295e2a6108665`.
- msi4090 remote: `b56644e`.
- Source tree: `00ca9e1d7ce0cae0e578473ff5e7e086a103f9b6`, reported equal to Windows.
- Operator believed newer work existed elsewhere, locator pending.

During this run, project-local `BASELINE_UPDATE.md` reported an operator sync from Gemini Argon to `deeea2ed59da55bc5aa30b33ed9984d68709eac7`, camera/audio updates and resolution of the locator question. The audit independently read `.git/HEAD` and `.git/refs/heads/main`; the latter contained that full new revision. This is a **local ref observation**, not a fresh GitHub/remote tree verification. No Git command or action was performed. The note is retained as a source report, not treated as authorization to run its suggested Git diff.

Final before captures were made after reloading http://127.0.0.1:47528/ and allowing initialization to complete. Early sky/ground captures were overwritten by working-build captures. The later update to BASELINE_UPDATE.md reports that the parent provisioned all 13 local model/MediaPipe dependencies with the existing asset downloader. Early sky/ground and non-response observations belong to that superseded unprovisioned state, not normal current UI. Final captures show the working provisioned build. The audit did not independently recount those dependencies or measure first-rally duration; readiness is retained only as a resilience recommendation.

**Approval caveat:** operator-reported newer-work uncertainty is resolved by the supplied update, but remote equality remains unverified. If another source or served build is located, refresh this comparison before implementing.

## CodeGraph and source access

Read-only `codegraph status` reported:

- 24 files; 621 nodes; 1,824 edges; index up to date.
- JavaScript: 23 files; TypeScript: 1 file.
- SQLite `PRAGMA integrity_check` through a read-only connection returned `ok`.

These current counts supersede the brief's 24 files / 608 nodes / 1,775 edges. No initialization or synchronization was needed because the graph was healthy and current.

The initial CodeGraph query named `index.html styles.css public/companion.html`. It returned related JavaScript rather than HTML/CSS file nodes, and explicitly reported no uniquely indexed companion file. Together with its JS/TS-only language inventory, this establishes the HTML/CSS parser coverage boundary. Targeted reads therefore used the actual **root** `index.html`, root `styles.css` and `public/companion.html`. No mistaken `src/index.html` or `src/styles.css` path was used.

Reviewed documents: `README.md`, `DOCS/ARCHITECTURE.md`, `CHECKLIST.md`.

Reviewed source: root HTML/CSS and companion HTML, plus CodeGraph excerpts of `src/game_engine.js`, `src/audio_engine.js`, `src/squash/BiomechStrokeClassifier.js` and `src/squash/TuningPanel.js`. The latter query covered `_renderFullPanel`, `_renderTabContent`, `_runABComparison` and `updateLiveTelemetry`. Source manifests are a fingerprint, not a claim that every line of every file was read. Graph excerpts and some large source outputs were capped; findings cite the actual reviewed sections and live observations.

The supplied redesign skill's audit categories informed typography, layout, state and icon review. Its implementation/commit suggestions were superseded by the explicit proposal-only/no-Git scope. The design-review catalogue entry contained no executable audit checklist; no upstream installation was attempted. The supplied Product visual rules governed the proposal.

## Live review observations

Browser: available CUA Chrome. Agent-browser was not used. Capture API: Chrome PNG screenshot with explicitly set CSS viewport and device scale 1; PNG header dimensions verified independently. Viewport emulation is **not physical-device testing**.

1. Reloaded the corrected baseline. After initialization, Play Match Now dismissed setup and entered the court. Rally/score changes were visible.
2. Opened Controls; opened complete Rules from Controls; resumed to court.
3. Opened Tune Lab; inspected preset choices, Ball & Nick controls, Nick Lab / A-B scenarios and Diagnostics.
4. Diagnostics displayed **15/15 passed** on opening. This is the observed in-app report; no separate independent physics certification is claimed.
5. Opened the updated 14-track Jukebox. Original/synth/classic labels, auto/locked/shuffle options, referee pitch and mixer controls were visible. Audible quality/listening was not verified.
6. Started Wonder Demo. It progressed from the spectacular kill to the physical-chess revelation; Try It Yourself returned to the game. A later attempt to use the initial Skip label found the demo had already changed state. No forced game-state injection was used.
7. Clicked the court camera control. The immediate observed label remained Back Glass; this audit does **not** claim successful cycling or validate all five camera angles. Camera-control presence and source intent are distinguished from this runtime uncertainty.
8. Opened and reloaded the companion. It displayed Connected before any sensor grant. Source shows that status is hardcoded and fetch failures are swallowed.
9. No camera, microphone or motion-sensor permission was granted. No sensor button was activated. Normal companion-page telemetry may run automatically as implemented by the existing page.

## Capture inventory

| State | Real before | Rendered static after | Size |
|---|---|---|---|
| Setup | `media/before-setup-desktop.png` | `media/after-setup-desktop.png` | 1440×900 |
| Setup portrait | `media/before-setup-portrait.png` | `media/after-setup-portrait.png` | 390×844 |
| Setup landscape | `media/before-setup-landscape.png` | `media/after-setup-landscape.png` | 844×390 |
| Gameplay | `media/before-game-desktop.png` | `media/after-game-desktop.png` | 1440×900 |
| Gameplay portrait | `media/before-game-portrait.png` | `media/after-game-portrait.png` | 390×844 |
| Gameplay landscape | `media/before-game-landscape.png` | `media/after-game-landscape.png` | 844×390 |
| Controls | `media/before-controls-desktop.png` | `media/after-controls-desktop.png` | 1440×900 |
| Rules | `media/before-rules-desktop.png` | `media/after-rules-desktop.png` | 1440×900 |
| Wonder Demo | `media/before-wonder-desktop.png` | `media/after-wonder-desktop.png` | 1440×900 |
| Tune Lab | `media/before-tuning-desktop.png` | `media/after-tuning-desktop.png` | 1440×900 |
| Audio | `media/before-audio-desktop.png` | `media/after-audio-desktop.png` | 1440×900 |
| Camera-control context | `media/before-camera-desktop.png` | `media/after-camera-desktop.png` | 1440×900 |
| Phone recovery | `media/before-companion-portrait.png` | `media/after-companion-portrait.png` | 390×844 |

Additional evidence: `media/before-nicklab-desktop.png`, `media/before-diagnostics-desktop.png` (1440×900). The court asset `media/live-court.png` is a deliberate 1440×570 crop of the live court viewport; it is labeled as a static baseline detail in the proposal. Full before captures are unedited screenshots. Proposed screens do not claim frame-for-frame ball, score or camera parity with the before moment.

The finished overview is captured in `media/operator-comparison.png` at 1440×900. The final inventory contains 30 PNGs: 13 before/after pairs, two additional live Lab evidence captures, one real court detail and one operator overview.

Only setup and gameplay have all three viewport pairs. Auxiliary state selections explicitly report their available desktop size; companion uses portrait. A fallback to the available size is labeled rather than fabricated.

## Artifact verification

- Required PNG pairs and exact encoded dimensions passed.
- The comparison's state select, viewport select and Proposed/Side-by-side controls were exercised. Gameplay portrait selection loaded a 390×844 image, showed After and hid Before as expected; both image elements reported complete and nonzero natural width.
- Native comparison controls have visible focus rings and minimum 44px targets. Sample product controls are intentionally noninteractive spans and are explicitly labeled static.
- JavaScript syntax passed `node --check verification.js`.
- Static HTML checks passed: unique operator IDs, balanced script tags, no temporary template placeholders, no external image sources.
- CSS palette check found only the six supplied literal colors; typography stacks and 8px/1px component treatment are retained. Plain text product naming is used because no logo was supplied.
- Calculated text contrast: foreground/white **18.88:1**; foreground/surface **17.77:1**; muted/surface **4.55:1**. Accent/white **4.10:1** is used for focus/timing graphics, not small white text.
- Inspected rendered desktop setup, portrait setup/gameplay, landscape gameplay and companion recovery. Fixed the mobile instruction from keyboard-only guidance to touch-shot guidance, and removed the landscape secondary footer to keep primary gameplay controls clear. Normal vertical scrolling remains intentional for setup and long auxiliary content.
- Layout metrics showed no horizontal document overflow for proposed setup/gameplay at the two small viewports. The stored metrics precede the final landscape-footer reduction; final PNGs capture that local refinement.

## Boundaries and limitations

- No files in `E:\devProjects\squash-arcade` were edited. No Git actions, app build, deployment or recursive OpenDesign run occurred.
- No exact specialized model ID can be attested; requested routing remains unverified.
- No physical phone, camera, microphone, TV, controller, sensor, haptic, audio listening or multiplayer/backend acceptance is claimed.
- The 30-second first-rally objective is a proposed acceptance gate, not a measured success.
- Focus containment of original modals, full keyboard gameplay, every hover state, all camera modes and real recovery under network loss require future implementation/runtime tests. The audit does not present source presence as proof of them.
- Official rule accuracy and current external rules links were not re-certified; the proposal preserves access and calls for editorial validation before release.
- Screenshots include original product artwork and labels. They are used as operator-review evidence; underlying asset/license clearance is not established by this audit. No generated look-alikes or new third-party assets were introduced.

Operator review can proceed on design direction and priorities. Implementation and product acceptance remain separate, explicitly unperformed work.

