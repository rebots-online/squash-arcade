import { spawn, execFileSync } from 'node:child_process';
import { open, readdir, readFile, writeFile, mkdir, cp, rename, stat, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, resolve, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setSourceVersion } from './source-version.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
process.chdir(root);
if(process.platform!=='win32') throw new Error('This manual recipe coordinates the provisioned Windows/Android tools and WSL AppImage builder from Windows.');
const lockPath=join(root,'.build-lock');
const lock=await open(lockPath,'wx').catch(error=>{throw new Error(`A build is already locked at ${lockPath}: ${error.message}`);});
await lock.writeFile(JSON.stringify({pid:process.pid,startedAt:new Date().toISOString()}));
const roots=['src','public','scripts','src-tauri','index.html','package.json','package-lock.json','version.txt','tsconfig.json','vite.config.ts'];
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
let manifest,runDirectory;
try {
  const version=(await readFile('version.txt','utf8')).trim();
  const pkg=JSON.parse(await readFile('package.json','utf8'));
  if(pkg.version!==version)throw new Error('Canonical and package versions differ.');
  const versionDirectory=join(root,'builds',version);
  try {await stat(join(versionDirectory,'SUCCESS.json'));throw new Error(`Version ${version} already has a completed build; advance the source version.`);}catch(error){if(error.code!=='ENOENT')throw error;}
  const startedAt=new Date().toISOString();
  runDirectory=join(versionDirectory,startedAt.replaceAll(':','-'));
  await mkdir(runDirectory,{recursive:true});
  await run(process.execPath,['scripts/generate-icons.mjs']);
  await run(process.execPath,['scripts/download-assets.mjs']);
  const files=await sourceFiles();
  const sourceHash=await fingerprint(files);
  const sourceCommit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
  const base=join(runDirectory,'source');
  for(const file of files){await mkdir(dirname(join(base,file)),{recursive:true});await cp(file,join(base,file));}
  const env={...process.env,SQUASH_SOURCE_COMMIT:sourceCommit,SQUASH_SOURCE_HASH:sourceHash,SQUASH_BUILT_AT:startedAt};
  await run(process.execPath,[join(base,'scripts/stamp-build.mjs')],{cwd:base,env});
  await run(process.execPath,[join(root,'node_modules/vite/bin/vite.js'),'build'],{cwd:base,env});
  await run(process.execPath,[join(base,'scripts/build-pwa.mjs'),join(base,'dist')],{cwd:base,env});
  const platforms=['windows','appimage','android','pwa'];
  await Promise.all(platforms.map(async platform=>{
    await cp(base,join(runDirectory,platform,'source'),{recursive:true});
  }));
  manifest={version,sourceCommit,sourceHash,startedAt,status:'building',platforms:{}};
  await writeFile(join(runDirectory,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  console.log(`Launching all four platform workers for ${version}. Logs: ${runDirectory}`);
  const worker=async platform=>{
    const directory=join(runDirectory,platform);
    const output=join(directory,'artifacts');
    const logPath=join(directory,'build.log');
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
      if(code===0){
        try{
          for(const name of await readdir(output)){
            if(!/\.(exe|AppImage|apk|aab|zip)$/.test(name))continue;
            const path=join(output,name), bytes=await readFile(path);
            if(bytes.length===0)throw new Error('Empty artifact: '+name);
            record.artifacts.push({path:relative(root,path),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
          }
          const required={windows:['.exe'],appimage:['.AppImage'],android:['.apk','.aab'],pwa:['.zip']}[platform];
          for(const suffix of required)if(!record.artifacts.some(a=>a.path.endsWith(suffix)))throw new Error('Required artifact missing: '+suffix);
          try{record.platformMetadata=JSON.parse(await readFile(join(output,'platform.json'),'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
        }catch(error){record.exitCode=1;record.error=error.message;}
      }
      await log.close();
      await writeFile(join(directory,'result.json'),JSON.stringify(record,null,2)+'\n');
      console.log(`[${platform}] ${record.exitCode===0?'succeeded':'FAILED'}; ${relative(root,logPath)}`);
      done(record);
    };
    child.once('error',error=>finish(1,error));child.once('exit',code=>finish(code??1));
    });
  };
  const results=await Promise.all(platforms.map(worker));
  if(results.some(record=>record.exitCode!==0))throw new Error('Platform matrix incomplete. Source version has not advanced; inspect the retained per-platform logs.');
  if(await fingerprint(await sourceFiles())!==sourceHash)throw new Error('Source changed during the build. Artifacts retained; source version has not advanced.');
  const [major,minor]=version.split('.').map(Number);
  const next=`${major}.${minor+1}.${String(Math.floor(Date.now()/60000)%100000).padStart(5,'0')}`;
  await setSourceVersion(next);
  manifest.status='succeeded';manifest.finishedAt=new Date().toISOString();manifest.nextSourceVersion=next;
  await writeFile(join(runDirectory,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  await writeFile(join(versionDirectory,'SUCCESS.json'),JSON.stringify(manifest,null,2)+'\n');
  // Preserve the previously deployed tree before publishing the completed web tree.
  try{await rename(join(root,'dist'),join(runDirectory,'previous-dist'));}catch(error){if(error.code!=='ENOENT')throw error;}
  await cp(join(base,'dist'),join(root,'dist'),{recursive:true});
  await cp(join(base,'public/deployment.json'),join(root,'public/deployment.json'));
  console.log(`All platforms built ${version}. Source immediately advanced to ${next}.`);
}catch(error){
  if(manifest){manifest.status='failed';manifest.error=error.message;manifest.finishedAt=new Date().toISOString();await writeFile(join(runDirectory,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');}
  console.error(error.message);process.exitCode=1;
}finally{
  await lock.close();await unlink(lockPath);
}
