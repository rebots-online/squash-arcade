// ============================================================================
// ARGON SQUASH — PHYSICAL CHESS OPPONENT AI
// Implements Section 4 & Milestone E:
//   - Pattern-memory window (can be lulled into a deep straight-drive rhythm)
//   - Preparation reading & split-step reaction lag when player disguises a shot
//   - Respects identical physical speed, acceleration, and T-recovery rules
//   - Tactically mixes deep rails, cross-courts, boasts, drops, and volley kills
// ============================================================================

import * as THREE from 'three';
import { COURT_SPECS } from './CourtGeometry.js';
import { PlayerMovement } from './PlayerMovement.js';
import { SQUASH_SHOT_TYPES } from './ShotController.js';

export class OpponentAI {
  constructor(role = 'opponent', randomSource = Math.random) {
    this.role = role;
    this.randomSource = randomSource;
    this.resetMemory();
  }

  resetMemory() {
    this.playerShotHistory = []; // Rolling window of opponent shot types & depths
    this.ownShotHistory = [];    // Rolling window of this AI's own recent shots to prevent ruts
    this.anticipatedBiasZ = 0;   // Positive = leaning deep behind T; Negative = creeping forward
    this.anticipatedBiasX = 0;
    this.reactionTimerSec = 0;   // Split-step delay when caught wrong-footed or disguised
    this.currentIntercept = new THREE.Vector3(0, 0.8, 1.8);
    this.hasValidIntercept = false;
    this.lastObservedStrokeCount = -1;
    this.lastLetAppealStroke = -1;
  }

  /**
   * Records a shot struck by the other player to update the AI's short-term pattern memory.
   */
  recordPlayerShot(shotResult, ballState, params = {}) {
    const ma = params.movementAndAI || {};
    const maxWindow = Math.max(1, Number(ma.aiPatternMemoryLength ?? 4));
    const antStrength = Number(ma.aiAnticipationStrength ?? 0.68);
    const baseDelaySec = Number(ma.aiReactionDelayMs ?? 195) / 1000;

    const isDeepDrive =
      shotResult.shotId === SQUASH_SHOT_TYPES.STRAIGHT_DRIVE ||
      shotResult.shotId === SQUASH_SHOT_TYPES.CROSS_DRIVE ||
      shotResult.shotId === SQUASH_SHOT_TYPES.OFF_BACK_WALL_DRIVE ||
      shotResult.shotId === SQUASH_SHOT_TYPES.HIGH_LOB;

    const isShortAttack =
      shotResult.shotId === SQUASH_SHOT_TYPES.DISGUISED_DROP ||
      shotResult.shotId === SQUASH_SHOT_TYPES.COUNTER_DROP ||
      shotResult.shotId === SQUASH_SHOT_TYPES.TWO_WALL_BOAST ||
      shotResult.shotId === SQUASH_SHOT_TYPES.BACK_WALL_BOAST ||
      shotResult.shotId === SQUASH_SHOT_TYPES.VOLLEY_KILL;

    // Check if the AI was lulled into expecting a deep drive and got hit with a disguised or sudden short shot!
    const recentDeepCount = this.playerShotHistory.filter((s) => s.isDeepDrive).length;
    const wasLulledDeep = recentDeepCount >= 2 && (this.anticipatedBiasZ > 0.18 || isShortAttack);
    const sideSwitched =
      this.playerShotHistory.length > 0 &&
      this.playerShotHistory[this.playerShotHistory.length - 1].sideX !== Math.sign(ballState.pos.x || 1);

    if (isShortAttack && (shotResult.isDisguised || wasLulledDeep)) {
      // Caught wrong-footed by disguise or sudden pattern break!
      this.reactionTimerSec = baseDelaySec * (1.45 + antStrength * 0.55);
    } else if (isShortAttack && sideSwitched) {
      this.reactionTimerSec = baseDelaySec * 1.15;
    } else {
      this.reactionTimerSec = baseDelaySec * 0.52;
    }

    this.playerShotHistory.push({
      shotId: shotResult.shotId,
      isDeepDrive,
      isShortAttack,
      sideX: Math.sign(ballState.pos.x || 1)
    });
    while (this.playerShotHistory.length > maxWindow) {
      this.playerShotHistory.shift();
    }

    // Recompute anticipation bias around the T for the NEXT rally exchange
    const deepRatio =
      this.playerShotHistory.filter((s) => s.isDeepDrive).length /
      Math.max(1, this.playerShotHistory.length);
    const shortRatio =
      this.playerShotHistory.filter((s) => s.isShortAttack).length /
      Math.max(1, this.playerShotHistory.length);

    const creepScale = Number(ma.aiFrontCourtCreep ?? 0.38);
    this.anticipatedBiasZ = (deepRatio * 0.62 - shortRatio * creepScale) * antStrength;
    this.anticipatedBiasX = (this.randomSource() - 0.5) * 0.28;
  }

  /**
   * Reads the other player's live preparation windup before contact.
   * When the hitter coils into a full backswing, the AI shifts slightly deeper
   * anticipating a hard drive—setting up the tactical payoff of a disguised drop.
   */
  observePlayerPreparation(opponentActor, playerActor, prepState, params = {}) {
    if (!prepState || !prepState.active) return;
    const selfRole = opponentActor?.role || this.role || 'opponent';
    const antStrength = Number(params.movementAndAI?.aiAnticipationStrength ?? 0.68);
    if (prepState.chargeNormalized > 0.55) {
      const tPos = PlayerMovement.getTRecoveryPosition(params, selfRole);
      const driftZ = 0.35 * prepState.chargeNormalized * antStrength;
      opponentActor.targetPos.set(
        tPos.x - Math.sign(playerActor.pos.x || 1) * 0.25,
        0,
        THREE.MathUtils.clamp(tPos.z + this.anticipatedBiasZ + driftZ, -1.5, 3.2)
      );
    }
  }

  /**
   * Updates AI target position and decides when/how to strike the ball.
   * Works for either 'opponent' or 'player' actor (enabling AI vs AI spectator matches).
   */
  updateAI({
    opponent,
    player,
    ball,
    dt,
    params,
    predictedTrajectory,
    rulesEngine = null,
    onCallAILet = null,
    onExecuteAIShot
  }) {
    if (!ball || !ball.inPlay || !opponent) return;
    const selfRole = opponent.role || this.role || 'opponent';

    // 1. If this AI actor just hit the ball -> Recover toward the T (with pattern-memory bias)
    if (ball.lastHitter === selfRole) {
      opponent.strokeWindupYaw = 0;
      const tPos = PlayerMovement.getTRecoveryPosition(params, selfRole);
      // Yield clearance: recover on the far side of the ball's lane and hang
      // slightly deep — dead-center T-homing parks the body on the receiver's
      // run line and spams lets.
      const yieldSide = ball.pos.x >= 0 ? -1 : 1;
      opponent.targetPos.set(
        THREE.MathUtils.clamp(tPos.x + this.anticipatedBiasX + yieldSide * 0.55, -1.8, 1.8),
        0,
        THREE.MathUtils.clamp(tPos.z + this.anticipatedBiasZ + 0.22, -1.2, 3.1)
      );
      return;
    }

    // 2. Other player hit the ball -> This AI actor is Receiver
    if (this.reactionTimerSec > 0) {
      this.reactionTimerSec = Math.max(0, this.reactionTimerSec - dt);
      return;
    }

    const willComeOffBackWall = Boolean(
      predictedTrajectory?.willHitBackWallBeforeSecondBounce &&
        predictedTrajectory?.optimalBackWallStrikePos
    );

    // Update target intercept from predicted trajectory (preferring rising Off-Back-Wall pocket on deep drives!)
    if (ball.hitBackWallThisShot && ball.vel.z < 0) {
      this.currentIntercept.copy(ball.pos);
      const spacingX = this.currentIntercept.x >= 0 ? -0.38 : 0.38;
      opponent.targetPos.set(
        THREE.MathUtils.clamp(this.currentIntercept.x + spacingX, -2.78, 2.78),
        0,
        THREE.MathUtils.clamp(this.currentIntercept.z + 0.12, -3.9, 4.45)
      );
    } else if (willComeOffBackWall) {
      this.currentIntercept.copy(predictedTrajectory.optimalBackWallStrikePos);
      const spacingX = this.currentIntercept.x >= 0 ? -0.38 : 0.38;
      opponent.targetPos.set(
        THREE.MathUtils.clamp(this.currentIntercept.x + spacingX, -2.78, 2.78),
        0,
        THREE.MathUtils.clamp(this.currentIntercept.z + 0.12, -3.9, 4.45)
      );
    } else if (predictedTrajectory && predictedTrajectory.samples?.length > 0) {
      const viableSample =
        predictedTrajectory.samples.find(
          (s) => s.pos.z > -3.2 && s.pos.y >= 0.30 && s.pos.y <= 1.32 && s.bounceCount >= 1
        ) ||
        (predictedTrajectory.firstFloorBouncePos
          ? { pos: predictedTrajectory.firstFloorBouncePos }
          : predictedTrajectory.samples[predictedTrajectory.samples.length - 1]);

      if (viableSample && viableSample.pos) {
        this.currentIntercept.copy(viableSample.pos);
        const spacingX = this.currentIntercept.x >= 0 ? -0.38 : 0.38;
        opponent.targetPos.set(
          THREE.MathUtils.clamp(this.currentIntercept.x + spacingX, -2.78, 2.78),
          0,
          THREE.MathUtils.clamp(this.currentIntercept.z + 0.15, -3.9, 4.45)
        );
      }
    }

    // TASK-23: pace the approach so arrival coincides with contact — staged
    // target behind the ball's line, never arrive-plant-wait at intercept.
    {
      const tContact = PlayerMovement._estimateContactTimeSec(
        predictedTrajectory,
        this.currentIntercept,
        ball
      );
      PlayerMovement._applyTimedArrival(opponent, this.currentIntercept, tContact, params);
    }

    // 3. Check if ball has already struck the front wall and is within physical strike reach
    if (!ball.hitFrontWallThisShot || opponent.swingCooldown > 0) return;

    // Authentic Squash Off-the-Back-Wall Discipline:
    if (willComeOffBackWall && !ball.hitBackWallThisShot && ball.pos.z > 0.85 && ball.vel.z > 2.2) {
      return;
    }

    if (
      ball.hitBackWallThisShot &&
      ball.vel.z < 0 &&
      COURT_SPECS.BACK_WALL_Z - ball.pos.z < 0.32 &&
      ball.vel.y > 0.45
    ) {
      return;
    }

    const distXZ = Math.hypot(ball.pos.x - opponent.pos.x, ball.pos.z - opponent.pos.z);
    const reachableY = ball.pos.y >= 0.12 && ball.pos.y <= 2.15;
    const isComingOffBackWall = Boolean(ball.hitBackWallThisShot && ball.vel.z < 0);
    const movingTowardBackOrSlow =
      isComingOffBackWall || ball.vel.z > -2.5 || ball.bounceCountOnFloor >= 1;

    // TASK-23b position-relative patience: a high, fresh ball reached early is
    // a suboptimal contact point — wait for it to drop/sit up into the strike
    // pocket where the left-to-right angles open up. A volley is still correct
    // ONLY when it deliberately applies time pressure: hitter stranded deep.
    const poachVolleyAppliesPressure =
      ball.bounceCountOnFloor === 0 &&
      ball.pos.y > 1.02 &&
      ball.pos.y <= 1.9 &&
      ball.pos.z < 1.4 &&
      (player?.pos?.z ?? 0) > 1.6;
    const highBall = ball.pos.y > 1.02;
    const comingOffBackGlass = ball.hitBackWallThisShot && ball.vel.z < 0;
    // Off the back glass: wait for it to sit up and start coming down, then
    // strike on the upswing — that's what drives it back deep for the
    // T -> back-corner -> T cycling pattern.
    const sittingUpLowOrDropping =
      ball.pos.y <= 0.72 || (ball.pos.y < 1.15 && ball.vel.y < -0.35);
    const suboptimalContact =
      (ball.bounceCountOnFloor === 0 && highBall && !poachVolleyAppliesPressure) ||
      (comingOffBackGlass && !sittingUpLowOrDropping);
    if (suboptimalContact) return;

    if (distXZ <= 1.72 && reachableY && movingTowardBackOrSlow) {
      // Check if AI is obstructed by the other player and should call a Let (WSF Rule 8/9 safety)
      if (
        rulesEngine &&
        typeof onCallAILet === 'function' &&
        this.lastLetAppealStroke !== ball.rallyStrokeCount
      ) {
        // Positional signature: evaluateInterference(receiverActor, hitterActor, ball)
        // — receiver is this AI actor, hitter is the other actor.
        const interference = rulesEngine.evaluateInterference(opponent, player, ball);
        if (interference && interference.interference) {
          this.lastLetAppealStroke = ball.rallyStrokeCount;
          // 78% of the time the AI stops play safely and appeals for Let; 22% it tries to play around
          if (this.randomSource() < 0.78) {
            onCallAILet(selfRole, interference);
            return;
          }
        }
      }

      const choice = this.chooseTacticalShot({ opponent, player, ball, params, distXZ });
      if (typeof onExecuteAIShot === 'function') {
        onExecuteAIShot(choice);
      }
    }
  }

  /**
   * Chooses a varied, tactical squash shot based on court geometry, opponent position,
   * recent shot history (preventing repetitive ruts), and realistic pressure/error rates.
   */
  chooseTacticalShot({ opponent, player, ball, params = {}, distXZ = 1.0 }) {
    const aggression = Number(params.movementAndAI?.aiAggression ?? 0.58);
    const playerDistFromFront = player.pos.z - COURT_SPECS.FRONT_WALL_Z;
    const playerLateralGap = Math.abs(player.pos.x - opponent.pos.x);
    const isFrontCourtBall = ball.pos.z < 1.05;
    const isHighVolley = ball.bounceCountOnFloor === 0 && ball.pos.y > 1.08 && ball.pos.z < 1.25;
    const isComingOffBackWall = Boolean(ball.hitBackWallThisShot && ball.vel.z < 0);
    const rallyStrokes = Number(ball.rallyStrokeCount || 0);

    // Count consecutive drives by this AI so it never gets stuck in a monotonous rut
    let consecutiveDrives = 0;
    for (let i = this.ownShotHistory.length - 1; i >= 0; i--) {
      const t = this.ownShotHistory[i];
      if (t === 'topspin' || t === 'cross') consecutiveDrives++;
      else break;
    }
    const lastOwnShot = this.ownShotHistory[this.ownShotHistory.length - 1] || '';

    // Determine pressure / stretch factor for realistic unforced or forced mistakes (Tin or Out)
    const isUnderStretch = distXZ > 1.32 || ball.pos.y < 0.42 || this.reactionTimerSec > 0.01;
    const rallyFatigueFactor = Math.min(0.08, Math.max(0, (rallyStrokes - 4) * 0.012));
    const baseErrorChance = (isUnderStretch ? 0.095 : 0.045) + rallyFatigueFactor;

    let decision = null;

    // 1. Force a pattern-breaker if we've hit 2+ drives in a row or the rally is getting long!
    const shouldBreakRut =
      consecutiveDrives >= 2 ||
      (rallyStrokes >= 4 && this.randomSource() < 0.52) ||
      this.randomSource() < 0.34;
    if (isComingOffBackWall) {
      // Corner-cycling: off the back glass the deep counter-drive back into
      // the same corner is the backbone (~55%), with cross drives, lobs,
      // boasts and disguised drops mixing it up — legible but not invariant.
      const roll = this.randomSource();
      const sameCornerDir = ball.pos.x >= 0 ? 0.34 : -0.34;
      if (roll < 0.55) {
        // Deep counter-drive back into the SAME back corner — the cycling backbone
        decision = {
          shotType: 'topspin',
          speed: 1.18 + this.randomSource() * 0.16,
          dirX: sameCornerDir,
          prepCharge: 0.85
        };
      } else if (roll < 0.7) {
        // Cross-court drive — still deep, flips the corner
        decision = {
          shotType: 'cross',
          speed: 1.15 + this.randomSource() * 0.14,
          dirX: -sameCornerDir * 1.85,
          prepCharge: 0.82
        };
      } else if (roll < 0.82) {
        decision = {
          shotType: 'lob',
          speed: 1.06,
          dirX: ball.pos.x >= 0 ? -0.58 : 0.58,
          prepCharge: 0.65
        };
      } else if (roll < 0.91) {
        decision = {
          shotType: 'boast',
          speed: 1.18,
          dirX: ball.pos.x >= 0 ? 0.82 : -0.82,
          prepCharge: 0.76
        };
      } else {
        decision = {
          shotType: 'disguised_drop',
          cutModifier: true,
          speed: 0.92,
          dirX: -sameCornerDir * 1.8,
          prepCharge: 0.85
        };
      }
    } else if (isHighVolley && this.randomSource() < Math.max(0.48, aggression * 0.88)) {
      // 2. High loose ball in mid/front court -> Aggressive Volley Kill or Volley Drop!
      const useVolleyDrop = this.randomSource() < 0.35;
      decision = useVolleyDrop
        ? {
            shotType: 'disguised_drop',
            cutModifier: true,
            speed: 0.86,
            dirX: ball.pos.x >= 0 ? 0.68 : -0.68,
            prepCharge: 0.78
          }
        : {
            shotType: 'kill',
            speed: 1.34 + this.randomSource() * 0.12,
            dirX: (this.randomSource() < 0.4 ? -1 : 1) * (ball.pos.x >= 0 ? 0.72 : -0.72),
            prepCharge: 0.42
          };
    } else if (
      (playerDistFromFront > 5.15 && isFrontCourtBall) ||
      (shouldBreakRut && ball.pos.z < 2.2)
    ) {
      // 3. Opponent is around/behind the T or we are breaking a drive rhythm -> Attack the front corners!
      const roll = this.randomSource();
      if (roll < 0.44) {
        decision = {
          shotType: 'disguised_drop',
          cutModifier: true,
          speed: 0.86 + this.randomSource() * 0.08,
          dirX: (this.randomSource() < 0.3 ? -1 : 1) * (ball.pos.x >= 0 ? 0.62 : -0.62),
          prepCharge: 0.88 // Full backswing disguise!
        };
      } else if (roll < 0.76) {
        decision = {
          shotType: 'boast',
          speed: 1.16 + this.randomSource() * 0.08,
          dirX: ball.pos.x >= 0 ? 0.78 : -0.78,
          prepCharge: 0.75
        };
      } else if (roll < 0.90) {
        decision = {
          shotType: 'kill',
          speed: 1.32,
          dirX: ball.pos.x >= 0 ? -0.68 : 0.68,
          prepCharge: 0.55
        };
      } else {
        decision = {
          shotType: 'lob',
          speed: 1.05,
          dirX: ball.pos.x >= 0 ? -0.65 : 0.65,
          prepCharge: 0.70
        };
      }
    } else if ((ball.pos.z > 1.55 && Math.abs(ball.pos.x) > 1.45) || shouldBreakRut) {
      // 4. Rear/mid corners or tactical mixup -> Boasts, Back-Wall Boasts, High Lobs, or Drops
      const isTrappedAtBack = opponent.pos.z >= 3.15 || ball.pos.z >= 3.05;
      const roll = this.randomSource();
      if (roll < 0.42) {
        decision = {
          shotType: isTrappedAtBack ? 'back_wall_boast' : 'boast',
          speed: 1.16,
          dirX: ball.pos.x >= 0 ? 0.85 : -0.85,
          prepCharge: 0.68
        };
      } else if (roll < 0.68) {
        decision = {
          shotType: 'disguised_drop',
          cutModifier: true,
          speed: 0.88,
          dirX: ball.pos.x >= 0 ? 0.58 : -0.58,
          prepCharge: 0.84
        };
      } else if (roll < 0.85) {
        decision = {
          shotType: 'lob',
          speed: 1.06,
          dirX: ball.pos.x >= 0 ? -0.62 : 0.62,
          prepCharge: 0.64
        };
      }
    }

    // 5. Fallback Drive (alternating Cross-Court and Straight Rail so it doesn't repeat the same rail)
    if (!decision) {
      const preferCross =
        lastOwnShot === 'topspin'
          ? this.randomSource() < 0.64
          : playerLateralGap < 0.95 && this.randomSource() < 0.48;
      decision = {
        shotType: preferCross ? 'cross' : 'topspin',
        speed: 1.12 + this.randomSource() * 0.16,
        dirX: preferCross
          ? (ball.pos.x >= 0 ? -0.58 : 0.58)
          : (ball.pos.x >= 0 ? 0.35 : -0.35),
        prepCharge: 0.78
      };
    }

    // Record in ownShotHistory (keep last 5)
    this.ownShotHistory.push(decision.shotType);
    if (this.ownShotHistory.length > 5) {
      this.ownShotHistory.shift();
    }

    // 6. Occasional Realistic Mistake (Tin or Out) or Razor-Thin Winner Margin!
    const isAttackingLowShot =
      decision.shotType === 'disguised_drop' ||
      decision.shotType === 'drop' ||
      decision.shotType === 'kill' ||
      decision.shotType === 'boast';
    const isHighOrHardShot =
      decision.shotType === 'lob' ||
      decision.shotType === 'cross' ||
      decision.shotType === 'topspin';

    const errorRoll = this.randomSource();
    if (isAttackingLowShot && errorRoll < baseErrorChance * 1.15) {
      // Clips the Tin when going for too thin a margin on a drop/kill/boast!
      decision.aiErrorMode = 'TIN';
    } else if (isHighOrHardShot && errorRoll < baseErrorChance * 0.85) {
      // Overhits above the Front-Wall Out Line (4.57m) or Side-Wall Out Line under pressure!
      decision.aiErrorMode = 'OUT';
    } else if (isAttackingLowShot && this.randomSource() < 0.38) {
      // Razor-sharp nick/winner target!
      decision.aiWinnerMargin = true;
    }

    return decision;
  }
}

export default OpponentAI;

