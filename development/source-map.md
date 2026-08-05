# Source Map — RV ASSistant Playa

Development-only file. Not deployed. Not inside `public/`.

Phase 1 deliverable required by `project_spec.md` §20.

This file records, for every planned knowledge topic: the source, the page or
transcript section, whether Burning Man guidance overrides ordinary RV guidance,
equipment-variation notes, the assigned risk level, and whether escalation to
On Road Care is *actually* required by a source.

---

## 1. Source inventory and citation scheme

| # | Priority | Document title (canonical) | Local file | Extent | Citation form |
|---|---|---|---|---|---|
| 1 | 1 (highest) | Burning Man 2026 RV Rental Guide | `source_materials/Burning_Man_Rental_Guide_2026.pdf` | 6 pages, dated Monday 27 July 2026 | `BM p.N — <Section heading>` |
| 2 | 2 | El Monte Class A Walkthrough Transcript | `source_materials/Class_A_Walkthrough_Transcript.txt` | 583 lines, continuous prose, no native headings | `WT §<Section name>` |
| 3 | 3 | El Monte RV Guest Guide — Class A | `source_materials/El-Monte-Class-A-Guest-Guide.pdf` | 40 pages, updated 13 May 2025, ©2025 | `GG p.N — <Heading / Table / Figure>` |

All three files were read in full. No file was unreadable, encrypted, or
image-only. Both PDFs yielded complete embedded text.

### 1.1 Page-number verification (Guest Guide)

The Guest Guide's printed footer page number matches the PDF page index 1:1
(PDF page 22 carries the footer `ELMONTERV.COM 22`). Cover, section dividers,
and back cover (PDF pages 1, 6, 7, 10, 16, 21, 40) carry no footer. **Citations
may therefore use the PDF page index directly with no offset.**

The Burning Man guide has no printed page numbers. Cite the PDF page index plus
the section heading, which is unambiguous on every page.

### 1.2 Guest Guide internal cross-reference defects

The Guest Guide's own figure and table cross-references are unreliable and must
**not** be copied into the knowledge base. Confirmed errors:

| Guide says | Actually is |
|---|---|
| "See TABLE 3" for 120-Volt power (Tables 7, 10) | Table 4 (Table 3 is Electrical Awning) |
| "See ROOF AIR CONDITIONER on page 31" (Table 12) | Page 27 |
| "See FURNACE on page 24" (Table 6) | Page 25 |
| "FIGURE 13: GENERATOR COMPARTMENT on page 24" | Figure 14 |
| "FIGURE 11: GFCI OUTLET on page 23" | Figure 12 |
| "FIGURE 6: PROPANE TANK on page 13" (p.29) | Figure 5 |
| "FIGURE 9: ELECTRIC HOOK UP on page 18" (p.17) | Figure 8 |
| "FIGURE 26/27/28/29" (p.32 body text) | Figures 23/24/25/26 |
| "See FIGURE 26: EMPTYING THE HOLDING TANK on page 31" (p.18) | Figure 23 |
| "Table 4: Eelctrical Awning" (index, p.39) | Typo; Table 3 |
| Index: "Hydraulic leveling system .... 15" | Page 17 |

**Rule for Phase 2:** cite the page where the content actually appears, verified
against the extracted text. Never propagate the guide's internal pointer.

### 1.3 Walkthrough transcript section scheme

The transcript has no headings, timestamps, or speaker labels. The following
section names are **assigned by this project** and are the citation keys for the
public knowledge base (`sources[].section`). Line numbers are a development-only
aid against the local copy.

| § | Section name | Lines |
|---|---|---|
| 1 | Welcome | 1–8 |
| 2 | Entry Door and Deadbolt | 9–19 |
| 3 | Exterior Storage Compartments | 20–30 |
| 4 | Furnace Vent (Exterior) | 31–36 |
| 5 | Rear Storage and Provided Equipment | 37–46 |
| 6 | Rearview Camera and Spotter | 47–54 |
| 7 | Rear Overhang and Turning | 55–63 |
| 8 | Fresh Water Fill and City Water | 64–78 |
| 9 | Dumping the Waste Tanks | 79–98 |
| 10 | Fuel Filler and Fueling Safety | 98–106 |
| 11 | 30-Amp Shore Power | 107–119 |
| 12 | Cable TV and Antenna | 120–128 |
| 13 | Water Heater (Exterior Vent) | 129–132 |
| 14 | Propane Tank and Valve | 133–144 |
| 15 | Generator | 145–162 |
| 16 | Slide-Out Operation | 163–178 |
| 17 | Driver Controls and Transmission | 179–191 |
| 18 | Parking Brake | 192–198 |
| 19 | Automatic Leveling System | 199–218 |
| 20 | Dash Switches | 219–238 |
| 21 | Hood Latch and Driving Controls | 239–245 |
| 22 | Height Sticker and Clearance | 246–249 |
| 23 | Glove Compartment Paperwork | 250–252 |
| 24 | Cab Charging Ports | 253–260 |
| 25 | Mirrors | 261–264 |
| 26 | Swivel Seats and Removable Table | 265–276 |
| 27 | Engine Oil Check | 277–296 |
| 28 | Coolant and Washer Fluid | 297–305 |
| 29 | Breaker Box and Fuses | 306–315 |
| 30 | House Battery Switch | 316–327 |
| 31 | Awning and Entry Step Switches | 328–347 |
| 32 | Solar Charger Panel | 348–353 |
| 33 | Dry Camping Battery Maintenance | 354–366 |
| 34 | Heat Vents | 367–371 |
| 35 | Fire Extinguisher | 372–375 |
| 36 | Main Control Board | 376–387 |
| 37 | Stovetop, Oven and Microwave | 388–406 |
| 38 | Fridge and Freezer | 407–420 |
| 39 | Shower and Toilet | 421–437 |
| 40 | Tankless Water Heater | 438–447 |
| 41 | GFI Outlet | 448–455 |
| 42 | Thermostats and Air Conditioning | 456–480 |
| 43 | Bunk Beds | 481–492 |
| 44 | Bedroom Lighting and Charging | 493–501 |
| 45 | Seat Belts and Child Seat Anchor | 502–511 |
| 46 | Cab-Over Bed | 512–523 |
| 47 | LPG and Carbon Monoxide Alarm | 524–541 |
| 48 | Dinette and Couch Bed Conversion | 542–553 |
| 49 | Smoke Alarm | 554–561 |
| 50 | Televisions | 562–571 |
| 51 | Window Blinds | 572–576 |
| 52 | Key Tag Resources | 577–583 |

---

## 2. Source priority — confirmation

**Burning Man guidance is assigned the highest priority (priority 1) and is
confirmed as such throughout this map.** Every topic row below carries an
explicit override status. The resolution rules are:

- `BM-OVERRIDE` — the Burning Man guide gives a rule that displaces the ordinary
  RV guidance while at Burning Man / in Black Rock City / on the playa. The
  Burning Man text is shown first and labelled.
- `BM-ADDS` — the Burning Man guide adds a constraint the other sources do not
  contradict. Both are shown; Burning Man first.
- `BM-SILENT` — the Burning Man guide says nothing. Fall through to the
  Walkthrough (priority 2), then the Guest Guide (priority 3).
- `BM-CONFLICT-INTERNAL` — the Burning Man guide contradicts *itself*. See §4.
- `SAFETY-EXCEPTION` — see §5. One dust-prevention rule in the Burning Man
  guide must not be applied to life-safety ventilation. **Requires sign-off.**

Count by status across the topic tables: 24 `BM-OVERRIDE`, 11 `BM-ADDS`,
1 `BM-CONFLICT-INTERNAL`, 4 `SAFETY-EXCEPTION`, remainder `BM-SILENT`.

---

## 3. Topic map

Legend — **Risk**: `routine` / `caution` / `emergency`.
**Escalation**: `YES` = a source explicitly directs the guest to contact On Road
Care, roadside assistance, or emergency services, or explicitly prohibits
self-repair. `NO` = no source requires it; the escalation object must be `null`
and the section hidden.

### 3.1 Safety systems and alarms

| Topic | Sources | BM status | Equipment variation | Risk | Escalation |
|---|---|---|---|---|---|
| Propane (LPG) smell inside RV | GG p.29 *Propane Appliances* CAUTION; GG p.32 *Propane Gas Detector*; WT §47 | BM-SILENT | Detector position "varies according to the make and model"; usually near floor (GG p.32) | emergency | **YES** — GG p.32 step 6 "Call our toll-free Roadside assistance number"; GG p.29 "If the problem persists, call On Road Care"; WT §47 "Contact OnRoad Care or emergency services right away" |
| LPG / carbon-monoxide alarm sounding | GG p.31 *Safety Systems*; GG p.32 *CO Detector* + Figure 25 label; GG p.33 item 5; WT §47 | SAFETY-EXCEPTION (ventilation) | Combined LPG/CO unit (Safe-T-Alert); position varies | emergency | **YES** — Figure 25 detector label "During Alarm: Move to Fresh Air; Call 911"; GG p.31/p.33 "If the problem persists, call On Road Care" |
| Nuisance alarm from sprays, perfume, dust | GG p.31; GG p.32; WT §47 | BM-ADDS — playa dust is an added trigger (GG p.31 "excessive dust in the sensor") | — | caution | NO — ventilate and avoid the product; escalate only if it persists (separate record) |
| Smoke alarm during cooking | GG p.32 *Smoke Detector*; WT §49 | SAFETY-EXCEPTION (ventilation) | Ceiling-mounted, replaceable 9 V battery | caution | NO |
| Smoke alarm chirping (low battery) | GG p.32 | BM-SILENT | 9 V battery; receipt reimbursed | routine | NO |
| Fire extinguisher — how to use | GG p.32 *Fire Extinguisher*; WT §35 | BM-SILENT | Located near entry step well (GG); near entry door (WT) | emergency | **YES** — GG p.33 item 6 "If you have had to use the fire extinguisher, call the On Road Care Team to report usage" |
| Never disable a detector | GG p.32 "Do not disconnect the smoke detector for the sake of convenience" | BM-SILENT | — | caution | NO — this is a `doNot`, not an escalation |
| Emergency exit window | GG p.32 *Emergency Exit* | BM-SILENT | Marked EXIT on one rear window | caution | NO |

### 3.2 Power and electrical

| Topic | Sources | BM status | Equipment variation | Risk | Escalation |
|---|---|---|---|---|---|
| Coach battery charging schedule | **BM p.1 *Power Management***; WT §33; GG p.25 *Dry Camping* | **BM-OVERRIDE** — see §4.1 | 12 V fridge needs more frequent charging (BM p.1) | routine | NO |
| Coach battery switch must stay ON | BM p.1 "MUST always be 'ON'"; WT §30; GG p.26 *Main Battery Switch* | BM-ADDS | Switch at entry step, left side | routine | NO |
| Low coach battery / no 12 V power | GG p.34 Table 2; GG p.22 *Battery Level* | BM-ADDS (charging schedule) | Monitor panel L/F/G/C readout | routine | NO |
| Coach battery charge time | GG p.22 (">4 hours"); GG p.26 ("up to four hours to 80%, full charge twice that") | BM-SILENT | — | routine | NO |
| Generator — startup | GG p.24–25 *Operating the Generator*; WT §36; WT §15 | BM-ADDS | Start from monitor panel **or** local switch on generator **or** emergency pull-start handle (GG Figure 14) | routine | NO |
| Generator — prime procedure after 24 h idle | GG p.25 item 6 | BM-SILENT | Do not prime twice | routine | NO |
| Generator will not crank | GG p.35 Table 5 "Low coach battery — Start RV engine then start generator" | BM-SILENT | — | routine | NO |
| Generator cranks but will not start | GG p.35 Table 5 "Not enough RV fuel — tank needs to be more than 1/4 full"; WT §15; BM p.1 | BM-ADDS (BM confirms ¼-tank auto shutoff) | — | routine | NO |
| Generator starts then stops on switch release | GG p.35 Table 5 "Low oil level" | BM-SILENT | — | caution | NO |
| Generator breaker tripped | GG p.35 Table 5; GG Figure 14 (two 30 A AC circuit breakers); BM p.1 | **BM-OVERRIDE** — BM p.1 "Only run one A/C unit at a time to avoid tripping the generator breaker" | Generator has its own breakers separate from the coach breaker box | routine | NO |
| Generator runs then surges | GG p.35 Table 5 — allow 3–4 min warm-up | BM-SILENT | — | routine | NO |
| Generator oil check | BM p.1 ("After 8 hours … check oil level"); GG p.24 *Generator Checks*; WT §15 | BM-ADDS | Add ¼ qt at a time (GG p.24) — note engine takes 0.5 qt at a time (GG p.13) | caution | NO — but GG p.24 "Guests will be responsible for any damage caused by low oil levels" |
| Generator fuel consumption / run hours | BM p.1 (~1 gal/h, 25–40 h available); GG p.24 (~1 gal/h) | BM-ADDS | Shares the engine fuel tank | routine | NO |
| Generator quiet hours / etiquette | BM p.1 ("use sparingly out of consideration for your neighbors"); GG p.20 *Campsite Etiquette*; GG p.24; WT §33 | BM-ADDS | — | routine | NO |
| Generator — do not run in a dust storm | **BM p.4 *Tips from Fellow Burning Man Travelers*** | **BM-OVERRIDE** | Applies to engine as well | caution | NO |
| Shore power hook-up | GG p.17 *Electrical Hook Up* + Figure 8; WT §11 | BM-ADDS — BM p.1 "Make sure that all appliances and the generator are off before you connect to external power" | **30 A vs 50 A — see §4.4** | routine | NO |
| Damage from external power at Burning Man | **BM p.1** "You may be held fully responsible for damage … repair services will not be available" | **BM-OVERRIDE** | — | caution | NO |
| No 120 V power while plugged in | GG p.35 Table 4 | BM-SILENT | Check RV breakers, pole breaker, cord seating | routine | NO |
| Breaker reset | GG p.24 *Breaker/Fuse Box* + Figure 13; GG p.35 Table 4; WT §29 | BM-SILENT | Box "usually located in the rear sleeping area or on the bed frame" (GG); "near the rear bed" (WT) | routine | NO |
| Tripped breaker identification | WT §29 "will usually sit in the middle position" | BM-SILENT | — | routine | NO |
| GFCI / GFI outlet reset | GG p.23 *Outlets* + Figure 12; GG p.35 Table 4; WT §41 | BM-SILENT | "The GFCI button requiring reset may be located on an alternate outlet" — bathroom, galley, or exterior | routine | NO |
| Fuse replacement | GG p.24 TIP; WT §29 | BM-SILENT | Match amperage/colour; receipts reimbursed | routine | NO |
| 120 V vs 12 V — what runs on what | GG p.23 *Electrical Systems*; GG p.26 *12-Volt System*; WT §37 | BM-SILENT | Three systems: 120 V, engine 12 V, coach 12 V | routine | NO |
| Solar panels | GG p.27 *Solar Panels*; GG p.36 Table 8; WT §32 | BM-SILENT | "**Some** El Monte RVs are equipped with solar panels" | routine | NO |
| Battery boost / emergency starter | GG p.12 *Emergency Starter* + Figure 4; WT §20 | BM-SILENT | Dash switch; called "battery boost" in WT, "emergency starter" in GG | caution | NO |
| Microwave will not operate | GG p.36 Table 10; GG p.26; WT §37 | BM-SILENT | Give generator 20–30 s after start (WT); GG says 3–4 min warm-up before *any* appliance | routine | NO |
| Charging schedule vs dust storm conflict | BM p.1 + BM p.4 | **BM-CONFLICT (operational)** — see §4.9 | — | caution | NO |

### 3.3 Climate control

| Topic | Sources | BM status | Equipment variation | Risk | Escalation |
|---|---|---|---|---|---|
| Air conditioning — Burning Man settings | **BM p.1 *Power Management*** — set thermostat to 79 °F, close all windows/roof vents/blinds/curtains/shades, limit entry-door use | **BM-OVERRIDE** | — | routine | NO |
| Only one A/C at a time on generator | **BM p.1** | **BM-OVERRIDE** — displaces GG p.27 dual-A/C staging | 1 vs 2 roof units | routine | NO |
| Running two roof A/C units (shore power) | GG p.27 TIP (staged start, "Both A/C should not run at full power at the same time"); WT §42 (front + bedroom thermostats) | BM-OVERRIDE at Burning Man | **1 vs 2 units — see §6.3** | routine | NO |
| A/C cooling limit | BM p.1 (max 20 °F below outside); GG p.5 (~20 °F / 11 °C); WT §42 (15–20 °F) | BM-ADDS | — | routine | NO |
| A/C will not run | GG p.37 Table 12; GG p.27 | BM-SILENT | **GG p.17 TIP vs GG p.37 Table 12 amp conflict — see §4.4** | routine | NO |
| Frozen A/C coils | GG p.37 Table 12 ("turn off, 45–60 minutes to thaw"); BM p.1 ("If you have the A/C set too low, it will 'freeze'"); WT §42 ("turn it off, let it defrost, try again later") | BM-ADDS (prevention: 79 °F) | — | routine | NO |
| A/C condensation dripping | GG p.8 TIP; GG p.27 TIP; GG p.37 Table 12 | BM-SILENT | — | routine | NO |
| Thermostat operation | GG p.25 *Furnace* + Figure 15; GG p.27 *Roof Air Conditioner*; WT §42 | BM-SILENT | 1 vs 2 thermostats; heat-pump setting present on some ("Do not run the 'heat pump' setting while operating the furnace", GG p.25); GG says MODE ×5 from OFF, WT says press MODE until it reads cool/furnace | routine | NO |
| Furnace operation | GG p.25 *Furnace*; WT §34 | BM-SILENT | Propane furnace; leave fan on AUTO | routine | NO |
| Furnace blows cold air only | GG p.35 Table 6 | BM-SILENT | Includes air-purge procedure via stove burner | routine | NO |
| Furnace exterior vent is extremely hot | GG p.25 CAUTION; WT §4 | BM-SILENT | Low on the side of the RV | caution | NO |

### 3.4 Water, waste and sanitation

| Topic | Sources | BM status | Equipment variation | Risk | Escalation |
|---|---|---|---|---|---|
| Water conservation at Burning Man | **BM p.2 *Freshwater Use*** — spray bottle + rag for dishes, food waste to trash not the drain, short showers, baby wipes, pump off when not in use, use BM portable toilets as often as possible | **BM-OVERRIDE** | — | routine | NO |
| Never leave the bathroom while the toilet is running | **BM p.2** "this can prevent a complete water loss" | **BM-OVERRIDE** | — | caution | NO |
| Fresh water refill at Burning Man | **BM p.2** — potable water trucks, vendor Meco Reno; RV servicing trucks do **not** include potable water refills | **BM-OVERRIDE** | Tank full at pickup | routine | NO |
| Fresh water tank fill (general) | GG p.18 *Fresh Water Tank Fill* + Figure 9; WT §8 | BM-OVERRIDE at playa | Gravity fill port; overflow signals full | routine | NO |
| City water connection | GG p.18 *Campsite/City Water Hook Up*; WT §8 | BM-SILENT (not available in BRC) | Pressure regulator required (WT §5, §8) | routine | NO |
| Do not run the water pump on city water | GG p.18 TIP | BM-SILENT | — | routine | NO |
| Black tank flush port — do not use | WT §8 ("Do not use this. It's easy to overfill the black tank and flood the inside of the RV"); GG p.18 CAUTION ("Never connect the water hose to the black tank flush attachment") | BM-SILENT | Third port beside gravity fill and city water | caution | NO |
| Water pump switch | GG p.22 *Water Pump Switch*; GG p.37 Table 13; WT §36 | BM-ADDS (turn off when not in use) | Switch on monitor panel | routine | NO |
| Never run the pump dry | GG p.18 CAUTION; GG p.22 CAUTION ("may render the system inoperable") | BM-SILENT | — | caution | NO |
| No fresh water at the taps | GG p.37 Table 13 | BM-SILENT | — | routine | NO |
| No water after refilling a run-dry tank (air in lines) | GG p.37 Table 13 "Contact On Road Care" | BM-SILENT | — | caution | **YES** — source explicitly directs contact |
| Shower head water saver | GG p.30 *Shower Head* + Figures 20, 21; WT §39 | BM-ADDS (short showers) | **Style 1 push button vs Style 2 rotating lever** | routine | NO |
| Toilet operation | GG p.30 *Toilet* + Figure 22; WT §39 | BM-ADDS | Foot pedal; halfway to fill bowl, full to flush | routine | NO |
| Toilet paper | **BM p.2 "Always use one-ply toilet paper to avoid clogs"**; WT §39 ("one or two-ply … labeled safe for RV use"); GG p.30 ("Only use RV toilet paper") | **BM-OVERRIDE** — see §4.5 | — | routine | NO |
| Toilet chemical after emptying | GG p.30 (pod + ~3 gal / 10 L water); GG p.31 step 10; WT §39 (pack + 15-second flush) | BM-SILENT — **conflict, see §4.6** | — | routine | NO |
| Black and grey tank overview | GG p.30 *Waste Water Systems* | BM-SILENT | "Some vehicles might have two black water handles" (GG p.31) | routine | NO |
| Dumping the tanks (general procedure) | GG p.31 *Draining the Waste Tanks* + Figure 23; WT §9 | **BM-OVERRIDE** — no dump stations in BRC | Black first, then grey, in both sources; GG adds a fresh-water black-tank rinse that WT omits | routine | NO |
| Waste service at Burning Man | **BM p.2 *Black & Grey Water*** — no dump stations in BRC, dumping on the playa strictly prohibited, BLM will cite violators; look for trucks marked "RV servicing"; United Site Services is the only vendor authorized to accept cash | **BM-OVERRIDE** | — | caution | NO |
| Never dump on the playa | **BM p.2** | **BM-OVERRIDE** | — | caution | NO — but a hard `doNot` |
| RV service truck access | **BM p.2 *Access for Service Trucks*** — hoses cannot reach beyond 30 feet | **BM-OVERRIDE** | — | routine | NO |
| Tank sensor inaccuracy | GG p.22 *Monitor Panel* + CAUTION; WT §9; WT §36 | BM-SILENT | Monitor panel look/features "can vary by model and year" (GG p.22) | routine | NO |
| Clogged sink, shower or toilet | GG p.36 Table 11 "Do not use caustic chemicals to unclog drains. Contact On Road Care"; GG p.22 CAUTION; GG p.30 CAUTION | BM-SILENT | — | caution | **YES** — source explicitly directs contact and prohibits self-treatment |
| Waste and freshwater leaks | **BM p.2** "You are responsible for preventing and addressing any leaks"; GG p.13 *Engine Compartment* ("If the RV is leaking any fluid please call On Road Care"); GG p.18 (check both hose ends); GG p.20 item 3 | BM-ADDS | Vehicle-fluid leak and water leak are different records | caution | **YES for vehicle-fluid leaks** (GG p.13). NO for a hose-connection water drip that the guest can reseat |
| Water heater — variants | WT §40 (**tankless**, on-demand, preset temperature); GG p.25 *Water Heater* (**tank-style**, propane, 15–20 min); GG p.22 item 1 ("Some water heaters can be operated two ways: electrically or by using propane gas") | BM-SILENT | **Three variants — see §6.4** | routine | NO |
| No hot water | GG p.36 Table 7 | BM-SILENT | Separate electric and gas fault paths | routine | NO |
| Water heater DSI/FLT light on | GG p.25 item 3; GG p.36 Table 7 — cycle off/on, attempt twice | BM-SILENT | — | caution | NO |
| Water heater relief valve dripping | GG p.36 Table 7 "A few drips are part of normal operation" | BM-SILENT | — | routine | NO |
| Water heater exterior vent is hot | WT §13 | BM-SILENT | Live flame behind the cover | caution | NO |

### 3.5 Slide, leveling, awning, exterior

| Topic | Sources | BM status | Equipment variation | Risk | Escalation |
|---|---|---|---|---|---|
| Slide-out operation | GG p.23 *Slide Operation*; WT §16 | BM-SILENT | **Driver seat "full upright" (WT) vs "tip all the way forward" (GG) — see §4.7.** WT: run engine ~10 s first. Both: defer to the instruction sticker at the switch | caution | NO |
| Slide must be fully in or fully out | GG p.23 | BM-SILENT | — | caution | NO |
| Never drive with the slide out | GG p.23 CAUTION | BM-SILENT | — | caution | NO |
| RV must be level before operating the slide | GG p.23 CAUTION ("can cause mechanical damages") | BM-SILENT | — | caution | NO |
| Slide jams or stops partway | GG p.37 Table 14 — obstruction / low power / motors out of sync paths | BM-SILENT | — | caution | NO for the obstruction, low-power and desync paths |
| Slide — faulty motor control | GG p.37 Table 14 "Do not operate the slide again unless you have contacted Road care" | BM-SILENT | — | caution | **YES** — explicit prohibition on continued operation |
| Slide — RV not level / further difficulty | GG p.37 Table 14 "Contact On Road Care if you experience further difficultes" *(sic)* | BM-SILENT | — | caution | **YES** |
| Slide stuck in an unsafe position | GG p.37 Table 14 (faulty motor control path); GG p.23 CAUTION | BM-SILENT | — | emergency | **YES** |
| Leveling system operation | **BM p.2 *Leveling System***; GG p.17 *Hydraulic Leveling System* + Figure 7; WT §19 | **BM-OVERRIDE** | LCI electronic panel (GG) vs jack control panel (WT); leveling ramps also supplied (WT §5). **GG requires retracting slide-outs first; WT does not mention it** | caution | NO |
| Never lift the wheels off the ground | **BM p.2** "Always level on solid, near-level ground using the auto-leveling feature only — never lift the wheels off the ground!" | **BM-OVERRIDE** | — | caution | NO |
| Retract jacks if rain softens the playa | **BM p.2** "retract the jacks immediately to prevent them from sinking and getting stuck. Recovery costs for a stuck vehicle are also the renter's responsibility" | **BM-OVERRIDE** | — | caution | NO |
| Do not use jacks for tire removal or service | GG p.17 Figure 7 panel text | BM-SILENT | — | caution | NO |
| Confirm jacks fully retracted before driving | WT §19 ("don't rely on that alone — always step outside"); GG p.17 | BM-SILENT | — | caution | NO |
| Awning at Burning Man | **BM p.4** "Never open or use the awning … Wrap the ends with shrink-wrap to keep dust out" vs **BM p.2** "$50 for the Awning Usage … always retract the awning when not in use" | **BM-CONFLICT-INTERNAL — see §4.2** | "**If** your RV is equipped with an awning" (BM p.2) | caution | NO |
| Awning general operation | GG p.19 *Electric Awning* + Figure 10; WT §31 | BM-OVERRIDE | Engine off and key removed (GG); "in some models the awning arm is close to the entry door" — close the door first, use a spotter (WT) | caution | NO |
| Awning — never leave unattended or out in wind/rain | GG p.19 CAUTION ×2 ("Damages to unrolled awnings are always considered the customers fault"); WT §31 | BM-ADDS (high winds common in BRC, BM p.2) | Sunshade only, not for rain or snow (WT) | caution | NO |
| Awning does not move | GG p.34 Table 3 — safety interlock, no power, weak battery, blown fuse | BM-SILENT | — | routine | NO |
| Exterior storage compartments | WT §3; GG p.20 TIP ("not water or dustproof") | **BM-ADDS** — BM p.4 "Keep all exterior compartment doors closed"; BM p.4 cleaning scope includes outer storage compartments | Single silver key fits all compartments (WT) | routine | NO |
| Entry step (entrance switch) | WT §31 — switch must stay OFF so the step auto-retracts; "if the switch is on, the step stays out, and that can lead to damage" | BM-SILENT | — | caution | NO |
| Entry door and deadbolt | WT §2; GG p.8 TIP; GG p.17 CAUTION (handle only locks/unlocks with the key from outside) | BM-ADDS — BM p.1 "Limit the opening and closing of the entry door"; BM p.4 "Only open the entry door when entering or exiting" | P-shaped key for the deadbolt (WT) | routine | NO |
| Coach windows, roof vents and blinds | GG p.32 *Coach Window Operation*; GG p.8 CAUTION; WT §51 | **BM-OVERRIDE** — BM p.1 close all windows/roof vents/blinds/curtains/shades; BM p.4 "Keep windows and roof vents closed at all times". **SAFETY-EXCEPTION applies — see §5** | Emergency-exit window is separate | routine | NO |
| Window screens | **BM p.4** "Cover window screens — Playa dust is nearly impossible to remove from them" | **BM-OVERRIDE** | — | routine | NO |

### 3.6 Engine, driving, fuel and propane

| Topic | Sources | BM status | Equipment variation | Risk | Escalation |
|---|---|---|---|---|---|
| Fuel type | WT §10 ("gasoline only. Never use diesel. Minimum 87 octane unleaded"); GG p.9 *Fueling the RV* (gasoline engine, ~80 gal / 302 L) | BM-SILENT | — | caution | NO |
| Incorrect fuel added | GG p.9 CAUTION ("DO NOT START THE ENGINE. DO NOT DRIVE THE RV"); GG p.33 item 1 ("STOP. Do not start or drive the RV. Call the On Road Care Team") | BM-SILENT | — | emergency | **YES** |
| Fueling safety procedure | GG p.12 *Fueling the RV* (engine off, parking brake, battery disconnect OFF, close propane valve; reverse after); WT §10 (house battery switch and generator off); WT §30 | BM-SILENT | — | caution | NO |
| Fuel cap not tight | WT §10; GG p.9 CAUTION; GG p.15 *Check Fuel Cap* | BM-SILENT | — | routine | NO |
| Fuel level for the generator | WT §15; GG p.24; BM p.1 | BM-ADDS | Auto shutoff at ¼ tank | routine | NO |
| Fuel and propane return levels | **BM p.5 *Fuel & Propane Refueling*** — gasoline $10.00/gal refuelling fee, "fill up close to the return location (not 15 miles away)"; propane must also be refilled before return, $6.50/gal; GG p.12 *Fuel Reminder*; GG p.34 items 5–6 | **BM-OVERRIDE** (adds the fee schedule and the fill-close-by instruction) | — | routine | NO |
| Propane tank and valve | GG p.12 *Propane Tank* + Figure 5; GG p.29 *Propane Appliances*; WT §14 | BM-SILENT | Capacity displayed on the tank (GG p.12) | routine | NO |
| Safe to drive with propane ON | GG p.12; GG p.29; WT §14 | BM-SILENT | Close the valve for ferries and refuelling; some tunnels prohibit propane entirely (WT §14) | routine | NO |
| Propane refill locations | GG p.12; WT §14 | BM-ADDS (must be refilled before return) | Some service stations, some U-Haul, some campgrounds | routine | NO |
| Never repair the propane system | Derived hard rule; no source authorizes guest repair. GG p.32 and WT §47 both stop at shut-off-and-ventilate | BM-SILENT | — | emergency | **YES** (as part of the propane-smell record) |
| Engine oil check | GG p.13 *Oil*; WT §27 | BM-SILENT | Round yellow dipstick; second rectangular dipstick is transmission fluid — not checked by the guest (WT §27) | routine | NO |
| Engine oil top-up amount | GG p.13 ("Only add 0.5 quart/liter, then check again") | BM-SILENT | Viscosity printed on the oil cap | routine | NO |
| Oil change due (7,500 mi) | GG p.13 "contact On Road Care for further instructions" | BM-SILENT | — | routine | **YES** (administrative, not a safety escalation — surface as a contact prompt, not an emergency banner) |
| Coolant and washer fluid | GG p.13 *Engine Compartment*; WT §28 | BM-SILENT | Top up coolant only when the engine is completely cool (WT §28) | routine | NO |
| Fluid leak under the RV | GG p.13 "If the RV is leaking any fluid please call On Road Care"; GG p.20 item 3 | BM-SILENT | — | caution | **YES** |
| Flat tire | GG p.13 *Tires*; GG p.19 *Tires*; GG p.33 item 2 — "please do not attempt to change the tire yourself. Park in a safe place and call On Road Care. Advise which tire is flat, your unit number and location" | BM-SILENT | Spare wheel is carried (WT §5) but the guest may not fit it | emergency | **YES** |
| Collision or accident | GG p.33 *Automobile Accident* — 911 if injured; do not move the person or the RV; hazards on; contact within 24 hours; Collision Report in the glovebox | BM-SILENT | — | emergency | **YES** |
| Breakdown / inoperable RV | GG p.33 *Emergency – Breakdown* — move off the road if possible, call On Road Care, never abandon the RV | BM-SILENT | — | emergency | **YES** |
| Brake system warning light | GG p.11 CAUTION — "Contact the On Road Care team if the brake system warning light is illuminated after the parking brake is released" | BM-SILENT | — | emergency | **YES** |
| Engine oil-pressure warning | GG p.15 — stop as soon as safe, switch off, check the dipstick; "If the oil level is correct and the light stays on, contact the On Road Care Team" | BM-SILENT | — | emergency | **YES** |
| Engine coolant temperature warning | GG p.15 — stop as soon as safe, switch off, let it cool, "inform the On Road Care Team" | BM-SILENT | — | emergency | **YES** |
| Red warning icon or gauge in the red | GG p.15 *Lights & Chimes* intro — "stop as soon as it is safe … If the warning lights remain on, contact On Road Care Team immediately" | BM-SILENT | — | emergency | **YES** |
| "Requires registered technician" icon | GG p.15 — "park the vehicle safely and call the On Road Care team immediately" | BM-SILENT | — | emergency | **YES** |
| Airbag readiness light | GG p.15 — "contact call the On Road Care Team immediately" *(sic)* | BM-SILENT | — | emergency | **YES** |
| Electronic throttle control / limp-home | GG p.15 — "Pull over when it is safe to do so and report the fault to On Road Care Team" | BM-SILENT | — | caution | **YES** |
| Service engine soon (solid) | GG p.15 — "Please notify the On Road Care Team" | BM-SILENT | — | caution | **YES** |
| ABS warning light | GG p.15 — brakes still work, safe to drive, check at earliest convenience | BM-SILENT | — | caution | NO |
| Low tire pressure warning | GG p.15 | BM-SILENT | — | caution | NO |
| Charging system light | GG p.15 "Illuminates when the battery is not charging properly" | BM-SILENT | — | caution | NO |
| Low fuel light | GG p.15 — refuel before ¼ tank | BM-ADDS (generator cuts out at ¼) | — | routine | NO |
| Roof / overhead strike | GG p.11 *Clearances* — "In the event you damage the roof, call On Road Care Team immediately" | BM-SILENT | — | emergency | **YES** |
| Driving clearance and height | GG p.11 (at least 13 ft required); WT §22 (height sticker on the windshield) | BM-SILENT | Roof A/C, solar panels and vents add height | caution | NO |
| Backing up and spotter use | GG p.8 *Driver Set Up*; GG p.11 *Parking & Backing Up*; GG p.17 item 3; GG p.20 item 12; WT §6 | BM-SILENT | Backup camera present (WT §6) but GG says use a spotter "even if the RV is equipped with a backup camera" | caution | NO |
| Tail swing / overhang | GG p.8 item 4; GG p.11 *Steering*; WT §7 | BM-SILENT | — | caution | NO |
| Tow/haul | GG p.13 *Tow/Haul* + Figure 6; WT §17 | BM-SILENT | — | routine | NO |
| Parking brake | GG p.9 Figure 3; WT §18 | BM-SILENT | Foot pedal left of the brake; release lever above it (WT) | routine | NO |
| Repairs over $100 need authorization | GG p.33 *Repairs*; GG p.13 TIP | BM-SILENT | Maintaining fluid levels needs no authorization | routine | **YES** (administrative) |
| Prohibited use — hazardous conditions and unpaved roads | **BM p.3 *Terms and Conditions Reminder*** quoting rental agreement §6(e) and §6(p); "As a result, all repairs are the Guest's responsibility" | **BM-OVERRIDE** | — | caution | NO |
| No credits for equipment failure at Burning Man | **BM p.3** | **BM-OVERRIDE** | — | routine | NO |

### 3.7 Interior systems and living

| Topic | Sources | BM status | Equipment variation | Risk | Escalation |
|---|---|---|---|---|---|
| Refrigerator — Burning Man setting | **BM p.1** "may run on propane or 12V. The refrigerator running on propane should be set to PROPANE"; 12 V units need more frequent charging; take a cooler/ice chest; limit door openings | **BM-OVERRIDE** | **Propane-absorption vs 12 V compressor — see §6.5** | routine | NO |
| Refrigerator temperature setting | GG p.28 (SET TEMP; slide clip 1 COLD – 9 COLDEST); GG p.36 Table 9 ("3 or COLD" for the fridge, middle for the freezer); WT §38 ("set the dial to the middle"); GG p.25 ("Avoid setting the fridge to maximum cooling") | BM-SILENT — **conflict, see §4.8** | Digital SET TEMP vs slide clip vs dial | routine | NO |
| Refrigerator cool-down time | GG p.28 ("up to 6 hours") | BM-SILENT | — | routine | NO |
| Refrigerator airflow and loading | GG p.28; WT §38 | BM-SILENT | Do not line shelves with paper | routine | NO |
| Refrigerator will not cool | GG p.36 Table 9 | BM-SILENT | — | routine | NO |
| Refrigerator — frozen air circulation chamber | GG p.36 Table 9 "Contact On Road Care" | BM-SILENT | — | caution | **YES** |
| Fridge needs the RV level | GG p.28 item 4 | BM-SILENT | — | routine | NO |
| Stovetop lighting | GG p.29 *Stovetop* + Figure 19 (lighter or match); GG p.29 TIP (auto-igniter push-and-turn); WT §37 (igniter knob) | BM-SILENT | **Three ignition variants** | caution | NO |
| Stovetop ventilation | GG p.29 "Ventilation is necessary when operating the stovetop"; WT §49 | **SAFETY-EXCEPTION — see §5** | — | caution | NO |
| Glass stove cover | GG p.29 CAUTION — lift before use, do not close until cool | BM-SILENT | "If applicable to the RV" | caution | NO |
| Never use the stove or oven for heating | GG p.32 | BM-SILENT | — | caution | NO |
| Never operate the stove or oven while driving | GG p.32 | BM-SILENT | — | caution | NO |
| Oven | WT §37 ("If your RV has an oven, it also uses propane and starts with a pilot light") | BM-SILENT | **Oven present or absent** | caution | NO |
| Monitor / control panel | GG p.22 *Monitor Panel* + Figure 11; WT §36 | BM-SILENT | "Look and features of monitor panels can vary by model and year" (GG p.22); Arctic Pac / tank heater "is not installed" | routine | NO |
| Dinette into bed | GG p.19 *Making Dinette Into Bed* (U-shaped); WT §48 (bench dinette + couch) | BM-SILENT | **U-shaped vs bench dinette**; couch converts too (WT) | routine | NO |
| Drop-down / cab-over bed | GG p.19 *Drop-Down Bed* (up/down switch near the entry door); WT §46 (key-operated switch panel, ladder stored in an exterior compartment) | BM-SILENT | **Electric drop-down vs key-switch cab-over** | caution | NO |
| Bunk beds | WT §43 ("In the hallway of your FR3") | BM-SILENT | Model-specific — FR3 only | routine | NO |
| Televisions | GG p.19 *Television* (no technical support, rescan at each location); WT §12; WT §50 (four flat-screens, HDMI/USB) | BM-SILENT | Count varies | routine | NO |
| Seat belts and child seats | GG p.11 *Seats & Seat Belts*; WT §45 | BM-SILENT | Tether anchor behind the forward-facing dinette bench (WT) | caution | NO |
| Swivel seats and removable table | WT §26 | BM-SILENT | — | routine | NO |
| Smoking prohibited | GG p.8 — minimum $250 cleaning charge | BM-SILENT | — | routine | NO |
| Pets | GG p.8 — extra cleaning charges | BM-SILENT | — | routine | NO |
| Keys | GG p.8 *Keys* + Figure 1; WT §2; WT §3; WT §52 | BM-SILENT | Ignition/lock box, outside storage bin, coach door, engine compartment; single silver key for compartments (WT) | routine | NO |

### 3.8 Playa, dust and Burning Man logistics

| Topic | Sources | BM status | Equipment variation | Risk | Escalation |
|---|---|---|---|---|---|
| Dust storm procedure | **BM p.4** — "Do not run the generator or engine during a dust storm. Dust can clog the air filter and damage the engine or generator." Supporting dust measures from the same page (windows/vents closed, entry door use limited, screens covered, compartments closed) | **BM-OVERRIDE** | — | caution | NO |
| Playa dust prevention | **BM p.4 *Cleaning and Waste Disposal* + *Tips from Fellow Burning Man Travelers*** — cover interiors with sheets, thick brown paper on the floor secured with BLUE painter's tape only, windows and roof vents closed at all times, cover screens, never open the awning, shrink-wrap the awning ends, exterior compartments closed | **BM-OVERRIDE** | — | routine | NO |
| Playa dust cleaning method | **BM p.4** — "do not use standard cleaning products or water inside the RV, as this will only smear the dust and create mud. Instead, we recommend using a vinegar wash" | **BM-OVERRIDE** | — | routine | NO |
| Cleaning-fee prevention | **BM p.4** — $500 minimum if not returned in the same clean condition, inside and out, including awning, outer storage compartments, undercarriage and generator; significantly higher for excessively dirty; $2,000 minimum if completely uncleaned unless $1,500 was prepaid; "NO EXCEPTIONS — NO DISCUSSIONS" | **BM-OVERRIDE** | — | routine | NO |
| Optional prepaid cleaning | **BM p.4** — $1,500, covers interior, engine, generator and A/C dust removal; does **not** include trash removal | **BM-OVERRIDE** | — | routine | NO |
| Trash disposal | **BM p.4 *Trash Disposal*** — dispose during the return trip, 24-hour facilities along the route; "Do not bring your trash to the return branch — substantial disposal fees will apply"; **BM p.5 *Leave No Trace*** | **BM-OVERRIDE** | — | routine | NO |
| Leave No Trace | **BM p.2** and **BM p.5** — pack it in, pack it out, clean as you go, large trash bags, separate recyclables, leave nothing at BRC | **BM-OVERRIDE** | — | routine | NO |
| Stickers and tape prohibition | **BM p.3** — no decorations unless easily removable, like painter's tape; additional cleaning or repainting fees apply; **BM p.4** — BLUE painter's tape only, "do not use any other kind of tape!" | **BM-OVERRIDE** | — | routine | NO |
| Burning Man surcharge | **BM p.3** — $1,000 non-refundable | **BM-OVERRIDE** | — | routine | NO |
| Awning usage fee | **BM p.2** — $50 unless a package including Awning Usage was prepurchased | **BM-OVERRIDE** | Only if the RV has an awning | routine | NO |
| Return timing | **BM p.5 *Vehicle Return*** — within the 30-minute slot selected at Self Check-in; late returns charged the price difference plus $50/hour; unauthorized extensions billed at double the nightly rate; do not leave the vehicle outside the rental lot; **GG p.34** — branches open 8:00–11:00 am | **BM-OVERRIDE** — see §4.10 | — | routine | NO |
| Support at Burning Man is limited | **BM p.3 *Support & Resources*** — "our team cannot provide on-site service within Black Rock City"; the On Road Care number is on the key tag; support is "limited to operational guidance only"; in-person appointments at 130 Woodland Ave, Reno, NV 89523 | **BM-OVERRIDE** | — | caution | Modifies **every** escalation record — see §7 |
| Items left behind | **BM p.5** — treated as abandoned and disposed of immediately | **BM-OVERRIDE** | — | routine | NO |
| Pre-return cleaning | **BM p.4**; GG p.34 *Pre-Drop-Off Requirements* (broom-clean floor, no mopping required, dishes washed, tanks drained, garbage removed, fuel and propane to pickup level) | **BM-OVERRIDE** for the dust method; GG for the ordinary checklist | — | routine | NO |

### 3.9 Checklists (spec §14)

| Checklist | Source coverage | Gap |
|---|---|---|
| Pickup inspection | GG p.8 *Walk Around Tour*, *Keys*, *Secure the Coach for Travel*; WT §5 provided-equipment inventory | **Partial.** No source contains a formal pickup inspection list. Must be assembled line-by-line from cited items only |
| Arriving at Burning Man | BM p.1 (power, A/C at 79 °F, close-up), BM p.2 (leveling, water, service-truck access), BM p.4 (dust prep) | **Partial/derived.** Every line must cite a specific BM page |
| Daily morning check | BM p.1 (charging), GG p.24 (generator oil per 8 h), GG p.22 (tank/battery levels), GG p.13 (oil check "in the morning before driving") | **Derived.** No source defines a daily check |
| Daily evening check | BM p.1 ("especially before going to sleep"), GG p.22 | **Derived** |
| Before running the generator | GG p.24–25, BM p.1, BM p.4 (not during a dust storm) | Good |
| Dust storm procedure | **BM p.4 — a single sentence** | **MAJOR GAP — see §8.1** |
| Preparing for an RV service truck | BM p.2 (30-foot hose reach, check truck signage, United Site Services cash) | Thin but sourced |
| Before moving the RV | GG p.8 *Secure the Coach for Travel* (15 items); GG p.20 outside/inside lists; WT §19 (confirm jacks up); WT §31 (confirm the step retracted) | Good |
| Leaving Black Rock City | BM p.4 (trash), BM p.5 (fuel, propane, return timing), GG p.20 | Good |
| Cleaning playa dust | BM p.4 (vinegar wash, no water inside) | Good |
| Fuel and propane refill | GG p.12, BM p.5, WT §10 | Good |
| Waste-tank emptying | GG p.31, WT §9; BM p.2 for the playa variant | Good |
| Final return inspection | GG p.34, BM p.4, BM p.5 | Good |

---

## 4. Source conflicts

Every conflict below must remain **visible** in the app, labelled by source, not
silently resolved.

### 4.1 Coach-battery charging schedule — three different schedules

| Source | Instruction |
|---|---|
| **BM p.1** (priority 1) | Start the engine **at least 3 times per day and run for one hour each time**, especially before going to sleep. **Alternatively, run the generator for 8 hours.** |
| WT §33 (priority 2) | Drive **at least two hours per day**, or run the generator or engine **for one hour twice a day**, morning and evening. |
| GG p.25 (priority 3) | Run the engine or generator **for at least one hour twice a day** (breakfast and dinner). |

**Resolution:** Burning Man schedule first and labelled as the playa schedule.
The other two are shown under "Away from Burning Man". Do not average them.

### 4.2 Awning at Burning Man — the Burning Man guide contradicts itself

| Location | Text |
|---|---|
| **BM p.2 *Awning Use*** | "If your RV is equipped with an awning, our team will walk you through how to use it. Keep in mind you have to pay **$50 for the Awning Usage** … always retract the awning when not in use." — presupposes use is permitted |
| **BM p.4 *Tips from Fellow Burning Man Travelers*** | "**Never open or use the awning.** It can be damaged by sudden winds and is difficult to clean. Wrap the ends with shrink-wrap to keep dust out." |

These are in the **same, highest-priority document**. Note that p.2 is company
policy prose and p.4 is presented as guest-contributed tips, which is the weaker
register — but p.4 is the only text that states a rule for the playa
specifically.

**Recommended resolution (requires sign-off):** lead with "Do not open or use
the awning at Burning Man" (BM p.4), and immediately show the BM p.2 text as a
labelled alternative noting the $50 usage fee, the high-wind warning, and that
damage is the renter's responsibility (BM p.2, GG p.19). Do not present either
as the sole rule. `project_spec.md` §3 already lists "Do not use the awning on
the playa" as a mandatory override, which matches this resolution.

### 4.3 A/C — one unit vs staged two-unit operation

| Source | Instruction |
|---|---|
| **BM p.1** | "**Only run one A/C unit at a time** to avoid tripping the generator breaker." |
| GG p.27 TIP | Start one A/C, switch to low fan / medium temp, then start the second on low fan / medium temp; "Both A/C should not run at full power at the same time"; close off the bedroom/bathroom |

**Resolution:** not strictly contradictory — BM constrains **generator** power,
GG describes **shore power**. Present the BM rule as controlling whenever the
generator is the source, which at Burning Man is effectively always. Keep the
GG staged procedure available under "Other RV configurations / on shore power".

### 4.4 Shore power amperage — 30 A vs 50 A, and an internal Guest Guide contradiction

| Source | Instruction |
|---|---|
| WT §11 | "This is your **30 amp** shore power connection" — cable pre-attached in the rear compartment; a 30→15 A adapter is supplied but "won't power the roof AC" |
| GG p.17 item 5 + Figure 8 | "**Select a 50-amp service.** If a 50-amp service is not available use the 30-amp adapter. 30-amp service will limit the simultaneous use of appliances." |
| GG p.17 TIP | "In order to use the roof air conditioner the RV needs to be plugged into a **minimum 50 Amp** power supply." |
| GG p.37 Table 12 | "Roof air conditioner does not run — **No 30-Amp 120-Volt power. Confirm 30-Amp for dual A/Cs.**" |

GG p.17 TIP and GG p.37 Table 12 **contradict each other** on the amperage
required for the roof A/C, and WT §11 (a 30 A coach whose roof A/C works on
shore power) contradicts GG p.17 TIP.

**Resolution:** show both service types as labelled configuration variants,
state plainly that the sources disagree on the minimum amperage for the roof
A/C, and direct the user to the label at the inlet and to the walkthrough given
at pickup. Add to the "confirm at pickup" list. This topic is **largely
inapplicable at Burning Man**, where shore power is not available; flag it as
travel-to-and-from guidance.

### 4.5 Toilet paper ply

BM p.2 "Always use **one-ply**" vs WT §39 "**one or two-ply** … labeled safe for
RV use" vs GG p.30 "Only use **RV toilet paper**".
**Resolution:** one-ply at Burning Man (BM override); RV-approved paper
elsewhere. No averaging.

### 4.6 Toilet chemical dosing after emptying the black tank

WT §39: add a chemical pack and follow with a **15-second flush**.
GG p.30: add a pod and **about 3 gallons / 10 litres of water**.
GG p.31 step 10: add one packet and flush.

**Resolution:** show both. At Burning Man the BM p.2 water-conservation rule
makes the smaller-water option preferable, but no source states that trade-off,
so the app must present both and not invent a reconciliation.

### 4.7 Driver's seat position before operating the slide — directly opposite instructions

WT §16: "the driver seat is in the **full upright position**, not leaning into
the slide."
GG p.23: "**Tip the driver's seat all the way forward.**"

Both are stated as prerequisites for the same action. **Resolution:** show both,
labelled by source, and make the operative instruction "follow the instruction
sticker next to the slide switch" — which both sources independently endorse
(WT §16 "Always refer to the instruction sticker"; GG p.23 "See the instruction
sticker next to the slide switch"). Add to the "confirm at pickup" list.

### 4.8 Refrigerator temperature setting

WT §38: "set the temperature dial to the **middle**."
GG p.36 Table 9: "the recommended temperature setting for the fridge is
**3 or COLD**, the middle setting is recommended for the **freezer**."
GG p.28 Figure 18 scale: "**1 COLD – 9 COLDEST**".
GG p.25: "Avoid setting the fridge to maximum cooling."

On a 1–9 scale, "3" is not the middle. The two sources disagree, and the GG's
own scale label conflicts with the word "COLD" being at the low end.
**Resolution:** lead with the GG troubleshooting value (3 / COLD) for the fridge
and the middle setting for the freezer, show the WT "middle" advice as the
alternative, and carry the shared instruction from all three sources that
maximum cooling is counter-productive.

### 4.9 Charging schedule vs dust-storm prohibition — operational conflict within BM p.1/p.4

BM p.1 requires running the engine or generator daily to keep the coach
batteries alive. BM p.4 prohibits running either during a dust storm. During a
long dust storm the two cannot both be satisfied.

**Resolution:** the prohibition wins (equipment-damage prevention is explicit),
and the app should say plainly that charging resumes once the storm passes, plus
the supported conservation measures (BM p.1 limit fridge door openings, take a
cooler/ice chest). Do not invent a generator-in-storm workaround.

### 4.10 Return window

BM p.5: within the **30-minute slot selected during Self Check-in**; late
returns cost the price difference plus **$50/hour**.
GG p.34: branches open for drop-off **8:00–11:00 am** (hours can differ in
winter); an additional fee applies for late drop-offs.
**Resolution:** BM slot system overrides for a Burning Man rental. Show the GG
window as the general-rental fallback.

### 4.11 Waste dumping strategy

GG p.30: "Draining waste tanks works best when the tanks are more than **2/3
full**"; "Only drain the waste tanks at a **dump location**"; GG p.30 also says
to flush with **plenty of water**.
BM p.2: there are **no dump stations in BRC**, dumping on the playa is
prohibited, use "RV servicing" pump trucks — and BM p.2 simultaneously requires
strict water conservation.

**Resolution:** BM overrides. The "flush with plenty of water" advice and the
"wait until 2/3 full" advice are labelled as off-playa guidance.

### 4.12 Slide operation prerequisite — a probable typographical defect in the source

GG p.23: "The parking brake must be engaged and **the engine running** before
the slide will operate. Some systems will cut power to the slide-out **if the
engine is on** to prevent operating while driving."

The second sentence contradicts the first and appears to be an error for "if the
engine is off" or "while the vehicle is in gear". **Do not reproduce the second
sentence.** Use the first sentence (corroborated by WT §16 and GG p.37 Table 14)
and defer to the instruction sticker.

---

## 5. Safety exception — the one place Burning Man priority must not be applied mechanically

`project_spec.md` §3 states that Burning Man guidance **always** overrides
ordinary RV guidance on the playa. Applied literally, this creates a
life-safety defect:

**BM p.4:** "Keep windows and roof vents **closed at all times**." (a dust and
cleaning-fee measure)

**Conflicting life-safety instructions:**

| Situation | Instruction | Source |
|---|---|---|
| Smell of propane | "Open the windows, roof vents, and entry door to let in fresh air" | WT §47; GG p.29; GG p.32 step 4 |
| Any detector alarm | "open doors and windows … exit the RV and let it air out" | GG p.31; GG p.33 item 5 |
| Smoke alarm while cooking | "open vents, windows and doors to air the unit out" | GG p.32; WT §49 |
| Operating the stovetop | "Ventilation is necessary … Open a window or vent … run the overhead fan" | GG p.29 |

**Recommendation (requires explicit sign-off before Phase 2):** classify the BM
"windows closed at all times" rule as a **dust-prevention** rule, not a safety
rule, and encode a single narrow exception: *emergency and cooking ventilation
instructions from the Walkthrough and Guest Guide are never suppressed by the
Burning Man dust guidance.* Records affected: `propane-smell`,
`lpg-co-alarm`, `smoke-alarm`, `stovetop`. Each will carry both texts with the
safety instruction first and an explicit note that dust ingress is the accepted
trade-off.

Without this exception the app would, in a propane-leak scenario, surface
"keep windows closed" as the highest-priority guidance. That is the single most
important finding of Phase 1.

---

## 6. Equipment variations

Default app mode is **"Broad guidance — show all configurations"** per spec §4.
No variation below may be silently resolved.

### 6.1 Summary table

| # | System | Variants found | Sources |
|---|---|---|---|
| 1 | Shore power service | 30 A (cord pre-attached, 30→15 A adapter supplied) / 50 A (50/30 A adapter) | WT §11; GG p.17 + Figure 8 |
| 2 | Roof air conditioning | One unit / two units (front thermostat cool+furnace, rear thermostat cool only) | WT §42; GG p.27; GG p.37 Table 12 |
| 3 | Thermostat | Single main thermostat / dual thermostats; heat-pump setting present on some; MODE ×5 from OFF (GG) vs press MODE until it reads cool or furnace (WT) | GG p.25; GG p.27; WT §42 |
| 4 | Water heater | Tankless on-demand / tank-style propane (15–20 min) / tank-style propane **and** electric | WT §40; GG p.25; GG p.22 item 1; GG p.36 Table 7 |
| 5 | Refrigerator energy source | Propane absorption (set to PROPANE) / 12 V compressor | BM p.1 |
| 6 | Refrigerator control | Digital ON-OFF + SET TEMP / slide clip 1–9 / dial | GG p.28; WT §38 |
| 7 | Generator start method | Monitor-panel switch / local switch on the generator / emergency pull-start handle | GG p.24–25 + Figure 14; WT §15; WT §36 |
| 8 | Monitor / control panel | "Look and features … can vary by model and year"; Arctic Pac not installed | GG p.22 |
| 9 | Slide | Driver seat upright vs tipped forward; one or more slide rooms; "slide operation can vary depending on the RV model" | WT §16; GG p.23; GG p.37 Table 14 |
| 10 | Leveling | LCI electronic hydraulic panel / jack control panel / manual leveling ramps supplied | GG p.17 + Figure 7; WT §19; WT §5 |
| 11 | Awning | Equipped or not; awning arm close to the entry door "in some models" | BM p.2; WT §31 |
| 12 | Stovetop ignition | Igniter knob / lighter or match / auto-igniter push-and-turn; glass cover "if applicable" | WT §37; GG p.29 + TIP |
| 13 | Oven | Present or absent ("If your RV has an oven") | WT §37 |
| 14 | Solar | "Some El Monte RVs are equipped with solar panels" | GG p.27 |
| 15 | Waste valves | "Some vehicles might have **two** black water handles" | GG p.31 |
| 16 | Shower head | Style 1 water-saver button / Style 2 rotating lever | GG p.30 + Figures 20, 21 |
| 17 | Beds | Bunk beds (FR3 only) / electric drop-down bed / key-switch cab-over bed / U-shaped dinette / bench dinette / convertible couch | WT §43, §46, §48; GG p.19 |
| 18 | Backup camera | Present (WT) / GG assumes it may not be | WT §6; GG p.17 |
| 19 | Anti-theft system | "The RV **may** be equipped with an anti-theft system" | GG p.15 |
| 20 | Televisions | Four flat-screens (WT) / unspecified count (GG) | WT §50; GG p.19 |
| 21 | GFCI location | Bathroom / galley / exterior; "the button requiring reset may be located on an alternate outlet" | GG p.23; GG p.35 Table 4; WT §41 |
| 22 | LPG/CO detector location | "Varies according to the make and model … usually close to the floor" | GG p.32; WT §47 |
| 23 | Breaker box location | "Usually located in the rear sleeping area or on the bed frame" / "near the rear bed" | GG p.24; WT §29 |
| 24 | Model identification | WT names an **FR3** once (§43); all other content is generic Class A | WT §43 |

### 6.2 Configuration notice

Where a variant applies, records carry the notice mandated by spec §4:

> "Vehicle configurations vary. Check the equipment installed in your RV, the
> instruction label beside the control, and the walkthrough provided at pickup."

### 6.3 Air conditioning — ordering rule

With no My RV profile, show: (1) the Burning Man one-unit-on-generator rule,
(2) single-unit operation, (3) dual-unit staged operation. Source-specific
ordering is justified because BM p.1 is priority 1 and explicitly addresses the
generator case.

### 6.4 Water heater — ordering rule

The Walkthrough (priority 2) states the vehicle it describes has a **tankless**
heater; the Guest Guide (priority 3) describes a **tank-style** unit. With no
profile, show tankless first (higher-priority source), then tank-style propane,
then tank-style propane+electric — and label all three.

### 6.5 Refrigerator — ordering rule

BM p.1 is the only source that names the energy-source variants, so it leads.
The 12 V variant carries the BM battery-management warning.

---

## 7. Escalation policy

### 7.1 Records where escalation is REQUIRED (source-mandated)

Emergency:

1. Propane smell — GG p.29, GG p.32, WT §47
2. LPG / CO alarm — GG p.31, GG p.32 (Figure 25: "Call 911"), GG p.33
3. Fire extinguisher used — GG p.33 item 6
4. Incorrect fuel — GG p.9, GG p.33 item 1
5. Collision or injury — GG p.33
6. Flat tire — GG p.13, GG p.19, GG p.33 item 2
7. Brake system warning light — GG p.11
8. Engine oil-pressure warning — GG p.15
9. Engine coolant temperature warning — GG p.15
10. Red warning icon or gauge in the red — GG p.15
11. "Requires registered technician" icon — GG p.15
12. Airbag readiness light — GG p.15
13. Roof or overhead strike — GG p.11
14. Breakdown rendering the RV inoperable — GG p.33
15. Slide stuck in an unsafe position / faulty motor control — GG p.37 Table 14

Caution (contact required, no emergency banner):

16. Electronic throttle control / limp-home — GG p.15
17. Service engine soon, solid — GG p.15
18. Vehicle-fluid leak under the RV — GG p.13
19. Clogged sink, shower or toilet — GG p.36 Table 11
20. Frozen fridge air circulation chamber — GG p.36 Table 9
21. Air in the water lines after running the pump dry — GG p.37 Table 13
22. Slide — further difficulty after the documented remedies — GG p.37 Table 14

Routine/administrative (a contact prompt, styled distinctly from safety
escalation):

23. Oil change due at 7,500 miles — GG p.13
24. Any repair over $100 — GG p.33

### 7.2 Records where escalation is NOT required — `escalation: null`

Confirmed against sources; each of these has a complete self-service remedy and
**no** source directs contact:

tripped breaker (GG p.35 Table 4) · GFCI reset (GG p.23, Table 4) · low coach
battery (GG p.34 Table 2) · thermostat setup (GG p.25, p.27) · refrigerator
temperature (GG p.28, Table 9) · water-pump switch (GG p.22, Table 13) · normal
A/C condensation (GG p.8, p.27, Table 12) · approximate tank-sensor readings
(GG p.22) · ordinary generator startup checks (GG p.24–25, Table 5) · generator
cranks but won't start — add fuel (Table 5) · generator breaker overload
(Table 5) · generator surging (Table 5) · frozen A/C coils (Table 12) · furnace
blows cold air (Table 6) · water heater DSI/FLT (Table 7) · water-heater relief
valve drip (Table 7) · solar controller red flash (Table 8) · microwave no power
(Table 10) · awning will not move (Table 3) · slide obstruction / low power /
motor desync (Table 14) · no 120 V while plugged in (Table 4) · fuse replacement
(GG p.24) · smoke alarm during cooking (GG p.32) · smoke-alarm low-battery chirp
(GG p.32) · nuisance LPG/CO alarm from sprays or dust (GG p.31) · emergency
starter / battery boost (GG p.12) · ABS light (GG p.15) · low tire pressure
(GG p.15) · charging system light (GG p.15) · check fuel cap (GG p.15) · low
fuel (GG p.15) · vehicle alarm after opening (GG p.15) · all Burning Man
cleaning, trash, fee, water-conservation and dust records.

### 7.3 Burning Man modifier on every escalation

BM p.3 states El Monte "cannot provide on-site service within Black Rock City"
and that support there is "limited to operational guidance only", with in-person
appointments at 130 Woodland Ave, Reno, NV 89523.

Every escalation record must therefore carry a Burning Man note stating that
On Road Care can give guidance by phone but cannot come to the vehicle inside
BRC, and that 911 / emergency services and Burning Man's own emergency services
remain the route for genuine emergencies. This is sourced, not invented.

### 7.4 Absolute prohibitions (`doNot`, never softened)

Sourced: never change a flat tire yourself (GG p.13/p.19/p.33) · never use
caustic chemicals to unclog drains (GG p.30, Table 11) · never disconnect the
smoke detector (GG p.32) · never dump on the playa (BM p.2) · never use the
black tank flush port / never connect a hose to it (WT §8, GG p.18) · never
start or drive after adding the wrong fuel (GG p.9, p.33) · never lift the
wheels off the ground with the jacks (BM p.2) · never use the jacks for tire
removal or under-vehicle service (GG p.17) · never drive with the slide out
(GG p.23) · never operate the slide again after a faulty-motor-control fault
without contacting On Road Care (GG p.37) · never run the generator or engine
during a dust storm (BM p.4) · never leave the awning out unattended or in wind
(GG p.19, WT §31) · never run the water pump dry (GG p.18, p.22) · never use the
stove or oven for heating or drying (GG p.32) · never operate the stove or oven
while driving (GG p.32) · never abandon the RV (GG p.33) · never use any tape
other than blue painter's tape (BM p.4).

No source authorizes bypassing an alarm, bypassing a safety interlock, or
repairing the propane system, so no record will suggest any of these.

---

## 8. Gaps, ambiguities and items to confirm at pickup

### 8.1 Coverage gaps against the spec §7 minimum list

| Required topic | Status |
|---|---|
| **Dust storm procedure** | **Severely thin.** BM p.4 provides exactly one sentence ("Do not run the generator or engine during a dust storm"). Nothing in any source covers goggles, dust masks, sheltering, driving in a whiteout, or when it is safe to resume. Anything beyond the sourced sentence plus the general BM p.4 dust measures would be fabrication. **Recommend the record state its own limits explicitly.** |
| **Daily Burning Man checklist** | No source defines one. Must be composed only of individually cited lines from BM p.1 and BM p.4 and labelled as assembled from the guide. |
| **Pickup inspection checklist** | No source defines one. Compose from GG p.8 and the WT §5 equipment inventory only. |
| **Arriving at Burning Man checklist** | Derived from BM p.1, p.2, p.4. Every line cited. |
| **Convection microwave** | Listed in the Guest Guide contents (p.3, "Convection microwave 26") but **no body text exists on page 26**. Cannot be covered. |
| **Extended countertop** | Listed in the contents (p.3, "Extended countertop 27") but **no body text exists on page 27**. Cannot be covered. |
| **Waste tank hook up** | GG p.18 heading exists but the body only cross-references p.31. Content comes from GG p.31 and WT §9. |
| **On Road Care phone number** | **Not present in any source.** All three say it is on the key tag. The app must never display a number; the My RV profile field is the only place one can exist, entered by the user. |

### 8.2 Unresolved ambiguities

1. **Awning at Burning Man** (§4.2) — an internal contradiction in the
   highest-priority source. Needs a decision, recorded above as a
   recommendation.
2. **Roof A/C minimum amperage** (§4.4) — GG p.17 TIP says 50 A minimum;
   GG p.37 Table 12 says 30 A; WT §11 describes a working 30 A coach. Genuinely
   unresolvable from the sources.
3. **Fridge setting numeric scale** (§4.8) — "3 or COLD" against a labelled
   "1 COLD – 9 COLDEST" scale and against "the middle".
4. **Driver's seat before slide operation** (§4.7) — directly opposite
   instructions with no tiebreaker beyond the in-vehicle sticker.
5. **Slide power-cut sentence** (§4.12) — apparent typographical error in
   GG p.23; excluded rather than reproduced.
6. **"Use generators sparingly" vs "run the generator for 8 hours"** — both on
   BM p.1. Presented as written; no reconciliation invented.
7. **Toilet chemical water volume** (§4.6) — 15-second flush vs ~3 gallons,
   against a mandatory water-conservation rule.
8. **Ventilation vs dust** (§5) — the safety exception. Needs sign-off.
9. **Awning fee applicability** — BM p.2 charges $50 for "Awning Usage on any
   El Monte Booking"; unclear whether the fee applies on booking or only on use,
   and BM p.4 tells guests never to use it. Flag as a retailer question.
10. **Walkthrough model specificity** — the transcript describes one particular
    coach (30 A, tankless heater, two thermostats, FR3 bunks). Its statements
    must be labelled as *one configuration*, not as universal Class A facts.
    This affects roughly a dozen records.

### 8.3 Items requiring retailer confirmation at pickup

Shore power service (30 A or 50 A) · number of roof A/C units · water heater
type · refrigerator energy source and control style · generator start locations
· number of slides and the correct driver-seat position · leveling system type ·
whether an awning is fitted and whether its use is permitted and chargeable ·
whether an oven is fitted · stovetop ignition type · number of black-tank valve
handles · GFCI outlet locations · breaker box location · LPG/CO detector
location · the On Road Care phone number on the key tag · the pickup fuel and
propane levels to be matched at return · the return slot time.

---

## 9. Phase 1 completion statement

- All three source files were located, opened and read end to end. None was
  unreadable.
- Burning Man guidance is confirmed at priority 1 throughout, with 24 hard
  overrides identified and one internal contradiction in that source (§4.2).
- 12 source conflicts and 24 equipment variations are catalogued.
- 24 topics require escalation; 30-plus explicitly do not and must render with
  `escalation: null`.
- One safety-critical deviation from a literal reading of the spec is proposed
  in §5 and requires sign-off before Phase 2.
