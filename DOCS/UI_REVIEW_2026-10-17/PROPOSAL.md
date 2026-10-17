# Virtual Squash / Argon Squash — preimplementation proposal

**Recommendation: Courtside clarity.** Preserve physical chess, wonder first; remove visual competition around the court. This is a design proposal, not a modified application.

## Baseline and authority

The initial brief reported GitHub main `e9b5acb6f05ef81846bd8f6cc82295e2a6108665`, remote msi4090 `b56644e`, source tree `00ca9e1d7ce0cae0e578473ff5e7e086a103f9b6`, and equality with Windows. Those are supplied parent reports, not fresh Git verification.

During the audit, `BASELINE_UPDATE.md` reported an operator sync from Gemini Argon and resolution of the newer-work locator. A read-only branch-reference check confirmed `deeea2ed59da55bc5aa30b33ed9984d68709eac7`. No Git command was run. Final captures follow browser reload and completed initialization. Remote equality and historical diff are not independently verified. If another source is located, stop implementation approval and refresh this comparison.

## Direction comparison

| Direction | Visual / interaction posture | Strength | Cost | Decision |
|---|---|---|---|---|
| Courtside clarity | White chrome, stable setup rail, large real court, explicit groups | Fast entry with advanced capability retained | Secondary controls move one level deeper | Recommend as default |
| Broadcast minimal | Score-first and almost full-court; contextual controls | Spectator and TV viewing | Weak discoverability for beginners; remote focus needs work | Adapt as spectator presentation |
| Precision studio | Court plus persistent tuning and measurements | Repeatable physics investigation | Dense and distracting during ordinary play | Use inside Tune Lab only |

The supplied Product palette and Inter stacks are retained. The proposal deliberately uses a single utilitarian type family because it is an operator comparison and the supplied brand locks it. Existing game artwork supplies the expressive flourish. No generated or substitute court/player imagery is used. Proposed states reuse a clearly labeled real screenshot detail.

## Preserve the complete journey

1. **Setup:** Opponent (Club/Pro), spectator and experimental 1v1; Glass/Hardwood/Neon court; Arcade 5/PAR 11/Hi-Ho 9; Auto-T/manual footwork, referee and optional input camera. Four steps remain visible as summaries.
2. **Entry:** Play Now remains immediate; Wonder Demo remains a two-part voluntary discovery route; Watch AI remains a first-class secondary choice.
3. **Play:** Score/game/serve state, Auto-T, drive/drop/boast/lob/kill/Let, preparation timing, manual movement, court view and replay remain available. No physics or scoring rewrite is proposed.
4. **Help:** Controls and Rules are separate, focused views with return-to-court and complete-reference access.
5. **Sound/input:** Preserve the updated 14-track Jukebox, music modes, referee and effects controls; distinguish court view from input-camera placement, facing and handedness.
6. **Tune Lab:** Preserve named presets, save/duplicate/reset, JSON import/export, ball/nick, shot/cut, movement/AI, biomechanical controls, deterministic Nick Lab, A/B and diagnostics.
7. **Phone:** Preserve touch shots, inertial input and Let, but label backend/sensor dependencies and experimental status accurately. Pairing, permission and connection are separate states.

## Detailed findings

P0 = blocks trustworthy entry, responsive play or review approval. P1 = meaningful usability/accessibility or reproducibility issue. P2 = polish with lower journey risk. Priorities are design judgments, not measured failure rates.

### 01 · P0 · Name the build before approving a redesign

**Observation:** The supplied e9b5acb baseline was superseded during this audit. The branch reference now reads deeea2e; graph counts also changed.

**Evidence:** `BASELINE_UPDATE.md; .git/refs/heads/main; CodeGraph status`; [media/before-setup-desktop.png](media/before-setup-desktop.png).

**Proposed change:** Pin the operator review to deeea2e and retain a visible provenance strip. Reopen approval if another source is located.

**Aesthetic and human-factors rationale:** Prevents polishing an obsolete interface and attributing old defects to new work.

**Tradeoff:** Reconciliation delays implementation; it avoids duplicated work.

**Dependencies:** Operator confirms served build and intended source.

**Testable acceptance:** Reviewer can identify the revision and capture viewport without opening developer tools.

**Operator decision:** Accept deeea2e as the review baseline; do not treat tree equivalence as newly verified.

### 02 · P0 · Give the first rally one clear route

**Observation:** Setup combines four steps, explanatory text, a miniature court, three strong start actions and the live HUD.

**Evidence:** `index.html #title-modal, #btn-start-match; DOCS/ARCHITECTURE.md §1`; [media/before-setup-desktop.png](media/before-setup-desktop.png).

**Proposed change:** Retain four numbered summaries and ready defaults. Make Play Now the only solid action; keep Wonder Demo and Watch AI as visible secondary choices.

**Aesthetic and human-factors rationale:** A stable action hierarchy reduces scanning while preserving the wonder-first invitation.

**Tradeoff:** Less initial exposition; the full setup remains editable.

**Dependencies:** Initialization readiness and existing start/intro/spectator handlers.

**Testable acceptance:** From ready page load, 4 of 5 first-time participants begin a rally within 30 seconds without coaching; measure load time separately.

**Operator decision:** Approve Play Now as primary, Wonder Demo as the featured secondary route.

### 03 · P0 · Reflow the HUD instead of compressing it

**Observation:** Portrait retains broad left/right toolbar groups; controls crowd the score and extend beyond the visible width.

**Evidence:** `styles.css:2–3; #top-hud-bar; before-game-portrait.png`; [media/before-game-desktop.png](media/before-game-desktop.png).

**Proposed change:** Use score + match status + Menu in a compact header. Keep six shot actions in a 3×2 grid and move camera/audio/help into a named menu.

**Aesthetic and human-factors rationale:** Protects court visibility and gives thumbs predictable targets.

**Tradeoff:** Some secondary actions take one extra tap.

**Dependencies:** Responsive layout and safe-area handling.

**Testable acceptance:** At 390×844 and 844×390 every primary action is reachable, with no horizontal page scroll or overlap; targets at least 44×44 CSS px.

**Operator decision:** Approve separate portrait and landscape compositions.

### 04 · P0 · Connection must mean acknowledged connection

**Observation:** The phone page says Connected on arrival. Source hardcodes that label; requests swallow network errors and do not check response.ok.

**Evidence:** `public/companion.html #conn-badge, sendSwing, telemetry interval`; [media/before-companion-portrait.png](media/before-companion-portrait.png).

**Proposed change:** Distinguish Not paired, Connecting, Connected, Reconnecting and Server unavailable. Show room/player identity and last acknowledged input.

**Aesthetic and human-factors rationale:** Truthful feedback prevents repeated swings and false confidence.

**Tradeoff:** Requires a small status contract, not just copy changes.

**Dependencies:** Backend acknowledgment, heartbeat timeout and room identity.

**Testable acceptance:** With backend offline, never show Connected; recover after reconnect without sending stale strokes or changing player assignment.

**Operator decision:** Approve acknowledgment-based connection status before promoting phone play.

### 05 · P0 · Make permission recovery a first-class route

**Observation:** Permission results are not checked before the Active label; bindSensors runs on load and again after enable. No camera or mic was granted in this audit.

**Evidence:** `public/companion.html permission handler; README Controls and modes`; [media/before-companion-portrait.png](media/before-companion-portrait.png).

**Proposed change:** Separate connection from sensor permission. Explain the request, offer touch-only play, show denied/unsupported states and a retry path.

**Aesthetic and human-factors rationale:** People understand what is missing and retain a usable alternative.

**Tradeoff:** Additional state design and physical-device testing.

**Dependencies:** Browser permission outcomes, HTTPS deployment and sensor capability detection.

**Testable acceptance:** Denied, unavailable and allowed outcomes each have truthful labels; listeners bind once; touch actions remain usable without motion permission.

**Operator decision:** Approve touch fallback and explicit Experimental phone labeling.

### 06 · P1 · Make setup work without hover

**Observation:** The interface explicitly instructs users to hover or select to reveal steps; panels use max-height and overflow hiding.

**Evidence:** `index.html setup-step-1 through setup-step-4; styles.css:145–151`; [media/before-setup-desktop.png](media/before-setup-desktop.png).

**Proposed change:** Use explicit disclosure buttons with expanded state, retained summaries and visible selection marks. Preserve opponent, spectator/1v1, court, scoring, footwork/referee/camera.

**Aesthetic and human-factors rationale:** Touch, keyboard and remote users receive the same sequence.

**Tradeoff:** Expanded setup can require vertical scrolling.

**Dependencies:** Accessible disclosure semantics and existing preference state.

**Testable acceptance:** Tab/Enter can open all four steps; selected values survive collapse; 200% zoom exposes all choices.

**Operator decision:** Approve click/keyboard disclosure with no hover dependency.

### 07 · P1 · Use type size to express importance

**Observation:** Several setup helpers and toolbar labels are around 10–12px, bold and uppercase; many compete with the score.

**Evidence:** `styles.css:3, 162–176; before-setup-desktop.png`; [media/before-setup-desktop.png](media/before-setup-desktop.png).

**Proposed change:** Use the supplied Inter stack, 16px body, 14px metadata, 24–32px section titles and tabular score numerals. Reserve heavy weight for score and primary actions.

**Aesthetic and human-factors rationale:** Readable rhythm makes the product feel deliberate without losing its arcade personality.

**Tradeoff:** Slightly fewer controls fit on the first view.

**Dependencies:** Responsive layout and actual font availability.

**Testable acceptance:** No essential instruction below 14px on desktop or 16px in phone controls; TV labels tested at viewing distance.

**Operator decision:** Approve typography hierarchy, retaining supplied brand fonts.

### 08 · P1 · Replace color competition with explicit state

**Observation:** Cyan, green, yellow, gold, purple and red borders/gradients all signal importance. Selection depends heavily on color.

**Evidence:** `styles.css:1–3, shot-chip, wii-green-choice, let-call-chip`; [media/before-game-desktop.png](media/before-game-desktop.png).

**Proposed change:** Use white/surface neutrals, one blue accent and text/check marks for selection. Reserve contextual state words for errors, connection and experimental modes.

**Aesthetic and human-factors rationale:** A consistent visual grammar reduces search cost and works without color perception.

**Tradeoff:** Less decorative shine; court and character animation retain energy.

**Dependencies:** Token mapping and contrast verification.

**Testable acceptance:** Text contrast ≥4.5:1, large text/icons ≥3:1 across default/hover/focus; selected states identifiable in grayscale.

**Operator decision:** Approve quieter chrome while preserving the real game artwork.

### 09 · P1 · Keep the shot vocabulary and make timing readable

**Observation:** Drive, Cut Drop, Boast, Lob, Kill and Let are available; timing labels are tiny and far from the score.

**Evidence:** `index.html .squash-shot-selector-row, #timing-gauge-card; before-game-desktop.png`; [media/before-game-desktop.png](media/before-game-desktop.png).

**Proposed change:** Retain all six actions, show selected shot text and a wider three-region timing meter. Teach hold/release and Shift cut alongside the first serve.

**Aesthetic and human-factors rationale:** Preserves depth while reducing memory burden for beginners.

**Tradeoff:** A larger input dock occupies some court-adjacent space.

**Dependencies:** Shot handler mappings, preparation state and pointer cancellation.

**Testable acceptance:** Keys 1–5 and F/L remain valid; hold/release, cancel and focus loss cannot produce unintended shots; labels remain legible on phones.

**Operator decision:** Approve the six-action dock and explicit timing labels.

### 10 · P1 · Separate help from live play and tuning

**Observation:** Controls successfully opens Rules and Rules resumes play; the accessibility tree still exposes background HUD controls. Focus remains on the opening control in observed snapshots.

**Evidence:** `index.html #controls-guide-modal, #squash-rules-modal; before-controls-desktop.png`; [media/before-controls-desktop.png](media/before-controls-desktop.png).

**Proposed change:** Use one modal owner, move focus into the dialog, make background inert, pause safely and restore focus on close. Tune Lab becomes a distinct workspace.

**Aesthetic and human-factors rationale:** Prevents accidental shots while reading and establishes predictable keyboard behavior.

**Tradeoff:** Requires shared overlay state rather than separate booleans.

**Dependencies:** Pause/resume policy and input routing.

**Testable acceptance:** Tab stays inside help; Escape closes only the top surface; game hotkeys do not fire while typing or reading; focus returns to opener.

**Operator decision:** Approve a single overlay policy; verify existing pause semantics before wiring.

### 11 · P1 · Teach rules in layers, keep the reference

**Observation:** Rules presents a long official-reference panel with dense court, scoring, serve and interference sections.

**Evidence:** `index.html #squash-rules-modal; before-rules-desktop.png`; [media/before-rules-desktop.png](media/before-rules-desktop.png).

**Proposed change:** Lead with a concise game guide and a persistent Call Let explanation; place complete rules and external authority links under named sections. Preserve PAR 11, Arcade 5 and Hi-Ho 9.

**Aesthetic and human-factors rationale:** Novices can act immediately while experts retain reference depth.

**Tradeoff:** Editorial review is needed to avoid changing rules meaning.

**Dependencies:** RulesEngine/source alignment; current governing-body review before release.

**Testable acceptance:** A user can locate serve, scoring and interference within 10 seconds; no claim of certification; no blocked access to full reference.

**Operator decision:** Approve layered help, with rules accuracy reviewed separately.

### 12 · P1 · Let Wonder Demo own the stage

**Observation:** Wonder starts correctly, but narrator promotion and demo commentary can coexist with center banners and the full HUD.

**Evidence:** `before-wonder-desktop.png; DOCS/ARCHITECTURE.md §1 and IntroDirector`; [media/before-wonder-desktop.png](media/before-wonder-desktop.png).

**Proposed change:** Use one caption channel, progress A/B, explicit Skip/Replay and a clear handoff to Play. Preserve spectacular kill and gentle drop.

**Aesthetic and human-factors rationale:** Attention stays on geometry, disguise and the nick rather than competing messages.

**Tradeoff:** Requires arbitration between narrator, referee and intro messages.

**Dependencies:** IntroDirector and audio narration scheduling.

**Testable acceptance:** During either demo only one teaching caption is visible; skip exits reliably; reduced-motion setting removes flashes/zoom while preserving explanation.

**Operator decision:** Approve a focused two-part demonstration, not a mandatory tutorial.

### 13 · P1 · Give Tune Lab a safe experimental workspace

**Observation:** A narrow live drawer contains presets, small controls, sliders, nick scenarios and diagnostics over active court play.

**Evidence:** `src/squash/TuningPanel.js:120–160, 167–263; before-tuning-desktop.png`; [media/before-tuning-desktop.png](media/before-tuning-desktop.png).

**Proposed change:** Separate Presets, Physics, Shot & Cut, Move & AI, Nick Lab, A/B and Diagnostics. Show units, changed values, reset scope and Live/Paused status.

**Aesthetic and human-factors rationale:** Experts can manipulate a hypothesis without hiding the consequences or confusing tuning with ordinary settings.

**Tradeoff:** Larger workspace; beginner path stays simpler.

**Dependencies:** TuningStore undo/snapshot behavior and pause policy.

**Testable acceptance:** Every slider has a programmatic label and exact numeric input; reset states its scope; import reports validation before apply.

**Operator decision:** Approve expert workspace and preservation of all current tuning operations.

### 14 · P1 · Keep evidence attached to A/B results

**Observation:** A/B compares identical scenarios; Diagnostics displayed 15/15 passed. That display does not prove phone, camera or physical squash correctness.

**Evidence:** `src/squash/TuningPanel.js:397–425; before-nicklab-desktop.png; before-diagnostics-desktop.png`; [media/before-tuning-desktop.png](media/before-tuning-desktop.png).

**Proposed change:** Attach preset names, seed, configuration hash, units and run time to every comparison. Separate simulator checks from runtime/device acceptance.

**Aesthetic and human-factors rationale:** Makes results repeatable and prevents an automated pass being mistaken for product readiness.

**Tradeoff:** More metadata and export requirements.

**Dependencies:** Deterministic runner and export schema.

**Testable acceptance:** Same seed/config reproduces trajectory within documented tolerance; exported report contains provenance; UI never labels untested devices verified.

**Operator decision:** Approve separate simulation and physical-device evidence gates.

### 15 · P1 · Distinguish court camera from input camera

**Observation:** Court view cycling appears twice; Pose Cam and handedness sit elsewhere. Updated source includes camera placement/interpretation paths.

**Evidence:** `index.html #btn-top-camera-cycle, #btn-webcam-toggle, #btn-camera-facing; src/motion_controls.js`; [media/before-camera-desktop.png](media/before-camera-desktop.png).

**Proposed change:** Use Court view for Back Glass/Front Wall/High Gallery/Corner Nick/Overhead T; Input camera for front/rear, placement and mirrored preview. Keep handedness explicit.

**Aesthetic and human-factors rationale:** Eliminates ambiguity between watching the court and capturing the player.

**Tradeoff:** One extra group in settings.

**Dependencies:** Camera mode handler and biomechanical coordinate conventions.

**Testable acceptance:** Court-view changes do not request permission; input-camera changes explain permission; right/left and mirrored/rear combinations validated on hardware.

**Operator decision:** Approve separate names and no automatic camera activation.

### 16 · P2 · Preserve the soundtrack with calmer audio controls

**Observation:** Updated Jukebox exposes 14 tracks, auto/locked/shuffle modes and referee controls; the HUD repeats audio actions.

**Evidence:** `before-audio-desktop.png; src/audio_engine.js; index.html #jukebox-modal`; [media/before-audio-desktop.png](media/before-audio-desktop.png).

**Proposed change:** Keep one Sound entry with current track and mute state. In Jukebox separate music, court effects and referee/narrator; label Next/Previous rather than relying on glyphs.

**Aesthetic and human-factors rationale:** The soundtrack remains a product feature while speech and game feedback become easier to manage.

**Tradeoff:** Independent volume controls may require audio routing work.

**Dependencies:** Existing audio engine and browser autoplay rules.

**Testable acceptance:** Mute state is explicit; keyboard names announce Next track; referee calls remain available when music is muted if independent mixing is approved.

**Operator decision:** Approve grouping; decide whether independent narrator/referee volume is in scope.

### 17 · P1 · Design for the couch and for reduced motion

**Observation:** The source uses pulsing indicators and animated banners; no prefers-reduced-motion rule was found. Dedicated Cast support is not established.

**Evidence:** `styles.css animations and media query; README TV boundary`; [media/before-game-desktop.png](media/before-game-desktop.png).

**Proposed change:** Offer reduced motion, a readable TV presentation mode and keyboard/remote focus order. Keep screen mirroring described separately from Cast support.

**Aesthetic and human-factors rationale:** Respects motion sensitivity and distance viewing without inventing platform capabilities.

**Tradeoff:** Requires real TV/WebView and remote testing.

**Dependencies:** Animation controls, input mapping and display-safe margins.

**Testable acceptance:** Reduced-motion disables nonessential pulses/zoom; all actions operable by keyboard; test at 1920×1080 from 2–3 metres; do not claim Cast certification.

**Operator decision:** Approve TV readability target, defer unsupported receiver promises.

### 18 · P1 · Show readiness before inviting interaction

**Observation:** Early startup observations came from an unprovisioned checkout. The updated parent note reports 13 local assets downloaded; after reload, game and panels worked. This is a resilience opportunity, not a persistent current-build defect.

**Evidence:** `BASELINE_UPDATE.md; final working captures; live-actions.json`; [media/before-setup-desktop.png](media/before-setup-desktop.png).

**Proposed change:** Show Preparing court with a meaningful status; enable start when handlers/assets are ready, with retry and keyboard fallback on failure.

**Aesthetic and human-factors rationale:** Prevents an initial silent response from being interpreted as a broken game.

**Tradeoff:** A readiness gate must not hide partial-load recovery.

**Dependencies:** Asset/module lifecycle and timeout reporting.

**Testable acceptance:** Under throttled network, no apparently ready inactive start button; failure explains recovery; warm/cold first-rally times reported separately.

**Operator decision:** Approve readiness state; early behavior is not a persistent gameplay failure.

## Specification and acceptance boundaries

- **Desktop 1440×900:** 32px outer layout, 360px setup rail, 32px gap; court receives the remaining area. Gameplay separates score, court and shot/timing dock. Auxiliary workspaces do not compete with a setup overlay.
- **Portrait 390×844:** 16–20px margins, single-column setup; primary action after four summaries; court preview follows in normal scroll flow. Gameplay uses a 3×2 shot grid. Companion uses a single reconnect action and explicit disabled shot state until acknowledgment.
- **Landscape 844×390:** Short header and side-by-side court/input region; setup scroll is intentional, primary action must remain reachable. No claim that all configuration fits without vertical scrolling.
- **Typography:** 16px normal reading text, 14px metadata, 28–36px main product headings; tabular score numerals. The comparison scales screenshots down for overview; assess actual captured dimensions using the PNGs.
- **Spacing and controls:** 8px rhythm, 8px corners, 1px borders, 44px minimum interactive targets; companion actions 52px. Text is never the sole affordance for live state without a label.
- **Contrast:** Foreground on white/surface carries body text; muted is limited to secondary text. Accent is reserved for focus/timing, not small white-on-blue labels. Focus rings are explicit. Selection uses border and a check mark. Actual game colors inside screenshots are evidence, not proposed CSS tokens.
- **Keyboard:** All comparison controls are native buttons/selects/links. Proposed game shortcuts preserve existing intent. Future implementation must suspend game input in help/forms, restore focus and provide a visible Escape route.
- **Reduced motion:** Proposal contains no continuous animation; media-query override protects future transitions. Product acceptance must include reduced-motion intro/replay/Let alerts and no forced motion.
- **TV:** Browser viewport emulation is not TV or Cast validation. Use keyboard/remote testing and viewing-distance readability before claiming TV support.
- **Recovery:** Separate asset load failure, unavailable backend, room mismatch, permission denied, unsupported sensors, lost focus and reconnect. Never queue old swings for replay after reconnect.

## Review coverage and next implementation gate

The operator comparison supports state navigation, viewport navigation and before/proposed display modes. Proposed product screens are static samples, not functional game controls. The real before captures establish the existing appearance; after captures establish proposal layout only. No claim is made that the first-rally target, accessibility audit, real camera tracking, phone sensor reliability, audio listening quality or TV usability has passed.

Before implementation: operator confirms baseline and direction, then authorizes specific findings. Update the application's architecture and checklist in that future task. This audit made no product file edits, no Git actions and no recursive OpenDesign dispatch.
