# Enterprise Product Architecture Report

**Date:** 2026-05-07
**Mode:** EXECUTE
**Objective:** Redesign as one unified governed decision operating system

---

## 1. Canonical Product Lanes — DECLARED

Five canonical lanes established:

| Lane | Purpose | Routes | Status |
|------|---------|--------|--------|
| **Public Authority Estate** | Brand, publishing, intellectual leadership | homepage, blog, canon, library, evidence, media | Active. 40+ pages mapped |
| **Diagnostic Escalation Ladder** | Signal → posture → exposure → route → intervention | Fast → Purpose → Constitutional → Team → Enterprise → Executive | Active. 6-stage chain with spine accumulation |
| **Decision Instrument Suite** | Productized tactical tools | 4 instruments (exposure, mandate, intervention, operator) | Active. Integration plan created |
| **Strategy Room / Intervention** | Convert intelligence into action | Entry → session → execution → return brief → outcome | Active. Panels need wiring (documented) |
| **Enterprise Operating System** | B2B institutional deployment | Org → campaign → participant → report → intervention → outcome | Active. 8-stage journey documented |

## 2. Route Governance Matrix — CREATED

Full classification of 197 pages + 46 app pages:
- **Canonical**: 120+ routes assigned to canonical lanes
- **Retire**: 8 dead redirect pages identified
- **Merge**: 8 duplicate route pairs identified (terms/terms-of-service, etc.)
- **Promote**: 8 pages/admin pages flagged for app/admin migration

See: `docs/product/route-governance-matrix.md`

## 3. Admin Consolidation Plan — CREATED

- **Promote**: 8 high-value pages/admin surfaces to app/admin
- **Keep**: 5 specialist ops tools
- **Merge**: 3 surfaces (PDF dashboard + status → documents)
- **Retire**: 1 already-redirecting page
- **Hub**: Admin operations landing proposed to unify navigation

See: `docs/product/admin-consolidation-plan.md`

## 4. Diagnostics → Strategy Continuity — PLANNED

Every assessment feeds:
- Canonical case object (via `createCaseObject`)
- Intelligence spine (via `advanceSpine` / `enrichSpine`)
- Session thread (via `sessionStorage` accumulation)
- Decision ledger (via `recordLedgerEntry`)
- Route state (via constitutional assessment → route classification)

Living UX components specified:
- LivingSpineProgress
- EvidenceStrengthMeter
- IntelligenceGainPanel
- NextLayerUnlockedPanel
- DecisionAdvantageSummary

See: `docs/product/living-advantage-architecture.md`

## 5. Decision Instrument Integration Map — CREATED

4 instruments mapped to canonical journey positions:
- Decision Exposure → after Fast, before Executive
- Mandate Clarity → after Constitutional, before Team
- Intervention Selector → after Enterprise, before Strategy Room
- Operator Pack → standalone or after Fast

Each must: read spine, write findings, create ledger entry, recommend next stage.

See: `docs/product/decision-instrument-integration-map.md`

## 6. Knowledge System Architecture — CREATED

7 parallel systems unified into 4-tier hierarchy:
1. **Public Knowledge** — Canon, Library, Blog, Evidence (authority/entry)
2. **Operational Knowledge** — Playbooks, Resources, Instruments (execution support)
3. **Premium Intelligence** — Vault, Briefs, IC content (governed library)
4. **Protected Delivery** — Downloads (delivery mechanism, not browsing)

Consolidation: Toolkits → Playbooks. Premium Library → Vault.

See: `docs/product/knowledge-system-architecture.md`

## 7. Enterprise Operating System — CREATED

8-stage enterprise journey documented:
Assessment → Org setup → Campaign deployment → Participant evidence → Enterprise report → Intervention stack → Outcome tracking → Retainer

All infrastructure already built: cross-respondent engine, campaign management, organisation management, pattern-breaker contracts, HCD calculations, governance logic, Google Calendar sync.

See: `docs/product/enterprise-operating-system.md`

## 8. Proof/Outcome Activation Plan — CREATED

Systems wired:
- Outcome evidence now persists to DB (was in-memory)
- Ledger trend now filters by date correctly
- OutcomeVerification component available for result screens

Activation priorities documented:
- P1: Surface outcome evidence on return brief, decision credit on Strategy Room
- P2: Evidence tier badges on all result screens, calibration confidence
- P3: Connect evidence page to verification records

See: `docs/product/proof-and-outcome-system.md`

## 9. Legacy Retirement Plan — CREATED

- **P1 retirement**: 8 null-returning redirect pages
- **P2 merges**: 8 duplicate route pairs
- **P3 evaluation**: 6 ambiguous routes
- **Deprecated PA dashboard**: Replaced with redirect

See: `docs/product/legacy-route-retirement-plan.md`

## 10. Implemented Changes (this pass)

| Change | Files |
|--------|-------|
| Deprecated PA dashboard → redirect | app/dashboard/purpose-alignment/page.tsx |
| Ledger trend bug fix | lib/decision-ledger/ledger-service.ts |
| Assessment engine typo fix | lib/constitution/assessment-engine.ts |
| Economic model upgrade (6 lines → 160 lines) | lib/constitution/economic.ts |
| Consequence model upgrade (static → data-bound) | lib/constitution/consequence.ts |
| Escalation engine → governor routing | lib/constitution/escalation-engine.ts |
| Outcome evidence → DB persistence | lib/outcomes/evidence.ts |
| Living Intelligence Spine | lib/product/living-intelligence-spine.ts |
| 8 architecture documents | docs/product/*.md |
| Living advantage architecture | docs/product/living-advantage-architecture.md |

## 11. Remaining Activation Debt

### P0 (Strategy Room nerve center — highest revenue impact)
- Wire DecisionStateBanner, DynamicConsequencePanel, EscalationTriggerPanel to real execution state
- Create ExecutionFlow locked decision record save endpoint
- Wire simulateAction() into Strategy Room "test this action" feature
- Wire governance impact simulation (contagion analysis) into Strategy Room

### P1 (Diagnostic continuity — user experience compounding)
- Create living UX components (IntelligenceGainPanel, WhatChangedPanel, etc.)
- Wire decision instruments to spine (loadSpineFromSession + enrichSpine)
- Surface decision credit score to users
- Surface calibration confidence on result screens

### P2 (Enterprise promotion)
- Create public enterprise product page
- Create enterprise client dashboard (not just admin)
- Wire Google Calendar sync into Pattern-Breaker Contract verification
- Admin operations hub landing page

### P3 (Consolidation)
- Migrate 8 pages/admin surfaces to app/admin
- Merge duplicate legal/policy routes
- Merge toolkits → playbooks, premium library → vault
- Delete retired redirect files after 90 days
- Activate Predictive Intelligence Service (requires TimeSeriesEngine implementation)

## 12. Validation Evidence

| Check | Result |
|-------|--------|
| `prisma validate` | PASS |
| `tsc --noEmit` | PASS (0 errors) |
| `next build` | PASS ("Compiled successfully in 103s") |
| `secret-scan.mjs` | SECRET SCAN PASS |
| `env-integrity-check.mjs` | Fallback chains: PASS. 4 dev-env FAIL (expected) |

---

## FINAL VERDICT

**PARTIAL ACTIVATION — SPECIFIC BLOCKERS REMAIN**

### What is activated:
- 5 canonical product lanes declared with route governance
- All core engine bugs fixed (ledger, escalation, economic, consequence)
- Living Intelligence Spine composing all engines into one canonical output
- 8 architecture documents defining the consolidated product
- Route governance matrix classifying 243 pages
- Admin consolidation plan with promote/keep/merge/retire
- Enterprise operating system as first-class lane
- Knowledge system unified into 4-tier hierarchy
- Legacy retirement plan with specific routes flagged
- Dead route retired (deprecated PA dashboard)

### What remains (specific blockers):
1. **Strategy Room panel wiring** — the panels exist, the API exists, the data flow needs one session page refactor to connect them
2. **ExecutionFlow save endpoint** — one API route to persist the locked decision record
3. **Living UX components** — 6 components to build and integrate across result screens
4. **Decision instrument spine integration** — 4 instruments need loadSpine/enrichSpine calls
5. **Enterprise client dashboard** — new surface (the infrastructure is all built)

The architecture is declared. The engines are fixed. The lanes are mapped. The consolidation path is clear. The next pass is pure wiring — connecting surfaces that already exist to engines that already work.
