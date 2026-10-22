import * as THREE from 'three';
import { COURT_SPECS } from './CourtGeometry.js';
import { getRacketRimWorldPoints } from '../racket_kinematics.js';

// The rig's eyes and chest face local +Z; PI turns them toward the front wall.
const FORWARD_YAW = Math.PI;
const CONTACT_PROGRESS = 0.34;
const clamp = THREE.MathUtils.clamp;
const smooth = (v) => {
  const u = clamp(v, 0, 1);
  return u * u * (3 - 2 * u);
};
const angleDelta = (from, to) => Math.atan2(Math.sin(to - from), Math.cos(to - from));
const mixAngle = (from, to, weight) => from + angleDelta(from, to) * weight;

function motionFor(actor) {
  if (!actor.strokeMotion) {
    actor.strokeMotion = {
      phase: 'idle', side: 'forehand', handedness: 'right',
      yawRad: actor.root?.rotation.y ?? FORWARD_YAW, prepareWeight: 0,
      elapsedSec: 0, contactDelaySec: 0.10, followThroughSec: 0.24,
      recoverSec: 0.16, progress: 0, racketDurationSec: 0.34,
      contactEmitted: false, pending: null, contactPos: null,
      leadFoot: 'left', supportFoot: 'right', leadStartWorld: null,
      leadPlantWorld: null, supportPlantWorld: null, stepTargetWorld: null,
      startYawRad: actor.root?.rotation.y ?? FORWARD_YAW,
      recoverYawRad: FORWARD_YAW
    };
  }
  return actor.strokeMotion;
}

function effectiveSide(actor, ball, handedness, inputEvent = {}) {
  const k = actor.racketKinematics;
  if (k?.swingActive && ['forehand', 'backhand', 'overhead'].includes(k.swingSide)) {
    return k.swingSide;
  }
  if (inputEvent.side === 'overhead' || inputEvent.shotType === 'smash') return 'overhead';
  if (['forehand', 'backhand'].includes(inputEvent.side)) return inputEvent.side;
  const handSign = handedness === 'left' ? -1 : 1;
  return (ball.pos.x - actor.pos.x) * handSign < -0.05 ? 'backhand' : 'forehand';
}

function stanceSign(motion) {
  return (motion.side === 'backhand' ? 1 : -1) * (motion.handedness === 'left' ? -1 : 1);
}

function setFeet(motion) {
  const rightLead = (motion.side === 'backhand') !== (motion.handedness === 'left');
  motion.leadFoot = rightLead ? 'right' : 'left';
  motion.supportFoot = rightLead ? 'left' : 'right';
}

function footPivot(actor, foot) {
  return actor.rig?.[foot === 'left' ? 'footLPivot' : 'footRPivot'];
}

function plantPivot(pivot, worldPosition) {
  if (!pivot?.parent || !worldPosition) return;
  pivot.position.copy(pivot.parent.worldToLocal(worldPosition.clone()));
}

/** Physics owns contact timing; this layer changes articulated poses, never positions of game bodies. */
export class StrokeMotion {
  static readyYaw(actor, ball) {
    return FORWARD_YAW - Math.atan2((ball?.pos.x ?? actor.pos.x) - actor.pos.x, 3.5) * 0.28;
  }

  static prepare(actor, dt, { ball, phase, handedness = actor.handedness || 'right', predictedContactSec } = {}) {
    const motion = motionFor(actor);
    if (motion.phase === 'swing' || motion.phase === 'recover') return;
    const receiving = phase === 'RALLY' && ball?.inPlay && ball.lastHitter !== actor.role;
    const distance = receiving ? Math.hypot(ball.pos.x - actor.pos.x, ball.pos.z - actor.pos.z) : Infinity;
    const targetWeight = receiving ? clamp((3.2 - distance) / 1.6, 0, 1) : 0;
    const blend = 1 - Math.exp(-10 * Math.max(0, dt));
    motion.prepareWeight += (targetWeight - motion.prepareWeight) * blend;
    motion.handedness = handedness;
    if (receiving) motion.side = effectiveSide(actor, ball, handedness);
    setFeet(motion);
    motion.phase = motion.prepareWeight > 0.002 ? 'prepare' : 'idle';
    // Arrival prediction can be absent; live distance remains the preparation authority.
    if (Number.isFinite(predictedContactSec)) motion.predictedContactSec = predictedContactSec;
    const ordinaryYaw = this.readyYaw(actor, ball);
    const targetYaw = motion.side === 'overhead'
      ? ordinaryYaw
      : mixAngle(ordinaryYaw, FORWARD_YAW + stanceSign(motion) * Math.PI / 2, motion.prepareWeight);
    motion.yawRad = mixAngle(motion.yawRad, targetYaw, blend);
  }

  static request(actor, { ball, inputEvent = {}, prepSnapshot = {}, isAuto = false,
    handedness = actor.handedness || 'right', gravity = 9.81 } = {}) {
    const motion = motionFor(actor);
    if (motion.pending) return true;
    if (!ball?.inPlay || ball.bounceCountOnFloor >= 2) return false;
    motion.handedness = handedness;
    motion.side = effectiveSide(actor, ball, handedness, inputEvent);
    setFeet(motion);
    motion.phase = 'swing';
    motion.elapsedSec = 0;
    motion.progress = 0;
    motion.contactEmitted = false;
    motion.contactDelaySec = 0.10;
    const g = Math.max(0.001, Number(gravity) || 9.81);
    if (ball.vel.y < 0) {
      const h = Math.max(0, ball.pos.y - COURT_SPECS.BALL_RADIUS * 1.65);
      const remainingFloorTime = (ball.vel.y + Math.sqrt(ball.vel.y ** 2 + 2 * g * h)) / g;
      motion.contactDelaySec = Math.max(0.001, Math.min(0.10, 0.60 * remainingFloorTime));
    }
    motion.startYawRad = motion.yawRad;
    motion.contactPos = null;
    motion.pending = {
      inputEvent: structuredClone(inputEvent), prepSnapshot: structuredClone(prepSnapshot), isAuto,
      ballRef: ball, rallyStrokeCount: ball.rallyStrokeCount, lastHitter: ball.lastHitter
    };
    actor.root?.updateMatrixWorld(true);
    const lead = footPivot(actor, motion.leadFoot);
    const support = footPivot(actor, motion.supportFoot);
    motion.leadStartWorld = lead?.getWorldPosition(new THREE.Vector3()) ?? null;
    motion.leadPlantWorld = motion.leadStartWorld?.clone().add(new THREE.Vector3(0, 0, -0.28)) ?? null;
    motion.supportPlantWorld = support?.getWorldPosition(new THREE.Vector3()) ?? null;
    motion.stepTargetWorld = actor.pos.clone();
    motion.stepTargetWorld.z = clamp(actor.pos.z - 0.28, COURT_SPECS.FRONT_WALL_Z + 0.65, COURT_SPECS.BACK_WALL_Z - 0.34);
    motion.stepTargetWorld.x = clamp(actor.pos.x, COURT_SPECS.LEFT_WALL_X + 0.40, COURT_SPECS.RIGHT_WALL_X - 0.40);
    return true;
  }

  static update(actor, dt, { ball, phase } = {}) {
    const motion = motionFor(actor);
    if (phase !== 'RALLY' || !ball?.inPlay || ball.bounceCountOnFloor >= 2) {
      this.reset(actor);
      return null;
    }
    const token = motion.pending;
    if (token && (token.ballRef !== ball || token.lastHitter !== ball.lastHitter || token.rallyStrokeCount !== ball.rallyStrokeCount)) {
      this.reset(actor);
      return null;
    }
    if (motion.phase !== 'swing' && motion.phase !== 'recover') return null;
    motion.elapsedSec += Math.max(0, dt);
    const afterContact = motion.elapsedSec - motion.contactDelaySec;
    const followEnd = motion.contactDelaySec + motion.followThroughSec;
    const sign = stanceSign(motion);
    if (motion.elapsedSec < followEnd) {
      motion.phase = 'swing';
      motion.progress = afterContact < 0
        ? CONTACT_PROGRESS * motion.elapsedSec / motion.contactDelaySec
        : CONTACT_PROGRESS + (1 - CONTACT_PROGRESS) * clamp(afterContact / motion.followThroughSec, 0, 1);
      if (motion.side !== 'overhead') {
        if (afterContact < 0) {
          const u = clamp(motion.elapsedSec / motion.contactDelaySec, 0, 1);
          const loadedYaw = FORWARD_YAW + sign * Math.PI / 2;
          // Keep the initial loading portion side-on; then open into the contact angle.
          const load = smooth(u / 0.35);
          const open = smooth((u - 0.35) / 0.65);
          const loadingYaw = mixAngle(motion.startYawRad, loadedYaw, load);
          motion.yawRad = mixAngle(loadingYaw, FORWARD_YAW + sign * THREE.MathUtils.degToRad(55), open);
        } else {
          motion.yawRad = mixAngle(FORWARD_YAW + sign * THREE.MathUtils.degToRad(55), FORWARD_YAW - sign * 0.16,
            smooth(afterContact / motion.followThroughSec));
        }
      }
    } else {
      if (motion.phase !== 'recover') {
        motion.recoverYawRad = motion.side === 'overhead' ? motion.yawRad : FORWARD_YAW - sign * 0.16;
        motion.yawRad = motion.recoverYawRad;
      }
      motion.phase = 'recover';
      motion.progress = 1;
      if (motion.elapsedSec >= followEnd + motion.recoverSec) this.reset(actor);
    }
    if (token && !motion.contactEmitted && afterContact >= -1e-9) {
      motion.contactEmitted = true;
      motion.pending = null;
      motion.contactPos = ball.pos.clone();
      return token;
    }
    return null;
  }

  static applyPose(actor, ball) {
    const motion = motionFor(actor);
    if (motion.phase === 'idle') return false;
    const active = motion.phase === 'swing' || motion.phase === 'recover';
    const recovery = motion.phase === 'recover'
      ? smooth((motion.elapsedSec - motion.contactDelaySec - motion.followThroughSec) / motion.recoverSec) : 0;
    const poseWeight = active ? 1 - recovery : motion.prepareWeight;
    const ordinaryYaw = this.readyYaw(actor, ball);
    actor.root.rotation.y = motion.phase === 'recover'
      ? mixAngle(motion.recoverYawRad, ordinaryYaw, recovery) : motion.yawRad;
    if (motion.phase === 'recover') motion.yawRad = actor.root.rotation.y;
    const rig = actor.rig;
    if (!rig) return true;
    const hip = rig.hipPivot;
    const sign = stanceSign(motion);
    const u = active ? clamp(motion.elapsedSec / motion.contactDelaySec, 0, 1) : 0;
    const follow = clamp((motion.elapsedSec - motion.contactDelaySec) / motion.followThroughSec, 0, 1);
    if (hip) {
      hip.position.y -= 0.06 * (active ? 1 - smooth(follow) : motion.prepareWeight) * (1 - recovery);
      hip.position.z += 0.08 * (active ? smooth(u) : 0) * (1 - recovery);
      hip.rotation.y = THREE.MathUtils.lerp(hip.rotation.y, sign * (active ? 0.16 * (1 - u) - 0.12 * follow : 0.16), poseWeight);
    }
    actor.root.updateMatrixWorld(true);
    if (active) {
      const lead = footPivot(actor, motion.leadFoot);
      const support = footPivot(actor, motion.supportFoot);
      if (lead && motion.leadStartWorld) {
        const ordinary = lead.getWorldPosition(new THREE.Vector3());
        const desired = new THREE.Vector3().lerpVectors(motion.leadStartWorld, motion.leadPlantWorld, smooth(u));
        desired.y += Math.sin(Math.PI * u) * 0.10;
        plantPivot(lead, desired.lerp(ordinary, recovery));
      }
      if (support && motion.supportPlantWorld) {
        const ordinary = support.getWorldPosition(new THREE.Vector3());
        const desired = motion.supportPlantWorld.clone();
        desired.z += 0.10 * smooth(follow);
        desired.y += 0.035 * Math.sin(Math.PI * follow);
        plantPivot(support, desired.lerp(ordinary, recovery));
        support.rotation.x += 0.22 * Math.sin(Math.PI * follow) * (1 - recovery);
      }
    }
    // A bounded reach adjustment brings the existing racket path to the live contact,
    // without translating either game body. The hand follows the resulting grip.
    const contactTarget = motion.contactPos || ball?.pos;
    if (active && actor.racketPivot?.parent && contactTarget) {
      actor.root.updateMatrixWorld(true);
      const center = getRacketRimWorldPoints(actor).centerWorld.clone();
      const delta = contactTarget.clone().sub(center);
      // A physics step can cross contact at progress .34 and render at about .363.
      // Hold full alignment across that interval, then ease back into the carry.
      const contactWeight = motion.progress < CONTACT_PROGRESS
        ? smooth((motion.progress - 0.08) / (CONTACT_PROGRESS - 0.08))
        : 1 - smooth((motion.progress - 0.38) / 0.30);
      const weight = contactWeight * (1 - recovery);
      // This bounds correction of the legacy local pose, not game-body reach.
      // The engine separately enforces a 1.15m actor-to-ball horizontal reach.
      if (delta.length() > 2.5) delta.setLength(2.5);
      const pivotWorld = actor.racketPivot.getWorldPosition(new THREE.Vector3());
      plantPivot(actor.racketPivot, pivotWorld.addScaledVector(delta, weight));
    }
    if (actor.racketPivot && rig.handRPivot?.parent) {
      actor.root.updateMatrixWorld(true);
      const grip = actor.racketMesh
        ? actor.racketMesh.localToWorld(new THREE.Vector3(0, 0.08, 0))
        : actor.racketPivot.localToWorld(new THREE.Vector3(0, 0.085, 0));
      plantPivot(rig.handRPivot, grip);
    }
    actor.root.updateMatrixWorld(true);
    return true;
  }

  static reset(actor) {
    const motion = motionFor(actor);
    motion.phase = 'idle';
    motion.prepareWeight = 0;
    motion.elapsedSec = 0;
    motion.contactDelaySec = 0.10;
    motion.followThroughSec = 0.24;
    motion.recoverSec = 0.16;
    motion.progress = 0;
    motion.racketDurationSec = 0.34;
    motion.contactEmitted = false;
    motion.pending = null;
    motion.contactPos = null;
    motion.leadStartWorld = null;
    motion.leadPlantWorld = null;
    motion.supportPlantWorld = null;
    motion.stepTargetWorld = null;
  }
}

export default StrokeMotion;
