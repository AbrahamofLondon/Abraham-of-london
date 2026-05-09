# Field-Level Provenance Standard

## Canonical contract

All shared intelligence items now normalize into `FieldProvenance` in [lib/product/field-provenance-contract.ts](/C:/aol-check-visual/lib/product/field-provenance-contract.ts).

Required fields:

- `fieldKey`
- `sourceSurface`
- `sourceLabel`
- `capturedAt`
- `computedAt`
- `caseId`
- `journeyId`
- `strategyRoomSessionId`
- `executiveRunId`
- `assessmentId`
- `evidencePosture`
- `confidenceLabel`
- `scopeType`
- `scopeId`
- `isMerged`
- `mergedFrom[]`
- `isSuppressed`
- `suppressionReason`
- `comparisonBasis`
- `priorValueDate`
- `currentValueDate`

## Runtime rules

- Missing dates render as `date not available`.
- Missing prior/current comparison dates degrade to `BASELINE_ONLY` or `THIN_STATE`.
- No merged item may collapse multiple sources into anonymous “evidence carried forward” copy when field provenance exists.
- Suppressed items keep suppression provenance instead of disappearing into generic wording.
- Shared intelligence meta now carries `provenance[]` and `comparisonBasis` through [lib/product/intelligence-contract.ts](/C:/aol-check-visual/lib/product/intelligence-contract.ts).

## Implemented normalisers

Implemented in [lib/product/field-provenance-normaliser.ts](/C:/aol-check-visual/lib/product/field-provenance-normaliser.ts):

- `AssessmentEvidenceCapture -> FieldProvenance[]`
- `GovernedMemoryItem -> FieldProvenance[]`
- `PurposeAlignmentEvidenceCarryForward -> FieldProvenance[]`
- `FinancialExposureSnapshot -> FieldProvenance[]`
- `CostOfInactionProjectionSnapshot -> FieldProvenance[]`
- `CheckpointRecord -> FieldProvenance[]`
- `OutcomeVerificationRecord -> FieldProvenance[]`
- Strategy Room consequence evidence -> `FieldProvenance[]`
- Team aggregate evidence -> `FieldProvenance[]`
- Enterprise strain evidence -> `FieldProvenance[]`
- Counsel intake evidence -> `FieldProvenance[]`

## Current closure

- Decision velocity, what-changed, cross-assessment, contradiction map, governed memory, Purpose Alignment carry-forward, financial exposure carry-forward, Return Brief team/enterprise/consequence blocks, and route envelopes now expose canonical provenance.
- Thin-state behavior is explicit instead of implied freshness.
