import test from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera, Vector3 } from 'three';
import { fitCourtCamera, COURT_CAMERA_POINTS } from '../src/squash/CourtCamera.js';
test('entire court stays inside screen margins at landscape and portrait aspects and lateral extremes',()=>{
  for(const aspect of [16/9,4/3,1,390/844,844/390]) for(const x of [-2.8,0,2.8]) for(const bx of [-3.2,3.2]) {
    const targetLook=new Vector3(bx*.2,1.12,-1.65),targetPos=new Vector3(x*.24,3.22,9.38);
    const pose=fitCourtCamera({targetPos,targetLook,aspect,fov:48});
    const c=new PerspectiveCamera(48,aspect,.1,220);c.position.copy(pose.targetPos);c.lookAt(pose.targetLook);c.updateMatrixWorld();
    for(const corner of COURT_CAMERA_POINTS) {
      const p=corner.clone().project(c);
      assert.ok(Math.abs(p.x)<=.90001&&Math.abs(p.y)<=.68001,`cropped ${p.toArray()} at aspect ${aspect}`);
    }
  }
});
