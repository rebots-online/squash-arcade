import { mkdir, writeFile, copyFile, readFile, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import { getMiiAvatarSVG } from '../src/mii_avatars.js';

const portrait = getMiiAvatarSVG('player1', { uid: 'squash-app' })
  .replace('<svg ', '<svg x="110" y="130" width="700" height="700" ');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
<title>Virtual Squash — red player with squash racquet</title>
<defs><radialGradient id="court"><stop stop-color="#20435f"/><stop offset="1" stop-color="#071321"/></radialGradient>
<linearGradient id="rim"><stop stop-color="#fff4bc"/><stop offset=".45" stop-color="#ffca41"/><stop offset="1" stop-color="#f8882b"/></linearGradient>
<clipPath id="strings"><ellipse cy="-265" rx="91" ry="139"/></clipPath></defs>
<path fill="url(#court)" d="M0 0h1024v1024H0z"/>
<circle cx="512" cy="512" r="425" fill="none" stroke="#ffd35a" stroke-width="9" opacity=".65"/>
<g transform="rotate(-13 460 510)">${portrait}</g>
<g transform="translate(610 714) rotate(32)" stroke-linecap="round" stroke-linejoin="round">
<path d="M0 12V-90M0-90L-56-159M0-90L56-159" fill="none" stroke="#0a1220" stroke-width="42"/>
<path d="M0 12V-90M0-90L-56-159M0-90L56-159" fill="none" stroke="url(#rim)" stroke-width="24"/>
<ellipse cy="-265" rx="105" ry="153" fill="#163647" stroke="#071321" stroke-width="24"/>
<ellipse cy="-265" rx="105" ry="153" fill="none" stroke="url(#rim)" stroke-width="15"/>
<g clip-path="url(#strings)" stroke="#e9fcff" stroke-width="5" opacity=".9">
${Array.from({length:9},(_,i)=>`<path d="M${-96+i*24}-425V-104"/>`).join('')}
${Array.from({length:12},(_,i)=>`<path d="M-111 ${-420+i*27}H111"/>`).join('')}</g>
<path d="M0 6V-68" stroke="#111c33" stroke-width="38"/>
<path d="M-11-8L11-20M-11-30L11-42M-11-52L11-64" stroke="#ff7162" stroke-width="6"/>
</g>
<ellipse cx="608" cy="676" rx="33" ry="28" fill="#ffdfc4" stroke="#c9825b" stroke-width="6" transform="rotate(-20 608 676)"/>
</svg>`;
const required=['public/favicon.ico','src-tauri/icons/icon.ico','src-tauri/icons/icon.png',
  ...[16,32,48,64,128,180,192,256,512,1024].map(size=>`public/icons/icon-${size}.png`),
  'public/icons/maskable-512.png',
  ...['hdpi','mdpi','xhdpi','xxhdpi','xxxhdpi'].map(dpi=>`src-tauri/icons/android/mipmap-${dpi}/ic_launcher.png`)];
const nativeConfig=JSON.parse(await readFile('src-tauri/tauri.conf.json','utf8'));
required.push(...nativeConfig.bundle.icon.map(file=>'src-tauri/'+file));
let current=false;
try{current=await readFile('public/icons/red-mii-racquet.svg','utf8')===svg;
  for(const file of required)await stat(file);
}catch{current=false;}
if(current&&!process.argv.includes('--force')){
  console.log('Red Mii icon master and generated set are current.');
}else{
await mkdir('public/icons', { recursive: true });
await writeFile('public/icons/red-mii-racquet.svg', svg);
for (const size of [16,32,48,64,128,180,192,256,512,1024]) {
  await sharp(Buffer.from(svg)).resize(size,size).png().toFile(`public/icons/icon-${size}.png`);
}
// All foreground geometry fits within the central 80% safe circle.
await copyFile('public/icons/icon-512.png', 'public/icons/maskable-512.png');
execFileSync(process.execPath, ['node_modules/@tauri-apps/cli/tauri.js', 'icon', 'public/icons/icon-1024.png', '--output', 'src-tauri/icons'], { stdio: 'inherit' });
await copyFile('src-tauri/icons/icon.ico', 'public/favicon.ico');
console.log('Generated red Mii / opposing-diagonal racquet icons.');
}
