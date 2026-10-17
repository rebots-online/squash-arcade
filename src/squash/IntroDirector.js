// ============================================================================
// ARGON SQUASH — SKILLS DEMONSTRATION ONBOARDING (IntroDirector)
// Implements Section 2 & 3 / TASK-20:
//   - An enumerated eight-skill demonstration walkthrough. Every shot is named
//     for the squash skill it teaches (`SKILL n/8 — <NAME>`) and resolves
//     through the live BallPhysics & NickCollisionModel solvers.
//   - The final skill (NICK FINISH) retains the optional slow-motion corner
//     replay so players can inspect the exact ball-wall-floor physics.
// ============================================================================

import * as THREE from 'three';
import { NickCollisionModel } from './NickCollisionModel.js';
import { COURT_SPECS } from './CourtGeometry.js';

// Enumerated skills curriculum — Serve through Nick finish.
const SKILLS = [
  {
    scenarioId: 'skills_serve',
    name: 'SERVE',
    tip: 'Every rally opens with a lobbed serve arcing off the front wall into the opposite service quarter.',
    playerPos: [-1.45, 0, 1.9],
    trailStyle: 'DRIVE',
    swing: { type: 'forehand', side: 'forehand', shotType: 'topspin', speed: 1.0, timing: 'sweet', dur: 0.34 },
    hitSound: 'topspin',
    face: 'focused_squint'
  },
  {
    scenarioId: 'tight_rail',
    name: 'STRAIGHT DRIVE',
    tip: 'Length hugging the side wall — a tight rail dies deep behind the service boxes.',
    playerPos: [0.3, 0, 2.3],
    trailStyle: 'DRIVE',
    swing: { type: 'forehand', side: 'forehand', shotType: 'topspin', speed: 1.15, timing: 'sweet', dur: 0.32 },
    hitSound: 'topspin',
    face: 'focused_squint'
  },
  {
    scenarioId: 'skills_crosscourt_drive',
    name: 'CROSS-COURT DRIVE',
    tip: 'A diagonal drive runs the full width of the court to pin the far corner.',
    playerPos: [0.2, 0, 2.3],
    trailStyle: 'DRIVE',
    swing: { type: 'forehand', side: 'forehand', shotType: 'topspin', speed: 1.15, timing: 'sweet', dur: 0.32 },
    hitSound: 'topspin',
    face: 'focused_squint'
  },
  {
    scenarioId: 'demo_b_soft_drop',
    name: 'DROP / CUT DROP',
    tip: 'An open racket face kills pace — the ball floats up short off the front wall and dies.',
    playerPos: [-1.65, 0, 3.1],
    trailStyle: 'SLICE',
    swing: { type: 'forehand', side: 'forehand', shotType: 'slice', speed: 0.88, timing: 'sweet', dur: 0.38 },
    hitSound: 'slice',
    face: 'happy_grin'
  },
  {
    scenarioId: 'two_wall_boast',
    name: 'BOAST',
    tip: 'Strike the side wall first — the ball deflects across the front wall into the far corner.',
    playerPos: [-0.4, 0, 2.5],
    trailStyle: 'SLICE',
    swing: { type: 'forehand', side: 'forehand', shotType: 'slice', speed: 1.05, timing: 'sweet', dur: 0.34 },
    hitSound: 'slice',
    face: 'focused_squint'
  },
  {
    scenarioId: 'skills_lob',
    name: 'LOB',
    tip: 'A high arc over the opponent buys recovery time and wins back the T under pressure.',
    playerPos: [0.55, 0, -0.3],
    trailStyle: 'SLICE',
    swing: { type: 'forehand', side: 'forehand', shotType: 'slice', speed: 0.9, timing: 'sweet', dur: 0.36 },
    hitSound: 'slice',
    face: 'focused_squint'
  },
  {
    scenarioId: 'demo_a_kill',
    name: 'VOLLEY',
    tip: 'Cut the ball off mid-flight — a clean volley kill ends the rally before the bounce.',
    playerPos: [1.45, 0, 2.35],
    trailStyle: 'KILL',
    swing: { type: 'smash', side: 'forehand', shotType: 'smash', speed: 1.42, timing: 'sweet', dur: 0.3 },
    hitSound: 'smash',
    face: 'effort_shout'
  },
  {
    scenarioId: 'skills_nick_finish',
    name: 'NICK FINISH',
    tip: 'A ball rolling into the front-corner side-wall/floor nick junction is unreturnable.',
    playerPos: [-1.5, 0, 2.6],
    trailStyle: 'KILL',
    swing: { type: 'forehand', side: 'forehand', shotType: 'topspin', speed: 1.3, timing: 'sweet', dur: 0.3 },
    hitSound: 'topspin',
    face: 'effort_shout'
  }
];

const FEED_MS = 2.0;   // hold on the labeled setup before the strike
const STRIKE_MS = 1.7; // watch the ball fly before advancing
const CAPSTONE_MS = 3.4;

export class IntroDirector {
  constructor(engine) {
    this.engine = engine;
    this.active = false;
    this.step = 'IDLE';
    this.stepTimer = 0;
    this.skillIndex = 0;
    this.slowMoReplayActive = false;
    this.recordedFrames = [];
    this.replayCursor = 0;
    this.currentScenarioId = 'skills_serve';
  }

  /**
   * Starts the eight-part Skills Demonstration (or jumps straight to a step).
   */
  startIntro(startAt = 'SKILL_1_FEED') {
    this.active = true;
    this.slowMoReplayActive = false;
    this.recordedFrames = [];
    this.replayCursor = 0;
    this.engine.phase = 'WONDER_INTRO';
    this.engine.hud?.hideTitleModal();
    this._enterStep(startAt);
  }

  skipToPlayableMatch() {
    this.active = false;
    this.slowMoReplayActive = false;
    this.engine.hud?.hideIntroOverlay?.();
    this.engine.startNewMatch({ showStartBanner: true });
  }

  triggerSlowMoReplay() {
    if (this.recordedFrames.length < 5) return;
    this.slowMoReplayActive = true;
    this.replayCursor = 0;
    this.engine.cameraMode = 'CORNER_NICK_CAM';
    this.engine.hud?.showCenterBanner('SLOW-MO NICK INSPECTION', {
      style: 'style-start',
      subText: 'Watch the ball roll out of the front-corner side-wall / floor nick',
      durationMs: 2800
    });
  }

  _enterStep(stepName) {
    this.step = stepName;
    this.stepTimer = 0;
    const { player, opponent, ball, hud, racketKinematics, facialFX, audioEngine } = this.engine;

    if (stepName === 'SKILL_CAPSTONE') {
      facialFX?.setExpression(player, 'happy_grin', 2.6);
      hud?.showCenterBanner('SKILLS DEMONSTRATION COMPLETE', {
        style: 'style-gold',
        subText: 'Eight shots, one lesson: placement, disguise and geometry beat raw power.',
        durationMs: 3600
      });
      hud?.updateIntroOverlay?.({
        visible: true,
        stepTitle: 'SKILLS DEMONSTRATION — COMPLETE',
        commentary: 'Serve, drives, drop, boast, lob, volley and the nick finish — all eight skills resolve through the same live physics. Replay the nick finish in slow motion, or start rallying yourself.',
        canReplay: true,
        nextStepAction: 'START_MATCH',
        nextLabel: 'Try It Yourself — Start Rallying! 🎾'
      });
      return;
    }

    const m = stepName.match(/^SKILL_(\d+)_(FEED|STRIKE)$/);
    if (!m) return;
    const skillIndex = Number(m[1]) - 1;
    const phase = m[2];
    const skill = SKILLS[skillIndex];
    if (!skill) {
      this.skipToPlayableMatch();
      return;
    }
    this.skillIndex = skillIndex;
    this.currentScenarioId = skill.scenarioId;
    const n = skillIndex + 1;

    const scenario = NickCollisionModel.getNickLabScenario(skill.scenarioId);

    if (phase === 'FEED') {
      this.recordedFrames = [];
      this.engine.cameraMode = 'RALLY_CAM';

      // Striker holds near the launch point; receiver takes a reacting stance.
      opponent.pos.set(scenario.pos.x * 0.8, 0, scenario.pos.z + 0.55);
      opponent.targetPos.copy(opponent.pos);
      player.pos.set(skill.playerPos[0], skill.playerPos[1], skill.playerPos[2]);
      player.targetPos.set(0.15, 0, 1.4);

      ball.pos.copy(scenario.pos);
      ball.vel.set(0, 0.35, -0.4);
      ball.spin.set(0, 0, 0);
      ball.inPlay = false;

      if (racketKinematics) {
        racketKinematics.initActor(opponent);
        opponent.racketKinematics.anticipationCharge = 1.0;
        opponent.racketKinematics.anticipationSide = skill.swing.side;
      }
      facialFX?.setExpression(opponent, skill.face, 1.4);

      hud?.showCenterBanner(`SKILL ${n}/8 — ${skill.name}`, {
        style: 'style-start',
        subText: skill.tip,
        durationMs: 2300
      });
      hud?.updateIntroOverlay?.({
        visible: true,
        stepTitle: `SKILL ${n}/8 — ${skill.name}`,
        commentary: skill.tip,
        canReplay: false,
        nextStepAction: 'START_MATCH',
        nextLabel: 'Skip to Match ▸'
      });
      return;
    }

    // STRIKE — launch the scenario vector through live BallPhysics.
    ball.pos.copy(scenario.pos);
    ball.vel.copy(scenario.vel);
    ball.spin.copy(scenario.spin);
    this.engine.rulesEngine.onStrokeHit(ball, 'opponent', {
      isServe: skill.scenarioId === 'skills_serve',
      shotType: scenario.shotType,
      isDisguised: skill.scenarioId === 'demo_b_soft_drop'
    });
    this.engine.ballTrail.clear();
    this.engine.ballTrail.setStyle(skill.trailStyle, skill.trailStyle === 'KILL');
    this.engine.ballTrail.pushPoint(ball.pos);

    opponent.swingType = skill.swing.type;
    opponent.swingDuration = skill.swing.dur;
    opponent.swingTimer = skill.swing.dur;
    racketKinematics?.triggerSwing(opponent, {
      shotType: skill.swing.shotType,
      side: skill.swing.side,
      speed: skill.swing.speed,
      timing: skill.swing.timing
    });
    facialFX?.setExpression(opponent, skill.face, 1.2);
    audioEngine?.playSwingWhoosh(skill.swing.speed);
    audioEngine?.playRacketHit(skill.hitSound, 'perfect');

    // Receiver reacts toward the incoming ball.
    player.targetPos.set(scenario.pos.x * 0.4, 0, Math.max(-2.2, scenario.pos.z - 1.2));
  }

  update(dt) {
    if (!this.active) return;
    this.stepTimer += dt;
    const { ball, player, opponent, hud, facialFX } = this.engine;

    if (this.slowMoReplayActive) {
      this.replayCursor += dt * 32; // 0.27x slow-motion playback of 120Hz frames
      const idx = Math.min(this.recordedFrames.length - 1, Math.floor(this.replayCursor));
      const frame = this.recordedFrames[idx];
      if (frame) {
        ball.pos.copy(frame.ballPos);
        ball.vel.copy(frame.ballVel);
        this.engine.ballTrail.pushPoint(ball.pos);
      }
      if (idx >= this.recordedFrames.length - 1 && this.stepTimer > 3.2) {
        this.slowMoReplayActive = false;
        this.engine.cameraMode = 'RALLY_CAM';
      }
      return;
    }

    if (this.step.endsWith('_FEED') && this.stepTimer >= FEED_MS) {
      this._enterStep(`SKILL_${this.skillIndex + 1}_STRIKE`);
      return;
    }

    if (this.step.endsWith('_STRIKE')) {
      const isCapstone = this.skillIndex === SKILLS.length - 1;
      if (isCapstone) {
        this.recordedFrames.push({
          ballPos: ball.pos.clone(),
          ballVel: ball.vel.clone()
        });
      }
      if (ball.lastBounceWasNick || this.stepTimer >= (isCapstone ? CAPSTONE_MS : STRIKE_MS)) {
        if (isCapstone) {
          this._enterStep('SKILL_CAPSTONE');
        } else {
          this._enterStep(`SKILL_${this.skillIndex + 2}_FEED`);
        }
      }
    }
  }
}

export default IntroDirector;
