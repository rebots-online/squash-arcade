# Softer shots and visible stroke sequence — original Arcade

Observed on msi4090, 2026-10-21, Chromium at http://localhost:3000. Source checkpoint: `39d98444fc65db9aa973d832ad287f53a5d7818d`, comprising the motion implementation `ff1fd71`, trajectory correction `0bc27f2`, and contact-pose correction `39d9844`. Arcade's own origin was fetched/merged before architecture and again at publication boundaries. The separate Tauri repository was excluded from all current work.

Implementation and the controlled runtime observations below are verified. Overall acceptance is **INCOMPLETE—pending-operator**: Robin has not yet judged the revised timing/feel or pedagogical clarity. No public deployment or native-platform acceptance is asserted.

## Live observation driver and limits

`capture-driver.js` is the exact final browser observation function. It seeds a once-bounced incoming ball at `(±2.8,.25,4.5)`, velocity `(0,-.15,7)`, spin `(14,0,0)`, incoming hitter opponent. Initial human position is `(±1.9,0,3.4)`. **Normal automatic approach is enabled**. P2 is manual to isolate the returned shot. The ball then follows the actual engine's fixed physics, collision handling, rules, locomotion, racket/body animation and VFX update paths. Production physics and rules are not mocked or changed. The collision observer delegates to the original method.

The ordinary loop is paused for controlled stepping of `_stepPhysics(1/120)` and rendering. At t=.525 the driver requests a stroke through `_attemptPlayerRallyStrike`, after the live ball rebounds off the back glass and descends below .4m. Incoming motion continues until actual contact t=.608333; its height falls from the request height to **.166533m**. The request does not launch the outgoing shot. This is a controlled programmatic input sequence, not an operator timing trial.

Each recording contains a full-court view and a second camera of the same live frame for body/feet. Pixel ratio1 controls recording cost, not game physics. Final capture advances normal VFX as well as body/ball rendering. Earlier framing attempts and the first contact-gap inspection remain in the task's Admin-Manual staging backup; final artifacts here supersede them. Review clips preserve frame order with a documented playback time transform; raw WebM and per-step JSON are retained. This does not certify rendering performance.

## Direct rendered observations

I inspected the chronological contact sheets, complete shot sheets and endpoint frames from these recordings. The receiver approaches the back-wall return while turning side-on toward its side wall. The opposite foot lifts, travels and plants while the body rotates through the stroke; the follow-through opens the body and recovery continues toward the T. The hand remains with the racket. The ball keeps moving during preparation and leaves from the racket contact area, rather than jumping to a raised contact position.

The drive arcs to a front contact visibly above the middle/service line, then drops in the rear quarter before the next back-glass contact. The cross drive traverses to the opposite rear quarter; its first side-wall contact occurs **after** floor and back glass. The actual boast hits near side, front, then the opposite front-court nick. Both mirrored boasts end at a true nick under the ordinary rules; the live rules award the point at that event, so no later live second-bounce/apex is claimed. Those subsequent physics properties are covered separately by the numerical suite.

| Observation ID | Result and direct artifact | Supporting live measurement |
| :--- | :--- | :--- |
| BW35-R1 | PASS — controlled forehand straight drive; `forehand-drive.webm`, matching contact/sequence sheets and endpoint PNG | Front y2.051582; first floor `(2.8,0,3.836861)`; later glass y.378747; no out/tin. |
| BW35-R2 | PASS — controlled backhand cross drive; `backhand-cross.webm` and matching images | Front y2.049773; first floor `(2.809072,0,3.830451)`; later glass y.382836. No side wall before floor. |
| BW36-R1 | PASS — controlled mirrored side-front boasts; `forehand-boast.webm`, `backhand-boast.webm` and matching images | Side at t.65, front y.777003 at t1.583333, opposite true nick `(∓3.140323,0,-3.501708)` at t1.766667; phase POINT_OVER. |
| BW37-R1 | PASS — controlled rendered FH/BH step and contact; all four contact sheets and clips | Left lead for right-handed FH; right lead for BH. Lead foot travels .28m toward front, lifts .09866m; loading support drift about .00362m including contact release. Largest actor displacement per1/120step .04874m. Contact yaw about55deg from forward. After normal impact VFX, ball is .05222m from racket center, within the string-bed area. The earlier pre-VFX pose inspection aligned centers below1e-12m; that is not the final rendered measurement. |
| BW37-R2 | PASS — bounded live engine AI scheduling compatibility | Separate unmodified spectator loop:31/31 observed scheduled commits succeed over80.351 simulation seconds;6 points recorded; multi-stroke rallies. Raw `live-ai-observations.json`. This is not general AI-quality acceptance. |
| BW35/36/37-OP | OPEN — OPERATOR | Robin to judge revised drive softness/length, dying boast and visible conventional step-through using the clips and normal game controls. No operator acceptance is inferred. |

## Implementation checks

Final integrated command: `node --test tests/diagnostic-randomness.test.mjs tests/back-wall-drive.test.mjs tests/side-front-boast.test.mjs tests/stroke-motion.test.mjs` — **29 passed,0 failed**. This includes1440 drive trajectories,72 mirrored boast trajectories,12 additional very low contacts, charge/identity/mirroring/probe-bound and stroke-timeline/pose regressions, plus random-stream isolation and repeated diagnostics. `npm run lint`: exit0,25 files,0 defects.

Failure history is retained: the existing standalone diagnostics passed15/15 in initial worker verification but returned14/15 in the parent's integrated run (`TEST-SPECTATOR-AI-01`: p2hits1,p1hits0). A20-stream comparison found baseline failures9/10/11 and corrected-shape failures6/9/10/11/17. Raw `diagnostic-baseline-comparison.json` preserves both outcomes. TASK-38 was then implemented in `6655cb47bfa2bb6a091bccec0a3aaf4a0035de9a`: a local seed1 exchange stream, optional instance random callbacks defaulting to Math.random, original initial states,720steps at1/120 and both-player-hit assertion unchanged. All eight repeated whole-harness runs pass15/15 with identical results and without replacing global Math.random. A fresh loaded-browser diagnostic also reports15/15, exchange p2hits2/p1hits1. This repairs reproducibility of this invariant scenario; it does not certify every random tactical exchange or convert the20-stream failures into successes. The live recordings/AI observation were captured before the callback-only diagnostic change; ordinary gameplay keeps the same random source and tactics.

Source/runtime fingerprints were compared directly (Node and loaded browser methods match):

| Method | SHA-256 of method source |
| :--- | :--- |
| `ShotTrajectorySolver._solve` | `14e60b875e827e668e886281a340db499b513997551012a2e9898453ddd2a81e` |
| `StrokeMotion.applyPose` | `cbba2776fff6ec9acc007136d4af4a8482fbf935e45e882edbdf6a21fc18f01e` |

## Corrections and outstanding limitations

- Initial live pose inspection found an approximately.57m racket/ball gap at low contact after side-on rotation. `39d9844` fixes the reachable racket pose and adds an actual production-racket regression. Actor reach remains1.15m; ball and actor positions are never moved by that pose correction.
- The initial boast test imposed an arbitrary target-depth tolerance. A high central contact produced a true dying nick at z-3.756224 rather than the optimizer's-3.5 target. The explicit architecture/checklist amendment keeps the target but accepts the semantic front-nick zone[-4.3,-2.5], with true nick, low rebound and front-court second bounce. No collision physics or solver was altered for that case.
- The browser console has a404 for `/favicon.ico`; no game-code exception was observed in these pages. This resource gap remains recorded.
- Three central Postgres task-ledger writes were attempted and failed with `No route to host` for192.168.0.249:5432. They are not claimed persisted. Git artifacts/checkpoints and this local provenance record remain available; central ledger synchronization is open.
- Initial default VP9 review conversion was too slow and was stopped; final review clips were regenerated using the realtime encoder after the old converter was terminated. Raw live recordings are unchanged.
- Human timing/feel, arbitrary tuning combinations, native platforms and public deployment remain outside these observations.

## Evidence index and attestation

Each eight-second `*-review.webm` is a time-scaled viewing copy of its raw `*.webm`; frame order and image content are preserved. `*-contact.jpg` shows the first approximately1.05simulationseconds; `*-sequence.jpg` spans the full recording. Endpoint PNGs show the final live frame. `SHA256SUMS` covers raw/derived media, JSON and the driver. The initial full recordings were slowed by controlled frame scheduling; neither raw nor review playback speed is a performance benchmark.

Codex, msi4090, 2026-10-21: controlled runtime PASS rows above are granted after direct inspection of the final chronological rendered contact/shot sheets and endpoint frames, supported by live engine event/body telemetry. They do not replace Robin's open operator review. Source changes and evidence are published in the original Arcade repository only.
