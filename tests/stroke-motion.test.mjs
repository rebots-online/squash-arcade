import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { StrokeMotion } from '../src/squash/StrokeMotion.js';
import { PlayerMovement } from '../src/squash/PlayerMovement.js';
import { BallPhysics } from '../src/squash/BallPhysics.js';
import { getRacketRimWorldPoints } from '../src/racket_kinematics.js';

function fixture({ handedness = 'right', ballX = 0.45 } = {}) {
  const root = new THREE.Group();
  const model = new THREE.Group();
  root.add(model);
  root.rotation.y = Math.PI;
  const pivot = (x, y, z, parent = model) => {
    const p = new THREE.Group();
    p.position.set(x, y, z);
    parent.add(p);
    return p;
  };
  const actor = {
    role: 'player', handedness, root, model,
    pos: new THREE.Vector3(), vel: new THREE.Vector3(), targetPos: new THREE.Vector3(0, 0, 2),
    maxSpeed: 6.8,
    rig: {
      footLPivot: pivot(0.2, 0.08, 0), footRPivot: pivot(-0.2, 0.08, 0),
      handRPivot: pivot(-0.3, 0.9, 0.1), hipPivot: pivot(0, 0.8, 0)
    },
    racketPivot: pivot(-0.3, 1.0, 0.1, root)
  };
  const ball = {
    pos: new THREE.Vector3(ballX, 0.8, -0.12), vel: new THREE.Vector3(0, 0.5, 1.5),
    spin: new THREE.Vector3(), inPlay: true, lastHitter: 'opponent',
    rallyStrokeCount: 4, bounceCountOnFloor: 1, hitFrontWallThisShot: true
  };
  root.updateMatrixWorld(true);
  return { actor, ball };
}

function ordinaryPose(actor) {
  actor.root.position.copy(actor.pos);
  actor.rig.footLPivot.position.set(0.2, 0.08, 0);
  actor.rig.footRPivot.position.set(-0.2, 0.08, 0);
  actor.rig.hipPivot.position.set(0, 0.8, 0);
  actor.rig.hipPivot.rotation.set(0, 0, 0);
  actor.racketPivot.position.set(-0.3, 1.0, 0.1);
  actor.root.updateMatrixWorld(true);
}

function prepare(actor, ball, seconds = 1.5) {
  for (let t = 0; t < seconds; t += 1 / 120) {
    StrokeMotion.prepare(actor, 1 / 120, { ball, phase: 'RALLY', handedness: actor.handedness });
    ordinaryPose(actor);
    StrokeMotion.applyPose(actor, ball);
  }
}

const near = (actual, expected, tolerance = 1e-6) => assert.ok(Math.abs(actual - expected) <= tolerance,
  `${actual} differs from ${expected} by more than ${tolerance}`);

test('right/left forehand/backhand preparation mirrors yaw and opposite-foot loading', () => {
  for (const [handedness, side, ballX, yaw, lead] of [
    ['right', 'forehand', 0.45, Math.PI / 2, 'left'],
    ['right', 'backhand', -0.45, Math.PI * 1.5, 'right'],
    ['left', 'forehand', -0.45, Math.PI * 1.5, 'right'],
    ['left', 'backhand', 0.45, Math.PI / 2, 'left']
  ]) {
    const { actor, ball } = fixture({ handedness, ballX });
    prepare(actor, ball);
    assert.equal(actor.strokeMotion.side, side);
    near(actor.strokeMotion.yawRad, yaw, 0.0001);
    assert.equal(actor.strokeMotion.leadFoot, lead);
    assert.notEqual(actor.strokeMotion.leadFoot, actor.strokeMotion.supportFoot);
  }
});

test('preparation turns continuously and request preserves yaw and game body state', () => {
  const { actor, ball } = fixture();
  const actorPos = actor.pos.clone(), ballPos = ball.pos.clone(), ballVel = ball.vel.clone();
  let priorYaw = actor.root.rotation.y;
  for (let i = 0; i < 120; i++) {
    StrokeMotion.prepare(actor, 1 / 120, { ball, phase: 'RALLY' });
    ordinaryPose(actor);
    StrokeMotion.applyPose(actor, ball);
    assert.ok(Math.abs(actor.root.rotation.y - priorYaw) < 0.14);
    priorYaw = actor.root.rotation.y;
  }
  const beforeRequestYaw = actor.strokeMotion.yawRad;
  const input = { side: 'forehand', speed: 1.1, nested: { selected: true } };
  const prep = { chargeNormalized: 0.5 };
  assert.equal(StrokeMotion.request(actor, { ball, inputEvent: input, prepSnapshot: prep }), true);
  input.nested.selected = false;
  prep.chargeNormalized = 0;
  near(actor.strokeMotion.yawRad, beforeRequestYaw);
  assert.deepEqual(actor.pos, actorPos);
  assert.deepEqual(ball.pos, ballPos);
  assert.deepEqual(ball.vel, ballVel);
  assert.equal(ball.rallyStrokeCount, 4);
  assert.equal(actor.strokeMotion.pending.inputEvent.nested.selected, true);
  assert.equal(actor.strokeMotion.pending.prepSnapshot.chargeNormalized, 0.5);
});

test('actual racket effective side wins over conflicting input, with mirrored feet', () => {
  const { actor, ball } = fixture({ handedness: 'left', ballX: -0.4 });
  actor.racketKinematics = { swingActive: true, swingSide: 'backhand' };
  StrokeMotion.request(actor, { ball, inputEvent: { side: 'forehand' } });
  assert.equal(actor.strokeMotion.side, 'backhand');
  assert.equal(actor.strokeMotion.leadFoot, 'left');
});

test('opposite foot lifts and plants 0.28m forward while support stays anchored during loading', () => {
  const { actor, ball } = fixture();
  prepare(actor, ball);
  StrokeMotion.request(actor, { ball });
  const start = actor.strokeMotion.leadStartWorld.clone();
  const supportAnchor = actor.strokeMotion.supportPlantWorld.clone();
  StrokeMotion.update(actor, 0.05, { ball, phase: 'RALLY' });
  ordinaryPose(actor);
  StrokeMotion.applyPose(actor, ball);
  const lead = actor.rig.footLPivot.getWorldPosition(new THREE.Vector3());
  const support = actor.rig.footRPivot.getWorldPosition(new THREE.Vector3());
  near(lead.z, start.z - 0.14);
  near(lead.y, start.y + 0.10);
  assert.ok(support.distanceTo(supportAnchor) < 1e-6);
  StrokeMotion.update(actor, 0.05, { ball, phase: 'RALLY' });
  ordinaryPose(actor);
  StrokeMotion.applyPose(actor, ball);
  const planted = actor.rig.footLPivot.getWorldPosition(new THREE.Vector3());
  near(planted.z, start.z - 0.28);
  near(planted.y, start.y);
  near(actor.strokeMotion.progress, 0.34);
  near(actor.root.rotation.y, Math.PI - THREE.MathUtils.degToRad(55));
});

test('PlayerMovement supplies an inertial step without jumping actor or ball positions', () => {
  const { actor, ball } = fixture();
  StrokeMotion.request(actor, { ball });
  const before = actor.pos.clone();
  const ballBefore = ball.pos.clone();
  PlayerMovement.stepActorLocomotion(actor, null, 1 / 120);
  assert.ok(actor.pos.z < before.z);
  assert.ok(actor.pos.distanceTo(before) <= 18.5 / 120 ** 2 + 1e-9);
  assert.deepEqual(ball.pos, ballBefore);
  const actual = actor.pos.clone();
  for (let i = 0; i < 5; i++) {
    ordinaryPose(actor);
    StrokeMotion.applyPose(actor, ball);
  }
  assert.deepEqual(actor.pos, actual);
});

test('the BallPhysics ball moves before scheduled contact and emits exactly one copied payload', () => {
  const { actor, ball } = fixture();
  StrokeMotion.request(actor, { ball, inputEvent: { side: 'forehand' }, isAuto: true });
  const start = ball.pos.clone();
  let emitted = 0;
  for (let i = 0; i < 30; i++) {
    BallPhysics.stepBallPhysics(ball, 1 / 120, { ballPhysics: {} });
    const payload = StrokeMotion.update(actor, 1 / 120, { ball, phase: 'RALLY' });
    if (i === 5) {
      assert.ok(ball.pos.distanceTo(start) > 0.03);
      assert.equal(actor.strokeMotion.contactEmitted, false);
      assert.equal(ball.rallyStrokeCount, 4);
    }
    if (payload) {
      emitted++;
      assert.equal(actor.strokeMotion.pending, null);
      assert.equal(payload.ballRef, ball);
      assert.equal(payload.isAuto, true);
      assert.deepEqual(actor.strokeMotion.contactPos, ball.pos);
    }
  }
  assert.equal(emitted, 1);
  assert.equal(ball.rallyStrokeCount, 4);
});

test('duplicate requests are handled without restarting elapsed time, side, anchors or payload', () => {
  const { actor, ball } = fixture();
  StrokeMotion.request(actor, { ball, inputEvent: { side: 'forehand' } });
  StrokeMotion.update(actor, 0.04, { ball, phase: 'RALLY' });
  const pending = actor.strokeMotion.pending;
  const anchor = actor.strokeMotion.leadPlantWorld;
  assert.equal(StrokeMotion.request(actor, { ball, inputEvent: { side: 'backhand' } }), true);
  assert.equal(actor.strokeMotion.pending, pending);
  assert.equal(actor.strokeMotion.leadPlantWorld, anchor);
  assert.equal(actor.strokeMotion.side, 'forehand');
  near(actor.strokeMotion.elapsedSec, 0.04);
});

test('stale ball identity, hitter, stroke count, second bounce and phase transitions cancel pending contact', () => {
  for (const invalidate of [
    (ball) => ({ ...ball }),
    (ball) => { ball.lastHitter = 'player'; return ball; },
    (ball) => { ball.rallyStrokeCount++; return ball; },
    (ball) => { ball.bounceCountOnFloor = 2; return ball; },
    (ball) => { ball.inPlay = false; return ball; }
  ]) {
    const { actor, ball } = fixture();
    StrokeMotion.request(actor, { ball });
    const updatedBall = invalidate(ball);
    assert.equal(StrokeMotion.update(actor, 0.12, { ball: updatedBall, phase: 'RALLY' }), null);
    assert.equal(actor.strokeMotion.phase, 'idle');
    assert.equal(actor.strokeMotion.pending, null);
  }
  const { actor, ball } = fixture();
  StrokeMotion.request(actor, { ball });
  const actorPos = actor.pos.clone(), ballPos = ball.pos.clone();
  assert.equal(StrokeMotion.update(actor, 0.12, { ball, phase: 'POINT_OVER' }), null);
  assert.equal(actor.strokeMotion.leadPlantWorld, null);
  assert.equal(actor.strokeMotion.stepTargetWorld, null);
  assert.deepEqual(actor.pos, actorPos);
  assert.deepEqual(ball.pos, ballPos);
});

test('low descending contact shortens load according to actual remaining floor time', () => {
  const { actor, ball } = fixture();
  ball.pos.y = 0.045;
  ball.vel.y = -2;
  const h = 0.045 - 0.02 * 1.65;
  const floorTime = (-2 + Math.sqrt(4 + 2 * 9.81 * h)) / 9.81;
  StrokeMotion.request(actor, { ball });
  near(actor.strokeMotion.contactDelaySec, floorTime * 0.60);
  assert.ok(actor.strokeMotion.contactDelaySec < 0.004);
  ball.pos.y = 0.033;
  StrokeMotion.reset(actor);
  StrokeMotion.request(actor, { ball });
  near(actor.strokeMotion.contactDelaySec, 0.001);
});

test('follow-through opens through forward, releases the support heel and recovers into ordinary poses', () => {
  const { actor, ball } = fixture();
  prepare(actor, ball);
  StrokeMotion.request(actor, { ball });
  StrokeMotion.update(actor, 0.10, { ball, phase: 'RALLY' });
  // A successful production commit changes the hit identity; follow-through must survive it.
  ball.lastHitter = 'player';
  ball.rallyStrokeCount++;
  StrokeMotion.update(actor, 0.12, { ball, phase: 'RALLY' });
  ordinaryPose(actor);
  StrokeMotion.applyPose(actor, ball);
  assert.equal(actor.strokeMotion.phase, 'swing');
  assert.ok(actor.rig.footRPivot.rotation.x > 0.1);
  StrokeMotion.update(actor, 0.12, { ball, phase: 'RALLY' });
  ordinaryPose(actor);
  StrokeMotion.applyPose(actor, ball);
  assert.equal(actor.strokeMotion.phase, 'recover');
  assert.ok(actor.root.rotation.y > Math.PI);
  StrokeMotion.update(actor, 0.08, { ball, phase: 'RALLY' });
  ordinaryPose(actor);
  StrokeMotion.applyPose(actor, ball);
  const ordinaryLead = actor.rig.footLPivot.parent.localToWorld(new THREE.Vector3(0.2, 0.08, 0));
  const recoveringLead = actor.rig.footLPivot.getWorldPosition(new THREE.Vector3());
  const expectedLead = actor.strokeMotion.leadPlantWorld.clone().lerp(ordinaryLead, 0.5);
  assert.ok(recoveringLead.distanceTo(expectedLead) < 1e-6);
  StrokeMotion.update(actor, 0.081, { ball, phase: 'RALLY' });
  ordinaryPose(actor);
  assert.equal(actor.strokeMotion.phase, 'idle');
  assert.equal(StrokeMotion.applyPose(actor, ball), false);
});

test('contact alignment moves only reachable racket pose, keeps hand attached and preserves game bodies', () => {
  const { actor, ball } = fixture();
  prepare(actor, ball);
  StrokeMotion.request(actor, { ball });
  StrokeMotion.update(actor, 0.10, { ball, phase: 'RALLY' });
  ordinaryPose(actor);
  actor.root.rotation.y = actor.strokeMotion.yawRad;
  actor.root.updateMatrixWorld(true);
  const center = getRacketRimWorldPoints(actor).centerWorld.clone();
  actor.strokeMotion.contactPos = center.add(new THREE.Vector3(0.1, -0.08, 0.12));
  const actorPos = actor.pos.clone(), ballPos = ball.pos.clone(), ballVel = ball.vel.clone();
  StrokeMotion.applyPose(actor, ball);
  const moved = getRacketRimWorldPoints(actor).centerWorld;
  assert.ok(moved.distanceTo(actor.strokeMotion.contactPos) < 1e-6);
  const grip = actor.racketPivot.localToWorld(new THREE.Vector3(0, 0.085, 0));
  const hand = actor.rig.handRPivot.getWorldPosition(new THREE.Vector3());
  assert.ok(hand.distanceTo(grip) < 1e-6);
  assert.deepEqual(actor.pos, actorPos);
  assert.deepEqual(ball.pos, ballPos);
  assert.deepEqual(ball.vel, ballVel);
});

test('overhead preserves forward overhead mechanics while using the same contact schedule', () => {
  const { actor, ball } = fixture();
  actor.racketKinematics = { swingActive: true, swingSide: 'overhead' };
  StrokeMotion.request(actor, { ball, inputEvent: { shotType: 'smash' } });
  assert.equal(actor.strokeMotion.side, 'overhead');
  const yaw = actor.strokeMotion.yawRad;
  assert.equal(StrokeMotion.update(actor, 0.05, { ball, phase: 'RALLY' }), null);
  near(actor.strokeMotion.yawRad, yaw);
  assert.ok(StrokeMotion.update(actor, 0.05, { ball, phase: 'RALLY' }));
});
