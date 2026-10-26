import { selectVolleyTargetCorner } from './VolleyPlanner.js';
// ============================================================================
// ARGON SQUASH — SHOT CONTROLLER (DECOUPLED PREPARATION vs EXECUTION)
// Separates Backswing Preparation (Hold / Disguise) from Contact Execution
// (Racket-Face Cut Angle, Forearm Pronation, Swing Velocity, and Aim).
//
// Core Invariant (Section 5):
//   Do NOT equate long charging with power and short charging with drops.
//   A player can hold a full backswing preparation and execute a feather-soft
//   disguised drop (+36° cut) OR snap an aggressive volley kill from minimal prep.
// ============================================================================

import * as THREE from 'three';
import { COURT_SPECS } from './CourtGeometry.js';
import { BallPhysics } from './BallPhysics.js';
import { ShotTrajectorySolver } from './ShotTrajectorySolver.js';

export const SQUASH_SHOT_TYPES = Object.freeze({
  STRAIGHT_DRIVE: 'STRAIGHT_DRIVE',
  CROSS_DRIVE: 'CROSS_DRIVE',
  OFF_BACK_WALL_DRIVE: 'OFF_BACK_WALL_DRIVE',
  VOLLEY_KILL: 'VOLLEY_KILL',
  DISGUISED_DROP: 'DISGUISED_DROP',
  COUNTER_DROP: 'COUNTER_DROP',
  TWO_WALL_BOAST: 'TWO_WALL_BOAST',
  BACK_WALL_BOAST: 'BACK_WALL_BOAST',
  HIGH_LOB: 'HIGH_LOB',
  SERVE: 'SERVE'
});

const LOB_CORNER_REF = Object.freeze({ x: 2.75, z: 4.45 }); // x is mirrored per corner
const LOB_T_BAND_Z = Object.freeze([0.5, 2.5]);
const LOB_T_BAND_CLEARANCE_M = 2.6;
const LOB_OVERHIT_PACE_SCALE = 1.14;
const LOB_FRONT_HEIGHTS = Object.freeze([4.42, 4.15, 3.8, 3.4, 3.0, 2.5, 1.9]);

export class ShotController {
  constructor(randomSource = Math.random) {
    this.randomSource = randomSource;
    this.prepStates = {
      player: this._createPrepState(),
      opponent: this._createPrepState()
    };
  }

  _createPrepState() {
    return {
      active: false,
      startedAt: 0,
      durationSec: 0,
      chargeNormalized: 0, // 0..1 backswing coil (visual posture & disguise)
      intendedFaceMode: 'AUTO', // 'AUTO' | 'DRIVE_FLAT' | 'OPEN_CUT' | 'BOAST_ANGLE' | 'LOB_LIFT'
      aimBiasX: 0
    };
  }

  getPrepState(role = 'player') {
    return this.prepStates[role] || this.prepStates.player;
  }

  beginPreparation(role = 'player', nowSec = 0, options = {}) {
    const st = this.getPrepState(role);
    st.active = true;
    st.startedAt = nowSec;
    st.durationSec = 0;
    st.chargeNormalized = 0.15;
    if (options.faceMode) st.intendedFaceMode = options.faceMode;
    return st;
  }

  updatePreparation(role = 'player', dt = 0.016, params = {}) {
    const st = this.getPrepState(role);
    if (!st.active) return st;
    const fullSec = Number(params.shotMechanics?.prepFullChargeSec ?? 0.42);
    st.durationSec += dt;
    st.chargeNormalized = Math.min(1.0, st.durationSec / Math.max(0.1, fullSec));
    return st;
  }

  clearPreparation(role = 'player') {
    const st = this.getPrepState(role);
    const snapshot = { ...st };
    st.active = false;
    st.durationSec = 0;
    st.chargeNormalized = 0;
    return snapshot;
  }

  /**
   * Computes a legal squash serve from the Left or Right Service Box onto the
   * Front Wall above the Service Line (Y > 1.78m) rebounding into the opposite
   * rear quarter court.
   */
  computeServeExecution({ actor, serviceSide = 'right', inputEvent = {}, params = {} }) {
    const sm = params.shotMechanics || {};
    const speedMult = THREE.MathUtils.clamp(Number(inputEvent.speed ?? 1.15), 0.85, 1.55);
    const isLeftBox = serviceSide === 'left';
    const targetSideSign = isLeftBox ? 1 : -1; // Serve cross-court to opposite rear quarter

    const startPos = actor.pos.clone().add(new THREE.Vector3(isLeftBox ? 0.25 : -0.25, 1.18, -0.18));
    const frontWallHitX = targetSideSign * (0.45 + Math.abs(Number(inputEvent.dirX || 0)) * 0.65);
    const frontWallHitY = inputEvent.shotType === 'lob' ? 3.25 : 2.38;
    const dz = COURT_SPECS.FRONT_WALL_Z - startPos.z;
    const dx = frontWallHitX - startPos.x;
    const dy = frontWallHitY - startPos.y;

    const flightToWallSec = THREE.MathUtils.clamp(0.32 / Math.pow(speedMult, 0.7), 0.22, 0.42);
    const g = Number(params.ballPhysics?.gravity ?? 9.81);

    const vx = dx / flightToWallSec;
    const vz = dz / flightToWallSec;
    const vy = (dy + 0.5 * g * flightToWallSec * flightToWallSec) / flightToWallSec;

    return {
      shotId: SQUASH_SHOT_TYPES.SERVE,
      label: inputEvent.shotType === 'lob' ? 'LOB SERVE' : 'CRISP SERVE',
      vel: new THREE.Vector3(vx, vy, vz),
      spin: new THREE.Vector3(6, targetSideSign * 4, 0),
      cutAngleDeg: 8,
      forearmPronationDegPerSec: 420 * speedMult,
      isDisguised: false,
      timingGrade: 'SWEET SPOT',
      speedKmh: Math.round(Math.hypot(vx, vy, vz) * 3.6)
    };
  }

  /**
   * Resolves the squash stroke at impact by combining:
   * 1. Preparation State (was the player coiled in a full windup?)
   * 2. Racket-Face Orientation & Cut Angle (Open Cut vs Flat Drive vs Boast vs Lob)
   * 3. Swing Velocity & Contact Height (Volley vs Low Corner Recovery)
   * 4. Timing Quality (Early Cross / Sweet Spot Tight / Late Straight)
   */
  computeShotExecution({
    actor,
    ball,
    opponent,
    inputEvent = {},
    prepSnapshot = null,
    params = {}
  }) {
    const sm = params.shotMechanics || {};
    const bp = params.ballPhysics || {};
    const g = Number(bp.gravity ?? 9.81);
    const spinScale = Number(sm.spinMagnitudeScale ?? 1.0);
    const assist = THREE.MathUtils.clamp(Number(sm.placementAssistStrength ?? 0.45), 0, 1);

    const prepCharge = prepSnapshot
      ? prepSnapshot.chargeNormalized
      : Number(inputEvent.prepCharge ?? 0.45);

    const contactPos = ball.pos.clone();
    contactPos.y = THREE.MathUtils.clamp(contactPos.y, COURT_SPECS.BALL_RADIUS * 1.65, Number(sm.contactHeightReachMeters ?? 2.15));

    const playerSideSign = contactPos.x >= 0 ? 1 : -1;
    const isVolley = (ball.bounceCountOnFloor || 0) === 0;
    const isDeepBackCorner = contactPos.z > 2.65 && Math.abs(contactPos.x) > 1.55;
    const isOffBackWall = Boolean(ball.hitBackWallThisShot && ball.vel.z < 0);
    const isRisingOffBackWall = Boolean(isOffBackWall && ball.vel.y >= -0.35);

    // Determine desired tactical family from explicit modifier, gesture kinematics, or shot mode
    const rawRequested = String(inputEvent.shotType || '').toLowerCase();
    const isCutModifier =
      !!inputEvent.cutModifier ||
      rawRequested === 'slice' ||
      rawRequested === 'drop' ||
      rawRequested === 'disguised_drop' ||
      (!rawRequested && Number(inputEvent.dirY ?? 0) > 0.25 && Number(inputEvent.speed ?? 1.0) < 1.18);

    const isBoastRequest =
      rawRequested === 'boast' ||
      rawRequested === 'two_wall_boast' ||
      rawRequested === 'back_wall_boast' ||
      (!rawRequested && Math.abs(Number(inputEvent.dirX ?? 0)) > 0.72);

    const isLobRequest =
      rawRequested === 'lob' ||
      (!rawRequested && Number(inputEvent.dirY ?? 0) < -0.62 && !isVolley);

    const isKillRequest =
      rawRequested === 'smash' ||
      rawRequested === 'kill' ||
      (!rawRequested && isVolley && contactPos.y > 1.12 && Number(inputEvent.speed ?? 1.15) >= 1.25 && !isCutModifier);

    const isCrossRequest =
      rawRequested === 'cross' ||
      (Number(inputEvent.dirX ?? 0) * playerSideSign < -0.28 && !isBoastRequest);

    // Disguise detection: player held a full drive preparation (prepCharge >= 0.65)
    // and then opened the racket face into a soft cut/drop or boast!
    const isDisguised = prepCharge >= 0.65 && (isCutModifier || isBoastRequest);

    let shotId = SQUASH_SHOT_TYPES.STRAIGHT_DRIVE;
    let label = 'STRAIGHT DRIVE';
    let cutAngleDeg = Number(sm.defaultDriveCutDeg ?? 2.0);
    let forearmPronationDegPerSec = 540;
    let vel = new THREE.Vector3();
    let spin = new THREE.Vector3();
    let lobSolve = null;

    const dzToFront = COURT_SPECS.FRONT_WALL_Z - contactPos.z; // negative value

    const isTrappedAtBack =
      rawRequested === 'back_wall_boast' ||
      (contactPos.z >= 3.10 && !isOffBackWall && Math.abs(contactPos.x) > 1.15) ||
      (contactPos.z >= 3.48 && !isOffBackWall);

    if (isBoastRequest && isTrappedAtBack) {
      // --- BACK-WALL RECOVERY BOAST (Trapped at Back of Court -> Back Glass + Side Wall + Front Wall) ---
      shotId = SQUASH_SHOT_TYPES.BACK_WALL_BOAST;
      label = 'BACK-WALL BOAST';
      cutAngleDeg = 28;
      forearmPronationDegPerSec = 390;
      const dzToBack = Math.max(0.45, COURT_SPECS.BACK_WALL_Z - contactPos.z);
      // Launch into Back Glass Wall + Near Side Wall with sufficient pace & loft to reach Front Wall above Tin
      vel.set(
        playerSideSign * 6.8,
        5.15 + Math.max(0, (0.85 - contactPos.y) * 1.4),
        Math.max(33.5, 29.0 + dzToBack * 2.2)
      );
      spin.set(-14 * spinScale, playerSideSign * 8 * spinScale, 0);
    } else if (isBoastRequest) {
      // --- ATTACKING SIDEWALL -> FRONTWALL -> NICK BOAST ---
      shotId = SQUASH_SHOT_TYPES.TWO_WALL_BOAST;
      label = isDisguised
        ? 'DISGUISED NICK BOAST'
        : isOffBackWall
        ? 'OFF-BACK-WALL NICK BOAST'
        : 'SIDE-FRONT NICK BOAST';
      cutAngleDeg = 24;
      forearmPronationDegPerSec = 430;

      const boastSol = this._computeSideFrontNickBoastVector(contactPos, playerSideSign, params);
      vel.copy(boastSol.vel);
      spin.copy(boastSol.spin);
    } else if (isCutModifier) {
      // --- OPEN-FACED CUT DROP / DISGUISED HOLD-AND-DROP ---
      shotId = isDisguised ? SQUASH_SHOT_TYPES.DISGUISED_DROP : SQUASH_SHOT_TYPES.COUNTER_DROP;
      label = isDisguised
        ? 'DISGUISED DROP'
        : isOffBackWall
        ? 'BACK-WALL DROP'
        : isVolley
        ? 'VOLLEY DROP'
        : 'SOFT CUT DROP';
      cutAngleDeg = Number(sm.defaultDropCutDeg ?? 34.0);
      forearmPronationDegPerSec = 185; // Soft decelerated wrist with open face

      // Aim toward front corner nick zone
      const targetCornerSign =
        Math.abs(Number(inputEvent.dirX ?? 0)) > 0.25
          ? Math.sign(Number(inputEvent.dirX))
          : isVolley
          ? (inputEvent.volleyTargetCornerSign || selectVolleyTargetCorner(contactPos, opponent?.pos) || playerSideSign)
          : playerSideSign;
      const targetX = targetCornerSign * THREE.MathUtils.lerp(2.42, 2.68, assist);
      const targetFrontY = THREE.MathUtils.lerp(0.88, 0.82, assist);

      const dropSpeed = Number(sm.softDropSpeedMps ?? 11.4);
      const flightSec = THREE.MathUtils.clamp(Math.abs(dzToFront) / dropSpeed, 0.36, 0.62);
      const dx = targetX - contactPos.x;
      const dy = targetFrontY - contactPos.y;

      vel.set(
        dx / flightSec,
        (dy + 0.5 * g * flightSec * flightSec) / flightSec,
        dzToFront / flightSec
      );
      // Underspin (negative spin.x) makes the ball bite downward off the front wall toward the nick
      spin.set(-22 * spinScale, -targetCornerSign * 8 * spinScale, 0);
    } else if (isLobRequest) {
      // --- HIGH DEFENSIVE / ATTACKING LOB ---
      shotId = SQUASH_SHOT_TYPES.HIGH_LOB;
      label = isOffBackWall ? 'BACK-WALL LOB' : 'HIGH LOB';
      cutAngleDeg = Number(sm.lobLaunchAngleDeg ?? 38.0);
      forearmPronationDegPerSec = 240;

      // The flight starts at the actual contact, including high reachable volleys.
      contactPos.copy(ball.pos);
      const lobSol = this.solveCornerLob({
        contactPos,
        opponentPos: opponent?.pos,
        params
      });
      vel.copy(lobSol.vel);
      spin.copy(lobSol.spin);
      lobSolve = {
        solveStatus: lobSol.solveStatus,
        solvedContactY: lobSol.solvedContactY,
        paceMps: lobSol.paceMps,
        cornerSign: lobSol.cornerSign
      };
    } else if (isKillRequest) {
      // --- AGGRESSIVE VOLLEY KILL (Nick Hunter) ---
      shotId = SQUASH_SHOT_TYPES.VOLLEY_KILL;
      label = 'VOLLEY KILL';
      cutAngleDeg = 3.0;
      forearmPronationDegPerSec = 780;

      const targetCornerSign =
        Math.abs(Number(inputEvent.dirX ?? 0)) > 0.2
          ? Math.sign(Number(inputEvent.dirX))
          : playerSideSign;
      const targetX = targetCornerSign * THREE.MathUtils.lerp(2.58, 2.76, assist);
      const targetFrontY = THREE.MathUtils.lerp(0.72, 0.66, assist);
      const killSpeed = Number(sm.maxKillSpeedMps ?? 31.0);
      const flightSec = THREE.MathUtils.clamp(Math.abs(dzToFront) / killSpeed, 0.16, 0.28);

      const dx = targetX - contactPos.x;
      const dy = targetFrontY - contactPos.y;
      vel.set(
        dx / flightSec,
        (dy + 0.5 * g * flightSec * flightSec) / flightSec,
        dzToFront / flightSec
      );
      spin.set(10 * spinScale, -targetCornerSign * 6 * spinScale, 0);
    } else {
      // --- DEEP STRAIGHT DRIVE (TIGHT RAIL), CROSS-COURT DRIVE, OR RISING OFF-BACK-WALL DRIVE ---
      shotId = isOffBackWall
        ? SQUASH_SHOT_TYPES.OFF_BACK_WALL_DRIVE
        : isCrossRequest
        ? SQUASH_SHOT_TYPES.CROSS_DRIVE
        : SQUASH_SHOT_TYPES.STRAIGHT_DRIVE;

      if (isOffBackWall) {
        label = isRisingOffBackWall
          ? isCrossRequest
            ? 'RISING BACK-WALL CROSS'
            : 'RISING OFF-BACK-WALL DRIVE'
          : isCrossRequest
          ? 'OFF-BACK-WALL CROSS'
          : 'OFF-BACK-WALL DRIVE';
      } else {
        label = isCrossRequest ? 'CROSS-COURT DRIVE' : 'TIGHT RAIL DRIVE';
      }

      cutAngleDeg = Number(sm.defaultDriveCutDeg ?? 2.0);
      forearmPronationDegPerSec = isRisingOffBackWall ? 660 : 610;

      const railX = playerSideSign * THREE.MathUtils.lerp(2.65, 2.92, assist);
      const crossX = -playerSideSign * THREE.MathUtils.lerp(2.25, 2.65, assist);
      const targetX = isCrossRequest ? crossX : railX;

      // Hit high and crisp enough on the front wall (~1.68m - 1.98m) so a good drive carries deep
      // past the service box, bounces once in the back quarter, and reaches the Back Glass Wall!
      const risingBonus = isRisingOffBackWall ? 1.07 : 1.0;
      const baseSpeed =
        Number(sm.baseDriveSpeedMps ?? 24.5) *
        THREE.MathUtils.clamp(Number(inputEvent.speed ?? 1.12), 0.92, 1.32) *
        risingBonus;
      const targetFrontY = THREE.MathUtils.clamp(
        (isOffBackWall ? 1.82 : 1.72) + (24.5 / baseSpeed) * 0.22,
        1.42,
        2.28
      );
      const flightSec = THREE.MathUtils.clamp(Math.abs(dzToFront) / baseSpeed, 0.24, 0.44);

      const dx = targetX - contactPos.x;
      const dy = targetFrontY - contactPos.y;
      vel.set(
        dx / flightSec,
        (dy + 0.5 * g * flightSec * flightSec) / flightSec,
        dzToFront / flightSec
      );
      spin.set(14 * spinScale, 0, 0);
      if (isOffBackWall || isVolley) {
        vel.copy(this._computeBackWallDriveVelocity({ contactPos, spin, params, isCrossRequest }));
      }
    }

    // Apply realistic AI error modes (clipping the 0.48m Tin or overhitting above the 4.57m Out Line)
    // or razor-sharp winner margins when triggered by OpponentAI.
    // A lob's error perturbs the SOLVE OUTPUT (over-hit pace), never a wall aim;
    // physics decides where it goes and the status is re-derived from that ball.
    if (lobSolve) {
      if (inputEvent.aiErrorMode === 'OUT') {
        vel.multiplyScalar(LOB_OVERHIT_PACE_SCALE);
        lobSolve.paceMps *= LOB_OVERHIT_PACE_SCALE;
        Object.assign(
          lobSolve,
          this.classifyExecutedLob({ contactPos, vel, spin, cornerSign: lobSolve.cornerSign, params })
        );
        if (lobSolve.solveStatus === 'ATTEMPT_OUT') label = `${label} (OVERHIT OUT)`;
      }
    } else if (inputEvent.aiErrorMode === 'TIN' && dzToFront < -0.5) {
      const flightEst = Math.max(0.18, Math.abs(dzToFront) / Math.max(10, Math.abs(vel.z)));
      const tinTargetY = 0.24 + this.randomSource() * 0.18; // Hits squarely into the 0.48m Tin!
      vel.y = (tinTargetY - contactPos.y + 0.5 * g * flightEst * flightEst) / flightEst;
      label = `${label} (TIN ERROR)`;
    } else if (inputEvent.aiErrorMode === 'OUT' && dzToFront < -0.5) {
      const flightEst = Math.max(0.22, Math.abs(dzToFront) / Math.max(10, Math.abs(vel.z)));
      const outTargetY = COURT_SPECS.FRONT_WALL_OUT_Y + 0.14 + this.randomSource() * 0.32; // Above 4.57m Out line!
      vel.y = (outTargetY - contactPos.y + 0.5 * g * flightEst * flightEst) / flightEst;
      label = `${label} (OVERHIT OUT)`;
    } else if (inputEvent.aiExecution && inputEvent.aiWinnerMargin && dzToFront < -0.5 && !isBoastRequest) {
      const flightEst = Math.max(0.2, Math.abs(dzToFront) / Math.max(10, Math.abs(vel.z)));
      const lowWinnerY = 0.56 + this.randomSource() * 0.1; // Just above the 0.48m Tin for a dead nick/winner
      vel.y = (lowWinnerY - contactPos.y + 0.5 * g * flightEst * flightEst) / flightEst;
    }

    // A solved target is an intention: AI contact has small, bounded execution
    // variation. Humans and explicit mistake trajectories retain their inputs.
    const lowAttack = isCutModifier || isKillRequest || shotId === SQUASH_SHOT_TYPES.TWO_WALL_BOAST;
    let contactQuality = 1;
    const humanAttack = actor?.pos && lowAttack && !inputEvent.aiExecution && !inputEvent.aiErrorMode;
    if (humanAttack) {
      const lateral = Math.abs(contactPos.x - actor.pos.x);
      const forward = contactPos.z - actor.pos.z;
      const stretch = Math.max(0, Math.abs(lateral - .55) - .16) / .5;
      const timing = Math.max(0, Math.abs(forward + .25) - .12) / .65;
      const hurried = Math.max(0, Math.hypot(actor.vel?.x || 0, actor.vel?.z || 0) - 2) / 4;
      const height = Math.max(0, .4 - contactPos.y, contactPos.y - 1.7) / .7;
      contactQuality = 1 - THREE.MathUtils.clamp(Math.max(stretch, timing, hurried, height), 0, 1);
      // A late/stretched face opens up: a playable attack with more margin and
      // bounce, instead of automatic centimetre-perfect nick placement.
      vel.y += (1 - contactQuality) * 1.15;
      vel.multiplyScalar(1 + (1 - contactQuality) * .035);
    }
    if (inputEvent.aiExecution && lowAttack && !inputEvent.aiErrorMode) {
      const ma = params.movementAndAI || {};
      const yaw = THREE.MathUtils.degToRad((this.randomSource() * 2 - 1) * Number(ma.aiAttackYawDeg ?? 0.75));
      const elevation = THREE.MathUtils.degToRad((this.randomSource() * 2 - 1) * Number(ma.aiAttackElevationDeg ?? 0.5));
      const pace = 1 + (this.randomSource() * 2 - 1) * Number(ma.aiAttackPaceVariation ?? 0.02);
      const speed = vel.length() * pace;
      const azimuth = Math.atan2(vel.x, -vel.z) + yaw;
      const pitch = Math.atan2(vel.y, Math.hypot(vel.x, vel.z)) + elevation;
      vel.set(Math.sin(azimuth) * Math.cos(pitch), Math.sin(pitch), -Math.cos(azimuth) * Math.cos(pitch)).multiplyScalar(speed);
    }

    if (isVolley && !label.includes('VOLLEY')) label = `${isDisguised ? 'DISGUISED ' : ''}VOLLEY ${isCutModifier ? 'DROP' : label.replace('DISGUISED ', '')}`;
    const speedKmh = Math.round(vel.length() * 3.6);
    const forcedErrorMode = lobSolve ? null : inputEvent.aiErrorMode;
    const timingGradeBase =
      forcedErrorMode === 'TIN'
        ? 'CLIPPED TIN!'
        : forcedErrorMode === 'OUT'
        ? 'OVERHIT OUT!'
        : humanAttack
        ? contactQuality >= .9 ? 'BALANCED CONTACT ★' : contactQuality >= .55 ? 'LATE CONTACT • MORE MARGIN' : 'STRETCHED / RUSHED • LOOSE BALL'
        : isRisingOffBackWall
        ? 'RISING OFF BACK WALL ★'
        : isOffBackWall
        ? 'OFF BACK WALL RETURN'
        : isDisguised
        ? 'DISGUISED HOLD!'
        : Math.abs(cutAngleDeg) >= 24
        ? `OPEN CUT ${Math.round(cutAngleDeg)}°`
        : 'SWEET SPOT';
    const timingGrade = lobSolve
      ? `${timingGradeBase} • LOB ${lobSolve.solveStatus}${
          lobSolve.solvedContactY !== null ? ` @ ${lobSolve.solvedContactY.toFixed(2)}M` : ''
        }`
      : timingGradeBase;

    return {
      shotId,
      label,
      vel,
      spin,
      cutAngleDeg,
      forearmPronationDegPerSec,
      isDisguised,
      isVolley,
      contactQuality,
      isOffBackWall,
      isRisingOffBackWall,
      prepDurationSec: prepSnapshot ? prepSnapshot.durationSec : 0,
      timingGrade,
      speedKmh,
      solveStatus: lobSolve ? lobSolve.solveStatus : null,
      solvedContactY: lobSolve ? lobSolve.solvedContactY : null,
      lobPaceMps: lobSolve ? lobSolve.paceMps : null
    };
  }

  /** Solve the higher, softer rear-quarter return from the actual contact. */
  _computeBackWallDriveVelocity({ contactPos, spin, params, isCrossRequest = false }) {
    return ShotTrajectorySolver.solveDrive({ contactPos, spin, params, isCrossRequest });
  }

  /** Goal-first inverse flight solve; architecture 4.22. Charge never shortens the goal. */
  solveCornerLob({ contactPos, opponentPos, params = {} }) {
    const receiverX = Number(opponentPos?.x ?? 0);
    const cornerSign = Math.abs(receiverX) > 0.01 ? -Math.sign(receiverX) : contactPos.x >= 0 ? -1 : 1;
    const corner = { x: cornerSign * LOB_CORNER_REF.x, z: LOB_CORNER_REF.z };
    const spin = new THREE.Vector3(-2.5 * Number(params.shotMechanics?.spinMagnitudeScale ?? 1), 0, 0);
    const bp = params.ballPhysics || {};
    const radius = COURT_SPECS.BALL_RADIUS * 1.65;
    const frontZ = COURT_SPECS.FRONT_WALL_Z + radius;
    const d = Math.max(0.05, contactPos.z - frontZ);
    const a = corner.z - frontZ;
    const friction = Number(bp.surfaceFriction ?? 0.8);
    const gravity = Number(bp.gravity ?? 9.81);
    const magnus = Number(bp.magnusSpinCoupling ?? 0.012);
    const g0 = gravity + spin.x * magnus * 8.5;
    const g1 = gravity + spin.x * 0.68 * magnus * 8.5;
    const k = a / (0.88 * d);
    let best = null;
    let bestLegal = null;
    let closest = null;
    const probe = (vel, height) => {
      const sim = this._simulateLobCandidate(contactPos, vel, spin, params);
      const scored = this._scoreLobCandidate(sim, corner);
      const landing = sim.landingPos || sim.finalPos;
      // Unfold an early glass rebound so the derivative points back into court.
      const z = sim.backWallBeforeLanding ? 2 * (COURT_SPECS.BACK_WALL_Z - radius) - landing.z : landing.z;
      const residual = [3 * ((sim.frontContact?.y ?? sim.finalPos.y) - height), landing.x - corner.x, z - corner.z];
      const error = residual.reduce((sum, v) => sum + v * v, 0);
      const candidate = { ...scored, vel: vel.clone(), residual, error };
      if (!closest || error < closest.error) closest = candidate;
      if (scored.isLegalContact && !sim.backWallBeforeLanding && (!bestLegal || scored.cornerDist < bestLegal.cornerDist)) bestLegal = candidate;
      if (scored.inCornerZone && scored.isLegalContact && (!best || scored.descentDeg > best.descentDeg)) best = candidate;
      return candidate;
    };
    for (const height of LOB_FRONT_HEIGHTS) {
      // Ballistic seed includes wall friction/spin; live physics corrects drag and impacts.
      const A = 0.5 * (friction * g0 * k + g1 * k * k);
      const B = -spin.x * Number(bp.spinSurfaceBite ?? 0.024) * k;
      const D = radius - height - friction * k * (height - contactPos.y);
      const t = (-B + Math.sqrt(Math.max(0, B * B - 4 * A * D))) / (2 * A);
      if (!Number.isFinite(t) || t <= 0) continue;
      let current = probe(new THREE.Vector3(
        (corner.x - contactPos.x) / (t * (1 + friction * k)),
        (height - contactPos.y) / t + 0.5 * g0 * t,
        -d / t
      ).multiplyScalar(1.12), height);
      for (let iteration = 0; iteration < 10; iteration++) {
        if (current.error < 0.001) break;
        const jacobian = [[], [], []];
        for (let axis = 0; axis < 3; axis++) {
          const vel = current.vel.clone();
          vel.setComponent(axis, vel.getComponent(axis) + 0.08);
          const shifted = probe(vel, height);
          for (let row = 0; row < 3; row++) jacobian[row][axis] = (shifted.residual[row] - current.residual[row]) / 0.08;
        }
        const step = ShotTrajectorySolver._linearStep(jacobian, current.residual);
        if (!step) break;
        const delta = new THREE.Vector3(...step.map(v => THREE.MathUtils.clamp(v, -3, 3)));
        let next = null;
        for (const scale of [1, 0.5, 0.25]) {
          const vel = current.vel.clone().addScaledVector(delta, scale);
          if (vel.z >= -0.1 || vel.length() > 40) continue;
          const candidate = probe(vel, height);
          if (candidate.error < current.error) { next = candidate; break; }
        }
        if (!next) break;
        current = next;
      }
    }
    const winner = best || bestLegal || closest;
    return {
      vel: winner.vel, spin, cornerSign,
      solvedContactY: winner.solvedContactY, paceMps: winner.vel.length(),
      solveStatus: this._lobStatus(winner)
    };
  }

  /**
   * Re-simulates an executed lob velocity (e.g. after an AI pace error) so the
   * reported status describes the ball that was actually struck.
   */
  classifyExecutedLob({ contactPos, vel, spin, cornerSign, params }) {
    const corner = { x: cornerSign * LOB_CORNER_REF.x, z: LOB_CORNER_REF.z };
    const scored = this._scoreLobCandidate(this._simulateLobCandidate(contactPos, vel, spin, params), corner);
    return {
      solvedContactY: scored.solvedContactY,
      solveStatus: this._lobStatus(scored)
    };
  }

  /** Integrate to first floor contact, retaining all wall legality and ordering. */
  _simulateLobCandidate(contactPos, vel, spin, params) {
    const dt = 1 / 120;
    const ball = {
      pos: contactPos.clone(),
      vel: vel.clone(),
      spin: spin.clone(),
      inPlay: true,
      bounceCountOnFloor: 0,
      wallHitCountThisShot: 0
    };
    let frontContact = null;
    let landingPos = null;
    let postWallTBandMinY = Infinity;
    let descentDeg = -Infinity;
    let backWallBeforeLanding = false;
    let illegalContact = false;
    let sideWallBeforeLanding = false;
    for (let i = 0; i < 6.0 / dt && !landingPos; i++) {
      const preVel = ball.vel.clone();
      BallPhysics.stepBallPhysics(ball, dt, params, null, {
        onCollision: (evt) => {
          if (landingPos) return;
          illegalContact ||= Boolean(evt.isOut || evt.isTin || evt.surface === 'tin');
          sideWallBeforeLanding ||= evt.surface.startsWith('side_wall');
          if (!frontContact && (evt.surface === 'front_wall' || evt.surface === 'tin')) {
            frontContact = { x: evt.pos.x, y: evt.pos.y, isTin: evt.surface === 'tin', isOut: evt.isOut };
          } else if (!landingPos && evt.surface === 'back_wall') {
            backWallBeforeLanding = true;
          } else if (!landingPos && (evt.surface === 'floor' || evt.surface === 'nick')) {
            illegalContact ||= !frontContact;
            landingPos = evt.pos.clone();
            // Angle of the drop into the floor: how steeply the lob falls into the corner.
            descentDeg = (Math.atan2(-preVel.y, Math.hypot(preVel.x, preVel.z)) * 180) / Math.PI;
          }
        }
      });
      if (frontContact && !landingPos && ball.pos.z >= LOB_T_BAND_Z[0] && ball.pos.z <= LOB_T_BAND_Z[1]) {
        postWallTBandMinY = Math.min(postWallTBandMinY, ball.pos.y);
      }
    }
    return { frontContact, landingPos, postWallTBandMinY, descentDeg, backWallBeforeLanding, illegalContact, sideWallBeforeLanding, finalPos: ball.pos.clone() };
  }

  _scoreLobCandidate(sim, corner) {
    const restPos = sim.landingPos || sim.finalPos;
    // A lob drops into the corner: it must reach the floor before the back glass.
    const inCornerZone =
      !!sim.landingPos &&
      !sim.backWallBeforeLanding &&
      !sim.sideWallBeforeLanding &&
      Math.abs(sim.landingPos.x - corner.x) <= 0.12 &&
      Math.abs(sim.landingPos.z - corner.z) <= 0.10;
    const solvedContactY = sim.frontContact ? sim.frontContact.y : null;
    return {
      solvedContactY,
      isLegalContact:
        !!sim.frontContact && !!sim.landingPos && !sim.illegalContact,
      illegalContact: sim.illegalContact,
      inCornerZone,
      // Steep: the post-wall flight clears the T band, so it cannot be volleyed there.
      reachesCorner:
        inCornerZone && Number.isFinite(sim.postWallTBandMinY) && sim.postWallTBandMinY > LOB_T_BAND_CLEARANCE_M,
      cornerDist: Math.hypot(restPos.x - corner.x, restPos.z - corner.z),
      descentDeg: sim.descentDeg
    };
  }

  _lobStatus(scored) {
    if (scored.isLegalContact && scored.reachesCorner) return 'LEGAL_CORNER';
    if (scored.isLegalContact && scored.inCornerZone) return 'CATCHABLE_CORNER';
    return this._classifyLobAttempt(scored);
  }

  _classifyLobAttempt(scored) {
    return scored.illegalContact || (scored.solvedContactY !== null && scored.solvedContactY >= COURT_SPECS.FRONT_WALL_OUT_Y)
      ? 'ATTEMPT_OUT'
      : 'ATTEMPT_SHORT';
  }

  _computeSideFrontNickBoastVector(contactPos, sideSign, params = {}) {
    const spinScale = Number(params.shotMechanics?.spinMagnitudeScale ?? 1.0);
    const spin = new THREE.Vector3(-12 * spinScale, sideSign * 14 * spinScale, 0);
    const vel = ShotTrajectorySolver.solveBoast({ contactPos, spin, params });

    return { vel, spin };
  }
}

export default ShotController;
