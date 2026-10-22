import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { planVolleyContact } from '../src/squash/VolleyPlanner.js';
import { OpponentAI } from '../src/squash/OpponentAI.js';
import { ShotController } from '../src/squash/ShotController.js';
import { BallPhysics } from '../src/squash/BallPhysics.js';
import { DEFAULT_TUNING_PARAMS as params } from '../src/squash/TuningConfig.js';
import { engineFixture } from './engine-fixture.mjs';
function scenario(z=3,side=1) {
  const actor={role:'opponent',pos:new Vector3(side*1.6,0,z+.1),vel:new Vector3(),targetPos:new Vector3(),swingCooldown:0};
  const opponent={pos:new Vector3(side*1.8,0,4),vel:new Vector3()};
  const ball={pos:new Vector3(side*2,1.2,z),vel:new Vector3(0,0,1),inPlay:true,lastHitter:'player',bounceCountOnFloor:0,hitFrontWallThisShot:true,timeSinceHitSec:.7};
  const predictedTrajectory={samples:[{t:.8,pos:ball.pos.clone(),vel:ball.vel.clone(),bounceCount:0}],events:[{t:.2,surface:'front_wall'}],willHitBackWallBeforeSecondBounce:true,optimalBackWallStrikePos:new Vector3(side*2,.7,4)};
  return {actor,opponent,ball,predictedTrajectory,params};
}
test('mirrored front, middle and rear opportunities select early cross-corner volley drops',()=>{
  for(const z of [-2,0,3]) for(const side of [-1,1]) {
    const s=scenario(z,side),p=planVolleyContact(s);
    assert.ok(p,`opportunity at ${z}, ${side}`);
    assert.ok(Math.abs(p.contactTimeSec-.1)<1e-8);
    assert.equal(p.shotType,'drop');
    assert.equal(p.targetCornerSign,-side);
  }
});
test('unreachable, expired, high and body-blocked opportunities are denied',()=>{
  for(const mutate of [s=>s.actor.pos.x=-2.8,s=>s.ball.timeSinceHitSec=1,s=>s.predictedTrajectory.samples[0].pos.y=3,s=>s.opponent.pos.copy(s.actor.pos),s=>s.predictedTrajectory.samples[0].bounceCount=1]) {
    const s=scenario();mutate(s);assert.equal(planVolleyContact(s),null);
  }
});
test('explicit early drop aim and drive family are honored',()=>{
  const s=scenario();
  assert.equal(planVolleyContact({...s,requestedShot:{shotType:'drop',dirX:.6}}).targetCornerSign,1);
  assert.equal(planVolleyContact({...s,requestedShot:{shotType:'topspin'}}).shotType,'topspin');
  assert.equal(planVolleyContact({...s,requestedShot:{shotType:'drop',maxWaitSec:.05}}),null);
});
test('AI takes a reachable rear volley before the back-wall waiting gate',()=>{
  const s=scenario();let choice;
  new OpponentAI('opponent',()=>.9).updateAI({opponent:s.actor,player:s.opponent,ball:s.ball,dt:1/120,params,predictedTrajectory:s.predictedTrajectory,onExecuteAIShot:c=>choice=c});
  assert.equal(choice?.shotType,'drop');
});
test('deep human drops retain volley and disguise identity; explicit drive is not converted to kill',()=>{
  const s=scenario(),controller=new ShotController();
  const drop=controller.computeShotExecution({ball:s.ball,opponent:s.opponent,inputEvent:{shotType:'drop'},prepSnapshot:{chargeNormalized:1},params});
  assert.equal(drop.isVolley,true);assert.match(drop.label,/VOLLEY DROP/);assert.match(drop.label,/DISGUISED/);
  assert.ok(drop.vel.x<0,'same-side opponent prompts a cross-corner drop');
  const drive=controller.computeShotExecution({ball:s.ball,inputEvent:{shotType:'topspin',speed:1.4},params});
  assert.equal(drive.isVolley,true);assert.match(drive.shotId,/DRIVE/);
});
test('good arcing length denies a central actor a volley, leaving bounced retrieval intact',()=>{
  const ball={pos:new Vector3(2.8,.7,3.9),vel:new Vector3(0,-1,-2),bounceCountOnFloor:1,hitBackWallThisShot:true};
  const shot=new ShotController().computeShotExecution({ball,inputEvent:{shotType:'topspin'},params});
  const trajectory=BallPhysics.simulateTrajectory({pos:ball.pos,vel:shot.vel,spin:shot.spin},params);
  const actor={role:'opponent',pos:new Vector3(-2.7,0,3.8),vel:new Vector3(),maxSpeed:3};
  assert.equal(planVolleyContact({actor,opponent:{pos:new Vector3(2.8,0,3.9)},ball:{...ball,inPlay:true,hitFrontWallThisShot:false,hitBackWallThisShot:false,bounceCountOnFloor:0,lastHitter:'player',timeSinceHitSec:0},predictedTrajectory:trajectory,params}),null);
  assert.ok(trajectory.firstFloorBouncePos.z>3.5);
});
test('strong explicit aim preserves every selected volley family',()=>{
  const s=scenario(3.4),c=new ShotController();
  for(const [shotType,family] of [['drop',/DROP/],['topspin',/DRIVE/],['lob',/LOB/],['kill',/KILL/],['boast',/BOAST/]]) {
    const shot=c.computeShotExecution({ball:s.ball,inputEvent:{shotType,dirX:.9},params});
    assert.match(shot.shotId,family,shotType);
  }
});
test('queued human drop carries the safe corner through scheduled contact',()=>{
  const s=scenario(3),e=engineFixture();
  e.player.pos.copy(s.actor.pos);e.opponent.pos.set(.8,0,.9);
  e.ball={...s.ball,lastHitter:'opponent'};e.currentPredictedTrajectory=s.predictedTrajectory;
  e.pendingUserSwing={evt:{shotType:'drop'},expiresAt:.5};
  let input;e._attemptPlayerRallyStrike=evt=>{input=evt;return true;};
  assert.equal(e._tryPendingPlayerRallyStrike(),true);
  const shot=new ShotController().computeShotExecution({actor:e.player,opponent:e.opponent,ball:e.ball,inputEvent:input,params});
  assert.ok(shot.vel.x>0,'clear same-side corner must survive commit');
});
test('immediate human volley assistance also avoids the blocked cross lane',()=>{
  const s=scenario(3);s.opponent.pos.set(.8,0,.9);
  const shot=new ShotController().computeShotExecution({actor:s.actor,opponent:s.opponent,ball:s.ball,inputEvent:{shotType:'drop'},params});
  assert.ok(shot.vel.x>0);
});
