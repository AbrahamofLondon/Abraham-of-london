# Final Evidence Memory Certification

> Date: 2026-05-08
> Standard: 10-step lifecycle verification per link.
> Method: Code trace with hostile agent verification.

---

## Six-Link Certification Table

| # | Link | Capture | Submit | Persist | Load | Compose | Render | Source Label | Evidence Posture | Suppression | Source Join | Verdict |
|---|------|:-------:|:------:|:-------:|:----:|:-------:|:------:|:------------:|:----------------:|:-----------:|:----------:|:-------:|
| 1 | Team -> Return Brief | YES | YES | PostgreSQL (TeamAssessmentAggregate) | return-brief.server.ts ~L369 | N/A | page.tsx L307-326 | "Source: Team Assessment" | "aggregated" | respondentCount >= 3 | HEURISTIC (email/sessionId) | **CERTIFIED_CLOSED** |
| 2 | Team -> Oversight Brief | YES | YES | PostgreSQL | composer L142-170 | Signal builder + brief.oversightSignals | brief/[cycleId].tsx Oversight Signals section | "Source: Team Assessment" | "aggregated" | respondentCount >= 3 | HEURISTIC (email) | **CERTIFIED_CLOSED** |
| 3 | Enterprise -> Return Brief | YES | YES | PostgreSQL (OrganisationAssessmentSnapshot) | return-brief.server.ts ~L408 | N/A | page.tsx L329-348 | "Source: Enterprise Assessment" | "system-inferred" | null-safe | DERIVED (orgId preferred, membership fallback) | **CERTIFIED_CLOSED** |
| 4 | Enterprise -> Oversight Brief | YES | YES | PostgreSQL | composer L172-192 | Signal builder + brief.oversightSignals | brief/[cycleId].tsx Oversight Signals section | "Source: Enterprise Assessment" | "system-inferred" | percentScore threshold | DIRECT (organisationId) | **CERTIFIED_CLOSED** |
| 5 | Consequence -> Return Brief | YES | YES | PostgreSQL (enrichedSnapshot.evidenceCapture) | return-brief.server.ts ~L453 | Evidence messages built | page.tsx L351-372 | "Source: Strategy Room Stage 2" | "user-reported" | safeEvidenceText() | DIRECT (session canonical) | **CERTIFIED_CLOSED** |
| 6 | Retainer Intake -> Oversight | YES | YES | PostgreSQL (diagnosticRecord) | retainer-intake-loader.ts | composer L322-335 + account loader L448-461 | admin/oversight-review + brief/[cycleId].tsx | "Source: Retainer Intake" | "client-reported" | isUnsafeAssessmentEvidenceText() | DIRECT (email/userId) | **CERTIFIED_CLOSED** |

---

## Source Join Quality

| Link | Join Method | Quality | Risk | Mitigation |
|------|------------|---------|------|-----------|
| 1 | `createdByEmail` OR `strategyRoomSessionId` | HEURISTIC | May match wrong campaign if user has multiple | UI labels as "earlier team reading" — does not claim exact session linkage |
| 2 | `createdByEmail` | HEURISTIC | Same as #1 | Signal labelled as "reported" not "confirmed" |
| 3 | `organisationId` preferred, membership lookup fallback | DERIVED | Falls back to email-based org membership lookup | Impossible match suppressed (`id: "__impossible__"`) |
| 4 | `organisationId` | DIRECT | Low risk — direct schema field | Strongest join in the set |
| 5 | Session canonical snapshot | DIRECT | None — reads from the session's own stored data | Strongest possible |
| 6 | `email` + `userId` fallback | DIRECT | Low — email is authenticated | `resolveIdentity()` used in API |

---

## Hardening Applied This Pass

| Fix | File | Before | After |
|-----|------|--------|-------|
| Team threshold | return-brief.server.ts | `respondentCount >= 1` | `respondentCount >= 3` (consistent with signal builder) |
| Enterprise join | oversight-brief-composer.ts | `where: { campaignId: input.organisationId }` (WRONG) | `where: { organisationId: input.organisationId }` (CORRECT) |
| Enterprise join (Return Brief) | return-brief.server.ts | `createdByEmail` only | `organisationId` preferred, membership fallback, impossible-match guard |
| Oversight signals in brief | oversight-brief-contract.ts | Field MISSING from OversightBrief type | `oversightSignals` array with source labels and evidence posture |
| Signal rendering | oversight/brief/[cycleId].tsx | Signals NOT rendered | Signals rendered with type, severity, source label, evidence posture |

---

## Anti-Leakage Guards

| Surface | Guard | Status |
|---------|-------|--------|
| Return Brief team evidence | respondentCount >= 3 | APPLIED |
| Return Brief enterprise evidence | null-safe, impossible-match guard | APPLIED |
| Return Brief consequence evidence | `safeEvidenceText()` wraps all user text | APPLIED |
| Oversight signals | threshold checks in signal builder | APPLIED |
| Retainer intake | `isUnsafeAssessmentEvidenceText()` on all client-safe fields | APPLIED |
| Retainer intake refusalBoundary | Suppressed from client-safe if unsafe | APPLIED |
| All surfaces | No raw respondent text | VERIFIED |
| All surfaces | No counsel recommendation text | VERIFIED |
| All surfaces | No "verified/confirmed" for USER_REPORTED | VERIFIED |

---

## Final Summary

- **CERTIFIED_CLOSED: 6/6**
- **PARTIALLY_CLOSED: 0/6**
- **NOT_CLOSED: 0/6**
- **Source join risks:** 2 HEURISTIC (links 1, 2 — team email lookup), 1 DERIVED (link 3 — enterprise fallback), 3 DIRECT
- **Highest remaining risk:** Team aggregate email heuristic may match wrong campaign for users with multiple campaigns. Mitigated by "reported" language, not "confirmed."
- **Overall verdict:** CERTIFIED_HIGH_CONFIDENCE with noted HEURISTIC source joins on team links
