import { spawn } from 'node:child_process';
import { mkdir, cp, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const [platform,snapshot,output] = process.argv.slice(2);
const powershell=process.env.SQUASH_POWERSHELL || 'pwsh.exe';
const run = (command,args,env={}) => new Promise((done,fail)=>{
  const child=spawn(command,args,{stdio:'inherit',windowsHide:true,env:{...process.env,...env}});
  child.once('error',fail);child.once('exit',code=>code===0?done():fail(new Error(`${platform} worker exited ${code}`)));
});
const linuxPath=path=>path.replace(/^([A-Za-z]):[\\/]/,(_,drive)=>`/mnt/${drive.toLowerCase()}/`).replaceAll('\\','/');
await mkdir(output,{recursive:true});
if(platform==='pwa'){
  await cp(join(snapshot,'dist'),join(output,'web'),{recursive:true});
  const version=(await readFile(join(snapshot,'version.txt'),'utf8')).trim();
  await run(powershell,['-NoProfile','-NonInteractive','-Command',
    "Compress-Archive -Path (Join-Path $env:SQUASH_PWA_DIR '*') -DestinationPath $env:SQUASH_PWA_ZIP -CompressionLevel Optimal"],
    {SQUASH_PWA_DIR:join(output,'web'),SQUASH_PWA_ZIP:join(output,`squash-arcade-v${version}-pwa.zip`)});
}else if(platform==='appimage'){
  await run('wsl.exe',['-d',process.env.SQUASH_WSL_DISTRO||'Ubuntu-24.04','--exec','bash',
    linuxPath(resolve('scripts/build-linux.sh')),linuxPath(snapshot),linuxPath(output)]);
}else{
  await run(powershell,['-NoProfile','-NonInteractive','-File',
    resolve('scripts/build-native.ps1'),'-Platform',platform,'-Snapshot',snapshot,'-Output',output]);
}
