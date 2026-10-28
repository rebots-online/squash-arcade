import { spawn } from 'node:child_process';
import { readFile, writeFile, readdir, mkdir, cp } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { request } from 'node:https';
import { requireBuildAll } from './build-context.mjs';
requireBuildAll();

const root=resolve(import.meta.dirname,'..');
process.chdir(root);
const metadata=JSON.parse(await readFile('dist/deployment.json','utf8'));
const build=JSON.parse(await readFile(`dist/squash-arcade-v${metadata.version}-web-build-manifest.json`,'utf8').catch(error=>{
  if(error.code!=='ENOENT')throw error;
  return readFile(`dist/squash-arcade-v${metadata.version}-build-manifest.json`,'utf8');
}));
if(!['succeeded','web-ready'].includes(build.status)||build.sourceHash!==metadata.sourceHash||build.version!==metadata.version)throw new Error('Deployment requires a successful web/PWA build matching dist.');
for(const platform of ['web','pwa']) {
  const result=build.platforms[platform];
  if(result?.exitCode!==0||!result.artifacts?.length)throw new Error(`${platform} artifact is incomplete.`);
  for(const artifact of result.artifacts) {
    const bytes=await readFile(artifact.path);
    if(bytes.length!==artifact.bytes||createHash('sha256').update(bytes).digest('hex')!==artifact.sha256)throw new Error(`Changed web artifact: ${artifact.path}`);
  }
}
const pwaArtifact=build.platforms.pwa.artifacts.find(file=>file.path.endsWith('.zip'));
const flatWeb=join(root,'dist',`squash-arcade-v${metadata.version}-pwa`);
const frozenWeb=await readdir(flatWeb).then(()=>flatWeb).catch(error=>{if(error.code==='ENOENT')return join(root,pwaArtifact.path,'..','web');throw error;});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const files=[];
async function walk(directory,prefix=''){
  for(const entry of await readdir(directory,{withFileTypes:true})){
    const name=prefix+entry.name;
    if(name==='releases')continue;
    if(entry.isDirectory())await walk(join(directory,entry.name),name+'/');
    else if(name!=='CNAME')files.push(name);
  }
}
await walk(frozenWeb);files.sort();
const hashes=new Map();
for(const file of files){
  const local=await readFile(join('dist',file));
  if(sha(local)!==sha(await readFile(join(frozenWeb,file))))throw new Error('dist differs from frozen build: '+file);
  hashes.set(file,sha(local));
}
const deployDirectory=join(root,'dist','.work',metadata.version,'deploy-web');
await cp(frozenWeb,deployDirectory,{recursive:true});
await writeFile(join(deployDirectory,'CNAME'),'squash.robin.mba\n');
const domains=['squash-arcade.surge.sh','squash.robin.mba','squash-arcade.robin.mba'];
for(const domain of domains){
  await new Promise((done,fail)=>{
    const child=spawn(process.execPath,[join(root,'node_modules/surge/bin/surge'),deployDirectory,domain],{stdio:'inherit',windowsHide:true});
    child.once('error',fail);child.once('exit',code=>code===0?done():fail(new Error(`Surge ${domain} exited ${code}`)));
  });
}
// Verify custom Host routing directly at the public edge: LAN split DNS may
// deliberately route *.robin.mba to the operator's local proxy.
const dns=await(await fetch('https://dns.google/resolve?name=geo.surge.world&type=A')).json();
const edge=dns.Answer?.find(answer=>answer.type===1)?.data;
if(!edge)throw new Error('Could not resolve the public Surge edge for readback.');
const receipt={version:metadata.version,sourceCommit:metadata.sourceCommit,sourceHash:metadata.sourceHash,checkedAt:new Date().toISOString(),domains:{}};
const readEdge=(domain,file)=>new Promise((done,fail)=>{
  const req=request(`https://${domain}/${file}`,{lookup:(hostname,options,callback)=>options.all?callback(null,[{address:edge,family:4}]):callback(null,edge,4)},response=>{
    const chunks=[];response.on('data',chunk=>chunks.push(chunk));response.on('end',()=>done({status:response.statusCode,bytes:Buffer.concat(chunks)}));response.on('error',fail);
  });
  req.setTimeout(30000,()=>req.destroy(new Error('HTTPS edge readback timed out')));req.on('error',fail);req.end();
});
for(const domain of domains){
  const results=[];
  // Bound verification concurrency; avoid sending every large asset at once.
  for(let offset=0;offset<files.length;offset+=6){
    results.push(...await Promise.all(files.slice(offset,offset+6).map(async file=>{
      const primary=domain.endsWith('.surge.sh');
      const response=primary?await fetch(`https://${domain}/${file}`,{signal:AbortSignal.timeout(30000)}):null;
      const result=primary?{status:response.status,bytes:Buffer.from(await response.arrayBuffer())}:await readEdge(domain,file);
      const publicSha256=sha(result.bytes);
      return {file,status:result.status,sha256:publicSha256,matches:result.status===200&&publicSha256===hashes.get(file)};
    })));
  }
  receipt.domains[domain]={route:domain.endsWith('.surge.sh')?'public HTTPS':'public HTTPS edge with original hostname/SNI and certificate validation',results};
  console.log(`${domain}: ${results.filter(result=>result.matches).length}/${results.length} public files match`);
}
const directory=`dist/squash-arcade-v${metadata.version}-deployment`;
await mkdir(directory,{recursive:true});
await writeFile(join(directory,'public-hashes.json'),JSON.stringify(receipt,null,2)+'\n');
if(Object.values(receipt.domains).some(domain=>domain.results.some(result=>!result.matches)))throw new Error('Public file verification failed; see the deployment receipt.');
console.log(`Published and verified ${metadata.version}; source pending version is unchanged.`);
