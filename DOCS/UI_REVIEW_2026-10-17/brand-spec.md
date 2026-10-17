# Brand specification — operator proposal

Source: supplied Product palette and typography. Existing Squash UI was inspected in root index.html/styles.css; its court artwork is preserved as evidence, while proposed chrome uses the supplied Product system.

Six tokens (OKLch equivalents of the exact supplied sRGB colors):
- `--bg: oklch(1.000000 0.000000 0.000)` — exact source `#ffffff`
- `--surface: oklch(0.978932 0.002865 264.542)` — exact source `#f7f8fa`
- `--fg: oklch(0.177638 0.000000 0.000)` — exact source `#111111`
- `--muted: oklch(0.551019 0.023361 264.364)` — exact source `#6b7280`
- `--border: oklch(0.899406 0.013427 262.377)` — exact source `#d9dee7`
- `--accent: oklch(0.598657 0.219351 259.040)` — exact source `#1677ff`

Display and body: `Inter, system-ui, -apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif`. Mono: `Consolas, "Cascadia Mono", monospace`. No font hotlinks; use installed face/fallbacks.

Observed supplied rules: white canvas and light surface separation; 8px corners; 1px borders; 8px baseline rhythm; sparse blue accent. No supplied logo asset: retain the product name as plain text, not an invented mark. Original screenshot artwork is exempt from CSS palette checks because it documents the baseline.
