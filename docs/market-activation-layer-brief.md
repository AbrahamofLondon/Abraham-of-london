# Market Activation Layer Brief

Generated: 2026-06-01

## Purpose

Stop requiring prospects to climb the full diagnostic ladder before seeing the product's strongest proof of value. Create four fast-engagement surfaces that demonstrate capability in the first session.

## Doctrine

- The first encounter is the sale.
- Show, don't describe.
- Each activation surface must route into the paid corridor.
- Activation surfaces are NOT corridor stages.
- No activation surface may claim retained oversight, institutional memory, or governed execution.

---

## Surface 1: Boardroom-first Brief

**Status:** PLANNED

**What it does:** Takes a single decision scenario and produces a boardroom-grade readiness assessment — objections the board will raise, evidence weaknesses, trade-offs, and decision paths.

**Input:**
- Decision description
- Decision owner
- Primary blocker
- Consequence of delay/failure
- Deadline or time pressure
- Evidence available
- Authority uncertainty

**Output:**
- Boardroom readiness score
- Top 3 objections a board would raise
- Evidence weaknesses that would not survive scrutiny
- Trade-off map
- Decision paths with risk shift
- Next admissible move

**Engines used:**
- `buildBoardroomIntelligenceSpine()` (existing, dormant)
- `generateBoardroomDossier()` (existing, dormant)
- Adversarial preview
- Simulation gate
- Constitutional engine

**Boundary:** Preview/brief only. Full adversarial session requires Boardroom Mode. Full execution management requires Strategy Room.

**Corridor entry:** Executive Reporting or Boardroom Mode.

---

## Surface 2: Scenario Stress Test Hook

**Status:** PLANNED

**What it does:** Presents three enterprise scenario questions and analyses the responses to reveal governance blind spots.

**Input:**
- Three scenario choices (binary option per scenario)
- Optional explanation per scenario

**Output:**
- Scenario insight per response
- Consistency/inconsistency with claimed capability
- Board challenge implication
- Upgrade path to full Enterprise Assessment

**Engines used:**
- `SCENARIOS` bank (existing, centralised via ENTERPRISE_SCENARIO_IDS)
- `analyseScenarioResponse()` (existing)

**Boundary:** Three scenarios only. Full enterprise assessment requires Enterprise Assessment surface.

**Corridor entry:** Enterprise Assessment.

---

## Surface 3: Quick Decision Health Check

**Status:** PLANNED

**What it does:** Takes a brief decision description and produces a fast health assessment using the full orchestrator pipeline.

**Input:**
- Decision description
- Decision owner (optional)
- Primary blocker (optional)
- Consequence (optional)
- Deadline (optional)

**Output:**
- Decision class
- Authority state
- Evidence state
- Consequence state
- Next admissible move
- Recommended corridor path

**Engines used:**
- `runDecisionIntelligence()` (existing, ACTIVE)
- Situation translator, taxonomy, simulation gate, synthesis gate

**Boundary:** Limited to fast diagnostic depth. No lenses, no contradiction resolution, no constitutional assessment. Upgrades to Team Assessment or Enterprise Assessment for full analysis.

**Corridor entry:** Team Assessment or Enterprise Assessment.

---

## Surface 4: Sample Boardroom Dossier

**Status:** PLANNED

**What it does:** Displays a pre-generated sample boardroom dossier so prospects can see exactly what the product delivers before purchasing.

**Input:** None (canned sample spine).

**Output:**
- Viewable/downloadable sample dossier
- Annotated to show which sections are engine-generated vs. static

**Engines used:**
- `buildBoardroomIntelligenceSpine()` (one-time generation)
- `generateBoardroomDossier()` (one-time generation)

**Boundary:** Static sample only. Live generation requires Boardroom Mode.

**Corridor entry:** Boardroom Mode.

---

## Implementation Priority

| # | Surface | Effort | Revenue Impact | Priority |
|---|---------|--------|----------------|----------|
| 1 | Quick Decision Health Check | Low (uses existing orchestrator) | High (immediate proof of value) | P0 |
| 2 | Scenario Stress Test Hook | Low (uses existing SCENARIOS + analyser) | Medium (enterprise lead gen) | P1 |
| 3 | Sample Boardroom Dossier | Medium (requires sample data curation) | High (premium product showcase) | P1 |
| 4 | Boardroom-first Brief | Medium-High (requires boardroom spine wiring) | Very High (premium lead conversion) | P2 |

---

## What This Does NOT Do

- Does not activate any new engines.
- Does not create new Prisma models.
- Does not alter the paid corridor runtime.
- Does not merge Purpose Alignment into ODI.
- Does not claim institutional memory or retained oversight.
