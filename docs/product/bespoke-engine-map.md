# Bespoke Engine Map

**Date:** 2026-05-07
**Purpose:** Locate and document all existing engines that produce user-specific output.

---

## Discovered Bespoke Engines

### 1. Synthesis Engine

**File:** `lib/decision/synthesis-engine.ts`
**Functions:** `synthesise()`, `buildSynthesisPrompt()`, `deterministicFallback()`, `buildDeterministicOutput()`
**Input:** `CaseObject` (user's decision, prior attempt, cost of delay, claimed owner, blocker, forced action)
**Output:** `GovernedSynthesis` (verdict, primaryContradiction, avoidedDecision, whyPriorAttemptsFailed, concreteMove, quotedUserLanguage[], c3Score)
**User-specific:** YES — extracts user words, detects contradiction between answers, quotes user language
**Persisted:** YES — via diagnostic record and sessionStorage
**Rendered:** YES — Fast Diagnostic result page
**Surfaces using:** Fast Diagnostic
**Surfaces that should use:** Executive Reporting (inherited), Strategy Room (inherited via spine)

### 2. Anchor Narrative Engine

**File:** `lib/server/decision/narrative-engine.server.ts`
**Functions:** `composeAnchorNarrative()`
**Input:** `DecisionAnchors` (decision, competingPriority, consequence, avoidedDecision, blocker, forcedAction, priorAttempt, authorityInput), `AnchorContradiction[]`, classification context
**Output:** `AnchorNarrative` (8 sections: opening, condition, whyItExists, pattern, costOfInaction, perspective, requiredMove, cta)
**User-specific:** YES — every section anchored to user's actual inputs. Falls back to classification-derived text only when anchor field is empty.
**Persisted:** YES — part of diagnostic result
**Rendered:** YES — Fast Diagnostic result
**Surfaces using:** Fast Diagnostic
**Surfaces that should use:** Executive Reporting, Strategy Room briefing

### 3. Constitutional Orchestration Engine

**File:** `lib/engine/orchestrator.ts` (calls `lib/constitution/assessment-engine.ts`)
**Functions:** `runConstitutionalOrchestration()`, `runConstitutionalAssessment()`
**Input:** User's 10 dual-axis answers across 9 constitutional domains
**Output:** Authority type, posture, readiness tier, route (STRATEGY/DIAGNOSTIC/REJECT), failure modes, confidence
**User-specific:** YES — derived from user's specific resonance × certainty scores
**Persisted:** YES — `persistDiagnosticStage()` with full payload
**Rendered:** YES — Constitutional Diagnostic result
**Surfaces using:** Constitutional Diagnostic
**Surfaces that should use:** ER (inherited via spine), Strategy Room (via handoff)

### 4. Purpose Alignment Scoring Engine

**File:** `lib/alignment/PurposeAlignmentAssessment.tsx` (calls `scorePurposeProfile()`)
**Input:** User's dual-axis answers across 6 domains
**Output:** `PurposeProfileResult` (pattern, coherence band, domain profiles, contradictions with evidence, corrections)
**User-specific:** YES — patterns derived from user's specific answers with cited evidence
**Persisted:** YES — via `/api/purpose-alignment/assessments`
**Rendered:** YES — Purpose Alignment result
**Surfaces using:** Purpose Alignment

### 5. Team Assessment Gap Engine

**File:** `pages/diagnostics/team-assessment.tsx` (local computation)
**Functions:** `calculateFragility()`, domain gap analysis
**Input:** Leader perception vs. estimated team reality scores
**Output:** Perception gaps, fragility classification, domain-level severity
**User-specific:** YES — gaps derived from leader's specific perception ratings
**Persisted:** YES — `saveDiagnosticRecord()` with kind="team-alignment"
**Rendered:** YES — Team Assessment result

### 6. Enterprise Assessment Engine

**File:** `pages/diagnostics/enterprise-assessment.tsx` (local computation)
**Input:** Section-by-section axis scoring across 5 structural blocks
**Output:** Enterprise pressure map, risk score, escalation routing
**User-specific:** YES — domain-by-domain analysis of user's organisational inputs
**Persisted:** YES — `saveDiagnosticRecord()` with kind="enterprise"
**Rendered:** YES — Enterprise Assessment result

### 7. C3 Fidelity Scorer

**File:** `lib/decision/c3-fidelity-scorer.ts`
**Functions:** `scoreC3()`
**Input:** User's decision, constraint, cost of delay, prior attempt, stakeholder
**Output:** `C3Score` (clarity, context, consequence, fidelity)
**User-specific:** YES — scores specificity of user's actual inputs
**Persisted:** YES — part of synthesis result
**Rendered:** YES — indirectly via evidence tier display

### 8. Decision Authority Enforcement

**File:** `lib/diagnostics/authority-enforcement.ts`
**Functions:** `enforceStrategyRoomAccess()`
**Input:** User email → durable thread from constitutional intake
**Output:** `EnforcementResult` (allowed, directive, reason, threadSource)
**User-specific:** YES — derives from user's actual constitutional assessment
**Persisted:** YES — via durable thread in DB
**Rendered:** YES — via AdmissionNotice

### 9. Living Case Derivation

**File:** `lib/product/living-case-store.ts`
**Functions:** `deriveLivingCase()`, `getLatestLivingCaseForActor()`, `isAdmissibleFor()`
**Input:** Email/subjectId → DiagnosticJourney from Prisma
**Output:** `LivingCase` (decisions, contradictions, evidence nodes, tensions, route decisions, evidence tier, case status)
**User-specific:** YES — assembled from user's actual journey data
**Persisted:** YES (read-only view over existing Prisma models)
**Rendered:** Partially — via admission modules

### 10. Signal Continuity Derivation

**File:** `lib/product/signal-continuity.ts`
**Functions:** `deriveSignalContinuity()`, `deriveContradictionContinuity()`
**Input:** Signal key + journey history
**Output:** `ContinuityResult` (continuity type, reason, prior occurrences, trend)
**User-specific:** YES — searches user's actual evidence nodes and tension thread
**Persisted:** No (computed on demand)
**Rendered:** YES — via ContinuityStatement component

---

## Bespoke Reference Contract

The canonical bespoke reference contract already exists in the codebase:

- **`CaseObject`** (`lib/decision/case-object.ts`) — user's decision in their words
- **`GovernedSynthesis`** (`lib/decision/synthesis-engine.ts`) — bespoke verdict with quoted user language
- **`AnchorNarrative`** (`lib/server/decision/anchor-types.server.ts`) — 8 sections each anchored to user input
- **`DiagnosticEvidenceNodeInput`** (`lib/diagnostics/evidence-graph.ts`) — typed evidence units with source stage
- **`CanonicalDecisionObject`** (`lib/diagnostics/evidence-graph.ts`) — decision with constraints, stakeholders, velocity

No new contract type is needed. These existing types already support all required bespoke references.
