/**
 * Regression tests for the Stage 2 search refinement.
 *
 * Every query here appears in docs/search-refinement-audit.md with a measured
 * "before" ranking. These assertions lock in the "after".
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildIndex, search, explainSearch, inferIntent, INTENTS, CONFIDENCE_THRESHOLD
} from '../public/js/search.js';
import { answers, synonyms, recordsById } from './helpers.mjs';

const index = buildIndex(answers, synonyms);

const ids = (query, count = 5, options) =>
  search(index, query, options).results.slice(0, count).map((r) => r.record.id);
const topId = (query, options) => ids(query, 1, options)[0] || null;
const rankOf = (query, id) => {
  const all = search(index, query, { limit: 30 }).results.map((r) => r.record.id);
  const at = all.indexOf(id);
  return at === -1 ? Infinity : at + 1;
};

/* ------------------------------------------------------- 1. dust storms */

test('the dust-storm procedure leads every direct storm and whiteout query', () => {
  for (const query of [
    'dust storm',
    'whiteout',
    'storm coming',
    'blowing dust',
    'visibility is low',
    'what do I close during a dust storm?'
  ]) {
    assert.equal(topId(query), 'dust-storm-procedure', `"${query}" should lead with the dust-storm procedure`);
  }
});

test('storm queries are answered confidently rather than deferred to broad guidance', () => {
  for (const query of ['dust storm', 'whiteout', 'storm coming', 'blowing dust', 'visibility is low']) {
    assert.equal(search(index, query).confident, true, `"${query}" should produce a confident answer`);
  }
});

test('low-visibility wording reaches the storm procedure, not the battery answer', () => {
  assert.equal(topId('visibility is low'), 'dust-storm-procedure');
  assert.equal(topId('low visibility'), 'dust-storm-procedure');
  assert.ok(rankOf('visibility is low', 'low-coach-battery') > 1, 'the low-battery record must not lead');
});

test('daily checks stay well below the storm procedure unless asked for', () => {
  const storm = search(index, 'dust storm').results;
  const dailyRank = rankOf('dust storm', 'daily-burning-man-checks');
  assert.equal(storm[0].record.id, 'dust-storm-procedure');
  assert.ok(dailyRank > 3, `daily checks ranked ${dailyRank} for a bare storm query`);

  // Explicit checklist intent is allowed to surface it.
  assert.ok(
    ids('dust storm daily checks', 3).includes('daily-burning-man-checks'),
    'an explicit daily-checks query should surface the daily checks record'
  );
});

test('waste, rain, return and generic Burning Man records stay away from an urgent storm query', () => {
  const unwanted = [
    'waste-service-burning-man', 'no-dumping-playa', 'waste-tank-emptying',
    'leveling-rain-soft-playa', 'return-checklist-answer', 'pre-return-cleaning',
    'burning-man-surcharge', 'burning-man-support-limits'
  ];
  const top = ids('dust storm', 5);
  for (const id of unwanted) {
    assert.ok(!top.includes(id), `${id} should not be in the top 5 for "dust storm" (got ${top.join(', ')})`);
  }
});

test('running the generator in a storm surfaces both storm answers first', () => {
  const top = ids('should I run the generator in a dust storm?', 2);
  assert.deepEqual(
    [...top].sort(),
    ['charging-vs-dust-storm', 'dust-storm-procedure'],
    `expected both storm answers in the top 2, got ${top.join(', ')}`
  );
});

/* ------------------------------- 2. preparation, cleaning and fees */

test('floor-protection wording finds the brown paper answer', () => {
  for (const query of ['floor protection', 'brown paper', 'Home Depot', 'cover the floor', 'protect the floor']) {
    assert.equal(topId(query), 'playa-preparation-floor', `"${query}" should lead with the preparation answer`);
  }
});

test('the preparation answer carries brown paper, Home Depot and blue painter\u2019s tape together', () => {
  const record = recordsById.get('playa-preparation-floor');
  const text = JSON.stringify(record);
  assert.match(text, /thick brown paper/i);
  assert.match(text, /Home Depot/i);
  assert.match(text, /BLUE painter\u2019s tape|BLUE painter's tape/i);
  assert.match(text, /sheets/i);
  assert.match(text, /window screens/i);
  assert.match(text, /shrink-wrap/i);
  assert.ok(
    record.doNot.some((line) => /tape other than blue/i.test(line)),
    'the prohibition on other tape must be explicit'
  );
});

test('tape queries are answered confidently by a tape record', () => {
  const outcome = search(index, "blue painter's tape");
  assert.equal(outcome.confident, true);
  assert.ok(
    ['stickers-tape', 'playa-preparation-floor'].includes(outcome.results[0].record.id),
    `got ${outcome.results[0].record.id}`
  );
  assert.ok(ids("blue painter's tape", 2).includes('playa-preparation-floor'));
});

test('the cleaning query finds the vinegar-wash procedure', () => {
  assert.equal(topId('how do I clean playa dust?'), 'playa-dust-cleaning');
  assert.equal(topId('what cleaner for playa dust'), 'playa-dust-cleaning');
});

test('the cleaning-fee answer leads with prevention, not with the fee amount', () => {
  assert.equal(topId('how do I avoid a cleaning fee?'), 'cleaning-fee-prevention');
  const record = recordsById.get('cleaning-fee-prevention');
  assert.match(record.immediateAction, /cover up|prevent|vinegar|trash/i,
    'the immediate action must tell the user what to do, not only what it costs');
  assert.match(record.steps[0], /prevent/i, 'the first step must be preventative');
  assert.ok(
    record.steps.some((s) => /vinegar wash/i.test(s)),
    'the sourced cleaning method must appear in the steps'
  );
});

test('unrelated Burning Man records do not crowd a cleaning query', () => {
  const top = ids('how do I clean playa dust?', 4);
  for (const id of ['awning-burning-man', 'burning-man-surcharge', 'waste-service-burning-man', 'no-dumping-playa']) {
    assert.ok(!top.includes(id), `${id} should not be in the top 4 (got ${top.join(', ')})`);
  }
});

/* ------------------------------------------------- 3. electrical queries */

test('outlet queries produce a confident electrical answer', () => {
  const outcome = search(index, 'why are the outlets not working?');
  assert.equal(outcome.confident, true, 'this query must no longer fall back to "no single answer clearly matched"');
  assert.equal(outcome.results[0].record.id, 'no-120v-power');
});

test('the electrical-power and GFCI records take the top two places for outlet queries', () => {
  for (const query of [
    'why are the outlets not working?',
    'outlets not working',
    'sockets are dead',
    'no 120 volt power'
  ]) {
    const top = ids(query, 2);
    assert.ok(
      top.includes('no-120v-power') || top.includes('gfci-reset'),
      `"${query}" should surface an electrical record in the top 2, got ${top.join(', ')}`
    );
  }
  const outlets = ids('why are the outlets not working?', 2);
  assert.deepEqual([...outlets].sort(), ['gfci-reset', 'no-120v-power']);
});

test('reset wording goes to the GFCI record', () => {
  assert.equal(topId('reset the outlet'), 'gfci-reset');
  assert.equal(topId('reset the gfci'), 'gfci-reset');
});

/* ------------------------------------------- 4. life safety is untouched */

test('the propane-smell emergency procedure stays first', () => {
  for (const query of [
    'what do I do if I smell propane?',
    'I smell propane',
    'gas leak',
    'rotten egg smell'
  ]) {
    assert.equal(topId(query), 'propane-smell', `"${query}" must lead with the propane emergency`);
  }
});

test('emergency ventilation still overrides normal dust sealing', () => {
  const ventilation = recordsById.get('ventilation-playa-vs-emergency');
  assert.ok(ventilation.conditionalGuidance, 'the ventilation record must keep its conditional guidance');
  assert.ok(rankOf('should I open the windows', 'ventilation-playa-vs-emergency') <= 3);

  // The dust-prevention answers must keep pointing at the exception.
  for (const id of ['playa-dust-prevention', 'dust-storm-procedure']) {
    const record = recordsById.get(id);
    const text = JSON.stringify(record);
    assert.ok(
      /emergency/i.test(text),
      `${id} must still acknowledge the emergency-ventilation exception`
    );
  }
});

test('alarm and smoke queries still reach their safety records', () => {
  assert.equal(topId('carbon monoxide alarm'), 'lpg-co-alarm');
  assert.equal(topId('smoke alarm while cooking'), 'smoke-alarm');
});

/* -------------------------------------------------------- 5. prohibition */

test('the Burning Man awning prohibition stays first', () => {
  for (const query of [
    'can I use the awning at Burning Man?',
    'can I use the awning',
    'should I put out the awning on the playa'
  ]) {
    assert.equal(topId(query), 'awning-burning-man', `"${query}" must lead with the prohibition`);
  }
  assert.equal(
    recordsById.get('awning-burning-man').immediateAction,
    'Do not open or use the awning on the playa.'
  );
});

test('generic Burning Man records do not outrank the specific awning answer', () => {
  const results = search(index, 'can I use the awning at Burning Man?').results;
  assert.equal(results[0].record.id, 'awning-burning-man');
  assert.ok(
    results[0].score >= results[1].score * 2,
    `the specific answer should win clearly, got ${results[0].score.toFixed(1)} vs ${results[1].score.toFixed(1)}`
  );
});

/* ------------------------------------------------------ 6. checklists */

test('checklist records only lead when checklist intent is explicit', () => {
  const checklistRecords = answers.records.filter((r) => r.checklistId).map((r) => r.id);
  const nonChecklistQueries = [
    'dust storm', 'how do I clean playa dust?', 'brown paper',
    'why are the outlets not working?', 'what do I do if I smell propane?'
  ];
  for (const query of nonChecklistQueries) {
    const top = topId(query);
    assert.ok(!checklistRecords.includes(top), `"${query}" led with checklist record ${top}`);
  }

  assert.equal(topId('return checklist'), 'return-checklist-answer');
  assert.ok(ids('daily checklist', 2).includes('daily-burning-man-checks'));
});

/* ---------------------------------------------------------- 7. intent */

test('intent inference is deterministic and uses only the declared vocabulary', () => {
  assert.deepEqual(inferIntent('how do I clean playa dust?').sort(), ['cleaning', 'procedure']);
  assert.ok(inferIntent('what do I do if I smell propane?').includes('emergency'));
  assert.ok(inferIntent('why are the outlets not working?').includes('troubleshoot'));
  assert.ok(inferIntent('how do I avoid a cleaning fee?').includes('prevention'));
  assert.ok(inferIntent('daily checklist').includes('checklist'));
  assert.ok(inferIntent('can I use the awning at Burning Man?').includes('prohibition'));
  assert.ok(inferIntent('what should I check every day').includes('daily-routine'));
  assert.ok(inferIntent('before returning the RV').includes('return'));
  assert.deepEqual(inferIntent(''), []);

  for (const query of ['dust storm', 'brown paper', 'Home Depot', 'reset the outlet']) {
    for (const intent of inferIntent(query)) {
      assert.ok(INTENTS.includes(intent), `unknown intent ${intent}`);
    }
  }
  assert.deepEqual(inferIntent('how do I clean playa dust?'), inferIntent('how do I clean playa dust?'));
});

test('every record declares at least one intent from the supported set', () => {
  const bad = [];
  for (const record of answers.records) {
    if (!Array.isArray(record.intents) || !record.intents.length) bad.push(record.id);
    else if (record.intents.some((i) => !INTENTS.includes(i))) bad.push(`${record.id} (unknown intent)`);
  }
  assert.deepEqual(bad, [], `records with missing or unknown intents: ${bad.join(', ')}`);
});

test('keywords are authored as an array on every record', () => {
  for (const record of answers.records) {
    assert.ok(Array.isArray(record.keywords), `${record.id} is missing a keywords array`);
  }
});

/* ------------------------------------------------- 8. match diagnostics */

test('the development explain helper reports why a result matched', () => {
  const detail = explainSearch(index, 'brown paper', { limit: 3 });
  assert.equal(detail.normalized, 'brown paper');
  assert.deepEqual(detail.tokens, ['brown', 'paper']);
  assert.deepEqual(detail.intents, ['prevention']);
  assert.equal(detail.threshold, CONFIDENCE_THRESHOLD);

  const top = detail.results[0];
  assert.equal(top.id, 'playa-preparation-floor');
  assert.ok(top.contributions.length > 0, 'contributions must be reported');
  assert.ok(top.contributions.every((c) => typeof c.field === 'string' && typeof c.value === 'number'));
  assert.ok(top.contributions.some((c) => c.kind === 'phrase'), 'the matched phrase must be reported');
  assert.ok(top.matchedFields.includes('keywords'));
  assert.ok('multipliers' in top && 'coverage' in top.multipliers);
  assert.equal(top.passedThreshold, true);
  assert.ok(Array.isArray(top.boosts) && Array.isArray(top.penalties));
});

test('diagnostics are withheld from normal searches', () => {
  const plain = search(index, 'brown paper');
  assert.ok(!('explanation' in plain.results[0]), 'production results must not carry diagnostics');
  const explained = search(index, 'brown paper', { explain: true });
  assert.ok('explanation' in explained.results[0]);
});

test('the checklist penalty and intent boost are visible in the diagnostics', () => {
  const withoutIntent = explainSearch(index, 'dust storm', { limit: 30 });
  const daily = withoutIntent.results.find((r) => r.id === 'daily-burning-man-checks');
  if (daily) {
    assert.ok(
      daily.penalties.some((p) => p.reason === 'checklist-without-intent'),
      'the checklist damping must be reported as a penalty'
    );
  }
  const withIntent = explainSearch(index, 'daily checklist', { limit: 10 });
  const boosted = withIntent.results.find((r) => r.id === 'daily-burning-man-checks');
  assert.ok(boosted, 'the daily checks record should appear for an explicit checklist query');
  assert.ok(boosted.boosts.some((b) => b.reason === 'checklist-intent'));
});

/* ----------------------------------------------- 9. general regressions */

test('rare words outrank words shared across the knowledge base', () => {
  const detail = explainSearch(index, 'home depot', { limit: 2 });
  const contributions = detail.results[0].contributions;
  const depot = contributions.find((c) => c.token === 'depot');
  assert.ok(depot, 'the rare token must contribute');
  assert.ok(depot.rarity > 0.8, `"depot" should be treated as rare, got ${depot.rarity}`);

  const burning = explainSearch(index, 'burning man', { limit: 1 }).results[0].contributions
    .find((c) => c.token === 'burning');
  if (burning) assert.ok(burning.rarity < 0.7, `"burning" should be treated as common, got ${burning.rarity}`);
});

test('body-text matches cannot outweigh an authoritative field match', () => {
  const detail = explainSearch(index, 'dust storm', { limit: 1 });
  const parts = detail.results[0].contributions;
  const strongest = parts.filter((c) => c.kind === 'token')[0];
  const body = parts.filter((c) => c.kind === 'token-body');
  for (const part of body) {
    assert.ok(part.value < strongest.value, 'a body match must never exceed the best authoritative match');
    assert.ok(part.value <= 1.8, `body contributions are capped, got ${part.value}`);
  }
});

test('ranking is stable across repeated runs and fresh indexes', () => {
  const other = buildIndex(answers, synonyms);
  for (const query of ['dust storm', 'brown paper', 'reset the outlet', 'can I use the awning at Burning Man?']) {
    const a = search(index, query).results.map((r) => [r.record.id, r.score]);
    const b = search(index, query).results.map((r) => [r.record.id, r.score]);
    const c = search(other, query).results.map((r) => [r.record.id, r.score]);
    assert.deepEqual(a, b, `"${query}" is not stable across runs`);
    assert.deepEqual(a, c, `"${query}" is not stable across indexes`);
  }
});

test('every audited query returns at least one result', () => {
  const audited = [
    'dust storm', 'dust storm daily checks', 'whiteout', 'storm coming', 'blowing dust',
    'visibility is low', 'should I run the generator in a dust storm?',
    'what do I close during a dust storm?', 'how do I clean playa dust?',
    'how do I avoid a cleaning fee?', 'floor protection', 'brown paper', "blue painter's tape",
    'Home Depot', 'why are the outlets not working?', 'reset the outlet',
    'what do I do if I smell propane?', 'can I use the awning at Burning Man?'
  ];
  for (const query of audited) {
    assert.ok(search(index, query).results.length > 0, `"${query}" returned nothing`);
  }
});
