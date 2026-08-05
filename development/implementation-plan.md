# Implementation Plan — RV ASSistant Playa

Development-only file. Not deployed. Not inside `public/`.

Phase 1 deliverable. Companion to `development/source-map.md`.

Nothing in `public/` has been created yet. This document is the design that
Phases 2–7 will execute.

---

## 1. Constraints that shape every decision

From `project_spec.md`:

- Static site only. No backend, no database, no environment variables, no
  secrets, no server-side rendering (§17).
- No remote AI, no API key, no CDN, no external fonts or icon libraries
  (§8, §16).
- Must work fully offline after one successful caching pass (§1, §10, §11).
- Deployed to Replit Static Deployment with public directory `public` (§17).
- Every answer carries a source reference; unsupported claims are excluded
  (§2).
- Default mode is "Broad guidance — show all configurations"; the user is never
  forced to configure the RV (§4).
- Escalation is hidden entirely when `escalation` is `null` (§6).

Two consequences worth stating up front:

**No build step.** Plain ES modules, plain CSS, plain JSON. A bundler would add
a `dist` artifact, a toolchain, and a lockfile for no benefit on a site of this
size, and it complicates the "one canonical asset list shared by the service
worker and the verifier" requirement in §11. Everything in `public/` is
directly deployable and directly readable.

**No framework.** The UI is a search box, a result list, an answer view, a
settings form, and checklists. Hand-written DOM with semantic HTML meets the
accessibility requirements in §16 more directly than a framework would, and
keeps the precache list small and stable.

---

## 2. Application architecture

### 2.1 File layout

```
rv-playa-assistant/
├── public/
│   ├── index.html                  single page, semantic sections
│   ├── offline.html                navigation fallback
│   ├── manifest.webmanifest
│   ├── service-worker.js           versioned caches, message API
│   ├── assets/
│   │   ├── brand/                  text-treatment only until a logo is approved
│   │   ├── icons/                  192, 512, maskable — generated locally
│   │   └── diagrams/               only if locally authored; none planned
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── app.js                  bootstrap, routing, view rendering
│   │   ├── asset-manifest.js       THE canonical offline asset list
│   │   ├── search.js               tokenizer, index, scoring, ranking
│   │   ├── answer-view.js          answer rendering incl. variants/escalation
│   │   ├── checklists.js
│   │   ├── storage.js              localStorage wrapper, profile, export/import
│   │   ├── profile.js              My RV form and matching logic
│   │   ├── offline.js              readiness verification
│   │   ├── install.js              beforeinstallprompt / iOS / fallback
│   │   └── version.js              APP_VERSION, KB_VERSION
│   ├── data/
│   │   ├── answers.json
│   │   ├── checklists.json
│   │   └── synonyms.json
│   └── config/
│       └── brand-config.json
├── development/
│   ├── source-map.md
│   └── implementation-plan.md
├── tests/
│   ├── run.mjs                     node-based runner, zero dependencies
│   ├── validate-data.test.mjs
│   ├── search.test.mjs
│   ├── config.test.mjs
│   └── assets.test.mjs
├── source_materials/               git-ignored, never deployed
├── README.md
├── README_REPLIT.md
└── .gitignore
```

`asset-manifest.js` is the single canonical list required by spec §11. It is
imported by `service-worker.js` (via `importScripts`-compatible plain
assignment) and by `offline.js`. A test asserts every path in it exists on disk
and that no file in `public/` that should be cached is missing from it.

### 2.2 Module responsibilities

| Module | Responsibility | Does not |
|---|---|---|
| `app.js` | Load data, wire events, own the view state, render the home screen | Contain scoring logic or cache logic |
| `search.js` | Build the in-memory index once, score a query, return the top 3 | Touch the DOM |
| `answer-view.js` | Render one record: title, immediate action, steps, Burning Man block, do-not block, variants, sources, escalation | Decide escalation policy — that is data |
| `profile.js` | Read/write the profile, expose a weighting vector and a variant-matching predicate | Block any UI path |
| `offline.js` | Register the worker, drive `prepare`, verify Cache Storage, report per-asset results | Fake success |
| `install.js` | Platform detection, `beforeinstallprompt`, `appinstalled`, standalone detection | Show a fake install button |
| `storage.js` | Namespaced localStorage with JSON serialisation and quota handling | Send anything anywhere |

### 2.3 State and routing

Single page, hash-routed: `#/`, `#/a/<id>`, `#/checklists`, `#/checklist/<id>`,
`#/settings`, `#/about`. Hash routing avoids any server rewrite rule, which
matters for Replit Static Deployment and for the offline navigation fallback.

All state lives in memory plus localStorage. There is no global store library.

### 2.4 Data flow

```
answers.json ──► search.js buildIndex()  ──► ranked ids ──► answer-view.js
      │                    ▲                                      ▲
      │                    │ weighting                            │ variant order
      └────────────────────┴──────────── profile.js ──────────────┘
```

---

## 3. Knowledge-base schema

### 3.1 Envelope

`answers.json` is an object, not a bare array, so it can carry a version that
the readiness panel displays (§10).

```json
{
  "kbVersion": "1.0.0",
  "generatedAt": "2026-08-05",
  "sourcePriority": [
    { "priority": 1, "document": "Burning Man 2026 RV Rental Guide" },
    { "priority": 2, "document": "El Monte Class A Walkthrough Transcript" },
    { "priority": 3, "document": "El Monte RV Guest Guide — Class A" }
  ],
  "records": []
}
```

### 3.2 Record schema

Extends the spec §7 example. Additions are marked; all spec fields are kept
with their spec names and meanings.

```json
{
  "id": "generator-will-not-start",
  "title": "Generator will not start",
  "category": "Power",
  "riskLevel": "routine",
  "priority": 1,

  "questions": ["Why won't the generator start?"],
  "aliases": ["genset", "no generator"],
  "symptoms": ["cranks but will not start"],

  "immediateAction": "Check that the fuel tank is above one quarter.",
  "steps": [],

  "burningManOverride": [],
  "configurationVariants": [],
  "doNot": [],
  "escalation": null,

  "sources": [
    {
      "document": "Burning Man 2026 RV Rental Guide",
      "page": 1,
      "section": "Power Management",
      "priority": 1
    }
  ],

  "playaOnly": false,
  "configurationNotice": true,
  "related": ["generator-oil", "generator-breaker"],
  "searchWeight": 1.0
}
```

**Added fields and why:**

- `playaOnly` — marks records that only apply in Black Rock City (waste service
  trucks, playa cleaning, dust storm). Lets the home screen group them and lets
  search boost them without hard-coding IDs.
- `configurationNotice` — when true, `answer-view.js` renders the exact notice
  text from spec §4. Keeping it a boolean avoids repeating the sentence in 24
  records and guarantees the wording never drifts.
- `related` — powers the low-confidence "choose the closest one" list and the
  end-of-answer links. Validated to reference existing IDs.
- `searchWeight` — a per-record multiplier, defaulting to 1.0, used sparingly to
  lift the eight quick-action topics. Not a substitute for good aliases.

**Sub-schemas:**

```json
"configurationVariants": [
  {
    "label": "Tankless water heater",
    "match": { "waterHeater": "tankless" },
    "steps": ["Press the water heater button on the main control panel."],
    "sources": [
      { "document": "El Monte Class A Walkthrough Transcript",
        "section": "Tankless Water Heater", "priority": 2 }
    ]
  }
]
```

```json
"escalation": {
  "level": "call-now",
  "reason": "The Guest Guide requires On Road Care to be contacted before any further action.",
  "action": "Stop. Do not start or drive the RV. Call On Road Care using the number on your key tag.",
  "callEmergencyServices": false,
  "burningManNote": "Inside Black Rock City On Road Care can give guidance by phone but cannot come to the vehicle.",
  "sources": [
    { "document": "El Monte RV Guest Guide — Class A", "page": 33,
      "section": "Communicating with El Monte RV", "priority": 3 }
  ]
}
```

`escalation.level` is one of `call-now`, `call-before-proceeding`,
`call-for-authorization`. The third is the administrative case (oil change due,
repairs over $100) and renders in a visually distinct, non-alarming style so it
does not dilute genuine safety escalation.

`burningManNote` is populated on every escalation from BM p.3 (El Monte cannot
provide on-site service within BRC). Sourced, not invented.

### 3.3 Source-reference rules

- `document` must be one of the three canonical titles, exactly.
- PDF sources require `page`; the Walkthrough requires `section` and must not
  carry `page`.
- `priority` must equal the document's priority. A test enforces this, which
  prevents a Burning Man citation ever being written with priority 3.
- `section` for the Walkthrough must be one of the 52 names fixed in
  `source-map.md` §1.3.

### 3.4 Categories

`Safety`, `Power`, `Climate`, `Water`, `Waste`, `Exterior`, `Driving`,
`Engine & Fuel`, `Playa`, `Return`. Ten categories, each large enough to be
worth a home-screen tile and small enough to scan on a phone.

### 3.5 Planned record count

Approximately 95 records, covering all 44 minimum topics from spec §7 plus the
additional topics enumerated in `source-map.md` §3. Breakdown:
Safety 10, Power 22, Climate 11, Water 16, Waste 10, Exterior 12, Driving 12,
Engine & Fuel 14, Playa 12, Return 9 — with overlap where a record is filed once
and cross-linked via `related`.

---

## 4. Search approach

Deterministic, local, no embeddings, no network. Built once at load into an
in-memory inverted index.

### 4.1 Pipeline

```
raw query
  → normalise      lowercase, strip accents, collapse whitespace,
                   canonicalise a/c → ac, gfi → gfci, 30amp → 30 amp
  → tokenise       split on non-alphanumerics, keep digits (30, 50, 79)
  → stopword trim  keep the token if removing it would empty the query
  → synonym expand each token to its synonym set from synonyms.json
  → score          field-weighted token + phrase + fuzzy match per record
  → adjust         source priority, Burning Man boost, profile weighting
  → rank           top 3, with a confidence band
```

### 4.2 Field weights

| Field | Weight | Rationale |
|---|---|---|
| `title` | 10 | Strongest signal |
| `questions` | 8 | Written as real user phrasings |
| `aliases` | 7 | Exists precisely to be matched |
| `symptoms` | 6 | How a stressed user describes a fault |
| `category` | 3 | Broad queries like "power" |
| `immediateAction` | 3 | |
| `steps` | 2 | Long text, dilutes easily |
| `doNot` / `burningManOverride` | 2 | Matches "can I use the awning" |

Exact phrase match on `title` or any `questions` entry adds a flat bonus large
enough to guarantee first place — "generator will not start" must never rank
second.

### 4.3 Fuzzy matching

Damerau–Levenshtein, capped: distance 1 for tokens of 4–7 characters, distance 2
for 8 or more, no fuzzy matching below 4 characters. This catches `genarator`,
`propaine`, `awining` while refusing to conflate `30` with `50`, which would be
a safety problem given the amperage variants. Fuzzy hits score at 60 % of an
exact token hit.

### 4.4 Priority and override boosts

- Records whose top-priority source is the Burning Man guide receive a boost.
- Records with a non-empty `burningManOverride` receive a further boost.
- `playaOnly` records are boosted, never filtered out — the app cannot know
  where the user is and must not guess.

The net effect: for "awning", "clean playa dust", "empty black tank", "dust
storm", the Burning Man record ranks first. This is verified by test.

### 4.5 My RV profile weighting

The profile never filters. It reorders `configurationVariants` inside an answer
and applies a small ranking nudge between records. Unknown fields contribute
nothing. With no profile at all, scoring is identical to profile-with-everything-
unknown, so Broad Guidance is genuinely the default rather than a special case.

### 4.6 Confidence and the no-fabrication rule

Score the top hit against a threshold derived from the number of matched query
tokens rather than an absolute number, so a long query cannot pass on one weak
match.

- Confident: render the answer directly.
- Low confidence: render the exact wording from spec §8 — "I found a few
  possibly related topics. Choose the closest one." — followed by the three
  candidates.
- No token matched any record: render a no-results state offering the quick
  actions and category browse. **Never** synthesise text from the query.

### 4.7 Synonym map

`synonyms.json` ships the full set from spec §8 plus terms observed in the
sources: `monitor panel` = `control panel` / `control board`; `battery
disconnect` = `house battery switch` / `main battery switch` / `coach battery
switch`; `emergency starter` = `battery boost`; `sani dump` = `dump station`;
`On Road Care` = `OnRoad Care` / `roadside assistance`; `jacks` = `leveling
system` / `levelling`; `slide` = `slide-out` / `slide room`; `one-ply` =
`1 ply`; `vinegar wash` = `clean dust`.

Bidirectional by construction: the loader expands every group into a symmetric
map so authoring order does not matter.

---

## 5. Offline and caching approach

### 5.1 Cache strategy

Two named caches, both suffixed with the app version:

- `rvpa-app-v<APP_VERSION>` — shell: HTML, CSS, JS, manifest, icons, offline
  fallback.
- `rvpa-data-v<KB_VERSION>` — `answers.json`, `checklists.json`,
  `synonyms.json`, `brand-config.json`.

Splitting them means a knowledge-base correction does not force the whole shell
to be re-downloaded, and the two versions are reported separately in the
readiness panel exactly as spec §10 requires.

Runtime strategy: cache-first for everything in the manifest, with a network
revalidation only when online. Navigation requests fall back to `offline.html`
if `index.html` is somehow absent.

### 5.2 Real verification, not a fake button

The "Prepare for offline use" button executes the seven steps in spec §11 in
order and reports honestly at each one:

1. `navigator.serviceWorker.register()` succeeded — or report why not
   (unsupported browser, insecure origin, registration error).
2. `await navigator.serviceWorker.ready`.
3. `postMessage({type:'PRECACHE'})`; the worker fetches every manifest entry and
   replies with a per-asset result array.
4. For each manifest entry, `caches.match(url)` must return a `Response` with
   `ok` status. Missing entries are collected by name.
5. `fetch('data/answers.json')` from cache, `await response.json()`, then assert
   the envelope shape and that `records.length > 0`.
6. If anything failed, list the missing or unparseable files by name.
7. Only when every check passes: "Offline guide ready".

The verifier reads the same `asset-manifest.js` the worker uses, so the two
cannot drift. A test asserts the manifest matches the files on disk.

A separate "Run internal offline check" button re-runs steps 4–5 without
re-fetching. Both states are accompanied by the standing note that the user must
still perform the physical airplane-mode test — the app never claims that test
passed on its own.

### 5.3 Status model

Four independent statuses, each shown with an icon **and** words, never colour
alone (§9, §16):

| Status | Values |
|---|---|
| App installation | Not installed / Installed / Installation unavailable in this browser |
| Offline guide | Preparing / Ready / Incomplete / Error |
| Internet | Online / Offline |
| Offline test | Not tested / Passed on this device |

Plus knowledge-base version and app version. Installation and caching are
tracked separately, as spec §10 insists.

The panel collapses to "Ready for offline use — View details" once installed and
verified, and reopens on click. It sits above the search box but never covers
it.

### 5.4 Updates

`install` event precaches into the new versioned cache. The old cache is deleted
**only** in `activate`, after the new cache is fully populated — so a failed
update never destroys a working offline copy.

When a new worker reaches `waiting`, the app shows "An updated offline guide is
available." with an "Update now" button. It never reloads on its own. If the
user is currently reading an answer, the prompt is deferred to a dismissible
bar rather than a modal. After the user accepts: `skipWaiting`, `clients.claim`,
re-run verification, display the new versions.

### 5.5 Installation guidance

- Chromium: capture `beforeinstallprompt`, `preventDefault()`, store it, reveal
  the Install button, call `prompt()` only from a click handler, listen for
  `appinstalled`, hide in standalone.
- iOS/iPadOS: detect the platform including iPadOS-reporting-as-Mac
  (`maxTouchPoints > 1`), show the four Safari steps, no fake install button;
  show "Installed" when `navigator.standalone` or the standalone media query is
  true.
- Anything else: explain that the app still works in the browser, give generic
  browser-menu guidance, and never claim installation is impossible merely
  because no automatic prompt is available.

---

## 6. My RV profile

Stored under a single localStorage key, `rvpa.profile.v1`, as one JSON object.
All fields optional; every equipment field defaults to `"unknown"` with the
label "Unknown — show all configurations". `returnDateTime` is stored locally
only and never leaves the device.

Export writes a JSON file via a Blob download; import reads a file, validates it
against the same field whitelist used on write, and rejects unknown keys rather
than merging them. Clear removes the key and returns the app to Broad Guidance.

Checklist state lives under `rvpa.checklists.v1`, keyed by checklist ID, with a
per-checklist reset. Nothing syncs anywhere.

There is no setup nag: the settings screen is reachable from the header and from
a single dismissible line inside answers that actually have variants.

---

## 7. Answer rendering

Order within an answer view:

1. Title, category, and a risk indicator using icon plus word.
2. Escalation block — **only if `escalation !== null`**, rendered first when
   `riskLevel === "emergency"`.
3. Immediate action.
4. Numbered steps.
5. Burning Man guidance block, visually distinct and labelled, when
   `burningManOverride` is non-empty.
6. Do-not block, when non-empty.
7. Configuration variants — the profile-matching one first when a profile
   exists, others inside a collapsed "Other RV configurations"; plus a "Show all
   configurations" control on affected answers.
8. Configuration notice, when `configurationNotice` is true.
9. Sources, listing document, page or section, and priority.
10. Related topics.

When `escalation` is `null` the entire block is absent from the DOM, not hidden
with CSS — so a routine answer such as "tripped breaker" carries no On Road Care
text at all.

---

## 8. Visual and accessibility design

Mobile-first from 320 px. White/neutral background, restrained red accent used
only alongside an icon and a word. System font stack, no webfonts. Inline SVG
icons authored in the repo, no icon library.

Minimum 44 × 44 px tap targets. Visible focus rings that are not removed.
`aria-live="polite"` on the search results region and the cache status region.
Real `<label>` elements on every input. Semantic landmarks. Tested at 200 %
text zoom and with `prefers-reduced-motion`. Contrast target 7:1 for body text,
for bright-sunlight legibility.

Branding stays a clean text treatment with "Unofficial companion guide." until
an approved local logo exists. No scraping, no hotlinking, no imitation of the
El Monte site. Footer carries the exact wording from spec §15.

---

## 9. Tests

Node's built-in test runner, zero dependencies, run with `node --test tests/`.
No devDependencies means nothing to install before Replit import.

### 9.1 Data validation (`validate-data.test.mjs`)

- `answers.json`, `checklists.json`, `synonyms.json`, `brand-config.json` all
  parse.
- Every record ID is unique and slug-formatted.
- Every record has at least one source; every source has a valid `document`, a
  `priority` matching that document, and a `page` (PDFs) or a recognised
  `section` (Walkthrough).
- `riskLevel` ∈ {routine, caution, emergency}.
- **No routine record carries a non-null escalation** unless it is on the
  explicit administrative allowlist (`oil-change-due`, `repair-over-100`) —
  this is the direct test for spec §19's "no routine record with an unnecessary
  default escalation".
- Every record on the source-map §7.1 escalation list **has** a non-null
  escalation, and every record on the §7.2 list has `escalation: null`. Both
  directions are asserted from a checked-in fixture derived from the source map.
- Every emergency record has an escalation and a `burningManNote`.
- Burning Man priority metadata: at least one record cites priority 1, and every
  record with a non-empty `burningManOverride` cites the Burning Man guide.
- `related` IDs all resolve.
- All 44 spec §7 minimum topics are covered, matched by a fixture mapping topic
  to record ID.
- No record text contains a phone number pattern — guards against fabricating
  the On Road Care number, which appears in no source.

### 9.2 Asset and config (`assets.test.mjs`, `config.test.mjs`)

- Every path in `asset-manifest.js` exists on disk.
- Every cacheable file in `public/` appears in the manifest (catches forgotten
  additions).
- `service-worker.js` and `offline.js` read the manifest from the same module —
  asserted by import identity, not by string comparison.
- `manifest.webmanifest` parses and has `name`, `short_name`, `start_url`,
  `display`, `icons` at 192 and 512, and a maskable icon.
- Icon files referenced by the manifest exist.
- `brand-config.json` has all keys from spec §15 and an `approvalStatus` of
  `unofficial` or `approved`.

### 9.3 Search (`search.test.mjs`)

The thirteen representative queries from spec §19, each asserting the expected
record appears and, where it matters, that it ranks first:

| Query | Expected top result |
|---|---|
| generator will not start | `generator-will-not-start` |
| smell propane | `propane-smell` (emergency, escalation present) |
| dust storm | `dust-storm-procedure` (Burning Man source first) |
| no power | `no-120v-power` |
| empty black tank | `waste-tank-emptying`, with the Burning Man waste-service record in the top 3 |
| awning | `awning-burning-man` first, ordinary awning record in the top 3 |
| clean playa dust | `playa-dust-cleaning` |
| return checklist | `final-return-inspection` |
| water heater | `water-heater` with all three variants present |
| 30 amp | `shore-power` with the 30 A variant surfaced |
| 50 amp | `shore-power` with the 50 A variant surfaced |
| frozen AC | `ac-frozen` |
| flat tire | `flat-tire` (escalation present, "do not change it yourself" in `doNot`) |

Plus behavioural tests:

- Misspellings `genarator`, `propaine`, `awining` still resolve.
- `30 amp` and `50 amp` never collide despite fuzzy matching.
- A nonsense query returns the no-results state and fabricates nothing.
- A weak query returns the exact low-confidence wording from spec §8.
- Configuration filtering: with `{waterHeater:"tankless"}` the tankless variant
  is first; with `unknown` all three appear in source-priority order; the
  variant set is identical in both cases — the profile reorders, never removes.
- Graceful behaviour when the profile is absent, empty, or contains unknown
  keys.

### 9.4 Offline behaviour

Automated where it can be: a headless check that `index.html` and `app.js`
reference only same-origin, relative URLs, so nothing can silently depend on a
CDN. A grep-style assertion that no source file contains `http://` or `https://`
outside `brand-config.json` and the clearly-labelled optional links.

The end-to-end "loads without network after caching" check is a documented
manual step in `README.md`, because a real service-worker lifecycle needs a real
browser. The app's own internal verifier covers the mechanical part, and the
airplane-mode instruction covers the rest.

---

## 10. Build sequence

| Phase | Work | Done when |
|---|---|---|
| **1** ✅ | Inspect sources, write the source map and this plan | Both files exist; conflicts and escalations catalogued |
| **2** | Author `answers.json` (~95 records), `checklists.json` (13 lists), `synonyms.json`; write and pass `validate-data.test.mjs` | Every record cites a real page or section; escalation lists match the source map in both directions |
| **3** | `index.html`, `styles.css`, `app.js`, `search.js`, `answer-view.js`; home screen, quick actions, categories; pass `search.test.mjs` | All thirteen representative queries pass |
| **4** | `storage.js`, `profile.js`; My RV screen, export/import/clear; variant ordering | Broad Guidance verified as the default; no nag paths |
| **5** | `asset-manifest.js`, `service-worker.js`, `offline.js`, `install.js`, `offline.html`, `manifest.webmanifest`, icons; real verification and update flow | Verifier reports honest per-asset results; airplane-mode test passes on a device |
| **6** | `checklists.js`, `brand-config.json`, accessibility pass, `README.md`, `README_REPLIT.md` | Keyboard-only pass; 320 px pass; 200 % zoom pass |
| **7** | Run the full test suite, fix defects, final review of every citation | All tests green; no unsourced claim remains |

Phase 2 is the long pole and the one where correctness matters most; it is
gated on the two sign-offs below.

---

## 11. Decisions required before Phase 2

These cannot be resolved from the sources alone.

1. **Safety-ventilation exception** (`source-map.md` §5). Spec §3 says Burning
   Man guidance *always* overrides. Applied literally to BM p.4's "keep windows
   and roof vents closed at all times", the app would suppress the
   open-the-windows instruction during a propane leak or a CO alarm. The plan
   assumes a narrow exception for the four affected records. **Needs explicit
   approval.**

2. **Awning resolution** (`source-map.md` §4.2). BM p.4 says never use it; BM
   p.2 charges $50 to use it. The plan leads with "do not use", matching spec
   §3, and shows the p.2 text as a labelled alternative. **Confirm.**

3. **App name.** Spec §1 calls the app "RV ASSistant Playa"; the §15
   brand-config example uses `"appName": "RV Playa Assistant"`. These differ.
   The plan assumes `brand-config.json` is authoritative at runtime and asks
   which string should be shipped in it.

4. **Checklist naming.** Spec §10 step 4 and §9 both refer to a "Return
   Checklist", but the §14 list names it "Final return inspection". The plan
   assumes one checklist with ID `final-return-inspection` and the display title
   "Return checklist" so that the airplane-mode instruction and the quick-action
   button both resolve.

5. **Source filename correction.** Spec §2 lists
   `Burning-Man-Rental-Guide-2026.pdf` and `Class-A-Walkthrough-Transcript.txt`
   (hyphens). The actual files are `Burning_Man_Rental_Guide_2026.pdf` and
   `Class_A_Walkthrough_Transcript.txt` (underscores), matching spec §18. §2
   should be corrected to the underscore forms.

Items 3–5 are editorial. Items 1 and 2 are substantive and item 1 is
safety-critical.
