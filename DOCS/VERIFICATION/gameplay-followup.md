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

The observed passage included ten natural replay returns and one manual skip held at the replay opening. Pressing Space at that opening returned to SERVE_STANCE with both root rotations exactly `[0, PI, 0]`; the match then resumed. Both actors' forehands/backhands appeared in the observed contact poses, and the observation trace contained no nonzero root X/Z components outside replay. Temporary local observation hooks were discarded with the preview tab. These are focused live observations, not an assertion about all rally behaviour.

Published 1.5.77385 to https://squash-arcade.surge.sh from source commit 99aa48e41bec3495306b58c8b2e1c2b3a2f39fcd. The production build completed. Downloaded index.html, deployment.json and assets/index-DzLcnnWJ.js matched local bytes; bundle SHA-256 is `1dfa23bb589273f013f00dd63054a4d142790f2d0374ef01dc70691611bea879`. The public browser displayed v1.5.77385 and a subsequent rally had both actor roots in the canonical yaw-only form. Screenshot: facing-replay-fix-live.png. TASK-50/51 remain unimplemented queue items. No automated tests were added or run.

## TASK-53/54 — Mobile visibility and replay tin

The supplied phone screenshots showed the first-load setup covering the court, competing top controls squeezing the portraits, and the YOU label clipped inside its avatar. The default boot path omitted the mobile collapse used by return-to-menu. Initial HTML now starts collapsed, with the engine explicitly expanding desktop only. Compact layouts reserve the top bar for avatars, score, an unclipped YOU / RED label and one Menu control. Menu expansion/collapse does not call match reset or change control mode. Camera/replay/tuning/handedness remain reachable through menu actions; the existing setup retains its other controls. The sound-unlock button is compact. Short landscape viewports use a single lower strip for red's choice and shot controls, leaving secondary controls in the menu.

Observed fresh loads at 390x844 and 712x697 CSS pixels: setup was rolled up and only Menu remained among top-bar buttons. Both avatars, score and YOU / RED were visibly separate. Observed explicit expansion, complete roll-up and Tune Lab opening via the menu; the ongoing score/control mode remained in place. Inspected 844x390 landscape spacing. These are browser viewport observations, not physical-device acceptance. No automated tests were added or run.

Replay camera setup previously set both tin meshes invisible. The camera now delegates material treatment to CourtGeometry: visible darker tin panel at opacity 0.32 and red strip at 0.72 through the front wall; normal panel opacity 1 and strip 0.9 on exit. Scene depth testing and physical tin height are unchanged. A live rearward-facing replay opening had both meshes visible with those transparency values; manual skip restored normal values. Further visual/release observations follow below.

A natural front-court replay focused at approximately (-3.2, 0.044, -3.620). Its opening visibly retained the red tin boundary and a darker translucent panel below it, with the ball and players visible beyond. Screenshots: mobile-tin-replay-dark.png and mobile-tin-replay-light.png. The light-court image is the same paused replay frame with a temporary diagnostic theme change; the page was reloaded afterward to discard that change and all observation hooks. Tin height remained 0.48 m. A final 1280x720 desktop observation showed the setup expanded and the regular desktop controls retained; the compact Menu button was hidden as intended.

Published 1.6.77400 to https://squash-arcade.surge.sh from source 0157bf5e90a9528c6200d5fcbfb945673d02bed5. Production build completed. Downloaded index.html, deployment.json, styles.css and assets/index-DPoy0t5m.js matched the local production bytes; bundle SHA-256 is e50e6fc88b008acee95aeb3503ce0e77a788a3ea8b313bd5402874d376497d6b. The public page displayed v1.6.77400 at 390x844, with setup collapsed/hidden, only Menu among top-bar buttons, and the YOU / RED label outside the portrait. Screenshot: mobile-hud-live.png. Browser size was restored and temporary preview closed afterward. TASK-53/54 are implemented and deployed; physical-device and independent acceptance remain separate. No automated tests were added or run. Previous dist was preserved in E:/devProjects/_snapshots/squash-arcade-before-mobile-hud-20261022/dist.

## TASK-55 — Denied let speech matches the ruling

The point callout formatter treated any reason containing "let" as "Yes, let!", including the actual NO_LET explanation. Both immediate point and later game/match callouts now receive the authoritative decision metadata and map NO_LET, YES_LET and STROKE before interpreting prose. Text-only callers also recognise denied-let wording first. Source inspection confirmed score composition and the separate genuine-let replay announcement remain unchanged.

Observed a real HUD Let click returning NO_LET, awarding the opponent a point and displaying "No let! Handout, one all." A subsequent focused observation used the existing built-in mid-rally showcase setup, then clicked the normal Let control: score changed from player 2/opponent 0 to player 2/opponent 1, with NO_LET/winner opponent. The isolated SpeechSynthesis.speak request was exactly "No let! Handout, one two." and the banner read "No let! Handout, one-two." Screenshot: no-let-callout.png. An appeal outside a rally produced no ruling speech and did not change score. Speech submission was inspected in the running browser; this is not an acoustic listening or physical-device claim. No automated tests were added or run. Temporary browser observation wrappers are discarded when closing the preview.
