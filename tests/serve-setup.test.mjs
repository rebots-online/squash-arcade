import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { evaluateServeSetup } from '../src/squash/ServeSetup.js';
import { engineFixture } from './engine-fixture.mjs';
const actor=(x,z)=>({pos:new Vector3(x,0,z),targetPos:new Vector3(x,0,z),vel:new Vector3()});
test('both service sides reject same-box crowding and wrong server side without receiver-half fiction',()=>{
  for(const sign of [-1,1]) {
    const serviceSide=sign<0?'left':'right',server=actor(sign*1.85,1.515),receiver=actor(-sign*1.45,1.915);
    assert.equal(evaluateServeSetup({server,receiver,serviceSide}).ready,true);
    receiver.pos.set(sign*1.85,0,1.7);
    assert.equal(evaluateServeSetup({server,receiver,serviceSide}).ready,false);
    receiver.pos.set(sign*1.85,0,4);
    assert.equal(evaluateServeSetup({server,receiver,serviceSide}).ready,true);
    server.pos.x=-sign*1.85;
    assert.equal(evaluateServeSetup({server,receiver,serviceSide}).reason,'SERVER_POSITION');
  }
});
test('moving or non-arrived actors cannot initiate serve',()=>{
  const server=actor(1.85,1.515),receiver=actor(-1.45,1.915);
  server.vel.x=1;assert.equal(evaluateServeSetup({server,receiver,serviceSide:'right'}).ready,false);
  server.vel.x=0;server.targetPos.x=2.7;
  assert.equal(evaluateServeSetup({server,receiver,serviceSide:'right'}).ready,false);
});
test('engine blocks crowded toss without a point and corrects targets before stable readiness',()=>{
  const e=engineFixture();e.phase='SERVE_STANCE';e.pointToken=1;e.serveReadySec=0;e.autoPlayMode=true;
  e.opponent.pos.copy(e.player.pos);
  e._startServeToss(e.player);
  assert.equal(e.phase,'SERVE_STANCE');assert.equal(e.score.opponentPoints,0);
  assert.ok(e.opponent.targetPos.x<0);
  for(let i=0;i<1200&&e.phase==='SERVE_STANCE';i++)e._stepPhysics(1/120);
  assert.equal(e.phase,'SERVE_TOSS');
  assert.ok(e.opponent.pos.distanceTo(e.player.pos)>1.25);
  assert.equal(e.score.opponentPoints,0);
});
test('serve contact rechecks crowding and rejects a stale point token',()=>{
  const e=engineFixture();e.phase='SERVE_TOSS';e.pointToken=2;e.serveTossToken=1;
  e._executeServeHit(e.player);assert.equal(e.ball.rallyStrokeCount,undefined);
  e.serveTossToken=2;e.opponent.pos.copy(e.player.pos);
  e._executeServeHit(e.player);assert.equal(e.phase,'SERVE_STANCE');assert.equal(e.score.opponentPoints,0);
});
test('wrong-box setup walks into the legal box for either server and side',()=>{
  for(const role of ['player','opponent'])for(const side of ['left','right']) {
    const e=engineFixture(),sign=side==='left'?-1:1;
    e.phase='SERVE_STANCE';e.pointToken=1;e.autoPlayMode=true;
    e.score.server=role;e.score.serviceSide=side;
    const server=e[role],receiver=e[role==='player'?'opponent':'player'];
    server.pos.set(-sign*1.85,0,1.515);server.targetPos.copy(server.pos);
    receiver.pos.copy(server.pos);receiver.targetPos.copy(receiver.pos);
    for(let i=0;i<1200&&e.phase==='SERVE_STANCE';i++)e._stepPhysics(1/120);
    assert.equal(e.phase,'SERVE_TOSS',`${role} ${side}`);
    assert.ok(server.pos.x*sign>1.6);
    assert.equal(e.score.playerPoints+e.score.opponentPoints,0);
  }
});
test('genuine foot fault at contact still awards receiver',()=>{
  const e=engineFixture();e.phase='SERVE_TOSS';e.pointToken=1;e.serveTossToken=1;
  e._awardPoint=winner=>e.rulesEngine.awardPoint(winner);
  e.player.pos.x=.12;e._executeServeHit(e.player);
  assert.equal(e.score.opponentPoints,1);
});
