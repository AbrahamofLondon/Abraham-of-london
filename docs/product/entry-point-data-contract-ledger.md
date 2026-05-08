# Entry Point Data Contract Ledger

**Date:** 2026-05-07
**Scope:** Engine/data classification for every entry point
**Classification:** REAL_ENGINE | STATIC_DEMO | MIXED | PLACEHOLDER | UNKNOWN

---

## Data Contract Classification

| Route | Classification | Engine Detail | DB Persistence | Fallback Behaviour |
|-------|---------------|--------------|----------------|-------------------|
| `/` (Homepage) | **MIXED** | CategoryFrontDoor refusal demo is deterministic/static. Public proof blocks (`AccuracyMetricsBlock`, `ObservedOutcomesBlock`) fetch from `GET /api/proof/public` which queries `proof_evidence` table. | Proof blocks are DB-backed. | Proof blocks fall back to canned outcomes if sample < 5 or no approved public evidence exists. |
| `/diagnostics` | **STATIC_DEMO** | Hub is a static page with hardcoded card definitions. No engine interaction. | None. | N/A. |
| `/diagnostics/fast` | **REAL_ENGINE** | `POST /api/diagnostics/score` invokes: `createCaseObject()`, `scoreC3()` (C3 fidelity), `synthesise()` (synthesis engine), `buildDeterministicOutput()`, `forecastDefaultPath()`. Authority index, execution failure prediction, cost-of-inaction modelling. | YES — `saveDiagnosticRecord()` writes to database. Results also cached in sessionStorage. | Returns structured error if scoring fails. |
| `/diagnostics/purpose-alignment` | **REAL_ENGINE** | `POST /api/purpose-alignment/assessments` invokes: `scorePurposeProfile()` with dual-axis scoring (resonance x certainty), domain profiling across 6 domains, coherence banding (SOVEREIGN/ALIGNED/DRIFTING/FRACTURED), contradiction evidence mapping. | YES — `createPurposeAlignmentAssessment()` persists to database. Assessment ID enables re-evaluation tracking. | N/A — requires valid input. |
| `/diagnostics/constitutional-diagnostic` | **REAL_ENGINE** | `POST /api/diagnostics/constitutional-intake/report` invokes: `runConstitutionalOrchestration()` — 10 dual-axis questions across 9 constitutional domains. Routes to STRATEGY/DIAGNOSTIC/REJECT with confidence score. | YES — `persistDiagnosticStage()` writes stage="constitutional" to database. State token created. | N/A — requires valid input. |
| `/diagnostics/team-assessment` | **REAL_ENGINE** | Local algorithmic scoring: `calculateFragility()` (Bessel-corrected standard deviation), domain gap analysis (leader perception vs. estimated team reality). Also uses `POST /api/diagnostics/challenge` for real-time quality interrogation. | YES — `saveDiagnosticRecord()` with kind="team-alignment". | N/A. |
| `/diagnostics/enterprise-assessment` | **REAL_ENGINE** | Local algorithmic scoring: 5 structural blocks x 6 questions, per-domain contradiction detection, decision signal evaluation. Risk formula: `(100 - pct) + decision_structural_risk * 0.35`. Uses `POST /api/diagnostics/challenge`. | YES — `saveDiagnosticRecord()` with kind="enterprise". CRM forward to HubSpot. | N/A. |
| `/diagnostics/executive-reporting` | **MIXED** | Entry page aggregates prior assessment results from sessionStorage. No new scoring engine. Paywall enforces access via `enforceExecutiveReportingAccess()`. | YES — checkout metadata persisted. | Displays available evidence preview even if some stages are missing. |
| `/diagnostics/executive-reporting/run` | **REAL_ENGINE** | Report generation engine synthesises accumulated evidence into executive brief. | YES — report session persisted. | Requires payment/access validation. |
| `/strategy-room` | **REAL_ENGINE** | SSR with `evaluateRetainerQualification()`, `assessAdvantageTerrain()`, `resolveCanonicalEntitlement()`, `suggestInterventions()`. Prisma-backed session data. | YES — `strategyIntake` table, execution records. | Entitlement check fails gracefully with redirect. |
| `/briefing/return/[sessionId]` | **REAL_ENGINE** | `generateReturnBrief()` queries DB for execution state, builds outcome evidence via `buildObservedOutcomeEvidenceFromDB()`, evaluates trajectory triggers (fragile, deteriorating, recurrence, contradiction persistence). | YES — reads from and writes to execution state. | Returns "No return brief warranted" if insufficient data. |
| `/evidence/[slug]` | **STATIC_DEMO** | Hardcoded `const ASSETS: Record<string, EvidenceAsset>` in `[slug].tsx`. Three cases with 13+ sections each. Static generation via `getStaticPaths`/`getStaticProps`. | None — pure static. | 404 for unknown slugs. |
| `/api/proof/public` | **REAL_ENGINE** | Queries `proof_evidence` table filtered by `approvalStatus="APPROVED"` AND `displayStatus="PUBLIC"`. Computes `precisePct`, `clarifiedPct`, `nextStepChangedPct`. Requires sample >= 5. | DB-backed (read-only). | Returns null metrics if sample < 5. |

---

## Summary

| Classification | Count | Routes |
|---------------|-------|--------|
| REAL_ENGINE | 9 | Fast, Purpose Alignment, Constitutional, Team, Enterprise, ER/run, Strategy Room, Return Brief, Proof API |
| MIXED | 2 | Homepage (static demo + DB proof), ER entry (aggregation + server gate) |
| STATIC_DEMO | 2 | Diagnostics hub, Evidence pages |
| PLACEHOLDER | 0 | — |
| UNKNOWN | 0 | — |

---

## Flags

1. **Homepage proof blocks** claim intelligence but fall back to canned outcomes when no approved evidence exists in the database. This is acceptable as a bootstrap condition but should be monitored — once real proof evidence accumulates, the fallback should be deprecated.

2. **Evidence pages** are static dossiers. They are substantive (13+ sections per case) but not engine-backed. They support the product claims through narrative, not live computation. This is acceptable for outcome-verified case studies but should be clearly distinguished from engine-generated output.

3. **Executive Reporting entry** aggregates prior results from sessionStorage — a client-side data store. The synthesis is real, but the data source is mutable by the client. Server-side enforcement exists at the route level. **Update 2026-05-07:** `lib/diagnostics/executive-reporting/admission.ts` now provides `evaluateERAdmission()` which cross-validates client-supplied evidence against the server-side `DiagnosticJourney` record. Fabricated stages are detected. Pending integration into checkout flow.

---

## Evidence Classification (Added 2026-05-07)

All evidence outputs are now classifiable via `lib/product/evidence-classification.ts`:

| Classification | Meaning | Current surfaces |
|---------------|---------|-----------------|
| `DEMONSTRATION_CASE` | Deterministic/static demonstration | Homepage refusal demo, micro-proof strip |
| `STATIC_PROOF_ASSET` | Hardcoded evidence dossier | `/evidence/[slug]` pages (3 cases) |
| `VERIFIED_CASE_EVIDENCE` | DB-backed, approved, outcome-verified | `/api/proof/public` (when sample >= 5) |
| `LIVE_ENGINE_OUTPUT` | Real-time engine-generated from user input | All diagnostic results |
| `DEMONSTRATION_FALLBACK` | Canned content shown when DB evidence insufficient | Proof blocks when `approvedCount < 5` |

See `docs/product/proof-fallback-governance.md` for full fallback governance.
