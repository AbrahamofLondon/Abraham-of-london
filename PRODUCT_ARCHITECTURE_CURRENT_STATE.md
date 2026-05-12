# Product Architecture — Current State

## Entry Points (8 surfaces, ordered by ladder progression)

```
Fast Diagnostic         → Free, 2 min, first pressure reading
Purpose Alignment       → Free/£49, 8-12 min, personal mandate assessment
Constitutional Diagnostic → Free, governance/authority posture
Team Assessment         → Paid, multi-respondent alignment
Enterprise Assessment   → Paid, institutional structural reading
Executive Reporting     → £295, institutional consequence dossier
Strategy Room           → £750/£1,250, governed execution session
Return Brief            → Earned, outcome verification cycle
```

### Supporting surfaces
```
Decision Signal         → Free, 2 min, pre-diagnostic pressure band
Decision Instruments    → £19-£129, 10 scored instruments
Operator Pilot          → Controlled engagement, senior operator review
Boardroom               → Retained, board-level dossier archive
Oversight               → Retained, cadence-based governance memory
Playbooks               → Free/Paid, governed methodology runs
Frameworks              → Free, conceptual orientation
Decision Centre         → Free/Paid, governed case console
```

## Shared DNA — 8 capabilities across all surfaces

### 1. Evidence Grading
Every surface grades input evidence quality:
- `USER_REPORTED` — self-reported, not independently verified
- `SYSTEM_INFERRED` — derived from pattern analysis
- `AGGREGATED` — multi-respondent or cross-source
- `OUTCOME_VERIFIED` — confirmed by observed result
- `SUPPRESSED` — withheld from display

**Implemented in:** `lib/product/evidence-capture-contract.ts`, `lib/product/evidence-stage-contract.ts`, `lib/product/evidence-memory-lifecycle-contract.ts`

### 2. Contradiction Detection
Every surface detects contradictions between stated intent and operating reality:
- False alignment (high resonance, low certainty)
- Acknowledged failure (low resonance, high certainty)
- Cross-domain contradictions (identity vs decision, behaviour vs legacy)
- Cross-assessment contradictions (PA vs Team vs Enterprise)

**Implemented in:** `lib/alignment/intelligence-engine.ts`, `lib/analytics/contradiction-graph-presenter.ts`, `lib/analytics/cross-assessment-intelligence.ts`

### 3. Progression Governance
Every surface gates the next step:
- `LOCKED` — prerequisite not met
- `AVAILABLE` — prerequisite met, user may proceed
- `COMPLETED` — surface used, result stored
- `EARNED` — escalation justified by evidence, not payment

**Implemented in:** `lib/diagnostics/journey-store.ts`, `lib/product/living-case-store.ts`, `pages/diagnostics/index.tsx` (SurfaceCard state)

### 4. Consequence Framing
Every surface frames the cost of inaction:
- 30/60/90-day projections (Purpose Alignment)
- Financial exposure estimates (Executive Reporting)
- Delay cost bands (Decision Signal)
- Irreversibility indices (Decision Centre)

**Implemented in:** `lib/product/cost-of-inaction-clock.ts`, `lib/product/irreversibility-index.ts`

### 5. Refusal/Restriction Logic
Every surface can refuse to proceed:
- Challenge engine blocks weak input (Fast Diagnostic, Purpose Alignment)
- Entitlement checks gate paid content (all paid surfaces)
- Ladder gating prevents skipping (Diagnostics Index)
- Evidence threshold prevents premature escalation (Executive Reporting gate)

**Implemented in:** `lib/server/decision/challenge-engine.server.ts`, `lib/commercial/entitlement-authority.ts`, `lib/diagnostics/executive-reporting-enforcement.ts`

### 6. Outcome Memory
Every surface writes to governed memory:
- Diagnostic journey store (all assessments)
- Decision Centre living cases (paid assessments)
- Checkpoint records (efficacy commands)
- Return Briefs (outcome verification)

**Implemented in:** `lib/diagnostics/journey-store.ts`, `lib/product/living-case-store.ts`, `lib/product/checkpoint-service.ts`, `lib/product/governed-memory-contract.ts`

### 7. Value Receipt
Every paid surface shows:
- Price (via catalog)
- Delivery format (interactive, PDF, combined, governed methodology)
- What it produces (includes list)
- Memory/dossier status
- Access posture (free/paid/earned/restricted/retained)
- Next admissible move

**Implemented in:** `components/product/ValueReceipt.tsx`, `components/product/AccessPostureBadge.tsx`, `components/product/DeliveryFormatPanel.tsx`, `components/product/NextAdmissibleMovePanel.tsx`

### 8. Corridor Bridge
Surfaces that justify escalation carry a bridge payload:
- Purpose Alignment → Executive Reporting (when institutional consequence)
- Decision Instruments → Strategy Room (when execution risk is high)
- Executive Reporting → Boardroom (when boardroom-qualified)
- Strategy Room → Oversight (when pattern recurs)

**Implemented in:** `lib/alignment/purpose-alignment-corridor-bridge.ts`, `lib/product/evidence-loader.ts`

## Case Model — the governed object

```
Case
├── Decisions          — decision objects from each assessment
├── Evidence           — graded evidence nodes
├── Contradictions     — detected contradictions across assessments
├── Directives         — required moves from each surface
├── Exposures          — financial and structural exposure estimates
├── Simulations        — intervention impact simulations
├── Interventions      — governed intervention paths
├── Execution States   — Strategy Room execution state
├── Governance Events  — checkpoint responses, return briefs
├── Outcomes           — verified outcome snapshots
├── Calibration Records — signal calibration data
├── Behavioural Signals — decision velocity, pattern recurrence
├── Decision Credit    — fulfilled/breached/disputed commitment record
└── Memory             — governed memory items with provenance
```

**Implemented in:** `lib/product/living-case-store.ts`, `lib/product/decision-centre-contract.ts`, `lib/product/governed-memory-contract.ts`, `lib/product/field-provenance-contract.ts`

## Commercial Layer

```
CATALOG (lib/commercial/catalog.ts)
├── 30+ products across 8 categories
├── Each with: code, price, Stripe IDs, entitlement slug, delivery format
├── Bundle logic for packs (Operator Pack, Command Pack, Governance Suite)
└── Integrity assertions at build time

Entitlement (lib/commercial/entitlement-authority.ts)
├── Canonical entitlement resolution (DB-backed)
├── Tier-based access
├── Purchase-based access
└── Manual grant support

Checkout (app/api/checkout/route.ts)
├── Stripe session creation
├── Webhook resolution
├── Entitlement grant after payment
└── Success path routing
```
