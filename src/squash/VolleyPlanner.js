import { Vector3, MathUtils } from 'three';
import { COURT_SPECS } from './CourtGeometry.js';

function segmentClear(from, to, other, clearance) {
  if (!other) return true;
  const dx=to.x-from.x, dz=to.z-from.z;
  const u=MathUtils.clamp(((other.x-from.x)*dx+(other.z-from.z)*dz)/(dx*dx+dz*dz||1),0,1);
  return Math.hypot(other.x-from.x-u*dx,other.z-from.z-u*dz)>=clearance;
}

/** Pure opportunity assessment; only the engine's live scheduled contact hits. */
export function planVolleyContact({actor,opponent,ball,predictedTrajectory,params={},requestedShot={}}) {
  if (!actor || !ball?.inPlay || ball.lastHitter===actor.role || ball.bounceCountOnFloor!==0) return null;
  const ma=params.movementAndAI||{};
  const maxSpeed=Math.min(Number(ma.playerMaxSpeedMps??6.8),actor.maxSpeed||Infinity);
  const accel=Number(ma.playerAccelerationMps2??18.5);
  const age=Number(ball.timeSinceHitSec||0);
  const frontTime=ball.hitFrontWallThisShot ? -Infinity : predictedTrajectory?.events?.find(e=>e.surface==='front_wall'&&!e.isOut&&!e.isTin)?.t;
  if (frontTime===undefined) return null;
  const maxWait=Number(requestedShot.maxWaitSec??.75);
  const reaction=Number(requestedShot.reactionSec||0);
  for (const sample of predictedTrajectory?.samples||[]) {
    const t=sample.t-age, pos=sample.pos;
    if(t<.045 || t>maxWait || sample.t<frontTime || sample.bounceCount!==0 || pos.y<.28 || pos.y>Number(params.shotMechanics?.contactHeightReachMeters??2.15)) continue;
    const available=t-reaction-.07;
    if(available<0) continue;
    const dx=pos.x-actor.pos.x,dz=pos.z-actor.pos.z,dist=Math.hypot(dx,dz);
    const speed=Math.max(0,((actor.vel?.x||0)*dx+(actor.vel?.z||0)*dz)/(dist||1));
    const ramp=Math.min(available,Math.max(0,maxSpeed-speed)/accel);
    const travel=speed*ramp+.5*accel*ramp*ramp+maxSpeed*(available-ramp);
    if(dist>travel+.88) continue;
    const targetPos=new Vector3(MathUtils.clamp(pos.x-Math.sign(pos.x||1)*.38,-2.78,2.78),0,MathUtils.clamp(pos.z+.12,-3.9,4.45));
    if(!segmentClear(actor.pos,targetPos,opponent?.pos,.65) || !segmentClear(targetPos,pos,opponent?.pos,.68)) continue;
    const side=Math.sign(pos.x||1);
    const explicitAim=Math.abs(Number(requestedShot.dirX||0))>.25;
    const sameSide=Math.sign(opponent?.pos?.x||0)===side;
    let corner=explicitAim?Math.sign(requestedShot.dirX):sameSide?-side:side;
    const front=new Vector3(corner*2.55,.85,COURT_SPECS.FRONT_WALL_Z);
    if(!segmentClear(pos,front,opponent?.pos,.55)) {
      if(explicitAim) continue;
      corner=-corner;front.x=corner*2.55;
      if(!segmentClear(pos,front,opponent?.pos,.55)) continue;
    }
    const coverage=opponent?.pos?Math.hypot(opponent.pos.x-front.x,opponent.pos.z-front.z):0;
    const dropFlight=.45+Math.abs(pos.z-front.z)/14;
    const attackOpen=coverage>Math.max(4.2,4.8*(dropFlight+.2));
    const shotType=requestedShot.shotType||(attackOpen?'drop':'topspin');
    return {contactTimeSec:t,contactPos:pos.clone(),targetPos,shotType,targetCornerSign:corner};
  }
  return null;
}
