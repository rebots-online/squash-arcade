import { readFile, writeFile, readdir, open, unlink } from 'node:fs/promises';
import { resolve, join, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { requireBuildAll } from './build-context.mjs';
import { artifactNames, targets } from './build-targets.mjs';
import { setSourceVersion } from './source-version.mjs';
import { publishWeb } from './publish-web.mjs';

requireBuildAll();
const root=resolve(import.meta.dirname,'..');
process.chdir(root);
const version=process.argv[2];
if(!/^\d+\.\d+\.\d+$/.test(version||''))throw new Error('Supply the completed package version to recover.');
const lockPath=join(root,'.build-lock');
const lock=await open(lockPath,'wx');
await lock.writeFile(JSON.stringify({pid:process.pid,version,operation:'recover-release',startedAt:new Date().toISOString()}));
try {
  const completePath=`dist/squash-arcade-v${version}-build-manifest.json`;
  let inventoryPath=completePath;
  let manifest;
  try { manifest=JSON.parse(await readFile(completePath,'utf8')); }
  catch(error) {
    if(error.code!=='ENOENT')throw error;
    const names=(await readdir('dist')).filter(name=>name.startsWith(`squash-arcade-v${version}-`)&&name.endsWith('-incomplete-inventory.json'));
    if(names.length!==1)throw new Error('Recovery requires one unambiguous inventory for this version.');
    inventoryPath=join('dist',names[0]);
    manifest=JSON.parse(await readFile(inventoryPath,'utf8'));
  }
  if(manifest.version!==version)throw new Error('Inventory version mismatch.');
  const readback={version,checkedAt:new Date().toISOString(),artifacts:[]};
  for(const platform of Object.keys(targets)) {
    const record=manifest.platforms[platform];
    if(record?.exitCode!==0)throw new Error(`Cannot recover incomplete ${platform} build.`);
    for(const name of artifactNames(version,platform)) {
      const artifact=record.artifacts.find(item=>resolve(item.path)===join(root,'dist',name));
      if(!artifact)throw new Error(`Missing inventory entry: ${name}`);
      const bytes=await readFile(join(root,'dist',name));
      const sha256=createHash('sha256').update(bytes).digest('hex');
      if(bytes.length!==artifact.bytes||sha256!==artifact.sha256)throw new Error(`Artifact readback failed: ${name}`);
      readback.artifacts.push({path:relative(root,join(root,'dist',name)),bytes:bytes.length,sha256,matches:true});
    }
  }
  await writeFile(`dist/squash-arcade-v${version}-artifact-readback.json`,JSON.stringify(readback,null,2)+'\n');
  console.log(`Recovered all ${readback.artifacts.length} completed packages; hashes match. No compilation.`);

  const current=(await readFile('version.txt','utf8')).trim();
  const [major,minor]=version.split('.').map(Number);
  let next=manifest.nextSourceVersion;
  if(current===version) {
    next||=`${major}.${minor+1}.${String(Math.floor(Date.now()/60000)%100000).padStart(5,'0')}`;
    // Persist the intended successor before changing files, so a retry after
    // version.txt was written cannot increment twice or become ambiguous.
    manifest.nextSourceVersion=next;
    await writeFile(inventoryPath,JSON.stringify(manifest,null,2)+'\n');
    await setSourceVersion(next);
  } else if(current!==next) {
    throw new Error(`Source is ${current}, not the built version or its recorded successor; refusing an ambiguous increment.`);
  }
  manifest.nextSourceVersion=next;
  if(manifest.error)manifest.recoveredError=manifest.error;
  delete manifest.error;
  manifest.status='succeeded';manifest.recoveredAt=new Date().toISOString();
  await writeFile(completePath,JSON.stringify(manifest,null,2)+'\n');
  if(inventoryPath!==completePath)await writeFile(inventoryPath,JSON.stringify({...manifest,status:'completed-inventory'},null,2)+'\n');
  console.log(`Source version is ${next}; the completed release remains ${version}.`);

  // Restore deployable files from the verified PWA ZIP, not an unverified tree.
  const archive=join(root,'dist',`squash-arcade-v${version}-pwa.zip`);
  const pwaDirectory=join(root,'dist',`squash-arcade-v${version}-pwa`);
  await new Promise((done,fail)=>{
    const child=spawn(process.env.SQUASH_POWERSHELL||'pwsh.exe',['-NoProfile','-NonInteractive','-Command',
      'Expand-Archive -LiteralPath $env:SQUASH_RECOVERY_ZIP -DestinationPath $env:SQUASH_RECOVERY_WEB -Force'],
      {stdio:'inherit',windowsHide:true,env:{...process.env,SQUASH_RECOVERY_ZIP:archive,SQUASH_RECOVERY_WEB:pwaDirectory}});
    child.once('error',fail);child.once('exit',code=>code===0?done():fail(new Error(`PWA recovery extraction exited ${code}`)));
  });
  manifest.webDeployment=await publishWeb(manifest,pwaDirectory);
  await writeFile(completePath,JSON.stringify(manifest,null,2)+'\n');
  if(inventoryPath!==completePath)await writeFile(inventoryPath,JSON.stringify({...manifest,status:'completed-inventory'},null,2)+'\n');
}finally{
  await lock.close();await unlink(lockPath);
}
