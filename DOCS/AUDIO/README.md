# Speech inventory: read this first

The map is now explicit and reproducible. It audits current source; it is not a
claim that audio has been generated or that every retained producer is wired.

| Speech family | What the inventory contains |
|---|---|
| Welcome and red identity | Short/full welcome, start aliases, exact red-player sentence and existing fallback clip |
| Current briefings | Complete placement, phone and camera narration |
| Referee results | Down, Out, Not up, Nick, Stroke, Yes let, No let, Foot fault, Fault |
| Score calls | Server first, tied scores, handout, Game Ball, Match Ball, game/match completions |
| Serve correction | Left box, right box, receiver clearance |
| Optional spin | Full shot-selection/spin explanation; optional ceremony only |
| Rules and safety | Manual rules demonstration, appeal/fault/body-warning text and named-player variants |
| Preview buttons | Exact jukebox referee preview utterances and control aliases |
| Retained old invites | Three long USP scripts, marked legacy; current UI opens protected briefings instead |
| Open boundaries | Uncapped win-by-two numbers and generic text-taking audio APIs |

Machine inventory: [speech-catalog.json](speech-catalog.json), covering 35 source
files, 16 internal speech call sites, two SpeechSynthesis constructors and 72
text/template records. Forty unique fixed texts include legacy/disconnected
producers; that is an audit count, not forty approved production clips.

The [generation proposal](phrase-generation-plan.json) factors the bounded score
bank into **448 complete score clauses + 9 fault clips + 2 stakes clips + 17
fixed candidates = 476 candidate clips**, 8,720 characters before any script
revision/pronunciation expansion. Render full phrases, not individual number
words with mechanical gaps. At today's paid HeyGen sibling rate that text alone
would be roughly $0.035; the verified promotional route currently lists zero.
This estimate excludes auditions, retries and future pricing changes.

The [whole-call bank](score-generation-bank.json) enumerates 6,800 complete
formatter outputs through score 30 for coverage/inspection; there is no need to
synthesize every combination blindly. Thirty is a proposed audio-bank window,
not a limit on play. The rules allow higher scores, and write digits above
twenty. Higher-score pronunciation and same-voice/offline handling must be
explicit in the eventual generator/player, never silently delegated to each
operating system's default voice.

[Complete source-linked map](SPEECH_MAP.md) · [Provider investigation](OPENROUTER_TTS.md)
· [Recovered prior plan](PRIOR_PLAN.md) · [Crash/interruption audit](INTERRUPTION_AUDIT.json)

Current speech remains device Web Speech plus the separate identity fallback.
The recommended replacement is one approved, fixed voice rendered once into
bundled audio, with natural delivery and consistent loudness. No new provider
voice has been generated, listened to, installed or accepted on devices yet.
