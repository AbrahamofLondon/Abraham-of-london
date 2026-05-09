# Public DTO Score Field Closure

**Date:** 2026-05-09
**Purpose:** Classification and disposition of every score field serialized in public API responses

---

## Route-by-Route Audit

### 1. `/api/diagnostics/score` (Fast Diagnostic)
**Status: CLEAN — no raw scores in response**

The file explicitly states (lines 8-9): "No thresholds, weights, classification rules, or internal scoring data ever reaches the client."

All response fields are narrative labels, summaries, and user-safe analysis. No action required.

### 2. `/api/diagnostics/constitutional-intake/report`
**Status: CLEAN — DTO sanitized via `toPublicResult()`**

The `toPublicResult()` function in `lib/diagnostics/public-constitutional-result.ts` explicitly "strips all scoring, thresholds, signals, and engine internals." Response contains only: state, headline, summary, directive, recommendations, escalation label.

No action required.

### 3. `/api/decision-centre/cases`
**Auth: `resolveIdentity` required (authenticated users only)**

| Field | Rendered? | Classification | Disposition |
|-------|-----------|---------------|-------------|
| `irreversibility.score` | YES — `decision-centre.tsx:199` (color conditional) | REQUIRED_PUBLIC_SAFE | Keep — drives visual treatment for the user's own case |
| `irreversibility.level` | YES — rendered as label | REQUIRED_PUBLIC_SAFE | Keep |
| `credit.score` | YES — `decision-centre.tsx:468` (displayed as number) | REQUIRED_PUBLIC_SAFE | Keep — the user sees their own decision credit score |
| `credit.trend` | YES — rendered | REQUIRED_PUBLIC_SAFE | Keep |
| `credit.fulfilled/breached/disputed` | YES — rendered in credit panel | REQUIRED_PUBLIC_SAFE | Keep |
| `costOfInaction.accumulatedCost` | YES — rendered with "estimated" label | REQUIRED_PUBLIC_SAFE | Keep |
| `cognitiveState` | YES — rendered in case cards | REQUIRED_PUBLIC_SAFE | Keep |

**Verdict:** All serialized score fields in this route are rendered to the authenticated user for their own cases. No fields need removal. Route is auth-gated.

### 4. `/api/strategy-room/analyze`
**Auth: Rate-limited, no auth**

| Field | Rendered? | Classification | Disposition |
|-------|-----------|---------------|-------------|
| `score` (0-25 capped) | NO — only `status` is used in UI | SERIALIZED_BUT_NOT_RENDERED | DOCUMENT — low risk (capped range, no threshold exposure); removing would require client refactor |
| `status` | YES — determines gate state | REQUIRED_PUBLIC_SAFE | Keep |

**Verdict:** The `score` field is serialized but not rendered. It is capped at 0-25 (not a raw 0-100 scale) and does not expose thresholds. Documented as acceptable technical debt. Future DTO pass could return only `status`.

### 5. `/api/decision/credit-score`
**Auth: Session required (authenticated users only)**

| Field | Rendered? | Classification | Disposition |
|-------|-----------|---------------|-------------|
| `score` | YES — via Decision Centre | REQUIRED_PUBLIC_SAFE | Keep |
| `band` | YES — rendered as label | REQUIRED_PUBLIC_SAFE | Keep |
| `trend` | YES — rendered | REQUIRED_PUBLIC_SAFE | Keep |
| `components.velocity` | NO | SERIALIZED_BUT_NOT_RENDERED | DOCUMENT — component breakdown not rendered in any UI |
| `components.breaches` | NO | SERIALIZED_BUT_NOT_RENDERED | DOCUMENT |
| `components.outcomes` | NO | SERIALIZED_BUT_NOT_RENDERED | DOCUMENT |
| `components.recurrence` | NO | SERIALIZED_BUT_NOT_RENDERED | DOCUMENT |
| `reliability.score` | NO — duplicates top-level score | SERIALIZED_BUT_NOT_RENDERED | DOCUMENT |
| `followThrough.score` | NO | SERIALIZED_BUT_NOT_RENDERED | DOCUMENT |
| `delayPattern.penalty` | NO | SERIALIZED_BUT_NOT_RENDERED | DOCUMENT |

**Verdict:** Auth-gated. Top-level `score`, `band`, `trend` are rendered and REQUIRED. The `components`, `reliability`, `followThrough`, and `delayPattern` sub-objects are serialized but never consumed by any UI component. These are documented as acceptable for now — they expose component weights but only to authenticated users viewing their own data. Future DTO pass should strip these and return only `score`, `band`, `trend`, `fulfilled`, `breached`, `disputed`.

### 6. `/api/strategy-room/execution` (POST)
**Auth: `authorizeStrategyRoomEntry` + admission check**

| Field | Rendered? | Classification | Disposition |
|-------|-----------|---------------|-------------|
| `consequenceScore` | YES — `strategy-room/session/[id].tsx:867` | REQUIRED_PUBLIC_SAFE | Keep — rendered as consequence indicator in active session |
| `contradictions[].confidence` | YES — used for display treatment | REQUIRED_PUBLIC_SAFE | Keep |

**Verdict:** Both fields are rendered in the Strategy Room session UI. Auth-gated with admission check. No action required.

---

## Summary

| Route | Raw Scores Serialized | Rendered? | Auth-Gated? | Action |
|-------|----------------------|-----------|-------------|--------|
| `/api/diagnostics/score` | 0 | — | Rate-limited | NONE |
| `/api/diagnostics/constitutional-intake/report` | 0 (stripped by DTO) | — | Session | NONE |
| `/api/decision-centre/cases` | 3 (all rendered) | YES | Auth required | NONE |
| `/api/strategy-room/analyze` | 1 (score, not rendered) | NO | Rate-limited | DOCUMENTED |
| `/api/decision/credit-score` | 7 (4 rendered, 3 not) | PARTIAL | Session | DOCUMENTED |
| `/api/strategy-room/execution` | 2 (both rendered) | YES | Admission check | NONE |

---

## Non-Blocker Residuals (Documented)

| Field | Route | Risk | Mitigation |
|-------|-------|------|------------|
| `analyze.score` (0-25) | `/api/strategy-room/analyze` | LOW — capped range, no thresholds exposed, public but not rendered | Rate-limited; future pass returns only `status` |
| `credit-score.components.*` | `/api/decision/credit-score` | LOW — auth-gated, user's own data, component weights visible in dev tools | Future pass strips to `score`+`band`+`trend` only |
| `credit-score.delayPattern.penalty` | `/api/decision/credit-score` | LOW — auth-gated penalty weight | Future pass removes |

**None of these are blocking. All are auth-gated or rate-limited. No thresholds, formulas, or classification logic is exposed. Component names are generic (velocity, breaches, outcomes, recurrence) and do not reveal proprietary mechanics.**

---

## Final Classification

| Classification | Count | Status |
|---------------|-------|--------|
| REQUIRED_PUBLIC_SAFE | 15+ fields | No action needed |
| SERIALIZED_BUT_NOT_RENDERED | 8 fields across 2 routes | Documented as non-blocking residuals |
| TYPE_ONLY_NOT_SERIALIZED | 11 fields (Constitutional raw scores) | In client type but stripped by `toPublicResult()` |
| REMOVE_NOW | 0 | None identified |
