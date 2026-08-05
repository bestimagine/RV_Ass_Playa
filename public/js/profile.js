/**
 * "My RV" — an entirely optional local profile.
 *
 * The app must be fully usable before any of this is filled in, so nothing here
 * ever gates content. A stored value only re-orders configuration variants so
 * the matching one appears first.
 */

import { read, write, remove } from './storage.js';

const KEY = 'profile';

export const PROFILE_FIELDS = [
  {
    key: 'electrical',
    label: 'Shore power service',
    help: 'Check the connector fitted to the RV, the label on the RV, and your pickup instructions.',
    options: [
      { value: '', label: 'Not sure yet' },
      { value: '30amp', label: '30-amp' },
      { value: '50amp', label: '50-amp' }
    ]
  },
  {
    key: 'acUnits',
    label: 'Roof air conditioners',
    help: 'On generator power, run only one unit at a time regardless of how many are fitted.',
    options: [
      { value: '', label: 'Not sure yet' },
      { value: 'one', label: 'One unit' },
      { value: 'two', label: 'Two units' }
    ]
  },
  {
    key: 'waterHeater',
    label: 'Water heater',
    help: 'Tankless heats on demand. Tank-style takes 15 to 20 minutes on propane.',
    options: [
      { value: '', label: 'Not sure yet' },
      { value: 'tankless', label: 'Tankless / on demand' },
      { value: 'tank', label: 'Tank-style' }
    ]
  },
  {
    key: 'refrigerator',
    label: 'Refrigerator',
    help: 'A propane fridge should be set to PROPANE at Burning Man. A 12-volt fridge needs more frequent charging.',
    options: [
      { value: '', label: 'Not sure yet' },
      { value: 'propane', label: 'Propane / absorption' },
      { value: '12v', label: '12 volt' }
    ]
  },
  {
    key: 'leveling',
    label: 'Leveling',
    help: 'Never lift the wheels off the ground with the jacks.',
    options: [
      { value: '', label: 'Not sure yet' },
      { value: 'hydraulic', label: 'Powered / automatic jacks' },
      { value: 'ramps', label: 'Leveling ramps only' }
    ]
  },
  {
    key: 'awning',
    label: 'Awning fitted',
    help: 'At Burning Man the guidance is the same either way: do not open or use the awning on the playa.',
    options: [
      { value: '', label: 'Not sure yet' },
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' }
    ]
  },
  {
    key: 'oven',
    label: 'Oven fitted',
    help: 'Many Class A units have a stovetop and microwave only.',
    options: [
      { value: '', label: 'Not sure yet' },
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' }
    ]
  }
];

export const TEXT_FIELDS = [
  {
    key: 'onRoadCareNumber',
    label: 'On Road Care number',
    help: 'Find the On Road Care number on the key tag. Stored only on this device.',
    placeholder: 'Copy it from the key tag',
    inputMode: 'tel'
  },
  {
    key: 'unitNumber',
    label: 'RV unit number',
    help: 'On Road Care will ask for this. Stored only on this device.',
    placeholder: 'From your paperwork'
  },
  {
    key: 'heightFeet',
    label: 'RV height',
    help: 'Read it from the height sticker on the windshield. At least 13 feet of clearance is required.',
    placeholder: 'e.g. 12 ft 6 in'
  }
];

const DEFAULT_PROFILE = {
  playaMode: true
};

export function loadProfile() {
  const stored = read(KEY, null);
  return { ...DEFAULT_PROFILE, ...(stored || {}) };
}

export function saveProfile(profile) {
  return write(KEY, profile);
}

export function clearProfile() {
  return remove(KEY);
}

export function hasAnyConfiguration(profile) {
  if (!profile) return false;
  return PROFILE_FIELDS.some((field) => Boolean(profile[field.key])) ||
    TEXT_FIELDS.some((field) => Boolean(profile[field.key]));
}

/**
 * Put the variant matching the stored profile first. Nothing is removed — the
 * other sourced configurations stay visible under "Other RV configurations".
 */
export function orderVariants(record, profile) {
  const variants = record.configurationVariants || [];
  if (!profile || variants.length < 2) return variants.map((v) => ({ ...v, matchesProfile: false }));
  const decorated = variants.map((variant) => {
    const match = variant.match || {};
    const keys = Object.keys(match);
    const matchesProfile = keys.length > 0 && keys.every((key) => profile[key] && profile[key] === match[key]);
    return { ...variant, matchesProfile };
  });
  return [...decorated].sort((a, b) => Number(b.matchesProfile) - Number(a.matchesProfile));
}

export function onRoadCareLine(profile, fallbackHint) {
  const number = profile && profile.onRoadCareNumber;
  if (number) return { text: number, isNumber: true };
  return { text: fallbackHint || 'Find the On Road Care number on the key tag.', isNumber: false };
}
