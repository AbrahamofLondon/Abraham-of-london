# Control Room Internal State Loader Report

**Date:** 2026-05-08

---

## How the loader works

`loadControlRoomState()` in `lib/product/control-room-state-loader.ts`:

1. Calls `evaluateOrganisationAccess()` with `CONTROL_ROOM_VIEW` scope
2. If denied → returns `{ access }` with no state
3. Loads organisation from Prisma
4. Loads campaigns (top 20, ordered by recency)
5. Counts responses for coverage calculation
6. Evaluates aggregation safety via `evaluateAggregationSafety()`
7. Builds privacy-safe campaign summaries
8. Derives evidence tier from campaign count
9. Generates collision/divergence summary via `summarizeCollisionReport()`
10. Derives admission readiness (ER/SR/Boardroom)
11. Computes next required action
12. Assembles `ControlRoomState` with privacy notice

## What it returns

| Field | Source | Privacy-safe |
|-------|--------|-------------|
| Organisation identity | Prisma Organisation | YES |
| Active campaigns | AlignmentCampaign count | YES |
| Response coverage | Participant vs response count | YES — aggregated |
| Aggregation safety | `evaluateAggregationSafety()` | YES |
| Campaign summaries | Campaign metadata only | YES — no raw responses |
| Evidence tier | Derived from campaign count | YES |
| Divergence | `summarizeCollisionReport()` | YES — aggregated only |
| Admission readiness | Derived from evidence tier | YES |
| Next required action | Derived from gaps | YES |
| Privacy notice | Generated from access boundary | YES |

## What it refuses

| Data | Reason |
|------|--------|
| Raw respondent answers | Privacy boundary: `canViewRawResponses = false` for all v0 roles |
| Individual respondent identity (anonymous mode) | Never exposed — `canViewNamedRespondents` only true for OWNER/SPONSOR in named campaigns |
| Small-sample breakdowns | Suppressed — `smallSampleSuppressionApplies = true` for all roles |
| Cross-organisation data | Not loaded — query scoped to single organisationId |

## What is suppressed

| Condition | Behaviour |
|-----------|----------|
| Fewer than 3 responses | Aggregation safety → `SMALL_SAMPLE_SUPPRESSED` or `INSUFFICIENT_RESPONSES` |
| Anonymous campaign | Named respondent view → false |
| No campaigns | Next action: "Launch the first diagnostic campaign" |
| Coverage below 50% | Next action: "Increase response coverage" |

## Missing schema/role gaps

| Gap | Impact | Workaround |
|-----|--------|-----------|
| No explicit `OrganisationRole` enum on membership | Role derived from `roleTitle` string + `isExecutive` boolean | Conservative derivation — defaults to DECISION_OWNER |
| No organisation-level entitlement | Cannot gate Control Room access by payment at org level | Derive from member/sponsor individual entitlements |
| Per-campaign response count not loaded in v0 | `completionPercent` shows 0 for individual campaigns | Performance trade-off — acceptable for v0 |

## When a public/internal API can safely be created

An API at `/api/control-room/[organisationId]` can be created when:

1. `evaluateOrganisationAccess()` is production-tested with real membership data
2. Aggregation safety enforcement is confirmed under real campaign conditions
3. Small-sample suppression is verified with edge cases (1-2 respondents)
4. Named vs anonymous mode enforcement is audited per campaign
5. Admin/operator override paths are reviewed

For now, the loader is callable from server-side code (getServerSideProps, API routes) but should not be exposed as a public endpoint without the above checks.
