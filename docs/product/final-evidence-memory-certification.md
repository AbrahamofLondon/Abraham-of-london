# Final Evidence Memory Certification

> Date: 2026-05-08 (updated: source join hardening pass)
> Standard: 10-step lifecycle verification per link.
> Method: Code trace with hostile agent verification + source join audit.

---

## Six-Link Certification Table

| # | Link | Source Join | Join Quality | UI Copy | Verdict |
|---|------|-----------|:------------:|---------|---------|
| 1 | Team -> Return Brief | `organisationId` from session intake, fallback `sponsorUserId` | DERIVED | "An earlier team reading suggested..." + "(matched by organisation/account context)" | **CERTIFIED_CLOSED** |
| 2 | Team -> Oversight Brief | `organisationId` from oversight input, fallback `sponsorUserId` | DERIVED | Signal labelled "reported" | **CERTIFIED_CLOSED** |
| 3 | Enterprise -> Return Brief | `organisationId` preferred, membership fallback | DERIVED | "Earlier enterprise reading reported..." | **CERTIFIED_CLOSED** |
| 4 | Enterprise -> Oversight Brief | `organisationId` (direct field match) | DIRECT | Signal labelled "system-inferred" | **CERTIFIED_CLOSED** |
| 5 | Consequence -> Return Brief | Session canonical snapshot (direct) | DIRECT | "You previously identified..." + "not independently verified" | **CERTIFIED_CLOSED** |
| 6 | Retainer Intake -> Oversight | `email` + `userId` via `resolveIdentity()` | DIRECT | Source-labelled, client-safe summary, suppression | **CERTIFIED_CLOSED** |

---

## Source Join Hardening (This Pass)

| Link | Before | After | Fix |
|------|--------|-------|-----|
| 1. Team -> Return Brief | `createdByEmail` heuristic (**field does not exist on TeamAssessmentCampaign**) | `organisationId` from intake, fallback `sponsorUserId` | Query was broken — non-existent field. Now uses real schema fields. |
| 2. Team -> Oversight Brief | `createdByEmail` heuristic (**same broken field**) | `organisationId` from input, fallback `sponsorUserId` | Same fix. |
| 3. Enterprise -> Return Brief | `createdByEmail` only | `organisationId` preferred, membership fallback | Already hardened prior pass. |
| 4. Enterprise -> Oversight Brief | `organisationId` (was `campaignId` — wrong field, fixed prior pass) | `organisationId` | Already correct. |
| 5-6 | Direct joins | Unchanged | Already correct. |

**Critical discovery:** The `createdByEmail` and `strategyRoomSessionId` fields referenced in the original team loaders DO NOT EXIST on the `TeamAssessmentCampaign` Prisma model. The queries were silently returning null on all real databases. The team evidence section was never actually loading data.

---

## Source Join Quality Summary

| Quality | Count | Links |
|---------|-------|-------|
| DIRECT | 3 | Enterprise->Oversight (organisationId), Consequence->Return (session canonical), Retainer (email/userId) |
| DERIVED | 3 | Team->Return (orgId from intake), Team->Oversight (orgId from input), Enterprise->Return (orgId with fallback) |
| HEURISTIC | 0 | None remaining |

---

## UI Copy Downgrades

| Link | Before | After |
|------|--------|-------|
| Team -> Return Brief summary | "Earlier team reading reported..." | "An earlier team reading **suggested**..." + "(matched by **organisation/account** context)" |
| Team -> Return Brief source label | "Source: Team Assessment" | "Source: Team Assessment · Evidence posture: aggregated" (unchanged) |

---

## Regression Rule

**Any evidence memory field with sourceJoin: HEURISTIC cannot be marked CERTIFIED_CLOSED.**

This is now enforced by:
1. The regression checklist (`docs/product/evidence-memory-regression-checklist.md`)
2. The lifecycle contract (`lib/product/evidence-memory-lifecycle-contract.ts`)
3. This certification document

---

## Overall Verdict

**CERTIFIED_HIGH_CONFIDENCE** — zero HEURISTIC source joins remaining.

- 3 DIRECT joins
- 3 DERIVED joins (organisationId from intake context or input parameters)
- 0 HEURISTIC joins
- 0 broken field references
