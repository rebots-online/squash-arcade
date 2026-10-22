import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { ShotController } from '../src/squash/ShotController.js';
import { BallPhysics } from '../src/squash/BallPhysics.js';
import { DEFAULT_TUNING_PARAMS as params } from '../src/squash/TuningConfig.js';
const controller=new ShotController(()=>{throw Error('Human quality must not draw random errors');});
function execute(side,poor,shotType='boast') {
  const ball={pos:new Vector3(side*2.8,.7,3),vel:new Vector3(0,-1,-2),bounceCountOnFloor:1,hitBackWallThisShot:true};
  const actor={pos:new Vector3(side*(poor?1.75:2.25),0,poor?2.8:3.25),vel:new Vector3(poor?4:0,0,0)};
  return {ball,shot:controller.computeShotExecution({actor,ball,inputEvent:{shotType},params})};
}
test('only balanced strike-pocket contact preserves exact attacking nick precision',t=>{
  let perfect=0,poor=0;
  for(const side of [-1,1]) for(const stretched of [false,true]) {
    const {ball,shot}=execute(side,stretched);
    const sim=BallPhysics.simulateTrajectory({pos:ball.pos,vel:shot.vel,spin:shot.spin},params);
    if(sim.nickTriggered){if(stretched)poor++;else perfect++;}
    assert.ok(stretched?shot.contactQuality<.5:shot.contactQuality>.95);
    if(stretched)assert.match(shot.timingGrade,/STRETCHED|RUSHED|LATE/);
    assert.deepEqual(shot.vel.toArray(),execute(side,stretched).shot.vel.toArray());
  }
  assert.equal(perfect,2);assert.equal(poor,0);
  t.diagnostic(`Mirrored exact-pocket nicks ${perfect}/2; stretched/rushed nicks ${poor}/2`);
});
test('contact quality leaves reliable drive and lob placement unchanged',()=>{
  for(const type of ['topspin','lob']) {
    const a=execute(1,false,type),b=execute(1,true,type);
    assert.deepEqual(a.shot.vel.toArray(),b.shot.vel.toArray());
  }
});
test('human spectator input cannot inherit random AI winner margins',()=>{
  const ball={pos:new Vector3(2,1.2,3),vel:new Vector3(),bounceCountOnFloor:0};
  const actor={pos:new Vector3(1.45,0,3.25),vel:new Vector3()};
  const inputEvent={shotType:'drop',isSpectatorNudge:true,aiExecution:false};
  const a=controller.computeShotExecution({actor,ball,inputEvent,params});
  const b=controller.computeShotExecution({actor,ball,inputEvent:{...inputEvent,aiWinnerMargin:true},params});
  assert.deepEqual(a.vel.toArray(),b.vel.toArray());
});
