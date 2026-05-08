# Constitutional Bridge Enrichment Audit

> Date: 2026-05-08
> Scope: Bridge architecture before and after enrichment

---

## What was captured before

The existing bridge (`lib/diagnostics/constitutional-bridge.ts`) transmitted:

| Field | Type | Consumer |
|-------|------|----------|
| authorityScore, coherenceScore, pressureScore, frictionScore, trustScore | Numbers (0-100) | Team Assessment, ER, SR |
| posture, readinessTier, authorityType | String enums | All downstream |
| seriousnessScore | Number | Team Assessment |
| prompts (conditional) | String[] | Team Assessment |
| hypotheses | String[] | Team Assessment |
| headline, principalRisks | String/String[] | Executive Reporting |
| mandateDraft, risksToContainFirst | String/String[] | Strategy Room |
| boardLevelQuestion | String | Executive Reporting |

**What was reduced to scores:** User answers (resonance/certainty values) were scored and averaged. The raw responses, their meaning, and the contradictions between them were discarded.

**What was lost before Strategy Room:** Why trust was low (was it political punishment? Information hoarding? Hierarchy?), what the user had already tried, what they were avoiding, what specific friction looked like.

**What was lost before Executive Reporting:** Prior correction history, cost of delay text from upstream, whether the user's avoidance pattern was already detected, contradiction context.

**What was lost before Return Brief:** Whether Constitutional signals predicted the pattern that later manifested, recurrence evidence, avoidance basis.

---

## What is captured after enrichment

The new evidence bridge (`lib/diagnostics/constitutional-evidence-bridge.ts`) adds:

| Field | Type | Source | Consumer |
|-------|------|--------|----------|
| evidenceSignals.authority | Interpreted signal with polarity | q2, q7 scores | ER, SR, Oversight |
| evidenceSignals.coherence | Interpreted signal with polarity | q1 score | ER, SR, Return Brief |
| evidenceSignals.trust | Interpreted signal with polarity | q5 score | ER, SR, Oversight, Control Room |
| evidenceSignals.execution | Interpreted signal with polarity | q4, q6, q9 scores | ER, SR, Return Brief, Oversight |
| evidenceSignals.externalPressure | Interpreted signal with polarity | q3, q8, q10 scores | ER, SR |
| contradictionSignals[] | Typed contradictions with basis and source questions | Cross-question analysis | All downstream |
| priorAttemptSignal | Upstream prior-attempt text | CanonicalDecisionObject | ER, SR, Return Brief, Oversight |
| costOfInactionSignal | Upstream cost-of-delay text with optional parsed amount | CanonicalDecisionObject | ER, SR, Oversight |
| avoidanceSignal | Detected avoidance from upstream + q9 recurrence | Purpose Alignment + q9 | Return Brief, SR, Oversight |
| recurrenceSignal | Pattern recurrence with confidence | q9 + upstream recurrence data | All downstream |
| verificationGap | Honest gap marker | Static | ER (prompts verification question) |
| immediateDecisionGap | Honest gap marker | Static | SR (prompts decision extraction) |

---

## Upstream fields bridged (P1 enrichments)

| Signal | Source Field | Source File | Bridged? |
|--------|------------|------------|----------|
| Prior attempt text | `CanonicalDecisionObject.priorAttemptText` | `lib/diagnostics/evidence-graph.ts` | YES — via `upstream.priorAttemptText` |
| Cost of delay text | `CanonicalDecisionObject.costOfDelayText` | `lib/diagnostics/evidence-graph.ts` | YES — via `upstream.costOfDelayText` |
| Avoided decision | `contextAnswers.avoidedDecision` | `lib/alignment/PurposeAlignmentAssessment.tsx` | YES — via `upstream.avoidedDecision` |
| Pattern recurrence count | `PatternRecurrenceResult.recurringContradictions.length` | `lib/diagnostics/pattern-recurrence.ts` | YES — via `upstream.patternRecurrenceCount` |
| Resolved pattern reappeared | `PatternRecurrenceResult.resolvedPatternReappeared` | `lib/diagnostics/pattern-recurrence.ts` | YES — via `upstream.resolvedPatternReappeared` |

---

## Contradiction signals detected

| Type | Condition | Severity |
|------|-----------|----------|
| AUTHORITY_WITHOUT_TRUST | authority >= 60 AND trust < 40 | HIGH |
| URGENCY_WITHOUT_CAPACITY | pressure >= 65 AND interventionReadiness < 40 | HIGH |
| OBJECTION_POLITICISED | q5 resonance <= 3 AND certainty >= 7 | HIGH |
| RECURRING_FAILURE | q9 resonance >= 7 AND certainty >= 6 | MEDIUM-HIGH |
| EXTERNAL_PRESSURE | q10 resonance >= 7 AND coherence < 50 | MEDIUM |
| EXECUTION_DRIFT | q4 resonance >= 7 AND q1 resonance >= 6 | MEDIUM |

---

## What is additive vs what changes existing behaviour

| Change | Type | Risk |
|--------|------|------|
| New file `constitutional-evidence-bridge.ts` | Additive | Zero — new file |
| New `evidenceBridge` return field in orchestrator | Additive | Zero — existing `bridge` field unchanged |
| New `evidenceBridge` in `persistDiagnosticStage` payload | Additive | Zero — payload is JSON, accepts any shape |
| New `upstream` parameter in orchestrator input | Additive, optional | Zero — defaults to undefined |
| Existing score-based bridge | UNCHANGED | Zero |
| Existing routing logic | UNCHANGED | Zero |
| Existing question definitions | UNCHANGED | Zero |

**Nothing was removed, renamed, or restructured. Every change is additive.**

---

## Downstream consumer access

| Consumer | How It Accesses Evidence Bridge | Status |
|----------|-------------------------------|--------|
| Strategy Room | Via `persistDiagnosticStage` payload → read from journey store | AVAILABLE (data persisted) |
| Executive Reporting | Via `persistDiagnosticStage` payload → read from journey store | AVAILABLE (data persisted) |
| Return Brief | Via `persistDiagnosticStage` payload → read from journey store | AVAILABLE (data persisted) |
| Oversight Brief | Via journey evidence nodes | AVAILABLE (data persisted) |
| ConstitutionalDiagnostic.tsx | Not needed — evidence bridge is for downstream, not the assessment itself | N/A |

**Note:** Downstream surfaces can now access the evidence bridge but do not yet render it. UI integration is a separate pass — the data is available for when it is needed.
