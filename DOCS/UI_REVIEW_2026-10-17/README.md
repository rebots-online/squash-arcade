# Squash Arcade UI proposal — 17 October 2026

This is the preimplementation operator review produced through OpenDesign MCP with GPT-6-Astra. No application implementation is included.

- Open [index.html](index.html) in a browser for the self-contained comparison viewer. It supports nine state selections, before/proposed/side-by-side display, and desktop/portrait/landscape selections where paired captures exist.
- Read [PROPOSAL.md](PROPOSAL.md) for 18 itemized recommendations, three design directions, rationale, tradeoffs, dependencies and acceptance criteria.
- Read [EVIDENCE.md](EVIDENCE.md) for the specialist's observations and limitations, and [INTEGRATOR_VERIFICATION.md](INTEGRATOR_VERIFICATION.md) for parent-side model routing and Git evidence.
- Inspect [media-manifest.json](media-manifest.json) for 30 PNG hashes and dimensions: 13 matched before/after pairs, two extra baseline diagnostic views, one real court crop, and one comparison-viewer capture.

Recommended direction: **Courtside clarity**. Its white interface and quieter controls are a proposal for discussion. The alternative directions are Broadcast minimal and Precision studio. Original court artwork remains visible throughout.

The actual app baseline is `deeea2ed59da55bc5aa30b33ed9984d68709eac7`, synced by the operator from Gemini Argon. Early references to `e9b5acb` are superseded. `BASELINE.json` records parent-verified source hashes.

## Verification and reproduction

From the repository root, run:

```powershell
python DOCS/UI_REVIEW_2026-10-17/verify_proposal.py
node --check DOCS/UI_REVIEW_2026-10-17/verification.js
```

The verification script regenerates the media/source manifests and JavaScript extraction in this folder. The builder reconstructs the artifact from its design source and existing media; its absolute Windows source reference should be adjusted when reproducing on another machine.

The exported specialist ledger mentions its helper preview at port 47529. That helper has been stopped after verification. Use the self-contained local HTML or the OpenDesign preview instead:

http://127.0.0.1:55364/api/projects/squash-arcade-ui-review-2026-10-17/raw/index.html

The OpenDesign URL is valid for the current daemon session. The checked-in HTML and media are the durable review artifact.

Proposed screens use illustrative static states. They are not playable implementation. Browser viewport checks do not establish physical phone, camera, sensor, audio listening, TV, multiplayer or first-rally acceptance. Operator discussion and implementation authorization remain separate.
