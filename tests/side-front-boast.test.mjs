import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { ShotController, SQUASH_SHOT_TYPES } from '../src/squash/ShotController.js';
import { ShotTrajectorySolver } from '../src/squash/ShotTrajectorySolver.js';
import { BallPhysics } from '../src/squash/BallPhysics.js';
import { DEFAULT_TUNING_PARAMS as params } from '../src/squash/TuningConfig.js';

const controller = new ShotController();

function execute({ x = 2.8, y = 0.24, z = 3.9596, shotType = 'boast', prepCharge = 0.45, offBackWall = true }) {
  return controller.computeShotExecution({
    ball: { pos: new THREE.Vector3(x, y, z), vel: new THREE.Vector3(0, -2, -2), spin: new THREE.Vector3(), bounceCountOnFloor: 1, hitBackWallThisShot: offBackWall },
    inputEvent: { shotType, speed: 1.12 },
    prepSnapshot: { chargeNormalized: prepCharge, durationSec: 0.42 * prepCharge },
    params
  });
}

function assertBoast(contact, shot) {
  const sim = BallPhysics.simulateTrajectory({ pos: new THREE.Vector3(contact.x, contact.y, contact.z), vel: shot.vel, spin: shot.spin, bounceCountOnFloor: 0, hitFrontWallThisShot: false, hitBackWallThisShot: false }, params, null, { dt: 1 / 120, maxTimeSec: 3.3 });
  const context = JSON.stringify(contact);
  const floorIndex = sim.events.findIndex((event) => event.surface === 'floor' || event.surface === 'nick');
  const frontIndex = sim.events.findIndex((event) => event.surface === 'front_wall');
  const sideIndex = sim.events.findIndex((event) => event.surface.startsWith('side_wall'));
  const floor = sim.events[floorIndex];
  const front = sim.events[frontIndex];
  assert.ok(sideIndex >= 0 && sideIndex < frontIndex && frontIndex < floorIndex, `side/front/floor order: ${context}`);
  assert.ok(Math.sign(sim.events[sideIndex].pos.x) === Math.sign(contact.x), `near side first: ${context}`);
  assert.ok(sim.events.every((event) => !event.isOut && !event.isTin && event.surface !== 'tin' && event.surface !== 'back_wall'), `no out/tin/glass: ${context}`);
  assert.ok(Math.abs(front.pos.y - 0.78) <= 0.10, `front height ${front.pos.y}: ${context}`);
  assert.ok(Math.abs(floor.pos.x) >= 3.05 && Math.sign(floor.pos.x) === -Math.sign(contact.x), `opposite wall ${floor.pos.x}: ${context}`);
  assert.ok(floor.pos.z >= -4.3 && floor.pos.z <= -2.5, `front nick-zone depth ${floor.pos.z}: ${context}`);
  assert.ok(floor.isNick || floor.surface === 'nick', `true nick: ${context}`);
  assert.ok(sim.maxBounceHeightAfterFirst < 0.10, `apex ${sim.maxBounceHeightAfterFirst}: ${context}`);
  assert.ok(sim.secondFloorBouncePos && sim.secondFloorBouncePos.z < -1.5, `second floor ${sim.secondFloorBouncePos?.z}: ${context}`);
  const beforeFloorSides = sim.events.slice(0, floorIndex).filter((event) => event.surface.startsWith('side_wall'));
  assert.equal(beforeFloorSides.length, 1, `no extra side before floor: ${context}`);
  assert.equal(shot.shotId, SQUASH_SHOT_TYPES.TWO_WALL_BOAST);
}

test('72 mirrored soft side-front boasts die in the opposite nick', () => {
  let cases = 0;
  const failures = [];
  for (const side of [-1, 1]) {
    for (const absX of [0.2, 1.65, 2.8]) {
      for (const z of [1, 1.85, 3, 3.9596]) {
        for (const y of [0.24, 0.7, 1.4]) {
          const contact = { x: side * absX, y, z };
          try {
            assertBoast(contact, execute(contact));
          } catch (error) {
            failures.push(error.message);
          }
          cases++;
        }
      }
    }
  }
  assert.equal(cases, 72);
  assert.deepEqual(failures, [], `${failures.length}/${cases} boast cases failed:\n${failures.join('\n')}`);
});

test('actual delayed low boast contacts retain the same nick shape', () => {
  for (const x of [-2.8, 2.8]) {
    for (const y of [0.1, 0.15]) {
      const contact = { x, y, z: 3.9596 };
      assertBoast(contact, execute(contact));
    }
  }
});

test('deep rebound boasts use side/front while explicit recovery preserves back glass', () => {
  for (const shotType of ['boast', 'two_wall_boast']) {
    assert.equal(execute({ shotType }).shotId, SQUASH_SHOT_TYPES.TWO_WALL_BOAST);
    assert.equal(execute({ shotType, offBackWall: false }).shotId, SQUASH_SHOT_TYPES.BACK_WALL_BOAST);
  }
  for (const offBackWall of [false, true]) {
    assert.equal(execute({ shotType: 'back_wall_boast', offBackWall }).shotId, SQUASH_SHOT_TYPES.BACK_WALL_BOAST);
  }
});

test('boast charge changes disguise but not velocity, with exact mirror symmetry', () => {
  const outputs = [0, 0.45, 1].map((prepCharge) => execute({ prepCharge }));
  assert.deepEqual(outputs[0].vel.toArray(), outputs[1].vel.toArray());
  assert.deepEqual(outputs[1].vel.toArray(), outputs[2].vel.toArray());
  assert.equal(outputs[2].isDisguised, true);
  const negative = execute({ x: -2.8 });
  assert.deepEqual(negative.vel.toArray(), [-outputs[1].vel.x, outputs[1].vel.y, outputs[1].vel.z]);
  assert.deepEqual(negative.spin.toArray(), [outputs[1].spin.x, -outputs[1].spin.y, outputs[1].spin.z]);
  const contactPos = new THREE.Vector3(-2.8, 0.24, 3.9596);
  const spin = new THREE.Vector3(-12, -14, 0);
  ShotTrajectorySolver.solveBoast({ contactPos, spin, params });
  assert.deepEqual(contactPos.toArray(), [-2.8, 0.24, 3.9596]);
  assert.deepEqual(spin.toArray(), [-12, -14, 0]);
});

test('boast probes are deterministic and bounded by 55 real simulations', (t) => {
  const original = BallPhysics.simulateTrajectory;
  let count = 0;
  BallPhysics.simulateTrajectory = function (...args) {
    count++;
    return original.apply(this, args);
  };
  t.after(() => { BallPhysics.simulateTrajectory = original; });
  const first = execute({ y: 0.1 });
  const firstCount = count;
  count = 0;
  const second = execute({ y: 0.1 });
  assert.ok(firstCount > 0 && firstCount <= 55);
  assert.equal(count, firstCount);
  assert.deepEqual(second.vel.toArray(), first.vel.toArray());
  t.diagnostic(`boast reproduction physics probes: ${firstCount}`);
});
