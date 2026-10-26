import ts from 'typescript';
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { requireBuildAll } from './build-context.mjs';
import { RulesEngine } from '../src/squash/RulesEngine.js';
requireBuildAll();
process.chdir(resolve(import.meta.dirname,'..'));
const output='DOCS/AUDIO';
await mkdir(output,{recursive:true});
const sha=value=>createHash('sha256').update(value).digest('hex');
const files=[];
async function walk(dir){for(const item of await readdir(dir,{withFileTypes:true})){const path=dir+'/'+item.name;if(item.isDirectory())await walk(path);else if(/\.js$/.test(path))files.push(path);}}
await walk('src');
files.sort();
const sinks=new Set(['announceScore','playVoiceCallout','beginBriefingNarration']);
const producers=new Set(['speech','callout','refereeCallout','safetyWarningText']);
const entries=[],calls=[],sourceFiles=[],lexicons=[],backendSinks=[];
function scope(node){for(let p=node.parent;p;p=p.parent)if(ts.isMethodDeclaration(p)||ts.isFunctionDeclaration(p)||ts.isArrowFunction(p)||ts.isFunctionExpression(p))return p;return node.getSourceFile();}
function owner(node){for(let p=node.parent;p;p=p.parent){if((ts.isMethodDeclaration(p)||ts.isFunctionDeclaration(p))&&p.name)return p.name.getText();if(ts.isVariableDeclaration(p)&&p.name)return p.name.getText();}return 'module';}
function variants(expr,context,seen=new Set()){
  if(!expr)return [];
  if(ts.isStringLiteral(expr)||ts.isNoSubstitutionTemplateLiteral(expr))return [{kind:'fixed',text:expr.text}];
  if(ts.isParenthesizedExpression(expr))return variants(expr.expression,context,seen);
  if(ts.isConditionalExpression(expr))return [...variants(expr.whenTrue,context,seen),...variants(expr.whenFalse,context,seen)];
  if(ts.isBinaryExpression(expr)&&expr.operatorToken.kind===ts.SyntaxKind.BarBarToken)return [...variants(expr.left,context,seen),...variants(expr.right,context,seen)];
  if(ts.isBinaryExpression(expr)&&expr.operatorToken.kind===ts.SyntaxKind.PlusToken){
    const a=variants(expr.left,context,seen),b=variants(expr.right,context,seen);
    return a.flatMap(x=>b.map(y=>({kind:x.kind==='fixed'&&y.kind==='fixed'?'fixed':'template',text:x.text+y.text}))).slice(0,128);
  }
  if(ts.isPropertyAccessExpression(expr)&&expr.getText()==='this.score.serviceSide')return ['left','right'].map(text=>({kind:'fixed',text}));
  if(ts.isTemplateExpression(expr)){
    let all=[{kind:'fixed',text:expr.head.text}];
    for(const part of expr.templateSpans){const choices=variants(part.expression,context,seen);all=all.flatMap(x=>choices.map(y=>({kind:x.kind==='fixed'&&y.kind==='fixed'?'fixed':'template',text:x.text+y.text+part.literal.text}))).slice(0,128);}
    return all;
  }
  if(ts.isIdentifier(expr)&&!seen.has(expr.text)){
    const next=new Set(seen);next.add(expr.text);const definitions=[];
    const region=scope(context);
    const visit=node=>{if(node!==region&&(ts.isMethodDeclaration(node)||ts.isFunctionDeclaration(node)||ts.isArrowFunction(node)||ts.isFunctionExpression(node)))return;if(ts.isVariableDeclaration(node)&&node.name.getText()===expr.text&&node.initializer)definitions.push(node.initializer);ts.forEachChild(node,visit);};
    visit(region);
    if(definitions.length)return definitions.flatMap(node=>variants(node,context,next)).slice(0,128);
  }
  return [{kind:'template',text:'{'+expr.getText().replace(/\s+/g,' ')+'}'}];
}
function add(file,sf,node,category,expr){
  const location={file,line:sf.getLineAndCharacterOfPosition(node.getStart()).line+1,owner:owner(node)};
  for(const value of variants(expr,node))entries.push({id:sha(category+'\0'+file+'\0'+location.owner+'\0'+value.text).slice(0,16),category,...value,source:location,expression:expr?.getText().replace(/\s+/g,' ')});
}
for(const file of files){
  const text=await readFile(file,'utf8');
  const sf=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  sourceFiles.push({file,sha256:sha(text)});
  const visit=node=>{
    if(ts.isNewExpression(node)&&node.expression.getText()==='SpeechSynthesisUtterance')backendSinks.push({file,line:sf.getLineAndCharacterOfPosition(node.getStart()).line+1,owner:owner(node),argument:node.arguments?.[0]?.getText()});
    if(ts.isCallExpression(node)&&ts.isPropertyAccessExpression(node.expression)){
      const method=node.expression.name.text;
      if(sinks.has(method)){
        calls.push({file,line:sf.getLineAndCharacterOfPosition(node.getStart()).line+1,owner:owner(node),sink:method,argument:node.arguments[0]?.getText()||'',resolved:variants(node.arguments[0],node)});
        if(!['announceScore','playVoiceCallout','beginBriefingNarration'].includes(owner(node)))add(file,sf,node,'speech-input',node.arguments[0]);
      }
      if(method==='push'&&file.endsWith('/RulesEngine.js')&&owner(node)==='formatRefereeCallout')add(file,sf,node,'score-fragment',node.arguments[0]);
    }
    if(ts.isPropertyAssignment(node)&&producers.has(node.name.getText().replaceAll(/["']/g,''))){
      const category=file.endsWith('/ArcadeBriefing.js')?'briefing':owner(node)==='NARRATOR_USP_INVITES'?'legacy-USP':'rules-or-safety-producer';
      add(file,sf,node,category,node.initializer);
    }
    if(ts.isBinaryExpression(node)&&node.operatorToken.kind===ts.SyntaxKind.EqualsToken&&node.left.getText()==='spokenText')add(file,sf,node,'transport-alias-or-normalization',node.right);
    if(ts.isVariableDeclaration(node)&&node.name.getText()==='words'&&ts.isArrayLiteralExpression(node.initializer)&&file.endsWith('/RulesEngine.js'))lexicons.push({kind:'number-words',source:{file,line:sf.getLineAndCharacterOfPosition(node.getStart()).line+1},values:node.initializer.elements.map((x,n)=>({value:n,text:x.text}))});
    ts.forEachChild(node,visit);
  };
  visit(sf);
}
const html=await readFile('index.html','utf8');
sourceFiles.push({file:'index.html',sha256:sha(html)});
const manualButtons=[...html.matchAll(/data-callout="([^"]+)"/g)].map(match=>({value:match[1],source:{file:'index.html',line:html.slice(0,match.index).split('\n').length},kind:['USP_INVITE','WELCOME'].includes(match[1])?'control-token':'fixed-speech'}));
for(const button of manualButtons.filter(x=>x.kind==='fixed-speech'))entries.push({id:sha('manual:'+button.value).slice(0,16),category:'manual-preview',kind:'fixed',text:button.value,source:{...button.source,owner:'jukebox-call-button'}});
entries.push({id:'identity-fallback',category:'bundled-fallback',kind:'fixed',text:'The user is always represented in the game as the red player.',source:{file:'src/audio_engine.js',line:1531,owner:'_playIdentityFallback'},asset:'public/assets/audio/red-player-identity.wav'});
const unique=[...new Map(entries.map(entry=>[entry.id,entry])).values()];
const fixed=[...new Set(unique.filter(x=>x.kind==='fixed'&&x.category!=='score-fragment').map(x=>x.text))].sort();
// This is a generation bank, not a behavioral test or a game score cap.
// Enumerate the production formatter and deduplicate its exact output.
const bank=new Map(),maxScore=30;
const reasons=['','Down','Out','Not up','Nick','Stroke','Yes let','NO_LET','Foot fault','Serve fault'];
const remember=(text,meta)=>{if(!bank.has(text))bank.set(text,meta);};
for(const mode of ['PAR_11','ARCADE_5','HIHO_9']){
  const rules=new RulesEngine({scoringMode:mode,gamesToWin:2});
  const target=rules.getTargetPointsToWinGame(),winBy=mode==='ARCADE_5'?1:2;
  for(let p=0;p<=maxScore;p++)for(let o=0;o<=maxScore;o++){
    const terminal=Math.max(p,o)>=target&&Math.abs(p-o)>=winBy;
    const terminalReachable=terminal&&(Math.max(p,o)===target||Math.abs(p-o)===winBy);
    if(terminal&&!terminalReachable)continue;
    if(mode==='ARCADE_5'&&Math.max(p,o)>target)continue;
    for(const reason of reasons){
      if(terminal){for(const end of ['game','match']){
        rules.score.playerPoints=p;rules.score.opponentPoints=o;
        const outcome={finalPointScore:{playerPoints:p,opponentPoints:o},[end==='game'?'gameWonBy':'matchWonBy']:p>o?'player':'opponent'};
        remember(rules.formatRefereeCallout(outcome,reason),{kind:'completion',mode,end,score:[p,o],reason});
      }}else for(const server of ['player','opponent'])for(const handout of [false,true])for(const matchPoint of [false,true]){
        Object.assign(rules.score,{playerPoints:p,opponentPoints:o,server,handOutJustOccurred:handout,playerGames:matchPoint?1:0,opponentGames:matchPoint?1:0});
        remember(rules.formatRefereeCallout({serviceChanged:handout},reason),{kind:'score',mode,score:[p,o],server,handout,matchPoint,reason});
      }
    }
  }
}
const bankEntries=[...bank].map(([text,context])=>({id:'score-'+sha(text).slice(0,16),text,spokenText:text.replace(/\s*-\s*/g,' '),context}));
const fixedCharacters=fixed.reduce((sum,text)=>sum+text.length,0);
const bankCharacters=bankEntries.reduce((sum,row)=>sum+row.spokenText.length,0);
const scoreClauses=[...new Set(bankEntries.filter(row=>row.context.reason==='').map(row=>row.spokenText.replace(/ (?:Game|Match) Ball!$/,'')))].sort();
const eligibleCategories=new Set(['briefing','speech-input','manual-preview','bundled-fallback','transport-alias-or-normalization']);
const fixedCandidates=[...new Set(unique.filter(row=>row.kind==='fixed'&&eligibleCategories.has(row.category)).map(row=>row.text))].sort();
const clipProposal={status:'generation proposal; no provider synthesis performed',numberWindow:[0,maxScore],fixedCandidates:fixedCandidates.map(text=>({id:'fixed-'+sha(text).slice(0,16),text})),scoreClauses:scoreClauses.map(text=>({id:'clause-'+sha(text).slice(0,16),text})),faultClips:['Down!','Out!','Not up!','Nick!','Stroke!','Yes, let!','No let!','Foot fault!','Fault!'],stakesClips:['Game Ball!','Match Ball!'],policy:'Use complete naturally spoken score clauses, not individual number-word stitching. Prefix/stakes clips join at real sentence pauses. Keep fixed instructions whole. Exclude legacy invitations and disconnected safety producers until content/wiring is resolved. Scores beyond the bank remain an explicit same-voice prefetch/offline-caption design decision; never fall back to an arbitrary device voice.'};
clipProposal.summary={candidateClips:fixedCandidates.length+scoreClauses.length+clipProposal.faultClips.length+clipProposal.stakesClips.length,characters:[...fixedCandidates,...scoreClauses,...clipProposal.faultClips,...clipProposal.stakesClips].reduce((sum,text)=>sum+text.length,0)};
const catalog={generatedAt:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),scope:'Repository-defined speech sinks, producers and grammar; not an exhaustive literal set for open numeric/public-text domains.',sourceFiles,summary:{sourceFiles:sourceFiles.length,speechCallSites:calls.length,inventoryEntries:unique.length,uniqueFixedTextsIncludingUnconfirmedProducers:fixed.length,fixedCharacters,scoreBankMaximum:maxScore,scoreBankUtterances:bankEntries.length,scoreBankCharacters:bankCharacters},closedGrammar:{scoreModes:['PAR_11','ARCADE_5','HIHO_9'],targets:[11,5,9],winBy:{PAR_11:2,ARCADE_5:1,HIHO_9:2},numberDomain:'nonnegative integer; no configured maximum for win-by-two',serverRoles:['player','opponent'],serviceSides:['left','right'],faultPrefixes:['','Down!','Out!','Not up!','Nick!','Stroke!','Yes, let!','No let!','Foot fault!','Fault!'],handout:['','Handout, '],scoreForms:['{server} {receiver}.','{n} all.'],stakes:['','Game Ball!','Match Ball!'],completions:['Game! {winner} {loser}.','Game and match! {winner} {loser}.'],warnings:{namedPlayers:['Player 1','Player 2'],repeatClass:['first','SECOND SAFETY WARNING']},externalTextBoundary:'AudioEngine generic methods currently accept arbitrary text. Full closure requires future clip-ID/grammar enforcement; developer-console or external callers are not enumerated by this repo inventory.'},entries:unique,callSites:calls,backendSinks,manualButtons,lexicons,existingAssets:[{path:'public/assets/audio/red-player-identity.wav',text:'The user is always represented in the game as the red player.',backend:'bundled Microsoft David recording; source differs from browser-selected voice'}],knownGaps:[
  'NARRATOR_USP_INVITES remains defined, but current engine triggerNarratorUSPInvite opens ArcadeBriefing; mark the three old invitations retained/legacy rather than automatically generating outdated left-menu instructions.',
  'RulesEngine.evaluateBallPlayerBodyCollision expects positional arguments/returns hitPlayer, while game_engine passes an object and checks rallyEnded; body-warning producer text is not proven reachable through this mismatched wiring.',
  'RulesEngine.resolveLetAppeal returns callout, but _replayLetRally reads refereeCallout; the current route can fall back to the generic Yes, Let! Play a let. rather than the detailed reason.',
  'Speech normalization strips parenthetical reasons, bullets and hyphens only on the ordinary referee path; briefing narration uses raw text.',
  'Point award and post-replay completion can announce the same result twice. A replacement pack must retain event/owner identity and avoid duplicate/interrupted playback.',
  'The browser fallback covers only the identity sentence, not complete narration; generic unmapped speech cannot silently reintroduce device voice variation.'
]};
await writeFile(output+'/speech-catalog.json',JSON.stringify(catalog,null,2)+'\n');
await writeFile(output+'/score-generation-bank.json',JSON.stringify({generatedAt:catalog.generatedAt,sourceCommit:catalog.sourceCommit,maximum:maxScore,scope:'Bounded production-formatter generation bank, not a game limit or exhaustive closed literal inventory.',utterances:bankEntries},null,2)+'\n');
await writeFile(output+'/phrase-generation-plan.json',JSON.stringify(clipProposal,null,2)+'\n');
const lines=['# Speech map — Virtual Squash','',`Generated ${catalog.generatedAt}. Source commit ${catalog.sourceCommit}; individual file hashes are in speech-catalog.json.`,'',
  `Found ${calls.length} speech call sites, ${unique.length} inventory records and ${fixed.length} unique fixed texts including unconfirmed/legacy producers. The optional score bank contains ${bankEntries.length} full utterances through score ${maxScore}.`,'',
  'This is the complete source-linked map of repository-owned speech inputs/producers and their grammar. It is not a claim that all producer branches are currently wired or that a finite bank covers the uncapped win-by-two score domain.','',
  '## Fixed utterances and templates',''];
for(const category of [...new Set(unique.map(x=>x.category))]){
  lines.push('### '+category,'');
  for(const entry of unique.filter(x=>x.category===category))lines.push(`- **${entry.kind}** — ${entry.text}\n  Source: ${entry.source.file}:${entry.source.line} (${entry.source.owner}); id ${entry.id}.`);
  lines.push('');
}
lines.push('## Dynamic closed grammar','',JSON.stringify(catalog.closedGrammar,null,2),'','## Every speech call site','');
for(const call of calls)lines.push(`- ${call.file}:${call.line} ${call.owner} → ${call.sink}(${call.argument.replace(/\s+/g,' ')})`);
lines.push('','## Gaps that must not be hidden by generation','',...catalog.knownGaps.map(x=>'- '+x),'',
  '## Practical generation proposal','',`${scoreClauses.length} full score clauses plus nine fault prefixes, two stakes clips and reviewed fixed narration cover the bounded score bank without rendering all ${bankEntries.length} whole combinations. These are sentence/score clauses, not isolated number tokens. The score bank is not a game cap. See phrase-generation-plan.json; no audio has been generated.`,'',
  '## Voice-pack recommendation','',
  'Select fixed provider/voice identities, render complete fixed instructions and natural full score calls once, retain pronunciation/performance direction and source hashes, then bundle the approved audio. Do not pitch-shift an arbitrary OS voice or assemble every word with mechanical gaps. The optional score bank is a coverage/budget aid; uncapped extension needs an explicit consistent-voice policy. No synthesis, provider replacement or listening acceptance is claimed by this inventory.','');
await writeFile(output+'/SPEECH_MAP.md',lines.join('\n'));
console.log(JSON.stringify(catalog.summary));
