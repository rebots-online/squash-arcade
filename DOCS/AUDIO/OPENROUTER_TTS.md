# OpenRouter TTS investigation — 26 October 2026

The offer is **heygen/heygen-voice-1-turbo:free**, with expiration_date
**2026-11-30** in the current official models API. The promotional route has
zero input/output pricing. The paid sibling currently reports $4 per million
characters; future pricing is not guaranteed by the promotion.

Primary sources:
- [Official models API](https://openrouter.ai/api/v1/models?output_modalities=speech)
- [HeyGen free model card](https://openrouter.ai/heygen/heygen-voice-1-turbo:free)
- [Official speech API guide](https://openrouter.ai/docs/guides/overview/multimodal/tts)
- [Official TTS collection](https://openrouter.ai/collections/text-to-speech-models)

## Exact supported voices and format

The API lists these ten preset IDs for both HeyGen Turbo variants:
nadine, tabitha, bram, gareth, noelle, meredith, sabrina, lucian, weston, vincent.
This inventory proves availability, not each voice's accent/gender/performance.
Those require actual audition; no generated or listened-to sample is claimed here.

The model card specifies 39 languages, a 5,000-character request limit, and
44.1kHz mono PCM. The API guide says HeyGen returns PCM only and rejects MP3.
A generation pipeline must read the response audio rate/channel metadata,
wrap raw PCM in a proper WAV container and encode distributable files afterward.
Renaming raw samples to .mp3 is invalid. Use the dedicated audio/speech endpoint.

## Expressiveness: the limitation that matters

OpenRouter's general instructions field is documented for OpenAI, Gemini and
Fish models, and ignored by other providers. It must not be treated as a working
emotion/director control for this HeyGen route. Provider-specific expressiveness
options published for a different service/route cannot be assumed to work here.
Default voice quality may be good, but expressive squash-referee delivery needs
an audition. API/model descriptions are not listening acceptance.

| Candidate | What was verified | Fit for this project |
|---|---|---|
| HeyGen Turbo free | Zero-priced route, ten explicit voices, expires 30 Nov 2026 | Audition first; suitable for rendering a fixed offline pack during promotion |
| Fish S2.1 Pro Free (`fish-audio/s2.1-pro-free:free`) | Zero-priced route; no expiration advertised in current API; collection describes expressive multilingual synthesis | Compare natural-language delivery control; pin the actual supported voice/reference after audition; shared free capacity has no production guarantee |
| Fish Drama 3 (`fish-audio/drama-3`) | Current API $2 per million UTF-8 bytes; official collection documents directed emotional delivery | Paid comparison if free options fail the requested realism; do not silently start paid synthesis |

The selected model metadata snapshot is openrouter-models-20261026.json. No
credentials or audio-generation requests were used for this investigation.

## Recommendation: same approved audio on every device

The current code picks a voice from each operating system's installed list,
sets pitch 0.72/rate 0.95, and adds a synthetic baritone PA bed on referee calls.
The identity-only fallback is a separate Microsoft David recording. These are
concrete sources of timbre, cadence and identity variation across devices.

Render approved speech once with pinned model/voice settings, keep lossless
masters plus deployment encodings, and bundle the same files in web/PWA/native
outputs. Normal playback then does not depend on the free endpoint remaining
available after November 30. Ordinary gameplay should make no TTS API request.
Use stable voice identity and natural complete instructions/score clauses;
avoid global pitch manipulation and mechanical number-word stitching.

The generated plan contains 448 complete score clauses, nine fault phrases,
two high-stakes phrases and reviewed fixed candidates. This factors the 6,800
bounded whole-call variants at sentence pauses instead of generating every
combination. Keep a whole-call bank only if listening shows the joins hurt
naturalness. Scores beyond thirty are not forbidden: the actual win-by-two
rules have no configured maximum. Their same-voice prefetch/offline-caption
policy must be explicit; arbitrary system-speech fallback would recreate the
reported inconsistency.

Before bulk generation, audition the exact same short script set with candidate
voices: the welcome/red-player instruction, an ordinary handout, a crisp No let,
a controlled excited Nick/match-ball call and a longer placement briefing.
Record the voice ID, exact text, accepted controls and model revision. Evaluate
pronunciation, authority without shouting, warmth, pauses, natural number pairs,
expressive range and consistency. Do not infer voice quality from a name.

No audio generation, runtime voice replacement, physical-device playback or
listening approval is claimed by this research. The current runtime remains unchanged pending the
voice-generation implementation; this document is the requested investigation.
