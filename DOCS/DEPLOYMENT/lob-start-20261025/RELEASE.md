# v1.12.83046 — rear-corner lobs and immediate match entry

- Source commit: 038cb76e11a9fe7c388bf88db73267e0fd725221.
- Generated release commit: 2ab08806835b50e3618f4e2a8ad4954e4de3c531.
- Both pushed to origin/codex/multiplatform-monorepo, live refs verified with git ls-remote. Fast-forward pull before deployment reported Already up to date.
- Built at 2026-10-26T02:46:22.275Z using stamp-build, download-assets and Vite build; exit 0. Build retains known warnings about public CSS resolved at runtime and a large JS chunk. Generated Three.js shader strings report whitespace in git diff --check; authored source check was clean. No generated shader strings were rewritten.
- Surge revision 1792982805785, https://squash-arcade.surge.sh, deployment command node E:/DevTools/surge-robin/surge-deploy.mjs ./dist squash-arcade.surge.sh succeeded.
- [Public SHA-256 readback](public-hashes.json): 21/21 files match, excluding CNAME. Metadata carries the exact source commit above.
- Public desktop and 390×844 portrait show START MATCH without scrolling/opening a menu. Menu also begins with START MATCH. Public settings show racquet spin unchecked by default. The real public quick-start click produced SERVE_STANCE, server=player, racketSpin=false.
- [Public narration and start state](../../VERIFICATION/lob-start-20261025/public-entry-audio.json): requested -> playing -> ended, duration 4.493605 seconds, no error. The clip says exactly: The user is always represented in the game as the red player. Browser playback is observed; physical speaker listening is not claimed.
- Screenshots: [desktop entry](../../VERIFICATION/lob-start-20261025/public-start-desktop.png), [phone-width entry](../../VERIFICATION/lob-start-20261025/public-start-mobile.png), [red service](../../VERIFICATION/lob-start-20261025/public-red-first-serve.png), [menu start](../../VERIFICATION/lob-start-20261025/public-menu-start-first.png).
- Lob physics and rendered flight evidence: [gameplay follow-up](../../VERIFICATION/gameplay-followup.md). No automated tests were added or run under the current operator override. TASK-61/62 [X] records implementation and focused runtime evidence, not independent semantic acceptance or exhaustive rally/device evaluation.
- Prior dist, including its pre-existing untracked files, is retained locally outside the published directory as prior-dist-v1.11.82396.zip (19,988,099 bytes). This rollback archive is intentionally local; the prior tracked release remains in Git.
- The deployment wrapper's optional squash-arcade.robin.mba DNS mirror update failed because NAMECHEAP_API_USER / NAMECHEAP_API_KEY were unavailable. Surge deployment/public readback succeeded. No DNS credentials or settings were changed.
