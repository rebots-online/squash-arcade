import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { OpponentAI } from '../src/squash/OpponentAI.js';
import { ShotController } from '../src/squash/ShotController.js';
import { TestHarness } from '../src/squash/TestHarness.js';
import { DEFAULT_TUNING_PARAMS as params } from '../src/squash/TuningConfig.js';

function randomStream(seed = 1) {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function shotOptions(inputEvent) {
  return {
    ball: {
      pos: new THREE.Vector3(1.2, 0.7, 2),
      vel: new THREE.Vector3(0, -1, -2),
      spin: new THREE.Vector3(),
      bounceCountOnFloor: 1,
      hitBackWallThisShot: false
    },
    inputEvent: { shotType: 'topspin', ...inputEvent },
    params
  };
}

test('eight full harness runs reproduce all 15 results without replacing Math.random', (t) => {
  const originalRandom = Math.random;
  let expectedResults;
  for (let run = 0; run < 8; run++) {
    const result = TestHarness.runAll();
    assert.equal(Math.random, originalRandom);
    assert.equal(result.totalCount, 15);
    assert.equal(result.passedCount, 15);
    assert.equal(result.passedAll, true);
    assert.ok(result.results.every((entry) => entry.passed));
    if (expectedResults) assert.deepEqual(result.results, expectedResults);
    else expectedResults = result.results;
  }
  t.diagnostic(`8 runs, 15/15 each; ${expectedResults.find((entry) => entry.id === 'TEST-SPECTATOR-AI-01').detail}`);
});

test('injected AI streams reproduce tactical choices and memory bias', () => {
  const run = () => {
    const ai = new OpponentAI('opponent', randomStream(1));
    const opponent = { pos: new THREE.Vector3(1.8, 0, 3) };
    const player = { pos: new THREE.Vector3(-0.7, 0, 1.5) };
    const ball = { pos: new THREE.Vector3(2, 0.7, 3), vel: new THREE.Vector3(0, -1, -2), hitBackWallThisShot: true, bounceCountOnFloor: 1, rallyStrokeCount: 5 };
    const choices = [];
    for (let index = 0; index < 20; index++) {
      const choice = ai.chooseTacticalShot({ opponent, player, ball, params });
      ai.recordPlayerShot({ shotId: 'OFF_BACK_WALL_DRIVE' }, ball, params);
      choices.push({ choice, biasX: ai.anticipatedBiasX });
    }
    return choices;
  };
  const first = run();
  assert.deepEqual(run(), first);
  assert.ok(new Set(first.map(({ choice }) => choice.shotType)).size > 1);
  assert.ok(new Set(first.map(({ biasX }) => biasX)).size > 1);
});

test('injected shot streams reproduce all three intentional-error draws', () => {
  const run = () => {
    let draws = 0;
    const next = randomStream(1);
    const shots = new ShotController(() => { draws++; return next(); });
    const outputs = [
      shots.computeShotExecution(shotOptions({ aiErrorMode: 'TIN' })),
      shots.computeShotExecution(shotOptions({ aiErrorMode: 'OUT' })),
      shots.computeShotExecution(shotOptions({ aiWinnerMargin: true }))
    ];
    assert.equal(draws, 3);
    return outputs;
  };
  const first = run();
  assert.deepEqual(run(), first);
  assert.equal(new Set(first.map((shot) => shot.vel.y)).size, 3);
  assert.match(first[0].label, /TIN ERROR/);
  assert.match(first[1].label, /OVERHIT OUT/);
});

test('ordinary constructors still draw from normal Math.random and restore the isolated override', () => {
  const originalRandom = Math.random;
  let draws = 0;
  try {
    Math.random = () => { draws++; return 0.5; };
    const ai = new OpponentAI();
    const shots = new ShotController();
    assert.equal(ai.randomSource, Math.random);
    assert.equal(shots.randomSource, Math.random);
    ai.recordPlayerShot({ shotId: 'STRAIGHT_DRIVE' }, { pos: new THREE.Vector3(1, 0.7, 1) }, params);
    assert.equal(draws, 1);
    assert.equal(ai.anticipatedBiasX, 0);
    shots.computeShotExecution(shotOptions({ aiErrorMode: 'TIN' }));
    assert.equal(draws, 2);
    shots.computeShotExecution(shotOptions({ aiErrorMode: 'OUT' }));
    assert.equal(draws, 3);
    shots.computeShotExecution(shotOptions({ aiWinnerMargin: true }));
    assert.equal(draws, 4);
  } finally {
    Math.random = originalRandom;
  }
  assert.equal(Math.random, originalRandom);
});
