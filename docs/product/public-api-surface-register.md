# Public API Surface Register

**Date:** 2026-05-09
**Purpose:** Classification of all API routes by access level and DTO safety

---

## Classification Key

| Level | Meaning |
|-------|---------|
| PUBLIC_SAFE | No auth required, returns only safe labels/summaries |
| AUTHENTICATED_USER_SAFE | Requires auth, returns user-scoped data, no internal mechanics |
| OPERATOR_ONLY | Requires admin/operator auth |
| INTERNAL_ONLY | Server-to-server, cron, or webhook |
| NEEDS_MONITORING | Returns comprehensive data to authenticated users — correct for product but monitor for scope creep |

---

## High-Risk Routes (Diagnostics, Decision, Strategy)

| Route | Method | Auth | Classification | DTO Status |
|-------|--------|------|---------------|------------|
| `/api/diagnostics/score` | POST | Rate limit only | NEEDS_MONITORING | Returns FastDiagnosticResult — internal scoring exists in type but rendering is governed |
| `/api/diagnostics/submit` | POST | Session optional | AUTHENTICATED_USER_SAFE | Persists diagnostic record |
| `/api/diagnostics/challenge` | POST | Rate limit only | PUBLIC_SAFE | Degraded via shield |
| `/api/diagnostics/capture` | POST | Rate limit only | PUBLIC_SAFE | Email encryption only |
| `/api/diagnostics/[ref]` | GET | Token-based access | AUTHENTICATED_USER_SAFE | Summary fields only |
| `/api/diagnostics/list` | GET | Session required | AUTHENTICATED_USER_SAFE | Summary list |
| `/api/diagnostics/constitutional-intake/report` | POST | Session required | AUTHENTICATED_USER_SAFE | Server-side derivation; `public-constitutional-result.ts` strips internals |
| `/api/decision-centre/cases` | GET | `resolveIdentity` | NEEDS_MONITORING | Returns comprehensive case data to authenticated user — evidence posture labels present |
| `/api/strategy-room/analyze` | POST | Rate limit only | NEEDS_MONITORING | Returns score (0-25 capped) — monitor for threshold exposure |
| `/api/strategy-room/submit` | POST | Rate limit only | PUBLIC_SAFE | Basic intake |
| `/api/strategy-room/execution` | POST | Admission check | AUTHENTICATED_USER_SAFE | Execution session with governed data |
| `/api/strategy-room/execution` | GET | Admission check | AUTHENTICATED_USER_SAFE | Session metadata |

## Counsel, Outcomes, Proof

| Route | Method | Auth | Classification | DTO Status |
|-------|--------|------|---------------|------------|
| `/api/counsel/intake` | POST | `resolveIdentity` | AUTHENTICATED_USER_SAFE | Accepts user text, returns case ID |
| `/api/outcomes/verify` | POST | `resolveIdentity` | AUTHENTICATED_USER_SAFE | Outcome verification with calibration |
| `/api/proof/evidence` | POST | None | PUBLIC_SAFE | Self-reported feedback only |
| `/api/proof/public` | GET | None | PUBLIC_SAFE | Cached public stats |

## Internal / Admin

| Route | Method | Auth | Classification |
|-------|--------|------|---------------|
| `/api/internal/oversight/*` | Various | `requireAdminServer` | OPERATOR_ONLY |
| `/api/internal/return-brief/*` | Various | `requireAdminServer` | OPERATOR_ONLY |
| `/app/api/admin/decision/*` | Various | `requireAdminAppRoute` | OPERATOR_ONLY |
| `/app/api/admin/campaigns/*` | Various | `requireAdminAppRoute` | OPERATOR_ONLY |
| `/api/cron/*` | Various | Cron secret | INTERNAL_ONLY |
| `/api/webhooks/*` | Various | Webhook signature | INTERNAL_ONLY |

## Boardroom / Credit Score

| Route | Method | Auth | Classification | DTO Status |
|-------|--------|------|---------------|------------|
| `/app/api/boardroom/dossier` | GET | Session required | AUTHENTICATED_USER_SAFE | Returns qualification + dossier data |
| `/app/api/decision/credit-score` | GET | Session required | NEEDS_MONITORING | Returns score components — monitor for weight exposure |

---

## Key Safety Controls Already in Place

1. **Constitutional Diagnostic:** `lib/diagnostics/public-constitutional-result.ts` — "Strips all scoring, thresholds, signals, and engine internals" before client delivery
2. **Enterprise Control Room:** `lib/product/enterprise-control-room-safety.ts` — UNSAFE_PATTERNS regex blocks "algorithm", "kernel", "arbiter" from enterprise output
3. **Decision Centre Cases:** Auth-gated, returns evidence posture labels on all data
4. **Strategy Room Analyze:** Score capped at 0-25 range (not raw 0-100)

---

## Routes Requiring Ongoing Monitoring

| Route | Risk | Monitor For | DTO Audit Status |
|-------|------|------------|-----------------|
| `/api/diagnostics/score` | LOW — no raw scores serialized | New fields exposing formulas | CLEAN — field-level audit confirmed |
| `/api/decision-centre/cases` | LOW — all serialized fields are rendered | Scope creep adding internal metrics | CLEAN — all fields verified as REQUIRED_PUBLIC_SAFE |
| `/api/strategy-room/analyze` | LOW — score capped 0-25, not rendered | Threshold exposure or formula leaks | DOCUMENTED — score is non-blocking residual |
| `/app/api/decision/credit-score` | LOW — auth-gated, component breakdown not rendered | Weight exposure | DOCUMENTED — 8 non-rendered fields, future DTO pass recommended |

---

## DTO Audit Closure (2026-05-09)

Field-level audit completed. See `docs/product/public-dto-score-field-closure.md` for full classification.

| Classification | Count | Status |
|---------------|-------|--------|
| REQUIRED_PUBLIC_SAFE | 15+ | Rendered to user, keep |
| SERIALIZED_BUT_NOT_RENDERED | 8 | Auth-gated, documented, non-blocking |
| TYPE_ONLY_NOT_SERIALIZED | 11 | Stripped by `toPublicResult()`, never cross API boundary |
| REMOVE_NOW | 0 | None identified |
