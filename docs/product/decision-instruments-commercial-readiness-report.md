# Decision Instruments — Commercial Readiness Report

Generated: 2026-05-10

## Classification

**`DECISION_INSTRUMENTS_STRIPE_READY_DELIVERY_PENDING`**

Stripe IDs pending for 7 new instruments. Once filled, classification upgrades to `DECISION_INSTRUMENTS_COMMERCIALLY_READY`.

---

## Full Product Line Status

### Tier 1A — Exposure & Risk

| Product | Price | Stripe | Engine | Runner | Run Page | Result Persist | Dossier | Memory Write |
|---|---|---|---|---|---|---|---|---|
| Decision Exposure Instrument | £29 | **HAS IDs** | engine.ts | DecisionExposureRunner | /run | POST /api/decision-instruments/results | via dossier API | YES |
| Escalation Readiness Scorecard | £19 | PENDING | engine.ts | EscalationReadinessRunner | /run | POST results | via dossier API | YES |
| Structural Failure Canvas | £19 | PENDING | engine.ts | StructuralFailureCanvasRunner | /run | POST results | via dossier API | YES |
| Execution Risk Index | £29 | PENDING | engine.ts | ExecutionRiskIndexRunner | /run | POST results | via dossier API | YES |

### Tier 1B — Alignment & Authority

| Product | Price | Stripe | Engine | Runner | Run Page | Result Persist | Dossier | Memory Write |
|---|---|---|---|---|---|---|---|---|
| Team Alignment Gap Map | £29 | PENDING | engine.ts | TeamAlignmentGapMapRunner | /run | POST results | via dossier API | YES |
| Mandate Clarity Framework | £49 | **HAS IDs** | engine.ts | MandateClarityRunner | /run | POST results | via dossier API | YES |
| Governance Drift Detector | £49 | PENDING | engine.ts | GovernanceDriftDetectorRunner | /run | POST results | via dossier API | YES |
| Strategic Priority Stack Builder | £49 | PENDING | engine.ts | StrategicPriorityStackRunner | /run | POST results | via dossier API | YES |

### Tier 1C — Board & Execution Grade

| Product | Price | Stripe | Engine | Runner | Run Page | Result Persist | Dossier | Memory Write |
|---|---|---|---|---|---|---|---|---|
| Intervention Path Selector | £79 | **HAS IDs** | engine.ts | InterventionPathRunner | /run | POST results | via dossier API | YES |
| Board Brief Builder | £129 | PENDING | engine.ts | BoardBriefBuilderRunner | /run | POST results | via dossier API | YES |

### Free

| Product | Route | Status |
|---|---|---|
| Decision Signal | /decision-instruments/signal | LIVE — no checkout needed |

### Packs (Foundation — not checkout-active)

| Pack | Price | Included | Status |
|---|---|---|---|
| Operator Essentials | £129 | 3 instruments | CONTRACT_DEFINED — not checkout-active |
| Command Pack | £249 | 6 instruments | CONTRACT_DEFINED — not checkout-active |
| Governance Suite | £495 | 10 instruments | CONTRACT_DEFINED — not checkout-active |
| Executive Intelligence | £995 | 10 + ER | CONTRACT_DEFINED — not checkout-active |

---

## Commercial Chain Verification

| Step | Status |
|---|---|
| Catalog entry exists | **ALL 10** |
| entitlementSlug defined | **ALL 10** |
| successPath resolves to real page | **ALL 10** (verified: run pages exist) |
| `isCheckoutAvailable()` blocks null Stripe IDs | **YES** (line 795-802) |
| Post-checkout grants entitlement via `resolveCanonicalEntitlement` | YES (existing webhook flow) |
| Result persistence via POST /api/decision-instruments/results | **YES** |
| Dossier export via /api/pdf/decision-instrument-dossier | **YES** |
| History page shows results | **YES** |
| Decision kernel integration | **ALL 10** engines call `evaluateDecision()` |
| Evidence posture caveat | **ALL 10** runners include caveat |
| Next admissible move defined | **ALL 10** catalog entries |
| Delivery format specified | **ALL 10** |
| Estimated completion minutes specified | **ALL 10** |
| writesToDecisionMemory | **ALL 10** = true |
| dossierEligible | **ALL 10** = true |

## What Blocks `COMMERCIALLY_READY`

1. **7 Stripe price IDs still null** — checkout cannot complete without them
2. **Product pages (`[slug].tsx` INSTRUMENT_DATA)** — not yet populated for new 7 instruments
3. **`my-instruments` INSTRUMENT_META** — not yet populated for new 7 instruments

## What's Ready Now

- All engines compile and score deterministically
- All runners render with live scoring
- All run pages persist results
- All instruments write to decision memory
- All instruments have dossier eligibility
- Pack contracts define composition and completion tracking
- Guard verifies entire product line integrity
- All 10 guards pass
- Build passes

## Safety Guarantees

- No formula/threshold exposed in any public page
- No "guaranteed outcome" or "verified improvement" in instrument surfaces
- No inactive product routes to checkout (blocked by `isCheckoutAvailable`)
- No cookie-only access — all instruments use canonical entitlement authority
- Evidence posture caveat present on all instruments
- All results labelled "not independently verified"

---

## Action Required (Owner)

Fill Stripe product/price IDs in `lib/commercial/catalog.ts` for:
1. `escalation_readiness_scorecard`
2. `structural_failure_diagnostic_canvas`
3. `execution_risk_index`
4. `team_alignment_gap_map`
5. `governance_drift_detector`
6. `strategic_priority_stack_builder`
7. `board_brief_builder`

Then add INSTRUMENT_DATA entries to `pages/decision-instruments/[slug].tsx` for product page content.

Once Stripe IDs are live, classification becomes: **`DECISION_INSTRUMENTS_COMMERCIALLY_READY`**
