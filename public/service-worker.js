/**
 * RV AI Assistant — Playa service worker.
 *
 * Precaches every file listed in asset-manifest.json so the app runs with the
 * device in airplane mode. Keep APP_VERSION in step with js/version.js and
 * asset-manifest.json; the test suite enforces it.
 */

const APP_VERSION = '1.0.0';
const CACHE_PREFIX = 'rv-ai-playa';
const CACHE_NAME = `${CACHE_PREFIX}-v${APP_VERSION}`;
const MANIFEST_URL = './asset-manifest.json';

async function precache() {
  const cache = await caches.open(CACHE_NAME);
  const response = await fetch(MANIFEST_URL, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Cannot read asset manifest: ${response.status}`);
  const manifest = await response.json();
  const assets = manifest.assets || [];

  // addAll is all-or-nothing, which would leave the app half-installed after a
  // single 404. Cache individually and report what failed instead.
  const failures = [];
  await Promise.all(
    assets.map(async (asset) => {
      try {
        const assetResponse = await fetch(asset, { cache: 'no-store' });
        if (!assetResponse.ok) throw new Error(`HTTP ${assetResponse.status}`);
        await cache.put(asset, assetResponse.clone());
      } catch (error) {
        failures.push({ asset, message: error.message });
      }
    })
  );

  await cache.put(MANIFEST_URL, new Response(JSON.stringify(manifest), {
    headers: { 'Content-Type': 'application/json' }
  }));

  if (failures.length) {
    console.error('[sw] precache failures', failures);
  }
  return failures;
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (data.type === 'GET_VERSION' && event.ports && event.ports[0]) {
    event.ports[0].postMessage({ appVersion: APP_VERSION, cacheName: CACHE_NAME });
  }
});

/**
 * Cache-first for everything we precached, because the whole point is that the
 * app behaves identically offline. Navigations fall back to the cached shell,
 * then to offline.html.
 */
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        try {
          const network = await fetch(request);
          if (network.ok) return network;
          throw new Error(`HTTP ${network.status}`);
        } catch {
          return (
            (await cache.match('./index.html')) ||
            (await cache.match('./')) ||
            (await cache.match('./offline.html')) ||
            Response.error()
          );
        }
      })()
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request, { ignoreSearch: true });
      if (cached) return cached;
      try {
        const network = await fetch(request);
        if (network.ok && url.origin === self.location.origin) {
          cache.put(request, network.clone());
        }
        return network;
      } catch {
        const fallback = await cache.match('./offline.html');
        return fallback || Response.error();
      }
    })()
  );
});
