import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { ShotController, SQUASH_SHOT_TYPES } from '../src/squash/ShotController.js';
import { BallPhysics } from '../src/squash/BallPhysics.js';
import { ShotTrajectorySolver } from '../src/squash/ShotTrajectorySolver.js';
import { DEFAULT_TUNING_PARAMS } from '../src/squash/TuningConfig.js';

const controller = new ShotController();
const params = DEFAULT_TUNING_PARAMS;

function execute({ x = 2.8, y = 0.24, z = 3, vySign = -1, speed = 1.32, shotType = 'topspin', prepCharge = 0.45, offBackWall = true }) {
  return controller.computeShotExecution({
    actor: { pos: new THREE.Vector3(x, 0, z) },
    opponent: { pos: new THREE.Vector3(0, 0, 0) },
    ball: {
      pos: new THREE.Vector3(x, y, z),
      vel: new THREE.Vector3(0, vySign * 2, -2),
      spin: new THREE.Vector3(),
      bounceCountOnFloor: 1,
      hitBackWallThisShot: offBackWall
    },
    inputEvent: { shotType, speed },
    prepSnapshot: { chargeNormalized: prepCharge, durationSec: prepCharge * 0.42 },
    params
  });
}

function assertReturnTrajectory(contact, shot) {
  const sim = BallPhysics.simulateTrajectory({
    pos: new THREE.Vector3(contact.x, contact.y, contact.z),
    vel: shot.vel,
    spin: shot.spin,
    hitFrontWallThisShot: false,
    hitBackWallThisShot: false,
    bounceCountOnFloor: 0,
    wallHitCountThisShot: 0
  }, params);
  const context = JSON.stringify(contact);
  const firstBounceIndex = sim.events.findIndex((event) => event.surface === 'floor' || event.surface === 'nick');
  const front = sim.events.find((event) => event.surface === 'front_wall');
  assert.ok(front && Math.abs(front.pos.y - 2.05) <= 0.10, `front height ${front?.pos.y}: ${context}`);
  const firstBackIndex = sim.events.findIndex((event) => event.surface === 'back_wall');
  assert.ok(firstBounceIndex >= 0, `first bounce exists: ${context}`);
  assert.ok(firstBackIndex < 0 || firstBounceIndex < firstBackIndex, `floor before back glass: ${context}`);
  assert.ok(Math.abs(sim.events[firstBounceIndex].pos.z - 3.8) <= 0.12, `bounce depth ${sim.events[firstBounceIndex].pos.z}: ${context}`);
  const targetX = Math.sign(contact.x) * (contact.shotType === 'cross' ? -2.8 : 2.8);
  assert.ok(Math.abs(sim.events[firstBounceIndex].pos.x - targetX) <= 0.10, `landing x ${sim.events[firstBounceIndex].pos.x}: ${context}`);
  assert.ok(!sim.events.slice(0, firstBounceIndex).some((event) => event.surface.startsWith('side_wall')), `no side before floor: ${context}`);
  assert.ok(sim.events.every((event) => !event.isOut && !event.isTin && event.surface !== 'tin'), `legal trajectory: ${context}`);
  for (const event of sim.events.filter((event) => event.surface === 'back_wall')) {
    assert.ok(event.pos.y < 2.13, `back contact below out line: ${context}`);
  }
  assert.equal(shot.shotId, SQUASH_SHOT_TYPES.OFF_BACK_WALL_DRIVE);
  assert.deepEqual(shot.spin.toArray(), [14, 0, 0]);
}

test('all 1440 early/late mirrored back-wall drives land deep below the out line', () => {
  let cases = 0;
  for (const side of [-1, 1]) {
    for (const absX of [0.2, 2, 2.8]) {
      for (const z of [1, 2, 3, 4.3]) {
        for (const y of [0.24, 0.45, 0.7, 1, 1.4]) {
          for (const speed of [0.92, 1.12, 1.32]) {
            for (const vySign of [1, -1]) {
              for (const shotType of ['topspin', 'cross']) {
                const contact = { x: side * absX, y, z, speed, vySign, shotType };
                assertReturnTrajectory(contact, execute(contact));
                cases++;
              }
            }
          }
        }
      }
    }
  }
  assert.equal(cases, 1440);
});

test('reported low descending contact at (2.8, 0.24, 3), speed 1.32', () => {
  const contact = { x: 2.8, y: 0.24, z: 3, vySign: -1, speed: 1.32 };
  assertReturnTrajectory(contact, execute(contact));
});

test('preparation charge alone leaves drive velocity unchanged', () => {
  for (const shotType of ['topspin', 'cross']) {
    for (const offBackWall of [false, true]) {
      for (const vySign of [1, -1]) {
        const velocities = [0, 0.45, 1].map((prepCharge) => execute({ prepCharge, shotType, offBackWall, vySign }).vel.toArray());
        assert.deepEqual(velocities[0], velocities[1]);
        assert.deepEqual(velocities[1], velocities[2]);
      }
    }
  }
});

test('ordinary shot identities and full-preparation drop disguise stay intact', () => {
  const contact = { x: -1, y: 0.95, z: 0.8, offBackWall: false };
  for (const [shotType, expected] of [
    ['lob', SQUASH_SHOT_TYPES.HIGH_LOB],
    ['kill', SQUASH_SHOT_TYPES.VOLLEY_KILL],
    ['drop', SQUASH_SHOT_TYPES.COUNTER_DROP],
    ['boast', SQUASH_SHOT_TYPES.TWO_WALL_BOAST]
  ]) {
    assert.equal(execute({ ...contact, shotType }).shotId, expected);
  }
  const disguisedDrop = execute({ ...contact, shotType: 'drop', prepCharge: 1 });
  assert.equal(disguisedDrop.shotId, SQUASH_SHOT_TYPES.DISGUISED_DROP);
  assert.equal(disguisedDrop.isDisguised, true);
});


test('actual delayed low contacts remain higher and softer without moving contact', () => {
  for (const x of [-2.8, 2.8]) {
    for (const y of [0.10, 0.15]) {
      for (const shotType of ['topspin', 'cross']) {
        const contact = { x, y, z: 3.96, shotType };
        assertReturnTrajectory(contact, execute(contact));
      }
    }
  }
});

test('drive solve mirrors exactly and never mutates supplied contact/spin', () => {
  for (const isCrossRequest of [false, true]) {
    const contactPos = new THREE.Vector3(2.8, 0.1, 3.96);
    const spin = new THREE.Vector3(14, 0, 0);
    const positive = ShotTrajectorySolver.solveDrive({ contactPos, spin, params, isCrossRequest });
    const negative = ShotTrajectorySolver.solveDrive({ contactPos: new THREE.Vector3(-2.8, 0.1, 3.96), spin, params, isCrossRequest });
    assert.deepEqual(negative.toArray(), [-positive.x, positive.y, positive.z]);
    assert.deepEqual(contactPos.toArray(), [2.8, 0.1, 3.96]);
    assert.deepEqual(spin.toArray(), [14, 0, 0]);
  }
});

test('drive probes are deterministic and bounded by 55 real simulations', (t) => {
  const original = BallPhysics.simulateTrajectory;
  let count = 0;
  BallPhysics.simulateTrajectory = function (...args) {
    count++;
    return original.apply(this, args);
  };
  t.after(() => { BallPhysics.simulateTrajectory = original; });
  const first = execute({ y: 0.1, z: 3.96, shotType: 'cross' });
  const firstCount = count;
  count = 0;
  const second = execute({ y: 0.1, z: 3.96, shotType: 'cross' });
  assert.ok(firstCount > 0 && firstCount <= 55);
  assert.equal(count, firstCount);
  assert.deepEqual(second.vel.toArray(), first.vel.toArray());
  t.diagnostic(`drive reproduction physics probes: ${firstCount}`);
});
