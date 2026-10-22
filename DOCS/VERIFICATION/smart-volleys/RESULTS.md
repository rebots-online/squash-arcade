# Smart volleys evidence

Baseline 7b1df9b synced from GitHub after verified stash/bundle snapshot. Managed branch codex/smart-volleys. Baseline Node suite: 29 passed, 0 failed. CodeGraph initialized, status current, SQLite integrity ok.

Architecture/checklist/rubric authored before gameplay edits. Implementation in progress.
TASK-40: red 3/3 -> green 3/3; all 32 tests pass; lint 26 files, zero defects. Actual seeded attacking boast nick rate: exact human 120/120, AI 29/120. This is a controlled shot sample, not an overall match winner rate.
TASK-41: absent planner reproduction -> six focused tests green. All 38 tests pass; lint 27 files, zero defects. Mirrored front/mid/rear opportunity, cross drop, explicit aim, age/reach/height/blocked rejection, rear AI gating and deep length verified. Runtime remains pending.
TASK-42: five focused tests including real engine score-once/match deferral, real BallPhysics continuation, recorded racket poses, bounded recording and consumed input chain. Full suite 43 passes; lint 28 files, zero defects. Runtime visual validation pending.
TASK-43: five focused tests green including real engine toss/contact guards, stable arrival, crowding correction without score, stale token and true foot fault. Full suite 48 passes; lint 29 files, zero defects.
TASK-44: contact-quality regression red -> green. Mirrored perfect pocket 2/2 physical nicks; stretched/rushed contact 0/2, deterministic without random draws. Drive/lob launches unchanged. Full suite 50 passes; lint 29 files, zero defects. Pure solve tests are ideal contact constructions, not a human gameplay success rate.
TASK-45: projection regression -> green over 30 viewport/lateral configurations, complete floor and legal wall envelope inside horizontal 0.90 / vertical 0.68 NDC margins. Full suite 51 passes, lint 30 files/zero defects. Whole-court live framing visual gate pending.

## Review repair — serve movement
The independent reviewer reproduced a frozen crowded setup despite target correction. Replaced teleporting test setup with actual engine physics ticks: red before fix. Service stance now advances normal actor locomotion; crowded setup and wrong-box corrections for both roles/sides reach a stable legal toss without awarding a point. Removed the shared fixture dependency on PointPresentation so TASK-43 tests are standalone. Focused serve/presentation tests pass.

## Review repair — volley intent and lane preservation
New regressions failed for strong explicit drop/drive/lob/kill aim, blocked cross-lane assistance, and queued-contact payload. Selected families now take precedence over gesture heuristics. Immediate and planned volley drops share lane-aware corner selection; queued input retains the accepted corner through scheduled contact. Focused nine-case volley suite passes.

Review repair: inherited AI winner margins are cleared for either human spectator nudge path and require explicit AI execution in the solver. New regression failed on a random draw before the fix and now passes with identical deterministic human velocities.

## Review repair — replay isolation and restart
Live Replay control no longer replaces the ball with the canned nick demonstration. It explains the automatic recorded replay; the legacy replay URL opens the separate skills demonstration. Showcase/intro/lab resets cancel pending point presentation. Two regressions failed before repair; eight presentation cases pass, including score-once continuation for nick/tin/out/second-bounce reasons.

Full-suite follow-up: two original random-source fixtures lacked the newly explicit AI ownership on winner-margin inputs. Added aiExecution:true to those AI cases, preserving every existing random-draw assertion (3 and 4). Human non-random regression remains separate. Architecture wording now distinguishes ideal solving from actual human execution and names all six entities.

Review repair: replay recording now tracks hitter/stroke-count changes and retains 0.6 seconds of precontact preparation through the aftermath. A slow final-shot test failed against the fixed2.5s cutoff and passes after repair. This preserves winning lob strokes within the bounded300frame recording.

## Independent review closure and rendered evidence
The fresh reviewer accepted TASK-40 through TASK-45 at d8ad00d; no outstanding source/deterministic findings. Reviewer repeated the three real-physics winning lobs: point durations3.067/3.117/2.808s; replay starts0.592s before the final strike; retained157/157/148 frames. Same-frame stroke observation also passed. Full suite60/60, zero skipped. Lint30files/zero defects; CodeGraph current, SQLite integrity ok.

Local Chromium observation (temporary developer diagnostics removed by reload):
- Actual continuous AI match committed rear volleys at z4.708/y1.994 with zero floor bounces, both drive and drop; midcourt drop at z1.626/y.824. Captured local-ai-rally.json includes ordinary bounced shots and real POINT_SETTLE -> POINT_REPLAY -> SERVE_STANCE sequences, including a nick finish.
- Controlled early native keyboard2 input committed through actual StrokeMotion with zero bounces, input shotType drop / aiExecution false, cross-court vx -7.343. local-human-key2.json records the scheduled commit. This verifies input/contact plumbing, not a population success rate.
- Controlled wrong-side overlapping setup displayed WAIT — SERVICE POSITION and Server, use the right box. Ordinary physics ticks separated the players and entered SERVE_TOSS after203 ticks with score0–0 unchanged (local-serve-correction.json/png).
- A fresh2 key during recorded replay and a click on the Drop chip during settle both restored SERVE_STANCE with no pending shot/serve/nudge. Full key/up/click swallowing has complementary deterministic tests.
- local-recorded-replay.png shows the actual recorded ball and actor poses with cinematic camera. local-restored-court.png and local-portrait-court.png show the restored full court, portrait390x844 included.
- Browser error log was empty during the checked local run. Physical devices, phone/webcam tracking and human difficulty/feel were not inferred from these browser checks.

## Production release — 1.2.77322
Built once with npm --ignore-scripts run build using Vite7.3.7, source d6865a34797096066b9bda9a01599723de394129, stamp2026-10-22T03:22:15.544Z. Existing dist backed up outside deployment at E:/devProjects/_snapshots/squash-arcade-pre-release-20261021-smart-volleys. Build completed; static styles.css copied from public and served successfully despite Vite's unchanged-runtime-link warning; bundle-size advisory remains.

Deployed through E:/DevTools/surge-robin/surge-deploy.mjs to https://squash-arcade.surge.sh with --no-dns. No unrelated DNS changes. Downloaded all18 published files (excluding generated CNAME) and compared binary SHA256:18/18 match, zero mismatches (deployed-byte-parity.json).

Public browser visibly reports v1.2.77322. Actual AI match recorded airborne drives/drops, ordinary bounced attacks, and repeated settle/replay/serve transitions (production-runtime.json). Production desktop and390x844 portrait screenshots show the entire court; no JavaScript errors were captured during the checked run. Temporary runtime probes were removed by reload and viewport override reset. This is browser/runtime evidence, not physical-device or player-feel acceptance.

All completed changes are pushed as coherent checkpoints on codex/smart-volleys. The implementation worktree and original pre-sync backup are retained for rollback. Original main remains the synced baseline7b1df9b; the release work is published on the named branch.
