import { Vector3 } from 'three';
import { COURT_SPECS } from './CourtGeometry.js';

/** Setup correction is not a scored service fault. */
export function evaluateServeSetup({server,receiver,serviceSide='right'}) {
  const sign=serviceSide==='left'?-1:1,short=COURT_SPECS.SHORT_LINE_Z;
  const correctionTargets={server:new Vector3(sign*1.85,0,short+.95),receiver:new Vector3(-sign*1.45,0,short+1.35)};
  const result=reason=>({ready:reason===null,reason,correctionTargets});
  if(!server?.pos||!receiver?.pos)return result('MISSING_PLAYER');
  const x=server.pos.x*sign,z=server.pos.z;
  if(x<1.6||x>2.8||z<short+.08||z>short+1.52)return result('SERVER_POSITION');
  const rx=receiver.pos.x*sign,rz=receiver.pos.z;
  if((rx>1.2&&rz>short-.35&&rz<short+1.95)||server.pos.distanceTo(receiver.pos)<1.25)return result('RECEIVER_CLEARANCE');
  if((server.targetPos&&server.pos.distanceTo(server.targetPos)>.25)||Math.hypot(server.vel?.x||0,server.vel?.z||0)>.35||Math.hypot(receiver.vel?.x||0,receiver.vel?.z||0)>.6)return result('WAIT_FOR_ARRIVAL');
  return result(null);
}
