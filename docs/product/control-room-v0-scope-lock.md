# Control Room v0 Scope Lock

**Date:** 2026-05-08
**Rule:** Build only what can be built safely with existing schema, models, and privacy rules. Do not overbuild.

---

## Control Room v0 includes only

| Feature | Data source | Privacy-safe | Notes |
|---------|-------------|--------------|-------|
| Organisation current state | `Organisation` + aggregate campaign counts | YES | Name, scope, current posture |
| Active campaigns | `AlignmentCampaign` / `TeamAssessmentCampaign` summary only | YES | Title, status, counts, mode |
| Response coverage | Participant and response counts | YES | Aggregated coverage only |
| Aggregation safety | Campaign mode + response threshold evaluation | YES | Must be explicit in payload |
| Divergence summary | Sponsor-safe collision or gap summary | YES | No raw respondent answers |
| Evidence tier | Derived from aggregate and campaign evidence | YES | Must distinguish aggregate from individual evidence |
| Admission readiness | ER / Strategy Room readiness only | YES | Organisation-level readiness, not individual override |
| Next required action | Derived summary guidance | YES | Single highest-signal organisational next step |

## Control Room v0 excludes

| Feature | Why not | When |
|---------|---------|------|
| Raw responses | Sponsor privacy breach | NEVER in v0 |
| Strategic twin | Requires additional model/engine work | LATER |
| Cross-client benchmarks | Cross-org exposure risk | LATER with anonymisation |
| Unrestricted respondent identity | Unsafe in anonymous and hybrid conditions | NEVER in v0 |
| Advanced predictive analytics | Needs stronger calibration and governance | LATER |
| Automated board export | Requires separate export pipeline hardening | LATER |
| Retainer command centre | Overbuilds before contracts and auth are settled | LATER |
| Other organisations' data | Multi-tenant boundary violation | NEVER |

---

## Implementation prerequisites

| Prerequisite | Status |
|-------------|--------|
| Organisation model in Prisma | EXISTS |
| Campaign models in Prisma | EXISTS |
| Participant/response models | EXISTS |
| Aggregation models | EXISTS (TeamAssessmentAggregate, OrganisationAssessmentSnapshot) |
| Privacy rules documented | EXISTS (multi-user-control-room-guardrails.md) |
| Sponsor/operator role enforcement | NOT YET — membership exists, canonical sponsor auth helper does not |
| Aggregation safety rules in product layer | NOW — use `multi-user-privacy.ts` |
| Sponsor-safe divergence contract | NOW — use `multi-user-collision-summary.ts` |
| Organisation-level entitlement | NOT YET — derive from member/sponsor entitlements initially |

---

## Route recommendation

`/control-room/[organisationSlug]`

Protected by:

- authenticated identity
- organisation membership check
- sponsor/operator role verification
- aggregation safety enforcement
