/**
 * RV AI Assistant — Playa
 *
 * Single-page controller. Everything runs from files already in the cache, so
 * no view is allowed to depend on a network request at render time.
 */

import { buildIndex, search, broadGuidance, getRecord, recordsByCategory } from './search.js';
import { renderAnswer, renderChecklist } from './answer-view.js';
import {
  loadProfile, saveProfile, clearProfile, hasAnyConfiguration,
  PROFILE_FIELDS, TEXT_FIELDS
} from './profile.js';
import { read, write, isPersistent } from './storage.js';
import {
  initOffline, verifyCache, repairCache, applyUpdate,
  onOfflineStatus, describeStatus, STATUS
} from './offline.js';
import {
  initInstall, promptInstall, onInstallAvailability,
  instructionsFor, detectPlatform, isStandalone
} from './install.js';
import { APP_VERSION, KB_VERSION } from './version.js';

const QUICK_ACTIONS = [
  { id: 'propane-smell', label: 'Propane smell', tone: 'emergency' },
  { id: 'lpg-co-alarm', label: 'Alarm sounding', tone: 'emergency' },
  { id: 'generator-will-not-start', label: 'Generator won\u2019t start', tone: 'normal' },
  { id: 'coach-battery-charging', label: 'Charging schedule', tone: 'normal' },
  { id: 'no-120v-power', label: 'No power', tone: 'normal' },
  { id: 'ac-burning-man-settings', label: 'A/C at Burning Man', tone: 'normal' },
  { id: 'no-fresh-water', label: 'No water', tone: 'normal' },
  { id: 'waste-service-burning-man', label: 'Empty the tanks', tone: 'normal' },
  { id: 'dust-storm-procedure', label: 'Dust storm', tone: 'warn' },
  { id: 'slide-operation', label: 'Slide-out', tone: 'normal' },
  { id: 'leveling-rain-soft-playa', label: 'Rain / soft playa', tone: 'warn' },
  { id: 'return-checklist-answer', label: 'Return Checklist', tone: 'normal' }
];

const state = {
  index: null,
  answers: null,
  checklists: null,
  brand: null,
  recordsById: new Map(),
  checklistsById: new Map(),
  profile: loadProfile(),
  checkedItems: new Set(read('checklist-ticks', [])),
  route: { view: 'home' },
  // Subscriptions owned by the current view. Dropped before the next render so
  // a long session cannot accumulate listeners pointing at detached nodes.
  viewSubscriptions: []
};

const dom = {};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Cannot load ${path} (HTTP ${response.status})`);
  return response.json();
}

/* ------------------------------------------------------------------ routing */

function parseHash() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (!hash) return { view: 'home' };
  const [path, queryString] = hash.split('?');
  const segments = path.split('/').filter(Boolean).map(decodeURIComponent);
  const params = new URLSearchParams(queryString || '');
  const [head, tail] = segments;
  switch (head) {
    case 'search': return { view: 'search', query: params.get('q') || '' };
    case 'answer': return { view: 'answer', id: tail };
    case 'category': return { view: 'category', name: tail };
    case 'checklists': return { view: 'checklists' };
    case 'checklist': return { view: 'checklist', id: tail };
    case 'my-rv': return { view: 'my-rv' };
    case 'offline': return { view: 'offline' };
    case 'install': return { view: 'install' };
    case 'about': return { view: 'about' };
    default: return { view: 'home' };
  }
}

function toHash(route) {
  switch (route.view) {
    case 'search': return `#/search?q=${encodeURIComponent(route.query || '')}`;
    case 'answer': return `#/answer/${encodeURIComponent(route.id)}`;
    case 'category': return `#/category/${encodeURIComponent(route.name)}`;
    case 'checklists': return '#/checklists';
    case 'checklist': return `#/checklist/${encodeURIComponent(route.id)}`;
    case 'my-rv': return '#/my-rv';
    case 'offline': return '#/offline';
    case 'install': return '#/install';
    case 'about': return '#/about';
    default: return '#/';
  }
}

function navigate(route) {
  const target = toHash(route);
  if (window.location.hash === target) render();
  else window.location.hash = target;
}

/* -------------------------------------------------------------- components */

function backLink(label, route) {
  const button = el('button', 'back-link', `\u2190 ${label}`);
  button.type = 'button';
  button.addEventListener('click', () => navigate(route));
  return button;
}

function resultCard(record) {
  const button = el('button', `result-card result-card--${record.riskLevel}`);
  button.type = 'button';
  const top = el('div', 'result-card-top');
  top.appendChild(el('span', `risk-dot risk-dot--${record.riskLevel}`));
  top.appendChild(el('span', 'result-title', record.title));
  button.appendChild(top);
  if (record.immediateAction) button.appendChild(el('p', 'result-snippet', record.immediateAction));
  const meta = el('div', 'result-meta');
  meta.appendChild(el('span', 'category-tag', record.category));
  if (record.playaOnly) meta.appendChild(el('span', 'playa-tag', 'Burning Man'));
  if (record.escalation) meta.appendChild(el('span', 'escalation-tag', 'Call On Road Care'));
  button.appendChild(meta);
  button.addEventListener('click', () => navigate({ view: 'answer', id: record.id }));
  return button;
}

function renderBroadGuidance(container, heading, note) {
  const wrapper = el('section', 'block');
  wrapper.appendChild(el('h2', 'section-heading', heading));
  if (note) wrapper.appendChild(el('p', 'muted', note));
  const grid = el('div', 'result-grid');
  for (const record of broadGuidance(state.index)) grid.appendChild(resultCard(record));
  wrapper.appendChild(grid);

  const browse = el('div', 'broad-actions');
  const categoriesButton = el('button', 'button button--ghost', 'Browse all categories');
  categoriesButton.type = 'button';
  categoriesButton.addEventListener('click', () => navigate({ view: 'home' }));
  const checklistsButton = el('button', 'button button--ghost', 'Open the checklists');
  checklistsButton.type = 'button';
  checklistsButton.addEventListener('click', () => navigate({ view: 'checklists' }));
  browse.appendChild(categoriesButton);
  browse.appendChild(checklistsButton);
  wrapper.appendChild(browse);
  container.appendChild(wrapper);
}

/* ------------------------------------------------------------------- views */

function viewHome(container) {
  const quick = el('section', 'block');
  quick.appendChild(el('h2', 'section-heading', 'Quick actions'));
  const grid = el('div', 'quick-grid');
  for (const action of QUICK_ACTIONS) {
    const record = state.recordsById.get(action.id);
    if (!record) continue;
    const button = el('button', `quick-button quick-button--${action.tone}`, action.label);
    button.type = 'button';
    button.addEventListener('click', () => navigate({ view: 'answer', id: action.id }));
    grid.appendChild(button);
  }
  quick.appendChild(grid);
  container.appendChild(quick);

  const checklistShortcut = el('section', 'block');
  const shortcutRow = el('div', 'shortcut-row');
  const checklistsButton = el('button', 'button button--primary', 'Checklists');
  checklistsButton.type = 'button';
  checklistsButton.addEventListener('click', () => navigate({ view: 'checklists' }));
  const returnButton = el('button', 'button button--primary', 'Return Checklist');
  returnButton.type = 'button';
  returnButton.addEventListener('click', () => navigate({ view: 'checklist', id: 'return-checklist' }));
  const myRvButton = el('button', 'button button--ghost', hasAnyConfiguration(state.profile) ? 'My RV' : 'Set up My RV (optional)');
  myRvButton.type = 'button';
  myRvButton.addEventListener('click', () => navigate({ view: 'my-rv' }));
  shortcutRow.appendChild(checklistsButton);
  shortcutRow.appendChild(returnButton);
  shortcutRow.appendChild(myRvButton);
  checklistShortcut.appendChild(shortcutRow);
  container.appendChild(checklistShortcut);

  const categories = el('section', 'block');
  categories.appendChild(el('h2', 'section-heading', 'Browse by category'));
  const grouped = recordsByCategory(state.index);
  const catGrid = el('div', 'category-grid');
  for (const [name, records] of grouped) {
    const button = el('button', 'category-button');
    button.type = 'button';
    button.appendChild(el('span', 'category-name', name));
    button.appendChild(el('span', 'category-count', `${records.length} answers`));
    button.addEventListener('click', () => navigate({ view: 'category', name }));
    catGrid.appendChild(button);
  }
  categories.appendChild(catGrid);
  container.appendChild(categories);
}

function viewSearch(container, query) {
  container.appendChild(backLink('Home', { view: 'home' }));
  const heading = el('h2', 'section-heading', `Results for \u201c${query}\u201d`);
  container.appendChild(heading);

  const outcome = search(state.index, query, {
    profile: state.profile,
    playaMode: state.profile.playaMode
  });

  if (!outcome.results.length) {
    container.appendChild(el('p', 'muted', 'No answer matched that wording.'));
    renderBroadGuidance(container, 'Start here instead', 'These cover the situations that come up most often on the playa.');
    return;
  }

  if (!outcome.confident) {
    const notice = el('div', 'notice notice--soft');
    notice.appendChild(el('p', null, 'No single answer clearly matched. The closest matches are below, followed by general guidance.'));
    container.appendChild(notice);
  }

  const grid = el('div', 'result-grid');
  for (const result of outcome.results) grid.appendChild(resultCard(result.record));
  container.appendChild(grid);

  if (!outcome.confident) {
    renderBroadGuidance(container, 'General guidance', null);
  }
}

function viewAnswer(container, id) {
  const record = getRecord(state.index, id);
  if (!record) {
    container.appendChild(el('p', 'muted', 'That answer is no longer in the knowledge base.'));
    renderBroadGuidance(container, 'General guidance', null);
    return;
  }
  container.appendChild(backLink('Back', { view: 'home' }));
  container.appendChild(
    renderAnswer(record, {
      profile: state.profile,
      meta: state.answers,
      recordsById: state.recordsById,
      onNavigate: navigate
    })
  );
}

function viewCategory(container, name) {
  container.appendChild(backLink('Home', { view: 'home' }));
  container.appendChild(el('h2', 'section-heading', name));
  const grouped = recordsByCategory(state.index);
  const records = grouped.get(name) || [];
  if (!records.length) {
    container.appendChild(el('p', 'muted', 'No answers in this category.'));
    return;
  }
  const grid = el('div', 'result-grid');
  for (const record of records) grid.appendChild(resultCard(record));
  container.appendChild(grid);
}

function viewChecklists(container) {
  container.appendChild(backLink('Home', { view: 'home' }));
  container.appendChild(el('h2', 'section-heading', 'Checklists'));
  const grid = el('div', 'result-grid');
  for (const checklist of state.checklists.checklists) {
    const button = el('button', 'result-card');
    button.type = 'button';
    const top = el('div', 'result-card-top');
    top.appendChild(el('span', 'result-title', checklist.title));
    button.appendChild(top);
    let total = 0;
    let done = 0;
    for (const sec of checklist.sections) {
      for (const item of sec.items) {
        total += 1;
        if (state.checkedItems.has(`${checklist.id}::${item.text}`)) done += 1;
      }
    }
    button.appendChild(el('p', 'result-snippet', `${done} of ${total} complete`));
    const meta = el('div', 'result-meta');
    if (checklist.playaOnly) meta.appendChild(el('span', 'playa-tag', 'Burning Man'));
    button.appendChild(meta);
    button.addEventListener('click', () => navigate({ view: 'checklist', id: checklist.id }));
    grid.appendChild(button);
  }
  container.appendChild(grid);
}

function persistTicks() {
  write('checklist-ticks', [...state.checkedItems]);
}

function viewChecklist(container, id) {
  const checklist = state.checklistsById.get(id);
  if (!checklist) {
    container.appendChild(el('p', 'muted', 'That checklist is not available.'));
    return;
  }
  container.appendChild(backLink('Checklists', { view: 'checklists' }));
  container.appendChild(
    renderChecklist(checklist, {
      checkedItems: state.checkedItems,
      onToggle: (key, checked) => {
        if (checked) state.checkedItems.add(key);
        else state.checkedItems.delete(key);
        persistTicks();
        render();
      },
      onReset: () => {
        for (const sec of checklist.sections) {
          for (const item of sec.items) state.checkedItems.delete(`${checklist.id}::${item.text}`);
        }
        persistTicks();
        render();
      }
    })
  );
}

function viewMyRv(container) {
  container.appendChild(backLink('Home', { view: 'home' }));
  container.appendChild(el('h2', 'section-heading', 'My RV'));

  const intro = el('div', 'notice notice--soft');
  intro.appendChild(el('p', null, 'Optional. Every answer works without this. Filling it in only moves the matching configuration to the top; the other sourced configurations stay visible.'));
  intro.appendChild(el('p', 'muted', isPersistent()
    ? 'Stored only on this device. Nothing is sent anywhere.'
    : 'This browser is blocking local storage, so these settings will not survive a reload.'));
  container.appendChild(intro);

  const form = el('form', 'profile-form');
  form.addEventListener('submit', (event) => event.preventDefault());

  for (const field of PROFILE_FIELDS) {
    const row = el('div', 'field');
    const label = el('label', 'field-label', field.label);
    label.htmlFor = `field-${field.key}`;
    row.appendChild(label);
    const select = document.createElement('select');
    select.id = `field-${field.key}`;
    select.className = 'field-input';
    for (const option of field.options) {
      const opt = document.createElement('option');
      opt.value = option.value;
      opt.textContent = option.label;
      if ((state.profile[field.key] || '') === option.value) opt.selected = true;
      select.appendChild(opt);
    }
    select.addEventListener('change', () => {
      state.profile = { ...state.profile, [field.key]: select.value };
      saveProfile(state.profile);
    });
    row.appendChild(select);
    row.appendChild(el('p', 'field-help', field.help));
    form.appendChild(row);
  }

  for (const field of TEXT_FIELDS) {
    const row = el('div', 'field');
    const label = el('label', 'field-label', field.label);
    label.htmlFor = `field-${field.key}`;
    row.appendChild(label);
    const input = document.createElement('input');
    input.id = `field-${field.key}`;
    input.className = 'field-input';
    input.type = 'text';
    if (field.inputMode) input.inputMode = field.inputMode;
    input.placeholder = field.placeholder || '';
    input.value = state.profile[field.key] || '';
    input.addEventListener('input', () => {
      state.profile = { ...state.profile, [field.key]: input.value.trim() };
      saveProfile(state.profile);
    });
    row.appendChild(input);
    row.appendChild(el('p', 'field-help', field.help));
    form.appendChild(row);
  }

  const playaRow = el('div', 'field field--toggle');
  const playaLabel = el('label', 'field-label', 'Prioritise Burning Man answers');
  playaLabel.htmlFor = 'field-playaMode';
  const toggle = document.createElement('input');
  toggle.type = 'checkbox';
  toggle.id = 'field-playaMode';
  toggle.className = 'field-toggle';
  toggle.checked = state.profile.playaMode !== false;
  toggle.addEventListener('change', () => {
    state.profile = { ...state.profile, playaMode: toggle.checked };
    saveProfile(state.profile);
  });
  playaRow.appendChild(toggle);
  playaRow.appendChild(playaLabel);
  playaRow.appendChild(el('p', 'field-help', 'Burning Man guidance always outranks the general guides regardless of this setting. This only affects search ordering.'));
  form.appendChild(playaRow);

  container.appendChild(form);

  const clear = el('button', 'button button--ghost', 'Clear My RV settings');
  clear.type = 'button';
  clear.addEventListener('click', () => {
    clearProfile();
    state.profile = loadProfile();
    render();
  });
  container.appendChild(clear);
}

function viewOffline(container) {
  container.appendChild(backLink('Home', { view: 'home' }));
  container.appendChild(el('h2', 'section-heading', 'Offline status'));

  const panel = el('div', 'offline-panel');
  const statusLine = el('p', 'offline-status');
  panel.appendChild(statusLine);
  const detail = el('p', 'muted');
  panel.appendChild(detail);

  const missingList = el('ul', 'missing-list');
  panel.appendChild(missingList);

  const actions = el('div', 'shortcut-row');
  const recheck = el('button', 'button button--ghost', 'Re-check');
  recheck.type = 'button';
  recheck.addEventListener('click', () => verifyCache());
  const repair = el('button', 'button button--primary', 'Re-download for offline');
  repair.type = 'button';
  repair.addEventListener('click', () => repairCache());
  actions.appendChild(recheck);
  actions.appendChild(repair);
  panel.appendChild(actions);

  const versions = el('p', 'muted', `App version ${APP_VERSION} · Knowledge base ${KB_VERSION}`);
  panel.appendChild(versions);

  const test = el('div', 'notice notice--soft');
  test.appendChild(el('h3', 'section-title', 'Airplane-mode test'));
  const testSteps = el('ol', 'step-list');
  for (const step of [
    'Wait until this page reports every file cached.',
    'Turn on airplane mode.',
    'Close the app completely and reopen it from the home-screen icon.',
    'Search for "propane smell" and open the answer.',
    'Open the Return Checklist and tick an item.',
    'Open My RV and change a setting.',
    'If every step works, the app is genuinely offline-ready.'
  ]) testSteps.appendChild(el('li', null, step));
  test.appendChild(testSteps);
  panel.appendChild(test);

  container.appendChild(panel);

  state.viewSubscriptions.push(onOfflineStatus((offlineState) => {
    statusLine.textContent = describeStatus(offlineState);
    statusLine.className = `offline-status offline-status--${offlineState.status}`;
    detail.textContent = offlineState.total
      ? `${offlineState.cached} of ${offlineState.total} files cached${offlineState.checkedAt ? ` · checked ${new Date(offlineState.checkedAt).toLocaleTimeString()}` : ''}`
      : '';
    missingList.replaceChildren();
    for (const missing of offlineState.missing || []) {
      missingList.appendChild(el('li', null, missing));
    }
  }));
}

function viewInstall(container) {
  container.appendChild(backLink('Home', { view: 'home' }));
  container.appendChild(el('h2', 'section-heading', 'Install this app'));

  if (isStandalone()) {
    const done = el('div', 'notice notice--good');
    done.appendChild(el('p', null, 'This app is already installed and running from your home screen.'));
    container.appendChild(done);
  }

  const promptRow = el('div', 'shortcut-row');
  const promptButton = el('button', 'button button--primary', 'Install now');
  promptButton.type = 'button';
  promptButton.addEventListener('click', () => promptInstall());
  promptRow.appendChild(promptButton);
  container.appendChild(promptRow);
  state.viewSubscriptions.push(onInstallAvailability(({ canPrompt }) => {
    promptRow.hidden = !canPrompt;
  }));

  const instructions = instructionsFor(detectPlatform());
  const block = el('section', 'block');
  block.appendChild(el('h3', 'section-title', instructions.heading));
  block.appendChild(el('p', 'muted', instructions.browserNote));
  const steps = el('ol', 'step-list');
  for (const step of instructions.steps) steps.appendChild(el('li', null, step));
  block.appendChild(steps);
  container.appendChild(block);

  const warning = el('div', 'notice notice--warn');
  warning.appendChild(el('p', null, 'Install and open the app at least once before you lose signal. Caching only happens while you are connected, and there is no reliable connectivity in Black Rock City.'));
  container.appendChild(warning);
}

function viewAbout(container) {
  container.appendChild(backLink('Home', { view: 'home' }));
  container.appendChild(el('h2', 'section-heading', 'About'));

  const brand = state.brand;
  const block = el('section', 'block');
  block.appendChild(el('p', null, brand.footerText));
  block.appendChild(el('p', 'muted', `${brand.approvalLabel} ${brand.referenceLabel}.`));
  container.appendChild(block);

  const hierarchy = el('section', 'block');
  hierarchy.appendChild(el('h3', 'section-title', 'How conflicts are resolved'));
  const ol = el('ol', 'step-list');
  for (const level of state.answers.instructionHierarchy) ol.appendChild(el('li', null, level));
  hierarchy.appendChild(ol);
  hierarchy.appendChild(el('p', 'muted', 'Burning Man guidance outranks the general guides, with one narrow exception: emergency ventilation for a propane smell, an LPG or carbon-monoxide alarm, a smoke alarm or smoke build-up, and ventilation while cooking on the stovetop. In those cases you open up, even on the playa.'));
  container.appendChild(hierarchy);

  const sources = el('section', 'block');
  sources.appendChild(el('h3', 'section-title', 'Sources'));
  const ul = el('ul', 'source-list');
  for (const source of state.answers.sourcePriority) {
    const li = el('li');
    li.appendChild(el('span', `source-badge source-badge--p${source.priority}`, `P${source.priority}`));
    li.appendChild(el('span', 'source-text', source.document));
    ul.appendChild(li);
  }
  sources.appendChild(ul);
  container.appendChild(sources);

  const stats = el('section', 'block');
  stats.appendChild(el('h3', 'section-title', 'Contents'));
  stats.appendChild(el('p', 'muted', `${state.answers.records.length} answers · ${state.checklists.checklists.length} checklists · app ${APP_VERSION} · knowledge base ${KB_VERSION}`));
  container.appendChild(stats);

  const orc = el('div', 'notice notice--warn');
  orc.appendChild(el('p', null, brand.onRoadCareHint));
  orc.appendChild(el('p', 'muted', 'This app never invents a phone number. You can save yours in My RV.'));
  container.appendChild(orc);
}

/* ----------------------------------------------------------------- chrome */

function renderUpdateBanner() {
  onOfflineStatus((offlineState) => {
    dom.updateBanner.hidden = !offlineState.updateReady;
    dom.offlineBadge.textContent = describeStatus(offlineState);
    dom.offlineBadge.className = `offline-badge offline-badge--${offlineState.status}`;
    dom.offlineBadge.hidden = offlineState.status === STATUS.READY;
  });
}

function render() {
  for (const unsubscribe of state.viewSubscriptions) unsubscribe();
  state.viewSubscriptions = [];

  state.route = parseHash();
  const container = dom.main;
  container.replaceChildren();

  dom.searchInput.value = state.route.view === 'search' ? state.route.query || '' : '';

  switch (state.route.view) {
    case 'search': viewSearch(container, state.route.query || ''); break;
    case 'answer': viewAnswer(container, state.route.id); break;
    case 'category': viewCategory(container, state.route.name); break;
    case 'checklists': viewChecklists(container); break;
    case 'checklist': viewChecklist(container, state.route.id); break;
    case 'my-rv': viewMyRv(container); break;
    case 'offline': viewOffline(container); break;
    case 'install': viewInstall(container); break;
    case 'about': viewAbout(container); break;
    default: viewHome(container);
  }

  dom.main.scrollTop = 0;
  window.scrollTo(0, 0);
}

function wireChrome() {
  dom.main = document.getElementById('main');
  dom.searchForm = document.getElementById('search-form');
  dom.searchInput = document.getElementById('search-input');
  dom.updateBanner = document.getElementById('update-banner');
  dom.offlineBadge = document.getElementById('offline-badge');

  dom.searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = dom.searchInput.value.trim();
    if (query) navigate({ view: 'search', query });
    dom.searchInput.blur();
  });

  document.getElementById('clear-search').addEventListener('click', () => {
    dom.searchInput.value = '';
    dom.searchInput.focus();
  });

  document.getElementById('brand-home').addEventListener('click', () => navigate({ view: 'home' }));
  document.getElementById('nav-offline').addEventListener('click', () => navigate({ view: 'offline' }));
  document.getElementById('nav-install').addEventListener('click', () => navigate({ view: 'install' }));
  document.getElementById('nav-about').addEventListener('click', () => navigate({ view: 'about' }));
  document.getElementById('update-apply').addEventListener('click', () => applyUpdate());
  document.getElementById('offline-badge').addEventListener('click', () => navigate({ view: 'offline' }));

  window.addEventListener('hashchange', render);
}

function applyBrand() {
  const brand = state.brand;
  document.title = brand.appName;
  document.getElementById('brand-name').textContent = brand.appName;
  document.getElementById('brand-status').textContent = brand.approvalLabel;
  document.getElementById('footer-text').textContent = brand.footerText;
  document.getElementById('footer-reference').textContent = brand.referenceLabel;
  applyBrandLogo(brand);
}

/**
 * The header uses the light-background wordmark by default. The dark-background
 * variant is swapped in only where the surrounding surface calls for it, which
 * here is the dark colour scheme.
 */
function applyBrandLogo(brand) {
  const logo = document.getElementById('brand-logo');
  const image = document.getElementById('brand-logo-image');
  const darkSource = document.getElementById('brand-logo-dark');
  if (!logo || !image) return;

  if (!brand.logoPath) {
    logo.hidden = true;
    return;
  }

  image.src = brand.logoPath;
  image.alt = brand.logoAlt || brand.retailerName || 'El Monte RV';
  if (darkSource) {
    if (brand.darkLogoPath) darkSource.srcset = brand.darkLogoPath;
    else darkSource.remove();
  }
  logo.hidden = false;
}

async function boot() {
  wireChrome();
  try {
    const [answers, checklists, synonyms, brand] = await Promise.all([
      loadJson('./data/answers.json'),
      loadJson('./data/checklists.json'),
      loadJson('./data/synonyms.json'),
      loadJson('./config/brand-config.json')
    ]);
    state.answers = answers;
    state.checklists = checklists;
    state.brand = brand;
    state.index = buildIndex(answers, synonyms);
    state.recordsById = new Map(answers.records.map((r) => [r.id, r]));
    state.checklistsById = new Map(checklists.checklists.map((c) => [c.id, c]));
    applyBrand();
    render();
  } catch (error) {
    dom.main.replaceChildren();
    const failure = el('div', 'notice notice--warn');
    failure.appendChild(el('h2', 'section-heading', 'The knowledge base could not be loaded'));
    failure.appendChild(el('p', null, error.message));
    failure.appendChild(el('p', 'muted', 'Reconnect to the internet and reload once so the app can finish caching.'));
    dom.main.appendChild(failure);
    return;
  }

  initInstall();
  renderUpdateBanner();
  initOffline();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
