import { registerHooks } from 'node:module';
import { Vector3, Group } from 'three';
import { RulesEngine } from '../src/squash/RulesEngine.js';
import { PointPresentation } from '../src/squash/PointPresentation.js';
import { ShotController } from '../src/squash/ShotController.js';
import { DEFAULT_TUNING_PARAMS } from '../src/squash/TuningConfig.js';
// Mirror the existing Vite import alias; never replace gameplay modules.
registerHooks({resolve(specifier,context,next){return next(specifier.endsWith('/assets/vendor/GLTFLoader.js')?'three/examples/jsm/loaders/GLTFLoader.js':specifier,context);}});
globalThis.window={addEventListener(){},innerWidth:1440,innerHeight:900};
globalThis.document={getElementById(){return null;}};
const {ArgonSquashEngine}=await import('../src/game_engine.js');
export function engineFixture() {
  const e=Object.create(ArgonSquashEngine.prototype);
  const actor=role=>({role,pos:new Vector3(role==='player'?1.85:-1.45,0,1.515),vel:new Vector3(),targetPos:new Vector3(role==='player'?1.85:-1.45,0,1.515),root:new Group(),swingArcMesh:{visible:false},swingCooldown:0});
  Object.assign(e,{player:actor('player'),opponent:actor('opponent'),phase:'RALLY',phaseTimer:0,elapsedTime:0,pointPresentation:new PointPresentation(),pendingPointOutcome:null,
    rulesEngine:new RulesEngine({gamesToWin:1,scoringMode:'ARCADE_5'}),shotController:new ShotController(),
    ball:{pos:new Vector3(1,.5,-3),vel:new Vector3(0,-1,1),spin:new Vector3(),inPlay:true,bounceCountOnFloor:1},
    tuningStore:{params:structuredClone(DEFAULT_TUNING_PARAMS),getTemperatureBounceFactor(){return 1;}},
    hud:{showCenterBanner(){},updateScoreboard(){},setReplayMode(){},showVictoryModal(){e.victoryShown=true;},hideCenterBanner(){},updateTimingGauge(){}},
    ballTrail:{clear(){},pushPoint(){},setStyle(){}},motionController:{keysDown:new Set()},
    matchConfig:{gamesToWin:1,scoringSystem:'ARCADE_5'},bannerSeq:0});
  e.score=e.rulesEngine.score;
  return e;
}
