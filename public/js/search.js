/**
 * Deterministic local search for RV AI Assistant — Playa.
 *
 * No network, no remote model, no randomness. The same query against the same
 * knowledge base always produces the same ordering. This module is pure so the
 * Node test suite can import it directly.
 */

const FIELD_WEIGHTS = {
  title: 5,
  questions: 4.2,
  aliases: 3.6,
  symptoms: 3.2,
  id: 2.6,
  immediateAction: 2.2,
  category: 1.8,
  burningManOverride: 1.5,
  doNot: 1.2,
  steps: 1.1,
  variants: 0.9
};

const PHRASE_BONUS = { title: 9, questions: 7, aliases: 6, symptoms: 5, immediateAction: 3, steps: 1.5 };

const RISK_BOOST = { emergency: 1.18, caution: 1.06, routine: 1 };

const FUZZY_PENALTY = 0.55;
const PARTIAL_PENALTY = 0.45;

/** Score below which we decline to present a single confident answer. */
export const CONFIDENCE_THRESHOLD = 0.32;

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'can', 'did', 'do', 'does', 'for',
  'from', 'get', 'got', 'had', 'has', 'have', 'how', 'i', 'if', 'in', 'is', 'it', 'its', 'me',
  'my', 'not', 'of', 'on', 'or', 'our', 'so', 'that', 'the', 'their', 'them', 'then', 'there',
  'these', 'they', 'this', 'to', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'who',
  'why', 'will', 'with', 'you', 'your'
]);

export function normalize(text) {
  if (text == null) return '';
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[^a-z0-9'\s-]/g, ' ')
    .replace(/['-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(text) {
  const normalized = normalize(text);
  if (!normalized) return [];
  return normalized.split(' ').filter(Boolean);
}

function contentTokens(tokens) {
  const kept = tokens.filter((t) => !STOP_WORDS.has(t));
  return kept.length ? kept : tokens;
}

/** Turn authored synonym groups into a symmetric token -> Set(token) map. */
export function buildSynonymMap(synonymData) {
  const map = new Map();
  const groups = (synonymData && synonymData.groups) || [];
  for (const group of groups) {
    const phrases = group.map((phrase) => normalize(phrase)).filter(Boolean);
    for (const phrase of phrases) {
      const existing = map.get(phrase) || new Set();
      for (const other of phrases) {
        if (other !== phrase) existing.add(other);
      }
      map.set(phrase, existing);
    }
  }
  return map;
}

function levenshteinWithin(a, b, max) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let previous = new Array(b.length + 1);
  let current = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) previous[j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    let rowMin = current[0];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost);
      if (current[j] < rowMin) rowMin = current[j];
    }
    if (rowMin > max) return max + 1;
    const swap = previous;
    previous = current;
    current = swap;
  }
  return previous[b.length];
}

function fuzzyTolerance(token) {
  if (token.length >= 8) return 2;
  if (token.length >= 5) return 1;
  return 0;
}

function fieldText(value) {
  if (value == null) return '';
  if (Array.isArray(value)) return value.map(fieldText).join(' ');
  if (typeof value === 'object') return Object.values(value).map(fieldText).join(' ');
  return String(value);
}

function variantText(record) {
  const parts = [];
  for (const variant of record.configurationVariants || []) {
    parts.push(variant.label, fieldText(variant.steps));
  }
  for (const block of record.conditionalGuidance || []) {
    parts.push(block.label, fieldText(block.items));
  }
  for (const note of record.contextualNotes || []) parts.push(note.text);
  return parts.join(' ');
}

function buildFields(record) {
  return {
    title: record.title || '',
    questions: (record.questions || []).join(' \u00b7 '),
    aliases: (record.aliases || []).join(' \u00b7 '),
    symptoms: (record.symptoms || []).join(' \u00b7 '),
    id: (record.id || '').replace(/-/g, ' '),
    immediateAction: record.immediateAction || '',
    category: record.category || '',
    burningManOverride: (record.burningManOverride || []).join(' '),
    doNot: (record.doNot || []).join(' '),
    steps: (record.steps || []).join(' '),
    variants: variantText(record)
  };
}

/**
 * Pre-compute normalized text and token sets once so queries stay cheap on a
 * phone that may be several years old.
 */
export function buildIndex(answersData, synonymData) {
  const synonyms = buildSynonymMap(synonymData);
  const entries = (answersData.records || []).map((record) => {
    const fields = buildFields(record);
    const normalizedFields = {};
    const tokenSets = {};
    for (const [name, text] of Object.entries(fields)) {
      const normalized = normalize(text);
      normalizedFields[name] = normalized;
      const counts = new Map();
      for (const token of normalized.split(' ')) {
        if (!token) continue;
        counts.set(token, (counts.get(token) || 0) + 1);
      }
      tokenSets[name] = counts;
    }
    return { record, normalizedFields, tokenSets };
  });
  return { entries, synonyms, meta: answersData };
}

function expandQueryTokens(tokens, synonyms) {
  const expanded = new Map();
  for (const token of tokens) {
    if (!expanded.has(token)) expanded.set(token, 1);
    const related = synonyms.get(token);
    if (!related) continue;
    for (const phrase of related) {
      for (const part of phrase.split(' ')) {
        if (!part || expanded.has(part)) continue;
        expanded.set(part, 0.82);
      }
    }
  }
  return expanded;
}

function expandQueryPhrases(normalizedQuery, synonyms) {
  const phrases = new Set([normalizedQuery]);
  for (const [phrase, related] of synonyms) {
    if (!phrase.includes(' ') || !normalizedQuery.includes(phrase)) continue;
    for (const alternative of related) {
      phrases.add(normalizedQuery.replace(phrase, alternative));
    }
  }
  return [...phrases];
}

function matchToken(token, counts, normalizedField) {
  if (counts.has(token)) return 1;
  if (token.length >= 4) {
    for (const candidate of counts.keys()) {
      if (candidate.length > token.length && candidate.startsWith(token)) return PARTIAL_PENALTY;
    }
  }
  const tolerance = fuzzyTolerance(token);
  if (tolerance > 0) {
    for (const candidate of counts.keys()) {
      if (levenshteinWithin(token, candidate, tolerance) <= tolerance) return FUZZY_PENALTY;
    }
  }
  if (token.length >= 6 && normalizedField.includes(token)) return PARTIAL_PENALTY;
  return 0;
}

function profileBoost(record, profile) {
  if (!profile) return 1;
  let boost = 1;
  for (const variant of record.configurationVariants || []) {
    const match = variant.match || {};
    for (const [key, value] of Object.entries(match)) {
      if (profile[key] && profile[key] === value) boost = Math.max(boost, 1.08);
    }
  }
  return boost;
}

function minSourcePriority(record) {
  const priorities = (record.sources || []).map((s) => s.priority).filter((p) => typeof p === 'number');
  return priorities.length ? Math.min(...priorities) : 3;
}

export function scoreRecord(entry, queryState) {
  const { record, normalizedFields, tokenSets } = entry;
  const { tokens, expanded, phrases, profile, playaMode } = queryState;

  let score = 0;
  let matchedQueryTokens = 0;
  const matchedFields = new Set();

  for (const token of tokens) {
    let bestForToken = 0;
    for (const [field, weight] of Object.entries(FIELD_WEIGHTS)) {
      const strength = matchToken(token, tokenSets[field], normalizedFields[field]);
      if (strength > 0) {
        matchedFields.add(field);
        const contribution = weight * strength;
        score += contribution;
        if (contribution > bestForToken) bestForToken = contribution;
      }
    }
    if (bestForToken > 0) matchedQueryTokens += 1;
  }

  for (const [token, strength] of expanded) {
    if (tokens.includes(token)) continue;
    for (const [field, weight] of Object.entries(FIELD_WEIGHTS)) {
      const hit = matchToken(token, tokenSets[field], normalizedFields[field]);
      if (hit > 0) score += weight * hit * strength * 0.7;
    }
  }

  for (const phrase of phrases) {
    if (phrase.length < 4) continue;
    for (const [field, bonus] of Object.entries(PHRASE_BONUS)) {
      if (normalizedFields[field].includes(phrase)) {
        score += bonus;
        matchedFields.add(field);
      }
    }
  }

  if (score === 0) return null;

  const coverage = tokens.length ? matchedQueryTokens / tokens.length : 0;
  score *= 0.45 + 0.55 * coverage;
  score *= RISK_BOOST[record.riskLevel] || 1;
  score *= record.searchWeight || 1;
  score *= profileBoost(record, profile);

  if (minSourcePriority(record) === 1) score *= 1.1;
  if (record.playaOnly) score *= playaMode === false ? 0.9 : 1.08;

  const maxPossible = tokens.length * FIELD_WEIGHTS.title + PHRASE_BONUS.title;
  const confidence = maxPossible > 0 ? Math.min(1, score / maxPossible) : 0;

  return { record, score, confidence, coverage, matchedFields: [...matchedFields] };
}

/**
 * @returns {{ query: string, results: Array, confident: boolean, tokens: string[] }}
 */
export function search(index, query, options = {}) {
  const limit = options.limit || 12;
  const profile = options.profile || null;
  const playaMode = options.playaMode;
  const rawTokens = tokenize(query);
  const tokens = contentTokens(rawTokens);

  if (!tokens.length) {
    return { query, tokens: [], results: [], confident: false };
  }

  const normalizedQuery = normalize(query);
  const queryState = {
    tokens,
    expanded: expandQueryTokens(tokens, index.synonyms),
    phrases: expandQueryPhrases(normalizedQuery, index.synonyms),
    profile,
    playaMode
  };

  const scored = [];
  for (const entry of index.entries) {
    const result = scoreRecord(entry, queryState);
    if (result) scored.push(result);
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const priorityDelta = minSourcePriority(a.record) - minSourcePriority(b.record);
    if (priorityDelta !== 0) return priorityDelta;
    return a.record.id.localeCompare(b.record.id);
  });

  const results = scored.slice(0, limit);
  const top = results[0];
  const runnerUp = results[1];
  const decisive = !runnerUp || top.score >= runnerUp.score * 1.12;
  const confident = Boolean(top) && top.confidence >= CONFIDENCE_THRESHOLD && top.coverage >= 0.5 && decisive;

  return { query, tokens, results, confident };
}

/** Records to show when a query is unrecognised or low confidence. */
export function broadGuidance(index, options = {}) {
  const ids = options.ids || [
    'burning-man-support-limits',
    'ventilation-playa-vs-emergency',
    'coach-battery-charging',
    'dust-storm-procedure',
    'waste-service-burning-man',
    'cleaning-fee-prevention'
  ];
  const byId = new Map(index.entries.map((e) => [e.record.id, e.record]));
  return ids.map((id) => byId.get(id)).filter(Boolean);
}

export function getRecord(index, id) {
  const entry = index.entries.find((e) => e.record.id === id);
  return entry ? entry.record : null;
}

export function recordsByCategory(index) {
  const grouped = new Map();
  for (const { record } of index.entries) {
    if (!grouped.has(record.category)) grouped.set(record.category, []);
    grouped.get(record.category).push(record);
  }
  for (const list of grouped.values()) list.sort((a, b) => a.title.localeCompare(b.title));
  return grouped;
}
