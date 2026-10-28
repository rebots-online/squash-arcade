import { cp, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { requireBuildAll } from './build-context.mjs';

export async function publishWeb(manifest, pwaDirectory) {
  requireBuildAll();
  const metadata=JSON.parse(await readFile(join(pwaDirectory,'deployment.json'),'utf8'));
  if(metadata.version!==manifest.version||metadata.sourceHash!==manifest.sourceHash)throw new Error('Web artifact does not match the build inventory.');
  for(const platform of ['web','pwa']) {
    if(manifest.platforms[platform]?.exitCode!==0)throw new Error(`${platform} must succeed before web publication.`);
  }
  const webManifest={version:manifest.version,sourceCommit:manifest.sourceCommit,sourceHash:manifest.sourceHash,
    startedAt:manifest.startedAt,status:'web-ready',platforms:{web:manifest.platforms.web,pwa:manifest.platforms.pwa}};
  await writeFile(`dist/squash-arcade-v${manifest.version}-web-build-manifest.json`,JSON.stringify(webManifest,null,2)+'\n');
  await cp(pwaDirectory,'dist',{recursive:true});
  await cp(join(pwaDirectory,'deployment.json'),'public/deployment.json');
  console.log(`Web/PWA ${manifest.version} ready: deploying now, independently of native completion.`);
  await new Promise((done,fail)=>{
    const child=spawn(process.execPath,['scripts/deploy.mjs'],{stdio:'inherit',windowsHide:true});
    child.once('error',fail);child.once('exit',code=>code===0?done():fail(new Error(`Web deployment exited ${code}; retry through build_all.sh --deploy-existing.`)));
  });
  return {status:'succeeded',finishedAt:new Date().toISOString()};
}
