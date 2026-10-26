import { RELAY_ENABLED } from '../motion_controls.js';
/** Reuses the live controls so moving the HUD never creates a second state owner. */
export class CourtHUD {
  constructor(engine) {
    this.engine = engine;
    const card = document.querySelector('#title-modal .side-docked-card');
    const header = document.querySelector('#title-modal .wii-logo-header');
    if (!card || !header) return;
    // Match entry stays ahead of setup; preserve the existing button and callbacks.
    const matchButton = document.getElementById('btn-start-match');
    card.prepend(matchButton);
    document.getElementById('btn-start-match-label').textContent = 'START MATCH';
    this.quickStart = document.createElement('button');
    this.quickStart.id = 'btn-quick-start';
    this.quickStart.type = 'button';
    this.quickStart.innerHTML = '<strong>START MATCH</strong><span>You play red · keyboard, mouse or touch</span>';
    document.body.append(this.quickStart);
    this.quickStart.addEventListener('click', e => { e.stopPropagation(); this.startMatch('mouse'); });
    for (const type of ['pointerdown', 'pointerup', 'keydown', 'keyup']) {
      this.quickStart.addEventListener(type, e => e.stopPropagation());
    }
    const start = document.createElement('section');
    start.className = 'play-methods';
    start.innerHTML = `<h2>THREE WAYS TO PLAY</h2><p>You're the red player. Choose your controls.</p>
      <button type="button" data-play-method="mouse"><b>01</b><span><strong>Keyboard / mouse</strong><small>Or tap the shot buttons · jump straight in</small></span><em>PLAY →</em></button>
      <button type="button" data-play-method="phone"><b>02</b><span><strong>Phone racket</strong><small>Wii-style · your phone is your racket</small></span><em>SHOW ME →</em></button>
      <button type="button" data-play-method="camera"><b>03</b><span><strong>Camera play</strong><small>Kinect-style · step back, lunge and swing</small></span><em>SHOW ME →</em></button>`;
    header.after(start);
    start.addEventListener('click', e => {
      const method = e.target.closest('[data-play-method]')?.dataset.playMethod;
      if (!method) return;
      e.stopPropagation();
      if (method === 'mouse') this.startMatch('mouse');
      else this.showMethod(method);
    });
    const tools = document.createElement('details');
    tools.className = 'court-menu-settings';
    tools.innerHTML = '<summary>Settings · sound, camera & controls</summary><div class="court-menu-controls"></div>';
    start.after(tools);
    const controls = tools.lastElementChild;
    const spinSetting = document.createElement('label');
    spinSetting.className = 'racket-spin-setting';
    spinSetting.innerHTML = '<input type="checkbox" id="setting-racket-spin"><span>Racquet spin before a match<small>Off: you, the red player, serve first.</small></span>';
    controls.append(spinSetting);
    const spinToggle = spinSetting.querySelector('input');
    try { spinToggle.checked = localStorage.getItem('squash-arcade-racket-spin') === 'true'; } catch {}
    engine.matchConfig.racketSpin = spinToggle.checked;
    spinToggle.addEventListener('change', () => {
      engine.matchConfig.racketSpin = spinToggle.checked;
      try { localStorage.setItem('squash-arcade-racket-spin', String(spinToggle.checked)); } catch {}
    });
    for (const selector of ['.motion-buttons-col', '.top-hud-left-group', '.top-hud-right-group']) {
      const node = document.querySelector(selector);
      if (node) controls.append(node);
    }
    const upper = document.createElement('section');
    upper.id = 'court-upper-readout';
    upper.setAttribute('aria-label', 'Red player and shot information');
    document.getElementById('hud-root').append(upper);
    for (const selector of ['.red-control-card', '#timing-gauge-card']) {
      const node = document.querySelector(selector);
      if (node) upper.append(node);
    }
    const labels = ['Preparation', 'Contact', 'Follow-through'];
    document.querySelectorAll('.timing-zone').forEach((node, i) => { node.textContent = labels[i]; });
    document.getElementById('timing-gauge-card').title = 'Descriptive stroke display. Shot direction depends on the actual stroke, aim and contact.';
    const pip = document.getElementById('webcam-pip-card');
    if (pip) controls.append(pip);
    const phone = document.getElementById('btn-phone-racket');
    // The three-way entry owns phone availability; retain the original pairing callback.
    phone?.classList.add('hidden');
    document.getElementById('btn-mobile-menu')?.setAttribute('aria-label', 'Open game menu');
    for (const type of ['pointerdown', 'pointerup']) {
      document.getElementById('btn-sound-gate')?.addEventListener(type, e => e.stopPropagation());
    }
    const title = document.getElementById('title-modal');
    this.menuObserver = new MutationObserver(() => {
      document.getElementById('btn-mobile-menu')?.setAttribute('aria-expanded', String(engine._isSideMenuExpanded()));
    });
    this.menuObserver.observe(title, { attributes: true, attributeFilter: ['class', 'style'] });
  }

  update() {
    const e = this.engine;
    this.quickStart.hidden = !(e.spectatorMatchMode || e.autoPlayMode || e.introDirector?.active || ['TITLE', 'MATCH_OVER'].includes(e.phase)) || e._isSideMenuExpanded() || e.arcadeBriefing?.active || e.isPausedForModal;
  }

  startMatch(mode) {
    const e = this.engine;
    e.arcadeBriefing?.close();
    e.hud.selectedInputMode = mode;
    e.matchConfig.inputMode = mode;
    if (mode !== 'webcam') e.motionController?.disableWebcam();
    e.hud.hideTitleModal();
    e.hud.callbacks.onStartMatch({
      gamesToWin: e.hud.selectedGamesToWin, scoringSystem: e.hud.selectedScoringSystem,
      courtTheme: e.hud.selectedCourtTheme, inputMode: mode, difficulty: e.hud.selectedDifficulty
    });
  }

  showMethod(mode) {
    if (this.engine.arcadeBriefing) return this.engine.arcadeBriefing.open(mode, { manual: true });
    // This entry remains complete when deployed independently of the animated briefing.
    const guide = document.createElement('dialog');
    guide.className = 'method-fallback';
    const phone = mode === 'phone';
    guide.innerHTML = `<h2>${phone ? 'Phone racket · Wii-style' : 'Camera play · Kinect-style'}</h2>
      <p>${phone ? 'Pair your phone with a relay-enabled court, allow motion sensors, then hold it securely and swing.' : 'Allow the camera, step back so your upper body and arms are visible, then swing your racket arm.'}</p>
      <p role="status"></p><button data-start>Start ${phone ? 'pairing' : 'camera'}</button><button data-keyboard>Play with keyboard / mouse</button><button data-close>Close</button>`;
    document.body.append(guide);
    const status = guide.querySelector('[role=status]');
    const action = guide.querySelector('[data-start]');
    if (phone && !RELAY_ENABLED) {
      status.textContent = 'Phone pairing needs a relay-enabled court. It is unavailable on this static web host.';
      action.disabled = true;
    }
    const close = () => { guide.close(); guide.remove(); };
    guide.querySelector('[data-close]').onclick = close;
    guide.querySelector('[data-keyboard]').onclick = () => { close(); this.startMatch('mouse'); };
    action.onclick = async () => {
      if (phone) { close(); this.engine.hud.openMultiplayerModal(); return; }
      action.disabled = true;
      const ready = await this.engine.motionController.enableWebcam();
      action.disabled = false;
      if (ready) { close(); this.startMatch('webcam'); }
      else status.textContent = 'Camera unavailable or permission declined. Retry, or use keyboard / mouse.';
    };
    guide.showModal();
  }
}
