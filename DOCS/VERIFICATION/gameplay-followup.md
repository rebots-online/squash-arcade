# Gameplay follow-up — 2026-10-22

Baseline: deployed 1.2.77322 / 178584f. Scope: actor-relative backhands, service-box reception and rearward-facing replay openings. No automated tests were added or run, per the operator's instruction.

## TASK-46 — Stroke orientation

Live browser tracing on the previous release caught the racket controller replacing an explicitly requested forehand with a backhand on the left half of court (actor x=-2.799, ball x=-2.801). Source inspection showed that court-half anticipation overrode the engine's actor-relative side selection. The correction honours explicit sides and leaves automatic selection available when no side is supplied.

The rendered rig's eye geometry is on local +Z, confirming that PI, not zero, faces the front wall. Locomotion now shares that convention and leaves an active stroke's yaw in charge. Ordinary tracking uses a positive atan2 denominator so crossing the actor's x coordinate no longer jumps by about 100 degrees. Scheduled contact, foot planting, ball reach and shot construction are unchanged.

Browser observation and release evidence are appended as each change is completed. These observations do not assert every possible rally or replace the user's feel evaluation.

Observed a live corrected backhand at actor (-0.826, -0.305), ball (-1.786, -0.058), root yaw 4.129 radians during approach to contact. The torso faced the left-side ball and opened toward the front wall. No explicit-side overrides occurred in this observed passage. Screenshot: backhand-followup.png.

## TASK-47 — Live reception timing

Approach timing now subtracts shot age, ignores passed samples and follows the remaining first-bounce trajectory. With no remaining prediction, the receiver closes on the live ball. Both AI roles and human automatic movement share this correction. Existing back-wall rebound branches and patience gates are unchanged. In the running browser, blue made repeated real one-bounce returns, including at x=-2.712, z=0.001 (height 0.294 m, shot age 1.042 s), near the short line; other recorded bounced returns covered both sides of front/mid court. This observation does not establish that every service-box miss is eliminated.

## TASK-48 — Rearward replay and corner notification

Observed a live replay opening from z=-10.776 looking rearward at the decisive event z=-2.835, with both actors and the approaching ball visible. The front wall was transparent and the tin temporarily hidden from this outside-front viewpoint. The central replay banner was replaced by the small bordered upper-right toast. Every opening is clamped to the front-wall side before orbiting and zooming, including rear-court events. The existing replay exit snaps back to the selected gameplay camera; wall/tin visibility is restored by the same camera path.

## TASK-49 — Red ownership and visible shot choice

Observed YOU printed on the red jersey during a close front-facing replay, with both front/back marking meshes attached to the torso. The scoreboard reads YOU / RED; spectator controls say YOU influence RED, and switching to solo changes this to YOU play RED. A real red volley side-front boast selected the Boast chip. During the subsequent blue return, the red choice text and Boast highlight remained identical before and after blue contact. Planned volley changes and actual contact share a decision token: a new family or decision blinks once, then remains highlighted; display never writes the selected human input. Reduced-motion skips the blink.
Additional reception correction: a failed scheduled contact previously cancelled its pose but retained the remaining 0.50-second swing cooldown. The engine now clears that cancelled cooldown only while the incoming ball remains legal and unhit; every retry still requires a new scheduled stroke and the existing reach/front-wall/bounce checks. Successful contacts retain their cooldown. This is source-path diagnosis; it is not a claim that every reported miss was reproduced.

Public high-out observation found that aiming at the 4.858 m fault height framed too much sky. The replay aim height is now bounded to 1.5 m, and the opening is centred laterally before the orbit tightens on the event. This retains the players and falling ball in the composition.
## Release

Deployed 1.4.77369 to https://squash-arcade.surge.sh on 2026-10-22. Build source: 73023a04fa2516e6f2158aa194b65fe257bc324c. The public browser displayed that version and the new red-player controls. The served index-BoHz0TQq.js bytes matched the local production bundle. The final public replay screenshot is followup-live-replay.png: front-to-back opening, visible YOU jersey, persistent red shot chip and corner replay notice. Temporary browser observation hooks were removed by reload. No automated tests were added or run. Production build completed; source changes were pushed to master in separate coherent commits.

## TASK-52 — Backward facing after replay

Reproduced on deployed 1.4.77369 during a live rally: both players faced the rear wall while the incoming ball was ahead. Red root Euler rotation was `[-PI, 3.294243, -PI]`, blue `[-PI, 3.061503, -PI]`. Replay restores recorded quaternions; Three.js can express those equivalent rotations with nonzero Euler X/Z components. Gameplay subsequently assigned only `.rotation.y`, retaining X/Z and reversing the intended facing. Root yaw alone therefore looked plausible in the previous diagnostic, while the composed rendered pose was wrong.

In the same frozen rally, replacing each root rotation with `(0, existingYaw, 0)` and rendering again visibly turned both characters back toward the ball. The blue head forward vector changed from approximately `[-0.133, 0.316, +0.939]` to `[+0.282, 0.316, -0.906]`. No ball, player position, contact or shot choice was changed. The public tab was reloaded afterward to remove the temporary observation hooks and pause.

The implementation applies complete yaw-only rotations at all gameplay-facing writes in setup, serve/showcase placement, locomotion, active stroke/recovery and ready pose. Replay quaternion interpolation and articulated local animation remain unchanged. Local live observation included natural replay completion into another rally and both players' forehands/backhands, with root X/Z remaining zero outside replay. No automated tests were added or run. Release and skip observations follow below.
