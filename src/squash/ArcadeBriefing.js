import { createArcadeSchematic } from './ArcadeSchematic.js';
import { RELAY_ENABLED } from '../motion_controls.js';

const CHAPTERS = [
  {
    id: 'placement', kicker: 'PHYSICAL CHESS · A QUICK COURTSIDE BRIEFING', title: 'Make space. Then take it.',
    copy: 'Learn to see the court like a squash player.',
    steps: ['Keep rails tight to the wall.', 'Send drives and lobs deep, beyond the service box.', 'Volley when the opening is there. Move your opponent before you attack.'],
    speech: 'Squash is physical chess. Keep rails tight to the wall. Send drives and lobs deep, beyond the service box. Volley when the opening is there. Move your opponent before you attack. Watch the red player, then try the shots yourself.',
    minSeconds: 13
  },
  {
    id: 'phone', kicker: '02 / THREE WAYS TO PLAY · WII-STYLE', title: 'Your phone. Your racket.',
    copy: 'The same red player. A swing you can feel.',
    steps: ['Pair your phone with the court screen and allow motion sensors.', 'Fold if you have a foldable. Hold securely, with room to swing.', 'Swing your racket arm; change the face for a drive or cut. Ordinary phones work too.'],
    speech: 'Play with your phone as a Wii-style racket. Pair it with the court screen and allow motion sensors. Fold it if you have a foldable. Hold securely with room to swing. Your arm movement and racket face shape the on-screen stroke. Ordinary phones work too.',
    minSeconds: 17
  },
  {
    id: 'camera', kicker: '03 / THREE WAYS TO PLAY · KINECT-STYLE', title: 'Step back. Step into play.',
    copy: 'Your camera sees the movement. Red makes the shot.',
    steps: ['Enable the camera on your court screen.', 'Step back into view, with your arms and body visible.', 'Lunge and swing your racket arm. Use front or back camera for your screen setup.'],
    speech: 'For Kinect-style play, enable the camera on your court screen. Step back with your arms and body in view. Lunge and swing your racket arm. The red player follows your movement. Choose the front or back camera for your screen setup.',
    minSeconds: 16
  }
];

export class ArcadeBriefing {
  constructor(engine) {
    this.engine = engine;
    this.active = false;
    this.idleSeconds = 0;
    this.hasPresented = false;
    this.sequence = 0;
    this.root = document.createElement('div');
    this.root.className = 'arcade-briefing hidden';
    this.root.id = 'arcade-briefing';
    this.root.innerHTML = `<section class="briefing-card" role="dialog" aria-modal="true" aria-labelledby="briefing-title">
      <header class="briefing-header"><div><div class="briefing-kicker"></div><h2 class="briefing-title" id="briefing-title"></h2></div><button type="button" class="briefing-close" aria-label="Close briefing">✕</button></header>
      <div class="briefing-diagram"></div><p class="briefing-copy"></p><ol class="briefing-steps"></ol>
      <p class="briefing-status" role="status"></p>
      <footer class="briefing-footer"><div class="briefing-progress"></div><div class="briefing-nav">
      <button type="button" class="briefing-button" data-action="back">← Back</button>
      <button type="button" class="briefing-button" data-action="next">Next →</button>
      <button type="button" class="briefing-button primary" data-action="start">Play</button>
      <button type="button" class="briefing-button" data-action="keyboard">Keyboard / mouse</button></div></footer></section>`;
    const sound = document.createElement('button');
    sound.type = 'button'; sound.className = 'briefing-button'; sound.dataset.action = 'sound';
    this.root.querySelector('.briefing-nav').append(sound);
    document.body.append(this.root);
    this.root.addEventListener('click', e => {
      e.stopPropagation();
      if (e.target.closest('.briefing-close')) this.close();
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action === 'back') this.showChapter(Math.max(0, this.index - 1));
      if (action === 'next') this.index < 2 ? this.showChapter(this.index + 1) : this.close();
      if (action === 'start') this.startSelected();
      if (action === 'keyboard') this.startMatch('mouse');
      if (action === 'sound') {
        const audio = this.engine.audioEngine;
        audio?.unlock();
        const muted = audio?.toggleMute();
        if (!muted) this.showChapter(this.index);
        else this.updateSoundLabel();
      }
    });
    for (const event of ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'keyup']) {
      this.root.addEventListener(event, e => e.stopPropagation());
    }
    this.root.addEventListener('keydown', e => {
      e.stopPropagation();
      if (e.key === 'Escape') { e.preventDefault(); this.close(); }
      if (e.key === 'Tab') {
        const buttons = [...this.root.querySelectorAll('button:not(:disabled)')].filter(b => !b.hidden);
        const current = buttons.indexOf(document.activeElement);
        const next = (current + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length;
        e.preventDefault(); buttons[next]?.focus();
      }
    });
    document.addEventListener('visibilitychange', () => {
      if (!this.active || !window.speechSynthesis) return;
      if (document.hidden) window.speechSynthesis.pause();
      else window.speechSynthesis.resume();
    });
  }

  canAutoPresent() {
    const e = this.engine;
    return (e.spectatorMatchMode || e.autoPlayMode) && !e.introDirector?.active &&
      !e.isPausedForModal && !e._isSideMenuExpanded() && !e.phonePairingOpen &&
      !document.querySelector('.wii-modal-backdrop:not(.hidden):not(.menu-collapsed):not(#title-modal)') &&
      !document.hidden;
  }

  update(dt) {
    if (document.hidden) return;
    if (!this.active) {
      if (this.canAutoPresent()) this.idleSeconds += Math.min(dt, 0.1);
      if (this.idleSeconds >= (this.hasPresented ? 95 : 18)) this.open('placement');
      return;
    }
    this.elapsed += Math.min(dt, 0.1);
    const chapter = CHAPTERS[this.index];
    if (!this.manual && this.elapsed >= chapter.minSeconds && this.speechDone) {
      if (this.index < 2) this.showChapter(this.index + 1);
      else this.close();
    }
  }

  open(mode = 'placement', { manual = false } = {}) {
    if (!this.active) this.restoreFocus = document.activeElement;
    this.manual = manual;
    this.active = true;
    this.hasPresented = true;
    this.idleSeconds = 0;
    this.engine._setSetupMenuCollapsed(true);
    this.engine.motionController?.keysDown?.clear();
    if (this.engine.motionController) this.engine.motionController.pointerDrag = null;
    this.root.classList.remove('hidden');
    document.body.classList.add('briefing-active');
    this.inertNodes = [...document.body.children].filter(n => n !== this.root && n.tagName !== 'SCRIPT' && !n.inert);
    this.inertNodes.forEach(n => { n.inert = true; });
    this.showChapter(Math.max(0, CHAPTERS.findIndex(c => c.id === mode)));
  }

  showChapter(index) {
    this.index = index;
    this.elapsed = 0;
    this.speechDone = false;
    const token = ++this.sequence;
    const c = CHAPTERS[index];
    this.root.dataset.chapter = c.id;
    this.root.querySelector('.briefing-kicker').textContent = c.kicker;
    this.root.querySelector('.briefing-title').textContent = c.title;
    this.root.querySelector('.briefing-diagram').innerHTML = createArcadeSchematic(c.id);
    this.root.querySelector('.briefing-copy').textContent = c.copy;
    this.root.querySelector('.briefing-steps').innerHTML = c.steps.map(s => `<li class="briefing-step">${s}</li>`).join('');
    this.root.querySelector('.briefing-progress').textContent = `${index + 1} / 3 · ${this.manual ? 'HOW TO PLAY' : 'LIVE AI SHOWCASE'}`;
    this.root.querySelector('[data-action=back]').disabled = index === 0;
    this.root.querySelector('[data-action=next]').textContent = index === 2 ? 'Back to court' : 'Next →';
    const start = this.root.querySelector('[data-action=start]');
    start.disabled = false;
    start.textContent = c.id === 'phone' ? 'Pair phone' : c.id === 'camera' ? 'Start camera' : 'Play with keys / mouse';
    this.root.querySelector('[data-action=keyboard]').hidden = c.id === 'placement';
    const status = this.root.querySelector('.briefing-status');
    status.textContent = '';
    if (c.id === 'phone' && !RELAY_ENABLED) {
      start.disabled = true;
      status.textContent = 'Phone pairing needs a relay-enabled court. This static web host supports keyboard / mouse and camera play.';
    }
    this.root.querySelector('.briefing-card').scrollTop = 0;
    this.updateSoundLabel();
    this.root.querySelector('.briefing-close').focus({ preventScroll: true });
    const done = () => { if (this.active && this.sequence === token) this.speechDone = true; };
    if (this.engine.audioEngine?.beginBriefingNarration) this.engine.audioEngine.beginBriefingNarration(c.speech, done);
    else done();
  }

  async startSelected() {
    const mode = CHAPTERS[this.index].id;
    if (mode === 'placement') return this.startMatch('mouse');
    if (mode === 'phone') {
      if (!RELAY_ENABLED) return;
      this.close();
      this.engine.hud.selectedInputMode = 'phone';
      this.engine.matchConfig.inputMode = 'phone';
      this.engine.hud.openMultiplayerModal();
      return;
    }
    const token = this.sequence;
    const button = this.root.querySelector('[data-action=start]');
    button.disabled = true;
    this.root.querySelector('.briefing-status').textContent = 'Waiting for camera permission…';
    const ready = await this.engine.motionController?.enableWebcam();
    if (!this.active || token !== this.sequence) {
      if (ready) this.engine.motionController?.disableWebcam();
      return;
    }
    button.disabled = false;
    if (ready) this.startMatch('webcam');
    else {
      button.textContent = 'Retry camera';
      this.root.querySelector('.briefing-status').textContent = 'Camera unavailable or permission declined. Check browser camera access, retry, or play with keyboard / mouse.';
    }
  }

  updateSoundLabel() {
    const muted = this.engine.audioEngine?.muted;
    this.root.querySelector('[data-action=sound]').textContent = muted ? 'Enable sound' : 'Mute sound';
  }

  startMatch(mode) {
    this.close();
    if (this.engine.courtHUD) return this.engine.courtHUD.startMatch(mode);
    const e = this.engine;
    e.hud.hideTitleModal();
    e.hud.selectedInputMode = mode;
    e.hud.callbacks.onStartMatch({ ...e.matchConfig, inputMode: mode });
  }

  close() {
    if (!this.active) return;
    this.active = false;
    this.sequence++;
    this.idleSeconds = 0;
    this.engine.audioEngine?.endBriefingNarration();
    this.root.classList.add('hidden');
    document.body.classList.remove('briefing-active');
    this.inertNodes?.forEach(n => { n.inert = false; });
    this.engine.hud?.hideCenterBanner();
    document.getElementById('timing-popup')?.classList.add('hidden');
    const previous = this.restoreFocus;
    const visible = previous?.isConnected && previous.getClientRects().length && !previous.closest('.menu-collapsed,.hidden');
    (visible ? previous : document.getElementById('btn-mobile-menu'))?.focus({ preventScroll: true });
  }
}
