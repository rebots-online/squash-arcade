import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3, Group } from 'three';
import { PointPresentation } from '../src/squash/PointPresentation.js';
import { DEFAULT_TUNING_PARAMS as params } from '../src/squash/TuningConfig.js';
import { engineFixture } from './engine-fixture.mjs';
const ball=()=>({pos:new Vector3(1,2,-3),vel:new Vector3(.5,-1,2),spin:new Vector3(),inPlay:false,bounceCountOnFloor:2});
test('real engine awards once and defers match result until presentation finishes',()=>{
  const e=engineFixture(new PointPresentation());e.score.playerPoints=4;
  e._awardPoint('player','Out');
  assert.equal(e.phase,'POINT_SETTLE');assert.equal(e.score.playerGames,1);assert.equal(e.victoryShown,undefined);
  e._awardPoint('player','Out');assert.equal(e.score.playerGames,1);
  e._finishPointPresentation();assert.equal(e.phase,'MATCH_OVER');assert.equal(e.victoryShown,true);
});
test('real engine terminal continuation never scores again',()=>{
  const e=engineFixture(new PointPresentation());let collisions=0;
  e._handleCollisionEvent=()=>{collisions++;return {rallyEnded:true,winner:'opponent'};};
  e._awardPoint('player','Tin');
  for(let i=0;i<120;i++)e._stepPhysics(1/120);
  assert.equal(e.score.playerPoints,1);assert.equal(e.score.opponentPoints,0);assert.ok(collisions>0);
});
test('terminal ball continues bouncing without mutating authoritative state, then replays and ends',()=>{
  const p=new PointPresentation(),b=ball(),initial=b.pos.clone();
  p.begin(b,{pos:b.pos.clone(),surface:'out'});
  assert.equal(p.begin(b),false,'duplicate award cannot restart');
  let elapsed=0;
  while(p.phase==='POINT_SETTLE'&&elapsed<6){p.step(1/120,params);p.record(1/120,p.ball,[]);elapsed+=1/120;}
  assert.ok(elapsed>=1.5&&elapsed<=5.02);
  assert.ok(p.ball.bounceCountOnFloor>2);
  assert.deepEqual(b.pos,initial);
  assert.equal(p.phase,'POINT_REPLAY');
  p.step(4.01,params);assert.equal(p.phase,'DONE');
});
test('bounded recording replays actual ball and articulated racket transforms',()=>{
  const p=new PointPresentation(),b=ball(),root=new Group(),racket=new Group();root.add(racket);
  const actor={root,pos:new Vector3()};
  for(let i=0;i<600;i++){b.pos.x=i/100;racket.rotation.z=i/100;p.record(1/30,b,[actor]);}
  assert.ok(p.frames.length<=300);
  p.begin(b);p.phase='POINT_REPLAY';p.replayElapsed=0;
  const recorded=p.frames[0];b.pos.set(99,99,99);racket.rotation.z=0;
  p.apply(b,[actor]);
  assert.deepEqual(b.pos.toArray(),recorded.ball.pos.toArray());
  assert.ok(Math.abs(racket.quaternion.z-recorded.actors[0].nodes[1].q[2])<1e-8);
  const a=p.cameraPose();p.replayElapsed=2;const c=p.cameraPose();
  assert.ok(a.targetPos.distanceTo(c.targetPos)>.5);
});
test('fresh key and pointer skip consumes full gesture; held repeat does not skip',()=>{
  const p=new PointPresentation();
  assert.equal(p.input({type:'keydown',code:'Space'}).consume,false);
  p.begin(ball());
  assert.equal(p.input({type:'keydown',code:'Space',repeat:true}).skip,false);
  p.input({type:'keyup',code:'Space'});
  assert.equal(p.input({type:'keydown',code:'Digit2'}).skip,true);
  p.cancel();
  assert.equal(p.input({type:'keydown',code:'Digit2',repeat:true}).consume,true);
  assert.equal(p.input({type:'keyup',code:'Digit2'}).consume,true);
  assert.equal(p.input({type:'keydown',code:'Digit2'}).consume,false);
  p.input({type:'keyup',code:'Digit2'});p.begin(ball());
  assert.equal(p.input({type:'pointerdown',pointerId:1}).skip,true);p.cancel();
  assert.equal(p.input({type:'pointerup',pointerId:1}).consume,true);
  assert.equal(p.input({type:'click',pointerId:1}).consume,true);
  assert.equal(p.input({type:'click',pointerId:1}).consume,false);
});
test('live Replay control cannot replace the rally with a canned nick',()=>{
  const e=engineFixture(new PointPresentation()),pos=e.ball.pos.clone(),vel=e.ball.vel.clone();
  e._enterInstantReplayState();
  assert.equal(e.phase,'RALLY');assert.deepEqual(e.ball.pos,pos);assert.deepEqual(e.ball.vel,vel);
});
test('showcase restart cancels stale result presentation',()=>{
  const e=engineFixture(new PointPresentation());
  e.ballTrail.seedArc=()=>{};
  e._awardPoint('player','Out');e._setupMidRallyShowcase();
  assert.equal(e.phase,'RALLY');assert.equal(e.pointPresentation.active,false);
  assert.equal(e.pendingPointOutcome,null);
});
test('nick, tin, out and second bounce all keep visible non-scoring aftermath',()=>{
  for(const reason of ['Nick','Tin','Out','Double bounce']) {
    const e=engineFixture(new PointPresentation());e._handleCollisionEvent=()=>{};
    e._awardPoint('player',reason);const before=e.ball.pos.clone();
    for(let i=0;i<120;i++)e._stepPhysics(1/120);
    assert.equal(e.phase,'POINT_SETTLE');assert.ok(e.ball.pos.distanceTo(before)>.01);
    assert.equal(e.score.playerPoints,1);
  }
});
test('slow winning lob replay retains its final stroke and precontact poses',()=>{
  const p=new PointPresentation(),b=ball();b.lastHitter='player';b.rallyStrokeCount=1;
  for(let i=0;i<90;i++)p.record(1/30,b,[]);
  const strikeTime=p.recordClock;
  b.lastHitter='opponent';b.rallyStrokeCount=2;
  for(let i=0;i<110;i++)p.record(1/30,b,[]);
  p.begin(b);p.step(5,params);
  assert.equal(p.phase,'POINT_REPLAY');
  assert.ok(p.frames[0].t<strikeTime-.25,'retain the preparation preceding a slow final stroke');
  assert.ok(p.frames.some(f=>f.ball.rallyStrokeCount===2));
  assert.ok(p.frames.length<=300);
});
