# Smart volleys release rubric

Each row is independently evaluated; implementation, fresh review, rendered observation and operator feel are distinct. No inference from build success to gameplay.

| Entity | Deterministic evidence | Rendered evidence |
|---|---|---|
| TASK-40 | Seeded real-physics nick rate versus exact baseline; human/drive/lob invariance; random samples once | Observe variety and occasional imperfect attacking placements over an AI rally sample |
| TASK-41 | Reachable front/mid/rear and mirrored volley/drop; unreachable/high/blocked balls denied; age and human buffer; bounce timing retained | AI interception anywhere court, rear volley drop, early human 2 drop, cross placement; side-on step/contact retained |
| TASK-42 | Recorded state playback, bounded settle/replay, no duplicate scoring, all terminal reasons, key/pointer skip and reset | Actual terminal shot shown again; nick roll/out/tin land/dribble; orbit tracks event; any key/tap skips without firing serve/HUD; match result after replay |
| TASK-43 | Both roles/sides, arrival/stability, crowding correction without point, legal receiver positions, contact guard, stale tokens | Wrong-side crowded setup halted and announced, players separate before toss; correct service side after handout |

Release evidence: all baseline plus new tests, lint, fresh whole-branch review, versioned build; pushed commits; exact Surge file hashes; public desktop/mobile-width UI and gameplay. Physical-device and human feel remain operator evaluation unless directly observed.
