// ============================================================================
// ARGON SQUASH — RULES ENGINE (PAR 11, ARCADE 5, HIHO 9, TIN, OUT, LET/STROKE)
// Enforces WSF squash rules, service box transitions, and point/game state.
// ============================================================================

import { COURT_SPECS } from './CourtGeometry.js';

export class RulesEngine {
  constructor(options = {}) {
    this.scoringMode = options.scoringMode || 'PAR_11'; // 'PAR_11' | 'ARCADE_5' | 'HIHO_9'
    this.gamesToWin = options.gamesToWin || 2;
    this.interferenceRule = options.interferenceRule || 'LET_STROKE';
    this.resetMatch();
  }

  resetMatch({ gamesToWin = this.gamesToWin, scoringMode = this.scoringMode } = {}) {
    this.gamesToWin = gamesToWin;
    this.scoringMode = scoringMode;
    this.safetyWarnings = { player: 0, opponent: 0 };
    this.uncalledLetWarnings = { player: 0, opponent: 0 };
    this.score = {
      playerPoints: 0,
      opponentPoints: 0,
      playerGames: 0,
      opponentGames: 0,
      server: 'player',
      serviceSide: 'right', // 'right' or 'left' service box
      handOutJustOccurred: false
    };
    return this.score;
  }

  getTargetPointsToWinGame() {
    if (this.scoringMode === 'ARCADE_5') return 5;
    if (this.scoringMode === 'HIHO_9') return 9;
    return 11; // PAR_11
  }

  /**
   * Resets per-shot tracking flags on the ball whenever a player or opponent strikes it.
   */
  onStrokeHit(ball, hitterRole, { isServe = false, shotType = 'DRIVE', isDisguised = false } = {}) {
    ball.inPlay = true;
    ball.lastHitter = hitterRole;
    ball.isServeShot = !!isServe;
    ball.hitFrontWallThisShot = false;
    ball.hitBackWallThisShot = false;
    ball.bounceCountOnFloor = 0;
    ball.wallHitCountThisShot = 0;
    ball.lastBounceWasNick = false;
    ball.shotType = shotType;
    ball.isDisguised = !!isDisguised;
    ball.rallyStrokeCount = isServe ? 1 : (ball.rallyStrokeCount || 0) + 1;
    ball.timeSinceHitSec = 0;
    ball.hadClearInterference = false;
    ball.interferenceDecision = null;
    ball.interferenceReason = '';
  }

  /**
   * Checks if the live squash ball physically hits the non-striking player's body.
   * Enforces WSF Rule 9 (Ball Hitting a Player) AND issues mandatory safety warnings
   * when a striker hits into an opponent instead of stopping play and calling a Let.
   */
  evaluateBallPlayerBodyCollision(ball, playerActor, opponentActor) {
    if (!ball || !ball.inPlay || !playerActor || !opponentActor) {
      return { hitPlayer: false };
    }
    const elapsed = Number(ball.timeSinceHitSec ?? 0);
    if (elapsed < 0.045) {
      return { hitPlayer: false };
    }

    const hitter = ball.lastHitter || 'player';
    const targetRole = hitter === 'player' ? 'opponent' : 'player';
    const targetActor = targetRole === 'player' ? playerActor : opponentActor;

    const dx = ball.pos.x - targetActor.pos.x;
    const dz = ball.pos.z - targetActor.pos.z;
    const distXZ = Math.hypot(dx, dz);
    const inBodyHeight = ball.pos.y >= 0.08 && ball.pos.y <= 1.78;
    const hitRadius = !ball.hitFrontWallThisShot ? 0.48 : 0.40;

    if (!inBodyHeight || distXZ > hitRadius) {
      return { hitPlayer: false };
    }

    // Case 1: Ball struck the opponent BEFORE reaching the front wall (Dangerous Line-of-Fire Hit!)
    if (!ball.hitFrontWallThisShot) {
      const goingDirectToFront = ball.vel.z < -2.0 && (ball.wallHitCountThisShot || 0) === 0;
      this.safetyWarnings[hitter] = (this.safetyWarnings[hitter] || 0) + 1;
      const warnCount = this.safetyWarnings[hitter];
      const hitterName = hitter === 'player' ? 'Player 1' : 'Player 2';

      if (goingDirectToFront) {
        // WSF Rule 9.1.1: Ball was going directly to the front wall -> Stroke to Striker,
        // PLUS explicit Referee Safety Warning to call a Let instead of hitting the opponent!
        const safetyCallout =
          warnCount >= 2
            ? `Stop play! Ball hit opponent! Stroke awarded, but SECOND SAFETY WARNING to ${hitterName}: Never strike the ball when your opponent is in the line of fire! Hold your shot and call Let, please!`
            : `Stop play! Ball hit opponent! Stroke awarded, but Referee Safety Warning: Always stop and call Let, please instead of hitting an opponent!`;
        return {
          hitPlayer: true,
          victimRole: targetRole,
          hitterRole: hitter,
          decision: 'STROKE_WITH_SAFETY_WARNING',
          winner: hitter,
          reason: 'Ball Hit Opponent (Stroke + Safety Warning)',
          callout: safetyCallout,
          shortBanner: '⚠️ STROKE + SAFETY WARNING!',
          subBanner: `Point awarded, but DO NOT hit into an opponent! Call "Let, please!" (Key F/L, Raise Hand, or Phone Up) [${warnCount}x Warning]`,
          bannerStyle: 'style-fault',
          warningCount: warnCount
        };
      }

      // Ball hit side wall first or was not going directly to front wall -> Replay Let + Safety Warning
      return {
        hitPlayer: true,
        victimRole: targetRole,
        hitterRole: hitter,
        decision: 'LET_WITH_SAFETY_WARNING',
        winner: null,
        reason: 'Ball Hit Opponent Indirectly (Let + Safety Warning)',
        callout: `Stop play! Ball hit opponent after turning. Yes, let! Safety warning: Hold your swing and call Let, please when the court is blocked!`,
        shortBanner: '⚠️ LET + SAFETY WARNING!',
        subBanner: 'Indirect ball hit opponent — Replay Let! Always hold up and call Let for safety.',
        bannerStyle: 'style-fault',
        warningCount: warnCount
      };
    }

    // Case 2: Ball already rebounded off the Front Wall and hit the receiver
    return {
      hitPlayer: true,
      victimRole: targetRole,
      hitterRole: hitter,
      decision: 'REBOUND_HIT_RECEIVER',
      winner: hitter,
      reason: 'Stroke (Ball Hit Receiver)',
      callout: 'Stop play! Ball struck receiver after front wall. Stroke!',
      shortBanner: 'BALL HIT PLAYER • STROKE',
      subBanner: 'Rebound off front wall struck receiver — Point to Striker.',
      bannerStyle: 'style-fault',
      warningCount: 0
    };
  }

  /**
   * Evaluates a collision event from BallPhysics and determines if the rally has ended.
   */
  evaluateCollision(evt, ball) {
    if (!ball || !ball.inPlay) return { rallyEnded: false };

    const hitter = ball.lastHitter || 'player';
    const receiver = hitter === 'player' ? 'opponent' : 'player';

    // 1. Tin Fault (Down)
    if (evt.surface === 'tin' || evt.isTin) {
      return {
        rallyEnded: true,
        winner: receiver,
        reason: 'Tin',
        callout: 'Down! (Tin)',
        bannerStyle: 'style-fault'
      };
    }

    // 2. Out of Court Fault (Above Front, Side, or Back Wall Out Line)
    if (evt.isOut) {
      return {
        rallyEnded: true,
        winner: receiver,
        reason: 'Out',
        callout: 'Out!',
        bannerStyle: 'style-fault'
      };
    }

    // 3. Floor or Nick Contact
    if (evt.surface === 'floor' || evt.surface === 'nick') {
      // If the ball hits the floor BEFORE reaching the Front Wall -> Fault ("Not Up / Down")
      if (!ball.hitFrontWallThisShot) {
        return {
          rallyEnded: true,
          winner: receiver,
          reason: 'Short',
          callout: 'Not Up! (Missed Front Wall)',
          bannerStyle: 'style-fault'
        };
      }

      // If it's a true Rollout Nick on 1st bounce and rebound apex is essentially unplayable (< 2.5cm)
      if (evt.isNick && evt.nickData?.quality === 'ROLLOUT_NICK' && evt.nickData.reboundApexEstimateMeters < 0.025) {
        return {
          rallyEnded: true,
          winner: hitter,
          reason: 'Nick Winner',
          callout: 'NICK! Rolled Dead!',
          bannerStyle: 'style-gold'
        };
      }

      // Second bounce on floor -> Point to Hitter!
      if (ball.bounceCountOnFloor >= 2) {
        const isNickWinner = !!ball.lastBounceWasNick;
        // Check if receiver had a clear Let/Stroke obstruction and held up, but FAILED to call a Let!
        if (!isNickWinner && ball.hadClearInterference) {
          this.uncalledLetWarnings[receiver] = (this.uncalledLetWarnings[receiver] || 0) + 1;
          return {
            rallyEnded: true,
            winner: hitter,
            reason: 'Uncalled Let (Two Bounces)',
            uncalledLetPenalty: true,
            callout:
              'Not up! Point to striker. Referee warning: You had interference, but you must call Let, please to stop play — otherwise you lose the point!',
            bannerStyle: 'style-fault'
          };
        }
        return {
          rallyEnded: true,
          winner: hitter,
          reason: isNickWinner ? 'Nick Winner' : 'Two Bounces',
          callout: isNickWinner ? 'NICK ROLLER!' : 'Not Up! (Two Bounces)',
          bannerStyle: 'style-gold'
        };
      }
    }

    return { rallyEnded: false };
  }

  /**
   * Evaluates live WSF Rule 8 Interference (Let / Stroke) when the incoming receiver is
   * physically obstructed by the outgoing hitter in the swing radius, front-wall cone, or access line.
   */
  evaluateInterference(receiverActor, hitterActor, ball) {
    if (
      this.interferenceRule === 'ARCADE_NO_FAULT' ||
      !ball ||
      !ball.inPlay ||
      !ball.hitFrontWallThisShot ||
      !receiverActor ||
      !hitterActor
    ) {
      return { interference: false };
    }

    const distBetweenActors = Math.hypot(
      receiverActor.pos.x - hitterActor.pos.x,
      receiverActor.pos.z - hitterActor.pos.z
    );
    const distReceiverToBall = Math.hypot(
      ball.pos.x - receiverActor.pos.x,
      ball.pos.z - receiverActor.pos.z
    );
    const distHitterToBall = Math.hypot(
      ball.pos.x - hitterActor.pos.x,
      ball.pos.z - hitterActor.pos.z
    );

    // 1. Direct Front-Wall Cone or Swing-Radius Obstruction (STROKE danger!)
    // If receiver is close enough to play the ball (< 2.35m) and hitter is either inside the swing cylinder
    // or directly in the front-wall shot triangle between the ball and the front wall.
    const inFrontCone =
      hitterActor.pos.z < Math.max(ball.pos.z, receiverActor.pos.z) + 0.25 &&
      Math.abs(hitterActor.pos.x - ball.pos.x) < 0.72 &&
      distHitterToBall < 1.65;
    const inSwingZone = distBetweenActors < 1.05 && distReceiverToBall < 2.05;

    if (distReceiverToBall < 2.45 && (inSwingZone || inFrontCone)) {
      const isDirectStroke =
        (inFrontCone && distReceiverToBall < 2.1) ||
        (distBetweenActors < 0.88 && distHitterToBall <= distReceiverToBall + 0.15);
      const decision = isDirectStroke ? 'STROKE' : 'LET';
      ball.hadClearInterference = true;
      ball.interferenceDecision = decision;
      ball.interferenceReason = isDirectStroke
        ? 'Opponent blocking front-wall cone / swing zone'
        : 'Opponent crowding ball access';
      return {
        interference: true,
        decision,
        winner: isDirectStroke ? receiverActor.role : null,
        reason: ball.interferenceReason,
        callout: isDirectStroke
          ? 'Stroke! Opponent in swing/front-wall cone!'
          : 'Yes, Let! Crowded access to the ball.'
      };
    }

    // 2. Access Path Obstruction (YES, LET): Hitter is between Receiver and the Ball
    const toBallX = ball.pos.x - receiverActor.pos.x;
    const toBallZ = ball.pos.z - receiverActor.pos.z;
    const toBallLen = Math.hypot(toBallX, toBallZ);
    if (toBallLen > 0.35 && toBallLen < 3.4) {
      const ux = toBallX / toBallLen;
      const uz = toBallZ / toBallLen;
      const toHitterX = hitterActor.pos.x - receiverActor.pos.x;
      const toHitterZ = hitterActor.pos.z - receiverActor.pos.z;
      const proj = toHitterX * ux + toHitterZ * uz;
      const perpDist = Math.abs(toHitterX * -uz + toHitterZ * ux);

      if (proj > 0.15 && proj < toBallLen + 0.25 && perpDist < 0.72) {
        ball.hadClearInterference = true;
        ball.interferenceDecision = 'LET';
        ball.interferenceReason = 'Opponent blocking direct line of run to the ball';
        return {
          interference: true,
          decision: 'LET',
          winner: null,
          reason: ball.interferenceReason,
          callout: 'Yes, Let! Line of access obstructed.'
        };
      }
    }

    return { interference: false };
  }

  /**
   * WSF service-stance legality check, evaluated at the moment of serve toss.
   * Returns 'WRONG_BOX' | 'FOOT_FAULT' | null.
   *  - WRONG_BOX: server standing in the wrong service box for `serviceSide`.
   *  - FOOT_FAULT: foot touching the half-court line (|x| < 0.22) or on/short
   *    of the short line (z < SHORT_LINE_Z + 0.02).
   */
  evaluateServeStanceLegality(serverPos, serviceSide = 'right') {
    if (!serverPos) return null;
    if (Math.abs(serverPos.x) < 0.22) return 'FOOT_FAULT';
    if (serverPos.z < COURT_SPECS.SHORT_LINE_Z + 0.02) return 'FOOT_FAULT';
    const expectedSign = serviceSide === 'left' ? -1 : 1;
    if (Math.sign(serverPos.x) !== expectedSign && Math.abs(serverPos.x) <= COURT_SPECS.HALF_WIDTH) {
      return 'WRONG_BOX';
    }
    return null;
  }

  /**
   * Resolves an explicit "Let, please!" call made by `callerRole` (via Key F/L, HUD button,
   * Webcam raised open hand, or Phone Racket hold-up).
   */
  resolveLetAppeal({ callerRole = 'player', activeInterference = null, ball, receiverActor, hitterActor }) {
    const otherRole = callerRole === 'player' ? 'opponent' : 'player';

    // Check if interference was active on this shot or is occurring right now
    const liveEval = this.evaluateInterference(receiverActor, hitterActor, ball);
    const hasInterference =
      Boolean(liveEval.interference) ||
      Boolean(activeInterference && activeInterference.active) ||
      Boolean(ball && ball.hadClearInterference);

    const effectiveDecision =
      liveEval.decision ||
      activeInterference?.decision ||
      ball?.interferenceDecision ||
      'LET';

    if (hasInterference) {
      if (effectiveDecision === 'STROKE') {
        return {
          decision: 'STROKE',
          winner: callerRole,
          bannerTitle: '✋ STROKE AWARDED! (GOOD SAFETY HOLD)',
          callout:
            'Stroke! Opponent failed to clear the shot cone. Good safety discipline holding your swing!',
          bannerStyle: 'style-gold'
        };
      }
      return {
        decision: 'YES_LET',
        winner: null,
        bannerTitle: '✋ YES, LET! • REPLAY POINT',
        callout: 'Yes, let! Interference on access — replay the point.',
        bannerStyle: 'style-start'
      };
    }

    // Check if players are reasonably close while ball is still playable (benefit of the doubt Let)
    if (ball && ball.inPlay && receiverActor && hitterActor) {
      const distBetween = Math.hypot(
        receiverActor.pos.x - hitterActor.pos.x,
        receiverActor.pos.z - hitterActor.pos.z
      );
      const distToBall = Math.hypot(
        ball.pos.x - receiverActor.pos.x,
        ball.pos.z - receiverActor.pos.z
      );
      if (distBetween < 1.55 && distToBall < 2.85) {
        return {
          decision: 'YES_LET',
          winner: null,
          bannerTitle: '✋ YES, LET! • SAFETY REPLAY',
          callout: 'Yes, let! Close quarters on the T — replay the point.',
          bannerStyle: 'style-start'
        };
      }
    }

    // Otherwise: No interference existed! Referee denies the appeal ("No Let!") and awards point to opponent.
    this.uncalledLetWarnings[callerRole] = (this.uncalledLetWarnings[callerRole] || 0) + 1;
    return {
      decision: 'NO_LET',
      winner: otherRole,
      bannerTitle: '❌ NO LET! • POINT TO OPPONENT',
      callout:
        'No let! Opponent cleared the ball and there was no interference. Point to opponent!',
      bannerStyle: 'style-fault'
    };
  }

  /**
   * Updates score state for the point winner according to PAR_11, ARCADE_5, or HIHO_9.
   */
  awardPoint(winnerRole) {
    const prevServer = this.score.server;
    const serviceChanged = winnerRole !== prevServer;
    let pointScored = true;

    if (this.scoringMode === 'HIHO_9' && serviceChanged) {
      // Hand-In / Hand-Out: receiver wins service ("Hand Out") without incrementing point score
      this.score.server = winnerRole;
      this.score.handOutJustOccurred = true;
      this.score.serviceSide = 'right';
      pointScored = false;
    } else {
      this.score.handOutJustOccurred = serviceChanged;
      if (winnerRole === 'player') {
        this.score.playerPoints += 1;
      } else {
        this.score.opponentPoints += 1;
      }
      if (!serviceChanged) {
        // Server won the rally -> alternate service box (Right <-> Left)
        this.score.serviceSide = this.score.serviceSide === 'right' ? 'left' : 'right';
      } else {
        // Hand out -> new server chooses box (defaults to right on even, left on odd)
        this.score.server = winnerRole;
        const pts = winnerRole === 'player' ? this.score.playerPoints : this.score.opponentPoints;
        this.score.serviceSide = pts % 2 === 0 ? 'right' : 'left';
      }
    }

    const target = this.getTargetPointsToWinGame();
    const p = this.score.playerPoints;
    const o = this.score.opponentPoints;
    const winBy = this.scoringMode === 'ARCADE_5' ? 1 : 2;

    let gameWonBy = null;
    let matchWonBy = null;
    const finalPointScore = { playerPoints: p, opponentPoints: o };

    if ((p >= target || o >= target) && Math.abs(p - o) >= winBy) {
      gameWonBy = p > o ? 'player' : 'opponent';
      if (gameWonBy === 'player') {
        this.score.playerGames += 1;
      } else {
        this.score.opponentGames += 1;
      }
      this.score.playerPoints = 0;
      this.score.opponentPoints = 0;
      this.score.server = gameWonBy;
      this.score.serviceSide = 'right';
      this.score.handOutJustOccurred = false;

      if (
        this.score.playerGames >= this.gamesToWin ||
        this.score.opponentGames >= this.gamesToWin
      ) {
        matchWonBy = this.score.playerGames > this.score.opponentGames ? 'player' : 'opponent';
      }
    }

    return {
      pointScored,
      serviceChanged,
      gameWonBy,
      matchWonBy,
      finalPointScore,
      score: { ...this.score }
    };
  }

  formatScoreHUD() {
    const p = String(this.score.playerPoints).padStart(2, '0');
    const o = String(this.score.opponentPoints).padStart(2, '0');
    const target = this.getTargetPointsToWinGame();
    const isDeuce =
      this.scoringMode !== 'ARCADE_5' &&
      this.score.playerPoints >= target - 1 &&
      this.score.opponentPoints >= target - 1 &&
      this.score.playerPoints === this.score.opponentPoints;

    return {
      playerScoreText: p,
      opponentScoreText: o,
      deuceLabel: isDeuce ? `${this.score.playerPoints}-ALL` : null,
      bannerScoreText: this.score.handOutJustOccurred
        ? `Handout • ${this.score.playerPoints} - ${this.score.opponentPoints}`
        : `${this.score.playerPoints} - ${this.score.opponentPoints}`
    };
  }

  /**
   * Builds an authentic WSF/PSA Squash Referee spoken callout string.
   * Examples:
   *   - "Down! Handout, five-four."
   *   - "Not up! Six-four."
   *   - "Out! Handout, three all."
   *   - "Nick! Eight-six, game ball."
   */
  formatRefereeCallout(outcome = {}, reason = '') {
    const numToWord = (n) => {
      const words = [
        'love', 'one', 'two', 'three', 'four', 'five', 'six',
        'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
        'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen',
        'eighteen', 'nineteen', 'twenty'
      ];
      return words[n] ?? String(n);
    };

    const parts = [];
    const r = String(reason || '').toLowerCase();

    // 1. Fault / Winner Call Prefix
    if (r.includes('foot fault')) {
      parts.push('Foot fault!');
    } else if (r.includes('wrong box') || r.includes('serve fault') || r.includes('fault')) {
      parts.push('Fault!');
    } else if (r.includes('tin') || r.includes('down')) {
      parts.push('Down!');
    } else if (r.includes('out')) {
      parts.push('Out!');
    } else if (r.includes('not up') || r.includes('two bounces') || r.includes('short')) {
      parts.push('Not up!');
    } else if (r.includes('nick')) {
      parts.push('Nick!');
    } else if (r.includes('stroke')) {
      parts.push('Stroke!');
    } else if (r.includes('let')) {
      parts.push('Yes, let!');
    }

    // 2. Match / Game completion
    if (outcome.matchWonBy) {
      const winnerPts = outcome.finalPointScore
        ? Math.max(outcome.finalPointScore.playerPoints, outcome.finalPointScore.opponentPoints)
        : 11;
      const loserPts = outcome.finalPointScore
        ? Math.min(outcome.finalPointScore.playerPoints, outcome.finalPointScore.opponentPoints)
        : 0;
      parts.push(`Game and match! ${numToWord(winnerPts)}-${numToWord(loserPts)}.`);
      return parts.join(' ');
    }

    if (outcome.gameWonBy) {
      const winnerPts = outcome.finalPointScore
        ? Math.max(outcome.finalPointScore.playerPoints, outcome.finalPointScore.opponentPoints)
        : 11;
      const loserPts = outcome.finalPointScore
        ? Math.min(outcome.finalPointScore.playerPoints, outcome.finalPointScore.opponentPoints)
        : 0;
      parts.push(`Game! ${numToWord(winnerPts)}-${numToWord(loserPts)}.`);
      return parts.join(' ');
    }

    // 3. Handout + Server-First Score Callout
    const server = this.score.server || 'player';
    const serverPts = server === 'player' ? this.score.playerPoints : this.score.opponentPoints;
    const receiverPts = server === 'player' ? this.score.opponentPoints : this.score.playerPoints;

    const scorePhrase =
      serverPts === receiverPts
        ? `${numToWord(serverPts)} all`
        : `${numToWord(serverPts)}-${numToWord(receiverPts)}`;

    if (outcome.serviceChanged || this.score.handOutJustOccurred) {
      parts.push(`Handout, ${scorePhrase}.`);
    } else {
      parts.push(`${scorePhrase.charAt(0).toUpperCase() + scorePhrase.slice(1)}.`);
    }

    // 4. High Stakes Suffix (Game Ball / Match Ball)
    const highStakes = this.getHighStakesLabel();
    if (highStakes) {
      parts.push(`${highStakes}!`);
    }

    return parts.join(' ');
  }

  getHighStakesLabel() {
    const target = this.getTargetPointsToWinGame();
    const winBy = this.scoringMode === 'ARCADE_5' ? 1 : 2;
    const p = this.score.playerPoints;
    const o = this.score.opponentPoints;

    const pAtGamePt = p >= target - 1 && p - o >= winBy - 1;
    const oAtGamePt = o >= target - 1 && o - p >= winBy - 1;

    if (pAtGamePt) {
      return this.score.playerGames + 1 >= this.gamesToWin ? 'Match Ball' : 'Game Ball';
    }
    if (oAtGamePt) {
      return this.score.opponentGames + 1 >= this.gamesToWin ? 'Match Ball' : 'Game Ball';
    }
    return null;
  }
}

export default RulesEngine;

