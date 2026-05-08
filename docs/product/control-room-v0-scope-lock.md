# Control Room v0 Scope Lock

**Date:** 2026-05-07
**Rule:** Build only what can be built safely with existing schema, models, and privacy rules. Do not overbuild.

---

## Control Room v0 WILL include

| Feature | Data source | Privacy-safe | Notes |
|---------|-----------|-------------|-------|
| Organisation current state | `Organisation` model | YES | Name, sector, size, status |
| Active campaigns | `AlignmentCampaign` | YES | Title, type, status, dates |
| Respondent completion | `CampaignParticipant` count by status | YES | Aggregated counts only |
| Aggregated evidence tier | Derived from campaign stage completions | YES | No individual data |
| Divergence map | `TeamAssessmentAggregate` + leader scores | YES | Aggregated domain gaps |
| Admission readiness | `isAdmissibleFor()` at org level | YES | Derived from aggregate evidence |
| Next required organisational action | Derived from gaps + admission | YES | Actionable guidance |

## Control Room v0 WILL NOT include

| Feature | Why not | When |
|---------|---------|------|
| Full strategic twin | Requires significant engine work | LONG-TERM |
| Raw respondent browser | Privacy violation in anonymous mode | NEVER (anonymous) / LATER (named, with consent) |
| Organisation-level entitlements | Requires schema migration | SCHEMA_REQUIRED |
| Complex retainer analytics | Retainer contracts are inactive | AFTER retainer activation |
| Cross-client benchmarks | Cross-org data exposure risk | LONG-TERM with anonymisation |
| Board export automation | Requires PDF/report pipeline | LATER |
| Advanced predictive modelling | Requires calibration data | LONG-TERM |
| Individual respondent scores | Privacy rule: anonymous mode = aggregate only | See guardrails |
| Other organisations' data | Multi-tenancy boundary | NEVER without explicit grant |

---

## Implementation prerequisites

| Prerequisite | Status |
|-------------|--------|
| Organisation model in Prisma | EXISTS |
| Campaign models in Prisma | EXISTS |
| Participant/response models | EXISTS |
| Aggregation models | EXISTS (TeamAssessmentAggregate, OrganisationAssessmentSnapshot) |
| Privacy rules documented | EXISTS (multi-user-control-room-guardrails.md) |
| Sponsor role model | PARTIAL — `createdByMembershipId` on campaign, needs role enforcement |
| Organisation-level entitlement | NOT YET — derive from sponsor's individual entitlements initially |

---

## Route recommendation

`/control-room/[organisationSlug]`

Protected by: sponsor role verification + organisation membership check.
