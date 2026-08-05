/**
 * Service-worker registration, real cache verification, and update handling.
 *
 * "Ready for offline" here means every file in asset-manifest.json is actually
 * present in the versioned cache — not merely that a service worker registered.
 */

import { APP_VERSION, CACHE_NAME } from './version.js';

const STATUS = {
  UNSUPPORTED: 'unsupported',
  INSTALLING: 'installing',
  READY: 'ready',
  INCOMPLETE: 'incomplete',
  ERROR: 'error'
};

export { STATUS };

let registration = null;
const listeners = new Set();
let currentState = { status: STATUS.INSTALLING, cached: 0, total: 0, missing: [], updateReady: false };

function emit(patch) {
  currentState = { ...currentState, ...patch };
  for (const listener of listeners) listener(currentState);
}

export function onOfflineStatus(listener) {
  listeners.add(listener);
  listener(currentState);
  return () => listeners.delete(listener);
}

export function getOfflineState() {
  return currentState;
}

async function loadManifest() {
  const response = await fetch('./asset-manifest.json', { cache: 'no-store' }).catch(() => null);
  if (response && response.ok) return response.json();
  const cached = await caches.match('./asset-manifest.json');
  if (cached) return cached.json();
  throw new Error('Asset manifest unavailable');
}

/**
 * Verifies the cache by resolving every manifest entry against the versioned
 * cache. This is what the "Offline status" screen reports.
 */
export async function verifyCache() {
  if (!('caches' in window)) {
    emit({ status: STATUS.UNSUPPORTED, missing: [], cached: 0, total: 0 });
    return currentState;
  }
  try {
    const manifest = await loadManifest();
    const assets = manifest.assets || [];
    const cache = await caches.open(CACHE_NAME);
    const missing = [];
    for (const asset of assets) {
      const hit = await cache.match(asset, { ignoreSearch: true });
      if (!hit) missing.push(asset);
    }
    const cached = assets.length - missing.length;
    const status = missing.length === 0 ? STATUS.READY : STATUS.INCOMPLETE;
    emit({ status, cached, total: assets.length, missing, checkedAt: new Date().toISOString() });
  } catch (error) {
    emit({ status: STATUS.ERROR, error: error.message });
  }
  return currentState;
}

/** Forces a fresh precache pass, used by the "Re-download for offline" button. */
export async function repairCache() {
  if (!('serviceWorker' in navigator)) return currentState;
  emit({ status: STATUS.INSTALLING });
  try {
    if (registration) await registration.update();
    const manifest = await loadManifest();
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(
      (manifest.assets || []).map(async (asset) => {
        try {
          const response = await fetch(asset, { cache: 'reload' });
          if (response.ok) await cache.put(asset, response.clone());
        } catch {
          /* verifyCache reports whatever is still missing */
        }
      })
    );
  } catch {
    /* fall through to verification, which surfaces the real state */
  }
  return verifyCache();
}

export async function applyUpdate() {
  if (!registration) return false;
  const waiting = registration.waiting;
  if (!waiting) return false;
  waiting.postMessage({ type: 'SKIP_WAITING' });
  return new Promise((resolve) => {
    let settled = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (settled) return;
      settled = true;
      resolve(true);
      window.location.reload();
    }, { once: true });
    setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(false);
      }
    }, 4000);
  });
}

function watchForUpdate(reg) {
  if (reg.waiting && navigator.serviceWorker.controller) emit({ updateReady: true });
  reg.addEventListener('updatefound', () => {
    const installing = reg.installing;
    if (!installing) return;
    installing.addEventListener('statechange', () => {
      if (installing.state === 'installed' && navigator.serviceWorker.controller) {
        emit({ updateReady: true });
      }
      if (installing.state === 'activated') {
        verifyCache();
      }
    });
  });
}

export async function initOffline() {
  if (!('serviceWorker' in navigator)) {
    emit({ status: STATUS.UNSUPPORTED });
    return currentState;
  }
  if (!window.isSecureContext) {
    emit({ status: STATUS.ERROR, error: 'Offline caching requires HTTPS or localhost.' });
    return currentState;
  }
  try {
    registration = await navigator.serviceWorker.register('./service-worker.js', { scope: './' });
    watchForUpdate(registration);
    await navigator.serviceWorker.ready;
    await verifyCache();
    if (currentState.status === STATUS.INCOMPLETE) await repairCache();
  } catch (error) {
    emit({ status: STATUS.ERROR, error: error.message });
  }
  return currentState;
}

export function appVersion() {
  return APP_VERSION;
}

export function describeStatus(state) {
  switch (state.status) {
    case STATUS.READY:
      return `Ready to use offline — all ${state.total} files cached.`;
    case STATUS.INSTALLING:
      return 'Downloading for offline use…';
    case STATUS.INCOMPLETE:
      return `Not ready for offline — ${state.missing.length} of ${state.total} files missing.`;
    case STATUS.UNSUPPORTED:
      return 'This browser cannot store the app for offline use.';
    case STATUS.ERROR:
      return `Offline caching problem: ${state.error || 'unknown error'}`;
    default:
      return 'Checking offline status…';
  }
}
