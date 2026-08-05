# RV AI Assistant — Playa

An offline-first Progressive Web App for operating a rented El Monte Class A motorhome at Burning Man. Once it has been opened with a connection, it works entirely from the device with no signal, no backend and no remote model.

- **Full display name:** RV AI Assistant — Playa
- **Short name (manifest / home screen):** RV AI Playa
- **Repository / deployment slug:** `rv-ai-assistant-playa`

Unofficial companion guide, built from supplied El Monte RV guest resources. The rental agreement, the instructions given at pickup, the labels in the RV, and directions from El Monte RV remain controlling.

## What it does

- **Search** in plain language — "no water", "gas alarm", "genset wont start" — with deterministic local matching. No AI service is contacted; the ranking is the same every time.
- **Answers** lead with what to do first, then steps, then Burning Man-specific guidance, then other RV configurations, then sources.
- **Escalation** is only shown where a source explicitly requires it. Routine troubleshooting does not tell you to phone anyone.
- **Checklists** for pickup, arrival, daily checks, dust storms, tank emptying, departure and return.
- **My RV** is optional. Filling it in moves the configuration that matches your vehicle to the top; every other sourced configuration stays visible.
- **Offline status** verifies that every file is actually in the cache, not merely that a service worker registered.

## Source priority

Answers are built from three supplied documents. Where they disagree, the higher-priority source leads and the alternatives are shown as configurations rather than being discarded.

| Priority | Document |
| --- | --- |
| P1 | Burning Man 2026 RV Rental Guide |
| P2 | El Monte Class A Walkthrough Transcript |
| P3 | El Monte RV Guest Guide — Class A |

### Instruction hierarchy

1. Immediate life-safety and emergency instructions
2. Burning Man-specific operating instructions
3. Walkthrough instructions
4. General Guest Guide instructions

Burning Man guidance outranks the general guides, with one narrow, deliberate exception. The Burning Man instruction to keep windows, roof vents and doors closed against playa dust does **not** override emergency ventilation for:

- a propane smell
- an LPG alarm
- a carbon-monoxide alarm
- a smoke alarm or smoke accumulation
- stovetop ventilation while cooking

Those answers explicitly separate "During normal playa conditions" from "During a gas, smoke, or alarm emergency". The exception is not extended to comfort or convenience.

### Deliberate equipment variants

Several answers refuse to assert one universal rule because the sources describe genuinely different vehicles. These are shown as labelled alternatives, not resolved by guesswork:

- **Shore power** — 30-amp and 50-amp configurations. Check the installed connector, the RV label and your pickup instructions.
- **Slide-out driver's seat** — the walkthrough says full upright, the Guest Guide says tipped forward. The app says: position the seat fully clear of the slide and follow the instruction label beside the slide control.
- **Refrigerator** — start at the middle or manufacturer-recommended setting; "3 or COLD" is shown as a configuration-specific alternative.
- **Water heater** — tankless versus tank-style.
- **Generator start** — monitor panel, generator compartment, or emergency pull start.
- **Leveling** — powered jacks versus supplied ramps.
- **Toilet chemical** — the two sourced water quantities.

The On Road Care number is never invented. The app tells you to find it on the key tag, and lets you save it locally in My RV.

## How search ranks answers

`public/js/search.js` is deterministic and field-aware. The same query always produces the same ordering, and nothing is fetched.

Each query token earns the **best single** match it can find among the authoritative fields — `title`, `questions`, `aliases`, `keywords`, `symptoms` — plus at most one capped match from body text (`immediateAction`, `burningManOverride`, `doNot`, `steps`, `configurationVariants`). Scores are never summed across fields, so a long overview record cannot outrank a short procedure just by mentioning a word more often.

On top of that:

- **Phrases** are matched as every contiguous n-gram of the query, not only the whole query. Longer phrases are worth more, and only the longest match counts per field.
- **Rarity** (inverse document frequency) scales each word by how many records contain it. Words like "burning", "man", "playa", "dust" and "return" appear across the knowledge base and are damped; words like "depot" or "whiteout" keep full weight.
- **Exact wording** — a query identical to a record's title, authored question or alias gets the strongest non-safety boost.
- **Intent** is inferred from the query against a fixed vocabulary: `emergency`, `troubleshoot`, `procedure`, `prevention`, `daily-routine`, `return`, `cleaning`, `checklist`, `prohibition`. Every record declares its own `intents`; overlap boosts, mismatch mildly damps.
- **Checklists** are damped unless the query explicitly asks for one, so a procedure always beats a checklist for "what do I do now" questions.
- **Safety** still wins: `riskLevel` boosts emergency answers, and the emergency-ventilation exception is unaffected by any of the above.

### Authoring records for search

Two fields exist purely for retrieval and are never rendered:

- `keywords` — the words and phrases a stressed user would actually type, including brand names and colloquialisms found in the sources.
- `intents` — one or more of the nine intents above.

Put a detail in `keywords` when it is real, sourced content that only appears in a step sentence. That is how "Home Depot", "floor protection" and "blue painter's tape" became findable.

### Match diagnostics

For development and tests only, `explainSearch(index, query)` returns the matched fields, matched phrases and tokens, per-contribution rarity, boosts, penalties, inferred intent, final score and whether the top result passed the confidence threshold. `search()` strips this unless you pass `{ explain: true }`, so the shipped UI never sees it.

```js
import { buildIndex, explainSearch } from './public/js/search.js';
console.log(explainSearch(buildIndex(answers, synonyms), 'brown paper'));
```

`docs/search-refinement-audit.md` records the measured behaviour that this design responds to.

## Running locally

No build step, no dependencies. Serve `public/` over HTTP — a service worker will not register from `file://`.

```bash
npm start   # python3 -m http.server 8000 --directory public
```

Then open <http://localhost:8000>. `localhost` counts as a secure context, so the service worker and install prompt both work.

Any static server is fine:

```bash
npx --yes serve public
```

## Tests

Requires Node 18 or newer. There are no test dependencies.

```bash
npm test   # node --test tests/*.test.mjs
```

The suite covers:

- **`validate-data.test.mjs`** — record schema, unique ids, intact cross-links, source citations on every record, escalation block and checklist item, escalation matching the approved control list exactly, and each Phase 1 content decision (awning, slide seat, 30/50-amp, refrigerator, On Road Care number, Return Checklist naming, safety-precedence exception).
- **`search.test.mjs`** — ranking for ~50 realistic queries, synonyms, typo tolerance, British and American spellings, determinism, confidence behaviour on unrecognised queries, and that every record is reachable from its own wording.
- **`search-ranking.test.mjs`** — regression cover for the audited queries: storm and whiteout wording leads with the dust-storm procedure, checklists only lead on explicit checklist intent, cleaning and floor-protection wording reaches the brown paper answer, outlet queries resolve confidently to the electrical records, the propane emergency and awning prohibition stay first, intent inference is stable, and body text can never outweigh an authoritative field.
- **`render.test.mjs`** — renders every record and checklist through a minimal DOM shim, so a template that throws is caught without opening a browser.
- **`app-shell.test.mjs`** — name consistency across the title, manifest, brand config, offline fallback and docs; app and knowledge-base version agreement across `version.js`, `service-worker.js`, `asset-manifest.json` and the data files; asset-manifest completeness against the filesystem; PWA installability; real PNG icons; accessibility basics; and that nothing calls out to a network service.

## Regenerating the icons

The PWA icons are generated from code rather than committed as opaque binaries.

```bash
npm run icons   # node tools/generate-icons.mjs
```

## Versioning and updates

`public/js/version.js` holds `APP_VERSION` and `KB_VERSION`; `service-worker.js` and `asset-manifest.json` must match, and the tests enforce it.

- Bump `APP_VERSION` for any change to markup, styles or scripts.
- Bump `KB_VERSION` for any change to `answers.json`, `checklists.json` or `synonyms.json`, and update `kbVersion` / `checklistsVersion` inside those files.

The cache is named `rv-ai-playa-v<APP_VERSION>`, so a version bump installs into a fresh cache and old caches are deleted on activate. Updates are never applied silently: when a new version finishes downloading, a banner appears and the user chooses when to reload.

## Layout

```
public/                     deployable static site — this is the publish directory
  index.html                app shell
  offline.html              fallback page with emergency guidance
  manifest.webmanifest      PWA manifest
  service-worker.js         precache and cache-first serving
  asset-manifest.json       single source of truth for what must be cached
  css/styles.css
  js/                       app, search, answer-view, profile, storage, offline, install, version
  data/                     answers.json, checklists.json, synonyms.json
  config/brand-config.json  name, disclaimer, retailer logo paths
  assets/icons/             generated PNG and SVG icons
  assets/brand/             El Monte wordmark, light- and dark-background
tests/                      node --test suite
tools/generate-icons.mjs    icon generator
development/                Phase 1 source map and implementation plan
```

## Rebranding

Everything a retailer would change lives in `public/config/brand-config.json`: display name, short name, retailer name, logo paths, alt text, approval status and label, footer disclaimer, and the On Road Care hint. If you change the display or short name, update `manifest.webmanifest` and the `<title>` to match — the test suite will tell you if they drift apart.

The header logo is a `<picture>` with two variants. `logoPath` is the light-background wordmark and is what the header uses by default; `darkLogoPath` is the dark-background wordmark and is swapped in only under `prefers-color-scheme: dark`, where the surrounding surface requires it. `logoAlt` supplies the alt text, currently "El Monte RV". Drop replacements into `public/assets/brand/`, point the two paths at them, and **add both files to `public/asset-manifest.json`** — anything absent from that manifest is not precached, so it would show as a broken image offline.

## Source materials

The authoritative PDFs and transcript live in a local, Git-ignored `source_materials/` directory. They are development inputs only. They are never copied into `public/`, never referenced by the deployed app, and must not be committed or published.
