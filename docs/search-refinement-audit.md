# Search refinement audit — Stage 1

Development document. Not deployed, not inside `public/`.

Audit of the deterministic search in `public/js/search.js` against the knowledge
base in `public/data/answers.json`, ahead of the Stage 2 refinements.

## How these numbers were produced

Every score in this document is measured, not estimated. An instrumented copy of
the scoring loop was run against the real index, with the constants copied
verbatim from `public/js/search.js`. A consistency check compared the
instrumented total against `scoreRecord()` for the top five results of all 18
queries; **all totals matched to within 0.01**, so the per-field breakdowns below
are the actual contributions the shipped code computes.

Notation used throughout:

- `token:field=N` — plain query token matched in that field, contributing N.
- `synonym:field=N` — a synonym-expanded token matched, contributing N.
- `phrase:field=N` — a phrase bonus for a whole-query (or synonym-substituted
  whole-query) substring hit.
- `base` — sum of all contributions before multipliers.
- `cov` — token coverage, applied as `0.45 + 0.55 × coverage`.

---

## 1. How the current scorer works

`scoreRecord()` builds a score in four passes over 11 flattened fields.

| Field | Weight | Phrase bonus | Source |
| --- | --- | --- | --- |
| `title` | 5.0 | 9 | `record.title` |
| `questions` | 4.2 | 7 | authored example questions |
| `aliases` | 3.6 | 6 | authored aliases |
| `symptoms` | 3.2 | 5 | authored symptoms |
| `id` | 2.6 | — | record id with hyphens replaced by spaces |
| `immediateAction` | 2.2 | 3 | one-line action |
| `category` | 1.8 | — | category name |
| `burningManOverride` | 1.5 | — | body text |
| `doNot` | 1.2 | — | body text |
| `steps` | 1.1 | 1.5 | body text |
| `variants` | 0.9 | — | body text of variants, conditionals, notes |

Multipliers, applied in order: coverage `0.45 + 0.55 × coverage`, then
`RISK_BOOST` (emergency 1.18 / caution 1.06 / routine 1.0), then
`record.searchWeight`, then profile boost, then ×1.1 if the record's best source
is priority 1, then ×1.08 if `playaOnly`.

Confidence gate: `confidence ≥ 0.32` **and** `coverage ≥ 0.5` **and** the top
score is at least 1.12 × the runner-up.

Two structural facts matter for the rest of this audit:

- **Checklists are not indexed.** `buildIndex()` only reads
  `answersData.records`. Checklist competition happens through the two
  checklist-proxy answer records, `daily-burning-man-checks` (→ `daily-morning`)
  and `return-checklist-answer` (→ `return-checklist`), which carry a
  `checklistId` but are otherwise scored like any other record.
- **There is no intent handling of any kind.** Confirmed by reading the module
  end to end.

---

## 2. Confirmed root causes

### RC1 — Every field contributes additively, so bulk beats precision

A token found in all 11 fields adds all 11 weights. The word "dust" alone is
worth up to `5 + 4.2 + 3.6 + 3.2 + 2.6 + 2.2 + 1.8 + 1.5 + 1.2 + 1.1 + 0.9 =
27.3`, of which only 12.8 comes from the three fields a human would call
authoritative (title, questions, aliases).

Measured: for `dust storm`, `charging-vs-dust-storm` reaches `base=80.7`, and
`token:symptoms=6.4 + token:immediateAction=4.4 + token:burningManOverride=3.0 +
token:doNot=2.4 + token:steps=2.2 = 18.4` of that is body text. Longer records
accumulate more of this, which is exactly backwards.

### RC2 — The `id` field silently double-counts the title

`buildFields()` indexes `record.id` with hyphens replaced by spaces. Record ids
are slugified titles, so nearly every title token is scored twice: 5.0 from
`title` plus 2.6 from `id`. Measured on `dust-storm-procedure` for `dust storm`:
`token:title=10`, `token:id=5.2`. This inflates records whose id happens to be
verbose and adds nothing a title match has not already said.

### RC3 — Phrase matching only ever considers the entire query

`expandQueryPhrases()` returns the whole normalized query plus synonym
substitutions of it. There is no sub-phrase or n-gram matching, so the phrase
bonus disappears the moment a user adds a single word.

Measured, and this is the single largest ranking defect:

| Query | `dust-storm-procedure` phrase bonus | base |
| --- | --- | --- |
| `dust storm` | 47.0 (`title 9`, `questions 14`, `aliases 24`) | 94.85 |
| `dust storm daily checks` | **0** | 46.35 |

The record's own alias is literally `"dust storm"`, and it scores nothing for it
in the second query.

### RC4 — Coverage rewards incidental body words

Coverage counts a query token as "covered" if it matched *any* field, including
`steps` at weight 1.1. For `dust storm daily checks`:

- `dust-storm-procedure` — coverage 0.50 (×0.725), final **67.70**
- `charging-vs-dust-storm` — coverage 0.75 (×0.863), final **66.08**

`charging-vs-dust-storm` gets the higher coverage purely because the word
"daily" appears inside one of its step sentences ("the daily charging
schedule"). The direct procedure survives by a 2.4% margin, entirely by luck.

The mirror-image failure also exists: a record can score with **zero** coverage.
For `whiteout`, `charging-vs-dust-storm` scores 19.44 with `cov=0.00 (×0.45)`,
because only synonym-expanded tokens matched. Coverage of zero should not be a
0.45 discount, it should be disqualifying.

### RC5 — The Burning Man synonym group injects generic mass

`synonyms.json` contains `["black rock city", "brc", "burning man", "playa",
"burn"]`. Because expansion is symmetric and per-token, the token `playa`
expands to `black`, `rock`, `city`, `brc`, `burning`, `man`, `burn`, and every
one of those is then matched against all 11 fields at 0.7 × 0.82 strength.

Measured on `how do I clean playa dust?`: `awning-burning-man` ranks **third at
68.45**, and roughly 19 points of its base come only from `playa → burning, man`
(`synonym:title=7.03`, `synonym:questions=5.91`, `synonym:id=3.65`,
`synonym:burningManOverride=2.58`). Nothing in that record is about cleaning.

The same group crowds `can I use the awning at Burning Man?`: ranks 2 to 4 are
`burning-man-surcharge` (51.08), `burning-man-support-limits` (48.35) and
`prohibited-use-burning-man` (46.16), all scoring on `burning` + `man` alone.

`["playa dust", "dust", "alkaline dust", "moon dust"]` has the same effect in
the other direction: `dust` pulls in `playa`, which then pulls in the whole
Burning Man cluster.

### RC6 — `category` is indexed as a matchable field

Category names are indexed at weight 1.8, so the token `playa` matches the
`Playa` category on all 11 records in it, and `return` matches the `Return`
category on all 8. Measured: `playa-dust-cleaning` shows `token:category=1.8`
for `how do I clean playa dust?`, and `synonym:category=1.03` appears on many
records that share nothing else with the query.

### RC7 — Fuzzy and substring fallbacks fire on unrelated words

`matchToken()` has three fallbacks after an exact hit: prefix match at 0.45,
Levenshtein within tolerance at 0.55 (tolerance 1 from 5 characters, 2 from 8),
and a raw `String.includes` at 0.45 for tokens of 6+ characters.

Confirmed false positives:

| Query token | Matched | Record | Contribution |
| --- | --- | --- | --- |
| `brown` | `blown` | `fuse-replacement` (title) | 2.75 |
| `whiteout` | `without` | `lpg-co-alarm` (doNot) | 0.66 |
| `white` | `while` | `lpg-co-alarm` (doNot) | 0.38 |
| `reset` | `reseat` | `waste-leaks` (immediateAction) | 1.21 |

`brown → blown` is the damaging one: it puts a fuse record in the top four for a
floor-covering query. The others are low-value noise rather than rank-changing.

A related but distinct problem is exact matches on common words. `Home Depot`
returns `warning-light-throttle` because its authored question "The RV is in
limp home mode" contains the literal token `home` — an exact match at
`token:questions=4.2`, not a fuzzy artefact. One common word matching one strong
field beats a query whose other, far more specific word (`depot`) matches
nothing at all in the knowledge base.

### RC8 — Checklist-proxy records are scored like direct answers

Nothing distinguishes a record with a `checklistId` from a procedure record. For
`what do I close during a dust storm?`, `return-checklist-answer` appears at
rank 6 (13.50) purely on the incidental body words "close", "during" and "dust".

### RC9 — Content gaps in the knowledge base

Three source-supported details from the Burning Man guide are missing or buried:

1. **"Home Depot" does not appear anywhere in `answers.json`.** The source says,
   verbatim on p.4 under *Tips from Fellow Burning Man Travelers*: "Use thick
   brown paper (available at Home Depot) to cover the floor, secured with BLUE
   painter's tape (do not use any other kind of tape!)." The knowledge base
   carries the paper and the tape but drops the shop.
2. **Floor protection has no high-weight field anywhere.** The instruction lives
   only inside `playa-dust-prevention.steps` (weight 1.1). No title, question or
   alias in the entire knowledge base contains "floor protection", "brown paper"
   or "Home Depot".
3. **`cleaning-fee-prevention` leads with the fee, not the prevention.** Its
   `immediateAction` opens "Return it in the same clean condition inside and
   out. The minimum fee is $500 if you do not."

---

## 3. Per-query traces

### 1. `dust storm`

- Normalized: `dust storm` · tokens `[dust, storm]` · synonym-expanded adds `playa, alkaline, moon`
- Phrase candidates: `"dust storm"`, `"whiteout"`, `"white out"`, `"sandstorm"`, `"dust out"`
- Intent: none inferred (no intent layer exists)
- 51 records matched · confident: **true**

| # | Record | Score | Breakdown |
| --- | --- | --- | --- |
| 1 | `dust-storm-procedure` | **191.11** | base 94.85; `phrase:aliases=24`, `phrase:questions=14`, `token:title=10`, `phrase:title=9`, `token:questions=8.4`, `token:aliases=7.2`, `token:id=5.2`; cov 1.00, risk ×1.06, w ×1.6, p1 ×1.1, playa ×1.08 |
| 2 | `charging-vs-dust-storm` | 121.95 | base 80.70; `token:title=10`, `phrase:title=9`, `token:questions=8.4`, `token:aliases=7.2`, `phrase:questions=7`, `token:symptoms=6.4` |
| 3 | `playa-dust-prevention` | 49.52 | base 41.07; `phrase:questions=7` from the synonym-substituted phrase `"dust out"`, plus `synonym:*` for `playa` totalling ≈ 10.7 |
| 4 | `playa-dust-cleaning` | 40.78 | base 33.82; no phrase hit, pure `dust` + `playa` token/synonym mass |
| 5 | `ventilation-playa-vs-emergency` | 19.38 | base 17.69; `token:title=5` on "dust" |
| 6 | `awning-burning-man` | 12.45 | base 9.09; **entirely incidental** — `synonym:questions=2.41` (playa), `token:burningManOverride=1.5` (dust), `phrase:steps=1.5` for `"dust out"` |

Result is correct, but ranks 3 to 6 are broad records admitted by RC1 and RC5.
`awning-burning-man` is present only because "dust" appears in its body and
"playa" expands into its title.

### 2. `dust storm daily checks`

- Tokens `[dust, storm, daily, checks]` · confident: **false** · 83 records matched

| # | Record | Score | Breakdown |
| --- | --- | --- | --- |
| 1 | `dust-storm-procedure` | **67.70** | base 46.35, **phrase bonus 0** (RC3), cov 0.50 ×0.725 |
| 2 | `charging-vs-dust-storm` | 66.08 | base 50.70, cov **0.75** ×0.863 — "daily" matched inside a step sentence (RC4) |
| 3 | `daily-burning-man-checks` | 44.83 | base 34.31, cov 1.00; `token:title=10` (daily, checks), `token:aliases=5.58`, `token:immediateAction=3.41` (dust) |
| 4 | `playa-dust-cleaning` | 33.05 | cov 0.25 |
| 5 | `playa-dust-prevention` | 31.82 | cov 0.25 |
| 6 | `generator-startup-checks` | 17.45 | `token:aliases=3.6` on "checks", `token:burningManOverride=3.0` on dust+storm |

This is the clearest demonstration of RC3 and RC4 together. The margin between
ranks 1 and 2 is 1.6 points on 67, and it is decided by the word "daily"
appearing in a body sentence of the wrong record.

### 3. `whiteout`

- Tokens `[whiteout]` · synonym-expanded adds `dust, storm, white, out, sandstorm` · confident: **true** · 81 records matched

| # | Record | Score | Breakdown |
| --- | --- | --- | --- |
| 1 | `dust-storm-procedure` | **108.74** | base 53.97; `synonym:aliases=9.21`, `phrase:questions=7`, `phrase:aliases=6`, `token:questions=4.2`, `token:aliases=3.6` |
| 2 | `charging-vs-dust-storm` | 19.44 | base 28.59, **cov 0.00 ×0.45** — scores entirely on synonym mass with no query token matched (RC4) |
| 3 | `playa-dust-prevention` | 11.38 | cov 0.00 |
| 4 | `playa-dust-cleaning` | 10.10 | cov 0.00 |
| 5 | `awning-burning-man` | 5.17 | cov 0.00; `synonym:questions=2.41` on the token `out` |
| 6 | `lpg-co-alarm` | 5.10 | `token:doNot=0.66` — `whiteout` fuzzy-matched **`without`** (RC7) |

Correct top result. Ranks 2 to 6 are all coverage-zero noise.

### 4. `storm coming`

- Tokens `[storm, coming]` · no synonym expansion · confident: **false** · 7 records matched

| # | Record | Score | Breakdown |
| --- | --- | --- | --- |
| 1 | `dust-storm-procedure` | **28.64** | base 19.61, cov 0.50 — "coming" matches nothing |
| 2 | `charging-vs-dust-storm` | 26.95 | base 24.60, cov 0.50 |
| 3 | `no-fresh-water` | 4.69 | `token:questions=4.2` — its question is "no water **coming** out" |
| 4 | `generator-will-not-start` | 3.23 | `token:burningManOverride=1.5` + `token:doNot=1.2` on "storm" |

The right answer is first but **not confident**: 28.64 / 26.95 = 1.063, below the
1.12 decisiveness gate, so the UI shows "No single answer clearly matched."
Two near-identical storm records split the vote (RC1 + no intent).

### 5. `blowing dust`

- Tokens `[blowing, dust]` · confident: **true** · 53 records matched

| # | Record | Score | Breakdown |
| --- | --- | --- | --- |
| 1 | `dust-storm-procedure` | **70.41** | `token:symptoms=6.4` + `phrase:symptoms=5` — the authored symptom is "heavy blowing dust"; cov 1.00 |
| 2 | `playa-dust-cleaning` | 40.78 | cov 0.50, pure `dust` mass |
| 3 | `playa-dust-prevention` | 39.27 | cov 0.50 |
| 4 | `charging-vs-dust-storm` | 26.95 | cov 0.50 |
| 5 | `ventilation-playa-vs-emergency` | 19.38 | cov 0.50 |
| 6 | `awning-burning-man` | 10.40 | incidental |

Correct, and the `symptoms` field is doing exactly what it should. Ranks 2 and 3
are cleaning/prevention records outranking nothing important, but they crowd an
immediate-response query.

### 6. `visibility is low` — **fails**

- Raw `[visibility, is, low]`, content tokens `[visibility, low]` · confident: **true (wrongly)** · 25 records matched

| # | Record | Score | Breakdown |
| --- | --- | --- | --- |
| 1 | `low-coach-battery` | **18.85** | base 19.70 — the token "low" alone in title 5, questions 4.2, aliases 3.6, symptoms 3.2, id 2.6, steps 1.1 (RC1 in miniature) |
| 2 | `dust-storm-procedure` | 4.67 | `token:symptoms=3.2` on "visibility" only |
| 3 | `warning-lights-yellow` | 4.07 | "low" |
| 4 | `smoke-alarm-chirp` | 3.63 | "low" (title: "low battery") |
| 5 | `roof-strike` | 3.59 | "low" |
| 6 | `coach-battery-charging` | 3.57 | "low" |

Confirmed cause: "visibility" appears in exactly one place in the entire
knowledge base — `dust-storm-procedure.symptoms` — and one 3.2-weight hit cannot
beat one generic word replicated across six fields of an unrelated record. The
app confidently shows a battery answer to somebody who cannot see.

### 7. `should I run the generator in a dust storm?`

- Content tokens `[should, run, generator, dust, storm]` · confident: **true** · 98 records matched

| # | Record | Score |
| --- | --- | --- |
| 1 | `dust-storm-procedure` | **125.22** (base 62.15, cov 1.00) |
| 2 | `charging-vs-dust-storm` | 97.82 (base 72.73, cov 0.80) |
| 3 | `generator-will-not-start` | 52.70 |
| 4 | `playa-dust-cleaning` | 38.92 (cov 0.40 — pure dust mass) |
| 5 | `generator-startup-checks` | 37.50 |
| 6 | `coach-battery-charging` | 34.26 |

Behaviour is already close to the requirement: the procedure leads and the
charging-during-storm record is second. Note that `charging-vs-dust-storm` has
the **higher base** (72.73 vs 62.15) and only loses on coverage — a fragile win.
`playa-dust-cleaning` at rank 4 is noise.

### 8. `what do I close during a dust storm?`

- Content tokens `[close, during, dust, storm]` · confident: **true** · 64 records matched

| # | Record | Score | Note |
| --- | --- | --- | --- |
| 1 | `dust-storm-procedure` | **114.94** | cov 1.00 |
| 2 | `charging-vs-dust-storm` | 80.16 | cov 0.75 |
| 3 | `playa-dust-prevention` | 39.87 | the record that actually lists what to close |
| 4 | `ventilation-playa-vs-emergency` | 33.85 | `token:aliases=3.6` on "close" |
| 5 | `playa-dust-cleaning` | 33.05 | cov 0.25, noise |
| 6 | `return-checklist-answer` | 13.50 | **checklist proxy admitted on body words alone** (RC8): `token:steps=3.3` (close, during, dust), `token:immediateAction=2.2` |

Correct top result, but `playa-dust-prevention` — arguably the better answer to
"what do I close" — sits below a charging record.

### 9. `how do I clean playa dust?`

- Content tokens `[clean, playa, dust]` · synonym-expanded adds `black, rock, city, brc, burning, man, burn, alkaline, moon` · confident: **true** · 96 records matched

| # | Record | Score | Note |
| --- | --- | --- | --- |
| 1 | `playa-dust-cleaning` | **107.25** | `phrase:questions=7` on the full query |
| 2 | `playa-dust-prevention` | 69.31 | |
| 3 | `awning-burning-man` | **68.45** | ≈19 points from `playa → burning, man` (RC5). Not a cleaning record. |
| 4 | `dust-storm-procedure` | 59.16 | |
| 5 | `no-dumping-playa` | 38.48 | cov 0.33 |
| 6 | `pre-return-cleaning` | 38.16 | genuinely relevant, ranked below three that are not |

Correct top result, badly polluted result set. This is the cleanest evidence for
RC5.

### 10. `how do I avoid a cleaning fee?`

- Content tokens `[avoid, cleaning, fee]` · confident: **true** · 72 records matched

| # | Record | Score |
| --- | --- | --- |
| 1 | `cleaning-fee-prevention` | **102.52** (`phrase:questions=7` — the query is an authored question verbatim) |
| 2 | `playa-dust-cleaning` | 56.23 |
| 3 | `pre-return-cleaning` | 42.21 |
| 4 | `prepaid-cleaning` | 25.97 |

Ranking is right. The defect here is **content, not scoring**: the record that
wins leads with the $500 figure rather than with what to do to avoid it (RC9.3).

Also note the phrase-expansion bug visible in the trace: the synonym group
`["ac", "a/c", ...]` substitutes inside words, generating nonsense phrase
candidates such as `"how do i avoid air conditioningleaning fee"`. Harmless
today because nothing matches them, but it is unbounded string work per query.

### 11. `floor protection` — **fails**

- Tokens `[floor, protection]` · confident: **false** · only 10 records matched

| # | Record | Score | Breakdown |
| --- | --- | --- | --- |
| 1 | `pre-return-cleaning` | 5.07 | `token:questions=4.2` — "Do I need to mop the floor?" |
| 2 | `stickers-tape` | 2.24 | `token:burningManOverride=1.5` |
| 3 | `return-checklist-answer` | 1.40 | `token:steps=1.1` |
| 4 | `playa-dust-prevention` | **1.33** | `token:steps=1.1` — this is the correct answer, ranked fourth at 1.3 points |
| 5 | `dust-storm-procedure` | 1.31 | `token:variants=0.9` on "protection" |

Confirmed cause: the floor-protection instruction exists **only** in a step
sentence. "protection" appears in no title, question or alias in the knowledge
base. Nothing about scoring can fix this; it needs content.

### 12. `brown paper` — **fails**

- Tokens `[brown, paper]` · confident: **true (wrongly)** · 11 records matched

| # | Record | Score | Breakdown |
| --- | --- | --- | --- |
| 1 | `toilet-paper` | **17.78** | "paper" in title 5, questions 4.2, aliases 3.6, id 2.6, immediateAction 2.2, doNot 1.2, steps 1.1, variants 0.9 — RC1 exactly |
| 2 | `playa-dust-prevention` | 6.15 | `phrase:steps=1.5` + `token:steps=2.2` — correct answer, 2.9× behind |
| 3 | `stickers-tape` | 3.56 | |
| 4 | `fuse-replacement` | 3.43 | `brown` fuzzy-matched **`blown`** at `token:title=2.75` (RC7) |

The app confidently answers a question about floor covering with toilet paper.

### 13. `blue painter's tape`

- Normalized `blue painters tape` · confident: **true** · only 3 records matched

| # | Record | Score |
| --- | --- | --- |
| 1 | `stickers-tape` | **49.30** |
| 2 | `playa-dust-prevention` | 13.97 |
| 3 | `cleaning-fee-prevention` | 3.26 |

Defensible — `stickers-tape` is the tape-policy record — but a user typing this
during set-up wants the floor-covering procedure, and the "do not use any other
kind of tape" prohibition should be unmistakable in both.

### 14. `Home Depot` — **fails**

- Tokens `[home, depot]` · confident: **false** · **only 2 records matched**

| # | Record | Score | Breakdown |
| --- | --- | --- | --- |
| 1 | `warning-light-throttle` | 5.99 | `token:questions=4.2` + `token:aliases=3.6` — exact match on `home`, from "The RV is in limp home mode" and the alias "limp home" |
| 2 | `oven` | 0.84 | `token:steps=1.1` on "home" |

`depot` matches nothing at all. Confirmed content gap (RC9.1): the source names
Home Depot on p.4 and the knowledge base does not. The only reason anything is
returned is the incidental `home` token in an unrelated engine record.

### 15. `why are the outlets not working?` — **fails the confidence gate**

- Content tokens `[outlets, working]` · confident: **false** · 16 records matched

| # | Record | Score | Breakdown |
| --- | --- | --- | --- |
| 1 | `no-120v-power` | 26.08 | `token:questions=8.4`, `token:aliases=3.6`, `token:symptoms=3.2`, cov 1.00 |
| 2 | `gfci-reset` | 23.69 | `token:questions=8.4`, `token:symptoms=3.2`, `token:title=2.75` (**"outlets" only prefix-matches "outlet"**), cov 1.00 |
| 3 | `no-hot-water` | 6.79 | "working" |
| 4 | `ac-will-not-run` | 6.22 | "working" |

Confirmed cause of the reported "No single answer clearly matched": both correct
records are ranked 1 and 2, but 26.08 / 23.69 = **1.101**, just under the 1.12
decisiveness threshold. The gate is treating two complementary electrical
answers as a tie. Contributing factor: `gfci-reset`'s title is "Resetting a GFCI
/ GFI outlet" (singular), so the plural query token only earns the 0.45 prefix
penalty rate in the title.

### 16. `reset the outlet`

- Content tokens `[reset, outlet]` · confident: **true** · 18 records matched

| # | Record | Score |
| --- | --- | --- |
| 1 | `gfci-reset` | **40.19** |
| 2 | `no-120v-power` | 11.80 |
| 3 | `breaker-reset` | 8.83 |
| 4 | `generator-breaker` | 6.58 |
| 5 | `waste-leaks` | 3.40 | `reset` fuzzy-matched `reseat` (RC7) |

Correct and decisive. Singular "outlet" exact-matches the title where the plural
in query 15 did not — which is itself the evidence that query 15's failure is a
morphology problem, not a relevance problem.

### 17. `what do I do if I smell propane?`

- Content tokens `[smell, propane]` · confident: **true** · 40 records matched

| # | Record | Score |
| --- | --- | --- |
| 1 | `propane-smell` | **93.83** (base 49.70, risk ×1.18, w ×1.6) |
| 2 | `propane-tank-valve` | 22.96 |
| 3 | `propane-refill` | 22.78 |
| 4 | `fuel-propane-return-levels` | 18.27 |
| 5 | `refrigerator-burning-man` | 17.53 |
| 6 | `propane-driving` | 14.86 |

Correct and decisive by 4×. Life-safety behaviour is healthy and must be
preserved unchanged.

### 18. `can I use the awning at Burning Man?`

- Content tokens `[use, awning, burning, man]` · confident: **true** · 72 records matched

| # | Record | Score | Note |
| --- | --- | --- | --- |
| 1 | `awning-burning-man` | **154.76** | `token:title=20`, `token:questions=16.8`, `phrase:questions=14` |
| 2 | `burning-man-surcharge` | 51.08 | scores on `burning` + `man` only (RC5) |
| 3 | `burning-man-support-limits` | 48.35 | same |
| 4 | `prohibited-use-burning-man` | 46.16 | same |
| 5 | `awning-operation` | 36.25 | the genuinely related record, ranked below three that are not |
| 6 | `fresh-water-refill-burning-man` | 30.37 | `burning` + `man` only |

The prohibition wins decisively and must stay that way. But `awning-operation`
should be the runner-up, not fifth behind three generic Burning Man records.

---

## 4. Summary of what Stage 2 must fix

| # | Cause | Queries affected |
| --- | --- | --- |
| RC1 | Additive 11-field scoring, no cap | 1, 2, 6, 12 and every crowded result set |
| RC2 | `id` double-counts `title` | all |
| RC3 | Phrase bonus is whole-query only | 2 (decisive), 7, 8 |
| RC4 | Coverage rewards body-text hits; zero coverage is not disqualifying | 2 (decisive), 3, 7 |
| RC5 | Burning Man synonym group injects generic mass | 9 (decisive), 18, 1 |
| RC6 | `category` indexed as a matchable field | 1, 9, 18 |
| RC7 | Fuzzy/substring false positives, and common words matching strong fields | 3, 12, 14 (decisive), 16 |
| RC8 | Checklist proxies scored as direct answers | 2, 8 |
| RC9 | Content gaps: Home Depot, floor protection, fee record leads with the fee | 10, 11, 12, 13, 14 |
| — | Confidence gate treats complementary answers as a tie | 4, 15 |

Queries that are already correct and must not regress: 1, 3, 5, 7, 8, 9, 10, 16,
17, 18 (top result), and every assertion in the existing `search.test.mjs`.

---

# Stage 2 — what changed, and the measured result

## Scoring changes

| Change | Root cause addressed |
| --- | --- |
| A token takes the **best** authoritative-field match plus **one capped** body match, never the sum of eleven fields | RC1 |
| `id` and `category` removed from the index | RC2, RC6 |
| Phrases matched as every contiguous n-gram, longest match per field, longer phrases worth more | RC3 |
| Coverage counted on authoritative fields and phrases only; a record with zero covered tokens is dropped | RC4 |
| Inverse document frequency scales every token and phrase by how many records contain it | RC5, RC6 |
| `playa` and `burn` removed from the Black Rock City synonym group | RC5 |
| Fuzzy matching requires the first two characters to agree; the raw substring fallback is gone; plurals match properly | RC7 |
| Records carrying a `checklistId` are damped unless the query shows checklist intent | RC8 |
| New `keywords` and `intents` fields, with a nine-value intent vocabulary inferred deterministically from the query | RC9, B |

Phrase bonuses were also rebalanced so a bigram is worth slightly less than one
exact title token. Before that adjustment, "wont start" appearing in two fields
of an unrelated record beat a full-coverage match on the right one.

## Measured before and after

Top three results and the confidence decision, for all 18 audited queries.

| Query | Before (top 3) | Confident | After (top 3) | Confident |
| --- | --- | --- | --- | --- |
| `dust storm` | 1. `dust-storm-procedure`<br>2. `charging-vs-dust-storm`<br>3. `playa-dust-prevention` | yes | 1. `dust-storm-procedure`<br>2. `charging-vs-dust-storm`<br>3. `playa-dust-prevention` | yes |
| `dust storm daily checks` | 1. `dust-storm-procedure`<br>2. `charging-vs-dust-storm`<br>3. `daily-burning-man-checks` | **no** | 1. `dust-storm-procedure`<br>2. `daily-burning-man-checks`<br>3. `charging-vs-dust-storm` | **no** |
| `whiteout` | 1. `dust-storm-procedure`<br>2. `charging-vs-dust-storm`<br>3. `playa-dust-prevention` | yes | 1. `dust-storm-procedure`<br>2. `charging-vs-dust-storm` | yes |
| `storm coming` | 1. `dust-storm-procedure`<br>2. `charging-vs-dust-storm`<br>3. `no-fresh-water` | **no** | 1. `dust-storm-procedure`<br>2. `charging-vs-dust-storm`<br>3. `no-fresh-water` | yes |
| `blowing dust` | 1. `dust-storm-procedure`<br>2. `playa-dust-cleaning`<br>3. `playa-dust-prevention` | yes | 1. `dust-storm-procedure`<br>2. `playa-dust-cleaning`<br>3. `playa-dust-prevention` | yes |
| `visibility is low` | 1. **`low-coach-battery`**<br>2. `dust-storm-procedure`<br>3. `warning-lights-yellow` | yes | 1. `dust-storm-procedure`<br>2. `low-coach-battery`<br>3. `warning-lights-yellow` | yes |
| `should I run the generator in a dust storm?` | 1. `dust-storm-procedure`<br>2. `charging-vs-dust-storm`<br>3. `generator-will-not-start` | yes | 1. `charging-vs-dust-storm`<br>2. `dust-storm-procedure`<br>3. `coach-battery-charging` | yes |
| `what do I close during a dust storm?` | 1. `dust-storm-procedure`<br>2. `charging-vs-dust-storm`<br>3. `playa-dust-prevention` | yes | 1. `dust-storm-procedure`<br>2. `charging-vs-dust-storm`<br>3. `ventilation-playa-vs-emergency` | yes |
| `how do I clean playa dust?` | 1. `playa-dust-cleaning`<br>2. `playa-dust-prevention`<br>3. **`awning-burning-man`** | yes | 1. `playa-dust-cleaning`<br>2. `playa-dust-prevention`<br>3. `ventilation-playa-vs-emergency` | yes |
| `how do I avoid a cleaning fee?` | 1. `cleaning-fee-prevention`<br>2. `playa-dust-cleaning`<br>3. `pre-return-cleaning` | yes | 1. `cleaning-fee-prevention`<br>2. `playa-dust-cleaning`<br>3. `prepaid-cleaning` | yes |
| `floor protection` | 1. **`pre-return-cleaning`**<br>2. `stickers-tape`<br>3. `return-checklist-answer` | **no** | 1. `playa-preparation-floor`<br>2. `pre-return-cleaning` | yes |
| `brown paper` | 1. **`toilet-paper`**<br>2. `playa-dust-prevention`<br>3. `stickers-tape` | yes | 1. `playa-preparation-floor`<br>2. `toilet-paper` | yes |
| `blue painter's tape` | 1. `stickers-tape`<br>2. `playa-dust-prevention`<br>3. `cleaning-fee-prevention` | yes | 1. `stickers-tape`<br>2. `playa-preparation-floor` | yes |
| `Home Depot` | 1. **`warning-light-throttle`**<br>2. `oven` | **no** | 1. `playa-preparation-floor`<br>2. `warning-light-throttle` | yes |
| `why are the outlets not working?` | 1. `no-120v-power`<br>2. `gfci-reset`<br>3. `no-hot-water` | **no** | 1. `no-120v-power`<br>2. `gfci-reset`<br>3. `ac-will-not-run` | yes |
| `reset the outlet` | 1. `gfci-reset`<br>2. `no-120v-power`<br>3. `breaker-reset` | yes | 1. `gfci-reset`<br>2. `no-120v-power`<br>3. `generator-breaker` | yes |
| `what do I do if I smell propane?` | 1. `propane-smell`<br>2. `propane-tank-valve`<br>3. `propane-refill` | yes | 1. `propane-smell`<br>2. `propane-tank-valve`<br>3. `propane-refill` | yes |
| `can I use the awning at Burning Man?` | 1. `awning-burning-man`<br>2. **`burning-man-surcharge`**<br>3. **`burning-man-support-limits`** | yes | 1. `awning-burning-man`<br>2. `playa-preparation-floor`<br>3. `prohibited-use-burning-man` | yes |

Separation improved as well as ordering. `can I use the awning at Burning Man?`
went from a 3.0× margin over the runner-up to 7.6×; `whiteout` went from 81
matched records to 2; `dust storm` dropped from 51 matched records to a top five
that is entirely about dust.

## Two deliberate non-changes

- **`dust storm daily checks` remains non-confident.** The query genuinely asks
  two things. The top result is the storm procedure and the daily checks record
  is second, which is the honest answer; forcing a single confident answer would
  hide one of the two things asked for.
- **`should I run the generator in a dust storm?` now leads with
  `charging-vs-dust-storm`.** That record's authored question is "Can I run the
  generator in a dust storm to charge?" and its immediate action is "Do not run
  the generator or engine during a dust storm." It is the more direct answer.
  The dust-storm procedure is second, and the regression test requires both in
  the top two regardless of order.
