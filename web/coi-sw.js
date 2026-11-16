/*
 * A service worker that makes the page cross-origin isolated (needed for
 * SharedArrayBuffer) on hosts that can't send the COOP/COEP headers
 * themselves, such as GitHub Pages: it adds the headers to every response.
 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (e) => {
  const request = e.request;
  if(request.cache === 'only-if-cached' && request.mode !== 'same-origin') return;
  e.respondWith(fetch(request).then((response) => {
    if(response.status === 0) return response;
    const headers = new Headers(response.headers);
    headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers: headers });
  }));
});
