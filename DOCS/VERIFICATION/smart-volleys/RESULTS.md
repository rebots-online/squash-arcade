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
