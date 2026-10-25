// ============================================================================
// ARGON SQUASH — AUDIO ENGINE, DEEP MALE REFEREE VOICE & MUSIC JUKEBOX
// Features:
//   1. "Welcome to Virtual Squash!" arcade announcer intro
//   2. Deep Male WSF/PSA Squash Referee Voice ("Down! Handout, five-four", etc.)
//      with toggleable state, deep baritone pitch selection, and PA resonance
//   3. Full 7-Track Music Jukebox (4 Lyria 3 Studio Tracks + 3 Procedural
//      Web-Audio Arcade/Synthwave Sequencer Tracks) with Auto/Lock/Shuffle modes
// ============================================================================

export const LYRIA_TRACKS = {
  // ==========================================================================
  // TRACKS 1–7: NOVEL ORIGINAL ARGON SQUASH DEFAULT SOUNDTRACK
  // ==========================================================================
  argon_glass_overture: {
    id: 'argon_glass_overture',
    title: 'Argon Glass Overture (Original #1)',
    shortTitle: 'Argon Glass Overture',
    subtitle: 'Original Showcourt Menu & AI Rally Theme • 118 BPM',
    genre: 'Argon Original Soundtrack',
    type: 'synth',
    bpm: 118,
    loop: true,
    baseVolume: 0.46
  },
  physical_chess_protocol: {
    id: 'physical_chess_protocol',
    title: 'Physical Chess Protocol (Original #2)',
    shortTitle: 'Physical Chess Protocol',
    subtitle: 'Original Four-Wall Tactical Rally Mix • 128 BPM',
    genre: 'Argon Original Soundtrack',
    type: 'synth',
    bpm: 128,
    loop: true,
    baseVolume: 0.46
  },
  crimson_tin_fanfare: {
    id: 'crimson_tin_fanfare',
    title: 'Crimson Tin & Glass Walls (Original #3)',
    shortTitle: 'Crimson Tin Fanfare',
    subtitle: 'Original Showcourt Arena Intro & Serve • 124 BPM',
    genre: 'Argon Original Soundtrack',
    type: 'synth',
    bpm: 124,
    loop: true,
    baseVolume: 0.48
  },
  nick_roller_overdrive: {
    id: 'nick_roller_overdrive',
    title: 'Nick Roller Overdrive (Original #4)',
    shortTitle: 'Nick Roller Overdrive',
    subtitle: 'Original Match Ball & Corner Nick Tension • 136 BPM',
    genre: 'Argon Original Soundtrack',
    type: 'synth',
    bpm: 136,
    loop: true,
    baseVolume: 0.46
  },
  alexandria_showcourt_nights: {
    id: 'alexandria_showcourt_nights',
    title: 'Alexandria Showcourt Nights (Original #5)',
    shortTitle: 'Alexandria Nights',
    subtitle: 'Original Hijaz Glass Marimba & Deep Sub • 120 BPM',
    genre: 'Argon Original Soundtrack',
    type: 'synth',
    bpm: 120,
    loop: true,
    baseVolume: 0.45
  },
  forearm_cut_funk: {
    id: 'forearm_cut_funk',
    title: 'Forearm Cut & Boast Funk (Original #6)',
    shortTitle: 'Forearm Cut Funk',
    subtitle: 'Original Clavinet, Slap Bass & Ghost Groove • 116 BPM',
    genre: 'Argon Original Soundtrack',
    type: 'synth',
    bpm: 116,
    loop: true,
    baseVolume: 0.45
  },
  psa_championship_crown: {
    id: 'psa_championship_crown',
    title: 'Four-Wall Championship Crown (Original #7)',
    shortTitle: 'Championship Crown',
    subtitle: 'Original Trophy & Victory Anthem • 126 BPM',
    genre: 'Argon Original Soundtrack',
    type: 'synth',
    bpm: 126,
    loop: true,
    baseVolume: 0.48
  },

  // ==========================================================================
  // TRACKS 8–14: BONUS & CLASSIC LEGACY TRACKS
  // ==========================================================================
  virtua_arcade_95: {
    id: 'virtua_arcade_95',
    title: "Virtual Squash '95 (Arcade Synth #8)",
    shortTitle: "Virtual Squash '95",
    subtitle: '90s Virtua Arcade FM Brass & Bass • 132 BPM',
    genre: 'Arcade FM Synth',
    type: 'synth',
    bpm: 132,
    loop: true,
    baseVolume: 0.44
  },
  t_zone_cyber: {
    id: 't_zone_cyber',
    title: 'T-Zone Cyber Pulse (Electro #9)',
    shortTitle: 'T-Zone Cyber Pulse',
    subtitle: 'Driving Electro-Squash Mid-Court Arp • 128 BPM',
    genre: 'Cyber Electro',
    type: 'synth',
    bpm: 128,
    loop: true,
    baseVolume: 0.42
  },
  cairo_glass_finals: {
    id: 'cairo_glass_finals',
    title: 'Cairo Glass Finals (Breakbeat #10)',
    shortTitle: 'Cairo Glass Finals',
    subtitle: 'Championship Sub-Bass & Glass Percussion • 118 BPM',
    genre: 'Deep Breakbeat',
    type: 'synth',
    bpm: 118,
    loop: true,
    baseVolume: 0.44
  },
  match_rally: {
    id: 'match_rally',
    title: 'Classic Lyria Rally (Legacy #11)',
    shortTitle: 'Classic Lyria Rally',
    subtitle: 'Legacy Studio Rally Track • 124 BPM',
    genre: 'Lyria 3 Legacy',
    type: 'audio',
    src: 'https://www.gstatic.com/aistudio/starter-apps/tennis/audio/match_rally.mp3',
    loop: true,
    baseVolume: 0.36
  },
  menu_theme: {
    id: 'menu_theme',
    title: 'Classic Showcourt Prelude (Legacy #12)',
    shortTitle: 'Classic Prelude',
    subtitle: 'Legacy Club Select Theme • 108 BPM',
    genre: 'Lyria 3 Legacy',
    type: 'audio',
    src: 'https://www.gstatic.com/aistudio/starter-apps/tennis/audio/menu_theme.mp3',
    loop: true,
    baseVolume: 0.42
  },
  court_intro: {
    id: 'court_intro',
    title: 'Classic Arena Flyover (Legacy #13)',
    shortTitle: 'Classic Flyover',
    subtitle: 'Legacy Showcourt Intro Fanfare • 120 BPM',
    genre: 'Lyria 3 Legacy',
    type: 'audio',
    src: 'https://www.gstatic.com/aistudio/starter-apps/tennis/audio/court_intro.mp3',
    loop: false,
    baseVolume: 0.48
  },
  victory_fanfare: {
    id: 'victory_fanfare',
    title: 'Classic Trophy Fanfare (Legacy #14)',
    shortTitle: 'Classic Trophy',
    subtitle: 'Legacy Match Victory Celebration • 126 BPM',
    genre: 'Lyria 3 Legacy',
    type: 'audio',
    src: 'https://www.gstatic.com/aistudio/starter-apps/tennis/audio/victory_fanfare.mp3',
    loop: false,
    baseVolume: 0.50
  }
};

export const ORIGINAL_DEFAULT_TRACK_IDS = [
  'argon_glass_overture',
  'physical_chess_protocol',
  'crimson_tin_fanfare',
  'nick_roller_overdrive',
  'alexandria_showcourt_nights',
  'forearm_cut_funk',
  'psa_championship_crown'
];

export const JUKEBOX_TRACK_LIST = Object.values(LYRIA_TRACKS);

// Per-track drum kit personalities — kick pitch/decay, snare body, hat density.
const TRACK_DRUM_KIT = {
  argon_glass_overture: { kick: 122, kickEnd: 34, kickDecay: 0.15, snareBp: 1600, hat: 'sparse' },
  physical_chess_protocol: { kick: 150, kickEnd: 42, kickDecay: 0.10, snareBp: 1750, hat: 'eighth' },
  crimson_tin_fanfare: { kick: 96, kickEnd: 30, kickDecay: 0.22, snareBp: 2050, hat: 'sparse' },
  nick_roller_overdrive: { kick: 132, kickEnd: 36, kickDecay: 0.09, snareBp: 1950, hat: 'sixteenth' },
  alexandria_showcourt_nights: { kick: 84, kickEnd: 28, kickDecay: 0.26, snareBp: 1250, hat: 'sparse' },
  forearm_cut_funk: { kick: 142, kickEnd: 40, kickDecay: 0.11, snareBp: 1550, hat: 'eighth' },
  psa_championship_crown: { kick: 128, kickEnd: 34, kickDecay: 0.16, snareBp: 2100, hat: 'eighth' }
};

const STATE_TO_TRACK = {
  // Boot-visible states map to the 7 original Argon Squash soundtrack synths —
  // deliberately NOT the legacy argon-tennis MP3s. (Synth = AudioContext, so
  // pre-gesture start is muted; audio-element muted-start stays for jukebox
  // 'audio' tracks which CAN start pre-gesture.)
  title: 'argon_glass_overture',
  menu: 'argon_glass_overture',
  select: 'argon_glass_overture',
  intro: 'crimson_tin_fanfare',
  court_intro: 'crimson_tin_fanfare',
  flyover: 'crimson_tin_fanfare',
  start: 'crimson_tin_fanfare',
  serve: 'physical_chess_protocol',
  serve_wait: 'physical_chess_protocol',
  serve_toss: 'physical_chess_protocol',
  rally: 'physical_chess_protocol',
  playing: 'physical_chess_protocol',
  match: 'physical_chess_protocol',
  point: 'physical_chess_protocol',
  gamepoint: 'nick_roller_overdrive',
  replay: 'alexandria_showcourt_nights',
  victory: 'psa_championship_crown',
  win: 'psa_championship_crown',
  game_won: 'forearm_cut_funk',
  match_over: 'psa_championship_crown',
  celebration: 'psa_championship_crown',
  argon_glass_overture: 'argon_glass_overture',
  physical_chess_protocol: 'physical_chess_protocol',
  crimson_tin_fanfare: 'crimson_tin_fanfare',
  nick_roller_overdrive: 'nick_roller_overdrive',
  alexandria_showcourt_nights: 'alexandria_showcourt_nights',
  forearm_cut_funk: 'forearm_cut_funk',
  psa_championship_crown: 'psa_championship_crown',
  menu_theme: 'menu_theme',
  match_rally: 'match_rally',
  victory_fanfare: 'victory_fanfare',
  virtua_arcade_95: 'virtua_arcade_95',
  t_zone_cyber: 't_zone_cyber',
  cairo_glass_finals: 'cairo_glass_finals'
};

export const NARRATOR_USP_INVITES = [
  {
    title: '🎙️ WELCOME TO ARGON SQUASH • CHOOSE YOUR WAY TO PLAY',
    subText: '1P vs AI or 2-Human 1v1 • Webcam Kinect-Style, Phone Wii-Racket, or Mouse/Keys • Press K for Complete Rules',
    speech:
      'Welcome to Argon Squash! You are watching two autonomous A.I. players battle live on the glass showcourt. Ready to jump in? Use the menu on the left to play One Player against Club or Pro A.I., or start a Two-Human-Player One-v-One match! Play with Webcam Kinect-style body pose and arm swings, pair your smartphone as a Wii-style inertial racket, or use Keyboard and Mouse. Press K at any time to review the complete rules of squash!'
  },
  {
    title: '📷 KINECT-STYLE WEBCAM POSE & 📱 WII-STYLE PHONE RACKET',
    subText: 'Step 4: Enable Pose Cam (Front/Back TV) • Bottom Right: Pair Phone Racket • Press K for Squash Rules',
    speech:
      'Experience Physical Chess with full motion controls! For Kinect-style webcam play, click Enable Pose Cam in Step 4 to lunge and swing naturally in front of your camera—even using a back camera with a big-screen T.V.! For Wii-style motion play, scan the Pocket Racket QR code with your phone to swing and slice in 3D space. Or play immediately with mouse swipes and keys 1 through 5. Press K anytime to pause and view the complete rules of squash!'
  },
  {
    title: '🎾 1P VS AI, 2-PLAYER 1V1 & LIVE AI NUDGES',
    subText: 'Click Play Match Now on the Left Menu • Or Nudge the Live AI Right Now with Keys 1–5 & WASD • Key K: Rules',
    speech:
      'Ready to step on court? In Step 1 on the left menu, pick Club A.I. or Pro Chess A.I. for a solo match, or select One-v-One Match to invite a second human player! Even while watching this live A.I. exhibition, you can nudge their next shot with keys 1 through 5, or steer footwork with W, A, S, D. To review the official rules of squash, including Lets and Strokes, press K at any time!'
  }
];

export const GEMINI_TTS_CLIPS = {};

export class AudioEngine {
  constructor(options = {}) {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicSynthGain = null;
    this.reverbSend = null;

    this.muted = Boolean(options.muted ?? false);
    this.musicVolume = Number(options.musicVolume ?? 0.65);
    this.sfxVolume = Number(options.sfxVolume ?? 0.88);

    // Deep Male Referee Voice Configuration
    this.refereeVoiceEnabled = options.refereeVoiceEnabled !== false;
    this.refereeVoicePitch = Number(options.refereeVoicePitch ?? 0.72); // Deep resonant male baritone
    this.refereeVoiceRate = Number(options.refereeVoiceRate ?? 0.95);
    this._cachedMaleVoice = null;
    this._welcomePlayed = false;
    this._uspInviteIndex = 0;
    this.lastRefereeCallout = 'Welcome to Virtual Squash!';

    // Jukebox State
    this.jukeboxMode = 'auto'; // 'auto' | 'locked' | 'shuffle'
    this.audioElements = new Map();
    this.ttsAudioElements = new Map();
    this._activeVoiceAudio = null;
    this._voiceTimers = [];
    this._voiceGeneration = 0;
    this._briefingToken = 0;
    this._briefingNarration = null;
    this.currentTrackId = null;
    this.desiredTrackId = 'argon_glass_overture';
    this.unlocked = false;

    // Procedural Synth Sequencer State
    this._synthTimer = null;
    this._synthStep = 0;

    this.onTrackChange = typeof options.onTrackChange === 'function' ? options.onTrackChange : null;
    this.onRefereeCallout = typeof options.onRefereeCallout === 'function' ? options.onRefereeCallout : null;

    this._noiseBuffer = null;
    this._pinkNoiseBuffer = null;
    this._fadeTimers = new Map();

    this._preloadTracks();
    this._initSpeechVoices();
    this._attachAutoplayUnlock();
  }

  _preloadTracks() {
    for (const [id, track] of Object.entries(LYRIA_TRACKS)) {
      if (track.type !== 'audio' || !track.src) continue;
      const el = new Audio();
      el.src = track.src;
      el.loop = track.loop;
      el.preload = 'auto';
      el.volume = 0;
      el.crossOrigin = 'anonymous';
      el.addEventListener('ended', () => {
        if (this.currentTrackId !== id) return;
        if (this.jukeboxMode === 'shuffle') {
          this.nextJukeboxTrack({ fromShuffle: true });
        } else if (this.jukeboxMode === 'locked') {
          el.currentTime = 0;
          el.play().catch(() => {});
        } else if (id === 'court_intro') {
          this.playMusicForState('rally');
        } else {
          this.nextJukeboxTrack();
        }
      });
      // Muted start: a muted element is exempt from the autoplay policy, so play()
      // can resolve before any user gesture; unmute once playback actually starts.
      el.addEventListener('playing', () => {
        if (!this.muted) el.muted = false;
        console.log('[audio] playing:', id, '| muted:', el.muted, '| vol:', el.volume.toFixed(2));
      });
      el.addEventListener('error', () => {
        console.warn('[audio] element error:', id, el.error?.code, el.error?.message);
      });
      this.audioElements.set(id, el);
    }
  }

  _initSpeechVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const loadVoices = () => {
      this._cachedMaleVoice = this._selectDeepMaleVoice();
    };
    loadVoices();
    if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  /**
   * Selects the best available deep male English voice from browser SpeechSynthesis.
   */
  _selectDeepMaleVoice() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    if (!voices.length) return null;

    const enVoices = voices.filter((v) => /^en(-|_|$)/i.test(v.lang || ''));
    const pool = enVoices.length ? enVoices : voices;

    const preferredMalePatterns = [
      /Google UK English Male/i,
      /Daniel/i,
      /Arthur/i,
      /Oliver/i,
      /Microsoft George/i,
      /Microsoft Ryan/i,
      /Microsoft Guy/i,
      /Microsoft Christopher/i,
      /Microsoft David/i,
      /Microsoft Mark/i,
      /Alex/i,
      /Fred/i,
      /Aaron/i,
      /Tom/i,
      /English.*Male/i,
      /\bMale\b/i
    ];

    const avoidFemalePatterns = /Female|Samantha|Victoria|Karen|Moira|Tessa|Zira|Hazel|Susan|Catherine|Serena|Martha/i;

    for (const pattern of preferredMalePatterns) {
      const match = pool.find((v) => pattern.test(v.name));
      if (match) return match;
    }

    const nonFemale = pool.find((v) => !avoidFemalePatterns.test(v.name));
    return nonFemale || pool[0];
  }

  _attachAutoplayUnlock() {
    const onFirstGesture = () => {
      const wasUnlocked = this.unlocked;
      this.unlock();
      if (!wasUnlocked && !this._welcomePlayed) {
        this.playWelcomeIntro();
      }
    };
    window.addEventListener('pointerdown', onFirstGesture, { passive: true });
    window.addEventListener('keydown', onFirstGesture, { passive: true });
    window.addEventListener('touchstart', onFirstGesture, { passive: true });
  }

  _ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 1;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);

      this.musicSynthGain = this.ctx.createGain();
      this.musicSynthGain.gain.value = this.musicVolume * 0.42;
      this.musicSynthGain.connect(this.masterGain);

      const delay = this.ctx.createDelay(0.5);
      delay.delayTime.value = 0.095;
      const fb = this.ctx.createGain();
      fb.gain.value = 0.24;
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 3200;

      this.reverbSend = this.ctx.createGain();
      this.reverbSend.gain.value = 0.22;
      this.reverbSend.connect(delay);
      delay.connect(lp);
      lp.connect(fb);
      fb.connect(delay);
      lp.connect(this.masterGain);

      this._buildNoiseBuffers();

      // Sound-gate: hide the unlock button the moment audio can actually run.
      // In a native WebView without the gesture policy the ctx starts 'running'
      // at boot, so the gate never renders; in browsers it hides on first gesture.
      if (!this._gateHideBound) {
        this._gateHideBound = true;
        const hideGate = () => {
          if (this.ctx.state === 'running') {
            document.getElementById('btn-sound-gate')?.classList.add('hidden');
          }
        };
        this.ctx.addEventListener('statechange', hideGate);
        hideGate();
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  _buildNoiseBuffers() {
    if (!this.ctx) return;
    const sr = this.ctx.sampleRate;
    const len = sr * 2;
    this._noiseBuffer = this.ctx.createBuffer(1, len, sr);
    const white = this._noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) white[i] = Math.random() * 2 - 1;

    this._pinkNoiseBuffer = this.ctx.createBuffer(1, len, sr);
    const pink = this._pinkNoiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.96900 * b2 + w * 0.1538520;
      b3 = 0.86650 * b3 + w * 0.3104856;
      b4 = 0.55000 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.0168980;
      pink[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.045;
      b6 = w * 0.115926;
    }
  }

  unlock() {
    this._ensureContext();
    this.unlocked = true;
    const targetId = this.currentTrackId || this.desiredTrackId;
    if (targetId && !this.muted) {
      const track = LYRIA_TRACKS[targetId];
      if (track?.type === 'synth') {
        if (!this._synthTimer) this._startSynthSequencer(targetId);
      } else {
        const el = this.audioElements.get(targetId);
        if (!el || el.paused) {
          this._crossfadeToTrack(targetId);
        }
      }
    }
  }

  /**
   * Plays the signature "Welcome to Virtual Squash!" announcer callout.
   */
  playWelcomeIntro({ force = false, withLoveAll = false } = {}) {
    if (this._welcomePlayed && !force) return;
    if (this._briefingNarration) {
      this._welcomePlayed = true;
      return;
    }
    if (this.muted) return;

    const ctx = this._ensureContext();
    this._welcomePlayed = true;
    if (ctx) {
      // Warm Virtua Arcade brass fanfare chord (D9 -> Gmaj7)
      const now = ctx.currentTime;
      const notes = [146.83, 220.0, 293.66, 369.99, 440.0, 587.33];
      notes.forEach((freq, idx) => {
        const t = now + idx * 0.045;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        osc1.type = 'sawtooth';
        osc2.type = 'triangle';
        osc2.detune.setValueAtTime(8, t);
        osc1.frequency.setValueAtTime(freq, t);
        osc2.frequency.setValueAtTime(freq, t);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, t);
        filter.frequency.exponentialRampToValueAtTime(2400, t + 0.12);
        filter.frequency.exponentialRampToValueAtTime(980, t + 0.55);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.045, t + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0008, t + 0.62);
        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        if (this.reverbSend) gain.connect(this.reverbSend);
        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + 0.65);
        osc2.stop(t + 0.65);
      });
    }

    const phrase = withLoveAll
      ? 'Welcome to Virtual Squash! Love all. Play!'
      : 'Welcome to Virtual Squash!';
    this.beginBriefingNarration(phrase, () => this.endBriefingNarration());
  }

  /**
   * Plays a periodic or on-demand Narrator Invitation showcasing Argon Squash's USPs:
   * - 1P vs AI or 2-Human 1v1
   * - Webcam Kinect-style body pose & swing play (Front or Back Cam)
   * - Wii-style Smartphone Pocket Racket inertial play
   * - Keyboard & Mouse play + Press K for Complete Rules of Squash
   */
  playNarratorUSPInvite(customIndex = null) {
    if (this._briefingNarration) return null;
    const idx =
      typeof customIndex === 'number'
        ? Math.abs(customIndex) % NARRATOR_USP_INVITES.length
        : this._uspInviteIndex % NARRATOR_USP_INVITES.length;
    this._uspInviteIndex = (idx + 1) % NARRATOR_USP_INVITES.length;
    const item = NARRATOR_USP_INVITES[idx];
    if (!this.muted && this.refereeVoiceEnabled) {
      // Avoid interrupting an active speech utterance if one is currently mid-sentence
      if (
        typeof window !== 'undefined' &&
        'speechSynthesis' in window &&
        window.speechSynthesis.speaking &&
        customIndex === null
      ) {
        return null;
      }
      this.beginBriefingNarration(item.speech, () => this.endBriefingNarration());
    }
    return item;
  }

  // ==========================================================================
  // MUSIC JUKEBOX & STATE SOUNDTRACK CONTROLLER
  // ==========================================================================

  getJukeboxTracks() {
    return JUKEBOX_TRACK_LIST.map((t) => ({
      ...t,
      active: (this.currentTrackId || this.desiredTrackId) === t.id
    }));
  }

  setJukeboxMode(mode = 'auto') {
    if (['auto', 'locked', 'shuffle'].includes(mode)) {
      this.jukeboxMode = mode;
      // Re-apply loop semantics to the currently playing audio track.
      const curTrack = LYRIA_TRACKS[this.currentTrackId];
      const curEl = this.audioElements.get(this.currentTrackId);
      if (curTrack?.type === 'audio' && curEl) {
        curEl.loop = curTrack.loop && mode === 'locked';
      }
    }
    this._notifyTrackChange();
    return this.jukeboxMode;
  }

  selectJukeboxTrack(trackId, { lock = true } = {}) {
    if (!LYRIA_TRACKS[trackId]) return this.getCurrentTrackInfo();
    if (lock) {
      this.jukeboxMode = 'locked';
    }
    this.desiredTrackId = trackId;
    this._crossfadeToTrack(trackId);
    return this.getCurrentTrackInfo();
  }

  nextJukeboxTrack({ fromShuffle = false, onlyOriginalSeven = false } = {}) {
    const ids = onlyOriginalSeven ? ORIGINAL_DEFAULT_TRACK_IDS : Object.keys(LYRIA_TRACKS);
    const curIdx = Math.max(
      0,
      ids.indexOf(this.currentTrackId || this.desiredTrackId || 'argon_glass_overture')
    );
    let nextIdx = (curIdx + 1) % ids.length;
    if (fromShuffle || this.jukeboxMode === 'shuffle') {
      nextIdx = (curIdx + 1 + Math.floor(Math.random() * (ids.length - 1))) % ids.length;
    }
    // Manual skip in 'auto' mode is a skip, not a lock — rotation stays alive.
    const nextId = ids[nextIdx];
    this.desiredTrackId = nextId;
    this._crossfadeToTrack(nextId);
    return this.getCurrentTrackInfo();
  }

  prevJukeboxTrack() {
    const ids = Object.keys(LYRIA_TRACKS);
    const curIdx = Math.max(
      0,
      ids.indexOf(this.currentTrackId || this.desiredTrackId || 'argon_glass_overture')
    );
    const prevIdx = (curIdx - 1 + ids.length) % ids.length;
    const prevId = ids[prevIdx];
    this.desiredTrackId = prevId;
    this._crossfadeToTrack(prevId);
    return this.getCurrentTrackInfo();
  }

  playMusicForState(stateName) {
    if (this.jukeboxMode === 'locked' && this.currentTrackId) {
      return this.getCurrentTrackInfo();
    }
    const key = String(stateName || 'rally').toLowerCase().trim();
    const trackId = STATE_TO_TRACK[key] || 'physical_chess_protocol';
    this.desiredTrackId = trackId;
    if (this.currentTrackId === trackId) {
      const track = LYRIA_TRACKS[trackId];
      if (track?.type === 'audio') {
        const el = this.audioElements.get(trackId);
        if (el && el.paused) {
          el.muted = true;
          el.play().catch(() => {});
        }
      } else if (track?.type === 'synth' && !this._synthTimer && !this.muted && this.unlocked) {
        this._startSynthSequencer(trackId);
      }
      return this.getCurrentTrackInfo();
    }
    this._crossfadeToTrack(trackId);
    return this.getCurrentTrackInfo();
  }

  _crossfadeToTrack(targetTrackId) {
    const prevId = this.currentTrackId;
    this.currentTrackId = targetTrackId;

    // Stop previous audio element or synth sequencer
    if (prevId && prevId !== targetTrackId) {
      const prevEl = this.audioElements.get(prevId);
      if (prevEl) this._fadeAudio(prevEl, 0, 380, true);
    }
    this._stopSynthSequencer();

    const targetTrack = LYRIA_TRACKS[targetTrackId];
    if (!targetTrack) return;

    if (targetTrack.type === 'synth') {
      // Fade out any playing HTML5 audio elements
      for (const el of this.audioElements.values()) {
        if (!el.paused) this._fadeAudio(el, 0, 260, true);
      }
      if (!this.muted) {
        this._startSynthSequencer(targetTrackId);
      }
    } else {
      const el = this.audioElements.get(targetTrackId);
      if (el) {
        const targetVol = this.muted ? 0 : Math.min(1, targetTrack.baseVolume * this.musicVolume);
        // Locked mode repeats seamlessly via the element loop; auto/shuffle let
        // the track end so the 'ended' handler can advance rotation.
        el.loop = targetTrack.loop && this.jukeboxMode === 'locked';
        if (!el.loop) {
          try {
            el.currentTime = 0;
          } catch {}
        }
        el.muted = true;
        el.play()
          .then(() => {
            this._fadeAudio(el, targetVol, 440, false);
          })
          .catch((err) => {
            console.warn('[audio] play() rejected for', targetTrackId, '-', err?.name, err?.message);
          });
      }
    }

    this._notifyTrackChange();
  }

  _notifyTrackChange() {
    const info = this.getCurrentTrackInfo();
    this._updateHudMusicBadge(info);
    if (typeof this.onTrackChange === 'function') {
      this.onTrackChange(info);
    }
  }

  // ==========================================================================
  // PROCEDURAL WEB-AUDIO ARCADE / SYNTHWAVE SEQUENCER FOR JUKEBOX TRACKS
  // ==========================================================================

  _stopSynthSequencer() {
    if (this._synthTimer) {
      clearInterval(this._synthTimer);
      this._synthTimer = null;
    }
  }

  _startSynthSequencer(trackId) {
    this._stopSynthSequencer();
    const ctx = this._ensureContext();
    if (!ctx) return;

    const track = LYRIA_TRACKS[trackId] || LYRIA_TRACKS.argon_glass_overture;
    const bpm = track.bpm || 124;
    const stepMs = Math.round((60 / bpm / 4) * 1000); // 16th-note step interval
    this._synthStep = 0;

    if (this.musicSynthGain) {
      this.musicSynthGain.gain.setValueAtTime(
        this.muted ? 0 : Math.min(1, this.musicVolume * track.baseVolume),
        ctx.currentTime
      );
    }

    this._synthTimer = setInterval(() => {
      if (this.muted || !this.ctx || this.currentTrackId !== trackId) return;
      this._playSynthStep(trackId, this._synthStep);
      this._synthStep = (this._synthStep + 1) % 256;
      if (this._synthStep === 0) {
        if (this.jukeboxMode === 'shuffle') {
          this.nextJukeboxTrack({ fromShuffle: true });
        } else if (this.jukeboxMode === 'auto' && ORIGINAL_DEFAULT_TRACK_IDS.includes(trackId)) {
          // Rotate cleanly through the 7 original default Argon Squash tracks every 16 bars
          this.nextJukeboxTrack({ onlyOriginalSeven: true });
        }
      }
    }, stepMs);
  }

  _triggerSynthVoice({
    freq = 440,
    type = 'sawtooth',
    filterType = 'lowpass',
    filterFreq = 1800,
    filterEndFreq = null,
    q = 1.2,
    gainVal = 0.08,
    attack = 0.008,
    duration = 0.16,
    detune = 0,
    sendReverb = false,
    drive = 0
  }) {
    const ctx = this.ctx;
    if (!ctx || !this.musicSynthGain || !freq) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const flt = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (detune) osc.detune.setValueAtTime(detune, now);

    flt.type = filterType;
    flt.Q.setValueAtTime(q, now);
    flt.frequency.setValueAtTime(filterFreq, now);
    if (filterEndFreq) {
      flt.frequency.exponentialRampToValueAtTime(Math.max(40, filterEndFreq), now + duration * 0.85);
    }

    gain.gain.setValueAtTime(0.0008, now);
    gain.gain.linearRampToValueAtTime(gainVal, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);

    if (drive > 0) {
      const sh = ctx.createWaveShaper();
      const curve = new Float32Array(64);
      for (let i = 0; i < 64; i++) {
        const x = (i / 63) * 2 - 1;
        curve[i] = Math.tanh(drive * x);
      }
      sh.curve = curve;
      osc.connect(sh).connect(flt);
    } else {
      osc.connect(flt);
    }
    flt.connect(gain).connect(this.musicSynthGain);
    if (sendReverb && this.reverbSend) {
      gain.connect(this.reverbSend);
    }
    osc.start(now);
    osc.stop(now + duration + 0.015);
  }

  _playSynthStep(trackId, step) {
    const ctx = this.ctx;
    if (!ctx || !this.musicSynthGain) return;
    const now = ctx.currentTime;
    const s16 = step % 16;
    const bar = Math.floor(step / 16) % 4;
    const kit = TRACK_DRUM_KIT[trackId] || {};

    // 1. Custom Drum Groove per Track
    const isBreakbeat =
      trackId === 'cairo_glass_finals' ||
      trackId === 'nick_roller_overdrive' ||
      trackId === 'alexandria_showcourt_nights';
    const isFunk = trackId === 'forearm_cut_funk';
    const isHalftime = trackId === 'argon_glass_overture';

    const kickHit = isHalftime
      ? s16 === 0 || s16 === 6 || s16 === 10
      : isFunk
      ? s16 === 0 || s16 === 3 || s16 === 8 || s16 === 14
      : isBreakbeat
      ? s16 === 0 || s16 === 6 || s16 === 10
      : s16 % 4 === 0;

    if (kickHit) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(kit.kick || (isHalftime ? 122 : 138), now);
      osc.frequency.exponentialRampToValueAtTime(kit.kickEnd || 38, now + (kit.kickDecay || 0.12));
      gain.gain.setValueAtTime(0.30, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (kit.kickDecay || 0.12) + 0.03);
      osc.connect(gain).connect(this.musicSynthGain);
      osc.start(now);
      osc.stop(now + (kit.kickDecay || 0.12) + 0.04);
    }

    // 2. Snare / Glass Rimshot + Funk Ghost Notes
    const snareHit = isHalftime ? s16 === 8 : s16 === 4 || s16 === 12;
    const ghostSnare = isFunk && (s16 === 7 || s16 === 9 || s16 === 15);
    if ((snareHit || ghostSnare) && this._noiseBuffer) {
      const src = ctx.createBufferSource();
      src.buffer = this._noiseBuffer;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(kit.snareBp || (isBreakbeat ? 1900 : isHalftime ? 1600 : 1420), now);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(ghostSnare ? 0.05 : 0.135, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (ghostSnare ? 0.045 : 0.095));
      src.connect(bp).connect(gain).connect(this.musicSynthGain);
      if (snareHit && this.reverbSend) gain.connect(this.reverbSend);
      src.start(now, 0.1, 0.1);
    }

    // 3. Crisp Hi-Hat / Shaker Pattern — density is per-track ('sixteenth' every
    // step, 'sparse' on off-8ths, default off-16ths) so each kit grooves differently
    const hatHit = kit.hat === 'sixteenth' ? true : kit.hat === 'sparse' ? (s16 === 3 || s16 === 11) : s16 % 2 === 1;
    if (this._noiseBuffer && hatHit) {
      const src = ctx.createBufferSource();
      src.buffer = this._noiseBuffer;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.setValueAtTime(7000, now);
      const gain = ctx.createGain();
      const accent = s16 % 4 === 2 ? 0.058 : 0.024;
      gain.gain.setValueAtTime(accent, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.032);
      src.connect(hp).connect(gain).connect(this.musicSynthGain);
      src.start(now, 0.2, 0.04);
    }

    // ========================================================================
    // 4. TRACK-SPECIFIC ORIGINAL MULTI-VOICE COMPOSITIONS
    // ========================================================================
    if (trackId === 'argon_glass_overture') {
      // Track #1: Argon Glass Overture — C minor9 -> Ab maj7 -> Fm9 -> G7alt
      const roots = [130.81, 103.83, 87.31, 98.0];
      const root = roots[bar];
      // Warm sustained chord pad on beat 0 of each bar
      if (s16 === 0) {
        [root * 2, root * 2.4, root * 3.0, root * 3.75].forEach((cf, idx) => {
          this._triggerSynthVoice({
            freq: cf,
            type: 'triangle',
            filterFreq: 1350,
            gainVal: 0.042,
            attack: 0.06,
            duration: 0.85,
            detune: idx * 5 - 7,
            sendReverb: true
          });
        });
      }
      // Deep warm sub-bass
      if (s16 === 0 || s16 === 6 || s16 === 10 || s16 === 14) {
        const subMult = s16 === 14 ? 1.5 : 1.0;
        this._triggerSynthVoice({
          freq: root * subMult,
          type: 'sawtooth',
          filterFreq: 680,
          filterEndFreq: 180,
          gainVal: 0.15,
          duration: 0.22
        });
      }
      // Crystalline Glass Marimba arpeggio
      const arpRatios = [2, 3, 4, 4.5, 3, 4, 6, 4.5, 2, 2.4, 3, 4, 4.5, 4, 3, 2.4];
      if (s16 % 2 === 0 || s16 === 11 || s16 === 15) {
        const bellFreq = root * arpRatios[s16];
        this._triggerSynthVoice({
          freq: bellFreq,
          type: 'sine',
          filterFreq: 3600,
          gainVal: 0.065,
          attack: 0.004,
          duration: 0.20,
          sendReverb: true
        });
      }
      // Rolling fifth swell — mid-bar pad answer so the overture breathes
      if (s16 === 8) {
        this._triggerSynthVoice({
          freq: root * 4.5,
          type: 'sine',
          filterFreq: 2400,
          gainVal: 0.05,
          attack: 0.14,
          duration: 0.7,
          sendReverb: true
        });
      }
    } else if (trackId === 'physical_chess_protocol') {
      // Track #2: Physical Chess Protocol — Driving E Dorian (Em7 -> A7 -> F#m7 -> Bm7)
      const bassRoots = [82.41, 110.0, 92.5, 123.47];
      const bRoot = bassRoots[bar];
      const oct = s16 % 2 === 1 ? 2 : 1;
      this._triggerSynthVoice({
        freq: bRoot * oct,
        type: 'sawtooth',
        filterFreq: 1150,
        filterEndFreq: 260,
        q: 2.2,
        gainVal: 0.13,
        duration: 0.11
      });
      // Tactical syncopated lead hook
      const melody = [
        329.63, 0, 392.0, 440.0, 493.88, 0, 587.33, 493.88,
        659.25, 587.33, 493.88, 0, 440.0, 392.0, 369.99, 329.63
      ];
      const mFreq = melody[s16];
      if (mFreq > 0) {
        this._triggerSynthVoice({
          freq: mFreq * (bar === 2 ? 1.122 : 1),
          type: 'square',
          filterFreq: 2200,
          filterEndFreq: 900,
          gainVal: 0.062,
          duration: 0.15,
          sendReverb: true
        });
      }
      // Clockwork "tock" — chess-clock tick on the off-beats
      if (s16 === 4 || s16 === 12) {
        this._triggerSynthVoice({
          freq: 1567.98,
          type: 'sine',
          filterType: 'highpass',
          filterFreq: 2000,
          gainVal: 0.05,
          attack: 0.002,
          duration: 0.045
        });
      }
    } else if (trackId === 'crimson_tin_fanfare') {
      // Track #3: Crimson Tin & Glass Walls — Fmaj9 -> Gm9 -> Am7 -> Bbmaj7 heroic arena fanfare
      const roots = [87.31, 98.0, 110.0, 116.54];
      const r = roots[bar];
      if (s16 === 0 || s16 === 6 || s16 === 12) {
        [r * 2, r * 2.5, r * 3, r * 3.75].forEach((f, idx) => {
          this._triggerSynthVoice({
            freq: f,
            type: 'sawtooth',
            filterFreq: 2400,
            filterEndFreq: 950,
            gainVal: 0.042,
            attack: 0.015,
            duration: 0.28,
            detune: idx * 6 - 9,
            sendReverb: true
          });
        });
      }
      if (s16 % 2 === 0) {
        const arp = [2, 2.5, 3, 4, 3, 4, 5, 4];
        this._triggerSynthVoice({
          freq: r * arp[(s16 / 2) % arp.length],
          type: 'triangle',
          filterFreq: 2900,
          gainVal: 0.075,
          duration: 0.14,
          sendReverb: true
        });
      }
      // Heroic unison brass stab + deep timpani boom on bar starts
      if (s16 === 0) {
        [r * 2, r * 2.5, r * 3].forEach((bf, idx) => {
          this._triggerSynthVoice({
            freq: bf,
            type: 'square',
            filterFreq: 1650,
            gainVal: 0.05,
            attack: 0.035,
            duration: 0.32,
            detune: idx * 10 - 10,
            sendReverb: true
          });
        });
        this._triggerSynthVoice({
          freq: 65.41,
          type: 'sine',
          filterFreq: 260,
          gainVal: 0.19,
          duration: 0.5,
          sendReverb: true
        });
      }
    } else if (trackId === 'nick_roller_overdrive') {
      // Track #4: Nick Roller Overdrive — 136 BPM High-Tension G minor Acid Arp
      const acidNotes = [
        98.0, 196.0, 233.08, 196.0, 293.66, 196.0, 311.13, 293.66,
        98.0, 196.0, 349.23, 293.66, 233.08, 196.0, 174.61, 146.83
      ];
      const f = acidNotes[s16] * (bar === 3 ? 1.122 : 1);
      this._triggerSynthVoice({
        freq: f,
        type: 'sawtooth',
        filterType: 'lowpass',
        filterFreq: 550 + ((step % 32) * 75),
        filterEndFreq: 210,
        q: 5.2,
        gainVal: 0.135,
        duration: 0.10,
        drive: 3.2
      });
      if (s16 === 0 || s16 === 8) {
        this._triggerSynthVoice({
          freq: 392.0 * (bar % 2 === 0 ? 1 : 1.189),
          type: 'sine',
          filterFreq: 3200,
          gainVal: 0.06,
          duration: 0.35,
          sendReverb: true
        });
      }
      // 49Hz sub-thump under the acid drive on bar starts
      if (s16 === 0) {
        this._triggerSynthVoice({
          freq: 49.0,
          type: 'sine',
          filterFreq: 300,
          gainVal: 0.17,
          duration: 0.3
        });
      }
    } else if (trackId === 'alexandria_showcourt_nights') {
      // Track #5: Alexandria Showcourt Nights — D Hijaz (Phrygian Dominant: D Eb F# G A Bb C)
      const hijaz = [146.83, 155.56, 185.0, 196.0, 220.0, 233.08, 261.63, 293.66];
      if (s16 === 0 || s16 === 6 || s16 === 10) {
        const subF = bar % 2 === 0 ? 73.42 : 77.78;
        this._triggerSynthVoice({
          freq: subF,
          type: 'triangle',
          filterFreq: 420,
          gainVal: 0.21,
          duration: 0.24
        });
      }
      const melIdx = [0, 2, 3, 4, 3, 2, 1, 0, 4, 5, 4, 3, 2, 3, 1, 0][s16];
      if (s16 % 2 === 0 || s16 === 7 || s16 === 13) {
        const note = hijaz[melIdx] * 2;
        this._triggerSynthVoice({
          freq: note,
          type: 'sine',
          filterFreq: 1500,
          filterEndFreq: 3400,
          gainVal: 0.072,
          attack: 0.004,
          duration: 0.18,
          sendReverb: true
        });
        this._triggerSynthVoice({
          freq: note * 2,
          type: 'triangle',
          filterFreq: 2800,
          gainVal: 0.032,
          attack: 0.004,
          duration: 0.14,
          sendReverb: true
        });
      }
      // Ney-like drone pad — bar-length bed so the night theme breathes
      if (s16 === 0) {
        [hijaz[0] * 2, hijaz[4] * 2].forEach((df) => {
          this._triggerSynthVoice({
            freq: df,
            type: 'sawtooth',
            filterFreq: 900,
            gainVal: 0.032,
            attack: 0.22,
            duration: 1.05,
            sendReverb: true
          });
        });
      }
    } else if (trackId === 'forearm_cut_funk') {
      // Track #6: Forearm Cut & Boast Funk — A Dorian Clavinet & Slap Bass
      const funkBass = [110, 0, 220, 110, 0, 130.81, 146.83, 0, 110, 220, 0, 196, 164.81, 0, 146.83, 130.81];
      const bf = funkBass[s16];
      if (bf > 0) {
        this._triggerSynthVoice({
          freq: bf,
          type: 'sawtooth',
          filterType: 'bandpass',
          filterFreq: 980,
          q: 2.8,
          gainVal: 0.15,
          duration: 0.095
        });
      }
      if (s16 === 2 || s16 === 6 || s16 === 11 || s16 === 14) {
        const chordBase = bar % 2 === 0 ? 220.0 : 196.0;
        [chordBase * 1.5, chordBase * 1.8, chordBase * 2.25].forEach((cf) => {
          this._triggerSynthVoice({
            freq: cf,
            type: 'square',
            filterFreq: 2100,
            filterEndFreq: 650,
            gainVal: 0.042,
            duration: 0.11,
            sendReverb: true
          });
        });
      }
      // Slap-bass pop on the off-16ths + palm-muted chick stab
      if (s16 === 5 || s16 === 13) {
        this._triggerSynthVoice({
          freq: (bar % 2 === 0 ? 220.0 : 196.0) * 2,
          type: 'square',
          filterFreq: 2600,
          filterEndFreq: 500,
          gainVal: 0.07,
          duration: 0.06
        });
      }
      if (s16 === 9) {
        this._triggerSynthVoice({
          freq: 660,
          type: 'sawtooth',
          filterType: 'highpass',
          filterFreq: 1100,
          gainVal: 0.045,
          duration: 0.05
        });
      }
    } else if (trackId === 'psa_championship_crown') {
      // Track #7: Four-Wall Championship Crown — Uplifting C -> G -> Am -> F anthem
      const prog = [130.81, 98.0, 110.0, 87.31];
      const root = prog[bar];
      if (s16 % 4 === 0) {
        this._triggerSynthVoice({
          freq: root,
          type: 'sawtooth',
          filterFreq: 860,
          gainVal: 0.15,
          duration: 0.18
        });
      }
      const anthemLead = [
        523.25, 659.25, 783.99, 659.25, 880.0, 783.99, 659.25, 587.33,
        523.25, 587.33, 659.25, 783.99, 1046.5, 880.0, 783.99, 659.25
      ];
      // Crowd-noise crash on each new chord + supersaw anthem stack (3 detuned saws)
      if (s16 === 0 && this._noiseBuffer) {
        const src = ctx.createBufferSource();
        src.buffer = this._noiseBuffer;
        const hp2 = ctx.createBiquadFilter();
        hp2.type = 'highpass';
        hp2.frequency.setValueAtTime(5200, now);
        const cg = ctx.createGain();
        cg.gain.setValueAtTime(0.11, now);
        cg.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
        src.connect(hp2).connect(cg).connect(this.musicSynthGain);
        src.start(now, 0.3, 0.9);
      }
      if (s16 % 2 === 0 || s16 === 3 || s16 === 11) {
        [0, -9, 9].forEach((dt) => {
          this._triggerSynthVoice({
            freq: anthemLead[s16],
            type: 'sawtooth',
            filterFreq: 2800,
            filterEndFreq: 1200,
            gainVal: 0.024,
            detune: dt,
            duration: 0.17,
            sendReverb: true
          });
        });
      }
    } else if (trackId === 'virtua_arcade_95') {
      // Virtua Squash '95: energetic A-minor -> F -> G -> E7 arcade bass & brass lead
      const bassProg = [110, 110, 220, 110, 87.31, 87.31, 174.61, 87.31, 98.0, 98.0, 196.0, 98.0, 82.41, 98.0, 110.0, 123.47];
      const leadProg = [440, 523.25, 659.25, 587.33, 523.25, 659.25, 783.99, 659.25, 587.33, 659.25, 783.99, 880.0, 659.25, 587.33, 523.25, 493.88];
      const bFreq = bassProg[s16];
      if (bFreq) {
        const osc = ctx.createOscillator();
        const flt = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(bFreq, now);
        flt.type = 'lowpass';
        flt.frequency.setValueAtTime(920, now);
        flt.frequency.exponentialRampToValueAtTime(240, now + 0.11);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(flt).connect(gain).connect(this.musicSynthGain);
        osc.start(now);
        osc.stop(now + 0.13);
      }
      if (s16 % 2 === 0 || s16 === 7 || s16 === 15) {
        const lFreq = leadProg[s16];
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(lFreq, now);
        gain.gain.setValueAtTime(0.065, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.connect(gain).connect(this.musicSynthGain);
        if (this.reverbSend) gain.connect(this.reverbSend);
        osc.start(now);
        osc.stop(now + 0.15);
      }
    } else if (trackId === 't_zone_cyber') {
      // T-Zone Cyber Pulse: D-minor driving electro arp
      const arp = [146.83, 293.66, 349.23, 440.0, 293.66, 349.23, 523.25, 440.0, 130.81, 261.63, 349.23, 392.0, 174.61, 349.23, 440.0, 587.33];
      const freq = arp[s16];
      const osc = ctx.createOscillator();
      const flt = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      flt.type = 'bandpass';
      flt.Q.setValueAtTime(2.4, now);
      flt.frequency.setValueAtTime(600 + (step % 32) * 45, now);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.10);
      osc.connect(flt).connect(gain).connect(this.musicSynthGain);
      osc.start(now);
      osc.stop(now + 0.11);
    } else if (trackId === 'cairo_glass_finals') {
      // Cairo Glass Finals: Phrygian dominant / deep showcourt sub & glass marimba
      const scale = [110.0, 116.54, 138.59, 146.83, 164.81, 174.61, 196.0, 220.0];
      if (s16 === 0 || s16 === 3 || s16 === 6 || s16 === 10 || s16 === 14) {
        const sub = scale[(s16 + Math.floor(step / 16)) % scale.length];
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(sub, now);
        gain.gain.setValueAtTime(0.20, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
        osc.connect(gain).connect(this.musicSynthGain);
        osc.start(now);
        osc.stop(now + 0.20);

        // Glass harmonic overtone
        const bell = ctx.createOscillator();
        const bGain = ctx.createGain();
        bell.type = 'sine';
        bell.frequency.setValueAtTime(sub * 4, now);
        bGain.gain.setValueAtTime(0.045, now);
        bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        bell.connect(bGain).connect(this.musicSynthGain);
        if (this.reverbSend) bGain.connect(this.reverbSend);
        bell.start(now);
        bell.stop(now + 0.23);
      }
    }
  }

  _fadeAudio(el, targetVol, durationMs, pauseOnZero = false) {
    if (this._fadeTimers.has(el)) {
      clearInterval(this._fadeTimers.get(el));
    }
    const steps = 12;
    const stepTime = Math.max(16, Math.floor(durationMs / steps));
    const startVol = el.volume;
    let curStep = 0;
    const timer = setInterval(() => {
      curStep++;
      const t = curStep / steps;
      el.volume = Math.max(0, Math.min(1, startVol + (targetVol - startVol) * t));
      if (curStep >= steps) {
        clearInterval(timer);
        this._fadeTimers.delete(el);
        el.volume = Math.max(0, Math.min(1, targetVol));
        if (pauseOnZero && targetVol <= 0.001) {
          el.pause();
        }
      }
    }, stepTime);
    this._fadeTimers.set(el, timer);
  }

  getCurrentTrackInfo() {
    const id = this.currentTrackId || this.desiredTrackId || 'argon_glass_overture';
    const track = LYRIA_TRACKS[id] || LYRIA_TRACKS.argon_glass_overture;
    return {
      ...track,
      muted: this.muted,
      musicVolume: this.musicVolume,
      sfxVolume: this.sfxVolume,
      jukeboxMode: this.jukeboxMode,
      refereeVoiceEnabled: this.refereeVoiceEnabled,
      refereeVoicePitch: this.refereeVoicePitch
    };
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    if (this.muted) {
      this._clearPendingVoiceCalls();
      if (this._briefingNarration) {
        this._stopBriefingUtterance(this._briefingNarration, true);
      } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try { window.speechSynthesis.cancel(); } catch {}
      }
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 1, this.ctx.currentTime);
    }
    const curId = this.currentTrackId || this.desiredTrackId;
    const track = LYRIA_TRACKS[curId];
    if (track?.type === 'synth') {
      if (this.muted) {
        this._stopSynthSequencer();
      } else {
        this._startSynthSequencer(curId);
      }
    } else {
      const el = this.audioElements.get(curId);
      if (el && track) {
        if (this.muted) {
          el.volume = 0;
        } else {
          el.volume = Math.min(1, track.baseVolume * this.musicVolume);
          if (el.paused) el.play().catch(() => {});
        }
      }
    }
    this._notifyTrackChange();
    return this.muted;
  }

  toggleMute() {
    return this.setMuted(!this.muted);
  }

  setMusicVolume(vol) {
    this.musicVolume = Math.max(0, Math.min(1, Number(vol)));
    const curId = this.currentTrackId || this.desiredTrackId;
    const track = LYRIA_TRACKS[curId];
    if (this.musicSynthGain && this.ctx && track) {
      this.musicSynthGain.gain.setValueAtTime(
        this.muted ? 0 : Math.min(1, this.musicVolume * track.baseVolume),
        this.ctx.currentTime
      );
    }
    if (!this.muted && curId && track?.type === 'audio') {
      const el = this.audioElements.get(curId);
      if (el) {
        el.volume = Math.min(1, track.baseVolume * this.musicVolume);
      }
    }
    this._notifyTrackChange();
  }

  setSfxVolume(vol) {
    this.sfxVolume = Math.max(0, Math.min(1, Number(vol)));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
  }

  setRefereeVoiceEnabled(enabled) {
    this.refereeVoiceEnabled = Boolean(enabled);
    if (!this.refereeVoiceEnabled) {
      this._clearPendingVoiceCalls();
      if (this._briefingNarration) {
        this._stopBriefingUtterance(this._briefingNarration, true);
      } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try { window.speechSynthesis.cancel(); } catch {}
      }
    }
    this._notifyTrackChange();
    return this.refereeVoiceEnabled;
  }

  toggleRefereeVoice() {
    const next = this.setRefereeVoiceEnabled(!this.refereeVoiceEnabled);
    if (next) {
      this.playVoiceCallout('Down! Handout, five-four.', { clearQueue: true, forceReferee: true });
    }
    return next;
  }

  setRefereeVoicePitch(pitch) {
    this.refereeVoicePitch = Math.max(0.5, Math.min(1.2, Number(pitch) || 0.72));
    return this.refereeVoicePitch;
  }

  _updateHudMusicBadge(info) {
    const el = document.getElementById('hud-music-title') || document.getElementById('music-track-label');
    if (el && info) {
      el.textContent = info.muted ? `\u{1F507} ${info.shortTitle || info.title}` : `\u266A ${info.shortTitle || info.title}`;
    }
  }

  // ==========================================================================
  // DEEP MALE REFEREE VOICE & STADIUM PA FORMANT SYNTHESIS
  // ==========================================================================

  _clearPendingVoiceCalls() {
    this._voiceGeneration += 1;
    this._voiceTimers.forEach((id) => clearTimeout(id));
    this._voiceTimers = [];
  }

  /**
   * Reserves speech for a briefing, including its silent reading time. Only an
   * explicit end (or a replacement briefing) returns the channel to the referee.
   * Completion may be synchronous when speech is muted or unavailable.
   */
  beginBriefingNarration(text, onComplete) {
    this.endBriefingNarration();
    this._clearPendingVoiceCalls();
    const owner = {
      token: ++this._briefingToken,
      utterance: null,
      completed: false,
      onComplete: typeof onComplete === 'function' ? onComplete : null
    };
    this._briefingNarration = owner;

    const speech = typeof window !== 'undefined' ? window.speechSynthesis : null;
    // A new owner may preempt ordinary speech. Ordinary calls never cancel it.
    if (speech) {
      try { speech.cancel(); } catch {}
    }
    const spokenText = String(text ?? '').trim();
    if (this.muted || !this.refereeVoiceEnabled || !spokenText || !speech ||
        typeof SpeechSynthesisUtterance === 'undefined') {
      this._finishBriefingNarration(owner);
      return owner.token;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(spokenText);
      const voice = this._cachedMaleVoice || this._selectDeepMaleVoice();
      if (voice) {
        this._cachedMaleVoice = voice;
        utterance.voice = voice;
      }
      utterance.lang = voice?.lang || 'en-GB';
      utterance.pitch = this.refereeVoicePitch;
      utterance.rate = this.refereeVoiceRate;
      utterance.volume = Math.min(1, this.sfxVolume * 0.98);
      owner.utterance = utterance;
      utterance.onend = () => this._finishBriefingNarration(owner);
      utterance.onerror = () => this._finishBriefingNarration(owner);
      speech.speak(utterance);
    } catch {
      this._finishBriefingNarration(owner);
    }
    return owner.token;
  }

  _finishBriefingNarration(owner) {
    if (this._briefingNarration !== owner || owner.token !== this._briefingToken || owner.completed) return;
    owner.completed = true;
    if (owner.utterance) {
      owner.utterance.onend = null;
      owner.utterance.onerror = null;
      owner.utterance = null;
    }
    const onComplete = owner.onComplete;
    owner.onComplete = null;
    // Keep ownership while the UI finishes its minimum reading time.
    onComplete?.();
  }

  _stopBriefingUtterance(owner, complete = false) {
    if (this._briefingNarration !== owner) return;
    if (owner.utterance) {
      owner.utterance.onend = null;
      owner.utterance.onerror = null;
      owner.utterance = null;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try { window.speechSynthesis.cancel(); } catch {}
      }
    }
    if (complete) this._finishBriefingNarration(owner);
  }

  endBriefingNarration() {
    const owner = this._briefingNarration;
    if (!owner) return;
    // Do not cancel any later ordinary speech when this owner already ended.
    this._stopBriefingUtterance(owner);
    owner.onComplete = null;
    this._briefingNarration = null;
    this._briefingToken += 1;
  }

  /**
   * Plays a subtle low-baritone stadium PA vocal formant cadence so every
   * referee call has physical show-court microphone presence.
   */
  _playRefereeBaritonePA(text = '') {
    const ctx = this._ensureContext();
    if (!ctx || this.muted) return;

    const words = String(text)
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 6);
    if (!words.length) return;

    const now = ctx.currentTime;
    const basePitchHz = 98 * (this.refereeVoicePitch / 0.72); // Deep ~98Hz male chest fundamental

    words.forEach((w, idx) => {
      const start = now + idx * 0.14;
      const dur = 0.11;
      const isExclaim = w.includes('!') || /down|out|nick|game|welcome|squash/i.test(w);
      const f0 = isExclaim ? basePitchHz * 1.12 : basePitchHz * (idx % 2 === 0 ? 1.0 : 0.88);

      const osc = ctx.createOscillator();
      const formant1 = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f0, start);
      osc.frequency.exponentialRampToValueAtTime(f0 * 0.86, start + dur);

      formant1.type = 'bandpass';
      formant1.frequency.setValueAtTime(isExclaim ? 580 : 460, start);
      formant1.Q.setValueAtTime(3.2, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.045, start + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0008, start + dur);

      osc.connect(formant1).connect(gain).connect(this.sfxGain);
      if (this.reverbSend) gain.connect(this.reverbSend);
      osc.start(start);
      osc.stop(start + dur + 0.01);
    });
  }

  announceScore(text, { delayMs = 0, playChime = true, forceReferee = false } = {}) {
    if (this._briefingNarration || this.muted || !text) return;
    if (!this.refereeVoiceEnabled && !forceReferee) return;

    const raw = String(text).trim();
    const ctx = this._ensureContext();
    if (ctx && playChime) {
      const start = ctx.currentTime + delayMs / 1000;
      const isFault = /down|out|not up/i.test(raw);
      const isMajor = /game|match|welcome|nick/i.test(raw);
      const chord = isFault
        ? [349.23, 293.66] // Authoritative referee low-fourth fault cadence
        : isMajor
          ? [523.25, 659.25, 783.99]
          : [440.0, 554.37];

      chord.forEach((freq, idx) => {
        const t = start + idx * 0.06;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = 'sine';
        osc2.type = 'triangle';
        osc2.detune.setValueAtTime(8, t);
        osc1.frequency.setValueAtTime(freq, t);
        osc2.frequency.setValueAtTime(freq, t);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.001, t);
        g.gain.linearRampToValueAtTime(0.05, t + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0008, t + 0.22);
        osc1.connect(g);
        osc2.connect(g);
        g.connect(this.sfxGain);
        if (this.reverbSend) g.connect(this.reverbSend);
        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + 0.24);
        osc2.stop(t + 0.24);
      });
    }

    this.playVoiceCallout(raw, {
      delayMs,
      clearQueue: delayMs === 0,
      forceReferee
    });
  }

  playVoiceCallout(text, { delayMs = 0, clearQueue = false, forceReferee = false } = {}) {
    if (this._briefingNarration || this.muted || !text) return;
    if (!this.refereeVoiceEnabled && !forceReferee) return;

    const norm = String(text).trim().toLowerCase();
    if (clearQueue) this._clearPendingVoiceCalls();
    const generation = this._voiceGeneration;

    const speakNow = () => {
      if (this._briefingNarration || generation !== this._voiceGeneration || this.muted) return;
      if (!this.refereeVoiceEnabled && !forceReferee) return;

      let spokenText = String(text);
      if (norm === 'start' || norm === 'match_start') {
        spokenText = this._welcomePlayed
          ? 'Love all. Play!'
          : 'Welcome to Virtual Squash! Love all. Play!';
        this._welcomePlayed = true;
      } else if (norm === 'welcome') {
        spokenText = 'Welcome to Virtual Squash!';
        this._welcomePlayed = true;
      } else if (norm === 'game set and match' || norm === 'game_set_match') {
        spokenText = 'Game and match!';
      } else {
        spokenText = spokenText
          .replace(/\b00\b/g, 'love')
          .replace(/\(Tin\)/gi, '')
          .replace(/\(Two Bounces\)/gi, '')
          .replace(/\(Missed Front Wall\)/gi, '')
          .replace(/•/g, ',')
          .replace(/\s*-\s*/g, ' ');
      }

      this.lastRefereeCallout = spokenText;
      if (typeof this.onRefereeCallout === 'function') {
        this.onRefereeCallout(spokenText);
      }
      // A presentation listener can claim narration during the notification.
      if (this._briefingNarration || generation !== this._voiceGeneration || this.muted) return;

      // Play subtle baritone PA backing resonance
      this._playRefereeBaritonePA(spokenText);

      // Speak with Deep Male Referee SpeechSynthesis voice
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance(spokenText);
          const maleVoice = this._cachedMaleVoice || this._selectDeepMaleVoice();
          if (maleVoice) {
            this._cachedMaleVoice = maleVoice;
            utter.voice = maleVoice;
          }
          utter.lang = maleVoice?.lang || 'en-GB';
          utter.pitch = this.refereeVoicePitch; // Deep male baritone (default 0.72)
          utter.rate = this.refereeVoiceRate;   // Measured referee cadence (default 0.95)
          utter.volume = Math.min(1, this.sfxVolume * 0.98);
          window.speechSynthesis.speak(utter);
        } catch {}
      }
    };

    if (delayMs > 0) {
      const timer = setTimeout(() => {
        this._voiceTimers = this._voiceTimers.filter((id) => id !== timer);
        speakNow();
      }, delayMs);
      this._voiceTimers.push(timer);
    } else {
      speakNow();
    }
  }

  // ==========================================================================
  // COURT & RACKET SOUND EFFECTS
  // ==========================================================================

  playSwingWhoosh(speed = 1) {
    if (this.muted) return;
    const ctx = this._ensureContext();
    if (!ctx || !this._pinkNoiseBuffer) return;
    const now = ctx.currentTime;
    const spd = Math.max(0.6, Math.min(1.8, Number(speed || 1)));
    const dur = 0.16;

    const src = ctx.createBufferSource();
    src.buffer = this._pinkNoiseBuffer;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.setValueAtTime(1.6, now);
    bp.frequency.setValueAtTime(320 * spd, now);
    bp.frequency.exponentialRampToValueAtTime(1380 * spd, now + dur * 0.55);
    bp.frequency.exponentialRampToValueAtTime(420, now + dur);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.11 * Math.min(1.2, spd), now + 0.025);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    src.connect(bp).connect(g).connect(this.sfxGain);
    src.start(now, Math.random() * 0.5, dur + 0.02);

    const osc = ctx.createOscillator();
    const og = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(175 * spd, now);
    osc.frequency.exponentialRampToValueAtTime(92, now + dur);
    og.gain.setValueAtTime(0.001, now);
    og.gain.linearRampToValueAtTime(0.055, now + 0.02);
    og.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(og).connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + dur + 0.01);
  }

  playRacketHit(shotType = 'topspin', quality = 'good') {
    if (this.muted) return;
    const ctx = this._ensureContext();
    if (!ctx || !this._noiseBuffer) return;
    const now = ctx.currentTime;
    const st = String(shotType || 'topspin').toLowerCase();
    const isKill = st === 'smash' || st === 'power_smash';
    const isSweet = quality === 'perfect' || quality === 'sweet_spot' || isKill;

    const src = ctx.createBufferSource();
    src.buffer = this._noiseBuffer;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(st === 'slice' ? 3600 : 2450, now);
    bp.Q.setValueAtTime(1.75, now);

    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.001, now);
    ng.gain.linearRampToValueAtTime(isKill ? 0.14 : 0.1, now + 0.004);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.028);
    src.connect(bp).connect(ng).connect(this.sfxGain);
    src.start(now, Math.random() * 0.5, 0.035);

    let fStart = 320, fEnd = 132, dur = 0.14;
    if (st === 'slice') {
      fStart = 460; fEnd = 185; dur = 0.16;
    } else if (st === 'lob') {
      fStart = 250; fEnd = 165; dur = 0.19;
    } else if (isKill) {
      fStart = 395; fEnd = 98; dur = 0.21;
    }

    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    o1.type = 'triangle';
    o2.type = 'sine';
    o2.detune.setValueAtTime(12, now);
    o1.frequency.setValueAtTime(fStart, now);
    o1.frequency.exponentialRampToValueAtTime(fEnd, now + dur);
    o2.frequency.setValueAtTime(fStart * 1.5, now);
    o2.frequency.exponentialRampToValueAtTime(fEnd, now + dur * 0.85);

    const tg = ctx.createGain();
    tg.gain.setValueAtTime(0.001, now);
    tg.gain.linearRampToValueAtTime(isKill ? 0.13 : 0.095, now + 0.006);
    tg.gain.exponentialRampToValueAtTime(0.001, now + dur);
    o1.connect(tg);
    o2.connect(tg);
    tg.connect(this.sfxGain);
    if (this.reverbSend) tg.connect(this.reverbSend);
    o1.start(now);
    o2.start(now);
    o1.stop(now + dur + 0.01);
    o2.stop(now + dur + 0.01);

    if (isSweet) {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const t = now + idx * 0.026;
        const c1 = ctx.createOscillator();
        const c2 = ctx.createOscillator();
        c1.type = 'sine';
        c2.type = 'triangle';
        c2.detune.setValueAtTime(10, t);
        c1.frequency.setValueAtTime(freq, t);
        c2.frequency.setValueAtTime(freq, t);
        const cg = ctx.createGain();
        cg.gain.setValueAtTime(0.001, t);
        cg.gain.linearRampToValueAtTime(0.048, t + 0.006);
        cg.gain.exponentialRampToValueAtTime(0.0008, t + 0.24);
        c1.connect(cg);
        c2.connect(cg);
        cg.connect(this.sfxGain);
        if (this.reverbSend) cg.connect(this.reverbSend);
        c1.start(t);
        c2.start(t);
        c1.stop(t + 0.25);
        c2.stop(t + 0.25);
      });
    }
  }

  playBallBounce(intensity = 1) {
    if (this.muted) return;
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const amp = Math.max(0.4, Math.min(1.2, Number(intensity || 1)));
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.095);
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.11 * amp, now + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(g).connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.11);

    if (this._pinkNoiseBuffer) {
      const src = ctx.createBufferSource();
      src.buffer = this._pinkNoiseBuffer;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(950, now);
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.001, now);
      ng.gain.linearRampToValueAtTime(0.045 * amp, now + 0.004);
      ng.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      src.connect(lp).connect(ng).connect(this.sfxGain);
      src.start(now, Math.random() * 0.4, 0.05);
    }
  }

  playServeToss() {
    if (this.muted) return;
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const dur = 0.22;
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    o1.type = 'sine';
    o2.type = 'sine';
    o2.detune.setValueAtTime(9, now);
    o1.frequency.setValueAtTime(290, now);
    o1.frequency.exponentialRampToValueAtTime(680, now + dur);
    o2.frequency.setValueAtTime(290, now);
    o2.frequency.exponentialRampToValueAtTime(680, now + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.075, now + 0.025);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    o1.connect(g);
    o2.connect(g);
    g.connect(this.sfxGain);
    o1.start(now);
    o2.start(now);
    o1.stop(now + dur + 0.01);
    o2.stop(now + dur + 0.01);
  }

  playCrowdReaction(type = 'cheer') {
    if (this.muted) return;
    const ctx = this._ensureContext();
    if (!ctx || !this._pinkNoiseBuffer) return;
    const now = ctx.currentTime;
    const kind = String(type || 'cheer').toLowerCase();

    if (kind === 'gasp' || kind === 'ooh') {
      const src = ctx.createBufferSource();
      src.buffer = this._pinkNoiseBuffer;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.setValueAtTime(2.4, now);
      bp.frequency.setValueAtTime(720, now);
      bp.frequency.exponentialRampToValueAtTime(410, now + 0.55);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.09, now + 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      src.connect(bp).connect(g).connect(this.sfxGain);
      if (this.reverbSend) g.connect(this.reverbSend);
      src.start(now, 0, 0.6);
      return;
    }

    const dur = kind === 'polite_clap' ? 0.85 : 1.35;
    const src = ctx.createBufferSource();
    src.buffer = this._pinkNoiseBuffer;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.setValueAtTime(1.1, now);
    bp.frequency.setValueAtTime(650, now);
    bp.frequency.exponentialRampToValueAtTime(1250, now + dur * 0.35);
    bp.frequency.exponentialRampToValueAtTime(780, now + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(kind === 'polite_clap' ? 0.075 : 0.115, now + 0.14);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    src.connect(bp).connect(g).connect(this.sfxGain);
    if (this.reverbSend) g.connect(this.reverbSend);
    src.start(now, 0, dur + 0.05);
  }

  playUiClick() {
    if (this.muted) return;
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.045);
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.05, now + 0.004);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(g).connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  playWallHit(surface = 'front_wall', speedRatio = 1) {
    if (this.muted) return;
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const amp = Math.max(0.35, Math.min(1.5, Number(speedRatio || 1)));
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    const f0 = surface === 'back_wall' ? 185 : surface === 'front_wall' ? 152 : 168;
    osc.frequency.setValueAtTime(f0, now);
    osc.frequency.exponentialRampToValueAtTime(52, now + 0.085);
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.14 * amp, now + 0.004);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(g).connect(this.sfxGain);
    if (this.reverbSend) g.connect(this.reverbSend);
    osc.start(now);
    osc.stop(now + 0.095);

    if (this._pinkNoiseBuffer) {
      const src = ctx.createBufferSource();
      src.buffer = this._pinkNoiseBuffer;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(surface === 'back_wall' ? 1450 : 1150, now);
      bp.Q.setValueAtTime(1.8, now);
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.001, now);
      ng.gain.linearRampToValueAtTime(0.065 * amp, now + 0.003);
      ng.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      src.connect(bp).connect(ng).connect(this.sfxGain);
      src.start(now, Math.random() * 0.4, 0.05);
    }
  }

  playTinClank() {
    if (this.muted) return;
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [420, 785, 1190].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = idx === 0 ? 'triangle' : 'square';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.82, now + 0.24);
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(idx === 0 ? 0.11 : 0.045, now + 0.004);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(g).connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.26);
    });
  }

  playNickRoll() {
    if (this.muted) return;
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(210, now);
    osc.frequency.exponentialRampToValueAtTime(68, now + 0.055);
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.095, now + 0.003);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(g).connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.065);
  }

  playShoeSqueak() {
    if (this.muted) return;
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2450 + Math.random() * 380, now);
    osc.frequency.exponentialRampToValueAtTime(1950, now + 0.065);
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.022, now + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(g).connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.075);
  }

  playRefereeWhistle(urgent = false) {
    if (this.muted) return;
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const dur = urgent ? 0.34 : 0.22;
    [2780, 2940].forEach((baseFreq, idx) => {
      const osc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(42, now);
      lfoGain.gain.setValueAtTime(65, now);
      lfo.connect(lfoGain).connect(osc.frequency);
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(idx === 0 ? 0.055 : 0.035, now + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, now + dur);
      osc.connect(g).connect(this.sfxGain);
      if (this.reverbSend) g.connect(this.reverbSend);
      lfo.start(now);
      osc.start(now);
      lfo.stop(now + dur + 0.01);
      osc.stop(now + dur + 0.01);
    });
  }

  playBodyImpactThud() {
    if (this.muted) return;
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(115, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.16);
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.18, now + 0.006);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
    osc.connect(g).connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.18);
    this.playRefereeWhistle(true);
  }
}

export default AudioEngine;

