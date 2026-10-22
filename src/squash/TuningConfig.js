// ============================================================================
// ARGON SQUASH — TUNING CONFIG, PRESET MANAGER & DETERMINISTIC SEED STORE
// Governing Principle: Build -> Play -> Observe -> Adjust -> Compare -> Keep/Revert
// ============================================================================

export const SIM_VERSION = '2.0.0-physical-chess';

/**
 * Operator-level tuning via Vite env vars (.env) — NOT a player preference.
 * e.g. VITE_SA_AI_SERVE_FOOT_FAULT_CHANCE=0.001  (see .env.example)
 */
const _envNum = (key, fallback) => {
  try {
    const raw = import.meta?.env?.[key];
    if (raw === undefined || raw === null || raw === '') return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
};

/**
 * Seeded Mulberry32 deterministic PRNG so A/B experiments and Nick Laboratory
 * launches are 100% reproducible.
 */
export function createSeededRNG(seed = 20261015) {
  let state = (Number(seed) || 20261015) >>> 0;
  return {
    next() {
      state = (state + 0x6D2B79F5) >>> 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    range(min, max) {
      return min + (max - min) * this.next();
    },
    getSeed() {
      return seed;
    }
  };
}

/**
 * Default experimental & arcade-assistance parameters grouped by domain module.
 * Fixed WSF court geometry lives in CourtGeometry.js (COURT_SPECS).
 */
export const DEFAULT_TUNING_PARAMS = {
  // --- 1. Ball Physics & Nick Collision Model ---
  ballPhysics: {
    gravity: 9.81,                  // m/s^2 standard gravity
    airDrag: 0.018,                 // aerodynamic drag coefficient
    magnusSpinCoupling: 0.012,      // Magnus lift/swerve from ball spin
    ballTemperatureC: 36.0,         // Squash ball temperature (20°C cold dead -> 45°C hot bouncy)
    frontWallRestitution: 0.68,     // Normal COR on front wall at reference temp
    sideWallRestitution: 0.66,      // Normal COR on side walls
    backWallRestitution: 0.64,      // Normal COR on back glass wall
    backWallSitUpLift: 1.05,        // Upward kick off back glass from floor-bounce forward topspin roll
    floorRestitution: 0.56,         // Normal COR on hardwood floor
    surfaceFriction: 0.80,          // Tangential velocity retention on bounce
    spinSurfaceBite: 0.024,         // How strongly underspin/topspin modifies rebound angle
    nickToleranceMeters: 0.048,     // Max wall-floor bevel distance for nick evaluation (4.8cm)
    nickVerticalEnergyLoss: 0.91,   // Fraction of vertical bounce absorbed in a true nick (0.91 -> 9% bounce)
    nickLateralRollBoost: 1.18,     // Tangential skid/roll transfer across floor on nick
    cornerBevelMeters: 0.055,       // Front-wall/side-wall vertical corner bevel zone
    trajectoryRibbonLength: 48,     // Trail sample count
    showFloorBounceMarkers: true    // Highlight 1st and 2nd bounce spots on floor
  },

  // --- 2. Racket & Shot Mechanics (Preparation vs Execution) ---
  shotMechanics: {
    baseDriveSpeedMps: 24.5,        // Base ball exit speed on clean straight drive (m/s)
    maxKillSpeedMps: 31.0,          // Aggressive volley kill speed (m/s)
    softDropSpeedMps: 11.4,         // Gentle disguised drop speed (m/s)
    defaultDriveCutDeg: 2.0,        // Nearly flat / slightly closed racket face for drives
    defaultDropCutDeg: 34.0,        // Open racket face cut angle (degrees) for drops/cuts
    lobLaunchAngleDeg: 38.0,        // Upward launch loft for high lobs
    prepFullChargeSec: 0.42,        // Time to reach full coiled backswing posture (disguise ready)
    timingSweetWindowSec: 0.18,     // Sweet-spot contact timing window
    placementAssistStrength: 0.45,  // 0.0 = pure simulation angles, 1.0 = high arcade target assist
    contactHeightReachMeters: 2.15, // Max overhead volley reach height
    spinMagnitudeScale: 1.0,        // Global multiplier on imparted cut/topspin
    biomechUncertainThreshold: 0.20,// Minimum evidence threshold before classifying FH/BH vs UNCERTAIN
    biomechLockThreshold: 0.48      // Hysteresis lock threshold to prevent stance flicker
  },

  // --- 3. Movement, Positioning & Physical Chess AI ---
  movementAndAI: {
    autoTReturn: true,              // Prominent AUTO-T-RETURN: ON / OFF
    showTCoverageGuide: true,       // Subtle floor visual showing T-recovery path & coverage
    playerMaxSpeedMps: 6.8,         // Realistic squash sprint speed (m/s)
    playerAccelerationMps2: 18.5,   // Acceleration / lunge burst (m/s^2)
    tRecoverySpeedScale: 0.86,      // Recovery pace multiplier toward the T (never instantaneous)
    tTargetZ: 0.92,                 // Z coordinate of tactical T recovery (just behind +0.565m short line)
    tTargetX: 0.0,                  // X coordinate of tactical T recovery
    aiAnticipationStrength: _envNum('VITE_SA_AI_ANTICIPATION', 0.68),   // How strongly AI leans based on pattern memory & windup disguise
    aiReactionDelayMs: _envNum('VITE_SA_AI_REACTION_DELAY_MS', 195),    // Split-step lag when player disguises a shot (ms)
    aiPatternMemoryLength: 4,       // Number of recent player shots tracked for rhythm/trance
    aiWinnerMarginChance: 0.20,
    aiAttackYawDeg: 0.75,
    aiAttackElevationDeg: 0.5,
    aiAttackPaceVariation: 0.02,
    aiAggression: _envNum('VITE_SA_AI_AGGRESSION', 0.55),               // Likelihood of AI playing attacking boasts/drops/kills vs length
    aiFrontCourtCreep: _envNum('VITE_SA_AI_FRONT_COURT_CREEP', 0.38),   // How far AI creeps up when expecting a short ball
    aiServeWrongBoxChance: _envNum('VITE_SA_AI_SERVE_WRONG_BOX_CHANCE', 0.04),    // Low-frequency accidental wrong service box (TASK-17)
    aiServeSelfCorrectChance: _envNum('VITE_SA_AI_SERVE_SELF_CORRECT_CHANCE', 0.55), // Chance the AI notices and walks to the correct box mid-stance
    aiServeFootFaultChance: _envNum('VITE_SA_AI_SERVE_FOOT_FAULT_CHANCE', 0.001),  // Rare foot fault (~1 in 1000 serves — not even once a day)
    aiExecutionSkill: _envNum('VITE_SA_AI_EXECUTION_SKILL', 0.65),                 // ONE scalar driving all AI error channels via aiErrorChannelsFromSkill (TASK-26)
    aiFlairAttemptChance: _envNum('VITE_SA_AI_FLAIR_ATTEMPT_CHANCE', 0.04),        // Occasional low-percentage flair shot attempt
    aiFatiguePerGame: 0.04,         // Fatigue multiplier contribution per completed game
    aiFatiguePerPoint: 0.004,       // Fatigue multiplier contribution per point played
    aiFatiguePerRallyStroke: 0.015, // Fatigue multiplier contribution per stroke in last rally
    aiFatigueCap: 1.6               // Upper bound on runtime fatigue error multiplier
  },

  // --- 4. Court & Rules Configuration ---
  rulesAndView: {
    courtTheme: 'psa_glass',        // 'psa_glass' | 'hardwood_club' | 'neon_studio'
    scoringMode: 'PAR_11',          // 'PAR_11' | 'ARCADE_5' | 'HIHO_9'
    tinHeightMeters: 0.48,          // 0.48m club / 0.43m PSA pro
    interferenceRule: 'LET_STROKE', // 'LET_STROKE' | 'ARCADE_NO_FAULT'
    handedness: 'right',            // 'right' | 'left' player handedness for biomechanical classifier
    refereeVoiceEnabled: true,      // Deep male WSF referee voice callouts ("Down! Handout, five-four")
    refereeVoicePitch: 0.72,        // Deep baritone pitch multiplier (0.55 - 1.10)
    deterministicSeed: 20261015
  }
};

/**
 * TASK-26 — Per-shot charge envelopes (§5.9).
 * Charge sharpens pace (KILL) or adds depth (DROP) within these bounds.
 * LOB's emergentContactBandM is descriptive (validator input), never a solver input.
 * DRIVE/BOAST: null — existing charge behavior unchanged.
 */
export const SHOT_CHARGE_ENVELOPES = Object.freeze({
  LOB: Object.freeze({ minPaceMps: 9.0, maxPaceMps: 15.5, emergentContactBandM: Object.freeze([4.10, 4.90]) }),
  KILL: Object.freeze({ minPaceMps: 24.0, maxPaceMps: 31.0, emergentContactBandM: null }),
  DROP: Object.freeze({ minPaceMps: 6.0, maxPaceMps: 9.5, emergentContactBandM: null }),
  DRIVE: null,
  BOAST: null
});

/**
 * TASK-26 — Pure mapping from the ONE aiExecutionSkill scalar to all AI error
 * channels (§5.9). Monotone, calibrated through anchors:
 *   casual 0.65 -> { tin 0.22, out ~0.11, lobOut 0.30, sigma 0.08, jitter ~3.5° }
 *   pro    0.93 -> { tin 0.04, out ~0.02, lobOut 0.06, sigma 0.02, jitter ~0.8° }
 * Fatigue scales ALL channels uniformly at runtime (game_engine.js wiring) and
 * never changes shot selection.
 */
export function aiErrorChannelsFromSkill(skill) {
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  return {
    aiKillTinChance: clamp(0.638 - 0.643 * skill, 0.02, 0.34),
    aiKillOutChance: clamp(0.318 - 0.318 * skill, 0.02, 0.18),
    aiLobOutChance: clamp(0.857 - 0.857 * skill, 0.03, 0.45),
    aiExecutionNoiseSigma: clamp(0.219 - 0.214 * skill, 0.01, 0.12),
    aiAimJitterDeg: clamp(10.4 - 10.3 * skill, 0.5, 4.5)
  };
}

export const BUILTIN_PRESETS = {
  'Physical Chess (Default)': structuredClone(DEFAULT_TUNING_PARAMS),

  'Arcade Accessible (Forgiving Nick & Fast Footwork)': (() => {
    const p = structuredClone(DEFAULT_TUNING_PARAMS);
    p.ballPhysics.ballTemperatureC = 40.0;
    p.ballPhysics.nickToleranceMeters = 0.068;
    p.ballPhysics.nickVerticalEnergyLoss = 0.94;
    p.shotMechanics.placementAssistStrength = 0.78;
    p.movementAndAI.playerMaxSpeedMps = 7.6;
    p.movementAndAI.playerAccelerationMps2 = 22.0;
    p.movementAndAI.aiReactionDelayMs = 240;
    return p;
  })(),

  'PSA Tour Simulation (Strict Pro)': (() => {
    const p = structuredClone(DEFAULT_TUNING_PARAMS);
    p.ballPhysics.ballTemperatureC = 37.5;
    p.ballPhysics.nickToleranceMeters = 0.036;
    p.ballPhysics.nickVerticalEnergyLoss = 0.92;
    p.shotMechanics.placementAssistStrength = 0.18;
    p.movementAndAI.playerMaxSpeedMps = 6.5;
    p.movementAndAI.aiAnticipationStrength = 0.82;
    p.movementAndAI.aiReactionDelayMs = 155;
    p.movementAndAI.aiAggression = 0.72;
    p.rulesAndView.tinHeightMeters = 0.43;
    return p;
  })(),

  'Cold Dead Ball (Winter Club)': (() => {
    const p = structuredClone(DEFAULT_TUNING_PARAMS);
    p.ballPhysics.ballTemperatureC = 22.0;
    p.ballPhysics.floorRestitution = 0.48;
    p.ballPhysics.frontWallRestitution = 0.60;
    p.rulesAndView.courtTheme = 'hardwood_club';
    return p;
  })()
};

const STORAGE_KEY = 'argon_squash_tuning_presets_v2';

export class TuningConfigStore {
  constructor() {
    this.version = SIM_VERSION;
    this.presets = structuredClone(BUILTIN_PRESETS);
    this.activePresetName = 'Physical Chess (Default)';
    this.comparePresetName = 'Arcade Accessible (Forgiving Nick & Fast Footwork)';
    this.params = structuredClone(DEFAULT_TUNING_PARAMS);
    this.listeners = new Set();
    this.experimentHistory = [];
    this._loadPersistedPresets();
  }

  _loadPersistedPresets() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.presets === 'object') {
          this.presets = { ...structuredClone(BUILTIN_PRESETS), ...parsed.presets };
        }
        if (parsed && parsed.activePresetName && this.presets[parsed.activePresetName]) {
          this.activePresetName = parsed.activePresetName;
          this.params = this._mergeWithDefaults(this.presets[this.activePresetName]);
        }
      }
    } catch (e) {
      console.warn('[TuningConfigStore] Could not load persisted presets:', e);
    }
  }

  _persistPresets() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: this.version,
          activePresetName: this.activePresetName,
          presets: this.presets
        })
      );
    } catch {}
  }

  _mergeWithDefaults(partial) {
    const base = structuredClone(DEFAULT_TUNING_PARAMS);
    if (!partial || typeof partial !== 'object') return base;
    for (const section of Object.keys(base)) {
      if (partial[section] && typeof partial[section] === 'object') {
        Object.assign(base[section], partial[section]);
      }
    }
    return base;
  }

  get() {
    return this.params;
  }

  /**
   * Computes dynamic temperature-adjusted restitution multiplier based on squash ball warmth.
   * Reference 36°C = 1.0x. Range ~20°C (0.82x) to 45°C (1.14x).
   */
  getTemperatureBounceFactor(params = this.params) {
    const temp = Number(params?.ballPhysics?.ballTemperatureC ?? 36.0);
    return Math.max(0.76, Math.min(1.18, 1.0 + (temp - 36.0) * 0.011));
  }

  setParam(section, key, value) {
    if (!this.params[section]) return;
    this.params[section][key] = value;
    this.presets[this.activePresetName] = structuredClone(this.params);
    this._persistPresets();
    this._emitChange({ section, key, value });
  }

  selectPreset(name) {
    if (!this.presets[name]) return false;
    this.activePresetName = name;
    this.params = this._mergeWithDefaults(this.presets[name]);
    this._persistPresets();
    this._emitChange({ type: 'preset_select', name });
    return true;
  }

  savePresetAs(name) {
    const cleanName = String(name || '').trim() || `Custom Preset ${Object.keys(this.presets).length + 1}`;
    this.presets[cleanName] = structuredClone(this.params);
    this.activePresetName = cleanName;
    this._persistPresets();
    this._emitChange({ type: 'preset_save', name: cleanName });
    return cleanName;
  }

  duplicateActivePreset(customName = null) {
    const baseName = customName || `${this.activePresetName} (Copy)`;
    return this.savePresetAs(baseName);
  }

  resetModule(section) {
    if (!DEFAULT_TUNING_PARAMS[section]) return;
    this.params[section] = structuredClone(DEFAULT_TUNING_PARAMS[section]);
    this.presets[this.activePresetName] = structuredClone(this.params);
    this._persistPresets();
    this._emitChange({ type: 'reset_module', section });
  }

  resetAll() {
    this.params = structuredClone(DEFAULT_TUNING_PARAMS);
    this.presets[this.activePresetName] = structuredClone(this.params);
    this._persistPresets();
    this._emitChange({ type: 'reset_all' });
  }

  exportJSON() {
    return JSON.stringify(
      {
        simVersion: this.version,
        exportedAt: new Date().toISOString(),
        presetName: this.activePresetName,
        params: this.params
      },
      null,
      2
    );
  }

  importJSON(jsonString) {
    const parsed = JSON.parse(jsonString);
    const targetParams = parsed.params || parsed;
    const name = parsed.presetName || `Imported ${new Date().toLocaleTimeString()}`;
    this.params = this._mergeWithDefaults(targetParams);
    this.presets[name] = structuredClone(this.params);
    this.activePresetName = name;
    this._persistPresets();
    this._emitChange({ type: 'import_json', name });
    return name;
  }

  recordExperimentResult(result) {
    const entry = {
      id: `EXP-${this.experimentHistory.length + 1}`,
      timestamp: new Date().toISOString(),
      simVersion: this.version,
      presetName: this.activePresetName,
      seed: this.params.rulesAndView.deterministicSeed,
      paramsSnapshot: structuredClone(this.params),
      ...result
    };
    this.experimentHistory.unshift(entry);
    if (this.experimentHistory.length > 25) this.experimentHistory.pop();
    return entry;
  }

  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  _emitChange(detail) {
    for (const fn of this.listeners) {
      try {
        fn(this.params, detail, this);
      } catch (e) {
        console.error('[TuningConfigStore] Listener error:', e);
      }
    }
  }
}

export const tuningStore = new TuningConfigStore();
export default tuningStore;
