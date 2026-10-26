import { readFile } from 'node:fs/promises';
export async function assertProductIdentity(){
  const config=JSON.parse(await readFile('src-tauri/tauri.conf.json','utf8'));
  const manifest=JSON.parse(await readFile('public/manifest.webmanifest','utf8'));
  const html=await readFile('index.html','utf8');
  const title=html.match(/<title>([^<]+)<\/title>/i)?.[1];
  const og=html.match(/property="og:title"\s+content="([^"]+)"/i)?.[1];
  const labels=[config.productName,config.app.windows[0].title,manifest.name,manifest.short_name,title,og];
  if(labels.some(label=>label!=='Virtual Squash'))throw new Error('Product identity drift: all page/native/PWA names must be Virtual Squash.');
  const visible=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ');
  if(/\bArgon\b|Remix:/i.test(visible))throw new Error('Legacy branding remains in visible page text.');
  const companion=await readFile('public/companion.html','utf8');
  if(/\bArgon\b|Remix:/i.test(companion.replace(/<[^>]+>/g,' ')))throw new Error('Deprecated companion branding remains.');
  const audio=await readFile('src/audio_engine.js','utf8');
  if(/\b(?:title|shortTitle|genre)\s*:\s*['"][^'"\r\n]*\bArgon\b/i.test(audio))throw new Error('Deprecated soundtrack display branding remains.');
  const tuning=await readFile('src/squash/TuningPanel.js','utf8');
  if(/(?:window\.prompt|a\.download)[^\r\n]*\bArgon\b/i.test(tuning))throw new Error('Deprecated tuning UI branding remains.');
}
