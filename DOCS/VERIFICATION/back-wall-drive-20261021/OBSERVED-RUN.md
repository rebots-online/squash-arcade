# TASK-34 controlled live-game observation

Observed at 2026-10-21T11:29:46.397112+00:00 on msi4090, Chromium at http://localhost:3000.
Source implementation: `6f670c906eed638fbd922fe90fa1d9d35dc64d72`; checkout record at execution: `e3f4ae891909f04200cd0fb3f6a909129c837177`.

**Acceptance remains INCOMPLETE—pending-operator. BW34-R1 passes within the controlled integration scope below; BW34-R2 remains OPEN. This is not a SHIP-READY release verdict.**

## Driver and evidence provenance

A separate isolated browser context ran the actual application and renderer. The test seeded a once-bounced incoming ball at `(2.8, 0.25, 4.5)` with velocity `(0, -0.15, 7)`, then let the live game advance through its back-glass collision and sit-up. The normal `_handleUserSwingInput` handler was called only after the ball descended to 0.2646 m at z=3.9596 m. This exercised `_attemptPlayerRallyStrike`, the installed ShotController, the live ball object, collision handling, rules, actor animation and rendering.

The engine's ordinary animation-loop physics was paused to permit controlled stepping of its real `_stepPhysics(1/120)` path. Multiplayer mode kept P2 manual; auto-T movement was disabled so the human actor remained outside the incoming ball path. A collision observer delegated every call to the original handler. BallPhysics, ShotController, rules and their outcomes were not patched or mocked. The seeded scenario, paused scheduling and programmatic input are fixture controls, not a free-play or human timing test. No production source or player session was changed by this harness.

MediaRecorder captured the rendered game canvas, composited with stage/time/position annotations. Playback is slowed to show the sequence and does not establish performance. The final capture includes a held last frame after the next back-glass impact. Initial recordings were repeated to flush that last frame before stopping the recorder. Contact sheets and endpoint images are decoded from these recordings; full-page PNGs show the live UI frozen at that endpoint. Raw positions/events and every fixed-step sample are in `runtime-observations.json`.

## Direct semantic observation

I inspected the chronological rendered contact sheets and endpoint frames. The incoming ball comes off the rear glass, rises, and then falls before the player swings. In both sequences, the returned ball travels to the front wall, drops into the rear court, then rises only slightly into the back glass. The cross-court sequence visibly traverses to the opposite side, contacts the side wall, and returns toward the rear court. The ending UI identifies `OFF-BACK-WALL DRIVE` and `OFF-BACK-WALL CROSS`. The rendered ball is low near the court floor at the next glass contact; neither run ends the rally as an out. Event measurements below support this observation, rather than replacing it.

| ID | Result | Observed evidence |
| :--- | :--- | :--- |
| BW34-R1 straight | PASS, controlled live integration | `straight-late.webm`, `straight-sequence.jpg`, `straight-back-glass.jpg`, `straight-live-glass.png`. Contact y=0.2646 m while descending; front-wall impact y=0.9748 m; first floor contact z=3.7855 m; later glass impact y=0.2082 m. Final phase RALLY; no tin/out collision. |
| BW34-R1 cross | PASS, controlled live integration | `cross-late.webm`, `cross-sequence.jpg`, `cross-back-glass.jpg`, `cross-live-glass.png`. Same descending contact; front impact x=-2.4221 m, y=1.2756 m; left side-wall contact; first floor contact z=3.7780 m; later glass impact y=0.2883 m. Final phase RALLY; no tin/out collision. |
| BW34-R2 | OPEN — OPERATOR | Robin must compare earlier versus delayed low back-wall contacts through normal controls and confirm that the later good contact feels usable rather than excessively lifted/bouncy. No operator acceptance has been received. |

Public sites were not redeployed. The separately observed intermittent AI-rally diagnostic remains unresolved; these two controlled returns do not certify that lane repaired.

## Artifact integrity

| File | SHA-256 |
| :--- | :--- |
| `cross-back-glass.jpg` | `3b8984192e4fcaaab23cbab74c4460e8f19f900adbf77548d839fcc651d47680` |
| `cross-late.webm` | `e6b0a998bf811a86e61251f1712c9ce74569a8f8dedc9b9c2b6202ca61110f6c` |
| `cross-live-glass.png` | `d246d9363fd140a97e26dafad1ab0ecb4c3b878a46d5659e16f6518cad97c1ef` |
| `cross-sequence.jpg` | `aaa3cfcd28be45300f6d086eb31e6a31d259c00bdbdba84b300af3e293d68977` |
| `runtime-observations.json` | `e287a16e740ac60130bf39e59ce917afc42754bb6f7e1b9a12cd17cd1ebbd627` |
| `straight-back-glass.jpg` | `66e59cdd53f3a3c706949da66e553be29d3b465dfada1065a5d330e458c4f155` |
| `straight-late.webm` | `444bb1e072703db5ec5a710eddb07a09628e3c6c9ffbc43d7021da569a749bda` |
| `straight-live-glass.png` | `e1fcda7a10709efa05d9775cfe2099390a8ecaff03b6ac9cb3447cb949302191` |
| `straight-sequence.jpg` | `9905f1a81161ce2bad9947b6ad178f97210c429571bb0563a9eacf7e0fd7fc03` |

## Attestation

Codex, msi4090, 2026-10-21T11:29:46.397112+00:00: I grant BW34-R1's two controlled-integration PASS results on direct inspection of the cited rendered sequences and endpoint frames, with the raw live-engine event data as supporting evidence. I do not grant BW34-R2, human input timing/feel acceptance, unrestricted gameplay acceptance, performance acceptance, or a SHIP-READY verdict.
