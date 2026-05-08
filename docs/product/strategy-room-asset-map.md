# Strategy Room Asset Map

**Date:** 2026-05-07

---

## Components (`components/strategy-room/` — lowercase, canonical)

| Component | Purpose | Props | Active Import | Classification |
|-----------|---------|-------|--------------|---------------|
| **DecisionStateBanner** | Case state display (PENDING/EXECUTED/BLOCKED/ESCALATED/FAILED) | `{ state, escalationLevel? }` | YES — `pages/strategy-room/index.tsx` | CORE_EXECUTION_COMMAND |
| **DynamicConsequencePanel** | Live consequence exposure with deltas and penalties | `{ currentExposure, previousExposure?, baseRisk?, timePenalty?, failurePenalty? }` | YES — `pages/strategy-room/index.tsx` | CORE_EXECUTION_COMMAND |
| **AvoidancePatternNotice** | Repeated avoidance pattern with count + label | `{ avoidanceCount, repeatedPatternLabel? }` | YES — `pages/strategy-room/index.tsx` | CORE_EXECUTION_COMMAND |
| **EscalationTriggerPanel** | Escalation trigger list with type/message/date | `{ triggers: Trigger[] }` | YES — `pages/strategy-room/index.tsx` | CORE_EXECUTION_COMMAND |
| **ExecutionFlow** | 8-stage escalation flow with micro-tension validation and challenge engine | `{ inheritedDecision?, inheritedBlocker?, inheritedConsequence?, onComplete }` | YES — `pages/strategy-room/index.tsx` | CORE_EXECUTION_COMMAND |
| **RetainerEntryGate** | Retainer qualification gate with eligibility display | `{ qualification: RetainerQualification \| null }` | YES — `pages/strategy-room/index.tsx`, `pages/diagnostics/executive-reporting/run.tsx` | CORE_EXECUTION_COMMAND |
| **ReturnBriefInterruptionBar** | Return Brief link bar with session-based fetch | `{ sessionKey }` | YES — `pages/strategy-room/session/[id].tsx` | CORE_EXECUTION_COMMAND |
| **AdvantagePathBlock** | Opportunity moves alongside required actions | `{ data: AdvantagePath \| null }` | YES — `pages/strategy-room/index.tsx`, ER run | SUPPORTING |
| **AIInterventionSuggestions** | AI leverage interventions mapped to risks | `{ suggestions: InterventionSuggestion[] }` | YES — `pages/strategy-room/index.tsx` | SUPPORTING |
| **ConstitutionalFollowupPanel** | Authority-based intervention deployment | Complex (route, authority, readiness) | YES — ConstitutionalResultSurface | SUPPORTING |
| **ConstitutionalResultSurface** | Full constitutional result with narrative + followup | Complex | YES — `pages/strategy-room/index.tsx` | SUPPORTING |
| **DecisionGuidancePanel** | Recommendation display with asset kinds | `{ recommendations: Recommendation[] }` | YES — `pages/strategy-room/index.tsx` | SUPPORTING |
| **DecisionAssetCard** | Card wrapper for asset links | `{ asset, sessionKey, rank, routeAfter? }` | YES — `pages/strategy-room/index.tsx` | SUPPORTING |
| **DecisionAssetLink** | Clickable asset link with tracking | `{ asset, followupPayload? }` | YES — DecisionAssetCard | SUPPORTING |
| **Form.tsx** | Multi-stage form with scoring model | Complex state machine | YES — `pages/strategy-room/index.tsx` (possibly) | SUPPORTING |
| **ArtifactGrid** | Governed artifact access surface | Client component with localStorage | Unclear | DORMANT_BUT_VALUABLE |
| **StrategyRoomConversionBridge** | Checkout/conversion UI with price and signals | `{ className?, price?, checkoutPriceCode? }` | YES — `pages/strategy-room/index.tsx`, ER run | SUPPORTING |

## Components (`components/StrategyRoom/` — PascalCase, ORPHANED)

| Component | Purpose | Active Import | Classification |
|-----------|---------|--------------|---------------|
| **Form.tsx** | Framer Motion form with router safety | ZERO imports anywhere | LEGACY — safe to delete |
| **IntakeForm.tsx** | Router-safe intake form | ZERO imports anywhere | LEGACY — safe to delete |

---

## Libraries (`lib/strategy-room/`)

| Module | Purpose | Exports | Classification |
|--------|---------|---------|---------------|
| **admission.ts** | Server-side admission enforcement | `evaluateStrategyRoomAdmission()` | CORE_EXECUTION_COMMAND |
| **enrol-core.ts** | Enrollment pipeline with admission-aware email | `processStrategyRoomEnrolment()` | CORE_EXECUTION_COMMAND |
| **execution-record.ts** | Persist structured decision execution logs | `persistStrategyExecutionRecord()`, `findLatestStrategyExecutionRecord()` | CORE_EXECUTION_COMMAND |
| **execution-feedback.ts** | Decision change propagation to thread/trajectory | `propagateDecisionChange()` | CORE_EXECUTION_COMMAND |
| **session-service.ts** | PostgreSQL-backed session management | `createStrategySession()` | CORE_EXECUTION_COMMAND |
| **persistence.ts** | Raw SQL operations (Neon serverless) | Session/impression/followup types | SUPPORTING |
| **canonical-snapshot.ts** | Version + serialize canonical state | `CanonicalSectionsSnapshot` type | SUPPORTING |
| **client-trackers.ts** | Client-side analytics/tracking | Various tracking functions | SUPPORTING |

---

## Casing Duplication Summary

- **Canonical path:** `components/strategy-room/` (lowercase) — all 14 active imports use this
- **Orphaned path:** `components/StrategyRoom/` (PascalCase) — zero imports, 2 unused files
- **Risk:** Case-sensitivity on Linux/Netlify deployments
- **Recommendation:** Delete `components/StrategyRoom/` directory after confirming no build reference
