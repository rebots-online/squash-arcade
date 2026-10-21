// Controlled live-browser observation driver. Run this function in the loaded
// local Arcade page through DevTools evaluate_script. A loopback-only receiver
// must accept the named WebM/PNG/JSON artifacts at 127.0.0.1:3099.
// This seeds the incoming fixture once, uses normal movement/contact/physics,
// and changes only scheduling, observation cameras and recording composition.
export const capture = async (shotType, name, sideText) => {
const side=Number(sideText), e=window.__argonSquash;
const {StrokeMotion}=await import('/src/squash/StrokeMotion.js');
const {BallPhysics}=await import('/src/squash/BallPhysics.js');
const {getRacketRimWorldPoints}=await import('/src/racket_kinematics.js');
e.isPausedForModal=true;e.isMultiplayer=true;e.autoPlayMode=false;e.spectatorMatchMode=false;e.persistentStateLock=false;
e.phase='RALLY';e.phaseTimer=0;e.pendingUserSwing=null;e.pendingServeSwing=null;e.currentRallyPlayerInterference=null;
e.tuningStore.params.movementAndAI.autoTReturn=true;
e.player.pos.set(side*1.9,0,3.4);e.player.vel.set(0,0,0);e.player.targetPos.copy(e.player.pos);
e.opponent.pos.set(-side,0,1);e.opponent.vel.set(0,0,0);e.opponent.targetPos.copy(e.opponent.pos);
for(const a of[e.player,e.opponent]){StrokeMotion.reset(a);a.swingCooldown=0;a.swingTimer=0;a.root.position.copy(a.pos);a.racketKinematics.swingActive=false;}
Object.assign(e.ball,{inPlay:true,lastHitter:'opponent',isServeShot:false,hitFrontWallThisShot:true,hitBackWallThisShot:false,bounceCountOnFloor:1,wallHitCountThisShot:1,rallyStrokeCount:5,lastBounceWasNick:false,timeSinceHitSec:1});
e.ball.pos.set(side*2.8,.25,4.5);e.ball.vel.set(0,-.15,7);e.ball.spin.set(14,0,0);
e.currentPredictedTrajectory=BallPhysics.simulateTrajectory(e.ball,e.tuningStore.params);
e.ballTrail.points.length=0;e.cameraTrauma=0;e.renderer.setPixelRatio(1);e.renderer.setSize(1200,720,false);e.camera.aspect=1200/720;e.camera.updateProjectionMatrix();
const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=800;const ctx=canvas.getContext('2d');
const stream=canvas.captureStream(30),rec=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8',videoBitsPerSecond:2800000}),chunks=[];
rec.ondataavailable=ev=>{if(ev.data.size)chunks.push(ev.data)};
const f={name,shotType,side,source:'39d98444fc65db9aa973d832ad287f53a5d7818d',startedAt:new Date().toISOString(),t:0,request:false,committed:false,events:[],samples:[],status:'running'};
window.__capture=f;
const original=e._handleCollisionEvent;
e._handleCollisionEvent=function(ev,options){f.events.push({t:f.t,surface:ev.surface,pos:ev.pos.toArray(),isOut:!!ev.isOut,isTin:!!ev.isTin,isNick:!!ev.isNick,bounceNumber:ev.bounceNumber,lastHitter:e.ball.lastHitter});return original.call(this,ev,options)};
const waitFrame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
const vec=o=>o?.getWorldPosition(e.player.pos.clone()).toArray();
function draw(){
 ctx.fillStyle='#101b2d';ctx.fillRect(0,0,1280,800);ctx.fillStyle='#fff';ctx.font='bold 25px sans-serif';ctx.fillText(name.replaceAll('-',' ').toUpperCase()+' — live Arcade, slowed observation',20,34);
 e.camera.position.set(-side*.5,5.4,10.8);e.camera.lookAt(0,.85,0);e.render();ctx.drawImage(e.renderer.domElement,0,65,960,576);
 e.camera.position.set(0,1.45,2.6);e.camera.lookAt(e.player.pos.x,.68,e.player.pos.z-.05);e.render();const rw=e.renderer.domElement.width,rh=e.renderer.domElement.height;ctx.drawImage(e.renderer.domElement,(rw-rh)/2,0,rh,rh,960,65,320,320);
 ctx.fillStyle='#d4eeff';ctx.font='18px monospace';let lines=[
 't '+f.t.toFixed(3)+'s  '+e.phase,
 'ball '+e.ball.pos.toArray().map(v=>v.toFixed(2)).join('  '),
 'actor '+e.player.pos.toArray().map(v=>v.toFixed(2)).join('  '),
 'stroke '+e.player.strokeMotion.phase+' / '+e.player.strokeMotion.side,
 'lead '+e.player.strokeMotion.leadFoot+'   progress '+e.player.strokeMotion.progress.toFixed(3),
 f.committed?'CONTACT EXECUTED':f.request?'SWING — incoming ball still moving':'WAITING FOR LOW DESCENDING RETURN'
 ];lines.forEach((line,i)=>ctx.fillText(line,20,675+i*21));
 ctx.font='16px sans-serif';ctx.fillText('Same live frame: body / footwork detail',965,414);
}
window.__capturePromise=(async()=>{
 try{
  rec.start();
  for(let i=0;i<270;i++){
   await waitFrame();const dt=1/120;f.t+=dt;e.elapsedTime+=dt;e._stepPhysics(dt);
   if(!f.request&&e.phase==='RALLY'&&e.ball.hitBackWallThisShot&&e.ball.vel.y<-.3&&e.ball.pos.y<.4){
    e.selectedShotType=shotType.toUpperCase();f.request=e._attemptPlayerRallyStrike({shotType,speed:1.18},false);f.requestAt=f.t;f.requestPos=e.ball.pos.toArray();f.requestVelocity=e.ball.vel.toArray();
   }
   e._updateMiiAnimation(e.player,dt);e._updateMiiAnimation(e.opponent,dt);if(e.swingVfx)e.swingVfx.update(dt,{actors:[e.player,e.opponent],ball:e.ball,camera:e.camera});e._updateEffects(dt);e.courtGeometry.update(dt);
   const center=getRacketRimWorldPoints(e.player).centerWorld;
   if(!f.committed&&e.ball.lastHitter==='player'){
    f.committed=true;f.contactAt=f.t;f.contact={ball:e.ball.pos.toArray(),velocity:e.ball.vel.toArray(),actor:e.player.pos.toArray(),racketCenter:center.toArray(),gap:center.distanceTo(e.ball.pos),yaw:e.player.root.rotation.y,lead:e.player.strokeMotion.leadFoot,side:e.player.strokeMotion.side};
   }
   f.samples.push({t:f.t,ball:e.ball.pos.toArray(),velocity:e.ball.vel.toArray(),actor:e.player.pos.toArray(),yaw:e.player.root.rotation.y,phase:e.phase,motion:e.player.strokeMotion.phase,progress:e.player.strokeMotion.progress,side:e.player.strokeMotion.side,lead:e.player.strokeMotion.leadFoot,footL:vec(e.player.rig.footLPivot),footR:vec(e.player.rig.footRPivot),racketCenter:center.toArray(),lastHitter:e.ball.lastHitter});
   draw();
   if(f.committed&&e.phase!=='RALLY')break;
  }
  await new Promise(r=>setTimeout(r,700));
  await new Promise(resolve=>{rec.onstop=resolve;rec.stop()});
  await fetch('http://127.0.0.1:3099/'+name+'.webm',{method:'POST',body:new Blob(chunks,{type:'video/webm'})});
  await new Promise(resolve=>canvas.toBlob(async blob=>{await fetch('http://127.0.0.1:3099/'+name+'.png',{method:'POST',body:blob});resolve()}));
  f.status='complete';f.endedAt=new Date().toISOString();
  await fetch('http://127.0.0.1:3099/'+name+'.json',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(f)});
 }catch(err){f.status='error';f.error=String(err)}
 finally{e._handleCollisionEvent=original;stream.getTracks().forEach(t=>t.stop())}
 return {status:f.status,contact:f.contact,events:f.events,error:f.error}
})();
return {started:name};
};
