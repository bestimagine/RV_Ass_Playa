import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  readText, fileExists, brand, assetManifest, webManifest,
  answers, checklists, APP_NAME, SHORT_NAME, SLUG, PUBLIC_DIR
} from './helpers.mjs';

const indexHtml = readText('public/index.html');
const offlineHtml = readText('public/offline.html');
const serviceWorker = readText('public/service-worker.js');
const versionJs = readText('public/js/version.js');
const appJs = readText('public/js/app.js');
const readme = readText('README.md');
const readmeReplit = readText('README_REPLIT.md');

/* ---------------------------------------------------------------- naming */

test('the app name is used consistently everywhere', () => {
  assert.equal(brand.appName, APP_NAME);
  assert.equal(brand.shortName, SHORT_NAME);
  assert.equal(webManifest.name, APP_NAME);
  assert.equal(webManifest.short_name, SHORT_NAME);
  assert.match(indexHtml, new RegExp(`<title>${APP_NAME}</title>`));
  assert.match(indexHtml, new RegExp(`content="${SHORT_NAME}"`));
  assert.ok(offlineHtml.includes(APP_NAME), 'the offline fallback must carry the app name');
  assert.ok(readme.includes(APP_NAME), 'README must use the full display name');
  assert.ok(readmeReplit.includes(APP_NAME), 'README_REPLIT must use the full display name');
});

test('the deployment slug is documented', () => {
  assert.ok(webManifest.id.includes(SLUG), 'manifest id should use the slug');
  assert.ok(readme.includes(SLUG), 'README should state the repository/deployment slug');
  assert.ok(readmeReplit.includes(SLUG), 'README_REPLIT should state the deployment slug');
});

test('no earlier working name survives anywhere', () => {
  const stale = /Playa\s*Pal|RV\s*Playa\s*Helper|Burner\s*RV\s*Buddy/i;
  for (const [label, text] of Object.entries({
    indexHtml, offlineHtml, appJs, readme, readmeReplit,
    manifest: JSON.stringify(webManifest),
    brand: JSON.stringify(brand)
  })) {
    assert.ok(!stale.test(text), `stale app name found in ${label}`);
  }
});

/* -------------------------------------------------------------- versioning */

test('the app version is identical in every place that declares it', () => {
  const fromVersionJs = versionJs.match(/APP_VERSION\s*=\s*'([^']+)'/)[1];
  const fromServiceWorker = serviceWorker.match(/APP_VERSION\s*=\s*'([^']+)'/)[1];
  assert.equal(fromVersionJs, assetManifest.appVersion);
  assert.equal(fromServiceWorker, assetManifest.appVersion);
});

test('the knowledge-base version is identical in every place that declares it', () => {
  const fromVersionJs = versionJs.match(/KB_VERSION\s*=\s*'([^']+)'/)[1];
  assert.equal(fromVersionJs, assetManifest.kbVersion);
  assert.equal(answers.kbVersion, assetManifest.kbVersion);
  assert.equal(checklists.checklistsVersion, assetManifest.kbVersion);
});

test('the cache name is versioned so an update cannot serve stale files', () => {
  assert.match(versionJs, /CACHE_NAME\s*=\s*`\$\{CACHE_PREFIX\}-v\$\{APP_VERSION\}`/);
  assert.match(serviceWorker, /CACHE_NAME\s*=\s*`\$\{CACHE_PREFIX\}-v\$\{APP_VERSION\}`/);
  assert.match(serviceWorker, /caches\.delete/, 'old caches must be cleaned up on activate');
});

/* ------------------------------------------------------- offline readiness */

test('every asset listed in the manifest exists on disk', () => {
  const missing = assetManifest.assets
    .filter((asset) => asset !== './')
    .filter((asset) => !fileExists(`public/${asset.replace(/^\.\//, '')}`));
  assert.deepEqual(missing, [], `asset manifest lists files that do not exist: ${missing.join(', ')}`);
});

test('every file the app actually needs is in the asset manifest', () => {
  const required = [
    './index.html', './offline.html', './manifest.webmanifest',
    './css/styles.css',
    './js/app.js', './js/search.js', './js/answer-view.js',
    './js/storage.js', './js/profile.js', './js/offline.js',
    './js/install.js', './js/version.js',
    './data/answers.json', './data/checklists.json', './data/synonyms.json',
    './config/brand-config.json',
    './assets/icons/icon-192.png', './assets/icons/icon-512.png',
    './assets/icons/icon-maskable-512.png', './assets/icons/apple-touch-icon.png'
  ];
  const missing = required.filter((asset) => !assetManifest.assets.includes(asset));
  assert.deepEqual(missing, [], `missing from asset-manifest.json: ${missing.join(', ')}`);
});

test('every script and stylesheet referenced by index.html is precached', () => {
  const references = [...indexHtml.matchAll(/(?:src|href)="(\.\/[^"]+)"/g)].map((m) => m[1]);
  const notPrecached = references.filter((ref) => !assetManifest.assets.includes(ref));
  assert.deepEqual(notPrecached, [], `index.html references uncached files: ${notPrecached.join(', ')}`);
});

test('the service worker precaches individually so one bad file cannot break install', () => {
  assert.ok(!/cache\.addAll/.test(serviceWorker), 'addAll is all-or-nothing and hides which file failed');
  assert.match(serviceWorker, /asset-manifest\.json/, 'the service worker must read the asset manifest');
  assert.match(serviceWorker, /offline\.html/, 'the service worker must fall back to offline.html');
});

test('cache verification checks real cache contents, not just registration', () => {
  const offlineJs = readText('public/js/offline.js');
  assert.match(offlineJs, /caches\.open\(CACHE_NAME\)/);
  assert.match(offlineJs, /cache\.match\(asset/);
  assert.match(offlineJs, /missing\.push\(asset\)/);
  assert.match(offlineJs, /export async function repairCache/);
});

test('the app exposes an update path rather than silently swapping versions', () => {
  const offlineJs = readText('public/js/offline.js');
  assert.match(offlineJs, /SKIP_WAITING/);
  assert.match(offlineJs, /export async function applyUpdate/);
  assert.match(serviceWorker, /SKIP_WAITING/);
  assert.match(indexHtml, /id="update-banner"/);
});

/* ------------------------------------------------------------------- PWA */

test('the web manifest is installable', () => {
  assert.equal(webManifest.display, 'standalone');
  assert.ok(webManifest.start_url);
  assert.ok(webManifest.scope);
  const sizes = webManifest.icons.map((icon) => icon.sizes);
  assert.ok(sizes.includes('192x192'), 'a 192px icon is required for installability');
  assert.ok(sizes.includes('512x512'), 'a 512px icon is required for installability');
  assert.ok(
    webManifest.icons.some((icon) => icon.purpose === 'maskable'),
    'a maskable icon avoids a letterboxed Android launcher icon'
  );
  for (const icon of webManifest.icons) {
    assert.ok(fileExists(`public/${icon.src.replace(/^\.\//, '')}`), `missing icon file ${icon.src}`);
  }
});

test('icon files are real PNGs', () => {
  const files = [...webManifest.icons.map((i) => i.src), './assets/icons/apple-touch-icon.png'];
  for (const src of files) {
    const buffer = readFileSync(resolve(PUBLIC_DIR, src.replace(/^\.\//, '')));
    assert.deepEqual(
      [...buffer.subarray(0, 8)],
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
      `${src} is not a PNG`
    );
  }
});

test('iOS gets an apple-touch-icon and standalone meta tags', () => {
  assert.match(indexHtml, /rel="apple-touch-icon"/);
  assert.match(indexHtml, /name="apple-mobile-web-app-capable" content="yes"/);
  assert.ok(fileExists('public/assets/icons/apple-touch-icon.png'));
});

test('the manifest shortcut resolves to the Return Checklist', () => {
  const shortcut = webManifest.shortcuts.find((s) => s.name === 'Return Checklist');
  assert.ok(shortcut, 'there must be a Return Checklist shortcut');
  assert.match(shortcut.url, /#\/checklist\/return-checklist$/);
});

/* ------------------------------------------------------------- app surface */

test('the homepage shortcut and airplane-mode test both name the Return Checklist', () => {
  assert.match(appJs, /'Return Checklist'/);
  assert.match(appJs, /view: 'checklist', id: 'return-checklist'/);
  assert.match(appJs, /Open the Return Checklist and tick an item/);
});

test('every quick action points at a record that exists', () => {
  const ids = [...appJs.matchAll(/\{ id: '([a-z0-9-]+)', label:/g)].map((m) => m[1]);
  assert.ok(ids.length >= 8, 'the home screen needs a useful set of quick actions');
  const known = new Set(answers.records.map((r) => r.id));
  const missing = ids.filter((id) => !known.has(id));
    assert.deepEqual(missing, [], `quick actions reference missing records: ${missing.join(', ')}`);
});

test('the app never calls a remote model or third-party API', () => {
  const sources = [
    appJs, readText('public/js/search.js'), readText('public/js/answer-view.js'),
    readText('public/js/profile.js'), readText('public/js/storage.js'),
    readText('public/js/offline.js'), readText('public/js/install.js'),
    serviceWorker, indexHtml, offlineHtml
  ];
  for (const source of sources) {
    assert.ok(!/https?:\/\/(?!www\.w3\.org)/.test(source.replace(/officialGuidesUrl[^\n]*/g, '')),
      'no remote URLs may be requested at runtime');
    assert.ok(!/openai|anthropic|api_key|apiKey|Bearer /i.test(source), 'no API credentials or model calls');
  }
});

test('the offline fallback carries usable emergency guidance', () => {
  assert.match(offlineHtml, /911/);
  assert.match(offlineHtml, /key tag/);
  assert.match(offlineHtml, /propane/i);
  assert.match(offlineHtml, /Ventilation comes first/);
});

test('accessibility basics are present in the shell', () => {
  assert.match(indexHtml, /lang="en"/);
  assert.match(indexHtml, /class="skip-link"/);
  assert.match(indexHtml, /<main/);
  assert.match(indexHtml, /aria-label="Clear search"/);
  assert.match(indexHtml, /<label class="visually-hidden" for="search-input">/);
  assert.match(indexHtml, /name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/);
  assert.ok(!/user-scalable=no|maximum-scale=1/.test(indexHtml), 'pinch zoom must not be disabled');
});

test('the styles meet the tap-target and contrast intentions', () => {
  const css = readText('public/css/styles.css');
  assert.match(css, /--tap:\s*48px/, 'a minimum tap target size must be defined');
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /prefers-color-scheme: light/);
  assert.match(css, /:focus-visible/);
});

/* --------------------------------------------------------------- branding */

test('brand configuration is complete and marked unofficial', () => {
  for (const key of ['appName', 'shortName', 'retailerName', 'approvalStatus', 'approvalLabel', 'footerText', 'onRoadCareHint']) {
    assert.ok(brand[key], `brand-config.json is missing ${key}`);
  }
  assert.equal(brand.approvalStatus, 'unofficial');
  assert.match(brand.footerText, /rental agreement/i, 'the disclaimer must defer to the rental agreement');
  assert.equal(typeof brand.logoPath, 'string', 'logoPath must exist so a retailer logo can be dropped in');
});

test('both brand logo variants exist and are precached for offline use', () => {
  for (const key of ['logoPath', 'darkLogoPath']) {
    const path = brand[key];
    assert.equal(typeof path, 'string', `brand-config.json is missing ${key}`);
    assert.ok(fileExists(`public/${path}`), `${path} is missing from public/`);
    assert.ok(
      assetManifest.assets.includes(`./${path}`),
      `${path} must be in asset-manifest.json, or the header logo breaks offline`
    );
  }
});

test('the header leads with the light-background logo and swaps only for dark surfaces', () => {
  assert.match(indexHtml, /<picture id="brand-logo"/, 'the logo needs a picture element to carry both variants');
  assert.match(indexHtml, /<source id="brand-logo-dark" media="\(prefers-color-scheme: dark\)">/);
  assert.match(indexHtml, /<img id="brand-logo-image" alt="El Monte RV">/, 'the logo alt text must be "El Monte RV"');

  assert.match(appJs, /image\.src = brand\.logoPath/, 'the default img source must be the light-background logo');
  assert.match(appJs, /darkSource\.srcset = brand\.darkLogoPath/, 'the dark variant must be the media-conditional source');
  assert.match(brand.logoPath, /light/, 'logoPath should be the light-background variant');
  assert.match(brand.darkLogoPath, /dark/, 'darkLogoPath should be the dark-background variant');
  assert.equal(brand.logoAlt, 'El Monte RV');
});

test('the disclaimer is shown in the shell, not only in the config', () => {
  assert.match(indexHtml, /id="footer-text"/);
  assert.match(appJs, /footer-text/);
  assert.match(appJs, /brand\.footerText/);
});

/* ------------------------------------------------------------ deployment */

test('the Replit documentation states the static deployment settings', () => {
  assert.match(readmeReplit, /Static/i);
  assert.match(readmeReplit, /public/);
  assert.match(readmeReplit, /index\.html/);
  assert.match(readmeReplit, /HTTPS/i);
});

test('source materials are never referenced by the deployable app', () => {
  const sources = [indexHtml, offlineHtml, appJs, serviceWorker, JSON.stringify(assetManifest)];
  for (const source of sources) {
    assert.ok(!/source_materials|source-materials/.test(source), 'the app must not reference the private source files');
  }
});
