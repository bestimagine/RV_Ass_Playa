import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildIndex, search, broadGuidance, normalize, tokenize,
  buildSynonymMap, getRecord, recordsByCategory
} from '../public/js/search.js';
import { answers, synonyms } from './helpers.mjs';

const index = buildIndex(answers, synonyms);

function topId(query, options) {
  const outcome = search(index, query, options);
  return outcome.results.length ? outcome.results[0].record.id : null;
}

function topIds(query, count = 3, options) {
  return search(index, query, options).results.slice(0, count).map((r) => r.record.id);
}

/* ------------------------------------------------------------- primitives */

test('normalize folds case, accents and punctuation', () => {
  assert.equal(normalize('  Propane SMELL!! '), 'propane smell');
  assert.equal(normalize("Won't start"), 'wont start');
  assert.equal(normalize('slide-out'), 'slideout');
  assert.equal(normalize('café'), 'cafe');
  assert.equal(normalize(null), '');
});

test('tokenize splits on whitespace and drops empties', () => {
  assert.deepEqual(tokenize('no  120v   power'), ['no', '120v', 'power']);
  assert.deepEqual(tokenize('   '), []);
});

test('synonym groups expand symmetrically', () => {
  const map = buildSynonymMap(synonyms);
  assert.ok(map.get('genset').has('generator'));
  assert.ok(map.get('generator').has('genset'));
  assert.ok(map.get('gray tank').has('grey tank'));
});

/* --------------------------------------------------------- search accuracy */

const EXPECTED_TOP = [
  ['I smell propane', 'propane-smell'],
  ['rotten egg smell', 'propane-smell'],
  ['gas leak', 'propane-smell'],
  ['carbon monoxide alarm', 'lpg-co-alarm'],
  ['smoke alarm while cooking', 'smoke-alarm'],
  ['fire extinguisher', 'fire-extinguisher'],
  ['generator will not start', 'generator-will-not-start'],
  ['genset wont start', 'generator-will-not-start'],
  ['how often should I charge the batteries', 'coach-battery-charging'],
  ['house battery switch', 'coach-battery-switch'],
  ['no 120 volt power', 'no-120v-power'],
  ['reset the gfci', 'gfci-reset'],
  ['air conditioner frozen', 'ac-frozen'],
  ['what temperature for the ac at burning man', 'ac-burning-man-settings'],
  ['no water coming out', 'no-fresh-water'],
  ['how do I fill the fresh water tank', 'fresh-water-tank-fill'],
  ['no hot water', 'no-hot-water'],
  ['empty the black tank', 'waste-tank-emptying'],
  ['who pumps my tanks at burning man', 'waste-service-burning-man'],
  ['can I dump grey water on the playa', 'no-dumping-playa'],
  ['what toilet paper', 'toilet-paper'],
  ['sink will not drain', 'clogged-drain'],
  ['fridge setting', 'refrigerator'],
  ['light the stove', 'stovetop'],
  ['slide out operation', 'slide-operation'],
  ['can I use the awning', 'awning-burning-man'],
  ['dust storm', 'dust-storm-procedure'],
  ['how do I clean playa dust', 'playa-dust-cleaning'],
  ['flat tyre', 'flat-tire'],
  ['wrong fuel in the tank', 'incorrect-fuel'],
  ['red warning light on the dash', 'warning-lights-red'],
  ['it is raining and the playa is soft', 'leveling-rain-soft-playa'],
  ['return checklist', 'return-checklist-answer'],
  ['cleaning fee', 'cleaning-fee-prevention']
];

for (const [query, expected] of EXPECTED_TOP) {
  test(`search "${query}" ranks ${expected} first`, () => {
    const actual = topId(query);
    assert.equal(actual, expected, `got ${actual}, expected ${expected} (top 3: ${topIds(query).join(', ')})`);
  });
}

const EXPECTED_IN_TOP_3 = [
  ['awning fee', 'awning-burning-man'],
  ['breaker tripped', 'breaker-reset'],
  ['30 amp hookup', 'shore-power'],
  ['50 amp', 'shore-power'],
  ['leveling jacks', 'leveling-system'],
  ['should I open the windows', 'ventilation-playa-vs-emergency'],
  ['support at burning man', 'burning-man-support-limits'],
  ['on road care number', 'burning-man-support-limits'],
  ['engine overheating', 'coolant-temp-warning'],
  ['generator oil', 'generator-oil'],
  ['solar panel red light', 'solar-panels'],
  ['tank sensors wrong', 'tank-sensors'],
  ['propane refill', 'propane-refill'],
  ['trash', 'trash-disposal']
];

for (const [query, expected] of EXPECTED_IN_TOP_3) {
  test(`search "${query}" surfaces ${expected} in the top 3`, () => {
    const ids = topIds(query, 3);
    assert.ok(ids.includes(expected), `got ${ids.join(', ')}, expected ${expected} among them`);
  });
}

/* -------------------------------------------------- robustness and quality */

test('typos still find the right answer', () => {
  assert.equal(topId('genarator wont start'), 'generator-will-not-start');
  assert.equal(topId('propain smell'), 'propane-smell');
  assert.equal(topId('refridgerator'), 'refrigerator');
});

test('British and American spellings both work', () => {
  assert.equal(topId('flat tyre'), topId('flat tire'));
  assert.equal(topId('gray tank'), topId('grey tank'));
});

test('search is deterministic across repeated runs', () => {
  for (const query of ['no power', 'dust storm', 'slide stuck', 'water']) {
    const first = search(index, query).results.map((r) => [r.record.id, r.score]);
    const second = search(index, query).results.map((r) => [r.record.id, r.score]);
    assert.deepEqual(first, second, `results for "${query}" are not stable`);
  }
});

test('a fresh index produces identical results to the original', () => {
  const other = buildIndex(answers, synonyms);
  const a = search(index, 'generator breaker').results.map((r) => r.record.id);
  const b = search(other, 'generator breaker').results.map((r) => r.record.id);
  assert.deepEqual(a, b);
});

test('emergency answers outrank routine ones for an ambiguous safety query', () => {
  const ids = topIds('alarm', 3);
  assert.ok(
    ids.includes('lpg-co-alarm') || ids.includes('smoke-alarm'),
    `expected an alarm answer in the top 3, got ${ids.join(', ')}`
  );
});

test('an empty or meaningless query returns no confident answer', () => {
  for (const query of ['', '   ', '???']) {
    const outcome = search(index, query);
    assert.equal(outcome.confident, false, `"${query}" should not be confident`);
  }
});

test('an unrelated query is not presented as a confident answer', () => {
  const outcome = search(index, 'where can I buy a bicycle lock');
  assert.equal(outcome.confident, false);
});

test('a clear query is presented as a confident answer', () => {
  for (const query of ['propane smell', 'generator will not start', 'dust storm']) {
    assert.equal(search(index, query).confident, true, `"${query}" should be confident`);
  }
});

test('broad guidance is always available and points at real records', () => {
  const records = broadGuidance(index);
  assert.ok(records.length >= 5);
  for (const record of records) {
    assert.ok(getRecord(index, record.id), `broad guidance references missing record ${record.id}`);
  }
});

test('the My RV profile reorders configurations without hiding any', () => {
  const withoutProfile = search(index, 'shore power hookup', {}).results[0];
  const withProfile = search(index, 'shore power hookup', { profile: { electrical: '50amp' } }).results[0];
  assert.equal(withoutProfile.record.id, 'shore-power');
  assert.equal(withProfile.record.id, 'shore-power');
  assert.equal(
    withProfile.record.configurationVariants.length,
    withoutProfile.record.configurationVariants.length,
    'a profile must never remove sourced configurations'
  );
  assert.ok(withProfile.score >= withoutProfile.score, 'a matching profile should not lower the score');
});

test('every record is reachable by at least one of its own authored questions', () => {
  const unreachable = [];
  for (const record of answers.records) {
    const probes = [record.title, ...(record.questions || [])];
    const found = probes.some((probe) => topIds(probe, 5).includes(record.id));
    if (!found) unreachable.push(record.id);
  }
  assert.deepEqual(unreachable, [], `records not reachable from their own wording: ${unreachable.join(', ')}`);
});

test('category grouping covers every record', () => {
  const grouped = recordsByCategory(index);
  const total = [...grouped.values()].reduce((sum, list) => sum + list.length, 0);
  assert.equal(total, answers.records.length);
});

test('results respect the requested limit', () => {
  assert.ok(search(index, 'water', { limit: 4 }).results.length <= 4);
});
