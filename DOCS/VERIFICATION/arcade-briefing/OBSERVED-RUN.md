# Clear court and animated arcade briefings — observed delivery

Date: 2026-10-25. Host: native Windows DESKTOP-CN0GDTR. Browser: Chrome on this host; mobile observations are viewport emulation, not physical-device evidence.

Published URL: https://squash-arcade.surge.sh/

- Version: **1.11.82396**.
- Application source: `61fb7ddb54848528e64152da862a7fc9debbe86d`.
- Release commit: `62e44b144055fd51abf4f8bd4aa0b83c4fc41eab`.
- Build timestamp in public deployment metadata: `2026-10-25T15:56:00.543Z`.
- Surge deployment revision: `1792943813333`.
- Architecture v2.7.0 and rubric were committed before implementation (`58f7165`). No new automated tests or lint runs were used for this increment.

## What was observed

| Requirement / rubric scenes | Actual observation | Evidence / boundary |
|---|---|---|
| HUD-1; A, C, F | Bottom settings/music/motion controls are inside the scrollable hamburger menu. Red ownership and descriptive stroke continuum are above the court. Only the five shot chips and Let remain at the lower edge. | `public-mobile-court.png`, `public-clear-court.png`, `public-three-methods.png`. Final public build at 390×844 and desktop 929×883. |
| HUD-2; C–E | Menu shows equally prominent keyboard/mouse, phone racket and camera choices. Keyboard entry reaches the racket-spin ceremony and serve choice. | Public menu still and direct interaction on v1.11.82396; earlier candidate also reached a live drive serve. No phone or body-tracking success claim. |
| BRIEF-1/3; A, B | Automatic placement, phone and camera cards appear in sequence, then close. AI rallies and scoring continue underneath. During the camera chapter, score changed from 3–1 to 3–2 and the phase changed from rally to point settling while the card retained foreground ownership. | `public-briefing-sequence.webp` and `public-observed-states.json`. 538 captured frames rendered into a 78.706-second silent animation. Sampling/read windows can leave capture gaps; this is not an uninterrupted recording of every rubric scene. |
| BRIEF-3; B, F | Phone schematic shows enlarged foldable closing, moving into the character's hand, pulling back to a body swing matched by the TV figure. Camera schematic shows body/arm joints, viewing field and matching TV movement. | Public sequence; `public-phone-briefing.png`. Candidate `walkthrough.webp` includes responsive/manual views. |
| HUD-2; C | Static deployment displays the missing phone relay explanation and disables pairing. Zero `/api/` resource requests observed through showcase, briefings and keyboard match entry. | Public UI/status and resource entries. Relay-enabled physical pairing was not attempted in this increment. |
| HUD-2; D | Explicit camera start returned unavailable/declined on this host. Guide remained open with Retry and keyboard alternative. Keyboard recovery entered the existing match ceremony and a drive serve. | Candidate browser interaction. No available physical camera/person, so successful pose tracking remains unobserved. |
| BRIEF-1/3; F, G | 390×844 portrait and 844×390 landscape cards fit; short-screen controls remain reachable. Reduced-motion emulation removed animation while preserving instructive diagrams. Tab stays in the guide; Escape closes and restores focus. | `phone-portrait.png`, `camera-landscape.png`, candidate walkthrough. Final public Escape returned focus to the originating shot control. |
| BRIEF-1; E, G | In a human match, H opens a manual guide and sets modal pause. Escape closes it and clears modal pause; controls become available again. AI showcase remains active behind its guide. | Direct public interaction and read-only engine state: spectator false, paused true, briefing true; then paused false, briefing false. |
| BRIEF-2; G | Mute changed the control to Enable sound. Enabling restarted the chapter and returned the control to Mute sound. Narration owner remains reserved during the reading interval. | Final public UI and source/state observation. This is not acoustic verification. |

## Speech and remaining acceptance limits

The narration channel suppresses score/referee speech and invalidates queued callouts while a briefing owns it. Chapter advancement waits for its minimum reading interval and its speech completion callback. The previous introduction paths now use the same priority mechanism.

On this host, actual browser speech requests produced immediate end events without an audible speaking interval, despite available voices, unlocked audio and an active audio context. Temporary event observation was removed afterward. **Audible narration, full spoken delivery and lack of audible interruption remain unverified.** The recorded WebP files have no audio.

The full A–G rubric was not captured as one continuous journey. Hidden-tab pause/resume and an exhaustive sweep of all gameplay cameras were not directly observed in the final run. Physical phone sensors, successful camera tracking and human gameplay feel remain operator/device acceptance. Existing gameplay camera math, physics and AI tactics were not changed by this increment. The continuum is explicitly descriptive; it does not claim to implement early/late shot-direction mapping.

## Publication evidence

Built with `npm --ignore-scripts run build` in the clean smart-volleys worktree and deployed with the existing Surge CLI. These served bytes matched the build artifacts by SHA-256:

| Public artifact | SHA-256 |
|---|---|
| index.html | 82F7BD2B8B6908ADF231935BD6C875AC9A888C4AF561118698B06BA21F6437C0 |
| deployment.json | 42C68270774214AD1BB2BDBDA7756DAAE948A73E9F9285D8C40792F01CBB5F15 |
| court-hud.css | CBB14E4106CFB0940D119CB41F5D8AD568B2DBC4E7FEFA4001F4EFAD2B44875C |
| arcade-briefing.css | D6C003A129EC3BA13F5A8918FBC317177B98E941DBCBF570EDE1FAD1C2EE2A97 |
| assets/index-V8jVp3l-.js | E4ED601D1CC356E90C2741F5648E0B9FD78C9376305D8B0917A835513D4077A5 |

Application and release commits were pushed as completed sections. Documentation/evidence follows separately; public runtime source remains the versioned source commit above. TASK-59/60 are `[X]` implemented with scoped observations, not independently validated `✅`.

## Media

- [Final public mobile court](public-mobile-court.png)
- [Final public three-method menu](public-three-methods.png)
- [Final public phone briefing](public-phone-briefing.png)
- [Final public automatic sequence](public-briefing-sequence.webp)
- [Public observed state samples](public-observed-states.json)
- [Candidate interaction capture](walkthrough.webp) — 396 sampled frames, 99.373 seconds including gaps; silent, not a complete continuous acceptance run.
- [Candidate portrait briefing](phone-portrait.png)
- [Candidate landscape camera briefing](camera-landscape.png)

Raw base64 frame captures remain local and are ignored by Git; the rendered animations and state samples are retained as reviewable evidence.
