const CACHE="squash-arcade-1.15.83658-d1a30f5c4e5751cb";
const FILES=["./arcade-briefing.css","./assets/audio/red-player-identity.wav","./assets/index-TvvJOWZR.js","./assets/mediapipe/hands/hand_landmark_full.tflite","./assets/mediapipe/hands/hand_landmark_lite.tflite","./assets/mediapipe/hands/hands.binarypb","./assets/mediapipe/hands/hands_solution_packed_assets.data","./assets/mediapipe/hands/hands_solution_simd_wasm_bin.wasm","./assets/mediapipe/hands/hands_solution_wasm_bin.wasm","./assets/models/mii_crowd.glb","./assets/models/mii_opponent.glb","./assets/models/mii_player.glb","./assets/models/stadium_court.glb","./assets/models/tennis_ball.glb","./assets/models/tennis_net.glb","./assets/models/tennis_racket.glb","./companion.html","./court-hud.css","./deployment.json","./favicon.ico","./icons/icon-1024.png","./icons/icon-128.png","./icons/icon-16.png","./icons/icon-180.png","./icons/icon-192.png","./icons/icon-256.png","./icons/icon-32.png","./icons/icon-48.png","./icons/icon-512.png","./icons/icon-64.png","./icons/maskable-512.png","./icons/red-mii-racquet.svg","./index.html","./manifest.webmanifest","./styles.css"];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
// New builds wait until the old app is closed, preserving the active game's assets.
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('squash-arcade-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.includes('/api/'))return;
 event.respondWith(caches.open(CACHE).then(async cache=>{
  if(event.request.mode==='navigate')return (await cache.match('./index.html'))||fetch(event.request);
  return (await cache.match(event.request,{ignoreSearch:true}))||fetch(event.request);
 }));
});
