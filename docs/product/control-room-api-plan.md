# Control Room API Plan

**Date:** 2026-05-08
**Decision:** Do not ship a live organisation Control Room API in this pass.

---

## Why API Implementation Is Blocked

The current repository does not yet have a canonical sponsor/member authorization path that is strong enough for an organisation-level product API.

### Current blockers

- `app/api/team-assessment/campaign/create/route.ts` is open.
- `app/api/team-assessment/campaign/[id]/invites/route.ts` is open.
- `app/api/team-assessment/campaign/[id]/aggregate/route.ts` is open.
- `app/api/alignment/enterprise/campaigns/route.ts` is open.
- `app/api/alignment/enterprise/campaigns/[id]/route.ts` is open.
- `app/api/alignment/enterprise/campaigns/[id]/report/route.ts` is open and returns participant-level data.
- There is admin auth via `requireAdminAppRoute()`, and user identity resolution via `resolveIdentity()`, but there is no canonical product-layer helper that says:
  - this identity is a member of organisation `X`;
  - this member has sponsor/operator/reviewer authority for Control Room state;
  - this campaign mode and response volume permit this slice of data to be shown.

Because of that, an organisation API added now would either duplicate auth logic or risk exposing campaign intelligence without a settled privacy model.

---

## Safe v0 Target

Preferred route once foundations are in place:

- `pages/api/control-room/[organisationId]/state.ts`
  or
- `app/api/control-room/[organisationId]/state/route.ts`

### Required gates

1. Authenticated identity required.
2. Organisation membership required.
3. Role required:
   - `SPONSOR`
   - `OPERATOR`
   - possibly `REVIEWER` as read-only
4. Aggregation safety check required before campaign-level or divergence fields are returned.
5. Sponsor view must never include:
   - raw respondent text
   - individual raw answers
   - attributed identity in anonymous mode
   - suppressed small-sample breakdowns

---

## Contract To Return

Return `ControlRoomState` from `lib/product/control-room-contract.ts`.

The payload must be limited to:

- organisation current state
- active campaigns
- response coverage
- aggregation safety
- divergence summary
- evidence tier
- admission readiness
- next required action
- privacy notice

No raw participant rows. No raw response payloads. No unrestricted respondent identity.

---

## Required Implementation Prerequisites

### 1. Canonical organisation access helper

Create a server helper that:

- resolves authenticated identity
- finds `OrganisationMembership` by organisation and identity email/user
- maps membership into product roles
- determines whether the caller is sponsor-safe, operator-safe, or denied

### 2. Campaign mode normalization

Map existing campaign reality into canonical v0:

- `TeamAssessmentCampaign.anonymityMode`
- `TeamAssessmentCampaign.minimumResponseThreshold`
- `AlignmentCampaign.metadata`

This should feed `CampaignMode`, `RespondentVisibility`, and `AggregationSafety`.

### 3. Sponsor-safe divergence summarization

Use `lib/product/multi-user-collision-summary.ts` or equivalent summary wrapper.
Do not expose `lib/constitution/multi-user-collision.ts` output directly.

### 4. Organisation-level entitlement interpretation

There is no organisation entitlement schema yet.
For v0, derive commercial readiness from:

- member/sponsor entitlements where appropriate
- admission state
- aggregation safety

Do not mutate entitlement schema in this pass.

---

## Validation Rules For The Future API

- unauthenticated request returns `401`
- authenticated non-member returns `403`
- member without sponsor/operator authority returns `403`
- anonymous campaign under threshold returns `SMALL_SAMPLE_SUPPRESSED`
- raw respondent data is absent from payload
- sponsor-safe divergence summary contains no raw answers
- organisation state is stable under mixed team/enterprise campaign modes

---

## Recommended Next Step

Build the organisation access helper first, then implement the API against the new product contracts instead of reading directly from the public campaign routes.
