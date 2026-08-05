/**
 * Renders a knowledge record. Everything is built with createElement rather
 * than innerHTML so authored content can never be interpreted as markup.
 */

import { orderVariants, onRoadCareLine } from './profile.js';

const ESCALATION_PRESENTATION = {
  'call-now': { className: 'escalation escalation--now', heading: 'Call On Road Care now' },
  'call-before-proceeding': { className: 'escalation escalation--before', heading: 'Call On Road Care before going further' },
  'call-for-authorization': { className: 'escalation escalation--admin', heading: 'Contact On Road Care for authorisation' }
};

const RISK_LABEL = {
  emergency: 'Emergency',
  caution: 'Take care',
  routine: 'Routine'
};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function list(items, className) {
  const ul = el('ul', className);
  for (const item of items) ul.appendChild(el('li', null, item));
  return ul;
}

function orderedList(items, className) {
  const ol = el('ol', className);
  for (const item of items) ol.appendChild(el('li', null, item));
  return ol;
}

function sourceLabel(source) {
  const parts = [source.document];
  if (source.page) parts.push(`p.${source.page}`);
  if (source.section) parts.push(source.section);
  return parts.join(' — ');
}

function sourceList(sources) {
  const ul = el('ul', 'source-list');
  for (const source of sources) {
    const li = el('li');
    li.appendChild(el('span', `source-badge source-badge--p${source.priority}`, `P${source.priority}`));
    li.appendChild(el('span', 'source-text', sourceLabel(source)));
    ul.appendChild(li);
  }
  return ul;
}

function section(title, className) {
  const wrapper = el('section', className);
  if (title) wrapper.appendChild(el('h3', 'section-title', title));
  return wrapper;
}

function renderConditionalGuidance(record) {
  const wrapper = section('Windows and vents', 'block block--conditional');
  for (const guidance of record.conditionalGuidance) {
    const isEmergency = /emergency/i.test(guidance.label);
    const card = el('div', `conditional-card ${isEmergency ? 'conditional-card--emergency' : 'conditional-card--normal'}`);
    card.appendChild(el('h4', 'conditional-label', guidance.label));
    card.appendChild(list(guidance.items, 'conditional-items'));
    if (guidance.sources && guidance.sources.length) card.appendChild(sourceList(guidance.sources));
    wrapper.appendChild(card);
  }
  return wrapper;
}

function renderVariants(record, profile, noticeText) {
  const variants = orderVariants(record, profile);
  if (!variants.length) return null;
  const matched = variants.filter((v) => v.matchesProfile);
  const heading = matched.length ? 'Your configuration, and other RV configurations' : 'Other RV configurations';
  const wrapper = section(heading, 'block block--variants');

  if (record.configurationNotice) {
    wrapper.appendChild(el('p', 'configuration-notice', noticeText));
  }

  for (const variant of variants) {
    const details = el('details', `variant ${variant.matchesProfile ? 'variant--matched' : ''}`);
    if (variant.matchesProfile || variants.length === 1) details.open = true;
    const summary = el('summary', 'variant-summary');
    summary.appendChild(el('span', 'variant-label', variant.label));
    if (variant.matchesProfile) summary.appendChild(el('span', 'variant-tag', 'Matches My RV'));
    details.appendChild(summary);
    details.appendChild(list(variant.steps || [], 'variant-steps'));
    if (variant.sources && variant.sources.length) details.appendChild(sourceList(variant.sources));
    wrapper.appendChild(details);
  }
  return wrapper;
}

function renderContextualNotes(record) {
  const wrapper = section('General rental information', 'block block--context');
  wrapper.appendChild(el('p', 'context-caption', 'Background only. This is not an equally recommended alternative.'));
  for (const note of record.contextualNotes) {
    const card = el('div', 'context-card');
    card.appendChild(el('p', null, note.text));
    if (note.sources && note.sources.length) card.appendChild(sourceList(note.sources));
    wrapper.appendChild(card);
  }
  return wrapper;
}

function renderEscalation(record, profile, hint) {
  const presentation = ESCALATION_PRESENTATION[record.escalation.level] || ESCALATION_PRESENTATION['call-before-proceeding'];
  const wrapper = el('section', `block ${presentation.className}`);
  wrapper.appendChild(el('h3', 'section-title', presentation.heading));

  if (record.escalation.callEmergencyServices) {
    wrapper.appendChild(el('p', 'escalation-999', 'If anyone is in danger, call emergency services (911) first.'));
  }

  wrapper.appendChild(el('p', 'escalation-action', record.escalation.action));

  const contact = onRoadCareLine(profile, hint);
  const contactRow = el('p', 'escalation-contact');
  if (contact.isNumber) {
    const link = el('a', 'escalation-number', contact.text);
    link.href = `tel:${contact.text.replace(/[^+\d]/g, '')}`;
    contactRow.appendChild(el('span', null, 'On Road Care: '));
    contactRow.appendChild(link);
  } else {
    contactRow.textContent = contact.text;
  }
  wrapper.appendChild(contactRow);

  if (record.escalation.burningManNote) {
    wrapper.appendChild(el('p', 'escalation-brc', record.escalation.burningManNote));
  }

  const why = el('details', 'escalation-why');
  why.appendChild(el('summary', null, 'Why this needs a call'));
  why.appendChild(el('p', null, record.escalation.reason));
  why.appendChild(sourceList(record.escalation.sources || []));
  wrapper.appendChild(why);

  return wrapper;
}

export function renderAnswer(record, context = {}) {
  const { profile = null, meta = {}, onNavigate = null, recordsById = new Map() } = context;
  const article = el('article', `answer answer--${record.riskLevel}`);
  article.setAttribute('aria-labelledby', `answer-title-${record.id}`);

  const header = el('header', 'answer-header');
  const tags = el('div', 'answer-tags');
  tags.appendChild(el('span', `risk-tag risk-tag--${record.riskLevel}`, RISK_LABEL[record.riskLevel] || record.riskLevel));
  tags.appendChild(el('span', 'category-tag', record.category));
  if (record.playaOnly) tags.appendChild(el('span', 'playa-tag', 'Burning Man'));
  header.appendChild(tags);
  const title = el('h2', 'answer-title', record.title);
  title.id = `answer-title-${record.id}`;
  header.appendChild(title);
  article.appendChild(header);

  if (record.immediateAction) {
    const immediate = el('div', 'block block--immediate');
    immediate.appendChild(el('h3', 'section-title', 'Do this first'));
    immediate.appendChild(el('p', 'immediate-text', record.immediateAction));
    article.appendChild(immediate);
  }

  const hasConditional = Array.isArray(record.conditionalGuidance) && record.conditionalGuidance.length > 0;
  if (hasConditional && record.riskLevel === 'emergency') {
    article.appendChild(renderConditionalGuidance(record));
  }

  if (record.steps && record.steps.length) {
    const steps = section('Steps', 'block block--steps');
    steps.appendChild(orderedList(record.steps, 'step-list'));
    article.appendChild(steps);
  }

  if (record.burningManOverride && record.burningManOverride.length) {
    const bm = section('At Burning Man', 'block block--burningman');
    bm.appendChild(list(record.burningManOverride, 'bm-list'));
    article.appendChild(bm);
  }

  if (hasConditional && record.riskLevel !== 'emergency') {
    article.appendChild(renderConditionalGuidance(record));
  }

  if (record.configurationVariants && record.configurationVariants.length) {
    const variants = renderVariants(record, profile, meta.configurationNoticeText);
    if (variants) article.appendChild(variants);
  } else if (record.configurationNotice) {
    const notice = el('div', 'block block--notice');
    notice.appendChild(el('p', 'configuration-notice', meta.configurationNoticeText));
    article.appendChild(notice);
  }

  if (record.contextualNotes && record.contextualNotes.length) {
    article.appendChild(renderContextualNotes(record));
  }

  if (record.doNot && record.doNot.length) {
    const donot = section('Do not', 'block block--donot');
    donot.appendChild(list(record.doNot, 'donot-list'));
    article.appendChild(donot);
  }

  if (record.escalation) {
    article.appendChild(renderEscalation(record, profile, meta.onRoadCareHint));
  }

  if (record.checklistId && onNavigate) {
    const checklistBlock = el('div', 'block block--checklist-link');
    const button = el('button', 'button button--primary', 'Open the full checklist');
    button.type = 'button';
    button.addEventListener('click', () => onNavigate({ view: 'checklist', id: record.checklistId }));
    checklistBlock.appendChild(button);
    article.appendChild(checklistBlock);
  }

  const sources = section('Sources', 'block block--sources');
  sources.appendChild(sourceList(record.sources || []));
  const legend = el('p', 'source-legend', 'P1 Burning Man guide · P2 Class A walkthrough · P3 Guest Guide. Higher-priority sources lead.');
  sources.appendChild(legend);
  article.appendChild(sources);

  if (record.related && record.related.length && onNavigate) {
    const related = section('Related', 'block block--related');
    const nav = el('div', 'related-links');
    for (const id of record.related) {
      const target = recordsById.get(id);
      if (!target) continue;
      const button = el('button', 'chip', target.title);
      button.type = 'button';
      button.addEventListener('click', () => onNavigate({ view: 'answer', id }));
      nav.appendChild(button);
    }
    related.appendChild(nav);
    article.appendChild(related);
  }

  return article;
}

export function renderChecklist(checklist, context = {}) {
  const { checkedItems = new Set(), onToggle = null, onReset = null } = context;
  const article = el('article', 'checklist');

  const header = el('header', 'checklist-header');
  if (checklist.playaOnly) header.appendChild(el('span', 'playa-tag', 'Burning Man'));
  header.appendChild(el('h2', 'answer-title', checklist.title));
  if (checklist.description) header.appendChild(el('p', 'checklist-description', checklist.description));
  article.appendChild(header);

  let total = 0;
  let done = 0;
  for (const sec of checklist.sections) {
    for (const item of sec.items) {
      total += 1;
      if (checkedItems.has(`${checklist.id}::${item.text}`)) done += 1;
    }
  }

  const progress = el('p', 'checklist-progress', `${done} of ${total} complete`);
  progress.setAttribute('role', 'status');
  article.appendChild(progress);

  for (const sec of checklist.sections) {
    const block = section(sec.title, 'block block--checklist-section');
    const ul = el('ul', 'checklist-items');
    for (const item of sec.items) {
      const key = `${checklist.id}::${item.text}`;
      const li = el('li', 'checklist-item');
      const label = el('label', 'checklist-label');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.className = 'checklist-checkbox';
      input.checked = checkedItems.has(key);
      if (onToggle) input.addEventListener('change', () => onToggle(key, input.checked));
      label.appendChild(input);
      label.appendChild(el('span', 'checklist-text', item.text));
      li.appendChild(label);
      if (item.sources && item.sources.length) {
        const why = el('details', 'checklist-source');
        why.appendChild(el('summary', null, 'Source'));
        why.appendChild(sourceList(item.sources));
        li.appendChild(why);
      }
      ul.appendChild(li);
    }
    block.appendChild(ul);
    article.appendChild(block);
  }

  if (onReset) {
    const footer = el('div', 'block');
    const button = el('button', 'button button--ghost', 'Clear all ticks on this checklist');
    button.type = 'button';
    button.addEventListener('click', onReset);
    footer.appendChild(button);
    article.appendChild(footer);
  }

  return article;
}
