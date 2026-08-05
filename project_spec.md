You are building a complete, production-ready offline Progressive Web App
called “RV ASSistant Playa”

Do not merely explain how to build it. Inspect the source files, create the
project structure, write all application files, populate the initial knowledge
base, run available checks, and leave the repository ready to import into
Replit and publish as a static site.

==================================================
1. PURPOSE
==================================================

The app helps renters safely operate and troubleshoot an El Monte Class A RV
at Burning Man.

Its objectives are to:

- Make common RV procedures easy to find.
- Help users troubleshoot routine problems.
- Prioritize Burning Man and playa-specific operating advice.
- Reduce the risk of damage, cleaning charges, waste fees, fuel charges,
  propane charges, late fees, or prohibited use.
- Work fully offline after the first successful preparation and caching.
- Provide source-grounded answers without hallucinating.
- Feel conversational while using deterministic local search rather than a
  remote LLM.

The app is not a replacement for the rental agreement, emergency services,
the instructions physically posted in the RV, or El Monte On Road Care.

==================================================
2. AUTHORITATIVE SOURCE FILES
==================================================

Use only these local files as the factual basis for operational guidance:

- source_materials/Burning-Man-Rental-Guide-2026.pdf
- source_materials/Class-A-Walkthrough-Transcript.txt
- source_materials/El-Monte-Class-A-Guest-Guide.pdf

Do not silently add facts from general internet knowledge.

Every knowledge-base answer must include a source reference containing:

- document title
- page number for PDFs
- transcript reference or section name for the walkthrough
- source priority

If a source does not support a claim, do not include it.

Do not copy the complete PDFs or transcript into the public app.

==================================================
3. SOURCE PRIORITY
==================================================

Use this priority order:

1. Burning Man 2026 RV Rental Guide
2. El Monte Class A walkthrough transcript
3. El Monte Class A Guest Guide

Burning Man guidance always overrides ordinary RV guidance while the vehicle
is at Burning Man, in Black Rock City, or on the playa.

Examples of mandatory Burning Man overrides include:

- Do not use the awning on the playa.
- Do not run the engine or generator during a dust storm.
- Use only one air-conditioning unit at a time while powered by the generator.
- Keep windows, roof vents, blinds, curtains, screens, entry openings, and
  exterior storage compartments protected against playa dust.
- Retract leveling jacks immediately if rain or flooding softens the playa.
- Never dump grey water or black water on the playa.
- Use authorized RV servicing trucks where required.
- Follow the Burning Man charging schedule rather than the ordinary
  dry-camping schedule.
- Use the Burning Man-specific cleaning method for playa dust.
- Do not use ordinary water or standard cleaning products inside when they
  would smear playa dust into mud.
- Apply the Burning Man return, cleaning, trash, fuel, propane, and fee
  guidance ahead of general return advice.

When the Burning Man guide is silent, use the walkthrough and then the Guest
Guide.

==================================================
4. EQUIPMENT VARIATIONS
==================================================

The sources describe more than one possible RV configuration.

Examples include:

- 30-amp versus 50-amp electrical configurations
- tankless versus tank-style water heaters
- one versus two roof air conditioners
- different refrigerator systems
- different slide, generator, thermostat, and control-panel arrangements

Do not guess which configuration is installed.

The default app mode must be:

“Broad guidance — show all configurations”

When multiple configurations exist:

- Show the materially relevant alternatives.
- Label each alternative clearly.
- Put the most likely or most source-specific procedure first only when the
  source supports that ordering.
- Include this notice where appropriate:

  “Vehicle configurations vary. Check the equipment installed in your RV,
  the instruction label beside the control, and the walkthrough provided at
  pickup.”

Do not force the user to configure their RV before using the app.

==================================================
5. OPTIONAL “MY RV” PROFILE
==================================================

Add an optional “My RV” settings screen.

The app must work immediately without completing it.

Optional fields:

- RV model
- model year
- rental unit number
- 30-amp / 50-amp / unknown
- one A/C / two A/C units / unknown
- tankless water heater / tank-style water heater / unknown
- refrigerator type / unknown
- generator type or model / unknown
- On Road Care phone number from the key tag
- pickup branch
- return branch
- return date and time, stored locally only

Every equipment field must include:

“Unknown — show all configurations”

Behavior:

- With no profile, show all relevant procedures.
- With a profile, show the matching procedure first.
- Keep other variants available in a collapsed section titled:
  “Other RV configurations.”
- Add “Show all configurations” to affected answers.
- Allow the user to reset to Broad Guidance at any time.
- Never block access or display repeated setup nags.

Store this profile entirely on the device.

Use localStorage for simple preferences or IndexedDB if helpful.

Do not send profile data to Replit or any server.

Include:

- Export My RV settings to JSON
- Import My RV settings from JSON
- Clear My RV settings

==================================================
6. ANSWER AND ESCALATION DESIGN
==================================================

Routine answers should normally include:

- title
- short immediate answer
- numbered steps
- Burning Man-specific guidance, when applicable
- things not to do, when applicable
- configuration alternatives, when applicable
- source references

Do not add “Call On Road Care” to every answer.

Each knowledge record must have:

- riskLevel: routine | caution | emergency
- escalation: optional object or null

Hide the escalation section completely when escalation is null.

Use escalation only where the sources indicate a serious safety risk,
potential major damage, prohibited self-repair, or required company contact.

Examples include:

- propane smell
- LPG or carbon-monoxide alarm
- fire or use of the fire extinguisher
- incorrect fuel
- collision or injury
- flat tire
- brake warning
- engine oil-pressure warning
- engine overheating
- significant fuel, propane, or vehicle-fluid leak
- serious red warning light
- inoperable mechanical failure
- equipment failure where continued operation risks major damage
- slide or leveling system stuck in an unsafe position
- source instructions that explicitly require On Road Care

Routine issues such as these should not automatically show escalation:

- tripped breaker
- GFCI reset
- low coach battery
- thermostat setup
- refrigerator temperature
- water-pump switch
- normal A/C condensation
- approximate tank-sensor readings
- ordinary generator startup checks

Never advise users to:

- bypass an alarm
- bypass a safety interlock
- disable a detector
- change a flat tire
- use caustic drain chemicals
- dump waste on the playa
- repair a propane system
- keep operating equipment when the source says to stop

==================================================
7. KNOWLEDGE-BASE FORMAT
==================================================

Store the complete searchable knowledge base in:

public/data/answers.json

Use a structured schema similar to:

{
  "id": "generator-will-not-start",
  "title": "Generator will not start",
  "category": "Power",
  "riskLevel": "routine",
  "priority": 1,
  "questions": [
    "Why won't the generator start?",
    "The generator cranks but will not start",
    "How do I start the generator?"
  ],
  "aliases": [
    "genset",
    "no generator",
    "generator problem"
  ],
  "symptoms": [],
  "immediateAction": "Turn off major electrical loads before troubleshooting.",
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
  ]
}

Create enough high-quality initial records to cover the most important
material in all three sources.

At minimum include useful coverage for:

- propane smell
- LPG/CO alarm
- smoke alarm
- fire extinguisher use
- generator startup and troubleshooting
- generator breaker
- generator oil
- coach battery charging
- dry camping power schedule
- air conditioning
- frozen A/C
- shore power
- GFCI outlets
- breaker reset
- fresh-water tank
- city-water connection
- water pump
- no fresh water
- water conservation
- toilet operation
- black and grey tanks
- waste service at Burning Man
- tank sensors
- clogs
- freshwater and waste leaks
- slide operation
- slide troubleshooting
- leveling system
- rain and soft playa
- awning
- dust storm procedure
- playa dust prevention
- refrigerator
- propane appliances
- stovetop
- water heater variants
- engine oil
- fuel type
- incorrect fuel
- fuel and propane return levels
- flat tire
- warning lights
- collision
- breakdown
- departure checklist
- daily Burning Man checklist
- pre-return cleaning
- trash disposal
- return timing
- cleaning-fee prevention
- prohibited stickers and tape
- exterior compartment protection
- entry step
- doors, deadbolt, windows, and vents
- driving clearance
- backing and spotter use

Keep answers concise enough for urgent use on a phone.

==================================================
8. SEARCH EXPERIENCE
==================================================

The app should feel like a simple offline question-answer assistant.

Do not use a remote AI service.

Do not require:

- an API key
- a server
- a database
- OpenAI
- Claude
- embeddings generated online
- an internet connection after caching

Implement deterministic browser-side retrieval using:

- normalized text
- token matching
- phrase matching
- aliases
- synonyms
- weighted fields
- fuzzy matching for minor misspellings
- source priority
- Burning Man override priority
- optional My RV profile weighting

Include a local synonym map, including examples such as:

- generator = genset, onboard power
- coach battery = house battery
- shore power = hookup, external power, campsite electricity
- black tank = toilet tank, sewage tank, waste tank
- grey tank = gray tank, sink tank, shower tank
- water pump = pump
- LPG = propane
- A/C = AC, air conditioner, air conditioning
- breaker = circuit breaker
- GFCI = GFI
- playa dust = dust, alkaline dust
- dump = empty tanks, pump tanks, waste service

Return the three best results.

Search across:

- title
- example questions
- aliases
- symptoms
- steps
- warnings
- category

When confidence is low, say:

“I found a few possibly related topics. Choose the closest one.”

Never fabricate an answer from unmatched text.

==================================================
9. HOME SCREEN
==================================================

The home screen must prioritize:

1. Offline preparation status
2. The question box
3. High-value quick actions
4. Checklists and categories

Use a large search box with wording such as:

“Ask an RV question…”

Provide example prompts:

- Why won’t the generator start?
- What should I do during a dust storm?
- How do I empty the waste tanks?
- Why is there no power?
- How do I avoid a cleaning fee?

Quick-access buttons:

- Propane smell
- Alarm sounding
- Generator problem
- No electrical power
- No fresh water
- Toilet or waste problem
- Dust storm
- Return checklist

Do not overcrowd the interface.

Design for use in bright sunlight and stressful situations.

Use large tap targets and high contrast.

Do not use color alone to indicate risk.

==================================================
10. INSTALLATION AND OFFLINE PREPARATION
==================================================

The homepage must clearly teach users how to install and cache the app.

Installation and caching are separate states.

At the top of the first-use homepage show a panel titled:

“Prepare this app for Burning Man”

Show four steps:

1. Open while connected
   “Keep this page open until the offline guide has finished preparing.”

2. Add to Home Screen
   Show device-appropriate installation instructions or a real supported
   install button.

3. Confirm offline content
   Verify all required app and knowledge files are cached.

4. Test in airplane mode
   Ask the user to turn on airplane mode, fully close the app, reopen it,
   search for “generator,” and open the Return Checklist.

The panel must not block the main search interface.

Display live statuses:

- App installation:
  Not installed / Installed / Installation unavailable in this browser

- Offline guide:
  Preparing / Ready / Incomplete / Error

- Internet:
  Online / Offline

- Knowledge-base version

- App version

- Offline test:
  Not tested / Passed on this device

Use icons plus words.

==================================================
11. REAL CACHE VERIFICATION
==================================================

Do not create a fake readiness button.

Maintain one canonical list of required offline assets.

The service worker and readiness verifier must use the same list.

Precache all critical files, including:

- index.html
- application JavaScript
- application CSS
- answers.json
- synonyms or other local data files
- brand-config.json
- manifest.webmanifest
- app icons
- any locally included diagrams
- offline fallback content

A “Prepare for offline use” button must:

1. Confirm service-worker registration.
2. Wait for navigator.serviceWorker.ready.
3. Ask the service worker to cache required assets.
4. Verify each required asset exists in Cache Storage.
5. Confirm answers.json loads and parses.
6. List missing files if verification fails.
7. Display “Offline guide ready” only when every check passes.

When installed and verified, collapse the panel to:

“Ready for offline use — View details”

Allow reopening it.

Include a “Run internal offline check” button.

Explain that the user must still perform the physical airplane-mode test.

==================================================
12. DEVICE-SPECIFIC INSTALLATION
==================================================

For Chromium browsers:

- Listen for beforeinstallprompt.
- Store the event.
- Show an “Install app” button only when a valid prompt is available.
- Call prompt() only after user interaction.
- Listen for appinstalled.
- Hide the install button in standalone mode.

For iPhone and iPad:

- Detect iOS or iPadOS context.
- Explain that installation should be completed in Safari.
- Show:
  1. Tap Share.
  2. Tap Add to Home Screen.
  3. Enable Open as Web App if shown.
  4. Tap Add.
- Do not show a fake automatic install button.
- When running in standalone mode, display “Installed.”

For unsupported browsers:

- Explain that the app can still be used in the browser.
- Show generic browser-menu guidance.
- Do not claim installation is impossible merely because an automatic
  prompt is unavailable.

==================================================
13. OFFLINE UPDATES
==================================================

Use versioned caches.

Do not delete the previous working cache until the replacement is fully
downloaded.

When an update is available, show:

“An updated offline guide is available.”

Include an “Update now” button.

Do not silently reload while the user is reading an answer.

After updating:

- activate the new version
- rerun cache verification
- display the new app and knowledge-base version

==================================================
14. CHECKLISTS
==================================================

Include offline checklists for:

- Pickup inspection
- Arriving at Burning Man
- Daily morning check
- Daily evening check
- Before running the generator
- Dust storm procedure
- Preparing for an RV service truck
- Before moving the RV
- Leaving Black Rock City
- Cleaning playa dust
- Fuel and propane refill
- Waste-tank emptying
- Final return inspection

Checklist state should persist locally.

Include a reset option for each checklist.

Do not sync checklist data to a server.

==================================================
15. BRANDING
==================================================

Create:

public/config/brand-config.json
public/assets/brand/

Use a configurable brand structure similar to:

{
  "appName": "RV Playa Assistant",
  "retailerName": "El Monte RV",
  "logoPath": "",
  "approvalStatus": "unofficial",
  "referenceLabel": "Based on supplied El Monte RV guest resources",
  "officialGuidesUrl": "https://www.elmonterv.com/guides"
}

Until an approved local logo is added:

- Display a clean text treatment.
- Display “Unofficial companion guide.”
- Do not imply endorsement.
- Do not scrape or hotlink a logo.
- Do not copy remote website assets.

Footer wording:

“Independent offline quick-reference tool based on supplied rental guides.
Your rental agreement, instructions provided at pickup, labels in the RV,
and directions from El Monte RV remain controlling.”

When approvalStatus becomes “approved,” support changing the status label
without rewriting the interface.

The external official-guides link may be shown as an optional online
resource, but the core app must not depend on it.

==================================================
16. VISUAL DESIGN
==================================================

Create a mobile-first, accessible interface.

General appearance:

- white or neutral background
- restrained red accent
- clear warning treatment
- strong legibility
- large buttons
- no decorative clutter
- no external fonts
- no external icon libraries
- no CDN dependencies

Use semantic HTML.

Support phone widths down to approximately 320px.

Support keyboard navigation and visible focus states.

Use proper labels and ARIA live regions for dynamic search and cache status.

Do not imitate El Monte’s website so closely that the app appears official.

==================================================
17. REPLIT STATIC DEPLOYMENT
==================================================

The final project will be imported into Replit.

Build it as a self-contained static Progressive Web App.

Put all deployable files inside:

public/

Do not create:

- a backend server
- a database
- environment variables
- secrets
- server-side rendering
- network-dependent runtime logic

The Replit Static Deployment public directory will be:

public

Include:

README.md
README_REPLIT.md
.gitignore

README_REPLIT.md must contain exact instructions for:

1. Importing from GitHub or ZIP into Replit
2. Previewing the app
3. Selecting Static Deployment
4. Setting the public directory to public
5. Publishing
6. Opening it on a phone
7. Preparing the offline cache
8. Adding it to the Home Screen
9. Testing in airplane mode
10. Republishing after updates

==================================================
18. PROJECT STRUCTURE
==================================================

Use a clear structure similar to:

rv-playa-assistant/
├── public/
│   ├── index.html
│   ├── manifest.webmanifest
│   ├── service-worker.js
│   ├── offline.html
│   ├── assets/
│   │   ├── brand/
│   │   ├── icons/
│   │   └── diagrams/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── app.js
│   │   ├── search.js
│   │   ├── storage.js
│   │   ├── offline.js
│   │   └── install.js
│   ├── data/
│   │   ├── answers.json
│   │   ├── checklists.json
│   │   └── synonyms.json
│   └── config/
│       └── brand-config.json
├── source_materials/
│   ├── El-Monte-Class-A-Guest-Guide.pdf
│   ├── Burning_Man_Rental_Guide_2026.pdf
│   └── Class_A_Walkthrough_Transcript.txt
├── tests/
├── README.md
├── README_REPLIT.md
└── .gitignore

Adjust only where technically beneficial.

Add source_materials/ to .gitignore.

Do not place the source documents inside public/.

==================================================
19. TESTS AND VALIDATION
==================================================

Add lightweight tests or validation scripts for:

- valid JSON data
- unique answer IDs
- required source citations
- valid risk levels
- no routine record with an unnecessary default escalation
- presence of Burning Man priority metadata
- all files in the offline asset list existing
- manifest validity
- service-worker asset paths
- search returning expected records for representative queries
- configuration filtering behavior
- graceful behavior when configuration is unknown
- app loading without network after caching

Create a small set of representative search tests, including:

- generator will not start
- smell propane
- dust storm
- no power
- empty black tank
- awning
- clean playa dust
- return checklist
- water heater
- 30 amp
- 50 amp
- frozen AC
- flat tire

Run all available tests before finishing.

==================================================
20. BUILD PHASES
==================================================

Work in this order:

Phase 1:
Inspect all three source files and create a concise source map containing:

- topic
- source
- page or transcript section
- Burning Man override status
- equipment-variation notes
- risk level
- whether escalation is actually required

Save this as a development-only file outside public, for example:

development/source-map.md

Phase 2:
Create and validate the structured knowledge base.

Phase 3:
Build the app interface and search.

Phase 4:
Implement optional My RV settings and local persistence.

Phase 5:
Implement service worker, cache verification, installation guidance, and
update behavior.

Phase 6:
Add checklists, branding configuration, accessibility, and documentation.

Phase 7:
Run validation and fix defects.

==================================================
21. COMPLETION REQUIREMENTS
==================================================

At completion:

- The app must open without requiring configuration.
- Broad Guidance must be the default.
- Burning Man advice must have priority.
- Routine answers must not show unnecessary On Road Care warnings.
- High-risk answers must clearly show emergency or escalation guidance.
- Search must work locally.
- Checklists must work locally.
- My RV settings must work locally.
- Cache verification must be real.
- The app must be ready for Replit Static Deployment.
- No runtime internet connection may be required for core use.
- No remote AI or API may be used.
- No unsupported claims may be added.
- All answers must identify their source.

After creating the project, provide a concise summary in the Cursor chat
containing:

- files created
- knowledge records created
- tests run
- any source conflicts that remain intentionally visible
- exact local preview command
- exact Replit import and deployment settings
- any items that require retailer confirmation at pickup