import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { ShotController } from '../src/squash/ShotController.js';
import { OpponentAI } from '../src/squash/OpponentAI.js';
import { BallPhysics } from '../src/squash/BallPhysics.js';
import { DEFAULT_TUNING_PARAMS as params, createSeededRNG } from '../src/squash/TuningConfig.js';

function shot(controller, inputEvent, x=2.8) {
  return controller.computeShotExecution({ball:{pos:new Vector3(x,.7,3),vel:new Vector3(0,-1,-2),bounceCountOnFloor:1,hitBackWallThisShot:true},inputEvent,params});
}
test('seeded AI attacking boasts hit fewer actual nicks than exact human solves', t=>{
  const c=new ShotController(createSeededRNG(41).next);
  let aiNicks=0, exactNicks=0;
  for(let i=0;i<120;i++) {
    const x=i%2?2.8:-2.8;
    for(const aiExecution of [false,true]) {
      const s=shot(c,{shotType:'boast',aiExecution},x);
      const sim=BallPhysics.simulateTrajectory({pos:new Vector3(x,.7,3),vel:s.vel,spin:s.spin},params);
      if(sim.nickTriggered) { if(aiExecution) aiNicks++; else exactNicks++; }
    }
  }
  t.diagnostic(`Actual nick finishes: exact ${exactNicks}/120; AI ${aiNicks}/120`);
  assert.equal(exactNicks,120);
  assert.ok(aiNicks<exactNicks*.8,'execution variation should materially reduce exact nicks');
});
test('AI execution samples exactly once and preserves other families and explicit errors',()=>{
  for(const shotType of ['drop','kill','boast','topspin','lob']) {
    let draws=0;
    const c=new ShotController(()=>{draws++;return .9;});
    const human=shot(c,{shotType});
    assert.equal(draws,0);
    const ai=shot(c,{shotType,aiExecution:true});
    const attack=['drop','kill','boast'].includes(shotType);
    assert.equal(draws,attack?3:0);
    if(attack) {
      assert.notDeepEqual(ai.vel.toArray(),human.vel.toArray());
      assert.ok(Math.abs(ai.vel.length()/human.vel.length()-1)<=.020001);
      assert.ok(ai.vel.angleTo(human.vel)<.023);
    } else assert.deepEqual(ai.vel.toArray(),human.vel.toArray());
    const errorHuman=shot(new ShotController(()=>.5),{shotType,aiErrorMode:'TIN'});
    const errorAI=shot(new ShotController(()=>.5),{shotType,aiErrorMode:'TIN',aiExecution:true});
    assert.deepEqual(errorAI.vel.toArray(),errorHuman.vel.toArray());
  }
});
test('winner chance is tunable and AI choices identify execution ownership',()=>{
  assert.equal(params.movementAndAI.aiWinnerMarginChance,.20);
  const actor={pos:new Vector3(1,0,-1)};
  const ball={pos:new Vector3(1,1,-1),vel:new Vector3(0,0,4),bounceCountOnFloor:1};
  for(const chance of [0,1]) {
    const choice=new OpponentAI('opponent',()=>.3).chooseTacticalShot({opponent:actor,player:{pos:new Vector3(1,0,4)},ball,params:{movementAndAI:{aiWinnerMarginChance:chance}}});
    assert.equal(choice.aiExecution,true);
    assert.equal(Boolean(choice.aiWinnerMargin),Boolean(chance));
  }
});
