# Clear-court arcade briefing demonstration — 2026-10-25

Requirements HUD-1/2 and BRIEF-1/2/3 are defined before implementation in architecture v2.7.0. Execute this continuous journey in the completed browser application, recording the screen and named stills under DOCS/VERIFICATION/arcade-briefing/. Evidence must distinguish observed screen/motion/speech from device actions unavailable on this host.

| Scene | Entry / actions / carried state | Required observations |
|---|---|---|
| A | Fresh desktop showcase; enable Sound; let AI play, then wait for the first briefing | HUD-1: settings absent from floor, red identity and upper continuum, shot chips. BRIEF-1/2: placement card after initial gameplay, rally/score continue underneath without replacing captions/narration. Record placement still and narration interval. |
| B | Continue automatically through phone then camera chapters | BRIEF-3: close-up fold closes and flies to hand, pullback and corresponding screen swing; camera field/pose/full body and mirrored screen swing. Captions stay readable, chapter only advances after narration/read time. Card closes to uninterrupted court. |
| C | Open hamburger; inspect settings and each of the three equal play entries; open Phone guide explicitly | HUD-1/2 and BRIEF-1: original controls reachable, menu scroll; focused requested guide stays open. Static relay limitation shown without failing polling, keyboard alternative. Next/Back/Close stay accessible and restore focus. |
| D | Open Camera guide; start camera; observe real permission/device outcome | HUD-2: permission only on action, successful acquisition starts play; unavailable/denied camera stays in guide with retry and keyboard alternative. Inspect front/back/handedness access. Physical pose acceptance remains unobserved without camera/person. |
| E | Start keyboard match with existing setup; perform chip/key shot and return to showcase | HUD-2: red controlled, match starts through ceremony, existing chips/highlighting retained. BRIEF-1/2: no auto briefing in human match, ordinary referee resumes; no stale speech/caption after closing guide or starting. |
| F | Resize same app to 390×844 portrait then 844×390 landscape; cycle cameras via menu and reopen each guide | HUD-1 and BRIEF-3: court floor clear, upper information compact, readable card/diagram/actions, no horizontal clipping; short screens scroll. Enable reduced motion: diagrams remain instructive and text/navigation usable without animated travel. |
| G | Keyboard Tab/Shift-Tab/Escape through requested briefing; switch tab away/back during automatic briefing; mute/unmute and close/reopen | BRIEF-1/2/3: focus contained/restored, no behind-card shots or replay skips, hidden-tab progression paused, no old speech resumes after close, normal announcements resume. |

Delivery: build only to run/deliver, commit/push source and release, publish to squash-arcade.surge.sh, compare served release metadata and assets, repeat the visible entry/menu/briefing on public URL. Log unobserved speech/device/recording portions explicitly. Existing tasks 50/51 and native/billing work remain queued, outside this increment.

# Historical smart volleys release rubric

Each row is independently evaluated; implementation, fresh review, rendered observation and operator feel are distinct. No inference from build success to gameplay.

| Entity | Deterministic evidence | Rendered evidence |
|---|---|---|
| TASK-40 | Seeded real-physics nick rate versus exact baseline; human/drive/lob invariance; random samples once | Observe variety and occasional imperfect attacking placements over an AI rally sample |
| TASK-41 | Reachable front/mid/rear and mirrored volley/drop; unreachable/high/blocked balls denied; age and human buffer; bounce timing retained | AI interception anywhere court, rear volley drop, early human 2 drop, cross placement; side-on step/contact retained |
| TASK-42 | Recorded state playback, bounded settle/replay, no duplicate scoring, all terminal reasons, key/pointer skip and reset | Actual terminal shot shown again; nick roll/out/tin land/dribble; orbit tracks event; any key/tap skips without firing serve/HUD; match result after replay |
| TASK-43 | Both roles/sides, arrival/stability, crowding correction without point, legal receiver positions, contact guard, stale tokens | Wrong-side crowded setup halted and announced, players separate before toss; correct service side after handout |

| TASK-44 | Deterministic real-contact attack precision, perfect versus stretched physics outcomes, no human random draws; drive/lob unchanged | Mistimed killer attempt leaves a retrievable ball; balanced sweet contact remains rewarding |
| TASK-45 | Whole-court envelope projection at desktop/mobile aspects and lateral extremes | All court boundaries visible in normal play, resize and after replay |

Release evidence: all baseline plus new tests, lint, fresh whole-branch review, versioned build; pushed commits; exact Surge file hashes; public desktop/mobile-width UI and gameplay. Physical-device and human feel remain operator evaluation unless directly observed.
