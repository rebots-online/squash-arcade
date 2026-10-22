import { Vector3, Quaternion } from 'three';

const grip = new Vector3();
const free = new Vector3();
const rotation = new Quaternion();
const parentRotation = new Quaternion();

/** Final presentation owner: stroke side never chooses which hand holds the racket. */
export function syncRacketGrip(actor, dt) {
  const rig = actor.rig;
  if (!rig || !actor.racketPivot || !actor.racketKinematics) return;
  const left = actor.handedness === 'left';
  const dominant = left ? rig.handLPivot : rig.handRPivot;
  const balancing = left ? rig.handRPivot : rig.handLPivot;
  if (!dominant?.parent || !balancing?.parent) return;
  actor.root.updateMatrixWorld(true);
  const handle = actor.racketMesh || actor.racketPivot;
  grip.set(0, 0.08, 0);
  handle.localToWorld(grip);
  dominant.position.copy(dominant.parent.worldToLocal(grip));
  handle.getWorldQuaternion(rotation);
  dominant.parent.getWorldQuaternion(parentRotation);
  dominant.quaternion.copy(parentRotation.invert().multiply(rotation));

  const k = actor.racketKinematics;
  const side = actor.strokeMotion?.phase !== 'idle'
    ? actor.strokeMotion?.side : k.swingActive ? k.swingSide : k.anticipationSide;
  free.copy(k.offHandTargetPos);
  // A squash backhand is one-handed. The other hand balances behind the torso,
  // rather than converging on the grip as the legacy tennis animation did.
  if (side === 'backhand' && !(k.isServe && k.swingActive)) free.set(left ? -0.42 : 0.42, 0.88, -0.28);
  actor.racketPivot.parent.localToWorld(free);
  balancing.parent.worldToLocal(free);
  // Body animation has already written the other hand this frame; retain our own
  // previous pose so that crossing into/out of backhand doesn't cause a snap.
  if (!actor.freeHandPose || actor.freeHandSide !== actor.handedness) {
    actor.freeHandPose = balancing.position.clone();
    actor.freeHandSide = actor.handedness;
  }
  actor.freeHandPose.lerp(free, 1 - Math.exp(-16 * Math.max(0, dt)));
  balancing.position.copy(actor.freeHandPose);
  actor.root.updateMatrixWorld(true);
}
