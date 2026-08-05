import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const PUBLIC_DIR = resolve(ROOT, 'public');

export function readJson(relativePath) {
  return JSON.parse(readFileSync(resolve(ROOT, relativePath), 'utf8'));
}

export function readText(relativePath) {
  return readFileSync(resolve(ROOT, relativePath), 'utf8');
}

export function fileExists(relativePath) {
  return existsSync(resolve(ROOT, relativePath));
}

export const answers = readJson('public/data/answers.json');
export const checklists = readJson('public/data/checklists.json');
export const synonyms = readJson('public/data/synonyms.json');
export const brand = readJson('public/config/brand-config.json');
export const assetManifest = readJson('public/asset-manifest.json');
export const webManifest = readJson('public/manifest.webmanifest');

export const recordsById = new Map(answers.records.map((r) => [r.id, r]));
export const checklistsById = new Map(checklists.checklists.map((c) => [c.id, c]));

export const APP_NAME = 'RV AI Assistant \u2014 Playa';
export const SHORT_NAME = 'RV AI Playa';
export const SLUG = 'rv-ai-assistant-playa';

export const DOCUMENTS = {
  'Burning Man 2026 RV Rental Guide': 1,
  'El Monte Class A Walkthrough Transcript': 2,
  'El Monte RV Guest Guide \u2014 Class A': 3
};

/** Walks every source object anywhere in the knowledge base. */
export function collectSources(value, out = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectSources(item, out);
    return out;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (key === 'sources' && Array.isArray(child)) out.push(...child);
      else collectSources(child, out);
    }
  }
  return out;
}

/** Flattens every authored string in a record so content rules can be checked. */
export function recordText(record, { include, exclude } = {}) {
  const keys = include || Object.keys(record);
  const parts = [];
  const walk = (value) => {
    if (typeof value === 'string') parts.push(value);
    else if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === 'object') Object.values(value).forEach(walk);
  };
  for (const key of keys) {
    if (exclude && exclude.includes(key)) continue;
    walk(record[key]);
  }
  return parts.join('\n');
}

/**
 * Records that must escalate to On Road Care. This is the Phase 1 escalation
 * map used as the control list: nothing else may carry an escalation block.
 */
export const ESCALATION_CONTROL_LIST = {
  'propane-smell': 'call-now',
  'lpg-co-alarm': 'call-now',
  'fire-extinguisher': 'call-now',
  'incorrect-fuel': 'call-now',
  collision: 'call-now',
  'flat-tire': 'call-now',
  'brake-warning-light': 'call-now',
  'oil-pressure-warning': 'call-now',
  'coolant-temp-warning': 'call-now',
  'warning-lights-red': 'call-now',
  'warning-light-technician': 'call-now',
  'warning-light-airbag': 'call-now',
  'roof-strike': 'call-now',
  breakdown: 'call-now',
  'slide-unsafe-position': 'call-now',
  'warning-light-throttle': 'call-before-proceeding',
  'warning-light-service-engine': 'call-before-proceeding',
  'fluid-leak': 'call-before-proceeding',
  'clogged-drain': 'call-before-proceeding',
  'refrigerator-frozen-chamber': 'call-before-proceeding',
  'air-in-water-lines': 'call-before-proceeding',
  'slide-motor-fault': 'call-before-proceeding',
  'oil-change-due': 'call-for-authorization',
  'repairs-over-100': 'call-for-authorization'
};

/** Topics covered by the approved narrow safety-precedence exception. */
export const VENTILATION_EXCEPTION_RECORDS = [
  'propane-smell',
  'lpg-co-alarm',
  'smoke-alarm',
  'stovetop',
  'ventilation-playa-vs-emergency',
  'windows-vents-blinds'
];

export const NORMAL_CONDITIONS_LABEL = 'During normal playa conditions';
export const EMERGENCY_LABEL = 'During a gas, smoke, or alarm emergency';
