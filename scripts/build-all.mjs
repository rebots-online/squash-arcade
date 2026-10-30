import { spawn, execFileSync } from 'node:child_process';
import { open, readdir, readFile, writeFile, mkdir, cp, stat, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, resolve, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setSourceVersion } from './source-version.mjs';
import { requireBuildAll } from './build-context.mjs';
import { artifactNames, targets } from './build-targets.mjs';
import { assertProductIdentity } from './build-product.mjs';
import { publishWeb } from './publish-web.mjs';
import { accountBuildEnvironment } from './account-config.mjs';
import { resolveBuildEnvironment } from './resolve-build-env.mjs';
requireBuildAll();

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
process.chdir(root);
if(process.platform!=='win32') throw new Error('This manual recipe coordinates the provisioned Windows/Android tools and WSL AppImage builder from Windows.');
const lockPath=join(root,'.build-lock');
const lock=await open(lockPath,'wx').catch(error=>{throw new Error(`A build is already locked at ${lockPath}: ${error.message}`);});
await lock.writeFile(JSON.stringify({pid:process.pid,startedAt:new Date().toISOString()}));
const roots=['build_all.sh','src','public','scripts','src-tauri','index.html','account-auth.html','package.json','package-lock.json','version.txt','tsconfig.json','vite.config.ts'];
async function sourceFiles(){
  const files=[];
  async function visit(path){
    if(path==='public/deployment.json'||/^src-tauri\/(target|gen)(\/|$)/.test(path))return;
    const info=await stat(path);
    if(info.isDirectory())for(const name of await readdir(path))await visit(path+'/'+name);
    else files.push(path);
  }
  for(const path of roots)await visit(path);
  return files.sort();
}
async function fingerprint(files){
  const sum=createHash('sha256');
  for(const file of files)sum.update(file).update('\0').update(await readFile(file)).update('\0');
  return sum.digest('hex');
}
const run=(command,args,options={})=>new Promise((done,fail)=>{
  const child=spawn(command,args,{cwd:root,stdio:'inherit',windowsHide:true,...options});
  child.once('error',fail);child.once('exit',code=>code===0?done():fail(new Error(`${command} exited ${code}`)));
});
let manifest,runDirectory,releaseDirectory,inventoryPath,webPublication;
try {
  await resolveBuildEnvironment(root);
  const accountEnvironment = accountBuildEnvironment(root);
  await assertProductIdentity();
  await run(process.execPath,['scripts/catalog-speech.mjs']);
  const pendingVersion=(await readFile('version.txt','utf8')).trim();
  const [pendingMajor,pendingMinor]=pendingVersion.split('.');
  const version=`${pendingMajor}.${pendingMinor}.${String(Math.floor(Date.now()/60000)%100000).padStart(5,'0')}`;
  if(version!==pendingVersion)await setSourceVersion(version);
  const pkg=JSON.parse(await readFile('package.json','utf8'));
  if(pkg.version!==version)throw new Error('Canonical and package versions differ.');
  const versionDirectory=join(root,'dist');
  const completePath=join(versionDirectory,`squash-arcade-v${version}-build-manifest.json`);
  try {await stat(completePath);throw new Error(`Version ${version} already has a completed build; advance the source version.`);}catch(error){if(error.code!=='ENOENT')throw error;}
  const startedAt=new Date().toISOString();
  const attempt=startedAt.replaceAll(':','-');
  runDirectory=join(root,'dist','.work',version,attempt);
  releaseDirectory=join(root,'dist');
  inventoryPath=join(releaseDirectory,`squash-arcade-v${version}-${attempt}-incomplete-inventory.json`);
  await mkdir(runDirectory,{recursive:true});
  await mkdir(releaseDirectory,{recursive:true});
  await run(process.execPath,['scripts/generate-icons.mjs']);
  await run(process.execPath,['scripts/download-assets.mjs']);
  const files=await sourceFiles();
  const sourceHash=await fingerprint(files);
  const sourceCommit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
  const retained=[];
  for(const platform of Object.keys(targets)){
    for(const name of [...artifactNames(version,platform),`squash-arcade-v${version}-${platform}-metadata.json`]){
      const original=join(releaseDirectory,name);
      try{await stat(original);}catch(error){if(error.code==='ENOENT')continue;throw error;}
      const saved=join(releaseDirectory,name.replace(`squash-arcade-v${version}-`,`squash-arcade-v${version}-${attempt}-retained-`));
      await cp(original,saved);
      retained.push({original:relative(root,original),retained:relative(root,saved),sha256:createHash('sha256').update(await readFile(saved)).digest('hex')});
    }
  }
  const base=join(runDirectory,'source');
  for(const file of files){await mkdir(dirname(join(base,file)),{recursive:true});await cp(file,join(base,file));}
  const env={...process.env,...accountEnvironment,SQUASH_SOURCE_COMMIT:sourceCommit,SQUASH_SOURCE_HASH:sourceHash,SQUASH_BUILT_AT:startedAt};
  await run(process.execPath,[join(base,'scripts/stamp-build.mjs')],{cwd:base,env});
  await run(process.execPath,[join(root,'node_modules/vite/bin/vite.js'),'build'],{cwd:base,env});
  const plain=join(base,'native-web');
  await cp(join(base,'dist'),plain,{recursive:true,filter:path=>!/(^|[\\/])(manifest\.webmanifest|sw\.js)$/.test(path)});
  const plainIndex=(await readFile(join(plain,'index.html'),'utf8')).replace(/<link\b[^>]*rel=["']manifest["'][^>]*>\s*/gi,'');
  await writeFile(join(plain,'index.html'),plainIndex);
  await cp(plain,join(base,'pwa-web'),{recursive:true});
  await cp(join(base,'public/manifest.webmanifest'),join(base,'pwa-web/manifest.webmanifest'));
  await writeFile(join(base,'pwa-web/index.html'),plainIndex.replace('<html','<html data-squash-pwa="true"').replace('</head>','<link rel="manifest" href="./manifest.webmanifest">\n</head>'));
  await run(process.execPath,[join(base,'scripts/build-pwa.mjs'),join(base,'pwa-web')],{cwd:base,env});
  const nativeConfig=JSON.parse(await readFile(join(base,'src-tauri/tauri.conf.json'),'utf8'));
  nativeConfig.build.frontendDist='../native-web';
  await writeFile(join(base,'src-tauri/tauri.conf.json'),JSON.stringify(nativeConfig,null,2)+'\n');
  const platforms=Object.keys(targets);
  await Promise.all(platforms.map(async platform=>{
    await cp(base,join(runDirectory,platform,'source'),{recursive:true});
  }));
  manifest={version,sourceCommit,sourceHash,startedAt,status:'building',retained,platforms:{}};
  await writeFile(inventoryPath,JSON.stringify(manifest,null,2)+'\n');
  console.log(`Launching all five platform workers for ${version}. Durable output: dist/`);
  const worker=async platform=>{
    const directory=join(runDirectory,platform);
    const output=releaseDirectory;
    await mkdir(output,{recursive:true});
    const logPath=join(releaseDirectory,`squash-arcade-v${version}-${attempt}-${platform}-build.log`);
    // Direct file descriptors avoid pipes held open by SDK/Gradle background tools.
    const log=await open(logPath,'w');
    return new Promise(done=>{
    const record={startedAt:new Date().toISOString(),log:relative(root,logPath),exitCode:null,artifacts:[]};
    manifest.platforms[platform]=record;
    console.log(`[${platform}] started ${record.startedAt}`);
    const snapshot=join(directory,'source');
    const child=spawn(process.execPath,[join(snapshot,'scripts/build-platform.mjs'),platform,snapshot,output],{cwd:snapshot,env,stdio:['ignore',log.fd,log.fd],windowsHide:true});
    let completed=false;
    const finish=async(code,error)=>{
      if(completed)return;completed=true;
      record.exitCode=code;record.finishedAt=new Date().toISOString();if(error)record.error=error.message;
      {
        try{
          for(const name of artifactNames(version,platform)){
            try{await stat(join(output,name));}catch(error){if(error.code==='ENOENT')continue;throw error;}
            const path=join(output,name), bytes=await readFile(path);
            if(bytes.length===0)throw new Error('Empty artifact: '+name);
            record.artifacts.push({path:relative(root,path),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
          }
          for(const name of artifactNames(version,platform))if(!record.artifacts.some(a=>a.path.endsWith(name)))throw new Error('Required artifact missing: '+name);
          try{record.platformMetadata=JSON.parse(await readFile(join(output,`squash-arcade-v${version}-${platform}-metadata.json`),'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
        }catch(error){record.exitCode=1;record.error=error.message;}
      }
      await log.close();
      await writeFile(join(releaseDirectory,`squash-arcade-v${version}-${attempt}-${platform}-result.json`),JSON.stringify(record,null,2)+'\n');
      await writeFile(inventoryPath,JSON.stringify(manifest,null,2)+'\n');
      console.log(`[${platform}] ${record.exitCode===0?'succeeded':'FAILED'}; ${relative(root,logPath)}`);
      done(record);
    };
    child.once('error',error=>finish(1,error));child.once('exit',code=>finish(code??1));
    });
  };
  const jobs=Object.fromEntries(platforms.map(platform=>[platform,worker(platform)]));
  // Publish playable web bytes as soon as both web workers finish. Native jobs
  // remain concurrent and cannot postpone this feedback opportunity.
  webPublication=Promise.all([jobs.web,jobs.pwa]).then(async results=>{
    if(results.some(record=>record.exitCode!==0))return {status:'skipped',error:'Web/PWA build failed.'};
    return publishWeb(manifest,join(base,'pwa-web'));
  }).catch(error=>({status:'failed',error:error.message}));
  const results=await Promise.all(Object.values(jobs));
  if(results.some(record=>record.exitCode!==0))throw new Error('Platform matrix incomplete. Source version has not advanced; inspect the retained per-platform logs.');
  if(await fingerprint(await sourceFiles())!==sourceHash)throw new Error('Source changed during the build. Artifacts retained; source version has not advanced.');
  const [major,minor]=version.split('.').map(Number);
  const next=`${major}.${minor+1}.${String(Math.floor(Date.now()/60000)%100000).padStart(5,'0')}`;
  manifest.nextSourceVersion=next;
  await setSourceVersion(next);
  manifest.status='succeeded';manifest.finishedAt=new Date().toISOString();manifest.nextSourceVersion=next;
  await writeFile(completePath,JSON.stringify(manifest,null,2)+'\n');
  await writeFile(inventoryPath,JSON.stringify({...manifest,status:'completed-inventory'},null,2)+'\n');
  console.log(`All packages were produced directly in ${relative(root,releaseDirectory)}.`);
  console.log(`All platforms built ${version}. Source immediately advanced to ${next}.`);
  manifest.webDeployment=await webPublication;
  await writeFile(completePath,JSON.stringify(manifest,null,2)+'\n');
  await writeFile(inventoryPath,JSON.stringify({...manifest,status:'completed-inventory'},null,2)+'\n');
  if(manifest.webDeployment.status!=='succeeded')throw new Error(manifest.webDeployment.error);
}catch(error){
  if(manifest){if(webPublication)manifest.webDeployment=await webPublication;manifest.status=manifest.status==='succeeded'?'deployment-failed':'failed';manifest.error=error.message;manifest.finishedAt=new Date().toISOString();await writeFile(inventoryPath,JSON.stringify(manifest,null,2)+'\n');}
  console.error(error.message);process.exitCode=1;
}finally{
  await lock.close();await unlink(lockPath);
}
