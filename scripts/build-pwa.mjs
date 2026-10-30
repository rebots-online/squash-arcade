import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, relative, join } from 'node:path';
import { createHash } from 'node:crypto';
import { requireBuildAll } from './build-context.mjs';
requireBuildAll();

const directory = resolve(process.argv[2] || 'dist');
const files = [];
async function walk(path) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) await walk(child);
    else if (!['CNAME','sw.js'].includes(entry.name)) files.push(relative(directory,child).replaceAll('\\','/'));
  }
}
await walk(directory);
files.sort();
const hash = createHash('sha256');
for (const file of files) hash.update(file).update(await readFile(join(directory,file)));
const metadata = JSON.parse(await readFile(join(directory,'deployment.json'),'utf8'));
const cache = `squash-arcade-${metadata.version}-${hash.digest('hex').slice(0,16)}`;
const worker = `const CACHE=${JSON.stringify(cache)};
const FILES=${JSON.stringify(files.map(file=>'./'+file))};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
// Activation happens once per new worker. Navigate legacy clients too: their
// old registration code has no controllerchange update handler.
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('squash-arcade-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()).then(()=>self.clients.matchAll({type:'window',includeUncontrolled:true})).then(clients=>Promise.all(clients.map(client=>{client.postMessage({type:'SQUASH_SW_NAVIGATING'});return client.navigate(client.url).catch(()=>{});})))));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.includes('/api/'))return;
 event.respondWith(caches.open(CACHE).then(async cache=>{
  if(event.request.mode==='navigate'){
   const entry=url.pathname.endsWith('/account-auth.html')?'./account-auth.html':'./index.html';
   return (await cache.match(entry))||fetch(event.request);
  }
  return (await cache.match(event.request,{ignoreSearch:true}))||fetch(event.request);
 }));
});
`;
await writeFile(join(directory,'sw.js'),worker);
console.log(`PWA precache: ${files.length} local files; ${cache}`);
