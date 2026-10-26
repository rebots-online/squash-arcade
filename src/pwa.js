// Installed native apps bundle their own files; only the production website uses SW.
if (import.meta.env.PROD && document.documentElement.dataset.squashPwa === 'true' && 'serviceWorker' in navigator &&
    !('__TAURI_INTERNALS__' in window) &&
    ['https:', 'http:'].includes(location.protocol) &&
    !location.hostname.endsWith('tauri.localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' })
      .catch(error => console.warn('Offline installation could not finish:', error));
  });
}
