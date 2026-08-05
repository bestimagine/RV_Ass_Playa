/**
 * localStorage wrapper. Every read and write is guarded because Safari in
 * private mode and locked-down browsers can throw on access, and this app has
 * to keep working without any persistence at all.
 */

const NAMESPACE = 'rv-ai-playa';

function available() {
  try {
    const probe = `${NAMESPACE}:probe`;
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

const memoryFallback = new Map();
const hasLocalStorage = typeof window !== 'undefined' && available();

export function read(key, fallback = null) {
  const fullKey = `${NAMESPACE}:${key}`;
  try {
    const raw = hasLocalStorage ? window.localStorage.getItem(fullKey) : memoryFallback.get(fullKey);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function write(key, value) {
  const fullKey = `${NAMESPACE}:${key}`;
  try {
    const raw = JSON.stringify(value);
    if (hasLocalStorage) window.localStorage.setItem(fullKey, raw);
    else memoryFallback.set(fullKey, raw);
    return true;
  } catch {
    return false;
  }
}

export function remove(key) {
  const fullKey = `${NAMESPACE}:${key}`;
  try {
    if (hasLocalStorage) window.localStorage.removeItem(fullKey);
    else memoryFallback.delete(fullKey);
    return true;
  } catch {
    return false;
  }
}

export function isPersistent() {
  return hasLocalStorage;
}
