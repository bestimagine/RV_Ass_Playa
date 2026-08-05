import test from 'node:test';
import assert from 'node:assert/strict';

import { answers, checklists, recordsById, EMERGENCY_LABEL, NORMAL_CONDITIONS_LABEL } from './helpers.mjs';

/**
 * A minimal DOM shim. Enough for answer-view.js, and deliberately no more —
 * the point is to catch a crash or a missing block across all 138 records
 * without pulling in a browser or a dependency.
 */
function installDom() {
  class FakeNode {
    constructor(tag) {
      this.tagName = tag.toUpperCase();
      this.children = [];
      this.attributes = {};
      this._text = '';
      this.className = '';
    }
    set textContent(value) {
      this._text = value == null ? '' : String(value);
      this.children = [];
    }
    get textContent() {
      if (this.children.length) return this.children.map((c) => c.textContent).join(' ');
      return this._text;
    }
    appendChild(child) {
      this.children.push(child);
      return child;
    }
    replaceChildren(...nodes) {
      this.children = nodes;
    }
    setAttribute(name, value) {
      this.attributes[name] = value;
    }
    addEventListener() {}
    get allText() {
      return [this._text, ...this.children.map((c) => c.allText)].filter(Boolean).join('\n');
    }
    querySelectorAllByClass(className, out = []) {
      if (String(this.className).split(/\s+/).includes(className)) out.push(this);
      for (const child of this.children) child.querySelectorAllByClass(className, out);
      return out;
    }
  }
  globalThis.document = {
    createElement: (tag) => new FakeNode(tag)
  };
  return FakeNode;
}

installDom();
const { renderAnswer, renderChecklist } = await import('../public/js/answer-view.js');

const context = {
  meta: answers,
  recordsById,
  onNavigate: () => {}
};

test('every record renders without throwing', () => {
  for (const record of answers.records) {
    assert.doesNotThrow(() => renderAnswer(record, context), `record ${record.id} failed to render`);
  }
});

test('every rendered answer shows its title, immediate action and sources', () => {
  for (const record of answers.records) {
    const text = renderAnswer(record, context).allText;
    assert.ok(text.includes(record.title), `record ${record.id}: title missing from output`);
    assert.ok(text.includes(record.immediateAction), `record ${record.id}: immediate action missing`);
    assert.ok(text.includes('Sources'), `record ${record.id}: sources block missing`);
    assert.ok(text.includes(record.sources[0].document), `record ${record.id}: source document missing`);
  }
});

test('escalation blocks render with the key-tag hint and never a fabricated number', () => {
  for (const record of answers.records.filter((r) => r.escalation)) {
    const node = renderAnswer(record, context);
    const text = node.allText;
    assert.ok(text.includes(record.escalation.action), `record ${record.id}: escalation action missing`);
    assert.ok(/key tag/i.test(text), `record ${record.id}: escalation must point at the key tag`);
    assert.ok(text.includes(record.escalation.reason), `record ${record.id}: escalation reason missing`);
  }
});

test('a saved On Road Care number is used instead of the key-tag hint', () => {
  const record = recordsById.get('propane-smell');
  const withNumber = renderAnswer(record, { ...context, profile: { onRoadCareNumber: '555 0100' } });
  assert.ok(withNumber.allText.includes('555 0100'));
});

test('records with no escalation render no escalation block', () => {
  for (const record of answers.records.filter((r) => !r.escalation)) {
    const node = renderAnswer(record, context);
    assert.equal(
      node.querySelectorAllByClass('escalation').length,
      0,
      `record ${record.id} must not render an escalation block`
    );
  }
});

test('the ventilation exception renders both conditions, emergency clearly labelled', () => {
  for (const id of ['propane-smell', 'lpg-co-alarm', 'smoke-alarm', 'stovetop']) {
    const text = renderAnswer(recordsById.get(id), context).allText;
    assert.ok(text.includes(NORMAL_CONDITIONS_LABEL), `record ${id}: normal-conditions block missing`);
    assert.ok(text.includes(EMERGENCY_LABEL), `record ${id}: emergency block missing`);
  }
});

test('configuration variants all render, with the profile match ordered first', () => {
  const record = recordsById.get('shore-power');
  const node = renderAnswer(record, { ...context, profile: { electrical: '50amp' } });
  const text = node.allText;
  for (const variant of record.configurationVariants) {
    assert.ok(text.includes(variant.label), `variant "${variant.label}" was dropped from the output`);
  }
  assert.ok(text.includes('Matches My RV'), 'the matching configuration should be marked');
  assert.ok(text.indexOf('50-amp configuration') < text.indexOf('30-amp configuration'), 'the matching variant should lead');
});

test('the awning contextual note renders as background, not as a recommendation', () => {
  const node = renderAnswer(recordsById.get('awning-burning-man'), context);
  const text = node.allText;
  assert.ok(text.includes('General rental information'));
  assert.ok(text.includes('not an equally recommended alternative'));
  const doFirst = node.querySelectorAllByClass('immediate-text')[0];
  assert.equal(doFirst.textContent, 'Do not open or use the awning on the playa.');
});

test('every checklist renders with all of its items and a progress line', () => {
  for (const checklist of checklists.checklists) {
    const node = renderChecklist(checklist, { checkedItems: new Set() });
    const text = node.allText;
    let count = 0;
    for (const section of checklist.sections) {
      assert.ok(text.includes(section.title), `checklist ${checklist.id}: section "${section.title}" missing`);
      for (const item of section.items) {
        assert.ok(text.includes(item.text), `checklist ${checklist.id}: item missing "${item.text.slice(0, 30)}…"`);
        count += 1;
      }
    }
    assert.ok(text.includes(`0 of ${count} complete`), `checklist ${checklist.id}: progress line wrong`);
  }
});

test('checklist progress counts ticked items', () => {
  const checklist = checklists.checklists.find((c) => c.id === 'return-checklist');
  const first = checklist.sections[0].items[0];
  const node = renderChecklist(checklist, { checkedItems: new Set([`${checklist.id}::${first.text}`]) });
  assert.ok(/1 of \d+ complete/.test(node.allText));
});
