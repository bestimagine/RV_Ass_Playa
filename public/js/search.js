/**
 * Deterministic local search for RV AI Assistant — Playa.
 *
 * No network, no remote model, no randomness. The same query against the same
 * knowledge base always produces the same ordering. This module is pure so the
 * Node test suite can import it directly.
 *
 * Scoring is field-aware rather than additive. Each query token earns the best
 * single authoritative-field match it can find, plus one capped body-text match.
 * A token buried in five body sentences is therefore worth roughly what one
 * body sentence is worth, which stops long overview records from outranking the
 * short procedure that actually answers the question. See
 * development/../docs/search-refinement-audit.md for the measurements this
 * design responds to.
 */

/** Authoritative fields. A token takes the best of these, never the sum. */
const STRONG_FIELDS = {
  title: 10,
  questions: 8.5,
  aliases: 8.5,
  keywords: 7.5,
  symptoms: 6
};

/** Body fields. A token takes the best of these, capped, never the sum. */
const BODY_FIELDS = {
  immediateAction: 1.8,
  burningManOverride: 1.2,
  doNot: 1.1,
  steps: 0.9,
  variants: 0.6
};

const BODY_TOKEN_CAP = 1.8;

/**
 * Phrase bonus per field, expressed for a two-word phrase. Only the longest
 * matching phrase counts per field. A bigram is deliberately worth slightly
 * less than one exact title token: two words landing together is a good signal,
 * but not a better one than the record being named after the thing asked about.
 */
const STRONG_PHRASE = { title: 9, questions: 7.5, aliases: 7.5, keywords: 6.5, symptoms: 5 };
const BODY_PHRASE = { immediateAction: 1.6, burningManOverride: 1, doNot: 0.9, steps: 0.8, variants: 0.5 };

/** Each token beyond a bigram makes a phrase match this much more valuable. */
const PHRASE_LENGTH_STEP = 0.5;
const MAX_PHRASE_TOKENS = 8;

/** Whole-query equality with an authored title, question or alias. */
const EXACT_TITLE_BOOST = 2;
const EXACT_QUESTION_BOOST = 1.85;
const EXACT_ALIAS_BOOST = 1.75;

const RISK_BOOST = { emergency: 1.18, caution: 1.06, routine: 1 };

const SYNONYM_STRENGTH = 0.5;
const FUZZY_PENALTY = 0.5;
const PREFIX_PENALTY = 0.5;
const PLURAL_PENALTY = 0.92;

/**
 * How much a word's rarity is allowed to matter. A word present in most records
 * ("burning", "man", "playa", "dust", "return") carries almost no information
 * about which record is wanted, so it is scaled down towards IDF_FLOOR. A word
 * present in one or two records keeps its full weight.
 */
const IDF_FLOOR = 0.35;

/** Intent multipliers. */
const INTENT_MATCH_BOOST = 1.22;
const INTENT_MISS_PENALTY = 0.92;
const CHECKLIST_WITHOUT_INTENT = 0.5;
const CHECKLIST_WITH_INTENT = 1.5;

/** Score below which we decline to present a single confident answer. */
export const CONFIDENCE_THRESHOLD = 0.32;

/** Ratio by which the top result must beat the runner-up to be decisive. */
const DECISIVE_RATIO = 1.12;

const STOP_WORDS = new Set([
  'a', 'about', 'am', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'can', 'could', 'did',
  'do', 'does', 'for', 'from', 'get', 'got', 'had', 'has', 'have', 'how', 'i', 'if', 'in', 'is',
  'it', 'its', 'me', 'my', 'need', 'not', 'of', 'on', 'or', 'our', 'should', 'so', 'that', 'the',
  'their', 'them', 'then', 'there', 'these', 'they', 'this', 'to', 'want', 'was', 'we', 'were',
  'what', 'when', 'where', 'which', 'who', 'why', 'will', 'with', 'would', 'you', 'your'
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

/** Crude but predictable singularisation, so "outlets" reaches "outlet". */
function singular(token) {
  if (token.length > 4 && token.endsWith('ies')) return `${token.slice(0, -3)}y`;
  if (token.length > 4 && token.endsWith('ses')) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith('s') && !token.endsWith('ss')) return token.slice(0, -1);
  return token;
}

/* ------------------------------------------------------------------ intent */

export const INTENTS = [
  'emergency', 'troubleshoot', 'procedure', 'prevention',
  'daily-routine', 'return', 'cleaning', 'checklist', 'prohibition'
];

/**
 * Deterministic query-intent cues. Every entry is a normalized substring tested
 * against the normalized query, so the mapping stays readable and testable.
 * A query may carry several intents; records are boosted for any overlap.
 */
const INTENT_CUES = {
  emergency: [
    'smell', 'smells', 'leak', 'leaking', 'alarm', 'alarms', 'sounding', 'beeping',
    'fire', 'smoke', 'carbon monoxide', 'co detector', 'extinguisher', 'emergency',
    'gas leak', 'rotten egg', 'unsafe', 'injured', 'accident'
  ],
  troubleshoot: [
    'not working', 'stopped working', 'wont', 'will not', 'no power', 'dead', 'broken',
    'fault', 'faulty', 'stuck', 'jam', 'jammed', 'tripped', 'reset', 'fix', 'problem',
    'not draining', 'not cooling', 'failed', 'failing', 'trouble', 'why is', 'why are'
  ],
  procedure: [
    'how do i', 'how to', 'how does', 'operate', 'operating', 'use', 'using', 'start',
    'connect', 'fill', 'refill', 'empty', 'open', 'close', 'set up', 'setup', 'procedure',
    'steps', 'what do i do', 'what should i do'
  ],
  prevention: [
    'prevent', 'preventing', 'protect', 'protection', 'avoid', 'avoiding', 'keep out',
    'keep dust', 'stop dust', 'cover', 'covering', 'seal', 'sealed', 'shrink wrap',
    'floor protection', 'brown paper', 'painters tape', 'home depot'
  ],
  'daily-routine': [
    'daily', 'every day', 'each day', 'morning', 'evening', 'routine', 'schedule',
    'how often', 'each night', 'before bed'
  ],
  return: [
    'return', 'returning', 'drop off', 'dropoff', 'check out', 'give back', 'hand back',
    'late fee', 'before returning', 'end of the rental'
  ],
  cleaning: [
    'clean', 'cleaning', 'cleaner', 'wash', 'washing', 'vinegar', 'mop', 'broom',
    'wipe', 'scrub', 'dirty', 'cleaning fee', 'fee', 'charge'
  ],
  checklist: [
    'checklist', 'check list', 'daily checks', 'what do i check', 'things to check',
    'before leaving', 'list of'
  ],
  prohibition: [
    'can i', 'am i allowed', 'is it ok', 'allowed', 'permitted', 'prohibited', 'forbidden',
    'never', 'do not', 'should i', 'may i', 'banned'
  ]
};

/**
 * @returns {string[]} intents inferred from the query, in INTENTS order.
 */
export function inferIntent(query) {
  const normalized = normalize(query);
  if (!normalized) return [];
  const padded = ` ${normalized} `;
  const found = [];
  for (const intent of INTENTS) {
    const cues = INTENT_CUES[intent] || [];
    if (cues.some((cue) => padded.includes(` ${cue} `))) found.push(intent);
  }
  return found;
}

/* ------------------------------------------------------------------ helpers */

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
  if (token.length >= 7) return 2;
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

/**
 * `id` and `category` are deliberately absent. The id is a slugified title, so
 * indexing it scored every title token twice; the category name made one shared
 * word ("playa", "return") match every record in that category.
 */
function buildFields(record) {
  return {
    title: record.title || '',
    questions: (record.questions || []).join(' \u00b7 '),
    aliases: (record.aliases || []).join(' \u00b7 '),
    keywords: (record.keywords || []).join(' \u00b7 '),
    symptoms: (record.symptoms || []).join(' \u00b7 '),
    immediateAction: record.immediateAction || '',
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
    const singularSets = {};
    for (const [name, text] of Object.entries(fields)) {
      const normalized = normalize(text);
      normalizedFields[name] = normalized;
      const counts = new Map();
      const singulars = new Set();
      for (const token of normalized.split(' ')) {
        if (!token) continue;
        counts.set(token, (counts.get(token) || 0) + 1);
        singulars.add(singular(token));
      }
      tokenSets[name] = counts;
      singularSets[name] = singulars;
    }
    const exact = {
      title: normalize(record.title || ''),
      questions: new Set((record.questions || []).map(normalize).filter(Boolean)),
      aliases: new Set((record.aliases || []).map(normalize).filter(Boolean))
    };
    return {
      record,
      normalizedFields,
      tokenSets,
      singularSets,
      exact,
      intents: new Set(record.intents || []),
      isChecklist: Boolean(record.checklistId)
    };
  });

  const total = entries.length;
  const documentFrequency = new Map();
  for (const entry of entries) {
    const seen = new Set();
    for (const field of Object.keys(STRONG_FIELDS)) {
      for (const token of entry.tokenSets[field].keys()) seen.add(singular(token));
    }
    for (const token of seen) documentFrequency.set(token, (documentFrequency.get(token) || 0) + 1);
  }
  const idf = new Map();
  const scale = Math.log(total + 1);
  for (const [token, count] of documentFrequency) {
    const raw = Math.log((total + 1) / (count + 1)) / scale;
    idf.set(token, IDF_FLOOR + (1 - IDF_FLOOR) * Math.max(0, Math.min(1, raw)));
  }

  return { entries, synonyms, idf, total, meta: answersData };
}

/** Rarity weight for a query token. Unknown words are treated as rare. */
function idfWeight(idf, token) {
  const value = idf.get(singular(token));
  return value === undefined ? 1 : value;
}

/** A phrase is worth as much as its most distinctive content word. */
function phraseIdfWeight(idf, tokens) {
  const content = tokens.filter((token) => !STOP_WORDS.has(token));
  const pool = content.length ? content : tokens;
  let best = 0;
  for (const token of pool) best = Math.max(best, idfWeight(idf, token));
  return best || 1;
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
        expanded.set(part, SYNONYM_STRENGTH);
      }
    }
  }
  return expanded;
}

/** Whole-word containment test over already-normalized text. */
function containsPhrase(haystack, needle) {
  if (!needle) return false;
  let from = 0;
  while (true) {
    const at = haystack.indexOf(needle, from);
    if (at === -1) return false;
    const before = at === 0 || haystack[at - 1] === ' ';
    const afterAt = at + needle.length;
    const after = afterAt === haystack.length || haystack[afterAt] === ' ';
    if (before && after) return true;
    from = at + 1;
  }
}

/**
 * Every contiguous n-gram of the query (n >= 2), plus whole-query synonym
 * substitutions. Previously only the whole query was tried, so adding one word
 * to a query erased the phrase bonus entirely.
 */
function buildQueryPhrases(rawTokens, normalizedQuery, synonyms) {
  const phrases = new Map();
  const limit = Math.min(rawTokens.length, MAX_PHRASE_TOKENS);
  for (let size = 2; size <= limit; size += 1) {
    for (let start = 0; start + size <= rawTokens.length; start += 1) {
      const slice = rawTokens.slice(start, start + size);
      // "how do i" and "do i" are phrases in the string sense only. Rewarding
      // them ranked records by how conversationally their questions were
      // authored rather than by what they are about.
      if (slice.every((token) => STOP_WORDS.has(token))) continue;
      const text = slice.join(' ');
      if (!phrases.has(text)) phrases.set(text, { text, size, tokens: slice });
    }
  }
  for (const [phrase, related] of synonyms) {
    if (!phrase.includes(' ') || !containsPhrase(normalizedQuery, phrase)) continue;
    for (const alternative of related) {
      const text = normalizedQuery.replace(phrase, alternative);
      const tokens = text.split(' ').filter(Boolean);
      if (tokens.length < 2 || phrases.has(text)) continue;
      phrases.set(text, { text, size: tokens.length, tokens, substituted: true });
    }
  }
  return [...phrases.values()];
}

function matchToken(token, counts, singulars) {
  if (counts.has(token)) return { strength: 1, how: 'exact' };
  const base = singular(token);
  if (singulars.has(base)) return { strength: PLURAL_PENALTY, how: 'plural' };
  if (token.length >= 5) {
    for (const candidate of counts.keys()) {
      if (candidate.length > token.length && candidate.startsWith(token)) {
        return { strength: PREFIX_PENALTY, how: `prefix:${candidate}` };
      }
    }
  }
  const tolerance = fuzzyTolerance(token);
  if (tolerance > 0) {
    for (const candidate of counts.keys()) {
      // Requiring the first two characters to agree removes the bulk of the
      // false positives (brown/blown, whiteout/without) while keeping real
      // typos (genarator/generator, propain/propane, refridgerator).
      if (candidate.slice(0, 2) !== token.slice(0, 2)) continue;
      if (levenshteinWithin(token, candidate, tolerance) <= tolerance) {
        return { strength: FUZZY_PENALTY, how: `fuzzy:${candidate}` };
      }
    }
  }
  return { strength: 0, how: null };
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

/* ------------------------------------------------------------------ scoring */

export function scoreRecord(entry, queryState) {
  const { record, normalizedFields, tokenSets, singularSets, exact, intents, isChecklist } = entry;
  const { tokens, expanded, phrases, profile, playaMode, queryIntents, normalizedQuery, idf } = queryState;

  const matchedFields = new Set();
  const contributions = [];
  const boosts = [];
  const penalties = [];
  let score = 0;
  let coveredTokens = 0;

  /* Tokens: best strong field, plus one capped body field. */
  for (const token of tokens) {
    const rarity = idfWeight(idf, token);
    let bestStrong = 0;
    let bestStrongPart = null;
    for (const [field, weight] of Object.entries(STRONG_FIELDS)) {
      const { strength, how } = matchToken(token, tokenSets[field], singularSets[field]);
      if (strength <= 0) continue;
      const value = weight * strength * rarity;
      if (value > bestStrong) {
        bestStrong = value;
        bestStrongPart = { kind: 'token', token, field, how, rarity, value };
      }
    }
    let bestBody = 0;
    let bestBodyPart = null;
    for (const [field, weight] of Object.entries(BODY_FIELDS)) {
      const { strength, how } = matchToken(token, tokenSets[field], singularSets[field]);
      if (strength <= 0) continue;
      const value = Math.min(BODY_TOKEN_CAP, weight * strength) * rarity;
      if (value > bestBody) {
        bestBody = value;
        bestBodyPart = { kind: 'token-body', token, field, how, rarity, value };
      }
    }
    if (bestStrongPart) {
      matchedFields.add(bestStrongPart.field);
      contributions.push(bestStrongPart);
      coveredTokens += 1;
    }
    if (bestBodyPart) {
      matchedFields.add(bestBodyPart.field);
      contributions.push(bestBodyPart);
    }
    score += bestStrong + bestBody;
  }

  /* Synonym-expanded tokens: strong fields only, at reduced strength. */
  for (const [token, strength] of expanded) {
    if (tokens.includes(token)) continue;
    const rarity = idfWeight(idf, token);
    let best = 0;
    let bestPart = null;
    for (const [field, weight] of Object.entries(STRONG_FIELDS)) {
      const hit = matchToken(token, tokenSets[field], singularSets[field]);
      if (hit.strength <= 0) continue;
      const value = weight * hit.strength * strength * rarity;
      if (value > best) {
        best = value;
        bestPart = { kind: 'synonym', token, field, how: hit.how, value };
      }
    }
    if (bestPart) {
      matchedFields.add(bestPart.field);
      contributions.push(bestPart);
      score += best;
    }
  }

  /* Phrases: only the longest match per field, so aliases cannot stack. */
  const phraseTokens = new Set();
  for (const [field, bonus] of Object.entries({ ...STRONG_PHRASE, ...BODY_PHRASE })) {
    let best = null;
    for (const phrase of phrases) {
      if (phrase.text.length < 4) continue;
      if (!containsPhrase(normalizedFields[field], phrase.text)) continue;
      if (!best || phrase.size > best.size) best = phrase;
    }
    if (!best) continue;
    const rarity = phraseIdfWeight(idf, best.tokens);
    const value = bonus * (1 + PHRASE_LENGTH_STEP * (best.size - 2)) * rarity;
    matchedFields.add(field);
    contributions.push({ kind: 'phrase', token: best.text, field, how: `${best.size}-gram`, rarity, value });
    score += value;
    if (field in STRONG_PHRASE) for (const t of best.tokens) phraseTokens.add(t);
  }

  if (score === 0) return null;

  /* Coverage is measured on authoritative fields and phrases only. A record
     that matched nothing but body text or synonyms is not an answer. */
  const covered = new Set();
  for (const part of contributions) {
    if (part.kind === 'token' || part.kind === 'synonym') covered.add(part.token);
  }
  for (const token of phraseTokens) covered.add(token);
  const matchedQueryTokens = tokens.filter((t) => covered.has(t)).length;
  if (matchedQueryTokens === 0 && coveredTokens === 0) return null;

  const coverage = tokens.length ? matchedQueryTokens / tokens.length : 0;
  const coverageMultiplier = 0.4 + 0.6 * coverage;
  score *= coverageMultiplier;

  /* Whole-query equality with authored wording is the strongest non-safety
     signal available, because somebody authored that exact phrasing. */
  let exactBoost = 1;
  if (normalizedQuery && normalizedQuery === exact.title) exactBoost = EXACT_TITLE_BOOST;
  else if (normalizedQuery && exact.questions.has(normalizedQuery)) exactBoost = EXACT_QUESTION_BOOST;
  else if (normalizedQuery && exact.aliases.has(normalizedQuery)) exactBoost = EXACT_ALIAS_BOOST;
  if (exactBoost > 1) {
    boosts.push({ reason: 'exact-authored-wording', factor: exactBoost });
    score *= exactBoost;
  }

  /* Intent. */
  let intentFactor = 1;
  const sharedIntents = queryIntents.filter((i) => intents.has(i));
  if (queryIntents.length && intents.size) {
    if (sharedIntents.length) {
      intentFactor = INTENT_MATCH_BOOST;
      boosts.push({ reason: `intent:${sharedIntents.join('+')}`, factor: intentFactor });
    } else {
      intentFactor = INTENT_MISS_PENALTY;
      penalties.push({ reason: 'intent-mismatch', factor: intentFactor });
    }
  }
  score *= intentFactor;

  /* A checklist must not lead unless the user asked for one. */
  let checklistFactor = 1;
  if (isChecklist) {
    const wantsChecklist = queryIntents.includes('checklist');
    checklistFactor = wantsChecklist ? CHECKLIST_WITH_INTENT : CHECKLIST_WITHOUT_INTENT;
    if (wantsChecklist) boosts.push({ reason: 'checklist-intent', factor: checklistFactor });
    else penalties.push({ reason: 'checklist-without-intent', factor: checklistFactor });
  }
  score *= checklistFactor;

  const risk = RISK_BOOST[record.riskLevel] || 1;
  const weight = record.searchWeight || 1;
  const profileFactor = profileBoost(record, profile);
  const priorityFactor = minSourcePriority(record) === 1 ? 1.1 : 1;
  const playaFactor = record.playaOnly ? (playaMode === false ? 0.9 : 1.08) : 1;

  score *= risk * weight * profileFactor * priorityFactor * playaFactor;

  const maxPossible = tokens.length * STRONG_FIELDS.title + STRONG_PHRASE.title;
  const confidence = maxPossible > 0 ? Math.min(1, score / maxPossible) : 0;

  return {
    record,
    score,
    confidence,
    coverage,
    matchedFields: [...matchedFields],
    explanation: {
      intents: queryIntents,
      recordIntents: [...intents],
      matchedIntents: sharedIntents,
      contributions: contributions.slice().sort((a, b) => b.value - a.value),
      boosts,
      penalties,
      multipliers: {
        coverage: coverageMultiplier, exact: exactBoost, intent: intentFactor,
        checklist: checklistFactor, risk, searchWeight: weight,
        profile: profileFactor, sourcePriority: priorityFactor, playa: playaFactor
      },
      score,
      confidence
    }
  };
}

/**
 * @returns {{ query: string, results: Array, confident: boolean, tokens: string[], intents: string[] }}
 */
export function search(index, query, options = {}) {
  const limit = options.limit || 12;
  const profile = options.profile || null;
  const playaMode = options.playaMode;
  const rawTokens = tokenize(query);
  const tokens = contentTokens(rawTokens);
  const queryIntents = inferIntent(query);

  if (!tokens.length) {
    return { query, tokens: [], intents: queryIntents, results: [], confident: false };
  }

  const normalizedQuery = normalize(query);
  const queryState = {
    tokens,
    expanded: expandQueryTokens(tokens, index.synonyms),
    phrases: buildQueryPhrases(rawTokens, normalizedQuery, index.synonyms),
    profile,
    playaMode,
    queryIntents,
    normalizedQuery,
    idf: index.idf || new Map()
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
  const decisive = !runnerUp || top.score >= runnerUp.score * DECISIVE_RATIO;
  const confident = Boolean(top) && top.confidence >= CONFIDENCE_THRESHOLD && top.coverage >= 0.5 && decisive;

  if (!options.explain) {
    for (const result of results) delete result.explanation;
  }

  return { query, tokens, intents: queryIntents, results, confident };
}

/**
 * Development and test diagnostics. Returns why each result scored what it did.
 * Nothing in the shipped UI calls this; `search()` strips explanations unless
 * `{ explain: true }` is passed, so production output stays clean.
 */
export function explainSearch(index, query, options = {}) {
  const outcome = search(index, query, { ...options, explain: true });
  return {
    query,
    normalized: normalize(query),
    tokens: outcome.tokens,
    intents: outcome.intents,
    confident: outcome.confident,
    threshold: CONFIDENCE_THRESHOLD,
    decisiveRatio: DECISIVE_RATIO,
    results: outcome.results.map((result, rank) => ({
      rank: rank + 1,
      id: result.record.id,
      title: result.record.title,
      score: result.score,
      confidence: result.confidence,
      coverage: result.coverage,
      matchedFields: result.matchedFields,
      passedThreshold:
        rank === 0
          ? result.confidence >= CONFIDENCE_THRESHOLD && result.coverage >= 0.5
          : null,
      ...result.explanation
    }))
  };
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
