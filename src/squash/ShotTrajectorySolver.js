import * as THREE from 'three';
import { BallPhysics } from './BallPhysics.js';
import { COURT_SPECS } from './CourtGeometry.js';

const RADIUS = COURT_SPECS.BALL_RADIUS * 1.65;
const SIDE_LIMIT = COURT_SPECS.HALF_WIDTH - RADIUS;
const FRONT_LIMIT = COURT_SPECS.FRONT_WALL_Z + RADIUS;
const MAX_PROBES = 55;
const isFloor = (event) => event.surface === 'floor' || event.surface === 'nick' || event.isNick;
const isSide = (event) => event.surface.startsWith('side_wall');

/** Bounded joint solve of front-wall height and first-bounce placement. */
export class ShotTrajectorySolver {
  static solveDrive({ contactPos, spin, params, isCrossRequest = false }) {
    return this._solve({ contactPos, spin, params, isBoast: false, isCrossRequest });
  }

  static solveBoast({ contactPos, spin, params }) {
    return this._solve({ contactPos, spin, params, isBoast: true, isCrossRequest: false });
  }

  static _seed({ contactPos, spin, params, isBoast, isCrossRequest }) {
    const bp = params.ballPhysics || {};
    const f = Number(bp.surfaceFriction ?? 0.8);
    const g = Number(bp.gravity ?? 9.81);
    const magnus = Number(bp.magnusSpinCoupling ?? 0.012);
    const bite = Number(bp.spinSurfaceBite ?? 0.024);
    const H = isBoast ? 0.78 : 2.05;
    const Z = isBoast ? -3.5 : 3.8;
    const X = isBoast ? -3.145 : isCrossRequest ? -2.8 : 2.8;
    const d = contactPos.z - FRONT_LIMIT;
    const a = Z - FRONT_LIMIT;
    const g0 = g + spin.x * magnus * 8.5;
    let seed;

    if (isBoast) {
      const temperatureFactor = Math.max(0.76, Math.min(1.18, 1 + ((bp.ballTemperatureC ?? 36) - 36) * 0.011));
      const cS = Math.min(0.86, (bp.sideWallRestitution ?? 0.66) * temperatureFactor);
      const cF = 0.88;
      const dSide = SIDE_LIMIT - contactPos.x;
      const r = (2 * SIDE_LIMIT + cS / f * dSide) / (cS / f * d + cS / cF * a) + 0.04;
      const gS = g + 0.75 * spin.x * magnus * 8.5;
      const gF = g + 0.75 * 0.68 * spin.x * magnus * 8.5;
      const predict = (p) => {
        const tSide = dSide / (r * p);
        const tSF = (d - dSide / r) / (f * p);
        const tAF = a / (f * cF * p);
        const vy = (H - contactPos.y + g0 * (0.5 * tSide * tSide + f * tSide * tSF) + 0.5 * gS * tSF * tSF) / (tSide + f * tSF);
        const frontVy = f * (f * (vy - g0 * tSide) - gS * tSF) + 0.75 * spin.x * bite;
        return { vy, floorY: H + frontVy * tAF - 0.5 * gF * tAF * tAF };
      };
      let lower = 4;
      let upper = 30;
      let p = (lower + upper) / 2;
      for (let iteration = 0; iteration < 20; iteration++) {
        p = (lower + upper) / 2;
        if (predict(p).floorY > RADIUS) upper = p;
        else lower = p;
      }
      seed = new THREE.Vector3(r * p * 1.14, predict(p).vy, -p * 1.14);
    } else {
      const k = a / (0.82 * d);
      const g1 = g + 0.68 * spin.x * magnus * 8.5;
      const A = 0.5 * f * g0 * k + 0.5 * g1 * k * k;
      const B = -spin.x * bite * k;
      const D = RADIUS - H - f * k * (H - contactPos.y);
      const t = (-B + Math.sqrt(B * B - 4 * A * D)) / (2 * A);
      const p = 1.19 * d / t;
      seed = new THREE.Vector3(
        (X - contactPos.x) * p / (d + f / 0.82 * a),
        (H - contactPos.y + 0.5 * g0 * t * t) / t,
        -p
      );
    }

    if (seed.toArray().every(Number.isFinite)) return seed;
    // Keep degenerate tuning an actual finite shot attempt, without refusing it.
    const t = Math.max(0.25, Math.abs(d) / 15);
    return new THREE.Vector3((X - contactPos.x) / (2 * t), (H - contactPos.y + 0.5 * 9.81 * t * t) / t, -Math.max(1, Math.abs(d)) / t);
  }

  static _probe({ contactPos, vel, spin, params, isBoast, isCrossRequest }) {
    const sim = BallPhysics.simulateTrajectory({ pos: contactPos, vel, spin }, params, null, { dt: 1 / 120, maxTimeSec: 3.3 });
    const H = isBoast ? 0.78 : 2.05;
    const X = isBoast ? -3.145 : isCrossRequest ? -2.8 : 2.8;
    const Z = isBoast ? -3.5 : 3.8;
    const frontIndex = sim.events.findIndex((event) => event.surface === 'front_wall' || event.surface === 'tin');
    const floorIndex = sim.events.findIndex(isFloor);
    const front = sim.events[frontIndex];
    const floor = sim.events[floorIndex];
    const throughFloor = sim.events.slice(0, floorIndex < 0 ? undefined : floorIndex + 1);
    const beforeFloor = sim.events.slice(0, floorIndex < 0 ? undefined : floorIndex);
    const landing = sim.firstFloorBouncePos || sim.finalPos;
    let landingX = landing.x;
    let landingZ = landing.z;
    if (beforeFloor.some((event) => event.surface === 'back_wall')) {
      landingZ = 2 * (COURT_SPECS.BACK_WALL_Z - RADIUS) - landingZ;
    }
    if (isBoast && beforeFloor.some((event) => isSide(event) && event.pos.x < 0)) {
      landingX = -2 * SIDE_LIMIT - landingX;
    }
    const residual = [3 * ((front ? front.pos.y : sim.finalPos.y) - H), landingX - X, landingZ - Z]
      .map((value) => Number.isFinite(value) ? value : 100);
    const noFault = throughFloor.every((event) => !event.isOut && !event.isTin && event.surface !== 'tin');
    const sides = beforeFloor.filter(isSide);
    const orderValid = isBoast
      ? sides.length === 1 && sides[0].pos.x > 0 && sim.events.indexOf(sides[0]) < frontIndex && !beforeFloor.some((event) => event.surface === 'back_wall')
      : frontIndex === 0 && !beforeFloor.some((event) => isSide(event) || event.surface === 'back_wall');
    const valid = !!front && !!floor && !!sim.firstFloorBouncePos && frontIndex < floorIndex && noFault && orderValid;
    const trueNick = !!floor && (floor.surface === 'nick' || floor.isNick);
    const deadNick = trueNick && sim.maxBounceHeightAfterFirst < 0.1 && !!sim.secondFloorBouncePos && sim.secondFloorBouncePos.z < -1.5;
    const converged = valid && Math.abs(front.pos.y - H) <= 0.04 && Math.abs(landingZ - Z) <= 0.12 && (isBoast ? deadNick : Math.abs(landingX - X) <= 0.06);
    const score = residual.reduce((sum, value) => sum + value * value, 0) + (valid ? 0 : 50) + (isBoast && !trueNick ? 0.1 : 0);
    return { vel: vel.clone(), residual, score, valid, converged, trueNick };
  }

  static _linearStep(jacobian, residual) {
    const rows = jacobian.map((row, index) => [...row, -residual[index]]);
    if (!rows.flat().every(Number.isFinite)) return null;
    for (let column = 0; column < 3; column++) {
      let pivot = column;
      for (let row = column + 1; row < 3; row++) {
        if (Math.abs(rows[row][column]) > Math.abs(rows[pivot][column])) pivot = row;
      }
      if (Math.abs(rows[pivot][column]) < 1e-9) return null;
      [rows[column], rows[pivot]] = [rows[pivot], rows[column]];
      const divisor = rows[column][column];
      for (let entry = column; entry < 4; entry++) rows[column][entry] /= divisor;
      for (let row = 0; row < 3; row++) {
        if (row === column) continue;
        const factor = rows[row][column];
        for (let entry = column; entry < 4; entry++) rows[row][entry] -= factor * rows[column][entry];
      }
    }
    const delta = rows.map((row) => row[3]);
    return delta.every(Number.isFinite) ? delta : null;
  }

  static _solve(options) {
    const sideSign = options.contactPos.x < 0 ? -1 : 1;
    const contactPos = options.contactPos.clone();
    contactPos.x = Math.abs(contactPos.x);
    const spin = options.spin.clone();
    spin.y *= sideSign;
    const canonical = { ...options, contactPos, spin };
    let probes = 0;
    let bestValid = null;
    let bestFinite = null;
    const probe = (vel) => {
      probes++;
      const candidate = this._probe({ ...canonical, vel });
      if (!bestFinite || candidate.score < bestFinite.score) bestFinite = candidate;
      if (candidate.valid && (!bestValid || (options.isBoast && candidate.trueNick && !bestValid.trueNick) || (candidate.trueNick === bestValid.trueNick && candidate.score < bestValid.score))) bestValid = candidate;
      return candidate;
    };
    let current = probe(this._seed(canonical));
    const increments = [0.16, 0.12, 0.16];
    for (let iteration = 0; iteration < 9 && !current.converged && probes + 3 < MAX_PROBES; iteration++) {
      const jacobian = [[], [], []];
      for (let axis = 0; axis < 3; axis++) {
        const vel = current.vel.clone();
        vel.setComponent(axis, vel.getComponent(axis) + increments[axis]);
        const shifted = probe(vel);
        for (let row = 0; row < 3; row++) jacobian[row][axis] = (shifted.residual[row] - current.residual[row]) / increments[axis];
      }
      const step = this._linearStep(jacobian, current.residual);
      if (!step) break;
      const delta = new THREE.Vector3(
        THREE.MathUtils.clamp(step[0], -3, 3),
        THREE.MathUtils.clamp(step[1], -2, 2),
        THREE.MathUtils.clamp(step[2], -3, 3)
      );
      let accepted = null;
      for (const damping of [1, 0.5, 0.25]) {
        if (probes >= MAX_PROBES) break;
        const candidate = probe(current.vel.clone().addScaledVector(delta, damping));
        if (candidate.score < current.score) {
          accepted = candidate;
          break;
        }
      }
      if (!accepted) break;
      current = accepted;
    }
    const vel = (bestValid || bestFinite).vel.clone();
    vel.x *= sideSign;
    return vel;
  }
}
