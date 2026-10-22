// ============================================================================
// ARGON SQUASH — MAIN GAME ENGINE & MODULE ORCHESTRATOR
// "Physical Chess, Wonder First" — Modular, Playable, Tunable
// ============================================================================

import * as THREE from 'three';
import { GLTFLoader } from '../assets/vendor/GLTFLoader.js';
import { HudUI } from './hud_ui.js';
import * as MotionControlsMod from './motion_controls.js';
import * as AudioEngineMod from './audio_engine.js';
import { RacketKinematicsController } from './racket_kinematics.js';
import {
  upgradeMiiCharacterMaterials,
  upgradeRacketMaterials,
  updateCharacterContactShadow
} from './mii_model_overhaul.js';
import { MiiBodyAnimator } from './mii_body_animation.js';
import { MiiFacialFXController } from './mii_facial_fx.js';
import { SwingVFXManager } from './swing_vfx.js';

// Modular Squash Architecture
import { tuningStore } from './squash/TuningConfig.js';
import { CourtGeometry, COURT_SPECS } from './squash/CourtGeometry.js';
import { NickCollisionModel } from './squash/NickCollisionModel.js';
import { BallPhysics } from './squash/BallPhysics.js';
import { RulesEngine } from './squash/RulesEngine.js';
import { ShotController, SQUASH_SHOT_TYPES } from './squash/ShotController.js';
import { PlayerMovement } from './squash/PlayerMovement.js';
import { StrokeMotion } from './squash/StrokeMotion.js';
import { planVolleyContact } from './squash/VolleyPlanner.js';
import { PointPresentation } from './squash/PointPresentation.js';
import { evaluateServeSetup } from './squash/ServeSetup.js';
import { fitCourtCamera } from './squash/CourtCamera.js';
import { OpponentAI } from './squash/OpponentAI.js';
import { IntroDirector } from './squash/IntroDirector.js';
import { TuningPanel } from './squash/TuningPanel.js';
import { TestHarness } from './squash/TestHarness.js';

const FIXED_DT = 1 / 120;

function normalizeCourtThemeId(rawTheme = 'psa_glass') {
  const t = String(rawTheme || 'psa_glass').toLowerCase();
  if (t.includes('hardwood')) return 'hardwood_club';
  if (t.includes('neon') || t.includes('cyber')) return 'neon_studio';
  return 'psa_glass';
}

class BallRibbonTrail {
  constructor(scene, maxPoints = 48) {
    this.scene = scene;
    this.maxPoints = maxPoints;
    this.points = [];
    this.color = new THREE.Color(0xffffff);
    this.accentColor = new THREE.Color(0xffe95a);
    this.baseWidth = 0.16;

    const vertexCount = maxPoints * 2;
    this.positions = new Float32Array(vertexCount * 3);
    this.colors = new Float32Array(vertexCount * 4);
    const indices = [];
    for (let i = 0; i < maxPoints - 1; i++) {
      const a = i * 2;
      const b = a + 1;
      const c = a + 2;
      const d = a + 3;
      indices.push(a, b, c, b, d, c);
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 4));
    this.geometry.setIndex(indices);

    this.material = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 6;
    this.scene.add(this.mesh);
  }

  setStyle(shotType = 'DRIVE', isPower = false) {
    const t = String(shotType || 'DRIVE').toUpperCase();
    if (isPower || t.includes('KILL') || t.includes('SMASH') || t.includes('POWER')) {
      this.color.setHex(0xffffff);
      this.accentColor.setHex(0x38bdf8);
      this.baseWidth = 0.19;
    } else if (t.includes('DROP') || t.includes('CUT') || t.includes('SLICE')) {
      this.color.setHex(0xffffff);
      this.accentColor.setHex(0x4ade80);
      this.baseWidth = 0.15;
    } else if (t.includes('BOAST')) {
      this.color.setHex(0xffffff);
      this.accentColor.setHex(0xfb923c);
      this.baseWidth = 0.17;
    } else if (t.includes('LOB')) {
      this.color.setHex(0xffffff);
      this.accentColor.setHex(0xe879f9);
      this.baseWidth = 0.15;
    } else {
      this.color.setHex(0xffffff);
      this.accentColor.setHex(0xfacc15);
      this.baseWidth = 0.16;
    }
  }

  clear() {
    this.points.length = 0;
    this.mesh.visible = false;
  }

  pushPoint(p) {
    this.points.unshift(p.clone());
    if (this.points.length > this.maxPoints) {
      this.points.pop();
    }
  }

  seedArc(start, end, archHeight = 0.35) {
    this.points.length = 0;
    for (let i = 0; i < this.maxPoints; i++) {
      const t = 1 - i / (this.maxPoints - 1);
      const pt = new THREE.Vector3().lerpVectors(start, end, t);
      pt.y += Math.sin(t * Math.PI) * archHeight;
      this.points.push(pt);
    }
    this.mesh.visible = true;
  }

  updateGeometry(camera) {
    const count = this.points.length;
    if (count < 2) {
      this.mesh.visible = false;
      return;
    }
    this.mesh.visible = true;

    const camPos = camera.position;
    const tangent = new THREE.Vector3();
    const toCam = new THREE.Vector3();
    const side = new THREE.Vector3();
    const col = new THREE.Color();

    for (let i = 0; i < this.maxPoints; i++) {
      const idx = Math.min(i, count - 1);
      const pt = this.points[idx];
      const nextIdx = Math.min(idx + 1, count - 1);
      const prevIdx = Math.max(idx - 1, 0);

      tangent.subVectors(this.points[prevIdx], this.points[nextIdx]);
      if (tangent.lengthSq() < 1e-6) tangent.set(0, 0, 1);
      else tangent.normalize();

      toCam.subVectors(camPos, pt).normalize();
      side.crossVectors(tangent, toCam).normalize();
      if (side.lengthSq() < 1e-4) side.set(1, 0, 0);

      const life = 1 - idx / Math.max(1, count - 1);
      const halfW = this.baseWidth * (0.22 + 0.78 * Math.pow(life, 0.65)) * 0.5;
      const alpha = Math.pow(life, 0.9) * 0.85;
      col.copy(this.color).lerp(this.accentColor, (1 - life) * 0.68);

      const v0 = i * 2;
      const v1 = v0 + 1;
      this.positions[v0 * 3 + 0] = pt.x + side.x * halfW;
      this.positions[v0 * 3 + 1] = pt.y + side.y * halfW;
      this.positions[v0 * 3 + 2] = pt.z + side.z * halfW;

      this.positions[v1 * 3 + 0] = pt.x - side.x * halfW;
      this.positions[v1 * 3 + 1] = pt.y - side.y * halfW;
      this.positions[v1 * 3 + 2] = pt.z - side.z * halfW;

      this.colors[v0 * 4 + 0] = col.r;
      this.colors[v0 * 4 + 1] = col.g;
      this.colors[v0 * 4 + 2] = col.b;
      this.colors[v0 * 4 + 3] = alpha;

      this.colors[v1 * 4 + 0] = col.r;
      this.colors[v1 * 4 + 1] = col.g;
      this.colors[v1 * 4 + 2] = col.b;
      this.colors[v1 * 4 + 3] = alpha;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }
}

function createSwingArcMesh() {
  const geom = new THREE.RingGeometry(0.22, 0.68, 28, 1, -Math.PI * 0.28, Math.PI * 0.56);
  const pos = geom.attributes.position;
  const colors = new Float32Array(pos.count * 4);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const u = (Math.atan2(y, x) + Math.PI * 0.28) / (Math.PI * 0.56);
    const v = (Math.hypot(x, y) - 0.22) / (0.68 - 0.22);
    const a = Math.max(0, Math.min(1, u * (0.35 + 0.65 * v)));
    colors[i * 4 + 0] = 0.97;
    colors[i * 4 + 1] = 0.99;
    colors[i * 4 + 2] = 1.0;
    colors[i * 4 + 3] = a * 0.82;
  }
  geom.setAttribute('color', new THREE.BufferAttribute(colors, 4));
  const mat = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.visible = false;
  mesh.renderOrder = 7;
  return mesh;
}

function createContactShadowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 60);
  grad.addColorStop(0, 'rgba(8, 14, 22, 0.78)');
  grad.addColorStop(0.55, 'rgba(8, 14, 22, 0.44)');
  grad.addColorStop(1, 'rgba(8, 14, 22, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

function createArenaSkyTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#060d18');
  grad.addColorStop(0.45, '#0d1e34');
  grad.addColorStop(0.82, '#173252');
  grad.addColorStop(1, '#204268');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Draws the Roche hexagonal emblem in one of the two user-specified sample styles:
 * - variant === 'feathered_white': White background with 3D drop-shadow effect, where the white
 *   background is softly feathered into transparency around all edges so it blends seamlessly
 *   into the stadium seating wall background.
 * - variant === 'transparent': Clean transparent background with crisp Roche hexagon & lettering.
 */
function drawRocheHexSampleLogo(ctx, cx, cy, rx, ry, variant = 'transparent') {
  ctx.save();

  if (variant === 'feathered_white') {
    // 1. Softly feathered white background blended organically into the stadium background
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(rx * 1.46, ry * 1.48);
    const featherGrad = ctx.createRadialGradient(0, 0, 0.05, 0, 0, 1.0);
    featherGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.97)');
    featherGrad.addColorStop(0.36, 'rgba(255, 255, 255, 0.92)');
    featherGrad.addColorStop(0.56, 'rgba(248, 252, 255, 0.72)');
    featherGrad.addColorStop(0.74, 'rgba(240, 248, 255, 0.38)');
    featherGrad.addColorStop(0.88, 'rgba(232, 244, 255, 0.12)');
    featherGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
    ctx.fillStyle = featherGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 1.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const traceHexagon = (offsetX = 0, offsetY = 0) => {
    const flatX = rx * 0.56;
    ctx.beginPath();
    ctx.moveTo(cx - flatX + offsetX, cy - ry + offsetY);
    ctx.lineTo(cx + flatX + offsetX, cy - ry + offsetY);
    ctx.lineTo(cx + rx + offsetX, cy + offsetY);
    ctx.lineTo(cx + flatX + offsetX, cy + ry + offsetY);
    ctx.lineTo(cx - flatX + offsetX, cy + ry + offsetY);
    ctx.lineTo(cx - rx + offsetX, cy + offsetY);
    ctx.closePath();
  };

  const strokeW = Math.max(4, ry * 0.125);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  if (variant === 'feathered_white') {
    // Soft 3D drop-shadow effect under hexagon & wordmark on the feathered white pillow
    ctx.save();
    traceHexagon(5, 7);
    ctx.strokeStyle = 'rgba(15, 36, 66, 0.34)';
    ctx.lineWidth = strokeW + 2;
    ctx.shadowColor = 'rgba(8, 22, 44, 0.45)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 6;
    ctx.stroke();
    ctx.restore();

    // Main Roche Cobalt Blue hexagon
    ctx.save();
    traceHexagon(0, 0);
    ctx.strokeStyle = '#0066CC';
    ctx.lineWidth = strokeW;
    ctx.stroke();
    ctx.restore();

    // Wordmark "Roche" with shadow effect
    const fontSize = Math.round(ry * 0.88);
    ctx.font = `700 ${fontSize}px "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = 'rgba(15, 36, 66, 0.30)';
    ctx.fillText('Roche', cx + 4, cy + 5);

    ctx.save();
    ctx.shadowColor = 'rgba(10, 28, 54, 0.35)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#0066CC';
    ctx.fillText('Roche', cx, cy + 1);
    ctx.restore();
  } else {
    // Transparent sample logo variant: crisp transparent background with subtle depth shadow
    ctx.save();
    traceHexagon(5, 6);
    ctx.strokeStyle = 'rgba(7, 22, 16, 0.65)';
    ctx.lineWidth = strokeW + 3;
    ctx.stroke();
    ctx.restore();

    // Outer ice-white clarity rim so the transparent blue hex pops against dark green bleachers
    ctx.save();
    traceHexagon(0, 0);
    ctx.strokeStyle = 'rgba(230, 246, 255, 0.92)';
    ctx.lineWidth = strokeW + 3.5;
    ctx.stroke();

    ctx.strokeStyle = '#0a7cff';
    ctx.lineWidth = strokeW;
    ctx.stroke();
    ctx.restore();

    const fontSize = Math.round(ry * 0.88);
    ctx.font = `700 ${fontSize}px "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = 'rgba(7, 22, 16, 0.72)';
    ctx.fillText('Roche', cx + 4, cy + 5);

    ctx.lineWidth = 3.5;
    ctx.strokeStyle = 'rgba(235, 248, 255, 0.92)';
    ctx.strokeText('Roche', cx, cy + 1);
    ctx.fillStyle = '#0a7cff';
    ctx.fillText('Roche', cx, cy + 1);
  }

  ctx.restore();
}

/**
 * Generates the high-resolution 2048x512 stadium banner texture replacing "Argon Tennis"
 * with "ROCHE SQUASH" flanked by both Roche sample logos (feathered-white + shadow on left,
 * transparent on right). Sets flipY = false to match GLTF UV coordinates in stadium_court.glb.
 */
function createRocheSquashStadiumBannerTexture(renderer, { flipY = false } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Left Sample Logo: White background softly feathered into background + 3D shadow effect
  drawRocheHexSampleLogo(ctx, 232, 256, 150, 82, 'feathered_white');

  // 2. Right Sample Logo: Transparent background Roche hexagonal emblem
  drawRocheHexSampleLogo(ctx, 1816, 256, 150, 82, 'transparent');

  // 3. Center Stadium Wordmark: "ROCHE SQUASH" (replacing "Argon Tennis")
  const text = 'ROCHE SQUASH';
  const centerX = 1024;
  const centerY = 264;
  const maxTextWidth = 1090;

  ctx.save();
  ctx.font = 'italic 900 148px "Inter", "Segoe UI", "Arial Black", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';

  // Extruded 3D stadium drop-shadow layers matching the classic show-court signage
  for (let d = 14; d >= 4; d -= 2) {
    ctx.fillStyle = d > 9 ? 'rgba(22, 42, 30, 0.55)' : '#4e6354';
    ctx.fillText(text, centerX + d, centerY + d * 0.95, maxTextWidth);
  }

  // Subtle dark-emerald outline for crisp stadium separation
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#3b4f41';
  ctx.strokeText(text, centerX, centerY, maxTextWidth);

  // Pure luminous white face
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, centerX, centerY, maxTextWidth);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = flipY;
  if (renderer?.capabilities?.getMaxAnisotropy) {
    tex.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
  }
  tex.needsUpdate = true;
  return tex;
}

export class ArgonTennisEngine {
  constructor() {
    this.params = new URLSearchParams(window.location.search);
    this.urlState = (this.params.get('state') || '').toLowerCase();
    this.urlRoom = (this.params.get('room') || '').trim().toUpperCase();
    this.urlRole = (this.params.get('role') || 'p1').trim().toLowerCase() === 'p2' ? 'p2' : 'p1';
    this.urlMode = (this.params.get('mode') || this.params.get('difficulty') || '').toLowerCase();
    this.urlAutoPlay = this.params.has('play') || Boolean(this.urlState);

    this.roomId = this.urlRoom || 'default';
    this.playerRole = this.urlRole;
    this.isMultiplayer = Boolean(this.urlRoom && this.urlRoom !== 'DEFAULT') || this.urlMode === '1v1';
    this.roomStatus = {
      roomId: this.roomId,
      p1Online: true,
      p2Online: false,
      p1Phone: false,
      p2Phone: false,
      tunnelUrl: '',
      urls: null
    };
    this.lastAppliedSnapshotSeq = 0;
    this.lastSyncSentAt = 0;
    this.bannerSeq = 0;
    this.lastBannerBroadcast = null;

    // 1. Central Reactive Tuning Store
    this.tuningStore = tuningStore;

    // 2. Renderer, Scene & Camera
    this.canvas = document.getElementById('game-canvas');
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x091320);
    this.scene.fog = new THREE.FogExp2(0x091320, 0.012);

    this.camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 220);
    this.cameraMode = 'RALLY_CAM';
    this.manualCameraOverride = null;
    this.cameraPosSmooth = new THREE.Vector3(0, 3.25, 9.45);
    this.cameraLookSmooth = new THREE.Vector3(0, 1.15, -1.65);
    this.cameraTrauma = 0;

    // 3. Instantiate Modular Squash Subsystems
    this.courtGeometry = new CourtGeometry(this.scene, this.renderer, {
      theme: normalizeCourtThemeId(this.tuningStore.params.rulesAndView.courtTheme),
      tinHeight: this.tuningStore.params.rulesAndView.tinHeightMeters
    });
    this.courtGeometry.build();

    this.rulesEngine = new RulesEngine({
      scoringMode: this.tuningStore.params.rulesAndView.scoringMode,
      gamesToWin: 2
    });
    this.shotController = new ShotController();
    this.opponentAI = new OpponentAI('opponent');
    this.playerAI = new OpponentAI('player');
    this.pointPresentation = new PointPresentation();
    this.pendingPointOutcome = null;
    for (const type of ['keydown','keyup','pointerdown','pointerup','pointercancel','click']) {
      window.addEventListener(type, event => {
        const result=this.pointPresentation.input(event);
        if(result.consume){event.preventDefault();event.stopImmediatePropagation();}
        if(result.skip) this._finishPointPresentation();
      }, {capture:true,passive:false});
    }

    // 4. Match & Score State
    const initialDiff = this.isMultiplayer
      ? '1v1'
      : ['casual', 'pro', 'ai_vs_ai', '1v1'].includes(this.urlMode)
        ? this.urlMode
        : 'casual';
    this.matchConfig = {
      gamesToWin: initialDiff === '1v1' ? 1 : 2,
      scoringSystem: 'PAR_11',
      courtTheme: 'psa_glass',
      inputMode: 'mouse',
      difficulty: initialDiff
    };

    this.score = this.rulesEngine.score;
    this.phase = 'RALLY';
    this.phaseTimer = 0;
    this.selectedShotType = 'TOPSPIN';
    this.p2SelectedShotType = 'TOPSPIN';
    this.spectatorMatchMode = !this.isMultiplayer && this.urlState !== 'intro' && this.urlState !== 'wonder' && this.urlState !== 'skills';
    this.autoPlayMode = this.urlAutoPlay || this.spectatorMatchMode;
    this.userHasInteracted = false;
    this.persistentStateLock = false;
    this.narratorInviteTimerSec = 0;
    this.narratorFirstInviteDone = false;
    this.pendingUserSwing = null;
    this.pendingP2Swing = null;
    this.pendingServeSwing = null;
    this.currentPredictedTrajectory = null;
    this.lastSurfaceContact = 'Ready';
    this.currentFps = 60;

    // 5. Squash Ball & Shared-Court Actors (both face Front Wall Z = -4.875m)
    this.ball = {
      mesh: null,
      pos: new THREE.Vector3(1.1, 1.05, 1.45),
      vel: new THREE.Vector3(0, 0, 0),
      spin: new THREE.Vector3(0, 0, 0),
      inPlay: false,
      lastHitter: 'player',
      isServeShot: false,
      hitFrontWallThisShot: false,
      bounceCountOnFloor: 0,
      wallHitCountThisShot: 0,
      lastBounceWasNick: false,
      shotType: 'DRIVE',
      isDisguised: false,
      isPowerShot: false,
      rallyStrokeCount: 0
    };

    this.player = this._createActorState('player', 1, new THREE.Vector3(0.75, 0, 1.35));
    this.opponent = this._createActorState('opponent', 1, new THREE.Vector3(-0.75, 0, 1.15));
    this.playerPartner = this._createActorState('player_partner', 1, new THREE.Vector3(-8.5, 0, 8.5));
    this.opponentPartner = this._createActorState('opponent_partner', 1, new THREE.Vector3(8.5, 0, 8.5));

    this._applyDifficultyTuning(this.matchConfig.difficulty);

    this.crowdScene = null;
    this.cheerEnergy = 0.25;
    this.ballTrail = new BallRibbonTrail(this.scene, 48);
    this.bounceRings = [];
    this.starParticles = [];

    this.racketKinematics = new RacketKinematicsController();
    this.bodyAnimator = new MiiBodyAnimator();
    this.facialFX = new MiiFacialFXController(this.scene);
    this.swingVfx = new SwingVFXManager(this.scene);

    this._setupLightingAndSky();
    this._setupEffectsPools();
    this._initHudAndControllers();

    // 6. Initialize Skills-Demo IntroDirector & Live Tuning Lab Panel
    this.introDirector = new IntroDirector(this);
    this.tuningPanel = new TuningPanel(this, this.tuningStore);

    // Subscribe to reactive TuningConfigStore updates
    this.tuningStore.onChange((params, detail) => {
      const theme = normalizeCourtThemeId(params.rulesAndView.courtTheme);
      this.courtGeometry.applyTheme(theme);
      this.courtGeometry.setTinHeight(params.rulesAndView.tinHeightMeters);
      this.hud?.updateAutoTStatus(params.movementAndAI.autoTReturn !== false);
      this.hud?.updateCourtThemeLabel(theme);
      if (this.audioEngine) {
        if (typeof params.rulesAndView.refereeVoiceEnabled === 'boolean') {
          this.audioEngine.setRefereeVoiceEnabled(params.rulesAndView.refereeVoiceEnabled);
        }
        if (params.rulesAndView.refereeVoicePitch) {
          this.audioEngine.setRefereeVoicePitch(params.rulesAndView.refereeVoicePitch);
        }
        this._syncRefereeVoiceUI?.();
      }
      if (this.motionController) {
        if (params.rulesAndView.handedness) {
          this.motionController.setHandedness(params.rulesAndView.handedness);
        }
        if (this.motionController.strokeClassifier) {
          this.motionController.strokeClassifier.setConfig({
            uncertainThreshold: params.shotMechanics.biomechUncertainThreshold,
            lockConfidenceThreshold: params.shotMechanics.biomechLockThreshold
          });
        }
      }
      if (detail?.key === 'scoringMode') {
        this.rulesEngine.scoringMode = params.rulesAndView.scoringMode;
        this._syncScoreboardHUD();
      }
    });

    this.clock = new THREE.Clock();
    this.physicsAccumulator = 0;
    this.elapsedTime = 0;
    window.addEventListener('resize', () => this._onResize());
  }

  _createActorState(role, sideSign, pos) {
    const speeds = { player: 6.8, player_partner: 6.5, opponent: 6.6, opponent_partner: 6.2 };
    return {
      role,
      sideSign,
      root: new THREE.Group(),
      model: null,
      parts: {},
      racketPivot: new THREE.Group(),
      racketMesh: null,
      swingArcMesh: null,
      shadowBlob: null,
      pos: pos.clone(),
      vel: new THREE.Vector3(),
      targetPos: pos.clone(),
      maxSpeed: speeds[role] || 6.8,
      stridePhase: 0,
      swingTimer: 0,
      swingDuration: 0.32,
      swingCooldown: 0,
      swingType: 'forehand',
      arcVisibleTimer: 0,
      manualPrepCharge: 0,
      _engineRef: this
    };
  }

  _applyDifficultyTuning(diff = 'casual') {
    const d = String(diff || 'casual').toLowerCase();
    this.matchConfig.difficulty = d;
    if (d === '1v1') {
      this.isMultiplayer = true;
      this.spectatorMatchMode = false;
      this.matchConfig.gamesToWin = 1;
      this.player.maxSpeed = 7.2;
      this.opponent.maxSpeed = 7.2;
    } else if (d === 'ai_vs_ai') {
      this.isMultiplayer = false;
      this.player.maxSpeed = 7.1;
      this.opponent.maxSpeed = 7.1;
      this.tuningStore.setParam('movementAndAI', 'aiAnticipationStrength', 0.84);
      this.tuningStore.setParam('movementAndAI', 'aiReactionDelayMs', 145);
      this.tuningStore.setParam('movementAndAI', 'aiAggression', 0.74);
    } else if (d === 'pro') {
      this.isMultiplayer = Boolean(this.urlRoom && this.urlRoom !== 'DEFAULT');
      this.player.maxSpeed = 7.0;
      this.opponent.maxSpeed = 6.9;
      this.tuningStore.setParam('movementAndAI', 'aiAnticipationStrength', 0.82);
      this.tuningStore.setParam('movementAndAI', 'aiReactionDelayMs', 155);
      this.tuningStore.setParam('movementAndAI', 'aiAggression', 0.72);
    } else {
      this.isMultiplayer = Boolean(this.urlRoom && this.urlRoom !== 'DEFAULT');
      this.player.maxSpeed = 7.2;
      this.opponent.maxSpeed = 6.3;
      this.tuningStore.setParam('movementAndAI', 'aiAnticipationStrength', 0.65);
      this.tuningStore.setParam('movementAndAI', 'aiReactionDelayMs', 210);
      this.tuningStore.setParam('movementAndAI', 'aiAggression', 0.52);
    }
  }

  _setupLightingAndSky() {
    const skyGeom = new THREE.SphereGeometry(180, 32, 18);
    const skyMat = new THREE.MeshBasicMaterial({
      map: createArenaSkyTexture(),
      side: THREE.BackSide,
      depthWrite: false,
      fog: false
    });
    this.skyDome = new THREE.Mesh(skyGeom, skyMat);
    this.scene.add(this.skyDome);

    const hemi = new THREE.HemisphereLight(0xd8ecff, 0x223042, 1.18);
    hemi.position.set(0, 30, 0);
    this.scene.add(hemi);

    this.sunLight = new THREE.DirectionalLight(0xfff6e5, 2.1);
    this.sunLight.position.set(6.5, 16.5, 9.5);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 45;
    const d = 11;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0004;
    this.scene.add(this.sunLight);

    // Overhead Squash Show-Court Rig Spotlight
    this.courtSpotLight = new THREE.SpotLight(0xeef8ff, 1.85, 28, Math.PI * 0.42, 0.45, 1.0);
    this.courtSpotLight.position.set(0, 9.2, -0.5);
    this.courtSpotLight.target.position.set(0, 0, -1.2);
    this.scene.add(this.courtSpotLight);
    this.scene.add(this.courtSpotLight.target);

    const shadowTex = createContactShadowTexture();
    const makeShadow = (radius, opacity) => {
      const geom = new THREE.PlaneGeometry(radius * 2, radius * 2);
      geom.rotateX(-Math.PI / 2);
      const mat = new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        opacity,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.y = 0.018;
      mesh.renderOrder = 2;
      this.scene.add(mesh);
      return mesh;
    };

    this.player.shadowBlob = makeShadow(0.54, 0.82);
    this.opponent.shadowBlob = makeShadow(0.54, 0.82);
    this.playerPartner.shadowBlob = makeShadow(0.5, 0.0);
    this.playerPartner.shadowBlob.visible = false;
    this.opponentPartner.shadowBlob = makeShadow(0.5, 0.0);
    this.opponentPartner.shadowBlob.visible = false;
    this.ballShadowBlob = makeShadow(0.22, 0.88);
  }

  _setupEffectsPools() {
    for (let i = 0; i < 8; i++) {
      const geom = new THREE.RingGeometry(0.06, 0.16, 28);
      geom.rotateX(-Math.PI / 2);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.visible = false;
      mesh.position.y = 0.02;
      mesh.renderOrder = 3;
      this.scene.add(mesh);
      this.bounceRings.push({ mesh, age: 0, active: false });
    }

    const starGeom = new THREE.OctahedronGeometry(0.06, 0);
    for (let i = 0; i < 36; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xffea28 : 0x38bdf8,
        transparent: true,
        opacity: 0,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(starGeom, mat);
      mesh.visible = false;
      mesh.renderOrder = 8;
      this.scene.add(mesh);
      this.starParticles.push({ mesh, vel: new THREE.Vector3(), age: 0, maxAge: 0.42, active: false });
    }
  }

  _initHudAndControllers() {
    this.hud = new HudUI({
      onSelectMatchLength: (gamesToWin, scoringSystem) => {
        this.matchConfig.gamesToWin = gamesToWin;
        if (scoringSystem) {
          this.matchConfig.scoringSystem = scoringSystem;
          this.tuningStore.setParam('rulesAndView', 'scoringMode', scoringSystem);
        }
        this.rulesEngine.resetMatch({
          gamesToWin,
          scoringMode: this.matchConfig.scoringSystem
        });
        this.score = this.rulesEngine.score;
        this._syncScoreboardHUD();
      },
      onSelectCourtTheme: (rawTheme) => {
        const theme = normalizeCourtThemeId(rawTheme);
        this.matchConfig.courtTheme = theme;
        this.tuningStore.setParam('rulesAndView', 'courtTheme', theme);
      },
      onCycleCourtTheme: () => {
        const themes = ['psa_glass', 'hardwood_club', 'neon_studio'];
        const current = normalizeCourtThemeId(this.tuningStore.params.rulesAndView.courtTheme);
        const idx = themes.indexOf(current);
        const next = themes[(idx + 1) % themes.length];
        this.tuningStore.setParam('rulesAndView', 'courtTheme', next);
      },
      onToggleAutoT: () => {
        const cur = this.tuningStore.params.movementAndAI.autoTReturn !== false;
        const next = !cur;
        this.tuningStore.setParam('movementAndAI', 'autoTReturn', next);
        this.hud.updateAutoTStatus(next);
      },
      onToggleTuningLab: () => {
        this.tuningPanel?.toggle();
      },
      onIntroSlowMoReplay: () => {
        this.introDirector?.triggerSlowMoReplay();
      },
      onIntroNextAction: (action) => {
        if (!this.introDirector) return;
        // Step names (SKILL_n_FEED / SKILL_n_STRIKE / SKILL_CAPSTONE) jump
        // directly; everything else exits to the playable match.
        if (typeof action === 'string' && action.startsWith('SKILL')) {
          this.introDirector._enterStep(action);
        } else {
          this.introDirector.skipToPlayableMatch();
        }
      },
      onSelectDifficulty: (diff) => {
        this._applyDifficultyTuning(diff);
        if (diff === '1v1' && (!this.roomId || this.roomId === 'default')) {
          this.createMultiplayerRoom();
        }
      },
      onCreateMultiplayerRoom: async (opts = {}) => await this.createMultiplayerRoom(opts),
      onSelectInputMode: (mode) => {
        this.matchConfig.inputMode = mode;
        if (mode === 'webcam' && this.motionController) {
          this.motionController.enableWebcam();
        }
      },
      onStartIntro: ({ courtTheme } = {}) => {
        if (courtTheme) {
          this.tuningStore.setParam('rulesAndView', 'courtTheme', normalizeCourtThemeId(courtTheme));
        }
        this.autoPlayMode = false;
        this.userHasInteracted = true;
        this.persistentStateLock = false;
        this.startWonderIntro('SKILL_1_FEED');
      },
      onStartMatch: ({ gamesToWin, scoringSystem, courtTheme, inputMode, difficulty }) => {
        if (gamesToWin) this.matchConfig.gamesToWin = gamesToWin;
        if (scoringSystem) {
          this.matchConfig.scoringSystem = scoringSystem;
          this.tuningStore.setParam('rulesAndView', 'scoringMode', scoringSystem);
        }
        if (courtTheme) {
          const theme = normalizeCourtThemeId(courtTheme);
          this.matchConfig.courtTheme = theme;
          this.tuningStore.setParam('rulesAndView', 'courtTheme', theme);
        }
        this.matchConfig.inputMode = inputMode || 'mouse';
        // "Play Match Now" ALWAYS launches real play — AI vs AI is reached via
        // the spectator pill/showcase, never through this button. If ai_vs_ai
        // is still selected, coerce to a playable difficulty.
        let startDifficulty = difficulty;
        if (startDifficulty === 'ai_vs_ai') {
          startDifficulty = 'pro';
          this.hud._setDifficultySelection?.('pro', { notify: false });
        }
        if (startDifficulty) this._applyDifficultyTuning(startDifficulty);

        if (this.introDirector) {
          this.introDirector.active = false;
          this.hud.hideIntroOverlay();
        }
        this.spectatorMatchMode = false;
        this.autoPlayMode = false;
        this.userHasInteracted = true;
        this.persistentStateLock = false;
        this._syncSpectatorModeUI();
        if (inputMode === 'webcam' && this.motionController) {
          this.motionController.enableWebcam();
        }
        this.startNewMatch({ showStartBanner: true });
      },
      onSelectShotType: (shotType) => {
        const upper = String(shotType || 'topspin').toUpperCase();
        if (this.playerRole === 'p2') {
          this.p2SelectedShotType = upper;
        } else {
          this.selectedShotType = upper;
        }
        if (this.motionController && this.motionController.setShotType) {
          this.motionController.setShotType(shotType.toLowerCase());
        }
        // Tapping a chip EXECUTES the shot — mobile has no number keys. The swing
        // path already handles every phase: spectate nudge, serve toss/hit, rally
        // strike-or-queue.
        this._handleUserSwingInput({ shotType });
      },
      onToggleAudio: () => {
        if (this.audioEngine) {
          const muted = this.audioEngine.toggleMute();
          const info = this.audioEngine.getCurrentTrackInfo();
          this.hud.updateAudioStatus({ playing: !muted, trackName: info.title });
        }
      },
      onCycleCamera: () => {
        const modes = [null, 'RALLY_CAM', 'SERVE_CAM', 'CORNER_NICK_CAM', 'INTRO_PAN', 'FRONT_WALL_CAM'];
        const idx = modes.indexOf(this.manualCameraOverride);
        this.manualCameraOverride = modes[(idx + 1) % modes.length];
        const labels = {
          null: 'Back Glass',
          RALLY_CAM: 'Back Glass',
          SERVE_CAM: 'High Gallery',
          CORNER_NICK_CAM: 'Front Nick',
          INTRO_PAN: 'Overhead T',
          FRONT_WALL_CAM: 'Front Wall'
        };
        this.hud.updateCameraLabel(labels[this.manualCameraOverride] || 'Back Glass');
        this.hud.setReplayMode(this.manualCameraOverride === 'CORNER_NICK_CAM');
      },
      onToggleReplay: () => {
        if (this.phase === 'REPLAY') {
          this.persistentStateLock = false;
          this.hud.setReplayMode(false);
          this._setupPointServe({ showBanner: false });
        } else {
          this._enterInstantReplayState({ persistent: false });
        }
      },
      onToggleWebcam: async () => {
        if (!this.motionController) return;
        this.autoPlayMode = false;
        this.userHasInteracted = true;
        this.persistentStateLock = false;
        if (this.motionController.webcamActive) {
          this.motionController.disableWebcam();
          this.hud.updateMotionStatus({
            webcamActive: false,
            facingMode: this.motionController.cameraFacingMode,
            phoneConnected: this.motionController.phoneState?.connected
          });
        } else {
          const active = await this.motionController.enableWebcam();
          this.hud.updateMotionStatus({
            webcamActive: active,
            facingMode: this.motionController.cameraFacingMode,
            phoneConnected: this.motionController.phoneState?.connected
          });
          if (this.phase === 'TITLE') {
            this.hud.hideTitleModal();
            this.startNewMatch({ showStartBanner: true });
          }
        }
      },
      onSwitchCameraFacing: async () => {
        if (!this.motionController) return;
        const mode = await this.motionController.switchCameraFacingMode();
        this.hud.updateMotionStatus({
          webcamActive: this.motionController.webcamActive,
          facingMode: mode,
          phoneConnected: this.motionController.phoneState?.connected
        });
      },
      onPlayAgain: () => {
        this.autoPlayMode = false;
        this.userHasInteracted = true;
        this.persistentStateLock = false;
        this.startNewMatch({ showStartBanner: true });
      },
      onReturnToMenu: () => {
        this.returnToTitleMenu();
      }
    });

    const AudioEngineClass = AudioEngineMod.AudioEngine || AudioEngineMod.default;
    if (AudioEngineClass) {
      this.audioEngine = new AudioEngineClass({
        refereeVoiceEnabled: this.tuningStore.params.rulesAndView.refereeVoiceEnabled !== false,
        refereeVoicePitch: this.tuningStore.params.rulesAndView.refereeVoicePitch || 0.72,
        onTrackChange: (info) => {
          this.hud.updateAudioStatus({
            playing: !info.muted,
            trackName: info.shortTitle || info.title.replace(/\s*\(Lyria 3\)/i, '')
          });
          this._syncJukeboxModalUI?.();
        }
      });
    }

    const MotionControllerClass = MotionControlsMod.MotionController || MotionControlsMod.default;
    if (MotionControllerClass) {
      this.motionController = new MotionControllerClass({
        webcamCanvasId: 'webcam-canvas',
        roomId: this.roomId,
        role: this.playerRole,
        onPrepStart: (evt) => this._handleUserPrepStart(evt),
        onPrepEnd: (evt) => this._handleUserPrepEnd(evt),
        onSwing: (evt) => this._handleUserSwingInput(evt),
        onToss: (evt) => this._handleUserTossInput(evt),
        onCallLet: (evt) => this.requestLetAppeal(evt?.role === 'p2' ? 'opponent' : 'player', evt),
        onP2Swing: (evt) => this._handleP2SwingInput(evt),
        onP2Toss: (evt) => this._handleP2TossInput(evt),
        onRoomState: (state) => this._handleRoomStateUpdate(state),
        onStatusChange: (st) => {
          this.hud.updateMotionStatus({
            webcamActive: Boolean(st.webcam),
            facingMode: st.facingMode || this.motionController?.cameraFacingMode || 'user',
            phoneConnected: Boolean(st.phone),
            p1Phone: Boolean(st.p1Phone),
            p2Phone: Boolean(st.p2Phone)
          });
        }
      });
    }

    this._bindJukeboxAndRefereeControls();
    this._initProgressiveMenuSteps();

    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) {
        return;
      }
      if (e.code === 'Escape' || e.code === 'KeyQ') {
        e.preventDefault();
        this.handleEscapeOrQuitKey(e.code);
        return;
      }
      if (e.code === 'KeyK' || e.code === 'Slash') {
        e.preventDefault();
        this.toggleSquashRulesModal();
        return;
      }
      if (e.code === 'KeyH') {
        this.toggleControlsGuideModal();
      } else if (e.code === 'KeyC') {
        this.hud.callbacks.onCycleCamera();
      } else if (e.code === 'KeyR') {
        this.hud.callbacks.onToggleReplay();
      } else if (e.code === 'KeyG') {
        this.hud.callbacks.onToggleAutoT();
      } else if (e.code === 'KeyL') {
        if (this.phase === 'RALLY' && !e.shiftKey) {
          e.preventDefault();
          this.requestLetAppeal('player', { source: 'keyboard', gesture: 'KEY_L_LET' });
        } else {
          this.tuningPanel?.toggle();
        }
      } else if (e.code === 'KeyJ') {
        this.toggleJukeboxModal();
      } else if (e.code === 'KeyN') {
        this.audioEngine?.nextJukeboxTrack();
      } else if (e.code === 'KeyV') {
        this.toggleRefereeVoice();
      } else if (e.code === 'KeyP') {
        this.toggleSpectatorAIMode();
      } else if (e.code === 'KeyM') {
        this.hud.callbacks.onToggleAudio();
      } else if (this.isMultiplayer && e.code === 'Numpad0') {
        this._handleP2SwingInput({
          source: 'keyboard_p2',
          shotType: this.p2SelectedShotType,
          speed: 1.18
        });
      }
    });
  }

  _initProgressiveMenuSteps() {
    const step1 = document.getElementById('setup-step-1');
    const step2 = document.getElementById('setup-step-2');
    const step3 = document.getElementById('match-length-section');
    const step4 = document.getElementById('setup-step-4');
    const sum1 = document.getElementById('step-summary-1');
    const sum2 = document.getElementById('step-summary-2');
    const sum3 = document.getElementById('step-summary-3');
    const sum4 = document.getElementById('step-summary-4');

    const updateStep4Summary = () => {
      if (!sum4) return;
      const autoOn = this.tuningStore.params.movementAndAI.autoTReturn !== false;
      const refOn = this.tuningStore.params.rulesAndView.refereeVoiceEnabled !== false;
      sum4.textContent = `Auto-T: ${autoOn ? 'ON' : 'OFF'} • Ref: ${refOn ? 'ON' : 'OFF'}`;
    };

    document.querySelectorAll('#difficulty-mode-group .wii-green-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (sum1) sum1.textContent = btn.textContent.trim();
        step2?.classList.add('step-active', 'step-unlocked');
      });
    });

    document.querySelectorAll('#court-theme-group .wii-green-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (sum2) sum2.textContent = btn.textContent.trim();
        step3?.classList.add('step-active', 'step-unlocked');
      });
    });

    document.querySelectorAll('#match-length-group .wii-green-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (sum3) sum3.textContent = btn.textContent.trim();
        step4?.classList.add('step-active', 'step-unlocked');
      });
    });

    [step1, step2, step3, step4].forEach((st) => {
      st?.addEventListener('click', (e) => {
        if (!e.target.closest('button')) {
          st.classList.toggle('step-active');
        }
        updateStep4Summary();
      });
    });
  }

  _syncModalPauseState() {
    const rulesOpen = !document.getElementById('squash-rules-modal')?.classList.contains('hidden');
    const guideOpen = !document.getElementById('controls-guide-modal')?.classList.contains('hidden');
    const jbOpen = !document.getElementById('jukebox-modal')?.classList.contains('hidden');
    this.isPausedForModal = Boolean(rulesOpen || guideOpen || jbOpen);
  }

  _isSideMenuExpanded() {
    const el = this.hud?.elTitleModal;
    if (!el || el.classList.contains('hidden') || el.style.display === 'none') return false;
    if (document.documentElement.classList.contains('autoplay-mode')) return false;
    return !el.classList.contains('menu-collapsed');
  }

  _usesCompactHUD() {
    return window.matchMedia('(max-width: 900px), (pointer: coarse) and (max-width: 1200px)').matches;
  }

  _setSetupMenuCollapsed(collapsed) {
    this.hud?.elTitleModal?.classList.toggle('menu-collapsed', collapsed);
    const label = document.getElementById('collapse-side-menu-label');
    if (label) label.textContent = collapsed ? '▶ Setup Menu' : '▲ Roll up';
    document.getElementById('btn-collapse-side-menu')?.setAttribute('aria-expanded', String(!collapsed));
  }

  triggerNarratorUSPInvite({ manual = false } = {}) {
    if (!this.audioEngine) return;
    const item = this.audioEngine.playNarratorUSPInvite(manual ? undefined : null);
    if (!item) return;
    this.hud?.showTimingPopup({
      grade: item.title,
      detail: item.subText,
      durationMs: 5400
    });
  }

  openSquashRulesModal() {
    const modal = document.getElementById('squash-rules-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    this._syncModalPauseState();
    if (this.phase === 'RALLY' || this.phase === 'SERVE_STANCE' || this.phase === 'SERVE_TOSS') {
      this.hud?.showTimingPopup({
        grade: '⏸ MATCH PAUSED • SQUASH RULES',
        detail: 'PRESS K OR ESC TO RESUME PLAY',
        durationMs: 2200
      });
    }
  }

  closeSquashRulesModal() {
    const modal = document.getElementById('squash-rules-modal');
    if (modal) modal.classList.add('hidden');
    this._syncModalPauseState();
  }

  toggleSquashRulesModal() {
    const modal = document.getElementById('squash-rules-modal');
    if (!modal) return;
    if (modal.classList.contains('hidden')) {
      this.openSquashRulesModal();
    } else {
      this.closeSquashRulesModal();
    }
  }

  toggleControlsGuideModal() {
    const guideModal = document.getElementById('controls-guide-modal');
    if (!guideModal) return;
    guideModal.classList.toggle('hidden');
    this._syncModalPauseState();
  }

  handleEscapeOrQuitKey(code = 'Escape') {
    const jb = document.getElementById('jukebox-modal');
    const guide = document.getElementById('controls-guide-modal');
    const rules = document.getElementById('squash-rules-modal');
    const comp = document.getElementById('companion-modal');
    const titleVisible =
      this.hud?.elTitleModal &&
      !this.hud.elTitleModal.classList.contains('hidden') &&
      this.hud.elTitleModal.style.display !== 'none';

    let closedSubOverlay = false;
    if (rules && !rules.classList.contains('hidden')) {
      rules.classList.add('hidden');
      closedSubOverlay = true;
    }
    if (jb && !jb.classList.contains('hidden')) {
      jb.classList.add('hidden');
      closedSubOverlay = true;
    }
    if (guide && !guide.classList.contains('hidden')) {
      guide.classList.add('hidden');
      closedSubOverlay = true;
    }
    if (comp && !comp.classList.contains('hidden')) {
      comp.classList.add('hidden');
      closedSubOverlay = true;
    }
    if (this.tuningPanel?.isOpen) {
      this.tuningPanel.close?.() || this.tuningPanel.toggle?.();
      closedSubOverlay = true;
    }
    this._syncModalPauseState();

    // If a sub-modal (like Rules, Controls, or Jukebox) was open and Esc was pressed, just close it and resume!
    // Pressing Q (or pressing Esc when no sub-modal is open) exits back to the Side-Docked Main Menu + AI vs AI showcase.
    if (closedSubOverlay && code === 'Escape') {
      return;
    }
    if (!titleVisible || code === 'KeyQ' || !closedSubOverlay) {
      this.returnToTitleMenu();
    }
  }

  returnToTitleMenu() {
    if (this.introDirector) {
      this.introDirector.active = false;
      this.hud?.hideIntroOverlay();
    }
    const jb = document.getElementById('jukebox-modal');
    if (jb) jb.classList.add('hidden');
    const guide = document.getElementById('controls-guide-modal');
    if (guide) guide.classList.add('hidden');
    const rules = document.getElementById('squash-rules-modal');
    if (rules) rules.classList.add('hidden');
    const comp = document.getElementById('companion-modal');
    if (comp) comp.classList.add('hidden');
    if (this.tuningPanel?.isOpen) {
      this.tuningPanel.close?.() || this.tuningPanel.toggle?.();
    }
    this.isPausedForModal = false;
    this._updateLetAdvisoryUI(false);

    this.hud?.hideVictoryModal();
    this.hud?.hideCenterBanner();
    this.hud?.setReplayMode(false);

    // Keep two Pro AI players competing indefinitely in crystal-clear view while the side menu is open!
    this.spectatorMatchMode = true;
    this.autoPlayMode = true;
    this.persistentStateLock = false;
    this.pendingUserSwing = null;
    this.pendingP2Swing = null;
    this.pendingServeSwing = null;
    this.spectatorShotNudge = null;
    this.player.maxSpeed = 7.1;
    this.opponent.maxSpeed = 7.1;
    this._syncSpectatorModeUI();

    if (this.phase !== 'RALLY' || !this.ball.inPlay) {
      this._setupMidRallyShowcase();
    }
    // Mobile starts rolled up to a slim handle; desktop stays expanded.
    this._setSetupMenuCollapsed(this._usesCompactHUD());
    this.hud?.showTitleModal();
    this.audioEngine?.playMusicForState('title');
  }

  _bindJukeboxAndRefereeControls() {
    const collapseBtn = document.getElementById('btn-collapse-side-menu');
    collapseBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const modal = this.hud?.elTitleModal;
      if (!modal) return;
      this._setSetupMenuCollapsed(!modal.classList.contains('menu-collapsed'));
    });

    document.getElementById('btn-mobile-menu')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const wasExpanded = this._isSideMenuExpanded();
      this.hud?.showTitleModal();
      this._setSetupMenuCollapsed(wasExpanded);
    });
    document.querySelectorAll('[data-hud-action]').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        this._setSetupMenuCollapsed(true);
        document.getElementById(button.dataset.hudAction)?.click();
      });
    });

    const uspBtn = document.getElementById('btn-narrator-usp-invite');
    uspBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.triggerNarratorUSPInvite({ manual: true });
    });

    const welcomeBtn = document.getElementById('btn-welcome-callout');
    welcomeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.triggerNarratorUSPInvite({ manual: true });
    });

    const refHudBtn = document.getElementById('btn-ref-voice-toggle');
    refHudBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleRefereeVoice();
    });

    const refSetupBtn = document.getElementById('btn-setup-ref-voice');
    refSetupBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleRefereeVoice();
    });

    const jbNextBtn = document.getElementById('btn-jukebox-next');
    jbNextBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.audioEngine) {
        const info = this.audioEngine.nextJukeboxTrack();
        this.hud?.showTimingPopup({
          grade: `🎵 ${info.shortTitle || info.title}`,
          detail: `${info.subtitle} • JUKEBOX`,
          durationMs: 1400
        });
      }
    });

    const jbOpenBtn = document.getElementById('btn-jukebox-open');
    jbOpenBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openJukeboxModal();
    });

    const jbSetupBtn = document.getElementById('btn-setup-jukebox');
    jbSetupBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openJukeboxModal();
    });

    const jbCloseBtn = document.getElementById('btn-close-jukebox');
    jbCloseBtn?.addEventListener('click', () => this.closeJukeboxModal());

    const jbResumeBtn = document.getElementById('btn-jukebox-resume');
    jbResumeBtn?.addEventListener('click', () => this.closeJukeboxModal());

    const jbPrevModal = document.getElementById('btn-jukebox-prev-modal');
    jbPrevModal?.addEventListener('click', () => {
      this.audioEngine?.prevJukeboxTrack();
      this._syncJukeboxModalUI();
    });

    const jbNextModal = document.getElementById('btn-jukebox-next-modal');
    jbNextModal?.addEventListener('click', () => {
      this.audioEngine?.nextJukeboxTrack();
      this._syncJukeboxModalUI();
    });

    const jbMuteModal = document.getElementById('btn-jukebox-mute-modal');
    jbMuteModal?.addEventListener('click', () => {
      this.hud.callbacks.onToggleAudio?.();
      this._syncJukeboxModalUI();
    });

    document.querySelectorAll('.jukebox-mode-chip[data-jmode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.jmode || 'auto';
        this.audioEngine?.setJukeboxMode(mode);
        this._syncJukeboxModalUI();
      });
    });

    const jbRefToggle = document.getElementById('btn-jukebox-ref-toggle');
    jbRefToggle?.addEventListener('click', () => {
      this.toggleRefereeVoice();
    });

    const pitchSlider = document.getElementById('jukebox-pitch-slider');
    pitchSlider?.addEventListener('input', () => {
      const val = Number(pitchSlider.value || 0.72);
      this.tuningStore.setParam('rulesAndView', 'refereeVoicePitch', val);
      const valEl = document.getElementById('jukebox-pitch-val');
      if (valEl) valEl.textContent = `${val.toFixed(2)}x`;
    });

    const musicVolSlider = document.getElementById('jukebox-music-vol');
    musicVolSlider?.addEventListener('input', () => {
      const v = Number(musicVolSlider.value || 0.65);
      this.audioEngine?.setMusicVolume(v);
      const valEl = document.getElementById('jukebox-music-vol-val');
      if (valEl) valEl.textContent = `${Math.round(v * 100)}%`;
    });

    const sfxVolSlider = document.getElementById('jukebox-sfx-vol');
    sfxVolSlider?.addEventListener('input', () => {
      const v = Number(sfxVolSlider.value || 0.88);
      this.audioEngine?.setSfxVolume(v);
      const valEl = document.getElementById('jukebox-sfx-vol-val');
      if (valEl) valEl.textContent = `${Math.round(v * 100)}%`;
    });

    document.querySelectorAll('.jukebox-call-btn[data-callout]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const phrase = btn.dataset.callout || 'Down! Handout, five-four.';
        if (phrase === 'USP_INVITE') {
          this.triggerNarratorUSPInvite({ manual: true });
        } else if (phrase === 'WELCOME') {
          this.audioEngine?.playWelcomeIntro({ force: true, withLoveAll: false });
        } else {
          this.audioEngine?.announceScore(phrase, { forceReferee: true });
        }
      });
    });

    // Wire up Call Let HUD button
    const callLetBtn = document.getElementById('btn-call-let');
    callLetBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.requestLetAppeal('player', { source: 'hud_button', gesture: 'HUD_LET_BTN' });
    });

    // Wire up Complete Squash Rules modal buttons
    const openRulesBtns = [
      document.getElementById('btn-rules-modal'),
      document.getElementById('btn-setup-rules'),
      document.getElementById('btn-guide-open-rules')
    ];
    openRulesBtns.forEach((b) =>
      b?.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('controls-guide-modal')?.classList.add('hidden');
        this.openSquashRulesModal();
      })
    );
    document.getElementById('btn-close-squash-rules')?.addEventListener('click', () => {
      this.closeSquashRulesModal();
    });
    document.getElementById('btn-rules-resume')?.addEventListener('click', () => {
      this.closeSquashRulesModal();
    });
    document.getElementById('btn-rules-test-let')?.addEventListener('click', () => {
      this.audioEngine?.playRefereeWhistle(false);
      this.audioEngine?.announceScore(
        'Stop play! Yes, Let. Safety reminder: always call a Let when obstructed instead of striking your opponent.',
        { forceReferee: true }
      );
    });

    // Also wire up setup auto-t, pose-cam, and controls guide buttons
    const setupAutoT = document.getElementById('btn-setup-auto-t');
    setupAutoT?.addEventListener('click', () => {
      this.hud.callbacks.onToggleAutoT?.();
      const on = this.tuningStore.params.movementAndAI.autoTReturn !== false;
      setupAutoT.classList.toggle('selected', on);
      const txt = document.getElementById('setup-auto-t-text');
      if (txt) txt.textContent = on ? 'Shot-Select Mode: ON (we move you)' : 'Shot-Select: OFF — WASD footwork';
    });

    const setupPoseCam = document.getElementById('btn-setup-pose-cam');
    setupPoseCam?.addEventListener('click', async () => {
      await this.hud.callbacks.onToggleWebcam?.();
    });

    const openGuideBtns = [
      document.getElementById('btn-controls-guide'),
      document.getElementById('btn-setup-open-guide')
    ];
    const guideModal = document.getElementById('controls-guide-modal');
    openGuideBtns.forEach((b) =>
      b?.addEventListener('click', (e) => {
        e.stopPropagation();
        guideModal?.classList.remove('hidden');
        this._syncModalPauseState();
      })
    );
    document.getElementById('btn-close-controls-guide')?.addEventListener('click', () => {
      guideModal?.classList.add('hidden');
      this._syncModalPauseState();
    });
    document.getElementById('btn-guide-resume')?.addEventListener('click', () => {
      guideModal?.classList.add('hidden');
      this._syncModalPauseState();
    });
    document.getElementById('btn-guide-toggle-cam')?.addEventListener('click', async () => {
      guideModal?.classList.add('hidden');
      this._syncModalPauseState();
      await this.hud.callbacks.onToggleWebcam?.();
    });

    const spectatorHudBtn = document.getElementById('btn-spectator-toggle');
    spectatorHudBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleSpectatorAIMode();
    });

    const watchAiSetupBtn = document.getElementById('btn-watch-ai-match');
    watchAiSetupBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.startSpectatorAIMatch({ showStartBanner: true });
    });

    this._syncRefereeVoiceUI();
    this._syncJukeboxModalUI();
    this._syncSpectatorModeUI();
  }

  startSpectatorAIMatch({ showStartBanner = true } = {}) {
    if (this.introDirector) {
      this.introDirector.active = false;
      this.hud.hideIntroOverlay();
    }
    this.hud.hideTitleModal();
    this.hud.hideVictoryModal();
    this.hud.setReplayMode(false);

    this.spectatorMatchMode = true;
    this.autoPlayMode = true;
    this.userHasInteracted = true;
    this.persistentStateLock = false;
    this._applyDifficultyTuning('ai_vs_ai');

    this.rulesEngine.resetMatch({
      gamesToWin: this.matchConfig.gamesToWin,
      scoringMode: this.matchConfig.scoringSystem
    });
    this.score = this.rulesEngine.score;
    this.playerAI.resetMemory();
    this.opponentAI.resetMemory();
    this._syncScoreboardHUD();
    this._syncSpectatorModeUI();

    if (this.audioEngine) {
      this.audioEngine.playMusicForState('rally');
      this.audioEngine.playWelcomeIntro({ force: true, withLoveAll: true });
    }

    this._setupPointServe({
      showBanner: showStartBanner,
      bannerText: 'AI vs AI Exhibition',
      bannerStyle: 'style-start',
      persistentBanner: false
    });
    this.hud.showTimingPopup({
      grade: '🤖 AI vs AI CONTINUOUS MATCH',
      detail: 'BOTH PLAYERS AI-CONTROLLED • PRESS P OR CLICK TOP BAR TO PLAY',
      durationMs: 2800
    });
  }

  toggleSpectatorAIMode(forceState = undefined) {
    const next = typeof forceState === 'boolean' ? forceState : !this.spectatorMatchMode;
    if (next) {
      if (this.phase === 'TITLE' || this.phase === 'MATCH_OVER' || this.phase === 'WONDER_INTRO') {
        this.startSpectatorAIMatch({ showStartBanner: true });
        return true;
      }
      this.spectatorMatchMode = true;
      this.autoPlayMode = true;
      this.userHasInteracted = true;
      this.persistentStateLock = false;
      this._applyDifficultyTuning('ai_vs_ai');
      this._syncSpectatorModeUI();
      this.hud.showTimingPopup({
        grade: '🤖 AI vs AI SPECTATOR: ON',
        detail: 'BOTH PLAYERS CONTROLLED BY PRO AI • PRESS P TO TAKE OVER',
        durationMs: 2200
      });
    } else {
      this.spectatorMatchMode = false;
      this.autoPlayMode = false;
      this.userHasInteracted = true;
      this._applyDifficultyTuning(
        this.matchConfig.difficulty === 'ai_vs_ai' ? 'pro' : this.matchConfig.difficulty
      );
      this._syncSpectatorModeUI();
      this.hud.showTimingPopup({
        grade: '🎾 PLAYER 1 CONTROL ACTIVE',
        detail: 'YOU ARE NOW CONTROLLING PLAYER 1 • PRESS P TO WATCH AI vs AI',
        durationMs: 2200
      });
    }
    return next;
  }

  _syncSpectatorModeUI() {
    const active = Boolean(this.spectatorMatchMode);
    const btn = document.getElementById('btn-spectator-toggle');
    const lbl = document.getElementById('spectator-label');
    if (btn) btn.classList.toggle('active', active);
    if (lbl) {
      lbl.textContent = active
        ? '🤖 AI vs AI LIVE (Click / P to Play)'
        : '🤖 WATCH AI vs AI (P)';
    }
    const controlHint = document.getElementById('red-control-hint');
    if (controlHint) controlHint.textContent = active
      ? 'YOU influence RED · tap a shot or press 1–5'
      : 'YOU play RED · tap a shot or press 1–5';
    if (!active) this.motionController?._updateHudShotPills(this.selectedShotType);
  }

  _showRedShotChoice(shotType, detail = '') {
    this.motionController?._updateHudShotPills(shotType, {
      detail,
      decisionToken: `${this.pointToken}:${this.ball.rallyStrokeCount}`
    });
  }

  toggleRefereeVoice() {
    const cur = this.tuningStore.params.rulesAndView.refereeVoiceEnabled !== false;
    const next = !cur;
    this.tuningStore.setParam('rulesAndView', 'refereeVoiceEnabled', next);
    if (this.audioEngine) {
      this.audioEngine.setRefereeVoiceEnabled(next);
      if (next) {
        this.audioEngine.announceScore('Down! Handout, five-four.', { forceReferee: true });
      }
    }
    this._syncRefereeVoiceUI();
    this._syncJukeboxModalUI();
    return next;
  }

  _syncRefereeVoiceUI() {
    const enabled = this.tuningStore.params.rulesAndView.refereeVoiceEnabled !== false;
    const hudBtn = document.getElementById('btn-ref-voice-toggle');
    const hudDot = document.getElementById('ref-voice-dot');
    const hudLabel = document.getElementById('ref-voice-label');
    if (hudBtn) hudBtn.classList.toggle('active', enabled);
    if (hudDot) hudDot.classList.toggle('active', enabled);
    if (hudLabel) hudLabel.textContent = enabled ? '🎙️ Ref: ON' : '🎙️ Ref: OFF';

    const setupBtn = document.getElementById('btn-setup-ref-voice');
    const setupTxt = document.getElementById('setup-ref-voice-text');
    if (setupBtn) setupBtn.classList.toggle('selected', enabled);
    if (setupTxt) setupTxt.textContent = enabled ? '🎙️ Referee Voice: ON (Deep)' : '🎙️ Referee Voice: OFF';

    const jbBtn = document.getElementById('btn-jukebox-ref-toggle');
    const jbDot = document.getElementById('jukebox-ref-dot');
    const jbLabel = document.getElementById('jukebox-ref-label');
    if (jbBtn) jbBtn.classList.toggle('active', enabled);
    if (jbDot) jbDot.classList.toggle('active', enabled);
    if (jbLabel) {
      jbLabel.textContent = enabled
        ? 'Referee Voice: ON (Deep Male Baritone)'
        : 'Referee Voice: OFF (Silent Calls)';
    }
  }

  openJukeboxModal() {
    const modal = document.getElementById('jukebox-modal');
    if (!modal) return;
    this._syncJukeboxModalUI();
    modal.classList.remove('hidden');
  }

  closeJukeboxModal() {
    const modal = document.getElementById('jukebox-modal');
    if (modal) modal.classList.add('hidden');
  }

  toggleJukeboxModal() {
    const modal = document.getElementById('jukebox-modal');
    if (!modal) return;
    if (modal.classList.contains('hidden')) {
      this.openJukeboxModal();
    } else {
      this.closeJukeboxModal();
    }
  }

  _syncJukeboxModalUI() {
    if (!this.audioEngine) return;
    const info = this.audioEngine.getCurrentTrackInfo();
    const tracks = this.audioEngine.getJukeboxTracks();

    const genreEl = document.getElementById('jukebox-now-genre');
    const titleEl = document.getElementById('jukebox-now-title');
    const subEl = document.getElementById('jukebox-now-sub');
    const eqEl = document.getElementById('jukebox-eq-bars');
    const muteBtn = document.getElementById('btn-jukebox-mute-modal');

    if (genreEl) {
      genreEl.textContent = info.muted
        ? 'MUTED • CLICK 🔊 TO UNMUTE'
        : `NOW PLAYING • ${(info.genre || 'SOUNDTRACK').toUpperCase()} (${info.jukeboxMode.toUpperCase()})`;
    }
    if (titleEl) titleEl.textContent = info.title;
    if (subEl) subEl.textContent = info.subtitle;
    if (eqEl) eqEl.classList.toggle('paused', Boolean(info.muted));
    if (muteBtn) muteBtn.textContent = info.muted ? '🔇' : '🔊';

    document.querySelectorAll('.jukebox-mode-chip[data-jmode]').forEach((chip) => {
      chip.classList.toggle('active', chip.dataset.jmode === info.jukeboxMode);
    });

    const container = document.getElementById('jukebox-tracks-container');
    if (container) {
      container.innerHTML = '';
      tracks.forEach((t, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `jukebox-track-item${t.active ? ' active' : ''}`;
        const tagLabel =
          idx < 7
            ? `🌟 Original #${idx + 1}`
            : t.type === 'synth'
            ? '⚡ Synth'
            : '🎵 Classic';
        btn.innerHTML = `
          <div class="jukebox-track-left">
            <span class="jukebox-track-name">${t.active ? '▶ ' : `${idx + 1}. `}${t.title}</span>
            <span class="jukebox-track-sub">${t.subtitle}</span>
          </div>
          <span class="jukebox-track-tag">${tagLabel}</span>
        `;
        btn.addEventListener('click', () => {
          this.audioEngine.setMuted(false);
          this.audioEngine.selectJukeboxTrack(t.id, { lock: true });
          this._syncJukeboxModalUI();
        });
        container.appendChild(btn);
      });
    }
  }

  _handleUserPrepStart(evt = {}) {
    this.lastHumanInputTime = this.elapsedTime;
    if (this.phase === 'RALLY' || this.phase === 'WONDER_INTRO') {
      this.shotController.beginPreparation('player', this.elapsedTime, {
        faceMode: evt.cutModifier ? 'OPEN_CUT' : 'AUTO'
      });
      this.player.manualPrepCharge = 0.25;
      this.hud.updateTimingGauge({
        cursorNormalized: 0.5,
        modeTitle: 'BACKSWING PREPARATION (HOLD)',
        speedText: 'SHIFT / R-CLICK = CUT DROP'
      });
    }
  }

  _handleUserPrepEnd() {
    this.player.manualPrepCharge = 0;
  }

  async createMultiplayerRoom({ p1Name = 'Player 1', p2Name = 'Player 2' } = {}) {
    try {
      const res = await fetch('/api/match/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ p1Name, p2Name })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.roomId) {
          this.roomId = data.roomId;
          this.isMultiplayer = true;
          this._applyDifficultyTuning('1v1');
          if (this.motionController && this.motionController.setRoomConfig) {
            this.motionController.setRoomConfig({ roomId: this.roomId, role: this.playerRole });
          }
          this.roomStatus = {
            ...this.roomStatus,
            roomId: data.roomId,
            tunnelUrl: data.tunnelUrl || '',
            urls: data.urls || null,
            gchatCard: data.gchatCard || null
          };
          this.hud && this.hud.updateMultiplayerRoomInfo(this.roomStatus);
          return data;
        }
      }
    } catch (err) {
      console.warn('[ArgonSquashEngine] Failed to create multiplayer room:', err);
    }
    return null;
  }

  async loadAssetsAndStart() {
    const loader = new GLTFLoader();
    const loadGLB = async (url, retries = 4) => {
      const localUrl =
        url.startsWith('http') || url.startsWith('./') || url.startsWith('/')
          ? url.replace('https://www.gstatic.com/aistudio/starter-apps/tennis/', './assets/')
          : `./assets/models/${url}?v=argon4_kinetic`;
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          return await new Promise((resolve, reject) => {
            loader.load(localUrl, (gltf) => resolve(gltf.scene), undefined, (err) => reject(err));
          });
        } catch (err) {
          if (attempt === retries) {
            console.warn(`[ArgonSquashEngine] Could not load ${localUrl}:`, err);
            return new THREE.Group();
          }
          await new Promise((r) => setTimeout(r, 350));
        }
      }
      return new THREE.Group();
    };

    const [stadiumScene, playerScene, opponentScene, racketScene, ballScene, crowdScene] = await Promise.all([
      loadGLB('https://www.gstatic.com/aistudio/starter-apps/tennis/models/stadium_court.glb?v=argon4_kinetic'),
      loadGLB('https://www.gstatic.com/aistudio/starter-apps/tennis/models/mii_player.glb?v=argon4_kinetic'),
      loadGLB('https://www.gstatic.com/aistudio/starter-apps/tennis/models/mii_opponent.glb?v=argon4_kinetic'),
      loadGLB('https://www.gstatic.com/aistudio/starter-apps/tennis/models/tennis_racket.glb?v=argon4_kinetic'),
      loadGLB('https://www.gstatic.com/aistudio/starter-apps/tennis/models/tennis_ball.glb?v=argon4_kinetic'),
      loadGLB('https://www.gstatic.com/aistudio/starter-apps/tennis/models/mii_crowd.glb?v=argon4_kinetic')
    ]);

    const playerPartnerScene = playerScene.clone(true);
    const opponentPartnerScene = opponentScene.clone(true);

    this._prepareSurroundingArena(stadiumScene);
    this._prepareCrowd(crowdScene);
    this._prepareMiiActor(this.player, playerScene, racketScene, 'p1');
    this._prepareMiiActor(this.opponent, opponentScene, racketScene, 'p2');
    this._prepareMiiActor(this.playerPartner, playerPartnerScene, racketScene, 'p1');
    this._prepareMiiActor(this.opponentPartner, opponentPartnerScene, racketScene, 'p2');
    this.playerPartner.root.visible = false;
    this.opponentPartner.root.visible = false;

    this._prepareSquashBall(ballScene);
    this._bootInitialStateFromURL();

    this.clock.start();
    const tick = () => {
      requestAnimationFrame(tick);
      const dt = Math.min(this.clock.getDelta(), 0.08);
      if (dt > 0.001) {
        this.currentFps = this.currentFps * 0.92 + (1 / dt) * 0.08;
      }
      this.update(dt);
      this.render();
    };
    requestAnimationFrame(tick);
  }

  _prepareSurroundingArena(stadiumScene) {
    stadiumScene.position.set(0, -0.22, 0);
    const gltfBannerTex = createRocheSquashStadiumBannerTexture(this.renderer, { flipY: false });

    const upgradeLogoMat = (mat) => {
      if (!mat) return mat;
      const matName = String(mat.name || '');
      const mapName = String(mat.map?.name || '');
      if (/LogoArgonBanner|Logo/i.test(matName) || /logo_argon/i.test(mapName)) {
        const cloned = mat.clone();
        cloned.name = 'LogoRocheSquashBanner';
        cloned.map = gltfBannerTex;
        cloned.transparent = true;
        cloned.depthWrite = false;
        cloned.roughness = 0.42;
        cloned.metalness = 0.04;
        cloned.needsUpdate = true;
        return cloned;
      }
      return mat;
    };

    stadiumScene.traverse((child) => {
      if (child.isMesh) {
        const name = child.name || '';
        const posCount = child.geometry?.attributes?.position?.count || 0;
        if (/Net|CourtLines|ServiceLine|Baseline|Court/i.test(name)) {
          child.visible = false;
        } else {
          if (Array.isArray(child.material)) {
            child.material = child.material.map((m) => upgradeLogoMat(m));
          } else if (child.material) {
            child.material = upgradeLogoMat(child.material);
            // Fallback match by vertex count (20 vertices = 5 stadium banner quads in StadiumShadows_Mesh_1)
            if (posCount === 20 && /StadiumShadows/i.test(name) && child.material.name !== 'LogoRocheSquashBanner') {
              const cloned = child.material.clone();
              cloned.name = 'LogoRocheSquashBanner';
              cloned.map = gltfBannerTex;
              cloned.transparent = true;
              cloned.depthWrite = false;
              cloned.needsUpdate = true;
              child.material = cloned;
            }
          }
          child.receiveShadow = true;
        }
      }
    });

    // Add central Left-Hand & Right-Hand Spectator Stadium Seating "ROCHE SQUASH" + Dual Sample Logo Banners
    const planeBannerTex = createRocheSquashStadiumBannerTexture(this.renderer, { flipY: true });
    const sideStandBannerMat = new THREE.MeshStandardMaterial({
      map: planeBannerTex,
      transparent: true,
      depthWrite: false,
      roughness: 0.42,
      metalness: 0.05,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2
    });
    const sideStandBannerGeo = new THREE.PlaneGeometry(3.4, 0.85);

    const leftCentralBanner = new THREE.Mesh(sideStandBannerGeo, sideStandBannerMat);
    leftCentralBanner.position.set(-12.26, 0.72, 0);
    leftCentralBanner.rotation.y = Math.PI / 2;
    leftCentralBanner.renderOrder = 3;
    stadiumScene.add(leftCentralBanner);

    const rightCentralBanner = new THREE.Mesh(sideStandBannerGeo, sideStandBannerMat);
    rightCentralBanner.position.set(12.26, 0.72, 0);
    rightCentralBanner.rotation.y = -Math.PI / 2;
    rightCentralBanner.renderOrder = 3;
    stadiumScene.add(rightCentralBanner);

    this.scene.add(stadiumScene);
  }

  _prepareCrowd(crowdScene) {
    crowdScene.position.set(0, -0.15, 0);
    crowdScene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = false;
        child.receiveShadow = true;
      }
    });
    this.crowdScene = crowdScene;
    this.scene.add(crowdScene);
  }

  _prepareMiiActor(actor, modelScene, racketTemplate, paletteKey = 'p1') {
    actor.model = modelScene;
    modelScene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
      child.userData.basePos = child.position.clone();
      child.userData.baseRot = child.rotation.clone();
      const name = (child.name || '').trim();
      if (/^head(\.?0*\d+)?$/i.test(name) && (!actor.parts.head || !child.isMesh)) {
        actor.parts.head = child;
      } else if (/^torso(\.?0*\d+)?$/i.test(name) && (!actor.parts.torso || !child.isMesh)) {
        actor.parts.torso = child;
      } else if (/^hand_l(\.?0*\d+)?$/i.test(name) && (!actor.parts.handL || !child.isMesh)) {
        actor.parts.handL = child;
      } else if (/^hand_r(\.?0*\d+)?$/i.test(name) && (!actor.parts.handR || !child.isMesh)) {
        actor.parts.handR = child;
      } else if (/^foot_l(\.?0*\d+)?$/i.test(name) && (!actor.parts.footL || !child.isMesh)) {
        actor.parts.footL = child;
      } else if (/^foot_r(\.?0*\d+)?$/i.test(name) && (!actor.parts.footR || !child.isMesh)) {
        actor.parts.footR = child;
      }
    });

    modelScene.scale.setScalar(1.06);
    actor.root.add(modelScene);
    upgradeMiiCharacterMaterials(actor, paletteKey);
    this.facialFX && this.facialFX.attachFacialRig(actor);
    this.bodyAnimator && this.bodyAnimator.setupArticulatedMiiRig(actor);

    if (actor.role === 'player' && actor.parts.torso) {
      const canvas = document.createElement('canvas');
      canvas.width = 512; canvas.height = 192;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff'; ctx.font = '900 138px Arial';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 10; ctx.strokeStyle = '#781c24';
      ctx.strokeText('YOU', 256, 98); ctx.fillText('YOU', 256, 98);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 });
      for (const side of [1, -1]) {
        const marking = new THREE.Mesh(new THREE.PlaneGeometry(.43, .18), material);
        marking.name = side === 1 ? 'YouJerseyFront' : 'YouJerseyBack';
        marking.position.set(0, .32, side * .183);
        marking.rotation.y = side === 1 ? 0 : Math.PI;
        actor.parts.torso.add(marking);
      }
    }

    const racket = racketTemplate.clone(true);
    racket.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    upgradeRacketMaterials(racket);
    racket.scale.set(1.02, 1.22, 1.02);
    actor.racketMesh = racket;
    actor.racketPivot.position.set(-0.36, 0.9, 0.16);
    actor.racketMesh.rotation.set(0, 0, 0);
    actor.racketPivot.add(actor.racketMesh);

    actor.swingArcMesh = createSwingArcMesh();
    actor.swingArcMesh.visible = false;
    actor.root.add(actor.swingArcMesh);
    actor.root.add(actor.racketPivot);

    actor.root.rotation.set(0, StrokeMotion.readyYaw(actor, this.ball), 0);
    actor.root.position.copy(actor.pos);
    this.scene.add(actor.root);

    this.racketKinematics && this.racketKinematics.initActor(actor);
    this.swingVfx && this.swingVfx.registerActor(actor);
  }

  _prepareSquashBall() {
    const group = new THREE.Group();
    const radius = COURT_SPECS.BALL_RADIUS * 1.65;
    const coreGeom = new THREE.SphereGeometry(radius, 24, 24);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x1e242d,
      roughness: 0.65,
      metalness: 0.08,
      emissive: 0xdfff00,
      emissiveIntensity: 0.28
    });
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);
    coreMesh.castShadow = true;
    group.add(coreMesh);

    // Double yellow dot markers on the squash ball
    const dotGeom = new THREE.SphereGeometry(radius * 0.25, 10, 10);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xffea28 });
    const dot1 = new THREE.Mesh(dotGeom, dotMat);
    dot1.position.set(0.01, radius * 0.88, 0.012);
    const dot2 = new THREE.Mesh(dotGeom, dotMat);
    dot2.position.set(-0.01, radius * 0.88, 0.012);
    group.add(dot1, dot2);

    this.ball.mesh = group;
    this.ball.mesh.position.copy(this.ball.pos);
    this.scene.add(this.ball.mesh);
  }

  _bootInitialStateFromURL() {
    if (this.urlRoom && this.urlRoom !== 'DEFAULT' && !this.urlAutoPlay) {
      this.hud.hideTitleModal();
      this.autoPlayMode = false;
      this.userHasInteracted = true;
      this.persistentStateLock = false;
      this.startNewMatch({ showStartBanner: true });
      this._snapCameraImmediate();
      return;
    }

    if (this.urlState === 'intro' || this.urlState === 'wonder' || this.urlState === 'skills') {
      this.hud.hideTitleModal();
      this.autoPlayMode = false;
      this.userHasInteracted = true;
      this.startWonderIntro('SKILL_1_FEED');
      this._snapCameraImmediate();
      return;
    }

    if (this.urlMode === 'ai_vs_ai' || this.urlMode === 'spectate' || this.urlState === 'spectate') {
      this.startSpectatorAIMatch({ showStartBanner: true });
      this._snapCameraImmediate();
      return;
    }

    if (!this.urlAutoPlay) {
      // On default load: keep the left-docked side menu visible AND run an indefinite AI vs AI match
      // with full physics, strategies, serves, nicks, and score calls in crystal-clear view!
      this.spectatorMatchMode = true;
      this.autoPlayMode = true;
      this.persistentStateLock = false;
      this.player.maxSpeed = 7.1;
      this.opponent.maxSpeed = 7.1;
      this.rulesEngine.resetMatch({
        gamesToWin: this.matchConfig.gamesToWin,
        scoringMode: this.matchConfig.scoringSystem
      });
      this.score = this.rulesEngine.score;
      this.playerAI.resetMemory();
      this.opponentAI.resetMemory();
      this._syncScoreboardHUD();
      this._syncSpectatorModeUI();
      this._setupMidRallyShowcase();
      this._setSetupMenuCollapsed(this._usesCompactHUD());
      this.hud.showTitleModal();
      this._snapCameraImmediate();
      this.audioEngine && this.audioEngine.playMusicForState('title');
      return;
    }

    this.hud.hideTitleModal();
    if (this.urlState === 'gamepoint' || this.urlState === 'serve') {
      this.rulesEngine.resetMatch({
        gamesToWin: this.matchConfig.gamesToWin,
        scoringMode: this.matchConfig.scoringSystem
      });
      this.score = this.rulesEngine.score;
      this.score.playerPoints = 10;
      this.score.opponentPoints = 8;
      this.score.server = 'player';
      this._syncScoreboardHUD();
      this.persistentStateLock = true;
      this._setupPointServe({
        showBanner: true,
        bannerText: 'Game Ball',
        bannerStyle: 'style-gold',
        persistentBanner: true
      });
      this._snapCameraImmediate();
      this.audioEngine && this.audioEngine.playMusicForState('gamepoint');
      return;
    }

    if (this.urlState === 'start') {
      this.rulesEngine.resetMatch({
        gamesToWin: this.matchConfig.gamesToWin,
        scoringMode: this.matchConfig.scoringSystem
      });
      this.score = this.rulesEngine.score;
      this._syncScoreboardHUD();
      this.persistentStateLock = true;
      this._setupPointServe({
        showBanner: true,
        bannerText: 'Start',
        bannerStyle: 'style-start',
        persistentBanner: true
      });
      this._snapCameraImmediate();
      return;
    }

    if (this.urlState === 'replay') {
      this.startWonderIntro('SKILL_8_FEED');
      this._snapCameraImmediate();
      return;
    }

    if (this.urlState && this.urlState.startsWith('showcase')) {
      this.rulesEngine.resetMatch({
        gamesToWin: this.matchConfig.gamesToWin,
        scoringMode: this.matchConfig.scoringSystem
      });
      this.score = this.rulesEngine.score;
      this.score.playerPoints = 7;
      this.score.opponentPoints = 6;
      this._syncScoreboardHUD();
      this.persistentStateLock = true;
      this.autoPlayMode = false;
      this._setupKineticShowcaseState(this.urlState);
      this._snapCameraImmediate();
      return;
    }

    this.rulesEngine.resetMatch({
      gamesToWin: this.matchConfig.gamesToWin,
      scoringMode: this.matchConfig.scoringSystem
    });
    this.score = this.rulesEngine.score;
    this.score.playerPoints = 4;
    this.score.opponentPoints = 3;
    this._syncScoreboardHUD();
    this.hud.hideCenterBanner();
    this.hud.setReplayMode(false);
    this.autoPlayMode = true;
    this.persistentStateLock = false;
    this._setupMidRallyShowcase();
    this._snapCameraImmediate();
    this.audioEngine && this.audioEngine.playMusicForState('rally');
  }

  startWonderIntro(startAt = 'SKILL_1_FEED') {
    this.pointPresentation?.cancel();
    this.pendingPointOutcome = null;
    this.hud.hideTitleModal();
    this.hud.hideCenterBanner();
    this.hud.setReplayMode(false);
    this.autoPlayMode = false;
    this.userHasInteracted = true;
    this.persistentStateLock = false;
    this.audioEngine?.playWelcomeIntro({ force: true, withLoveAll: false });
    this.introDirector.startIntro(startAt);
  }

  launchNickLabScenario(scenarioId = 'demo_a_kill') {
    this.pointPresentation?.cancel();
    this.pendingPointOutcome = null;
    this.hud.hideTitleModal();
    this.hud.hideCenterBanner();
    if (this.introDirector) {
      this.introDirector.active = false;
      this.hud.hideIntroOverlay();
    }
    this.autoPlayMode = false;
    this.userHasInteracted = true;
    this.phase = 'NICK_LAB';
    this.phaseTimer = 0;
    this.cameraMode = 'CORNER_NICK_CAM';

    const scenario = NickCollisionModel.getNickLabScenario(scenarioId);
    this.ball.pos.copy(scenario.pos);
    this.ball.vel.copy(scenario.vel);
    this.ball.spin.copy(scenario.spin);
    this.rulesEngine.onStrokeHit(this.ball, scenario.hitter || 'player', {
      isServe: false,
      shotType: scenario.shotType || 'KILL',
      isDisguised: scenarioId === 'demo_b_soft_drop'
    });

    this.ballTrail.clear();
    this.ballTrail.setStyle(scenario.shotType, scenarioId === 'demo_a_kill');
    this.ballTrail.pushPoint(this.ball.pos);

    this.player.pos.set(0.85, 0, 1.35);
    this.player.targetPos.copy(this.player.pos);
    this.opponent.pos.set(-0.85, 0, 1.15);
    this.opponent.targetPos.copy(this.opponent.pos);

    this.hud.showTimingPopup({
      grade: scenario.title.toUpperCase(),
      detail: scenario.subtitle,
      durationMs: 2600
    });
  }

  _setupKineticShowcaseState(mode = 'showcase_topspin') {
    this.phase = 'SHOWCASE';
    this.showcaseModeName = mode;
    this.phaseTimer = 0;
    this.cameraMode = 'SHOWCASE_CAM';
    this.hud.setReplayMode(false);
    this.hud.hideCenterBanner();
    this.player.pos.set(1.15, 0, 1.45);
    this.player.targetPos.copy(this.player.pos);
    this.player.root.rotation.set(0, Math.PI + 0.12, 0);
    this.opponent.pos.set(-1.15, 0, 1.25);
    this.opponent.targetPos.copy(this.opponent.pos);
    this.opponent.root.rotation.set(0, Math.PI - 0.12, 0);
    this._refreshShowcasePose();
  }

  _refreshShowcasePose() {
    const mode = this.showcaseModeName || 'showcase_topspin';
    const advancePose = (elapsed) => {
      for (let i = 0; i < 10; i++) {
        this.player.racketKinematics.swingActive = true;
        this.player.racketKinematics.swingElapsed = elapsed;
        this.racketKinematics.update(this.player, 0.016, { ball: this.ball, phase: this.phase });
        this.player.racketKinematics.swingActive = true;
        this.player.racketKinematics.swingElapsed = elapsed;
        this.bodyAnimator.updateMiiBodyAnimation(this.player, 0.016, this);
      }
      this.player.root.updateMatrixWorld(true);
    };

    if (mode === 'showcase_slice' || mode === 'showcase_backhand') {
      this.player.swingType = 'backhand';
      this.player.swingDuration = 0.36;
      this.player.swingTimer = 0.26;
      this.racketKinematics.triggerSwing(this.player, {
        shotType: 'slice',
        side: 'backhand',
        speed: 1.22,
        timing: 'sweet'
      });
      advancePose(0.072);
      this.swingVfx.seedActorSwingArc(this.player, {
        shotType: 'SLICE',
        isPower: false,
        whipSpeed: 26,
        swingType: 'backhand'
      });
      const center = this.racketKinematics.getRacketRimWorldPoints(this.player).centerWorld.clone();
      this.ball.pos.copy(center).add(new THREE.Vector3(0.05, 0.02, -0.22));
      this.ball.vel.set(-1.4, 1.5, -14.2);
      this.ballTrail.setStyle('DROP', false);
      this.ballTrail.seedArc(center, this.ball.pos, 0.05);
    } else {
      this.player.swingType = 'forehand';
      this.player.swingDuration = 0.36;
      this.player.swingTimer = 0.26;
      this.racketKinematics.triggerSwing(this.player, {
        shotType: 'topspin',
        side: 'forehand',
        speed: 1.35,
        timing: 'sweet'
      });
      advancePose(0.068);
      this.swingVfx.seedActorSwingArc(this.player, {
        shotType: 'TOPSPIN',
        isPower: true,
        whipSpeed: 29,
        swingType: 'forehand'
      });
      const center = this.racketKinematics.getRacketRimWorldPoints(this.player).centerWorld.clone();
      this.ball.pos.copy(center).add(new THREE.Vector3(-0.05, 0.03, -0.22));
      this.ball.vel.set(1.2, 1.8, -22.5);
      this.ballTrail.setStyle('DRIVE', true);
      this.ballTrail.seedArc(center, this.ball.pos, 0.05);
    }
  }

  startNewMatch({ showStartBanner = true } = {}) {
    this.pointPresentation?.cancel();
    this.pendingPointOutcome = null;
    if (this.introDirector) {
      this.introDirector.active = false;
      this.hud.hideIntroOverlay();
    }
    this.rulesEngine.resetMatch({
      gamesToWin: this.matchConfig.gamesToWin,
      scoringMode: this.matchConfig.scoringSystem
    });
    this.score = this.rulesEngine.score;
    this.playerAI.resetMemory();
    this.opponentAI.resetMemory();
    this._syncScoreboardHUD();
    this._syncSpectatorModeUI();
    this.hud.setReplayMode(false);
    if (this.audioEngine) {
      this.audioEngine.playMusicForState('start');
      this.audioEngine.playWelcomeIntro({ force: true, withLoveAll: true });
    }
    this._setupPointServe({
      showBanner: showStartBanner,
      bannerText: 'Welcome to Virtual Squash!',
      bannerStyle: 'style-start',
      persistentBanner: false
    });
  }

  _getServeStandingPositions() {
    const server = this.score.server || 'player';
    const isRightBox = this.score.serviceSide !== 'left';
    const boxX = isRightBox ? 1.85 : -1.85;
    const receiverX = isRightBox ? -1.45 : 1.45;
    const receiverZ = COURT_SPECS.SHORT_LINE_Z + 1.35; // ~1.915m

    // TASK-17: two-tier AI serve errors. Low-frequency wrong-box roll may send
    // the AI server to the opposite box; an even rarer foot-fault roll puts a
    // foot on the half-court line or short of the short line. Self-correct roll
    // schedules a visible mid-stance walk to the legal box instead.
    let serverBoxX = boxX;
    let serverBoxZ = COURT_SPECS.SHORT_LINE_Z + 0.95; // ~1.515m
    this.serveError = null;
    if (server === 'opponent') {
      const ma = this.tuningStore?.params?.movementAndAI || {};
      const wrongBoxChance = ma.aiServeWrongBoxChance ?? 0;
      const footFaultChance = ma.aiServeFootFaultChance ?? 0;
      const roll = Math.random();
      if (roll < wrongBoxChance) {
        serverBoxX = -boxX;
        this.serveError = { type: 'WRONG_BOX' };
        if (Math.random() < (ma.aiServeSelfCorrectChance ?? 0.55)) {
          this.serveError.selfCorrect = { x: boxX, z: serverBoxZ };
        }
      } else if (roll < wrongBoxChance + footFaultChance) {
        this.serveError = { type: 'FOOT_FAULT' };
        if (Math.random() < 0.5) {
          serverBoxX = Math.sign(boxX) * 0.12; // standing on the half-court line
        } else {
          serverBoxZ = COURT_SPECS.SHORT_LINE_Z - 0.02; // short of the short line
        }
      }
    }

    const playerPos =
      server === 'player'
        ? new THREE.Vector3(boxX, 0, serverBoxZ)
        : new THREE.Vector3(receiverX, 0, receiverZ);
    const opponentPos =
      server === 'opponent'
        ? new THREE.Vector3(serverBoxX, 0, serverBoxZ)
        : new THREE.Vector3(receiverX, 0, receiverZ);
    const ballStart =
      server === 'player'
        ? new THREE.Vector3(playerPos.x + (isRightBox ? 0.24 : -0.24), 1.05, playerPos.z - 0.22)
        : new THREE.Vector3(opponentPos.x + (isRightBox ? 0.24 : -0.24), 1.05, opponentPos.z - 0.22);

    return { playerPos, opponentPos, ballStart };
  }

  // Racket-spin ceremony — player calls UP/DOWN while the racket twirls;
  // winner chooses serve or receive (AI always elects to serve).
  _runRacketSpinCeremony(serveOpts = {}) {
    this.phase = 'RACKET_SPIN';
    this._pendingServeOpts = serveOpts;

    const ov = document.getElementById('racket-spin-overlay');
    if (!ov) {
      this._setupPointServe(serveOpts);
      return;
    }
    const racket = document.getElementById('rs-racket');
    const prompt = document.getElementById('rs-prompt');
    const callBtns = document.getElementById('rs-call-btns');
    const choice = document.getElementById('rs-choice');

    ov.classList.remove('hidden');
    if (prompt) prompt.textContent = 'Call it in the air —';
    callBtns?.classList.remove('hidden');
    choice?.classList.add('hidden');
    racket?.classList.add('spinning');
    if (racket) racket.style.transform = '';

    // Nobody reads — say it: shot-select mode means no footwork needed.
    this.audioEngine?.announceScore(
      "Quick note — you don't run to the ball in this game; your player does that. " +
        'Your only job is shot selection: keys one to five, a click, or spacebar. Call the spin!',
      { delayMs: 400, playChime: false }
    );

    if (this._racketSpinWired) return;
    this._racketSpinWired = true;

    const finish = (serverRole) => {
      this.score.server = serverRole;
      ov.classList.add('hidden');
      racket?.classList.remove('spinning');
      const opts = this._pendingServeOpts || {};
      this._pendingServeOpts = null;
      this._setupPointServe(opts);
    };

    const resolveSpin = (call) => {
      if (callBtns?.classList.contains('hidden')) return; // already called
      callBtns?.classList.add('hidden');
      if (prompt) prompt.textContent = '…';
      const landedUp = Math.random() < 0.5;
      const playerWon = (call === 'up') === landedUp;
      setTimeout(() => {
        racket?.classList.remove('spinning');
        if (racket) racket.style.transform = landedUp ? 'rotateX(0deg)' : 'rotateX(180deg)';
        const landedLabel = landedUp ? 'UP' : 'DOWN';
        if (playerWon) {
          if (prompt) {
            prompt.innerHTML =
              `It lands <b>${landedLabel}</b> — you win the spin!<br>` +
              '<small>take the only shot you control completely…</small>';
          }
          choice?.classList.remove('hidden');
        } else {
          if (prompt) {
            prompt.innerHTML =
              `It lands <b>${landedLabel}</b> — AI wins the spin and elects to serve.`;
          }
          setTimeout(() => finish('opponent'), 1500);
        }
      }, 1200);
    };

    document.getElementById('rs-call-up')?.addEventListener('click', () => resolveSpin('up'));
    document.getElementById('rs-call-down')?.addEventListener('click', () => resolveSpin('down'));
    document.getElementById('rs-serve')?.addEventListener('click', () => finish('player'));
    document.getElementById('rs-receive')?.addEventListener('click', () => finish('opponent'));

    // Keyboard path: arrows call the spin, then pick serve/receive.
    window.addEventListener('keydown', (e) => {
      if (this.phase !== 'RACKET_SPIN' || ov.classList.contains('hidden')) return;
      if (e.code === 'ArrowUp') {
        e.preventDefault();
        resolveSpin('up');
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        resolveSpin('down');
      } else if (choice && !choice.classList.contains('hidden')) {
        if (e.code === 'ArrowLeft') {
          e.preventDefault();
          finish('player');
        } else if (e.code === 'ArrowRight') {
          e.preventDefault();
          finish('opponent');
        }
      }
    });
  }

  _setupPointServe({
    showBanner = true,
    bannerText = null,
    bannerStyle = 'style-gold',
    persistentBanner = false
  } = {}) {
    StrokeMotion.reset(this.player);
    StrokeMotion.reset(this.opponent);
    this.pointPresentation?.cancel();
    this.pendingPointOutcome = null;
    this.pointToken=(this.pointToken||0)+1;
    this.serveReadySec=0;
    this.serveTossToken=null;
    this.serveCorrectionReason=null;
    // Racket-spin ceremony: first point of a fresh match in real play mode only
    if (
      !this.spectatorMatchMode &&
      !this.autoPlayMode &&
      !this.isMultiplayer &&
      this.phase !== 'RACKET_SPIN' &&
      this.score.playerPoints === 0 &&
      this.score.opponentPoints === 0 &&
      this.score.playerGames === 0 &&
      this.score.opponentGames === 0
    ) {
      this._runRacketSpinCeremony({ showBanner, bannerText, bannerStyle, persistentBanner });
      return;
    }

    this.phase = 'SERVE_STANCE';
    this.phaseTimer = 0;
    this.cameraMode = 'RALLY_CAM';
    this.hud.setReplayMode(false);
    this.ballTrail.clear();
    this.swingVfx && this.swingVfx.clearAllTrails();

    const pos = this._getServeStandingPositions();
    this.player.pos.copy(pos.playerPos);
    this.player.targetPos.copy(pos.playerPos);
    this.player.vel.set(0, 0, 0);
    this.player.root.rotation.set(0, Math.PI, 0);

    this.opponent.pos.copy(pos.opponentPos);
    this.opponent.targetPos.copy(pos.opponentPos);
    this.opponent.vel.set(0, 0, 0);
    this.opponent.root.rotation.set(0, Math.PI, 0);

    this.ball.pos.copy(pos.ballStart);
    this.ball.vel.set(0, 0, 0);
    this.ball.spin.set(0, 0, 0);
    this.ball.inPlay = false;
    this.ball.lastBounceWasNick = false;
    this.ball.bounceCountOnFloor = 0;
    this.ball.hitFrontWallThisShot = false;
    this.ball.rallyStrokeCount = 0;

    this.pendingUserSwing = null;
    this.pendingP2Swing = null;
    this.pendingServeSwing = null;
    this.player.swingArcMesh.visible = false;
    this.opponent.swingArcMesh.visible = false;
    this.player.swingCooldown = 0;
    this.opponent.swingCooldown = 0;

    if (this.facialFX) {
      this.facialFX.setExpression(this.player, 'neutral', 2);
      this.facialFX.setExpression(this.opponent, 'neutral', 2);
    }

    let finalBanner = bannerText;
    let finalStyle = bannerStyle;
    if (!finalBanner && showBanner) {
      const highStakes = this.rulesEngine.getHighStakesLabel();
      if (highStakes) {
        finalBanner = highStakes;
        finalStyle = 'style-gold';
        this.audioEngine && this.audioEngine.announceScore(highStakes, { delayMs: 180 });
      }
    }

    if (finalBanner && showBanner) {
      this._recordBannerBroadcast(finalBanner, finalStyle, '');
      this.hud.showCenterBanner(finalBanner, {
        style: finalStyle,
        durationMs: 1650,
        persistent: persistentBanner
      });
    } else if (!persistentBanner) {
      this.hud.hideCenterBanner();
    }

    const boxSide = this.score.serviceSide === 'left' ? 'LEFT BOX' : 'RIGHT BOX';
    this.hud.updateTimingGauge({
      cursorNormalized: 0.5,
      modeTitle: `SQUASH SERVE (${boxSide})`,
      speedText: 'SPACE / CLICK TO SERVE'
    });
  }

  _setupMidRallyShowcase() {
    this.pointPresentation?.cancel();
    this.pendingPointOutcome = null;
    this.phase = 'RALLY';
    this.phaseTimer = 0;
    this.cameraMode = 'RALLY_CAM';
    this.hud.setReplayMode(false);
    this.hud.hideCenterBanner();

    this.player.pos.set(1.45, 0, 1.85);
    this.player.targetPos.set(0.15, 0, COURT_SPECS.T_POS.z);
    this.player.root.rotation.set(0, Math.PI, 0);

    this.opponent.pos.set(-0.95, 0, 1.15);
    this.opponent.targetPos.set(-1.35, 0, 1.65);
    this.opponent.root.rotation.set(0, Math.PI, 0);

    this.ball.pos.set(1.2, 0.95, -0.8);
    this.ball.vel.set(0.45, 2.6, -21.5);
    this.ball.spin.set(12, 0, 0);
    this.rulesEngine.onStrokeHit(this.ball, 'player', {
      isServe: false,
      shotType: 'DRIVE',
      isDisguised: false
    });
    this.ball.rallyStrokeCount = 3;
    this.ball.isPowerShot = true;

    this.currentPredictedTrajectory = BallPhysics.simulateTrajectory(
      this.ball,
      this.tuningStore.params,
      this.tuningStore
    );

    this.ballTrail.setStyle('DRIVE', true);
    this.ballTrail.seedArc(new THREE.Vector3(1.35, 0.95, 1.65), this.ball.pos, 0.2);
  }

  _enterInstantReplayState() {
    if (this.introDirector?.active) {
      this.introDirector.triggerSlowMoReplay();
      return;
    }
    this.hud.showCenterBanner('POINT REPLAYS ARE AUTOMATIC', {
      style:'style-start',subText:'Watch the finish after each point. Any key or tap skips it.',durationMs:1800
    });
  }

  _queueSpectatorShotNudge(evt = {}) {
    const shotType = String(evt.shotType || this.selectedShotType || 'topspin').toLowerCase();
    this.spectatorShotNudge = {
      ...evt,
      shotType,
      cutModifier: Boolean(evt.cutModifier || shotType === 'drop' || shotType === 'slice'),
      expiresAt: this.elapsedTime + 4.0
    };
    this.hud?.showTimingPopup({
      grade: `⚡ AI NUDGE: ${shotType.toUpperCase()}`,
      detail: 'INFLUENCING NEXT AI SHOT • AUTONOMOUS RALLY CONTINUES',
      durationMs: 1350
    });
  }

  _updateLetAdvisoryUI(isObstructed = false) {
    const btn = document.getElementById('btn-call-let');
    const banner = document.getElementById('let-advisory-banner');
    if (btn) btn.classList.toggle('let-advised-pulse', Boolean(isObstructed));
    if (banner) banner.classList.toggle('hidden', !isObstructed);
  }

  requestLetAppeal(appealer = 'player', evt = {}) {
    if (this.phase !== 'RALLY' || !this.ball.inPlay) {
      this.audioEngine?.playRefereeWhistle(false);
      this.hud?.showTimingPopup({
        grade: '✋ LET APPEAL (BALL NOT IN RALLY)',
        detail: 'CALL LET (F / L / OPEN HAND ✋ / UPRIGHT PHONE) WHEN OBSTRUCTED IN RALLY',
        durationMs: 1850
      });
      return false;
    }

    // If appealing in AI vs AI spectator mode, determine which AI is currently receiving
    const effectiveAppealer =
      this.spectatorMatchMode && this.ball.lastHitter === 'player' ? 'opponent' : appealer;

    this._updateLetAdvisoryUI(false);
    this.currentRallyPlayerInterference = null;
    this.audioEngine?.playRefereeWhistle(false);

    const decision = this.rulesEngine.resolveLetAppeal({
      appealer: effectiveAppealer,
      ball: this.ball,
      playerState: this.player,
      opponentState: this.opponent
    });

    const gestureLabel =
      evt.source === 'webcam_pose' || evt.source === 'webcam_flow'
        ? '📷 WEBCAM OPEN-HAND LET'
        : evt.source === 'phone_imu' || evt.source === 'phone'
        ? '📱 PHONE RACKET LET'
        : '✋ LET APPEALED!';

    this.hud?.showTimingPopup({
      grade: `${gestureLabel} • ${decision.decision.replace('_', ', ')}`,
      detail: decision.callout || decision.explanation,
      durationMs: 2600
    });

    if (decision.replaysPoint || decision.decision === 'YES_LET') {
      this._replayLetRally({ ...decision, explanation: decision.callout || decision.explanation });
      return true;
    }

    // Either STROKE (point to appealer) or NO_LET (point to non-appealer)
    this._awardPoint(decision.winner, decision.reason || decision.callout, decision);
    return true;
  }

  _replayLetRally(letDecision = {}) {
    this.phase = 'POINT_OVER';
    this.phaseTimer = 0;
    this.ball.inPlay = false;
    this.pendingUserSwing = null;
    this.pendingP2Swing = null;
    this.pendingServeSwing = null;
    this._updateLetAdvisoryUI(false);
    this.currentRallyPlayerInterference = null;

    const bannerTitle = letDecision.bannerTitle || 'YES, LET! (REPLAY RALLY)';
    const subText =
      letDecision.safetyWarningText ||
      letDecision.explanation ||
      'Interference on court — replay the point from same service box.';
    this._recordBannerBroadcast(bannerTitle, 'style-start', subText);
    this.hud?.showCenterBanner(bannerTitle, {
      style: 'style-start',
      subText,
      durationMs: 2200
    });

    if (this.audioEngine) {
      const voiceText = letDecision.safetyWarningText
        ? `${letDecision.refereeCallout} ${letDecision.safetyWarningText}`
        : letDecision.refereeCallout || 'Yes, Let! Play a let.';
      this.audioEngine.announceScore(voiceText, { delayMs: 60, forceReferee: true });
    }
  }

  _handleUserTossInput() {
    this.lastHumanInputTime = this.elapsedTime;
    if (this.spectatorMatchMode || this.autoPlayMode) {
      if (this.phase === 'SERVE_STANCE') {
        const srv = this.score.server === 'player' ? this.player : this.opponent;
        this.hud.hideCenterBanner();
        this._startServeToss(srv);
        return true;
      }
      return false;
    }
    this.userHasInteracted = true;
    if (this.phase === 'SERVE_STANCE' && this.score.server === 'player') {
      this.persistentStateLock = false;
      this.hud.hideCenterBanner();
      this._startServeToss(this.player);
      return true;
    }
    return false;
  }

  _handleUserSwingInput(evt = {}) {
    this.lastHumanInputTime = this.elapsedTime;

    // When "barging in" during automated AI demo / spectator play (in ANY phase),
    // execute the passer-by's shot or serve immediately (or queue it for the next contact)
    // and continue automated AI play seamlessly without ever leaving the players idling!
    if (this.spectatorMatchMode || this.autoPlayMode) {
      if (evt.shotType && evt.shotType !== 'toss') {
        const st = String(evt.shotType).toUpperCase();
        this.selectedShotType = st;
        this.hud.setActiveShotChip(evt.shotType);
      }
      if (this.phase === 'SERVE_STANCE') {
        const srv = this.score.server === 'player' ? this.player : this.opponent;
        this.hud.hideCenterBanner();
        this._startServeToss(srv);
        this.pendingServeSwing = { actor: srv, evt, pointToken:this.pointToken };
        return;
      }
      if (this.phase === 'SERVE_TOSS') {
        const srv = this.score.server === 'player' ? this.player : this.opponent;
        this._executeServeHit(srv, evt);
        return;
      }
      if (this.phase === 'RALLY' && this.ball.inPlay) {
        if (this.ball.lastHitter === 'opponent' && this._attemptPlayerRallyStrike({ ...evt, isSpectatorNudge: true }, true)) {
          this.spectatorShotNudge = null;
          return;
        }
        if (this.ball.lastHitter === 'player' && this._attemptOpponentManualStrike({ ...evt, isSpectatorNudge: true })) {
          this.spectatorShotNudge = null;
          return;
        }
        // Even if the ball is still in flight toward the wall, give immediate visual swing feedback
        // on Player 1 and queue the shot so the AI executes it on contact!
        const side =
          evt.side === 'backhand' || (Number(evt.dirX || 0) < -0.12 && evt.side !== 'forehand')
            ? 'backhand'
            : 'forehand';
        const shotType = String(evt.shotType || this.selectedShotType || 'topspin').toLowerCase();
        this.racketKinematics?.triggerSwing(this.player, {
          shotType,
          side,
          speed: Number(evt.speed || 1.2),
          timing: 'sweet',
          dirX: Number(evt.dirX || 0)
        });
        this.audioEngine?.playSwingWhoosh(Number(evt.speed || 1.15));
        this._queueSpectatorShotNudge(evt);
      }
      return;
    }

    this.userHasInteracted = true;
    if (this.phase === 'WONDER_INTRO') {
      if (this.introDirector && this.introDirector.step === 'DEMO_B_REVELATION') {
        this.introDirector.skipToPlayableMatch();
      }
      return;
    }

    if (this.phase === 'NICK_LAB') {
      this.startNewMatch({ showStartBanner: true });
      return;
    }

    if (evt.shotType && evt.shotType !== 'toss') {
      const st = String(evt.shotType).toUpperCase();
      this.selectedShotType = st;
      this.hud.setActiveShotChip(evt.shotType);
    }

    if (this.phase === 'SERVE_STANCE' && this.score.server === 'player') {
      this.persistentStateLock = false;
      this.hud.hideCenterBanner();
      this._startServeToss(this.player);
      this.pendingServeSwing = { actor: this.player, evt, pointToken:this.pointToken };
      return;
    }

    if (this.phase === 'SERVE_TOSS' && this.score.server === 'player') {
      this._executeServeHit(this.player, evt);
      return;
    }

    if (this.phase === 'RALLY') {
      this.autoPlayMode = false;
      const side =
        evt.side === 'backhand' || (Number(evt.dirX || 0) < -0.12 && evt.side !== 'forehand')
          ? 'backhand'
          : evt.side === 'forehand' || Number(evt.dirX || 0) > 0.12
            ? 'forehand'
            : this.ball.pos.x < this.player.pos.x - 0.05
              ? 'backhand'
              : 'forehand';
      const shotType = String(evt.shotType || this.selectedShotType || 'topspin').toLowerCase();

      if (!this._attemptPlayerRallyStrike({ ...evt, side }, false)) {
        this.racketKinematics &&
          this.racketKinematics.triggerSwing(this.player, {
            shotType,
            side,
            speed: Number(evt.speed || 1.2),
            timing: 'sweet',
            dirX: Number(evt.dirX || 0)
          });
        this.audioEngine && this.audioEngine.playSwingWhoosh(Number(evt.speed || 1.15));
        if (this.ball.lastHitter === 'opponent') {
          this.pendingUserSwing = {
            evt: { ...evt, side, sweetSpotAssisted: true },
            expiresAt: this.elapsedTime + 0.52
          };
        }
      }
    }
  }

  _handleP2TossInput() {
    this.userHasInteracted = true;
    this.isMultiplayer = true;
    if (this.phase === 'TITLE') {
      this.hud.hideTitleModal();
      this.autoPlayMode = false;
      this.persistentStateLock = false;
      this.startNewMatch({ showStartBanner: true });
      return true;
    }
    if (this.phase === 'SERVE_STANCE' && this.score.server === 'opponent') {
      this.persistentStateLock = false;
      this.hud.hideCenterBanner();
      this._startServeToss(this.opponent);
      return true;
    }
    return false;
  }

  _handleP2SwingInput(evt = {}) {
    this.userHasInteracted = true;
    this.isMultiplayer = true;
    this._applyDifficultyTuning('1v1');
    if (this.phase === 'TITLE') {
      this.hud.hideTitleModal();
      this.autoPlayMode = false;
      this.persistentStateLock = false;
      this.startNewMatch({ showStartBanner: true });
      return;
    }
    if (this.phase === 'SERVE_STANCE' && this.score.server === 'opponent') {
      this.persistentStateLock = false;
      this.hud.hideCenterBanner();
      this._startServeToss(this.opponent);
      this.pendingServeSwing = { actor: this.opponent, evt, pointToken:this.pointToken };
      return;
    }
    if (this.phase === 'SERVE_TOSS' && this.score.server === 'opponent') {
      this._executeServeHit(this.opponent, evt);
      return;
    }
    if (this.phase === 'RALLY') {
      this.autoPlayMode = false;
      if (!this._attemptOpponentManualStrike(evt)) {
        this.pendingP2Swing = {
          evt: { ...evt, sweetSpotAssisted: true },
          expiresAt: this.elapsedTime + 0.52
        };
      }
    }
  }

  _updateServeReadiness(dt) {
    const server=this.score.server==='player'?this.player:this.opponent;
    const receiver=server===this.player?this.opponent:this.player;
    const setup=evaluateServeSetup({server,receiver,serviceSide:this.score.serviceSide,params:this.tuningStore.params});
    this.serveReadySec=setup.ready?(this.serveReadySec||0)+dt:0;
    if(!setup.ready) {
      if(setup.reason==='SERVER_POSITION')server.targetPos.copy(setup.correctionTargets.server);
      if(setup.reason==='RECEIVER_CLEARANCE')receiver.targetPos.copy(setup.correctionTargets.receiver);
      // Clear wrong-box staging synchronously; no timeout can act on a later point.
      this.serveError=null;
      if(setup.reason!==this.serveCorrectionReason&&setup.reason!=='WAIT_FOR_ARRIVAL') {
        const text=setup.reason==='SERVER_POSITION'?'Server, use the '+this.score.serviceSide+' box.':'Receiver, give the server room.';
        this.hud.showCenterBanner('WAIT — SERVICE POSITION',{style:'style-start',subText:text,durationMs:1800});
        this.audioEngine?.playVoiceCallout(text);
      }
    }
    this.serveCorrectionReason=setup.reason;
    return setup;
  }

  _startServeToss(actor) {
    if(this.phase!=='SERVE_STANCE'||actor.role!==this.score.server)return false;
    const setup=this._updateServeReadiness(0);
    if(!setup.ready||this.serveReadySec<.2)return false;
    this.serveTossToken=this.pointToken;
    this.phase = 'SERVE_TOSS';
    this.phaseTimer = 0;
    const xOffset = this.score.serviceSide === 'left' ? -0.25 : 0.25;
    this.ball.pos.set(actor.pos.x + xOffset, 1.05, actor.pos.z - 0.22);
    this.ball.vel.set(0, 4.4, 0);
    this.ball.inPlay = false;
    this.facialFX && this.facialFX.setExpression(actor, 'focused_squint', 1.2);
    this.audioEngine && this.audioEngine.playServeToss();
  }

  _executeServeHit(actor, evt = {}) {
    if(this.phase!=='SERVE_TOSS'||actor.role!==this.score.server||this.serveTossToken!==this.pointToken)return false;
    const receiver=actor===this.player?this.opponent:this.player;
    const setup=evaluateServeSetup({server:actor,receiver,serviceSide:this.score.serviceSide});
    const fault=this.rulesEngine.evaluateServeStanceLegality(actor.pos,this.score.serviceSide);
    if(fault==='FOOT_FAULT'&&actor.pos.distanceTo(receiver.pos)>=1.25) {
      this._awardPoint(receiver.role,'foot fault',{bannerTitle:'Foot fault!'});return false;
    }
    if(!setup.ready) {
      this.phase='SERVE_STANCE';this.phaseTimer=0;this.serveReadySec=0;this.pendingServeSwing=null;
      this.ball.vel.set(0,0,0);this._updateServeReadiness(0);return false;
    }
    this.pendingServeSwing = null;
    this.currentRallyPlayerInterference = null;
    this._updateLetAdvisoryUI(false);
    const serveExec = this.shotController.computeServeExecution({
      actor,
      serviceSide: this.score.serviceSide || 'right',
      inputEvent: evt,
      params: this.tuningStore.params
    });

    const side = this.score.serviceSide === 'left' ? 'backhand' : 'forehand';
    actor.swingType = side;
    actor.swingDuration = 0.34;
    actor.swingTimer = 0.34;
    actor.arcVisibleTimer = 0.36;
    actor.swingArcMesh.visible = true;

    if (this.racketKinematics) {
      this.racketKinematics.triggerSwing(actor, {
        shotType: 'topspin',
        side,
        speed: 1.25,
        timing: 'sweet',
        isServe: false
      });
      this.racketKinematics.triggerImpactRecoil(actor, 1.15);
    }

    this.ball.vel.copy(serveExec.vel);
    this.ball.spin.copy(serveExec.spin);
    this.rulesEngine.onStrokeHit(this.ball, actor.role, {
      isServe: true,
      shotType: serveExec.label,
      isDisguised: false
    });

    this.currentPredictedTrajectory = BallPhysics.simulateTrajectory(
      this.ball,
      this.tuningStore.params,
      this.tuningStore
    );

    this.ballTrail.clear();
    this.ballTrail.setStyle('DRIVE', false);
    this.ballTrail.pushPoint(this.ball.pos);

    this.phase = 'RALLY';
    this.cameraMode = 'RALLY_CAM';

    this.swingVfx &&
      this.swingVfx.onRacketContact({
        actor,
        ball: this.ball,
        contactPos: this.ball.pos.clone(),
        shotType: 'TOPSPIN',
        isPower: false,
        isServe: true,
        timingQuality: 'PERFECT',
        speed: this.ball.vel.length()
      });

    this.audioEngine && this.audioEngine.playRacketHit('topspin', 'perfect');

    if (actor.role === 'player') {
      const screenPos = this._projectToScreen(actor.pos.clone().add(new THREE.Vector3(0, 2.1, 0)));
      this.hud.showTimingPopup({
        grade: serveExec.label,
        detail: `${serveExec.speedKmh} KM/H • ABOVE 1.78M SERVICE LINE`,
        screenPos
      });
    }
  }

  _tryPendingPlayerRallyStrike() {
    if (!this.pendingUserSwing || this.ball.lastHitter !== 'opponent') return false;
    if (this.elapsedTime > this.pendingUserSwing.expiresAt) {
      this.pendingUserSwing = null;
      return false;
    }
    if (!this.ball.hitFrontWallThisShot) return false;
    const dist = Math.hypot(this.ball.pos.x-this.player.pos.x,this.ball.pos.z-this.player.pos.z);
    const volley = planVolleyContact({actor:this.player,opponent:this.opponent,ball:this.ball,
      predictedTrajectory:this.currentPredictedTrajectory,params:this.tuningStore.params,
      requestedShot:{...this.pendingUserSwing.evt,maxWaitSec:this.pendingUserSwing.expiresAt-this.elapsedTime}});
    if (dist>1.15 || this.ball.pos.y>2.35 || (this.ball.bounceCountOnFloor===0 && (!volley || volley.contactTimeSec>.12))) return false;
    const evt = {...this.pendingUserSwing.evt, ...(volley ? {volleyTargetCornerSign:volley.targetCornerSign} : {})};
    this.pendingUserSwing = null;
    return this._attemptPlayerRallyStrike(evt, false);
  }

  _attemptPlayerRallyStrike(evt = {}, isAuto = false) {
    if (this.player.strokeMotion?.pending) return true;
    if (this.phase !== 'RALLY' || !this.ball.inPlay || !this.ball.hitFrontWallThisShot) return false;
    if (this.ball.lastHitter === 'player') return false;
    if (this.player.swingCooldown > 0) return false;

    const dist = Math.hypot(this.ball.pos.x - this.player.pos.x, this.ball.pos.z - this.player.pos.z);
    const maxReach = 1.15;
    if (dist > maxReach || this.ball.pos.y > 2.6) {
      return false;
    }
    this._showRedShotChoice(evt.shotType || this.selectedShotType,
      `RED CHOOSES: ${String(evt.shotType || this.selectedShotType || 'Drive').replace(/topspin/i,'Drive')}`);

    const prepSnapshot = this.shotController.clearPreparation('player');
    if (evt.prepHoldMs && prepSnapshot.durationSec === 0) {
      prepSnapshot.durationSec = evt.prepHoldMs / 1000;
      prepSnapshot.chargeNormalized = Math.min(1, prepSnapshot.durationSec / 0.42);
    }

    const handedness = this.motionController?.handedness || this.player.handedness || 'right';
    const handSign = handedness === 'left' ? -1 : 1;
    const shotType = String(evt.shotType || this.selectedShotType || 'topspin').toLowerCase();
    const cutModifier = Boolean(evt.cutModifier || ['drop', 'slice'].includes(shotType) ||
      ['DROP', 'SLICE'].includes(this.selectedShotType));
    const isKill = ['smash', 'kill', 'volley_kill'].includes(shotType);
    const side = isKill ? 'overhead' : evt.side ||
      ((this.ball.pos.x - this.player.pos.x) * handSign < -0.05 ? 'backhand' : 'forehand');
    const k = this.racketKinematics?.triggerSwing(this.player, {
      shotType: isKill ? 'smash' : ['drop', 'slice'].includes(shotType) ? 'slice' : 'topspin',
      side, speed: Number(evt.speed || 1.2), timing: 'sweet', dirX: Number(evt.dirX || 0)
    });
    const requested = StrokeMotion.request(this.player, {
      ball: this.ball, inputEvent: { ...evt, aiExecution:isAuto && !evt.isSpectatorNudge, shotType, cutModifier, side: k?.swingSide || side },
      prepSnapshot, isAuto, handedness, gravity: this.tuningStore.params.ballPhysics.gravity
    });
    if (requested) this.player.swingCooldown = 0.50;
    return requested;
  }

  _commitPlayerRallyStrike({ inputEvent: evt = {}, prepSnapshot }) {
    if (this.phase !== 'RALLY' || !this.ball.inPlay || !this.ball.hitFrontWallThisShot ||
        this.ball.lastHitter === 'player' || this.ball.bounceCountOnFloor >= 2) return false;
    const dist = Math.hypot(this.ball.pos.x - this.player.pos.x, this.ball.pos.z - this.player.pos.z);
    if (dist > 1.15 || this.ball.pos.y > 2.6) return false;

    const cutModifier = Boolean(
      evt.cutModifier ||
        evt.shotType === 'drop' ||
        evt.shotType === 'slice'
    );

    const shot = this.shotController.computeShotExecution({
      actor: this.player,
      ball: this.ball,
      opponent: this.opponent,
      inputEvent: {
        ...evt,
        shotType: evt.shotType || 'topspin',
        cutModifier
      },
      prepSnapshot,
      params: this.tuningStore.params
    });

    const isKill = shot.shotId === SQUASH_SHOT_TYPES.VOLLEY_KILL;
    const isDrop =
      shot.shotId === SQUASH_SHOT_TYPES.DISGUISED_DROP ||
      shot.shotId === SQUASH_SHOT_TYPES.COUNTER_DROP;
    this._showRedShotChoice(shot.label, `RED PLAYS: ${shot.label}`);
    if (this.racketKinematics) {
      this.racketKinematics.triggerImpactRecoil(this.player, isKill ? 1.35 : 0.95);
    }

    const contactPos = this.ball.pos.clone();
    this.ball.vel.copy(shot.vel);
    this.ball.spin.copy(shot.spin);
    this.ball.isPowerShot = isKill || shot.speedKmh > 92;

    this.rulesEngine.onStrokeHit(this.ball, 'player', {
      isServe: false,
      shotType: shot.label,
      isDisguised: shot.isDisguised
    });
    this.currentRallyPlayerInterference = null;
    this._updateLetAdvisoryUI(false);

    this.opponentAI.recordPlayerShot(shot, this.ball, this.tuningStore.params);
    this.currentPredictedTrajectory = BallPhysics.simulateTrajectory(
      this.ball,
      this.tuningStore.params,
      this.tuningStore
    );

    this.ballTrail.setStyle(shot.label, this.ball.isPowerShot);
    this.swingVfx &&
      this.swingVfx.onRacketContact({
        actor: this.player,
        ball: this.ball,
        contactPos,
        shotType: isDrop ? 'SLICE' : this.ball.isPowerShot ? 'SMASH' : 'TOPSPIN',
        isPower: this.ball.isPowerShot,
        isServe: false,
        timingQuality: 'PERFECT',
        speed: this.ball.vel.length()
      });

    this.facialFX &&
      this.facialFX.setExpression(
        this.player,
        this.ball.isPowerShot ? 'effort_shout' : 'focused_squint',
        0.55
      );
    if (this.ball.isPowerShot) {
      this.cameraTrauma = 0.2;
      this._spawnStarBurst(contactPos, 10);
    }

    if (this.audioEngine) {
      this.audioEngine.playRacketHit(
        isDrop ? 'slice' : this.ball.isPowerShot ? 'smash' : 'topspin',
        'perfect'
      );
    }

    if (!this.autoPlayMode || this.spectatorMatchMode) {
      const screenPos = this._projectToScreen(this.player.pos.clone().add(new THREE.Vector3(0, 2.15, 0)));
      const detail = isDrop
        ? `OPEN CUT ${Math.round(shot.cutAngleDeg)}° • ${shot.speedKmh} KM/H`
        : `${shot.speedKmh} KM/H • PRONATION ${Math.round(shot.forearmPronationDegPerSec)}°/S`;
      const prefix = evt.isSpectatorNudge
        ? '⚡ NUDGED P1 • '
        : this.spectatorMatchMode
        ? 'P1 AI • '
        : '';
      this.hud.showTimingPopup({
        grade: `${prefix}${shot.label} (${shot.timingGrade})`,
        detail,
        screenPos
      });
      this.hud.updateTimingGauge({
        cursorNormalized: isDrop ? 0.24 : String(shot.shotId || '').includes('BOAST') ? 0.78 : 0.5,
        modeTitle: `${prefix}${shot.label}`,
        speedText: `${shot.speedKmh} KM/H`
      });
    }

    return true;
  }

  _attemptOpponentManualStrike(evt = {}) {
    if (this.opponent.strokeMotion?.pending) return true;
    if (this.ball.lastHitter === 'opponent') return false;
    const dist = Math.hypot(this.ball.pos.x - this.opponent.pos.x, this.ball.pos.z - this.opponent.pos.z);
    if (dist > 1.15) return false;
    return this._executeOpponentSquashStrike({
      shotType: (evt.shotType || 'topspin').toLowerCase(),
      dirX: Number(evt.dirX || 0),
      speed: Number(evt.speed || 1.18),
      cutModifier: Boolean(evt.cutModifier || evt.shotType === 'drop'),
      prepCharge: 0.65,
      isSpectatorNudge: Boolean(evt.isSpectatorNudge)
    });
  }

  _executeOpponentSquashStrike(aiDecision = {}) {
    if (this.opponent.strokeMotion?.pending) return true;
    if (this.phase !== 'RALLY' || !this.ball.inPlay || !this.ball.hitFrontWallThisShot ||
        this.ball.lastHitter === 'opponent' || this.ball.bounceCountOnFloor >= 2) return false;
    if (this.opponent.swingCooldown > 0) return false;
    const dist = Math.hypot(this.ball.pos.x - this.opponent.pos.x, this.ball.pos.z - this.opponent.pos.z);
    if (dist > 1.15 || this.ball.pos.y > 2.6) return false;
    const handedness = this.opponent.handedness || 'right';
    const handSign = handedness === 'left' ? -1 : 1;
    const shotType = String(aiDecision.shotType || 'topspin').toLowerCase();
    const isKill = ['smash', 'kill', 'volley_kill'].includes(shotType);
    const side = isKill ? 'overhead' : aiDecision.side ||
      ((this.ball.pos.x - this.opponent.pos.x) * handSign < -0.05 ? 'backhand' : 'forehand');
    const k = this.racketKinematics?.triggerSwing(this.opponent, {
      shotType: isKill ? 'smash' : ['drop', 'slice'].includes(shotType) ? 'slice' : 'topspin',
      side, speed: Number(aiDecision.speed || 1.16), timing: 'sweet', dirX: Number(aiDecision.dirX || 0)
    });
    const requested = StrokeMotion.request(this.opponent, {
      ball: this.ball, inputEvent: { ...aiDecision, aiExecution:Boolean(aiDecision.aiExecution && !aiDecision.isSpectatorNudge), side: k?.swingSide || side }, isAuto: true,
      prepSnapshot: { active: true, durationSec: 0.35, chargeNormalized: Number(aiDecision.prepCharge ?? 0.65) },
      handedness, gravity: this.tuningStore.params.ballPhysics.gravity
    });
    if (requested) this.opponent.swingCooldown = 0.50;
    return requested;
  }

  _commitOpponentSquashStrike({ inputEvent: aiDecision = {}, prepSnapshot }) {
    if (this.phase !== 'RALLY' || !this.ball.inPlay || !this.ball.hitFrontWallThisShot ||
        this.ball.lastHitter === 'opponent' || this.ball.bounceCountOnFloor >= 2) return false;
    const dist = Math.hypot(this.ball.pos.x - this.opponent.pos.x, this.ball.pos.z - this.opponent.pos.z);
    if (dist > 1.15 || this.ball.pos.y > 2.6) return false;

    const shot = this.shotController.computeShotExecution({
      actor: this.opponent,
      ball: this.ball,
      opponent: this.player,
      inputEvent: aiDecision,
      prepSnapshot,
      params: this.tuningStore.params
    });

    const isDrop =
      shot.shotId === SQUASH_SHOT_TYPES.DISGUISED_DROP ||
      shot.shotId === SQUASH_SHOT_TYPES.COUNTER_DROP;
    const isKill = shot.shotId === SQUASH_SHOT_TYPES.VOLLEY_KILL;
    if (this.racketKinematics) {
      this.racketKinematics.triggerImpactRecoil(this.opponent, 1.0);
    }

    const contactPos = this.ball.pos.clone();
    this.ball.vel.copy(shot.vel);
    this.ball.spin.copy(shot.spin);
    this.ball.isPowerShot = isKill;

    this.rulesEngine.onStrokeHit(this.ball, 'opponent', {
      isServe: false,
      shotType: shot.label,
      isDisguised: shot.isDisguised
    });

    this.playerAI?.recordPlayerShot(shot, this.ball, this.tuningStore.params);
    this.currentPredictedTrajectory = BallPhysics.simulateTrajectory(
      this.ball,
      this.tuningStore.params,
      this.tuningStore
    );

    this.ballTrail.setStyle(shot.label, isKill);

    this.swingVfx &&
      this.swingVfx.onRacketContact({
        actor: this.opponent,
        ball: this.ball,
        contactPos,
        shotType: isDrop ? 'SLICE' : 'TOPSPIN',
        isPower: isKill,
        isServe: false,
        timingQuality: 'GOOD',
        speed: this.ball.vel.length()
      });

    this.facialFX &&
      this.facialFX.setExpression(
        this.opponent,
        this.opponentAI.reactionTimerSec > 0.05 ? 'wide_eyed_panic' : 'effort_shout',
        0.55
      );

    if (this.audioEngine) {
      this.audioEngine.playRacketHit(isDrop ? 'slice' : 'topspin', 'good');
    }

    if (this.spectatorMatchMode) {
      const screenPos = this._projectToScreen(this.opponent.pos.clone().add(new THREE.Vector3(0, 2.15, 0)));
      const prefix = aiDecision.isSpectatorNudge ? '⚡ NUDGED P2 • ' : 'P2 AI • ';
      this.hud.showTimingPopup({
        grade: `${prefix}${shot.label}`,
        detail: `${shot.speedKmh} KM/H`,
        screenPos
      });
      this.hud.updateTimingGauge({
        cursorNormalized: isDrop ? 0.24 : String(shot.shotId || '').includes('BOAST') ? 0.78 : 0.5,
        modeTitle: `${prefix}${shot.label}`,
        speedText: `${shot.speedKmh} KM/H`
      });
    }

    return true;
  }

  update(dt) {
    if (this.isPausedForModal) {
      this._updateCameraRig(dt * 0.15);
      this._updateProjectedHUD();
      return;
    }

    this.elapsedTime += dt;
    this.cameraTrauma = Math.max(0, this.cameraTrauma - dt * 1.4);

    // Periodic Narrator Invitation & USP Showcase (every ~95s during AI vs AI / Side-Menu Showcase)
    if (this.spectatorMatchMode || this.autoPlayMode) {
      this.narratorInviteTimerSec += dt;
      const thresholdSec = this.narratorFirstInviteDone ? 95 : 18;
      if (
        this.narratorInviteTimerSec >= thresholdSec &&
        (this.phase === 'SERVE_STANCE' ||
          this.phase === 'POINT_OVER' ||
          (this.phase === 'RALLY' && this.phaseTimer > 2.5))
      ) {
        this.narratorInviteTimerSec = 0;
        this.narratorFirstInviteDone = true;
        this.triggerNarratorUSPInvite({ manual: false });
      }
    }

    // Update 3D Court Geometry overlays (wall impact rings & T-Zone guide)
    const ma = this.tuningStore.params.movementAndAI;
    this.courtGeometry.update(dt);
    this.courtGeometry.updateTZoneGuide(this.player.pos, {
      visible: ma.showTCoverageGuide !== false,
      autoTEnabled: ma.autoTReturn !== false,
      tTarget: { x: ma.tTargetX ?? 0, y: 0, z: ma.tTargetZ ?? COURT_SPECS.T_POS.z }
    });

    const effectiveDt = this.swingVfx ? this.swingVfx.consumeHitStop(dt) : dt;
    const timeScale = this.phase === 'REPLAY' ? 0.35 : 1.0;

    if (this.phase === 'WONDER_INTRO') {
      this.introDirector.update(effectiveDt);
    }

    if (!this.introDirector?.slowMoReplayActive) {
      this.physicsAccumulator += effectiveDt * timeScale;
      while (this.physicsAccumulator >= FIXED_DT) {
        this._stepPhysics(FIXED_DT);
        this.physicsAccumulator -= FIXED_DT;
      }
    }

    if (this.tuningPanel && this.tuningPanel.isOpen) {
      this.tuningPanel.updateLiveTelemetry({
        fps: this.currentFps,
        ballSpeedKmh: Math.round(this.ball.vel.length() * 3.6),
        lastSurface: this.lastSurfaceContact
      });
    }

    if (
      this.isMultiplayer &&
      this.roomId &&
      this.roomId !== 'default' &&
      this.playerRole === 'p1' &&
      this.elapsedTime - this.lastSyncSentAt >= 0.045
    ) {
      this.lastSyncSentAt = this.elapsedTime;
      this._broadcastMultiplayerSnapshot();
    }

    this._updateMiiAnimation(this.player, dt);
    this._updateMiiAnimation(this.opponent, dt);
    if(this.phase==='RALLY'||this.phase==='POINT_SETTLE') this.pointPresentation.record(dt,this.ball,[this.player,this.opponent]);
    this._updateCrowdAnimation(dt);

    if (this.swingVfx) {
      this.swingVfx.update(dt, {
        actors: [this.player, this.opponent],
        ball: this.ball,
        camera: this.camera
      });
    }

    this._updateEffects(dt);
    this._updateCameraRig(dt);
    this._updateProjectedHUD();
  }

  _handleCollisionEvent(evt, { checkRules = true } = {}) {
    if(checkRules) this.pointPresentation?.collision(evt);
    this.lastSurfaceContact = evt.surface;
    this.courtGeometry.spawnSurfaceImpact(evt.surface, evt.pos, {
      isNick: evt.isNick,
      isFault: evt.isTin || evt.isOut
    });

    if (evt.isTin) {
      this.audioEngine?.playTinClank(evt.speed);
    } else if (evt.isNick) {
      this._spawnStarBurst(evt.pos, 16);
      this.audioEngine?.playNickRoll(evt.speed);
      this.hud.showTimingPopup({
        grade: 'NICK ROLLER! • DEAD BOUNCE',
        detail: `${evt.nickData?.corner === 'FRONT_CORNER_NICK' ? 'FRONT CORNER' : 'SIDE-WALL'} NICK`,
        durationMs: 1650
      });
    } else if (evt.surface === 'floor') {
      this._spawnBounceRing(evt.pos.x, evt.pos.z);
      this.audioEngine?.playBallBounce(Math.min(1.1, evt.speed / 6));
    } else {
      this.audioEngine?.playWallHit(evt.surface, evt.speed / 12);
    }

    if (!checkRules) return { rallyEnded: false };
    return this.rulesEngine.evaluateCollision(evt, this.ball);
  }

  _updateStrokeMotions(dt) {
    for (const actor of [this.player, this.opponent]) {
      const handedness = actor === this.player
        ? this.motionController?.handedness || actor.handedness || 'right'
        : actor.handedness || 'right';
      StrokeMotion.prepare(actor, dt, { ball: this.ball, phase: this.phase, handedness });
      const payload = StrokeMotion.update(actor, dt, { ball: this.ball, phase: this.phase });
      if (payload) {
        const committed = actor === this.player
          ? this._commitPlayerRallyStrike(payload) : this._commitOpponentSquashStrike(payload);
        if (!committed) {
          StrokeMotion.reset(actor);
          actor.swingTimer = 0;
          // A missed volley must not lock out a legal second attempt on the bounce.
          if (this.phase === 'RALLY' && this.ball.inPlay && this.ball.lastHitter !== actor.role && this.ball.bounceCountOnFloor < 2) {
            actor.swingCooldown = 0;
          }
          if (actor.racketKinematics) actor.racketKinematics.swingActive = false;
        }
      }
      const motion = actor.strokeMotion;
      if (motion.phase === 'swing') {
        actor.swingDuration = motion.racketDurationSec;
        actor.swingTimer = (1 - motion.progress) * motion.racketDurationSec;
        actor.swingType = motion.side === 'overhead' ? 'smash' : motion.side;
      }
    }
  }

  _stepPhysics(dt) {
    if(this.pointPresentation?.active) {
      const was=this.pointPresentation.phase;
      const phase=this.pointPresentation.step(dt,this.tuningStore.params,e=>this._handleCollisionEvent(e,{checkRules:false}));
      if(phase==='DONE'){this._finishPointPresentation();return;}
      this.phase=phase;
      if(phase==='POINT_SETTLE') {
        this.ball.pos.copy(this.pointPresentation.ball.pos);
        this.ball.vel.copy(this.pointPresentation.ball.vel);
      } else {
        if(was!==phase){this.ballTrail.clear();this.hud.hideCenterBanner();this._snapCameraImmediate();}
        this.pointPresentation.apply(this.ball,[this.player,this.opponent]);
      }
      this.ballTrail.pushPoint(this.ball.pos);
      return;
    }
    if (this.phase !== 'RALLY' || !this.ball.inPlay) {
      StrokeMotion.reset(this.player);
      StrokeMotion.reset(this.opponent);
    }
    this.phaseTimer += dt;
    if (this.player.swingCooldown > 0) {
      this.player.swingCooldown = Math.max(0, this.player.swingCooldown - dt);
    }
    if (this.opponent.swingCooldown > 0) {
      this.opponent.swingCooldown = Math.max(0, this.opponent.swingCooldown - dt);
    }

    if (this.phase === 'SHOWCASE') {
      if (this.phaseTimer >= 0.34) {
        this.phaseTimer = 0;
        this._refreshShowcasePose();
      }
      return;
    }

    if (this.phase === 'WONDER_INTRO' || this.phase === 'REPLAY' || this.phase === 'NICK_LAB') {
      if (this.ball.inPlay) {
        BallPhysics.stepBallPhysics(this.ball, dt, this.tuningStore.params, this.tuningStore, {
          onCollision: (evt) => this._handleCollisionEvent(evt, { checkRules: false })
        });
        this.ballTrail.pushPoint(this.ball.pos);
      }
      PlayerMovement.stepActorLocomotion(this.player, this.opponent, dt, this.tuningStore.params, false);
      PlayerMovement.stepActorLocomotion(this.opponent, this.player, dt, this.tuningStore.params, false);

      if (this.phase === 'REPLAY' && !this.persistentStateLock && this.phaseTimer > 2.4) {
        this.hud.setReplayMode(false);
        this._setupPointServe({ showBanner: true });
      }
      return;
    }

    // AI controls the human player ONLY via the explicit spectator/showcase flags —
    // never silently on input idle (waiting for the ball is normal play).
    const aiControlsPlayer = this.spectatorMatchMode || this.autoPlayMode;

    if (this.phase === 'SERVE_STANCE' && !this.persistentStateLock) {
      this._updateServeReadiness(dt);
      PlayerMovement.stepActorLocomotion(this.player, this.opponent, dt, this.tuningStore.params, false);
      PlayerMovement.stepActorLocomotion(this.opponent, this.player, dt, this.tuningStore.params, false);
      if(this.pendingServeSwing&&this.pendingServeSwing.pointToken!==this.pointToken)this.pendingServeSwing=null;
      if(this.pendingServeSwing&&this.serveReadySec>=.2)this._startServeToss(this.pendingServeSwing.actor);
      if (this.score.server === 'opponent' && !this.isMultiplayer && this.phaseTimer > 0.95) {
        this._startServeToss(this.opponent);
      } else if (
        this.score.server === 'player' && aiControlsPlayer && this.phaseTimer > 0.95
      ) {
        this._startServeToss(this.player);
      }
    }

    if (this.phase === 'SERVE_TOSS') {
      this.ball.pos.addScaledVector(this.ball.vel, dt);
      this.ball.vel.y -= (this.tuningStore.params.ballPhysics.gravity || 9.81) * dt;

      if (this.pendingServeSwing && (this.ball.pos.y >= 1.48 || this.ball.vel.y <= 0.35)) {
        const { actor, evt } = this.pendingServeSwing;
        this.pendingServeSwing = null;
        this._executeServeHit(actor, evt);
        return;
      }

      if (
        ((this.score.server === 'opponent' && !this.isMultiplayer) ||
          (aiControlsPlayer && this.score.server === 'player')) &&
        this.ball.vel.y <= 0.4 &&
        this.ball.pos.y >= 1.32
      ) {
        const srv = this.score.server === 'player' ? this.player : this.opponent;
        this._executeServeHit(srv, { speed: 1.18 });
        return;
      }

      if (this.ball.pos.y <= 0.35 && this.ball.vel.y < 0) {
        this._executeServeHit(
          this.score.server === 'player' ? this.player : this.opponent,
          { speed: 1.12 }
        );
      }
      return;
    }

    if (this.phase === 'POINT_OVER') {
      if (this.phaseTimer > 1.85) {
        this._setupPointServe({ showBanner: true });
      }
      return;
    }

    if (this.phase === 'MATCH_OVER') {
      if ((this.spectatorMatchMode || this.autoPlayMode) && this.phaseTimer > 3.1) {
        this.rulesEngine.resetMatch({
          gamesToWin: this.matchConfig.gamesToWin,
          scoringMode: this.matchConfig.scoringSystem
        });
        this.score = this.rulesEngine.score;
        this.playerAI.resetMemory();
        this.opponentAI.resetMemory();
        this._syncScoreboardHUD();
        this._setupPointServe({
          showBanner: true,
          bannerText: 'Next AI vs AI Match',
          bannerStyle: 'style-start'
        });
      }
      return;
    }

    if (this.phase === 'RALLY' && this.ball.inPlay) {
      let pointEnded = false;

      BallPhysics.stepBallPhysics(this.ball, dt, this.tuningStore.params, this.tuningStore, {
        onCollision: (evt) => {
          if (pointEnded) return;
          const decision = this._handleCollisionEvent(evt, { checkRules: true });
          if (decision.rallyEnded) {
            pointEnded = true;
            // Check if the player failed to call a clear Let and let the ball bounce twice ("Not Up!")
            let extraDecisionMeta = null;
            if (
              decision.reason === 'NOT_UP' &&
              decision.winner === 'opponent' &&
              this.currentRallyPlayerInterference?.blocked
            ) {
              this.rulesEngine.uncalledLetWarnings.player =
                (this.rulesEngine.uncalledLetWarnings.player || 0) + 1;
              extraDecisionMeta = {
                uncalledLetWarning: true,
                bannerTitle: 'NOT UP! (UNCALLED LET WARNING)',
                safetyWarningText:
                  '⚠️ REFEREE REMINDER: You were obstructed by your opponent! Call "Let, please!" immediately (Press F / L, raise an open hand ✋, or hold phone upright) instead of letting the ball bounce twice.'
              };
            }
            this._awardPoint(decision.winner, decision.callout || decision.reason, extraDecisionMeta);
          }
        }
      });

      if (pointEnded) {
        StrokeMotion.reset(this.player);
        StrokeMotion.reset(this.opponent);
        return;
      }

      // Integrate the incoming ball and resolve wall/floor rules before contact.
      this._updateStrokeMotions(dt);

      // Check WSF Rule 9: Did the ball strike a player's body?
      const bodyCollision = this.rulesEngine.evaluateBallPlayerBodyCollision({
        ball: this.ball,
        playerState: this.player,
        opponentState: this.opponent
      });
      if (bodyCollision && bodyCollision.rallyEnded) {
        this.audioEngine?.playBodyImpactThud();
        const hitActor = bodyCollision.hitPlayerRole === 'player' ? this.player : this.opponent;
        this.facialFX?.setExpression(hitActor, 'shocked_loss', 1.5);
        this.hud?.showTimingPopup({
          grade: bodyCollision.bannerTitle || '⚠️ BALL HIT PLAYER! STOP PLAY!',
          detail: bodyCollision.safetyWarningText,
          durationMs: 3200
        });
        if (bodyCollision.replaysPoint) {
          this._replayLetRally(bodyCollision);
        } else {
          this._awardPoint(bodyCollision.winner, bodyCollision.reason, bodyCollision);
        }
        return;
      }

      // Live Interference Check for Player 1 when ball is rebounding from front wall
      if (this.ball.lastHitter === 'opponent' && this.ball.hitFrontWallThisShot) {
        const interf = this.rulesEngine.evaluateInterference({
          striker: 'player',
          ball: this.ball,
          playerState: this.player,
          opponentState: this.opponent
        });
        if (interf.blocked && interf.distToBall < 2.35) {
          this.currentRallyPlayerInterference = interf;
          this._updateLetAdvisoryUI(true);
        } else {
          this._updateLetAdvisoryUI(false);
        }
      } else {
        this._updateLetAdvisoryUI(false);
      }

      this.ballTrail.pushPoint(this.ball.pos);

      const keysDown = this.motionController?.keysDown;
      const hasMovementKeyNudge = Boolean(
        keysDown &&
          (keysDown.has('KeyW') ||
            keysDown.has('KeyA') ||
            keysDown.has('KeyS') ||
            keysDown.has('KeyD') ||
            keysDown.has('ArrowUp') ||
            keysDown.has('ArrowDown') ||
            keysDown.has('ArrowLeft') ||
            keysDown.has('ArrowRight'))
      );
      if (hasMovementKeyNudge) {
        this.lastHumanInputTime = this.elapsedTime;
      }

      if (aiControlsPlayer) {
        // Full Tactical AI control for Player 1 (both in Watch AI vs AI Spectator Mode and Title Menu Idling)
        // Accepts temporary shot nudges (1-5, Space, Click) & WASD/Arrow movement nudges without turning off AI!
        this.playerAI.updateAI({
          opponent: this.player,
          player: this.opponent,
          ball: this.ball,
          dt,
          params: this.tuningStore.params,
          predictedTrajectory: this.currentPredictedTrajectory,
          rulesEngine: this.rulesEngine,
          onCallAILet: (role) => this.requestLetAppeal(role, { source: 'ai_referee' }),
          onPlanAIShot: (plan) => {
            if (!this.spectatorShotNudge || this.elapsedTime > this.spectatorShotNudge.expiresAt) {
              this._showRedShotChoice(plan.shotType, `RED PLANS: VOLLEY ${plan.shotType === 'topspin' ? 'DRIVE' : plan.shotType.toUpperCase()}`);
            }
          },
          onExecuteAIShot: (choice) => {
            let finalChoice = choice;
            if (this.spectatorShotNudge && this.elapsedTime <= this.spectatorShotNudge.expiresAt) {
              finalChoice = {
                ...choice,
                ...this.spectatorShotNudge,
                aiErrorMode: null,
                aiExecution: false,
                aiWinnerMargin: false,
                isSpectatorNudge: true
              };
              this.spectatorShotNudge = null;
            }
            this._attemptPlayerRallyStrike(finalChoice, true);
          }
        });

        if (hasMovementKeyNudge) {
          let moveX = 0;
          let moveZ = 0;
          if (keysDown.has('KeyA') || keysDown.has('ArrowLeft')) moveX -= 1;
          if (keysDown.has('KeyD') || keysDown.has('ArrowRight')) moveX += 1;
          if (keysDown.has('KeyW') || keysDown.has('ArrowUp')) moveZ -= 1;
          if (keysDown.has('KeyS') || keysDown.has('ArrowDown')) moveZ += 1;
          this.player.targetPos.set(
            THREE.MathUtils.clamp(this.player.pos.x + moveX * 1.45, -2.8, 2.8),
            0,
            THREE.MathUtils.clamp(this.player.pos.z + moveZ * 1.45, -4.1, 4.45)
          );
        }

        PlayerMovement.stepActorLocomotion(
          this.player,
          this.opponent,
          dt,
          this.tuningStore.params,
          !hasMovementKeyNudge && this.ball.lastHitter === 'player'
        );
      } else {
        // Human control for Player 1
        const isHolding = Boolean(
          this.motionController &&
            (this.motionController.prepHoldStartMs > 0 || this.motionController.pointerDrag)
        );
        if (isHolding) {
          const st = this.shotController.updatePreparation('player', dt, this.tuningStore.params);
          this.player.manualPrepCharge = st.chargeNormalized;
          this.opponentAI.observePlayerPreparation(
            this.opponent,
            this.player,
            st,
            this.tuningStore.params
          );
        } else {
          this.player.manualPrepCharge = 0;
        }

        const interceptSample =
          this.currentPredictedTrajectory?.firstFloorBouncePos ||
          this.ball.pos;

        const poseLungeOffset =
          this.motionController?.webcamActive && this.motionController?.smoothedCentroid
            ? {
                active: Math.abs(this.motionController.smoothedCentroid.x - 0.5) > 0.14,
                x: (this.motionController.smoothedCentroid.x - 0.5) * 1.6,
                z: (this.motionController.smoothedCentroid.y - 0.5) * 1.2
              }
            : null;

        PlayerMovement.updatePlayerRallyTarget({
          player: this.player,
          opponent: this.opponent,
          ball: this.ball,
          keysDown: this.motionController?.keysDown,
          poseLungeOffset,
          params: this.tuningStore.params,
          interceptPoint: interceptSample,
          predictedTrajectory: this.currentPredictedTrajectory,
          requestedShot: this.pendingUserSwing ? {...this.pendingUserSwing.evt, maxWaitSec:Math.max(0,this.pendingUserSwing.expiresAt-this.elapsedTime)} : {}
        });

        const playerRecoveringToT = this.ball.lastHitter === 'player';
        PlayerMovement.stepActorLocomotion(
          this.player,
          this.opponent,
          dt,
          this.tuningStore.params,
          playerRecoveringToT
        );

        if (this._tryPendingPlayerRallyStrike()) return;
      }

      // Opponent AI or P2
      if (!this.isMultiplayer) {
        this.opponentAI.updateAI({
          opponent: this.opponent,
          player: this.player,
          ball: this.ball,
          dt,
          params: this.tuningStore.params,
          predictedTrajectory: this.currentPredictedTrajectory,
          rulesEngine: this.rulesEngine,
          onCallAILet: (role) => this.requestLetAppeal(role, { source: 'ai_referee' }),
          onExecuteAIShot: (choice) => {
            let finalChoice = choice;
            if (
              aiControlsPlayer &&
              this.spectatorShotNudge &&
              this.elapsedTime <= this.spectatorShotNudge.expiresAt
            ) {
              finalChoice = {
                ...choice,
                ...this.spectatorShotNudge,
                aiErrorMode: null,
                aiExecution: false,
                aiWinnerMargin: false,
                isSpectatorNudge: true
              };
              this.spectatorShotNudge = null;
            }
            this._executeOpponentSquashStrike(finalChoice);
          }
        });
        PlayerMovement.stepActorLocomotion(
          this.opponent,
          this.player,
          dt,
          this.tuningStore.params,
          this.ball.lastHitter === 'opponent'
        );
      } else {
        PlayerMovement.stepActorLocomotion(
          this.opponent,
          this.player,
          dt,
          this.tuningStore.params,
          this.ball.lastHitter === 'opponent'
        );
        if (this.pendingP2Swing && this.ball.lastHitter === 'player' && this.ball.hitFrontWallThisShot) {
          if (this.elapsedTime > this.pendingP2Swing.expiresAt) {
            this.pendingP2Swing = null;
          } else {
            const dist = Math.hypot(
              this.ball.pos.x - this.opponent.pos.x,
              this.ball.pos.z - this.opponent.pos.z
            );
            if (dist <= 2.8) {
              const evt = this.pendingP2Swing.evt;
              this.pendingP2Swing = null;
              this._attemptOpponentManualStrike(evt);
            }
          }
        }
      }
    }
  }

  _awardPoint(winnerRole, reason = '', decisionMeta = null) {
    if(this.pendingPointOutcome || this.pointPresentation?.active || this.phase==='MATCH_OVER') return;
    this.pointPresentation.begin(this.ball);
    this.phase = 'POINT_SETTLE';
    this.phaseTimer = 0;
    this.ball.inPlay = false;
    this.cheerEnergy = 1.0;
    this.pendingUserSwing = null;
    this.pendingP2Swing = null;
    this.pendingServeSwing = null;
    this.spectatorShotNudge = null;
    this.motionController?.keysDown?.clear();
    if(this.motionController){this.motionController.prepHoldStartMs=0;this.motionController.pointerDrag=null;}
    StrokeMotion.reset(this.player);
    StrokeMotion.reset(this.opponent);
    this._updateLetAdvisoryUI(false);
    this.currentRallyPlayerInterference = null;

    const playerWonPoint = winnerRole === 'player';
    if (this.bodyAnimator) {
      this.bodyAnimator.triggerPointReaction(this.player, playerWonPoint ? 'win' : 'loss');
      this.bodyAnimator.triggerPointReaction(this.opponent, playerWonPoint ? 'loss' : 'win');
    }
    if (this.facialFX) {
      this.facialFX.setExpression(this.player, playerWonPoint ? 'happy_grin' : 'shocked_loss', 1.8);
      this.facialFX.setExpression(this.opponent, playerWonPoint ? 'shocked_loss' : 'happy_grin', 1.8);
      this.facialFX.triggerEmoteBurst(playerWonPoint ? this.player : this.opponent, 'win');
    }

    this.audioEngine && this.audioEngine.playCrowdReaction(playerWonPoint ? 'cheer' : 'ooh');

    const outcome = this.rulesEngine.awardPoint(winnerRole);
    this.score = this.rulesEngine.score;
    this._syncScoreboardHUD();
    this.pendingPointOutcome={outcome,reason,decisionMeta};
    const callout=this.rulesEngine.formatRefereeCallout(outcome,reason,decisionMeta);
    this.hud.showCenterBanner(callout,{style:'style-score',subText:'Watch the finish • Any key or tap to skip',durationMs:1800});
    this.audioEngine?.announceScore(callout);
  }

  _finishPointPresentation() {
    const result=this.pendingPointOutcome;
    if(!result) return;
    this.pendingPointOutcome=null;
    this.pointPresentation.cancel();
    this.hud.setReplayMode(false);
    this.ballTrail.clear();
    this.motionController?.keysDown?.clear();
    this.phaseTimer=0;
    if(!result.outcome.matchWonBy) this._setupPointServe({showBanner:true});
    else this.phase='MATCH_OVER';
    if(result.outcome.gameWonBy||result.outcome.matchWonBy) this._showPointOutcome(result.outcome,result.reason,result.decisionMeta);
    if(this.camera) this._snapCameraImmediate();
  }

  _showPointOutcome(outcome,reason,decisionMeta) {

    // Build authentic WSF/PSA deep male referee callout ("Down! Handout, five-four.", etc.)
    const baseRefereeCallout = this.rulesEngine.formatRefereeCallout(outcome, reason, decisionMeta);
    const refereeCallout = decisionMeta?.safetyWarningText
      ? `${decisionMeta.refereeCallout || baseRefereeCallout} ${decisionMeta.safetyWarningText}`
      : decisionMeta?.refereeCallout
      ? `${decisionMeta.refereeCallout} ${baseRefereeCallout}`
      : baseRefereeCallout;

    if (outcome.matchWonBy) {
      const pWon = outcome.matchWonBy === 'player';
      this.phase = 'MATCH_OVER';
      this.phaseTimer = 0;
      const banner = this.spectatorMatchMode
        ? pWon
          ? 'PRO AI 1 WINS!'
          : 'PRO AI 2 WINS!'
        : this.isMultiplayer
          ? pWon
            ? 'P1 WINS!'
            : 'P2 WINS!'
          : pWon
            ? 'YOU WIN!'
            : 'MATCH OVER';
      const sub = `${baseRefereeCallout} • Final Games: ${this.score.playerGames} - ${this.score.opponentGames}`;
      this._recordBannerBroadcast(banner, 'style-gold', sub);
      this.hud.showCenterBanner(banner, { style: 'style-gold', subText: sub, durationMs: 2800 });
      if (this.audioEngine) {
        if (!this.spectatorMatchMode) {
          this.audioEngine.playMusicForState('victory');
        }
        this.audioEngine.announceScore(refereeCallout);
      }
      if (!this.spectatorMatchMode && !this.autoPlayMode) {
            this.hud.showVictoryModal({
              playerWon: this.playerRole === 'p2' ? !pWon : pWon,
              playerGames: this.score.playerGames,
              opponentGames: this.score.opponentGames
            });
      }
      return;
    }

    if (outcome.gameWonBy) {
      const sub = `${baseRefereeCallout} • Games: ${this.score.playerGames} - ${this.score.opponentGames}`;
      this._recordBannerBroadcast('Game!', 'style-gold', sub);
      this.hud.showCenterBanner('Game!', { style: 'style-gold', subText: sub, durationMs: 1650 });
      this.audioEngine && this.audioEngine.announceScore(refereeCallout);
      return;
    }

    const formatted = this.rulesEngine.formatScoreHUD();
    const isFault =
      Boolean(decisionMeta?.safetyWarningIssued || decisionMeta?.uncalledLetWarning) ||
      /Tin|Out|Down|Not Up|Short|NO_LET/i.test(reason);
    const style = isFault ? 'style-fault' : 'style-score';
    const bannerMain = decisionMeta?.bannerTitle || formatted.bannerScoreText;
    const subLabel =
      decisionMeta?.safetyWarningText ||
      decisionMeta?.explanation ||
      baseRefereeCallout ||
      reason;
    this._recordBannerBroadcast(bannerMain, style, subLabel);
    this.hud.showCenterBanner(bannerMain, {
      style,
      subText: subLabel,
      durationMs: decisionMeta?.safetyWarningText ? 3100 : 1650
    });
    if (this.audioEngine && (!this.autoPlayMode || this.userHasInteracted)) {
      this.audioEngine.announceScore(refereeCallout, { delayMs: 80 });
    }
  }

  _recordBannerBroadcast(text, style = 'style-score', subText = '') {
    this.bannerSeq += 1;
    this.lastBannerBroadcast = { seq: this.bannerSeq, text, style, subText };
  }

  _broadcastMultiplayerSnapshot() {
    const serActor = (a) => ({
      px: Number(a.pos.x.toFixed(3)),
      pz: Number(a.pos.z.toFixed(3)),
      tx: Number(a.targetPos.x.toFixed(3)),
      tz: Number(a.targetPos.z.toFixed(3)),
      st: a.swingType,
      sw: Number(a.swingTimer.toFixed(3)),
      av: Number(a.arcVisibleTimer.toFixed(3))
    });
    const snapshot = {
      phase: this.phase,
      phaseTimer: Number(this.phaseTimer.toFixed(3)),
      cameraMode: this.cameraMode,
      score: { ...this.score },
      ball: {
        px: Number(this.ball.pos.x.toFixed(3)),
        py: Number(this.ball.pos.y.toFixed(3)),
        pz: Number(this.ball.pos.z.toFixed(3)),
        vx: Number(this.ball.vel.x.toFixed(3)),
        vy: Number(this.ball.vel.y.toFixed(3)),
        vz: Number(this.ball.vel.z.toFixed(3)),
        inPlay: this.ball.inPlay,
        lastHitter: this.ball.lastHitter,
        shotType: this.ball.shotType,
        isPowerShot: this.ball.isPowerShot,
        rallyStrokeCount: this.ball.rallyStrokeCount
      },
      actors: {
        player: serActor(this.player),
        opponent: serActor(this.opponent)
      },
      banner: this.lastBannerBroadcast
    };
    fetch('/api/match/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room: this.roomId, snapshot })
    }).catch(() => {});
  }

  _handleRoomStateUpdate(state = {}) {
    if (!state) return;
    this.roomStatus = {
      roomId: state.roomId || this.roomId,
      hostName: state.hostName || this.roomStatus.hostName || 'Player 1',
      guestName: state.guestName || this.roomStatus.guestName || 'Player 2',
      p1Online: Boolean(state.p1Online),
      p2Online: Boolean(state.p2Online),
      p1Phone: Boolean(state.p1?.connected),
      p2Phone: Boolean(state.p2?.connected),
      isMultiplayer: Boolean(this.isMultiplayer || (this.roomId && this.roomId !== 'default')),
      inRally: this.phase === 'RALLY',
      tunnelUrl: state.tunnelUrl || this.roomStatus.tunnelUrl || '',
      urls: state.urls || this.roomStatus.urls || null
    };
    this.hud && this.hud.updateMultiplayerRoomInfo(this.roomStatus);
  }

  _syncScoreboardHUD() {
    const formatted = this.rulesEngine.formatScoreHUD();
    this.hud.updateScoreboard({
      playerScoreText: formatted.playerScoreText,
      opponentScoreText: formatted.opponentScoreText,
      deuceLabel: formatted.deuceLabel,
      playerGames: this.score.playerGames,
      opponentGames: this.score.opponentGames,
      gamesToWin: this.matchConfig.gamesToWin
    });
  }

  _updateMiiAnimation(actor, dt) {
    if(this.phase==='POINT_REPLAY') return;
    if (!actor.model) return;
    if (actor.swingTimer > 0) actor.swingTimer = Math.max(0, actor.swingTimer - dt);
    if (actor.arcVisibleTimer > 0) actor.arcVisibleTimer = Math.max(0, actor.arcVisibleTimer - dt);
    if (actor.swingArcMesh) actor.swingArcMesh.visible = false;

    if (this.racketKinematics) {
      const motion = actor.strokeMotion;
      const k = actor.racketKinematics;
      if (motion?.phase === 'swing' && k) {
        const effectiveDt = THREE.MathUtils.clamp(Number(dt || 1 / 60), 0.0005, 0.05);
        k.swingElapsed = motion.progress * motion.racketDurationSec - effectiveDt;
        k.swingDuration = motion.racketDurationSec;
        k.swingActive = true;
        actor.swingDuration = motion.racketDurationSec;
        actor.swingTimer = (1 - motion.progress) * motion.racketDurationSec;
      }
      this.racketKinematics.update(actor, dt, {
        phase: this.phase === 'WONDER_INTRO' ? 'RALLY' : this.phase,
        score: this.score,
        ball: this.ball,
        elapsedTime: this.elapsedTime,
        motionController: this.motionController
      });
    }

    if (this.bodyAnimator) {
      this.bodyAnimator.updateMiiBodyAnimation(actor, dt, this);
    } else {
      actor.root.position.set(actor.pos.x, actor.pos.y, actor.pos.z);
    }

    if (!StrokeMotion.applyPose(actor, this.ball)) {
      actor.root.rotation.set(0, StrokeMotion.readyYaw(actor, this.ball), 0);
    }

    updateCharacterContactShadow(actor, actor.rig?.verticalHopOffset || 0);
    this.facialFX &&
      this.facialFX.update(actor, dt, {
        phase: this.phase,
        ball: this.ball,
        score: this.score,
        rallyCount: this.ball.rallyStrokeCount,
        camera: this.camera
      });
  }

  _updateCrowdAnimation(dt) {
    this.cheerEnergy = Math.max(0.22, this.cheerEnergy - dt * 0.35);
    if (this.crowdScene) {
      const freq = 5.5 + this.cheerEnergy * 4.5;
      const amp = 0.025 + this.cheerEnergy * 0.055;
      this.crowdScene.position.y = -0.15 + Math.abs(Math.sin(this.elapsedTime * freq)) * amp;
    }
  }

  _spawnBounceRing(x, z) {
    const item = this.bounceRings.find((r) => !r.active) || this.bounceRings[0];
    item.active = true;
    item.age = 0;
    item.mesh.position.set(x, 0.02, z);
    item.mesh.scale.setScalar(0.6);
    item.mesh.material.opacity = 0.9;
    item.mesh.visible = true;
  }

  _spawnStarBurst(pos, count = 8) {
    let spawned = 0;
    for (let i = 0; i < this.starParticles.length && spawned < count; i++) {
      const p = this.starParticles[i];
      if (!p.active) {
        p.active = true;
        p.age = 0;
        p.maxAge = 0.32 + Math.random() * 0.22;
        p.mesh.position.copy(pos);
        p.vel.set(
          (Math.random() - 0.5) * 3.8,
          (Math.random() - 0.2) * 3.4,
          (Math.random() - 0.5) * 3.8
        );
        p.mesh.scale.setScalar(0.9 + Math.random() * 0.5);
        p.mesh.material.opacity = 1;
        p.mesh.visible = true;
        spawned++;
      }
    }
  }

  _updateEffects(dt) {
    if (this.ball.mesh) {
      this.ball.mesh.position.copy(this.ball.pos);
    }
    if (this.ballShadowBlob) {
      this.ballShadowBlob.position.x = this.ball.pos.x;
      this.ballShadowBlob.position.z = this.ball.pos.z;
      const s = THREE.MathUtils.clamp(1.1 - this.ball.pos.y * 0.16, 0.42, 1.1);
      this.ballShadowBlob.scale.setScalar(s);
      this.ballShadowBlob.material.opacity = THREE.MathUtils.clamp(0.88 - this.ball.pos.y * 0.15, 0.25, 0.88);
    }

    for (const r of this.bounceRings) {
      if (!r.active) continue;
      r.age += dt;
      const u = r.age / 0.45;
      if (u >= 1) {
        r.active = false;
        r.mesh.visible = false;
      } else {
        r.mesh.scale.setScalar(0.6 + u * 2.2);
        r.mesh.material.opacity = (1 - u) * 0.85;
      }
    }

    for (const p of this.starParticles) {
      if (!p.active) continue;
      p.age += dt;
      const u = p.age / p.maxAge;
      if (u >= 1) {
        p.active = false;
        p.mesh.visible = false;
      } else {
        p.mesh.position.addScaledVector(p.vel, dt);
        p.mesh.rotation.y += dt * 9;
        p.mesh.rotation.z += dt * 7;
        p.mesh.scale.setScalar((1 - u * 0.65) * 1.1);
        p.mesh.material.opacity = 1 - u;
      }
    }

    this.ballTrail.updateGeometry(this.camera);
  }

  _computeTargetCameraPose() {
    const replayPose = this.phase === 'POINT_REPLAY' ? this.pointPresentation.cameraPose() : null;
    document.getElementById('point-replay-toast')?.classList.toggle('hidden', !replayPose);
    const mode = this.manualCameraOverride || this.cameraMode;
    const targetPos = new THREE.Vector3();
    const targetLook = new THREE.Vector3();

    // TASK-16 / Gate I: front-wall viewpoint keeps the front wall transparent
    // so it doesn't occlude the back court; restore on exit.
    const frontCamActive = replayPose
      ? replayPose.targetPos.z < COURT_SPECS.FRONT_WALL_Z
      : mode === 'FRONT_WALL_CAM';
    if (frontCamActive !== this._frontWallTransparent) {
      this._frontWallTransparent = frontCamActive;
      this.courtGeometry?.setFrontWallTransparency(frontCamActive);
    }
    if (replayPose) return replayPose;

    if (mode === 'INTRO_PAN') {
      targetPos.set(0, 11.4, 2.2);
      targetLook.set(0, 0, -0.65);
    } else if (mode === 'SHOWCASE_CAM') {
      targetPos.set(0.85, 1.75, 4.4);
      targetLook.set(0.45, 1.05, -1.2);
    } else if (mode === 'SERVE_CAM') {
      targetPos.set(this.player.pos.x * 0.22, 5.45, 10.25);
      targetLook.set(this.ball.pos.x * 0.18, 0.95, -1.45);
    } else if (mode === 'CORNER_NICK_CAM' || mode === 'REPLAY_CAM') {
      const sideX = this.ball.pos.x >= 0 ? -1.45 : 1.45;
      targetPos.set(sideX, 1.05, -1.15);
      targetLook.set(this.ball.pos.x * 0.75, 0.32, -4.35);
    } else if (mode === 'FRONT_WALL_CAM') {
      // PSA broadcast-style cam embedded INSIDE the front-wall glass
      // (slab spans z -4.875..-5.015, wall transparent for this mode), at low
      // waist height. Slides along the wall tracking the ball so a corner
      // lunge reads face-on; still frames the whole court floor→back glass.
      const bx = Math.max(-2.6, Math.min(2.6, this.ball.pos.x));
      const by = Math.max(0.35, Math.min(1.8, this.ball.pos.y));
      targetPos.set(bx * 0.6, 1.35, -4.94);
      targetLook.set(bx, by, this.ball.pos.z * 0.6 + 1.9);
    } else {
      targetPos.set(this.player.pos.x * 0.24, 3.22, 9.38);
      targetLook.set(this.ball.pos.x * 0.2, 1.12, -1.65);
    }

    // When the main menu is docked on the left side, gently frame the camera slightly left
    // so the 3D Glass Show-Court projects into the open center-right viewport area!
    if (this._isSideMenuExpanded() && window.innerWidth > 900 && mode !== 'INTRO_PAN') {
      targetPos.x -= 0.52;
      targetLook.x -= 0.92;
    }
    return ['RALLY_CAM','SERVE_CAM'].includes(mode)
      ? fitCourtCamera({targetPos,targetLook,aspect:this.camera.aspect,fov:this.camera.fov})
      : { targetPos, targetLook };
  }

  _snapCameraImmediate() {
    const { targetPos, targetLook } = this._computeTargetCameraPose();
    this.cameraPosSmooth.copy(targetPos);
    this.cameraLookSmooth.copy(targetLook);
    this.camera.position.copy(targetPos);
    this.camera.lookAt(targetLook);
    this.camera.updateMatrixWorld();
    this.ballTrail.updateGeometry(this.camera);
    this._updateProjectedHUD();
  }

  _updateCameraRig(dt) {
    const { targetPos, targetLook } = this._computeTargetCameraPose();
    const blend = 1 - Math.exp(-6.5 * dt);
    this.cameraPosSmooth.lerp(targetPos, blend);
    this.cameraLookSmooth.lerp(targetLook, blend);
    const mode=this.manualCameraOverride||this.cameraMode;
    if(this.phase!=='POINT_REPLAY'&&['RALLY_CAM','SERVE_CAM'].includes(mode)) {
      const fitted=fitCourtCamera({targetPos:this.cameraPosSmooth,targetLook:this.cameraLookSmooth,aspect:this.camera.aspect,fov:this.camera.fov});
      this.cameraPosSmooth.copy(fitted.targetPos);
    }
    this.camera.position.copy(this.cameraPosSmooth);

    if (this.cameraTrauma > 0.001) {
      const shake = this.cameraTrauma * this.cameraTrauma * 0.22;
      this.camera.position.x += (Math.random() - 0.5) * shake;
      this.camera.position.y += (Math.random() - 0.5) * shake;
    }
    this.camera.lookAt(this.cameraLookSmooth);
  }

  _projectToScreen(worldPos) {
    const p = worldPos.clone().project(this.camera);
    const visible = p.z >= -1 && p.z <= 1;
    const x = (p.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-p.y * 0.5 + 0.5) * window.innerHeight;
    return { x, y, visible };
  }

  _updateProjectedHUD() {
    if ((this.phase === 'SERVE_STANCE' || this.phase === 'SERVE_TOSS') && this.cameraMode !== 'CORNER_NICK_CAM') {
      const srvActor = this.score.server === 'player' ? this.player : this.opponent;
      const headPos = srvActor.pos.clone().add(new THREE.Vector3(0, 2.05, 0));
      const screen = this._projectToScreen(headPos);
      const boxCode = this.score.serviceSide === 'left' ? 'Server (L)' : 'Server (R)';
      this.hud.updateServerTag(screen, true, boxCode);
    } else {
      this.hud.updateServerTag(null, false);
    }
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this._snapCameraImmediate();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}

export const ArgonSquashEngine = ArgonTennisEngine;

window.addEventListener('DOMContentLoaded', () => {
  const engine = new ArgonSquashEngine();
  window.__argonTennis = engine;
  window.__argonSquash = engine;
  window.__argonSquashTests = TestHarness;
  engine.loadAssetsAndStart();
});
