// Native/ordinary web frontends never register a website worker.
if (import.meta.env.PROD && document.documentElement.dataset.squashPwa === 'true' &&
    'serviceWorker' in navigator && !('__TAURI_INTERNALS__' in window) &&
    ['https:', 'http:'].includes(location.protocol) && !location.hostname.endsWith('tauri.localhost')) {
  const controlledAtStart=Boolean(navigator.serviceWorker.controller);
  let reloading=false, workerNavigating=false, reloadTimer;
  const reloadOnce=()=>{
    if(reloading||workerNavigating)return;
    reloading=true;location.reload();
  };
  navigator.serviceWorker.addEventListener('message',event=>{
    if(event.data?.type==='SQUASH_SW_NAVIGATING'){
      workerNavigating=true;clearTimeout(reloadTimer);
    }
  });
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(controlledAtStart&&!reloading)reloadTimer=setTimeout(reloadOnce,300);
  });
  window.addEventListener('vite:preloadError',event=>{
    const key='squash-chunk-recovery:'+location.pathname;
    if(!sessionStorage.getItem(key)&&navigator.onLine){
      event.preventDefault();sessionStorage.setItem(key,'1');reloadOnce();
    }
  });
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(registration=>{
      const update=()=>registration.update().catch(()=>{});
      update();setInterval(update,60000);
      document.addEventListener('visibilitychange',()=>{if(!document.hidden)update();});
    }).catch(error=>console.warn('Offline installation could not finish:',error));
  });
}
