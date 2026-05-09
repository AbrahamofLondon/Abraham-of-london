# Constitutional Client Exposure Closure Report

**Date:** 2026-05-09
**Status:** CLOSED — no scoring mechanics visible in rendered UI

---

## Architecture Summary

The Constitutional Diagnostic has a clean server/client boundary:

### Server-Side Only (confirmed)
- `lib/diagnostics/constitutional-diagnostic-derivation.ts` — ALL scoring functions, thresholds, formulas
- `lib/engine/orchestrator.ts`, `classifier.service.ts`, `narrative.service.ts` — consumers of derivation
- `pages/api/diagnostics/constitutional-intake/report.ts` — API route that runs derivation
- `lib/diagnostics/public-constitutional-result.ts` — sanitizer that "strips all scoring, thresholds, signals, and engine internals"

### Client-Side
- `components/diagnostics/ConstitutionalDiagnostic.tsx` — imports ONLY type definitions and question constants from the derivation file, NOT scoring functions

---

## What the User Sees (After P1 + P2)

| Element | Visible? | Content |
|---------|----------|---------|
| Route | YES | REJECT / DIAGNOSTIC / STRATEGY |
| Confidence | YES | Percentage (e.g., "78%") |
| Posture | YES | ORDERED / DRIFTING / MISALIGNED / DISORDERED |
| Readiness tier | YES | FRAGILE / EMERGING / STABILIZING / EXECUTION_READY / SOVEREIGN |
| Authority type | YES | DIRECT / PROXY / UNCLEAR |
| Summary | YES | Narrative text |
| Key findings | YES | String array |
| Disqualifiers | YES | String array (only if triggered) |
| Recommended interventions | YES | String array |

## What the User Does NOT See

| Element | Status |
|---------|--------|
| authorityScore (raw %) | NOT rendered (in type but unused) |
| coherenceScore (raw %) | NOT rendered |
| pressureScore (raw %) | NOT rendered |
| frictionScore (raw %) | NOT rendered |
| trustScore (raw %) | NOT rendered |
| seriousnessScore (raw %) | NOT rendered |
| governanceDiscipline (raw %) | NOT rendered |
| interventionReadiness (raw %) | NOT rendered |
| narrativeCoherence (raw %) | NOT rendered |
| failureModeCount | NOT rendered |
| failureModeSeverity | NOT rendered |
| Scoring dimension names | NOT mentioned — replaced with "structural signals" |
| Threshold values (70, 45, 35, etc.) | Server-side only |
| certaintyWeight formula | Server-side only |
| Score composition formulas | Server-side only |

## P2 Change
- Line 792: "because the authority, coherence, friction, and pressure scores resolved into" → "because the structural signals resolved into"
- This was the ONLY remaining place where scoring dimension names appeared in user-facing text

## Risk Assessment
- **Type definition risk:** The `ApiSuccess` type includes all 11 raw score fields. These are in the client TypeScript but tree-shaking should remove unused fields from the production bundle. Even if they appear in the API response JSON, they are never rendered in DOM.
- **Network inspection risk:** A user inspecting the API response in browser dev tools could see raw scores. This is a minor IP risk but does not constitute "public surface exposure."
- **Recommendation:** In a future pass, the API route could return a reduced payload that omits raw scores entirely.
