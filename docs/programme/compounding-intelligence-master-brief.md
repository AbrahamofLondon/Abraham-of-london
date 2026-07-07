# Compounding Decision Intelligence & Moat Activation — Master Programme Brief

**Status:** ACTIVE. Single source of truth for the estate compounding-intelligence programme. Any agent (human or AI, primary or sub) working this programme MUST read this file first and update the ledger — do not work from memory or a partial audit.

**Worktree (authorised, only):** `C:\Dev\aol-estate-construction` · **Branch:** `construction/estate-restoration`
**Programme start:** HEAD `4e14b1e58` @ `2026-07-07T13:12:12Z` · baseline: audit:pricing exit 0, canonical denominator 46, clean tree.

---

## 0. Governing objective

Transform the estate from a collection of individually useful products into **one governed, compounding Decision Operating System** whose value increases with every customer interaction, decision record, outcome, GMI edition, and cross-product transition.

The programme is NOT "add features." It is: **identify → disposition → connect → prove** every valuable capability already built, partially built, implied, or naturally unlockable — so no strategic value is discovered, half-built, and left dormant.

**The programme ends only when** (acceptance, §21 of source brief): architecture comprehensively inventoried; every opportunity dispositioned; highest-value connective opportunities implemented; every relevant product feeds the compounding system; compounding value is customer-visible; cross-product intelligence demonstrable; governance/provenance/tenant-isolation/consent/deletion/portability enforceable; commercial value provable; **no major dormant capability unidentified.**

## 1. Prohibited actions (hard boundaries)
No push · merge · deploy (Netlify/Vercel) · production publication · Stripe Product/Price creation or production mutation · GMI Q2 publication without real final data lock + owner authority · Q1 supersession before actual successor release · fabrication of customer/decision outcomes, evidence, approval, payment, or market data. **Local implementation + coherent local commits are authorised.** Do not ask permission between increments. Stop only for: (a) a prohibited production action, (b) genuinely unavailable external evidence, (c) an irreducible business-policy decision after exhaustive repository evidence.

## 2. Doctrine (non-negotiable)
1. **Connect and compose before inventing.** Do NOT add new intelligence engines unless a real analytical gap is proven (identify capability → prove no engine provides it → why composition insufficient → unique I/O → users → evidence → evaluation). The moat is coherence, not engine count.
2. **No dormant discard.** No interactive decision product may silently produce structured intelligence and throw it away.
3. **Do not narrow to the first obvious opportunity.** The playbook-wiring gap is the *starting hypothesis*, not the programme. Examine the whole estate for dormant/partial/duplicated/latent capability.
4. **Governed, fail-closed, evidence-bound.** Every write flows through governance (capability → readiness → authority → evidence → record). Absence of governance is never permission.
5. **Not-advice boundary preserved everywhere.** Twin/cross-moat outputs are trust assets; crossing into advice destroys the regulated-buyer moat.
6. **Truth over narrative.** Command output overrides any report. Skipped/timeout ≠ pass. Generated artifact presence ≠ runtime proof.

## 3. Target architecture (the compounding loop)
```
CUSTOMER INTERACTION → CANONICAL INTERACTION RECORD → GOVERNED MEMORY WRITE →
STRATEGIC TWIN UPDATE → UNIFIED DECISION INTELLIGENCE (orchestrator) →
CONTRADICTION / DRIFT / EVIDENCE / AUTHORITY ANALYSIS → INTERVENTION CALIBRATION →
GOVERNED NEXT ADMISSIBLE MOVE → CUSTOMER-VISIBLE CONTINUITY →
OUTCOME / CHECKPOINT CAPTURE → CALIBRATION & ACCOUNTABILITY LOOP
```
Every *applicable* product participates (not every product performs every step). Static/reference/retired products are NOT forced into execution flows — but the reason must be explicit.

## 4. Known estate assets (from first strategic audit — VERIFY, do not assume complete)
- `lib/intelligence/decision-intelligence-orchestrator.ts` (~1955 lines, 34 engines; "all surfaces call this" — currently only diagnostics do).
- `lib/product-moat/` — `product-moat-adapter`, `governed-product-memory`, `governed-strategic-twin`, `governed-intervention-calibration`, capability/estate registries.
- `lib/strategic-twin/` — contract, updater, state-loader, simulation-engine, product-twin-adapter.
- `lib/decision-memory/` — contract, store, product-memory-adapter.
- `lib/product/` — `product-knowledge-graph`, `paid-corridor-contract`, decision-centre modules, `living-intelligence-spine`, retainer-cycle memory.
- GMI accountability: `market-intelligence-call-ledger`, DII, `falsification`, source registry.
- Fulfilment spine + reporting lifecycle (monthly recurring, custom engagement) — built by prior increments; emit structured results + durable proofs.
**Confirmed wiring gap:** zero runtime surfaces (`pages/app/components`) write governed memory or update the twin; orchestrator called only by diagnostics. The moat is BUILT_BUT_UNWIRED.

## 5. Phase plan (execute in order unless repo evidence forces adjustment)
**FOUNDATION:** 1 verify baseline · 2 capability census · 3 opportunity ledger · 4 canonical interaction schema · 5 durable propagation/outbox · 6 governed memory/twin adapter · 7 tenant-isolation + provenance proof.
**VERTICAL SLICE:** wire 3 playbooks → prove twin compounding → expose twin snapshot in Decision Centre/Living Layer.
**ESTATE EXPANSION:** instruments · converge diagnostics (no double-orchestration) · Monthly Reporting (longitudinal) · Custom Reporting (scope/version memory) · retainer-cycle memory · checkpoints/outcomes.
**MOAT FUSION:** cross-moat GMI×twin brief · customer decision-integrity trend · governed next-admissible-move engine.
**ENTERPRISE LEVERAGE:** portfolio intelligence · behavioural/calendar signals · bounded simulation/counterfactual · enterprise role/confidentiality.
**PRODUCTISATION:** commercial review · tier continuity · value demonstration · 46-identity coverage sweep · cross-surface sweep.
**FINAL PROOF:** privacy/security · replay/idempotency · performance · build · full regression · ledger closure · clean tree · final report.

## 6. Canonical interaction spine (Foundation — build ONE, do not let products invent their own)
`recordProductInteraction({ actor, tenantId, caseId, engagementId, productCode, interactionType, occurredAt, inputEvidence, structuredResult, contradictions, evidenceGaps, commitments, owners, deadlines, signals, confidence, provenance, consentContext })`
Must: validate canonical product identity · validate tenant/customer ownership · validate case/engagement relationship · generate idempotency identity · preserve input/output provenance · write through governed memory · update twin where admissible · expose downstream orchestration · support intervention calibration · create observable audit record · fail closed on governance denial · prevent cross-tenant contamination · support replay without duplicate memory · support correction/versioning · support deletion + retention. **Reuse existing `governed-product-memory` + `governed-strategic-twin`; do not fork a parallel framework.**

## 7. Durable propagation (outbox or equivalent — inspect existing infra first)
transaction commits interaction → durable event/outbox record → governed consumers (memory, twin, orchestrator, intervention calibration, continuity, analytics), each idempotent, retryable, dead-lettered with operator visibility. Required event fields: correlationId, causationId, schemaVersion, tenantId, productCode, caseId, sourceInteractionId, processingStatus, retryCount, failureReason. **No in-memory-only bus counts as complete.**

## 8. Governance / privacy / tenant / provenance (mandatory before "estate-wide complete")
- **Tenant isolation:** tenant A cannot read/mutate tenant B memory/twin; case A cannot leak to unrelated case B; admin/reviewer boundaries; deleted records absent from active read models; replay cannot recreate revoked data; export correctly scoped. **Negative tests mandatory.**
- **Portability/trust:** export, correction, deletion, retention policy, consent record, case-transfer policy, version provenance, audit trail. Moat = accumulated insight + coherence + governance + history + calibration, NOT data lock-in.
- **Provenance/explainability:** every twin-derived/cross-moat output traceable to source interaction → product → run → input evidence → structured result → memory record → twin version → GMI edition (where applicable) → transformation/version → timestamp. System must answer "Why is this shown?" with evidence. No opaque recommendations.
- **Versioning/recomputation:** version interaction/memory/twin/orchestrator/scoring/calibration/next-move/GMI-edition/integrity schemas; old records remain interpretable; recomputation preserves prior version + records reason; never silently rewrite history.
- **Observability:** interaction-accepted, memory/twin/orchestrator/calibration/next-move states, retry/dead-letter, correlationId, failureReason, operator action. Health checks must exercise real dependency chains, not just imports.

## 8a. GMI fusion rules (§14)
`crossMoatBrief(caseId, editionId)` joins customer twin (commitments/drift/contradictions/dependencies/evidence-gaps/intervention-history) with GMI (regime view, scored call ledger, falsification triggers, scenario assumptions, DII, revision history, source confidence). Preserve: evidence provenance · GMI edition identity · twin version · timestamp · not-advice boundary · uncertainty · falsification triggers. **Reading an edition is an EXPOSURE event; agreement/adoption requires explicit customer action — never infer agreement from a read.**

## 8b. Customer decision-integrity loop (§15) — bounded, evidence-only
Measure PROCESS quality only: evidence discipline, owner clarity, commitment integrity, falsifiability, checkpoint discipline, revision discipline, response-to-warning, contradiction handling, outcome capture. NEVER score morality/intelligence/personality/worth. Every score explainable from recorded evidence. No opaque psychometrics, no fake precision.

## 8c. Next-best-decision engine (§16) — governed, state-derived, not revenue-maxing
Derive next admissible move from customer state (problem state, evidence sufficiency, contradiction severity, urgency, exposure, tier, prior use, unresolved commitments, intervention history, controlled-access constraints, commercial eligibility). Proof required: different twin state → different move; insufficient evidence → evidence-gathering move (not upsell); controlled → controlled route; ineligible/retired → excluded; completed → not redundantly recommended; manual-billing → request/qualification; free → no fake checkout.

## 9. Machine-readable artifacts (tracked; NOT the Markdown as authority)
- `artifacts/validation/product-intelligence/capability-census.json` — Phase-Zero census.
- `artifacts/validation/product-intelligence/development-opportunity-ledger.json` — master ledger.
- `artifacts/validation/product-intelligence/identity-coverage-matrix.json` — 46-identity sweep.
- `artifacts/validation/product-intelligence/surface-coverage.json` — cross-surface sweep.
Schemas: see §10–§11.

## 10. Census schema (per module/subsystem)
`{ path, purpose, ownerDomain, runtimeCallers[], runtimeOutputs[], persistence, productsConsuming[], productsThatShouldConsume[], testCoverage, commercialSignificance, privacySignificance, governanceSignificance, duplicationRisk, classification }`
**classification ∈** LIVE_AND_COMPOUNDING · LIVE_BUT_ISOLATED · PARTIALLY_WIRED · BUILT_BUT_UNWIRED · DUPLICATED_CAPABILITY · OBSOLETE_OR_SUPERSEDED · MISSING_CONNECTIVE_ADAPTER · MISSING_READ_MODEL · MISSING_OUTCOME_LOOP · COMMERCIALISATION_OPPORTUNITY · GOVERNANCE_GAP · PERFORMANCE_OR_SCALE_RISK.

## 11. Opportunity-ledger schema (per opportunity)
`{ opportunityId, title, sourceModule, affectedProducts[], customerValue, enterpriseValue, compoundingEffect, commercialValue, defensibilityValue, technicalDependency, governanceDependency, privacyDependency, implementationSize, performanceRisk, migrationRisk, evidenceBasis, disposition, reason, implementationCommit, proofTest, remainingDependency }`
**disposition ∈** BUILD_NOW · BUILD_AFTER_FOUNDATION · DEFER_EXTERNAL_DEPENDENCY · DEFER_PERFORMANCE_DEPENDENCY · REJECT_DUPLICATIVE · REJECT_LOW_VALUE · RETIRE_OBSOLETE. **No entry may be UNREVIEWED/TBD/MAYBE/LATER without an explicit dependency + reason.** Final report must account for EVERY entry; unreviewed = 0.

## 12. 46-identity coverage schema (per canonical identity, from canonical-estate-universe.json)
`{ code, identityType, createsStructuredSignal, shouldRemember, shouldUpdateTwin, shouldInvokeOrchestrator, affectsInterventionCalibration, affectsNextMove, showsContinuity, receivesCrossMoat, contributesOutcomes, applicability (PARTICIPATES | STATIC_REFERENCE | RETIRED | INTERNAL | NOT_APPLICABLE), reason }`. No identity omitted.

## 13. Cross-surface sweep (§37): diagnostics, playbooks, instruments, boardroom brief, executive reporting, monthly reporting, custom reporting, strategy room, retainers, GMI, decision centre, living layer, enterprise assessment, fast diagnostic, purpose-alignment/personal-decision-audit, admin fulfilment, customer status. Catch opportunities hidden between product identities.

## 14. Performance guardrails (§34)
Build previously spent heavy time in page-data/static-generation. New connective work must NOT worsen build-time global scanning. Avoid: build-time large-registry imports, filesystem scans, static route explosion, eager twin/GMI joins, large page props. Prefer: runtime read models, bounded queries, cached derived state, incremental recomputation, explicit invalidation.

## 15. Acceptance / final verdict
PASS only if: architecture inventoried; every ledger opportunity dispositioned (unreviewed=0); all BUILD_NOW implemented+proven; every applicable product feeds the system; compounding value customer-visible; cross-product intelligence demonstrable; tenant-isolation/provenance/consent/deletion/portability enforced with negative tests; commercial value explained; compounding proven deterministically (multi-run twin evolution + outcome recalibration + next-move change); full regression + production build green; worktree clean.
Verdict string: **PASS — COMPOUNDING DECISION INTELLIGENCE PROGRAMME COMPLETE …** else **BLOCKED — … INCOMPLETE** with exact remaining opportunities. Forbidden closers: "phase 1 complete", "next we could", "opportunities for later", "tell me which to build", "architecture is ready", "another agent may be working".

## 16. Commit discipline
Coherent local commits (see source §40 suggested sequence). Do not push. Every commit references its ledger opportunityId(s).

## 17. Execution log (append-only — every agent updates)
- 2026-07-07T13:12Z — Programme opened. Baseline verified (HEAD 4e14b1e58, audit 0, denom 46). This brief authored (commit e1a9fc399). Census + coverage sweeps dispatched to sub-agents.
- 2026-07-07T13:20Z — Sub-agents complete. capability-census.json (49 modules; 0 LIVE_AND_COMPOUNDING; 20 BUILT_BUT_UNWIRED; 3 GOVERNANCE_GAP incl memory/twin no-tenant; 4 DUPLICATED incl 2 stores/2 orchestrators). identity-coverage (34/46 PARTICIPATE). Opportunity ledger authored: 25 opps, unreviewed=0.
- 2026-07-07T14:31Z — **FOUNDATION built + proven (commit 9ce64dd3b).** OPP-01/02/03 canonical interaction spine: recordProductInteraction with tenant+case isolation (closes GOVERNANCE_GAP), idempotency, correction/versioning, deletion+tombstone, provenance, versioned twin. 12 tests incl CENTRAL compounding proof (twin v1→v2→v3, contradictions preserved, irrelevant signal isolated, cross-tenant/case denied, deletion blocks replay). tsc 0.
- NEXT (continuation): OPP-05 wire 3 playbooks to spine at runtime (compose real governed-product-memory + strategic-twin via the injectable ports) + expose twin snapshot in Decision Centre (OPP-14); then OPP-04 outbox, OPP-06 instruments, OPP-08 retainers, OPP-09/10 reporting, OPP-11 crossMoatBrief, OPP-12 integrity trend, OPP-13 next-move, OPP-15 outcomes, then estate sweep + full regression + build + ledger closure. Ledger implementationCommit for OPP-01/02/03 = 9ce64dd3b.
