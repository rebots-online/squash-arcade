# Prior voice-pack proposal: exact historical record

The parent of removal commit b482a7ad5fa526287ddf979eb118053d0d0d836b is
b10c5e06a403b88eb1bcbf8c2653296c995c1936. Its DOCS/ARCHITECTURE.md section 5.1
proposed src/voice_lines.js with approximately 40 fixed lines and 80 tokens,
a scripts/generate-voice-pack.mjs generator, OGG assets and a manifest,
pre-rendered AudioBuffer playback and a browser-speech fallback for unmapped text.
Its proposed Gate G required complete FIXED_LINES/TOKEN_KIT coverage.

That is a design outline and approximate inventory, not an enumerated complete
catalog. Neither proposed source file appears in tracked history. The code's
GEMINI_TTS_CLIPS object remains empty. The removal commit on 17 October 2026
removed this refinement and renumbered later tasks. Its recorded subject was:
“docs: drop re-voicing/voice-pack refinement from ARCHITECTURE + CHECKLIST
(risk > return); renumber tasks TASK-15..19 and gates G-I”.

The evidence identifies what changed; it does not establish who requested that
removal. The present operator request explicitly asks for a complete map and
current provider investigation. SPEECH_MAP.md and speech-catalog.json replace
that approximate outline with exact source-linked text, templates and gaps.
No generated voice pack or listening approval has been recovered or asserted.
