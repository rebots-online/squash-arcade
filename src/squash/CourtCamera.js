import { Vector3, MathUtils } from 'three';
import { COURT_SPECS as C } from './CourtGeometry.js';

export const COURT_CAMERA_POINTS = [-1,1].flatMap(side=>[
  new Vector3(side*C.HALF_WIDTH,0,C.FRONT_WALL_Z),
  new Vector3(side*C.HALF_WIDTH,0,C.BACK_WALL_Z),
  new Vector3(side*C.HALF_WIDTH,C.FRONT_WALL_OUT_Y,C.FRONT_WALL_Z),
  new Vector3(side*C.HALF_WIDTH,C.BACK_WALL_OUT_Y,C.BACK_WALL_Z)
]);

/** Preserve viewpoint; retreat only enough to contain the complete court. */
export function fitCourtCamera({targetPos,targetLook,aspect=16/9,fov=48}) {
  const back=targetPos.clone().sub(targetLook).normalize();
  const right=new Vector3(0,1,0).cross(back).normalize();
  const up=back.clone().cross(right).normalize();
  const tanV=Math.tan(MathUtils.degToRad(fov/2)),tanH=tanV*Math.max(.2,aspect);
  let distance=targetPos.distanceTo(targetLook);
  for(const point of COURT_CAMERA_POINTS) {
    const delta=point.clone().sub(targetLook),depth=delta.dot(back);
    distance=Math.max(distance,depth+Math.abs(delta.dot(right))/(tanH*.9),depth+Math.abs(delta.dot(up))/(tanV*.68));
  }
  return {targetPos:targetLook.clone().addScaledVector(back,distance+.02),targetLook:targetLook.clone()};
}
