# Gameplay follow-up — 2026-10-22

Baseline: deployed 1.2.77322 / 178584f. Scope: actor-relative backhands, service-box reception and rearward-facing replay openings. No automated tests were added or run, per the operator's instruction.

## TASK-46 — Stroke orientation

Live browser tracing on the previous release caught the racket controller replacing an explicitly requested forehand with a backhand on the left half of court (actor x=-2.799, ball x=-2.801). Source inspection showed that court-half anticipation overrode the engine's actor-relative side selection. The correction honours explicit sides and leaves automatic selection available when no side is supplied.

The rendered rig's eye geometry is on local +Z, confirming that PI, not zero, faces the front wall. Locomotion now shares that convention and leaves an active stroke's yaw in charge. Ordinary tracking uses a positive atan2 denominator so crossing the actor's x coordinate no longer jumps by about 100 degrees. Scheduled contact, foot planting, ball reach and shot construction are unchanged.

Browser observation and release evidence are appended as each change is completed. These observations do not assert every possible rally or replace the user's feel evaluation.

Observed a live corrected backhand at actor (-0.826, -0.305), ball (-1.786, -0.058), root yaw 4.129 radians during approach to contact. The torso faced the left-side ball and opened toward the front wall. No explicit-side overrides occurred in this observed passage. Screenshot: backhand-followup.png.

## TASK-47 � Live reception timing

Approach timing now subtracts shot age, ignores passed samples and follows the remaining first-bounce trajectory. With no remaining prediction, the receiver closes on the live ball. Both AI roles and human automatic movement share this correction. Existing back-wall rebound branches and patience gates are unchanged. In the running browser, blue made repeated real one-bounce returns, including at x=-2.712, z=0.001 (height 0.294 m, shot age 1.042 s), near the short line; other recorded bounced returns covered both sides of front/mid court. This observation does not establish that every service-box miss is eliminated.
