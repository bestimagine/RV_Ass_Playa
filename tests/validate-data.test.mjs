import test from 'node:test';
import assert from 'node:assert/strict';

import {
  answers, checklists, synonyms, brand, recordsById, checklistsById,
  collectSources, recordText, DOCUMENTS,
  ESCALATION_CONTROL_LIST, VENTILATION_EXCEPTION_RECORDS,
  NORMAL_CONDITIONS_LABEL, EMERGENCY_LABEL
} from './helpers.mjs';

const RISK_LEVELS = new Set(['routine', 'caution', 'emergency']);
const ESCALATION_LEVELS = new Set(['call-now', 'call-before-proceeding', 'call-for-authorization']);

/* ------------------------------------------------------------------ schema */

test('every record has the required fields with the right types', () => {
  for (const record of answers.records) {
    const where = `record ${record.id}`;
    assert.match(record.id, /^[a-z0-9]+(-[a-z0-9]+)*$/, `${where}: id must be a slug`);
    assert.ok(record.title && record.title.length > 3, `${where}: needs a title`);
    assert.ok(record.category, `${where}: needs a category`);
    assert.ok(RISK_LEVELS.has(record.riskLevel), `${where}: bad riskLevel ${record.riskLevel}`);
    assert.ok([1, 2, 3].includes(record.priority), `${where}: priority must be 1-3`);
    assert.ok(Array.isArray(record.questions), `${where}: questions must be an array`);
    assert.ok(Array.isArray(record.aliases), `${where}: aliases must be an array`);
    assert.ok(Array.isArray(record.steps), `${where}: steps must be an array`);
    assert.ok(Array.isArray(record.doNot), `${where}: doNot must be an array`);
    assert.ok(Array.isArray(record.sources) && record.sources.length > 0, `${where}: needs sources`);
    assert.equal(typeof record.playaOnly, 'boolean', `${where}: playaOnly must be boolean`);
    assert.equal(typeof record.configurationNotice, 'boolean', `${where}: configurationNotice must be boolean`);
    assert.ok(Array.isArray(record.related), `${where}: related must be an array`);
    assert.equal(typeof record.searchWeight, 'number', `${where}: searchWeight must be a number`);
    assert.ok(record.immediateAction && record.immediateAction.length > 5, `${where}: needs an immediateAction`);
  }
});

test('record ids are unique', () => {
  const ids = answers.records.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate record id');
});

test('every related link points to a real record', () => {
  for (const record of answers.records) {
    for (const id of record.related) {
      assert.ok(recordsById.has(id), `record ${record.id} links to missing record ${id}`);
    }
  }
});

test('the knowledge base is large enough to be useful', () => {
  assert.ok(answers.records.length >= 95, `expected at least 95 records, found ${answers.records.length}`);
});

test('record priority matches the highest-priority source it uses', () => {
  for (const record of answers.records) {
    const best = Math.min(...record.sources.map((s) => s.priority));
    assert.equal(record.priority, best, `record ${record.id}: priority ${record.priority} but best source is P${best}`);
  }
});

/* --------------------------------------------------------------- citations */

test('every source names a known document with the correct priority', () => {
  const sources = collectSources(answers).concat(collectSources(checklists));
  assert.ok(sources.length > 0);
  for (const source of sources) {
    const expected = DOCUMENTS[source.document];
    assert.ok(expected, `unknown source document: ${source.document}`);
    assert.equal(source.priority, expected, `${source.document} must be priority ${expected}`);
  }
});

test('PDF sources cite a page and the transcript cites a stable section name', () => {
  const sources = collectSources(answers).concat(collectSources(checklists));
  for (const source of sources) {
    if (source.document === 'El Monte Class A Walkthrough Transcript') {
      assert.ok(source.section, 'transcript sources must cite a stable section name');
      assert.equal(source.page, undefined, 'the transcript has no page numbers');
    } else {
      assert.equal(typeof source.page, 'number', `${source.document} sources must cite a page`);
      assert.ok(source.page >= 1, 'page numbers start at 1');
      const max = source.document === 'Burning Man 2026 RV Rental Guide' ? 6 : 40;
      assert.ok(source.page <= max, `${source.document} p.${source.page} is outside the verified range`);
    }
  }
});

test('every checklist item carries at least one citation', () => {
  for (const checklist of checklists.checklists) {
    for (const section of checklist.sections) {
      for (const item of section.items) {
        assert.ok(
          Array.isArray(item.sources) && item.sources.length > 0,
          `checklist ${checklist.id} item "${item.text.slice(0, 40)}…" has no source`
        );
      }
    }
  }
});

/* -------------------------------------------------------------- escalation */

test('escalation is present exactly on the Phase 1 control list', () => {
  const actual = answers.records.filter((r) => r.escalation).map((r) => r.id).sort();
  const expected = Object.keys(ESCALATION_CONTROL_LIST).sort();
  assert.deepEqual(actual, expected, 'escalation records drifted from the Phase 1 escalation map');
});

test('routine records keep escalation null', () => {
  for (const record of answers.records) {
    if (ESCALATION_CONTROL_LIST[record.id]) continue;
    assert.equal(record.escalation, null, `record ${record.id} must have escalation null`);
  }
});

test('each escalation uses the expected level and is fully specified', () => {
  for (const [id, level] of Object.entries(ESCALATION_CONTROL_LIST)) {
    const record = recordsById.get(id);
    assert.ok(record, `escalation control list references missing record ${id}`);
    const escalation = record.escalation;
    assert.ok(ESCALATION_LEVELS.has(escalation.level), `${id}: bad escalation level`);
    assert.equal(escalation.level, level, `${id}: expected escalation level ${level}`);
    assert.ok(escalation.reason && escalation.reason.length > 10, `${id}: escalation needs a reason`);
    assert.ok(escalation.action && escalation.action.length > 10, `${id}: escalation needs an action`);
    assert.equal(typeof escalation.callEmergencyServices, 'boolean', `${id}: callEmergencyServices must be boolean`);
    assert.ok(
      Array.isArray(escalation.sources) && escalation.sources.length > 0,
      `${id}: every escalation shown must have a supporting source citation`
    );
  }
});

test('the Black Rock City service limitation appears where relevant, not everywhere', () => {
  const withNote = answers.records.filter((r) => r.escalation && r.escalation.burningManNote);
  assert.ok(withNote.length >= 6, 'the BRC limitation should appear on the on-playa escalations');
  assert.ok(
    withNote.length < Object.keys(ESCALATION_CONTROL_LIST).length,
    'the BRC limitation must not be repeated on every escalation'
  );
  for (const record of withNote) {
    assert.match(
      record.escalation.burningManNote,
      /Black Rock City/,
      `record ${record.id}: burningManNote should name Black Rock City`
    );
  }
  for (const id of ['oil-change-due', 'repairs-over-100', 'warning-light-service-engine']) {
    assert.equal(
      recordsById.get(id).escalation.burningManNote,
      undefined,
      `record ${id} is administrative and should not repeat the BRC limitation`
    );
  }
});

test('routine troubleshooting does not add a generic On Road Care section', () => {
  const routineTroubleshooting = ['generator-will-not-start', 'no-120v-power', 'breaker-reset', 'gfci-reset', 'ac-frozen', 'no-hot-water', 'no-fresh-water', 'slide-jams'];
  for (const id of routineTroubleshooting) {
    const record = recordsById.get(id);
    assert.equal(record.escalation, null, `record ${id} must stay non-escalating`);
  }
});

/* ------------------------------------------- approved decisions from Phase 1 */

test('no phone number is invented anywhere in the data', () => {
  const blob = JSON.stringify(answers) + JSON.stringify(checklists) + JSON.stringify(brand);
  const phonePatterns = [
    /\(?\b\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4}\b/,
    /\b1[\s.\-]?8(00|44|55|66|77|88)[\s.\-]?\d{3}[\s.\-]?\d{4}\b/,
    /\btel:\+?\d/i
  ];
  for (const pattern of phonePatterns) {
    const match = blob.match(pattern);
    assert.equal(match, null, `looks like a hard-coded phone number: ${match && match[0]}`);
  }
});

test('the On Road Care hint points at the key tag', () => {
  assert.equal(answers.onRoadCareHint, 'Find the On Road Care number on the key tag.');
  assert.equal(brand.onRoadCareHint, 'Find the On Road Care number on the key tag.');
  for (const record of answers.records) {
    if (!record.escalation) continue;
    assert.match(
      record.escalation.action,
      /key tag/i,
      `record ${record.id}: escalation must tell the user where to find the number`
    );
  }
});

test('the instruction hierarchy puts life safety above Burning Man', () => {
  assert.deepEqual(answers.instructionHierarchy, [
    'Immediate life-safety and emergency instructions',
    'Burning Man-specific operating instructions',
    'El Monte Class A walkthrough instructions',
    'General Guest Guide instructions'
  ]);
});

test('the safety-precedence exception distinguishes normal playa conditions from an emergency', () => {
  for (const id of VENTILATION_EXCEPTION_RECORDS) {
    const record = recordsById.get(id);
    assert.ok(record, `missing ventilation record ${id}`);
    const labels = (record.conditionalGuidance || []).map((g) => g.label);
    assert.ok(labels.includes(NORMAL_CONDITIONS_LABEL), `record ${id}: missing "${NORMAL_CONDITIONS_LABEL}"`);
    assert.ok(labels.includes(EMERGENCY_LABEL), `record ${id}: missing "${EMERGENCY_LABEL}"`);
    for (const block of record.conditionalGuidance) {
      assert.ok(block.items.length > 0, `record ${id}: "${block.label}" has no items`);
      assert.ok(block.sources && block.sources.length > 0, `record ${id}: "${block.label}" is uncited`);
    }
    const emergencyBlock = record.conditionalGuidance.find((g) => g.label === EMERGENCY_LABEL);
    assert.match(
      emergencyBlock.items.join(' '),
      /open/i,
      `record ${id}: the emergency block must instruct the user to open up`
    );
  }
});

test('the safety exception is not broadened to comfort or convenience', () => {
  const comfortRecords = ['ac-burning-man-settings', 'playa-dust-prevention', 'dust-storm-procedure'];
  for (const id of comfortRecords) {
    const record = recordsById.get(id);
    assert.ok(
      !record.conditionalGuidance,
      `record ${id} is a comfort or dust topic and must not carry the ventilation exception`
    );
  }
});

test('the awning answer leads with the Burning Man no-use guidance', () => {
  const record = recordsById.get('awning-burning-man');
  assert.equal(record.immediateAction, 'Do not open or use the awning on the playa.');
  assert.equal(record.steps[0], 'Do not open or use the awning on the playa.');
  assert.ok(record.playaOnly, 'the no-use answer is playa-specific');

  const leadText = recordText(record, { exclude: ['contextualNotes'] });
  assert.ok(!/\$50/.test(leadText), 'the awning usage fee must not appear as leading guidance');
  assert.ok(!/Awning Usage/.test(leadText), 'the awning usage package must not appear as leading guidance');

  const contextText = JSON.stringify(record.contextualNotes);
  assert.match(contextText, /\$50/, 'the usage fee belongs in the contextual note');
  assert.match(contextText, /General rental information|not a Burning Man recommendation/i);
  assert.equal(
    (record.configurationVariants || []).length,
    0,
    'the fee page must not be offered as an equally recommended alternative'
  );
});

test('the slide answer refuses to pick a universal driver-seat position', () => {
  const record = recordsById.get('slide-operation');
  assert.match(record.immediateAction, /Vehicle configurations vary/);
  assert.match(record.immediateAction, /fully clear of the slide/);
  assert.match(record.immediateAction, /instruction label beside the slide control/);

  const stepText = record.steps.join(' ');
  assert.ok(!/full upright/i.test(stepText), 'the universal steps must not assert "full upright"');
  assert.ok(!/tipped all the way forward/i.test(stepText), 'the universal steps must not assert "tipped forward"');

  const variantLabels = record.configurationVariants.map((v) => v.label).join(' | ');
  assert.match(variantLabels, /full upright/i, 'the walkthrough variant must still be shown');
  assert.match(variantLabels, /tipped forward/i, 'the Guest Guide variant must still be shown');
  assert.ok(record.configurationNotice, 'the slide answer must carry the configuration notice');
});

test('shore power shows labelled 30-amp and 50-amp alternatives instead of one rule', () => {
  const record = recordsById.get('shore-power');
  const labels = record.configurationVariants.map((v) => v.label);
  assert.ok(labels.some((l) => /30-amp/.test(l)), 'missing a 30-amp configuration');
  assert.ok(labels.some((l) => /50-amp/.test(l)), 'missing a 50-amp configuration');

  const stepText = record.steps.join(' ');
  assert.ok(!/minimum 50/i.test(stepText), 'the universal steps must not assert a minimum amperage');

  const contextText = JSON.stringify(record.contextualNotes || []);
  assert.match(contextText, /connector/i, 'tell the user to check the installed connector');
  assert.match(contextText, /label on the RV|RV label/i, 'tell the user to check the RV label');
  assert.match(contextText, /pickup/i, 'tell the user to check the pickup instructions');

  assert.match(
    record.burningManOverride.join(' '),
    /one A\/C unit at a time/,
    'the universal Burning Man generator instruction must be retained'
  );
});

test('one A/C unit at a time on generator power is stated wherever it applies', () => {
  for (const id of ['ac-one-unit-generator', 'ac-burning-man-settings', 'generator-breaker', 'generator-startup-checks', 'shore-power']) {
    const record = recordsById.get(id);
    assert.match(
      recordText(record),
      /one A\/C unit at a time/i,
      `record ${id} should retain the one-A/C-at-a-time instruction`
    );
  }
});

test('the refrigerator answer avoids a universal numeric setting', () => {
  const record = recordsById.get('refrigerator');
  assert.equal(
    record.immediateAction,
    'Begin at the middle or manufacturer-recommended setting. Allow several hours for the refrigerator to cool before making another adjustment.'
  );
  assert.equal(record.steps[0], record.immediateAction);

  const leadText = recordText(record, { exclude: ['configurationVariants'] });
  assert.ok(!/3 or COLD/.test(leadText), '"3 or COLD" must only appear as a configuration-specific alternative');
  assert.match(
    JSON.stringify(record.configurationVariants),
    /3 or COLD/,
    '"3 or COLD" must be shown as a configuration-specific alternative'
  );
  assert.match(
    record.doNot.join(' '),
    /maximum will not make it colder faster/i,
    'retain the sourced maximum-cooling guidance'
  );
});

test('checklist naming resolves consistently to the Return Checklist', () => {
  const checklist = checklistsById.get('return-checklist');
  assert.ok(checklist, 'there must be a checklist with id return-checklist');
  assert.equal(checklist.title, 'Return Checklist');

  const sectionTitles = checklist.sections.map((s) => s.title);
  assert.ok(sectionTitles.includes('Final return inspection'), 'missing the Final return inspection section');
  assert.equal(
    sectionTitles[sectionTitles.length - 1],
    'Final return inspection',
    'Final return inspection must be the last section'
  );

  const record = recordsById.get('return-checklist-answer');
  assert.equal(record.title, 'Return Checklist');
  assert.equal(record.checklistId, 'return-checklist');
  assert.ok(
    record.aliases.includes('return checklist'),
    'searching "return checklist" must reach the same checklist'
  );

  const otherTitles = checklists.checklists.filter((c) => c.id !== 'return-checklist').map((c) => c.title);
  for (const title of otherTitles) {
    assert.ok(!/^Final return inspection$/.test(title), 'Final return inspection is a section, not a checklist');
  }
});

/* -------------------------------------------------------------- checklists */

test('there are 13 checklists with unique ids and at least one section each', () => {
  assert.equal(checklists.checklists.length, 13);
  const ids = checklists.checklists.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate checklist id');
  for (const checklist of checklists.checklists) {
    assert.ok(checklist.title, `checklist ${checklist.id} needs a title`);
    assert.equal(typeof checklist.playaOnly, 'boolean');
    assert.ok(checklist.sections.length > 0, `checklist ${checklist.id} needs sections`);
    for (const section of checklist.sections) {
      assert.ok(section.title, `checklist ${checklist.id} has an untitled section`);
      assert.ok(section.items.length > 0, `checklist ${checklist.id} section "${section.title}" is empty`);
    }
  }
});

test('the required checklists from the spec are all present', () => {
  const required = [
    'pickup-inspection', 'arriving-burning-man', 'daily-morning', 'daily-evening',
    'before-generator', 'dust-storm', 'service-truck', 'before-moving',
    'leaving-brc', 'cleaning-playa-dust', 'fuel-propane-refill',
    'waste-tank-emptying', 'return-checklist'
  ];
  for (const id of required) {
    assert.ok(checklistsById.has(id), `missing checklist ${id}`);
  }
});

test('records that point at a checklist point at one that exists', () => {
  for (const record of answers.records) {
    if (!record.checklistId) continue;
    assert.ok(checklistsById.has(record.checklistId), `record ${record.id} links to missing checklist ${record.checklistId}`);
  }
});

/* ---------------------------------------------------------------- coverage */

test('the required topics from the spec are all covered', () => {
  const required = [
    'propane-smell', 'lpg-co-alarm', 'smoke-alarm', 'fire-extinguisher',
    'generator-will-not-start', 'generator-breaker', 'generator-oil',
    'coach-battery-charging', 'low-coach-battery', 'no-120v-power',
    'breaker-reset', 'gfci-reset', 'shore-power', 'solar-panels',
    'ac-burning-man-settings', 'ac-frozen', 'thermostat', 'furnace',
    'water-conservation-burning-man', 'fresh-water-tank-fill', 'city-water',
    'water-pump', 'no-fresh-water', 'water-heater', 'no-hot-water',
    'toilet-operation', 'toilet-paper', 'waste-tank-emptying',
    'waste-service-burning-man', 'no-dumping-playa', 'clogged-drain',
    'refrigerator', 'stovetop', 'oven', 'microwave-no-power',
    'slide-operation', 'leveling-system', 'awning-burning-man',
    'driving-clearance', 'backing-spotter', 'flat-tire', 'collision',
    'breakdown', 'warning-lights-red', 'fuel-type', 'incorrect-fuel',
    'propane-tank-valve', 'propane-refill', 'dust-storm-procedure',
    'playa-dust-prevention', 'playa-dust-cleaning', 'cleaning-fee-prevention',
    'trash-disposal', 'leave-no-trace', 'return-checklist-answer',
    'burning-man-support-limits'
  ];
  const missing = required.filter((id) => !recordsById.has(id));
  assert.deepEqual(missing, [], `uncovered required topics: ${missing.join(', ')}`);
});

test('Burning Man guidance is present on the records where it applies', () => {
  const mustCarryBmGuidance = [
    'coach-battery-charging', 'ac-burning-man-settings', 'generator-will-not-start',
    'water-conservation-burning-man', 'waste-tank-emptying', 'awning-burning-man',
    'playa-dust-prevention', 'cleaning-fee-prevention', 'toilet-paper'
  ];
  for (const id of mustCarryBmGuidance) {
    const record = recordsById.get(id);
    const hasBm = (record.burningManOverride || []).length > 0 ||
      record.sources.some((s) => s.priority === 1);
    assert.ok(hasBm, `record ${id} needs Burning Man guidance or a P1 source`);
  }
});

test('playaOnly records are all backed by the Burning Man guide', () => {
  for (const record of answers.records.filter((r) => r.playaOnly)) {
    assert.ok(
      record.sources.some((s) => s.priority === 1),
      `record ${record.id} is playaOnly but has no Burning Man source`
    );
  }
});

/* ----------------------------------------------------------------- synonyms */

test('synonym groups are usable', () => {
  assert.ok(synonyms.groups.length > 30, 'expected a substantial synonym map');
  const seen = new Map();
  for (const group of synonyms.groups) {
    assert.ok(group.length >= 2, `synonym group "${group[0]}" needs at least two phrases`);
    for (const phrase of group) {
      assert.equal(typeof phrase, 'string');
      assert.equal(phrase, phrase.toLowerCase(), `synonym "${phrase}" must be lowercase`);
      const previous = seen.get(phrase);
      assert.equal(previous, undefined, `synonym "${phrase}" appears in two groups (${previous} and ${group[0]})`);
      seen.set(phrase, group[0]);
    }
  }
});

/* -------------------------------------------------------------- versioning */

test('the knowledge base declares its version', () => {
  assert.match(answers.kbVersion, /^\d+\.\d+\.\d+$/);
  assert.match(checklists.checklistsVersion, /^\d+\.\d+\.\d+$/);
});
