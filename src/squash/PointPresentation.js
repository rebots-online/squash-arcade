import { Vector3, MathUtils } from 'three';
import { BallPhysics } from './BallPhysics.js';

const cloneBall=b=>({...b,mesh:undefined,pos:b.pos.clone(),vel:b.vel.clone(),spin:b.spin.clone()});
const nodesOf=actor=>{const nodes=[];actor.root?.traverse(n=>nodes.push(n));return nodes;};

/** Records rendered poses; playback has no rules, input, AI or random execution. */
export class PointPresentation {
  constructor() {
    this.keys=new Set();this.swallowedKeys=new Set();this.pointers=new Set();
    this.swallowedPointers=new Set();this.pendingClick=false;
    this.cancel();
  }
  cancel() {
    this.phase='IDLE';this.frames=[];this.events=[];this.recordClock=0;
    this.sampleClock=0;this.settleElapsed=0;this.replayElapsed=0;this.restElapsed=0;
    this.ball=null;this.focus=new Vector3();
    this.lastStrokeToken=null;this.lastStrokeTime=null;
  }
  get active(){return this.phase==='POINT_SETTLE'||this.phase==='POINT_REPLAY';}
  observeStroke(ball) {
    const token=`${ball.lastHitter}:${ball.rallyStrokeCount||0}`;
    if(token!==this.lastStrokeToken){this.lastStrokeTime=this.recordClock;this.lastStrokeToken=token;}
  }
  record(dt,ball,actors) {
    if(this.phase==='POINT_REPLAY'||this.phase==='DONE') return;
    if(this.phase!=='POINT_SETTLE')this.observeStroke(ball);
    this.recordClock+=dt;this.sampleClock+=dt;
    if(this.sampleClock<1/30&&this.frames.length) return;
    this.sampleClock=0;
    const frame={t:this.recordClock,ball:cloneBall(ball),actors:actors.map(a=>({pos:a.pos.clone(),nodes:nodesOf(a).map(n=>({p:n.position.toArray(),q:n.quaternion.toArray(),s:n.scale.toArray()}))}))};
    this.frames.push(frame);
    while(this.frames.length>300) this.frames.shift();
  }
  collision(event) {
    if(this.phase==='POINT_REPLAY') return;
    this.events.push({t:this.recordClock,...event,pos:event.pos.clone()});
    while(this.events.length>150) this.events.shift();
  }
  begin(ball,event=null) {
    if(this.active) return false;
    this.observeStroke(ball);
    this.ball=cloneBall(ball);this.ball.inPlay=true;
    this.phase='POINT_SETTLE';this.settleElapsed=0;this.restElapsed=0;this.replayElapsed=0;
    this.focus.copy(event?.pos||this.events.at(-1)?.pos||ball.pos);
    this.endTime=this.recordClock;
    return true;
  }
  step(dt,params,onCollision=()=>{}) {
    if(this.phase==='POINT_SETTLE') {
      this.settleElapsed+=dt;
      BallPhysics.stepBallPhysics(this.ball,dt,params,null,{onCollision:e=>{this.collision(e);if(e.speed>.3) onCollision(e);}});
      this.restElapsed=this.ball.vel.length()<.2?this.restElapsed+dt:0;
      if(this.settleElapsed>=5||(this.settleElapsed>=1.5&&this.restElapsed>=.3)) {
        this.phase='POINT_REPLAY';this.replayElapsed=0;
        // Preserve the final stroke and the complete visible aftermath.
        this.frames=this.frames.filter(f=>f.t>=(this.lastStrokeTime??this.endTime-2.5)-.6);
      }
    } else if(this.phase==='POINT_REPLAY') {
      this.replayElapsed+=dt;
      if(this.replayElapsed>=4) this.phase='DONE';
    }
    return this.phase;
  }
  apply(ball,actors) {
    if(this.phase!=='POINT_REPLAY'||!this.frames.length) return;
    const first=this.frames[0],last=this.frames.at(-1);
    const t=MathUtils.lerp(first.t,last.t,Math.min(1,this.replayElapsed/4));
    const index=Math.max(0,this.frames.findIndex(f=>f.t>=t));
    const b=this.frames[index],a=this.frames[Math.max(0,index-1)];
    const u=b.t===a.t?0:MathUtils.clamp((t-a.t)/(b.t-a.t),0,1);
    ball.pos.copy(a.ball.pos).lerp(b.ball.pos,u);ball.vel.copy(b.ball.vel);
    actors.forEach((actor,i)=>{
      const aa=a.actors[i],bb=b.actors[i];if(!aa||!bb)return;
      actor.pos.copy(aa.pos).lerp(bb.pos,u);
      nodesOf(actor).forEach((n,j)=>{
        const x=aa.nodes[j],y=bb.nodes[j];if(!x||!y)return;
        n.position.fromArray(x.p).lerp(new Vector3().fromArray(y.p),u);
        n.quaternion.fromArray(x.q);const q=n.quaternion.clone().fromArray(y.q);n.quaternion.slerp(q,u);
        n.scale.fromArray(y.s);
      });
      actor.root?.updateMatrixWorld(true);
    });
  }
  cameraPose() {
    const u=MathUtils.clamp(this.replayElapsed/4,0,1),angle=-.65+u*1.3;
    const radius=MathUtils.lerp(8,4.1,MathUtils.smoothstep(u,0,1));
    const targetLook=this.focus.clone();targetLook.y=Math.max(.35,targetLook.y);
    return {targetLook,targetPos:new Vector3(MathUtils.clamp(targetLook.x+Math.sin(angle)*radius,-2.7,2.7),targetLook.y+2.4+(1-u)*1.4,targetLook.z+Math.cos(angle)*radius)};
  }
  input(e) {
    const down=e.type==='keydown',up=e.type==='keyup';
    if(down||up) {
      const held=this.keys.has(e.code),swallowed=this.swallowedKeys.has(e.code);
      if(up){this.keys.delete(e.code);this.swallowedKeys.delete(e.code);return {consume:this.active||swallowed,skip:false};}
      this.keys.add(e.code);
      if(this.active){this.swallowedKeys.add(e.code);return {consume:true,skip:!held&&!e.repeat};}
      return {consume:swallowed,skip:false};
    }
    if(e.type==='pointerdown') {
      const held=this.pointers.has(e.pointerId);this.pointers.add(e.pointerId);
      if(this.active){this.swallowedPointers.add(e.pointerId);this.pendingClick=true;return {consume:true,skip:!held};}
      // A later independent pointer gesture must not inherit a missing click.
      this.pendingClick=false;
    }
    if(e.type==='pointerup'||e.type==='pointercancel') {
      this.pointers.delete(e.pointerId);
      const swallowed=this.swallowedPointers.delete(e.pointerId);
      return {consume:this.active||swallowed,skip:false};
    }
    if(e.type==='click'&&this.pendingClick){this.pendingClick=false;return {consume:true,skip:false};}
    return {consume:this.active,skip:false};
  }
}
