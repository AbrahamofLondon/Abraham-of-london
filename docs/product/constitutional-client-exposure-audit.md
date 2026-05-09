# Constitutional Diagnostic Client Exposure Audit

**Date:** 2026-05-09
**Purpose:** Classify what the Constitutional Diagnostic exposes to users and contain IP leakage

---

## Changes Made in P1

### 1. IntelligenceGainPanel Scoring Removal
**File:** `components/diagnostics/ConstitutionalDiagnostic.tsx`

**Before — raw scoring dimensions displayed:**
- Route (REJECT/DIAGNOSTIC/STRATEGY)
- Confidence (percentage)
- Authority (percentage)
- Coherence (percentage)
- Pressure (percentage)
- Seriousness (percentage)
- Disqualifiers (list)

**After — only computed labels displayed:**
- Route (REJECT/DIAGNOSTIC/STRATEGY) — SAFE_PUBLIC_LABEL
- Confidence (percentage) — ACCEPTABLE_USER_RESULT
- Readiness (tier label: FRAGILE/EMERGING/STABILIZING/EXECUTION_READY/SOVEREIGN) — SAFE_PUBLIC_LABEL
- Posture (label: ORDERED/DRIFTING/MISALIGNED/DISORDERED) — SAFE_PUBLIC_LABEL
- Restrictions (disqualifiers) — ACCEPTABLE_USER_RESULT

**Impact:** Users no longer see Authority%, Coherence%, Pressure%, Seriousness% raw scores. They see computed posture and readiness labels that communicate the same information without exposing the scoring dimensions.

### 2. Product Posture Text Rewritten
**Before:** "This gate is now a real microcosm of the wider estate: interrogation, diagnosis, routing, recommendations, and downstream inheritance."
**After:** "A structural reading that the system remembers. Evidence carries forward into deeper assessment, governed routing, and downstream execution."
**Reason:** Developer language replaced with user-appropriate framing.

### 3. Route Href Fixed
**Before:** `/consulting/strategy-room`
**After:** `/strategy-room`
**Reason:** Stale consulting route.

### 4. Route Description Fixed
**Before:** "justify private strategic escalation"
**After:** "justify governed strategic execution"
**Reason:** "Private advisory/strategic escalation" is consulting language.

---

## Client-Side Exposure Classification

### ApiSuccess Type (still in client-side code)

| Field | Classification | Action |
|-------|---------------|--------|
| `report.authorityScore` | SHOULD_BE_SERVER_ONLY | No longer rendered to user (P1). Server migration P2. |
| `report.coherenceScore` | SHOULD_BE_SERVER_ONLY | No longer rendered to user (P1). Server migration P2. |
| `report.pressureScore` | SHOULD_BE_SERVER_ONLY | No longer rendered to user (P1). Server migration P2. |
| `report.frictionScore` | SHOULD_BE_SERVER_ONLY | No longer rendered to user (P1). Server migration P2. |
| `report.trustScore` | SHOULD_BE_SERVER_ONLY | No longer rendered to user (P1). Server migration P2. |
| `report.seriousnessScore` | SHOULD_BE_SERVER_ONLY | No longer rendered to user (P1). Server migration P2. |
| `report.governanceDiscipline` | SHOULD_BE_SERVER_ONLY | No longer rendered to user (P1). Server migration P2. |
| `report.interventionReadiness` | SHOULD_BE_SERVER_ONLY | No longer rendered to user (P1). Server migration P2. |
| `report.narrativeCoherence` | SHOULD_BE_SERVER_ONLY | No longer rendered to user (P1). Server migration P2. |
| `report.failureModeCount` | SHOULD_BE_SERVER_ONLY | No longer rendered to user (P1). Server migration P2. |
| `report.failureModeSeverity` | SHOULD_BE_SERVER_ONLY | No longer rendered to user (P1). Server migration P2. |
| `report.posture` | SAFE_PUBLIC_LABEL | Rendered as posture label |
| `report.readinessTier` | SAFE_PUBLIC_LABEL | Rendered as readiness label |
| `report.summary` | ACCEPTABLE_USER_RESULT | User-facing summary |
| `report.keyFindings` | ACCEPTABLE_USER_RESULT | User-facing findings |
| `decision.route` | SAFE_PUBLIC_LABEL | Routing outcome |
| `decision.confidence` | ACCEPTABLE_USER_RESULT | Confidence percentage |
| `decision.disqualifiersTriggered` | ACCEPTABLE_USER_RESULT | User needs to know restrictions |
| `decision.recommendedInterventions` | ACCEPTABLE_USER_RESULT | Governed next steps |
| `decision.rationale` | ACCEPTABLE_USER_RESULT | Explanation |
| `routeSummary.*` | SAFE_PUBLIC_LABEL | Display routing |

### Derivation Logic (client-side in lib/diagnostics/)

| Logic | Classification | Risk |
|-------|---------------|------|
| `classifyAuthorityType` thresholds (70, 45) | IP_RISK — visible in browser source | P2: move server-side |
| `classifyPosture` thresholds (35, 70, 45, 60, 65) | IP_RISK — visible in browser source | P2: move server-side |
| `classifyReadinessTier` thresholds (35, 50, 68, 85) | IP_RISK — visible in browser source | P2: move server-side |
| `certaintyWeight` formula (0.45 + certainty/18) | IP_RISK — visible in browser source | P2: move server-side |
| `failureModeCount` conditions | IP_RISK — visible in browser source | P2: move server-side |
| `failureModeSeverity` formula | IP_RISK — visible in browser source | P2: move server-side |
| Score composition formulas | IP_RISK — visible in browser source | P2: move server-side |

---

## P2 Server-Side Migration Plan

### What to move
1. **`lib/diagnostics/constitutional-diagnostic-derivation.ts`** — entire file should execute server-side only
2. **API route** (e.g., `/api/diagnostics/constitutional`) should:
   - Accept raw dual-axis answers
   - Run all scoring, classification, routing server-side
   - Return only: `posture`, `readinessTier`, `route`, `confidence`, `summary`, `keyFindings`, `disqualifiers`, `recommendedInterventions`, `routeSummary`
3. **Client type** should be reduced to only the fields above
4. **Remove** from client bundle: all score fields, all threshold constants, all classification functions

### Files affected
- `lib/diagnostics/constitutional-diagnostic-derivation.ts` → server-only
- `components/diagnostics/ConstitutionalDiagnostic.tsx` → update ApiSuccess type to reduced payload
- API route (create or update) → run derivation server-side

### Risk assessment
- LOW risk of breaking the assessment if done carefully
- The UI already uses only `posture`, `readinessTier`, `route`, and `confidence` after P1
- Raw scores are still in the type but no longer rendered
