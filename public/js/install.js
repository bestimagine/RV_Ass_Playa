/**
 * Install guidance. Chromium fires beforeinstallprompt so we can offer a real
 * button; iOS Safari never does, so it gets accurate manual instructions
 * instead of a button that does nothing.
 */

let deferredPrompt = null;
const listeners = new Set();

export const PLATFORM = {
  IOS: 'ios',
  ANDROID: 'android',
  DESKTOP: 'desktop'
};

export function detectPlatform(userAgent = navigator.userAgent, platform = navigator.platform) {
  const ua = userAgent.toLowerCase();
  const isIpadOs = platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  if (/iphone|ipad|ipod/.test(ua) || isIpadOs) return PLATFORM.IOS;
  if (/android/.test(ua)) return PLATFORM.ANDROID;
  return PLATFORM.DESKTOP;
}

export function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

export const INSTRUCTIONS = {
  [PLATFORM.IOS]: {
    heading: 'Add to Home Screen on iPhone or iPad',
    browserNote: 'Use Safari. Chrome and Firefox on iOS cannot install a home-screen app.',
    steps: [
      'Open this page in Safari.',
      'Tap the Share button — the square with an arrow pointing up.',
      'Scroll down and tap "Add to Home Screen".',
      'Tap "Add" in the top right.',
      'Open the app from the home screen icon once, while you still have signal, so it finishes caching.'
    ]
  },
  [PLATFORM.ANDROID]: {
    heading: 'Install on Android',
    browserNote: 'Chrome, Edge and Samsung Internet all support installing this app.',
    steps: [
      'Tap the browser menu — the three dots in the top right.',
      'Tap "Install app" or "Add to Home screen".',
      'Confirm the prompt.',
      'Open the app from the home screen icon once, while you still have signal, so it finishes caching.'
    ]
  },
  [PLATFORM.DESKTOP]: {
    heading: 'Install on a computer',
    browserNote: 'Chrome and Edge show an install icon in the address bar.',
    steps: [
      'Click the install icon in the address bar, or open the browser menu and choose "Install".',
      'Confirm the prompt.',
      'Open the installed app once, while you still have a connection, so it finishes caching.'
    ]
  }
};

function emit() {
  for (const listener of listeners) listener({ canPrompt: Boolean(deferredPrompt) });
}

export function onInstallAvailability(listener) {
  listeners.add(listener);
  listener({ canPrompt: Boolean(deferredPrompt) });
  return () => listeners.delete(listener);
}

export function initInstall() {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    emit();
  });
}

export async function promptInstall() {
  if (!deferredPrompt) return 'unavailable';
  deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  deferredPrompt = null;
  emit();
  return choice.outcome;
}

export function instructionsFor(platform = detectPlatform()) {
  return INSTRUCTIONS[platform] || INSTRUCTIONS[PLATFORM.DESKTOP];
}
