# Speech map — Virtual Squash

Generated 2026-10-28T15:21:23.135Z. Source commit 6a2a5a498f98ade0e409eaac869a2541fc49a3a4; individual file hashes are in speech-catalog.json.

Found 16 speech call sites, 72 inventory records and 40 unique fixed texts including unconfirmed/legacy producers. The optional score bank contains 6800 full utterances through score 30.

This is the complete source-linked map of repository-owned speech inputs/producers and their grammar. It is not a claim that all producer branches are currently wired or that a finite bank covers the uncapped win-by-two score domain.

## Fixed utterances and templates

### legacy-USP

- **fixed** — Welcome to Virtual Squash! You are watching two autonomous A.I. players battle live on the glass showcourt. Ready to jump in? Use the menu on the left to play One Player against Club or Pro A.I., or start a Two-Human-Player One-v-One match! Play with Webcam Kinect-style body pose and arm swings, pair your smartphone as a Wii-style inertial racket, or use Keyboard and Mouse. Press K at any time to review the complete rules of squash!
  Source: src/audio_engine.js:243 (NARRATOR_USP_INVITES); id cf23814111cad766.
- **fixed** — Experience Physical Chess with full motion controls! For Kinect-style webcam play, click Enable Pose Cam in Step 4 to lunge and swing naturally in front of your camera—even using a back camera with a big-screen T.V.! For Wii-style motion play, scan the Pocket Racket QR code with your phone to swing and slice in 3D space. Or play immediately with mouse swipes and keys 1 through 5. Press K anytime to pause and view the complete rules of squash!
  Source: src/audio_engine.js:249 (NARRATOR_USP_INVITES); id 91e9cdceb9c55175.
- **fixed** — Ready to step on court? In Step 1 on the left menu, pick Club A.I. or Pro Chess A.I. for a solo match, or select One-v-One Match to invite a second human player! Even while watching this live A.I. exhibition, you can nudge their next shot with keys 1 through 5, or steer footwork with W, A, S, D. To review the official rules of squash, including Lets and Strokes, press K at any time!
  Source: src/audio_engine.js:255 (NARRATOR_USP_INVITES); id 31cde53b6c9f2daf.

### speech-input

- **fixed** — Welcome to Virtual Squash! The user is always represented in the game as the red player. Love all. Play!
  Source: src/audio_engine.js:558 (playWelcomeIntro); id 7bc0525dc7b60dbf.
- **fixed** — Welcome to Virtual Squash!
  Source: src/audio_engine.js:558 (playWelcomeIntro); id e8fc77748f8d7017.
- **template** — {item.speech}
  Source: src/audio_engine.js:586 (playNarratorUSPInvite); id 0e39b327938d9624.
- **fixed** — Down! Handout, five-four.
  Source: src/audio_engine.js:1445 (toggleRefereeVoice); id 8c25233d88f629a1.
- **template** — {btn.dataset.callout}
  Source: src/game_engine.js:1443 (_bindJukeboxAndRefereeControls); id d2a043b3a20fa568.
- **fixed** — Down! Handout, five-four.
  Source: src/game_engine.js:1443 (_bindJukeboxAndRefereeControls); id 83ce1d3526fed96d.
- **fixed** — Stop play! Yes, Let. Safety reminder: always call a Let when obstructed instead of striking your opponent.
  Source: src/game_engine.js:1476 (_bindJukeboxAndRefereeControls); id ebf5d8a97348d6c3.
- **fixed** — Down! Handout, five-four.
  Source: src/game_engine.js:1648 (toggleRefereeVoice); id 2cd13ab690d6164d.
- **fixed** — Quick note — you don't run to the ball in this game; your player does that. Your only job is shot selection: keys one to five, a click, or spacebar. Call the spin!
  Source: src/game_engine.js:2453 (_runRacketSpinCeremony); id ca1ef9082f4c2427.
- **template** — {this.rulesEngine.getHighStakesLabel()}
  Source: src/game_engine.js:2606 (_setupPointServe); id d40b2586d7b1619d.
- **template** — {letDecision.refereeCallout} {letDecision.safetyWarningText}
  Source: src/game_engine.js:2774 (_replayLetRally); id e34a418312a4b67b.
- **template** — {letDecision.refereeCallout}
  Source: src/game_engine.js:2774 (_replayLetRally); id b77e3332e78455d7.
- **fixed** — Yes, Let! Play a let.
  Source: src/game_engine.js:2774 (_replayLetRally); id 1cd0277970065bf1.
- **fixed** — Server, use the left box.
  Source: src/game_engine.js:2981 (_updateServeReadiness); id a43242060f2d7a35.
- **fixed** — Server, use the right box.
  Source: src/game_engine.js:2981 (_updateServeReadiness); id b38910e139affe12.
- **fixed** — Receiver, give the server room.
  Source: src/game_engine.js:2981 (_updateServeReadiness); id 91fedb49bafc63fd.
- **template** — {this.rulesEngine.formatRefereeCallout(outcome,reason,decisionMeta)}
  Source: src/game_engine.js:3953 (_awardPoint); id c3332a5d80f7c1ad.
- **template** — {decisionMeta.refereeCallout} {decisionMeta.safetyWarningText}
  Source: src/game_engine.js:4041 (_showPointOutcome); id 6f2ad24f38d07886.
- **template** — {this.rulesEngine.formatRefereeCallout(outcome, reason, decisionMeta)} {decisionMeta.safetyWarningText}
  Source: src/game_engine.js:4041 (_showPointOutcome); id 1658587efdbb4483.
- **template** — {decisionMeta.refereeCallout} {this.rulesEngine.formatRefereeCallout(outcome, reason, decisionMeta)}
  Source: src/game_engine.js:4041 (_showPointOutcome); id 227708848043d526.
- **template** — {this.rulesEngine.formatRefereeCallout(outcome, reason, decisionMeta)}
  Source: src/game_engine.js:4041 (_showPointOutcome); id d46720e4dc73b539.
- **template** — {c.speech}
  Source: src/squash/ArcadeBriefing.js:158 (showChapter); id 277146171b17abc0.

### transport-alias-or-normalization

- **fixed** — Love all. Play!
  Source: src/audio_engine.js:1696 (speakNow); id 7cf71ebcbb9cec7e.
- **fixed** — Welcome to Virtual Squash! Love all. Play!
  Source: src/audio_engine.js:1696 (speakNow); id adc8d666eca5756c.
- **fixed** — Welcome to Virtual Squash!
  Source: src/audio_engine.js:1701 (speakNow); id d44e6bb832e87d09.
- **fixed** — Game and match!
  Source: src/audio_engine.js:1704 (speakNow); id 972abda5859e9d5e.
- **template** — {spokenText .replace(/\b00\b/g, 'love') .replace(/\(Tin\)/gi, '') .replace(/\(Two Bounces\)/gi, '') .replace(/\(Missed Front Wall\)/gi, '') .replace(/•/g, ',') .replace(/\s*-\s*/g, ' ')}
  Source: src/audio_engine.js:1706 (speakNow); id e3f57f8bc4fd9891.

### rules-or-safety-producer

- **fixed** — ⚠️ REFEREE REMINDER: You were obstructed by your opponent! Call "Let, please!" immediately (Press F / L, raise an open hand ✋, or hold phone upright) instead of letting the ball bounce twice.
  Source: src/game_engine.js:3663 (_stepPhysics); id 470a573fcbb6bcb0.
- **fixed** — Stop play! Ball hit opponent! Stroke awarded, but SECOND SAFETY WARNING to Player 1: Never strike the ball when your opponent is in the line of fire! Hold your shot and call Let, please!
  Source: src/squash/RulesEngine.js:109 (evaluateBallPlayerBodyCollision); id 7940e005313bd109.
- **fixed** — Stop play! Ball hit opponent! Stroke awarded, but SECOND SAFETY WARNING to Player 2: Never strike the ball when your opponent is in the line of fire! Hold your shot and call Let, please!
  Source: src/squash/RulesEngine.js:109 (evaluateBallPlayerBodyCollision); id 557a143b9ee987a8.
- **fixed** — Stop play! Ball hit opponent! Stroke awarded, but Referee Safety Warning: Always stop and call Let, please instead of hitting an opponent!
  Source: src/squash/RulesEngine.js:109 (evaluateBallPlayerBodyCollision); id 70333da190a078cc.
- **fixed** — Stop play! Ball hit opponent after turning. Yes, let! Safety warning: Hold your swing and call Let, please when the court is blocked!
  Source: src/squash/RulesEngine.js:125 (evaluateBallPlayerBodyCollision); id bfdc0c17cc75aecd.
- **fixed** — Stop play! Ball struck receiver after front wall. Stroke!
  Source: src/squash/RulesEngine.js:141 (evaluateBallPlayerBodyCollision); id ccceff942f228d56.
- **fixed** — Down! (Tin)
  Source: src/squash/RulesEngine.js:164 (evaluateCollision); id ebcda32d32174456.
- **fixed** — Out!
  Source: src/squash/RulesEngine.js:175 (evaluateCollision); id 7ced71245e4e9476.
- **fixed** — Not Up! (Missed Front Wall)
  Source: src/squash/RulesEngine.js:188 (evaluateCollision); id 9e4c6e78ae62de3c.
- **fixed** — NICK! Rolled Dead!
  Source: src/squash/RulesEngine.js:199 (evaluateCollision); id a9c339c6058be5c5.
- **fixed** — Not up! Point to striker. Referee warning: You had interference, but you must call Let, please to stop play — otherwise you lose the point!
  Source: src/squash/RulesEngine.js:215 (evaluateCollision); id e16ed968fdc88c4a.
- **fixed** — NICK ROLLER!
  Source: src/squash/RulesEngine.js:224 (evaluateCollision); id ceb1b76091afa2e6.
- **fixed** — Not Up! (Two Bounces)
  Source: src/squash/RulesEngine.js:224 (evaluateCollision); id 631e12eaff4ee1de.
- **fixed** — Stroke! Opponent in swing/front-wall cone!
  Source: src/squash/RulesEngine.js:286 (evaluateInterference); id abf22974b5aaa142.
- **fixed** — Yes, Let! Crowded access to the ball.
  Source: src/squash/RulesEngine.js:286 (evaluateInterference); id 674c506de34c1394.
- **fixed** — Yes, Let! Line of access obstructed.
  Source: src/squash/RulesEngine.js:313 (evaluateInterference); id dc92b067c5fbeff2.
- **fixed** — Stroke! Opponent failed to clear the shot cone. Good safety discipline holding your swing!
  Source: src/squash/RulesEngine.js:365 (resolveLetAppeal); id c5f8cdd4cfbec071.
- **fixed** — Yes, let! Interference on access — replay the point.
  Source: src/squash/RulesEngine.js:374 (resolveLetAppeal); id 8a5ee33b9416e493.
- **fixed** — Yes, let! Close quarters on the T — replay the point.
  Source: src/squash/RulesEngine.js:394 (resolveLetAppeal); id f6c8bd001788a69c.
- **fixed** — No let! Opponent cleared the ball and there was no interference. Point to opponent!
  Source: src/squash/RulesEngine.js:406 (resolveLetAppeal); id 37bd73a8e1c70d19.

### briefing

- **fixed** — The user is always represented in the game as the red player. Squash is physical chess. Keep rails tight to the wall. Send drives and lobs deep, beyond the service box. Volley when the opening is there. Move your opponent before you attack. Watch the red player, then try the shots yourself.
  Source: src/squash/ArcadeBriefing.js:9 (CHAPTERS); id 0879e36699886290.
- **fixed** — Play with your phone as a Wii-style racket. Pair it with the court screen and allow motion sensors. Fold it if you have a foldable. Hold securely with room to swing. Your arm movement and racket face shape the on-screen stroke. Ordinary phones work too.
  Source: src/squash/ArcadeBriefing.js:16 (CHAPTERS); id fecf5651dc474c27.
- **fixed** — For Kinect-style play, enable the camera on your court screen. Step back with your arms and body in view. Lunge and swing your racket arm. The red player follows your movement. Choose the front or back camera for your screen setup.
  Source: src/squash/ArcadeBriefing.js:23 (CHAPTERS); id 85648c639eb3da1c.

### score-fragment

- **template** — {{ NO_LET: 'No let!', YES_LET: 'Yes, let!', STROKE: 'Stroke!' }[decisionMeta?.decision]}
  Source: src/squash/RulesEngine.js:533 (formatRefereeCallout); id 7b3a3cbbc6fa5815.
- **fixed** — No let!
  Source: src/squash/RulesEngine.js:535 (formatRefereeCallout); id c3bfa2387bc8efa9.
- **fixed** — Foot fault!
  Source: src/squash/RulesEngine.js:537 (formatRefereeCallout); id f5d774530c0f4934.
- **fixed** — Fault!
  Source: src/squash/RulesEngine.js:539 (formatRefereeCallout); id 04e1fdd42eb4086d.
- **fixed** — Down!
  Source: src/squash/RulesEngine.js:541 (formatRefereeCallout); id 0bc376d51876c43b.
- **fixed** — Out!
  Source: src/squash/RulesEngine.js:543 (formatRefereeCallout); id ce639d982b6d0eb2.
- **fixed** — Not up!
  Source: src/squash/RulesEngine.js:545 (formatRefereeCallout); id 0e2d659aafb3e113.
- **fixed** — Nick!
  Source: src/squash/RulesEngine.js:547 (formatRefereeCallout); id 2f4068da5a9059e7.
- **fixed** — Stroke!
  Source: src/squash/RulesEngine.js:549 (formatRefereeCallout); id e3e36f2f92cb3108.
- **fixed** — Yes, let!
  Source: src/squash/RulesEngine.js:551 (formatRefereeCallout); id d780f0ec1df65871.
- **template** — Game and match! {numToWord(winnerPts)}-{numToWord(loserPts)}.
  Source: src/squash/RulesEngine.js:562 (formatRefereeCallout); id 002c3b7eadfb1246.
- **template** — Game! {numToWord(winnerPts)}-{numToWord(loserPts)}.
  Source: src/squash/RulesEngine.js:573 (formatRefereeCallout); id 18c5c0fc250e0b0d.
- **template** — Handout, {numToWord(serverPts)} all.
  Source: src/squash/RulesEngine.js:588 (formatRefereeCallout); id 4f9f355cb860e708.
- **template** — Handout, {numToWord(serverPts)}-{numToWord(receiverPts)}.
  Source: src/squash/RulesEngine.js:588 (formatRefereeCallout); id d4a3af111f5efe29.
- **template** — {scorePhrase.charAt(0).toUpperCase()}{scorePhrase.slice(1)}.
  Source: src/squash/RulesEngine.js:590 (formatRefereeCallout); id 1bb0df3f10cd7b58.
- **template** — {this.getHighStakesLabel()}!
  Source: src/squash/RulesEngine.js:596 (formatRefereeCallout); id 5781ffbe71756352.

### manual-preview

- **fixed** — Down! Handout, five-four.
  Source: index.html:693 (jukebox-call-button); id 0b1b61696cbfd345.
- **fixed** — Nick! Ten-eight, match ball!
  Source: index.html:694 (jukebox-call-button); id afad241e9c378a0c.

### bundled-fallback

- **fixed** — The user is always represented in the game as the red player.
  Source: src/audio_engine.js:1531 (_playIdentityFallback); id identity-fallback.

## Dynamic closed grammar

{
  "scoreModes": [
    "PAR_11",
    "ARCADE_5",
    "HIHO_9"
  ],
  "targets": [
    11,
    5,
    9
  ],
  "winBy": {
    "PAR_11": 2,
    "ARCADE_5": 1,
    "HIHO_9": 2
  },
  "numberDomain": "nonnegative integer; no configured maximum for win-by-two",
  "serverRoles": [
    "player",
    "opponent"
  ],
  "serviceSides": [
    "left",
    "right"
  ],
  "faultPrefixes": [
    "",
    "Down!",
    "Out!",
    "Not up!",
    "Nick!",
    "Stroke!",
    "Yes, let!",
    "No let!",
    "Foot fault!",
    "Fault!"
  ],
  "handout": [
    "",
    "Handout, "
  ],
  "scoreForms": [
    "{server} {receiver}.",
    "{n} all."
  ],
  "stakes": [
    "",
    "Game Ball!",
    "Match Ball!"
  ],
  "completions": [
    "Game! {winner} {loser}.",
    "Game and match! {winner} {loser}."
  ],
  "warnings": {
    "namedPlayers": [
      "Player 1",
      "Player 2"
    ],
    "repeatClass": [
      "first",
      "SECOND SAFETY WARNING"
    ]
  },
  "externalTextBoundary": "AudioEngine generic methods currently accept arbitrary text. Full closure requires future clip-ID/grammar enforcement; developer-console or external callers are not enumerated by this repo inventory."
}

## Every speech call site

- src/audio_engine.js:558 playWelcomeIntro → beginBriefingNarration(phrase)
- src/audio_engine.js:586 playNarratorUSPInvite → beginBriefingNarration(item.speech)
- src/audio_engine.js:1445 toggleRefereeVoice → playVoiceCallout('Down! Handout, five-four.')
- src/audio_engine.js:1675 announceScore → playVoiceCallout(raw)
- src/game_engine.js:1443 _bindJukeboxAndRefereeControls → announceScore(phrase)
- src/game_engine.js:1476 _bindJukeboxAndRefereeControls → announceScore('Stop play! Yes, Let. Safety reminder: always call a Let when obstructed instead of striking your opponent.')
- src/game_engine.js:1648 toggleRefereeVoice → announceScore('Down! Handout, five-four.')
- src/game_engine.js:2453 _runRacketSpinCeremony → announceScore("Quick note — you don't run to the ball in this game; your player does that. " + 'Your only job is shot selection: keys one to five, a click, or spacebar. Call the spin!')
- src/game_engine.js:2606 _setupPointServe → announceScore(highStakes)
- src/game_engine.js:2774 _replayLetRally → announceScore(voiceText)
- src/game_engine.js:2981 _updateServeReadiness → playVoiceCallout(text)
- src/game_engine.js:3953 _awardPoint → announceScore(callout)
- src/game_engine.js:4003 _showPointOutcome → announceScore(refereeCallout)
- src/game_engine.js:4019 _showPointOutcome → announceScore(refereeCallout)
- src/game_engine.js:4041 _showPointOutcome → announceScore(refereeCallout)
- src/squash/ArcadeBriefing.js:158 showChapter → beginBriefingNarration(c.speech)

## Gaps that must not be hidden by generation

- NARRATOR_USP_INVITES remains defined, but current engine triggerNarratorUSPInvite opens ArcadeBriefing; mark the three old invitations retained/legacy rather than automatically generating outdated left-menu instructions.
- RulesEngine.evaluateBallPlayerBodyCollision expects positional arguments/returns hitPlayer, while game_engine passes an object and checks rallyEnded; body-warning producer text is not proven reachable through this mismatched wiring.
- RulesEngine.resolveLetAppeal returns callout, but _replayLetRally reads refereeCallout; the current route can fall back to the generic Yes, Let! Play a let. rather than the detailed reason.
- Speech normalization strips parenthetical reasons, bullets and hyphens only on the ordinary referee path; briefing narration uses raw text.
- Point award and post-replay completion can announce the same result twice. A replacement pack must retain event/owner identity and avoid duplicate/interrupted playback.
- The browser fallback covers only the identity sentence, not complete narration; generic unmapped speech cannot silently reintroduce device voice variation.

## Practical generation proposal

448 full score clauses plus nine fault prefixes, two stakes clips and reviewed fixed narration cover the bounded score bank without rendering all 6800 whole combinations. These are sentence/score clauses, not isolated number tokens. The score bank is not a game cap. See phrase-generation-plan.json; no audio has been generated.

## Voice-pack recommendation

Select fixed provider/voice identities, render complete fixed instructions and natural full score calls once, retain pronunciation/performance direction and source hashes, then bundle the approved audio. Do not pitch-shift an arbitrary OS voice or assemble every word with mechanical gaps. The optional score bank is a coverage/budget aid; uncapped extension needs an explicit consistent-voice policy. No synthesis, provider replacement or listening acceptance is claimed by this inventory.
