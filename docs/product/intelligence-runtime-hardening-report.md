# Intelligence Runtime Hardening Report

Date: 2026-05-09
Pass: P0 Intelligence Layer Runtime Hardening
Status: Implemented with remaining partials explicitly noted

## Goal

Harden the intelligence layer so it behaves as case-bound institutional memory rather than attractive but unsafe shared decoration.

## Files Changed

Core runtime contract and analytics:

- `lib/product/intelligence-contract.ts`
- `lib/product/decision-centre-contract.ts`
- `lib/analytics/decision-velocity.ts`
- `lib/analytics/what-changed.ts`
- `lib/analytics/cross-assessment-intelligence.ts`
- `lib/analytics/contradiction-graph-presenter.ts`
- `pages/api/decision-centre/cases.ts`

Shared intelligence components:

- `components/Intelligence/ClientIntelligenceStack.tsx`
- `components/Intelligence/DecisionVelocityCard.tsx`
- `components/Intelligence/WhatChangedPanel.tsx`
- `components/Intelligence/CrossAssessmentInsight.tsx`
- `components/Intelligence/ContradictionMapPreview.tsx`

Surface integrations:

- `pages/diagnostics/fast.tsx`
- `pages/diagnostics/executive-reporting/run.tsx`
- `pages/strategy-room/index.tsx`
- `pages/strategy-room/session/[id].tsx`
- `app/briefing/return/[sessionId]/page.tsx`
- `pages/intelligence/memory.tsx`
- `pages/intelligence/contradictions.tsx`
- `pages/decision-centre.tsx`

API scope handoff:

- `app/api/executive-reporting/run/route.ts`
- `app/api/strategy-room/session/init/route.ts`

IP containment comments:

- `components/Intelligence/DecisionTracePanel.tsx`
- `components/Intelligence/DeterminismProof.tsx`
- `components/Intelligence/SpineRenderer.tsx`
- `components/Intelligence/KnowledgeGraph.tsx`
- `components/Intelligence/DiscoveryOverlay.tsx`

## What Was Fixed

### 1. Shared intelligence is now scope-driven

- `ClientIntelligenceStack` now requires explicit `scope`.
- It no longer falls back to `json.cases[0]` when a case id is missing.
- It renders explicit empty/thin states instead of silently disappearing.

### 2. The case API now carries runtime truth metadata

- `/api/decision-centre/cases` now returns:
  - `generatedAt`
  - `dataQuality`
  - `emptyState`
- `DecisionCentreCase` now carries:
  - `scope`
  - `lastEvidenceAt`

### 3. Decision velocity is hardened

- Distinguishes:
  - `NO_DATA`
  - `FIRST_CHECKPOINT_CREATED`
  - `MEASURED_PERSONAL`
  - `TREND_AVAILABLE`
- Copy now explicitly states when no velocity has been measured yet.
- Fast Diagnostic fallback now identifies itself as baseline/thin rather than mature history.

### 4. What Changed is date-gated

- `WhatChangedSummary` now carries:
  - `scopeCaseId`
  - `previousObservedAt`
  - `currentObservedAt`
  - `meta`
- The card refuses to present a faux comparison without two dated observations.

### 5. Contradiction cards no longer hardcode posture

- Contradiction items now carry:
  - `sourceLabel`
  - `capturedAt`
  - `lastSeenAt`
  - `evidencePosture`
  - `confidenceLabel`
  - `currentStatus`
  - `suggestedNextAction`
- The component now renders those fields instead of hard-coded `system inferred`.

### 6. Irreversibility now shows provenance

- Decision Centre, Executive Reporting, and Strategy Room session now expose:
  - source
  - date
  - evidence posture
  - basis / limitation

### 7. Standalone intelligence pages now have real empty/thin behavior

- `/intelligence/memory`
- `/intelligence/contradictions`

Both now declare account-wide scope and rely on explicit empty/thin runtime messaging rather than silent null output.

### 8. Executive Reporting intelligence lane was cleaned up

- direct `AI baseline` phrasing removed
- duplicate contradiction block removed
- shared intelligence stack is now scoped to the report-linked case/run

## Before / After Surface Verdicts

| Surface | Before | After | Verdict | Remaining risk |
|---|---|---|---|---|
| Decision Centre | Strongest surface, but `What changed` was thin and irreversibility lacked provenance | Cards now carry scope/provenance; `What changed` is date-gated | `PASS` | `What changed` history depth still depends on fuller prior-state persistence |
| Fast Diagnostic | Velocity fallback could feel more mature than it was | Fallback is explicitly baseline/thin and scoped | `PASS` | no external benchmark, by design |
| Return Brief | Unscoped shared velocity could show the wrong case | Shared velocity now resolves through explicit Return Brief scope | `PASS` | other Return Brief evidence blocks still contain some hard-coded provenance language outside the shared stack |
| Executive Reporting | Unscoped, duplicated contradiction lane, unsupported AI-baseline copy | Scoped stack, contradiction duplication removed, copy hardened | `PARTIAL` | page still dense; governed comparison-set block remains when claim governance allows it |
| Strategy Room Entry | Cross-assessment could bind to the wrong case | Shared stack now scoped through Strategy Room entry/session context | `PASS` | scope is session-first rather than deep field-level provenance |
| Strategy Room Session | Irreversibility useful but thin on provenance | Irreversibility now shows source/date/basis | `PASS` | still estimate-level, intentionally |
| `/intelligence/memory` | Thin shell page | Explicit account-wide scope plus empty/thin states | `PASS` | maturity still limited by available history |
| `/intelligence/contradictions` | Thin shell page with incomplete contradiction truth surface | Explicit account-wide scope plus empty/thin states and stronger contradiction metadata | `PASS` | still not a full timeline view |

## Remaining Runtime Risks

Brutally honest remaining gaps:

1. Field-level provenance for merged `evidenceCapture` is still not implemented.
   The new pass hardens surface-level provenance, not every merged evidence field.

2. Return Brief narrative blocks outside the shared intelligence stack still use some hard-coded provenance phrases.
   The main scoping bug is fixed, but the document-level evidence metadata is not fully normalized.

3. Executive Reporting is safer, but still crowded.
   The contradiction cleanup landed, but the page remains one of the densest public runtime surfaces.

4. Admin/internal intelligence components are commented and classified, not physically relocated yet.
   Public routes are safe today, but import-boundary hardening could still be stronger.

## Verification

- `npx tsc --noEmit --pretty false` passed
- `npx next build` passed

Build warnings remain pre-existing and unrelated to this pass:

- custom cache-control warning
- broad file tracing via `process.cwd()`
- `/vault` large page data warning

## Final Judgment

This pass materially improves runtime truthfulness.

The intelligence layer is now substantially harder to mistake for loose shared decoration because:

- scope is explicit
- dated provenance is visible
- thin states are honest
- contradiction posture is derived
- unsupported AI-baseline copy is gone

What remains incomplete is mostly deeper provenance normalization and page simplification, not the core hardening objective.
