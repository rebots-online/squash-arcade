---
title: Squash Arcade shot and swing corrections
conversation_id: 01a15e0e-0b4c-7153-a123-1887270a7760
created_at_utc: 2026-10-21T22:23:18Z
updated_at_utc: 2026-10-21T23:54:00Z
file_computer: msi4090
file_absolute_path: /home/robin/Desktop/DevProjects/squash-arcade/DOCS/TASK_LIST.md
authority_revision: 64a77201a3edfc3f8f6d13e89caf32b5978087b75231ed5c5f7f7d075b4f136a
scope_locations:
  arcade: msi4090:/home/robin/Desktop/DevProjects/squash-arcade
---

# TASK LIST

⚪ Squash Arcade — original repository only
  🟢 Robin to judge revised shot feel and the clarity of the conventional side-on step-through

Implementation tasks35–39 and controlled runtime observations are recorded in CHECKLIST.md and DOCS/VERIFICATION/shot-shape-step-20261021/OBSERVED-RUN.md. The29 regression tests, lint, repeated15/15 diagnostic and four inspected live stroke recordings passed. The requested evaluation deployment is complete: https://squash-arcade.surge.sh serves v1.1.77110;18/18 public files hash-match; bottom-right badge inspected on desktop/mobile and Play Match entered through the real UI. Evidence: DOCS/DEPLOYMENT/surge-20261021-v1.1.77110/. Gameplay acceptance is INCOMPLETE—pending-operator; native acceptance is outside scope. Mandatory turn archive/correction is KStore-mediated; the earlier failed retired task_event call was misclassified and is not a separate required ledger.

## Decisions and constraints

- 2026-10-21T22:23:18Z: Scope is the original Arcade repository only. Robin excluded the separate Tauri repository from all further access and changes.
- 2026-10-21T22:23:18Z: Fresh origin fetch and `git merge --ff-only origin/main` reported already up to date at `284c982`. CodeGraph was reverified after synchronization. Recheck remote and local changes at turn/task boundaries and before edits/commits.
- 2026-10-21T22:23:18Z: The prior flat-return demonstration does not satisfy Robin's desired shape. Preserve its historical evidence, but supersede its trajectory criteria for the next correction.
- 2026-10-21T22:23:18Z: Drive intent is a softer arcing length shot contacting just above the front-wall middle/service line and falling between the service box and rear glass. Boast intent is a soft dying side-wall/nick finish. Both need visible body-driven stroke sequencing; source and numeric assertions alone do not establish acceptance.
- 2026-10-21T23:48:00Z: Robin authorized deploy to squash-arcade.surge.sh for evaluation and required the bottom-right version/build display. Build stamp and served metadata must agree. Robin also corrected the archive terminology: KStore-mediated mandatory turn archive/correction, not a separate central ledger.
- 2026-10-21T23:54:00Z: Surge published revision1792626656613, v1.1.77110. All18 served files match build hashes; desktop/mobile badge visibly matches, with no overlapping controls; public Play Match opens the racket-spin ceremony. Robin can now evaluate the corrected strokes on the public site.

This ledger records remaining work and decisions. It does not substitute for an implementation contract or verified runtime evidence.
