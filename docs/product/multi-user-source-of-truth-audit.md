# Multi-User Source-of-Truth Audit

**Date:** 2026-05-08
**Scope:** Existing organisation, campaign, participant, response, aggregation, entitlement, admin, and collision assets relevant to team and enterprise products.

---

## Executive Position

- The Prisma schema already contains a substantial multi-user foundation. `Organisation`, `OrganisationMembership`, `AlignmentCampaign`, `CampaignParticipant`, `EnterpriseAssessment`, `TeamAssessmentCampaign`, `TeamAssessmentResponse`, `TeamAssessmentAggregate`, and organisation/team snapshot models are the durable core.
- The admin and operator surfaces for campaigns and organisations are active, but they are admin-only, not sponsor-safe product surfaces.
- Several live enterprise and team campaign API routes are still public or token-based without a canonical sponsor/member authorization layer. That makes a Control Room API unsafe to ship in this pass.
- `lib/alignment/organization-engine.ts` is legacy browser-local storage and must not be used as source of truth for premium multi-user product work.
- `lib/constitution/multi-user-collision.ts` is valuable, but its raw output is not sponsor-safe without an aggregation/privacy wrapper.

---

## Asset Audit

| Asset | Kind | Current purpose | Active | Safe for team | Safe for enterprise | Privacy risk | Recommended future role | Classification |
|------|------|-----------------|--------|---------------|---------------------|--------------|-------------------------|----------------|
| `prisma/schema.prisma` `Organisation` | Prisma model | Organisation registry, sector/size/status anchor | YES | YES | YES | LOW | Canonical organisation identity | CANONICAL |
| `prisma/schema.prisma` `OrganisationMembership` | Prisma model | Member roster with role metadata, team, seniority, executive flag | YES | YES | YES | MEDIUM | Canonical organisation participant/sponsor anchor | CANONICAL |
| `prisma/schema.prisma` `OrganisationInvite` | Prisma model | Invite and acceptance tracking for organisation membership | YES | YES | YES | MEDIUM | Canonical membership invite ledger | CANONICAL |
| `prisma/schema.prisma` `AlignmentCampaign` | Prisma model | Enterprise/team campaign lifecycle under an organisation | YES | YES | YES | MEDIUM | Canonical multi-user campaign record | CANONICAL |
| `prisma/schema.prisma` `CampaignParticipant` | Prisma model | Invited participant tracking, status, token hash, optional membership linkage | YES | YES | YES | HIGH | Canonical respondent registry, never public as-is | CANONICAL |
| `prisma/schema.prisma` `EnterpriseAssessment` | Prisma model | Per-participant enterprise response payload and scoring | YES | PARTIAL | YES | HIGH | Canonical raw enterprise response store, operator-only | CANONICAL |
| `prisma/schema.prisma` `TeamAssessmentCampaign` | Prisma model | Team campaign lifecycle, mode, anonymity, threshold | YES | YES | SUPPORTING | MEDIUM | Canonical team-assessment campaign model | CANONICAL |
| `prisma/schema.prisma` `TeamAssessmentInvite` | Prisma model | Team respondent invite tokens | YES | YES | SUPPORTING | HIGH | Canonical invite transport for team mode | CANONICAL |
| `prisma/schema.prisma` `TeamAssessmentResponse` | Prisma model | Raw team respondent answers keyed by invite | YES | YES | SUPPORTING | HIGH | Canonical raw response store, never sponsor-safe by default | CANONICAL |
| `prisma/schema.prisma` `TeamAssessmentAggregate` | Prisma model | Persisted team aggregate, confidence, claim level | YES | YES | SUPPORTING | LOW | Canonical sponsor-safe team aggregation | CANONICAL |
| `prisma/schema.prisma` `TeamAssessmentSnapshot` | Prisma model | Team-level enterprise snapshot per campaign/team | YES | YES | YES | MEDIUM | Supporting aggregate view for divergence and reporting | SUPPORTING |
| `prisma/schema.prisma` `OrganisationAssessmentSnapshot` | Prisma model | Organisation-level aggregate snapshot | YES | SUPPORTING | YES | LOW | Canonical organisation-level aggregate | CANONICAL |
| `prisma/schema.prisma` `LeadershipGapSnapshot` | Prisma model | Executive vs broader cohort gap signal | YES | SUPPORTING | YES | MEDIUM | Supporting divergence artifact | SUPPORTING |
| `prisma/schema.prisma` `Entitlement` | Prisma model | Per-user entitlement ledger | YES | PARTIAL | PARTIAL | LOW | Canonical user-level paid access, not sufficient for org-level state alone | CANONICAL |
| `lib/team/team-assessment-store.ts` | Server helper | Team campaign creation, invite issue, response submit, aggregate persistence, diagnostic stage write-back | YES | YES | SUPPORTING | HIGH | Canonical team campaign service with privacy wrappers above it | CANONICAL |
| `app/api/team-assessment/campaign/create/route.ts` | App API | Create team assessment campaign | YES | PARTIAL | NO | HIGH | Replace with authenticated sponsor/operator entrypoint | UNSAFE |
| `app/api/team-assessment/campaign/[id]/invites/route.ts` | App API | List status and issue invites | YES | PARTIAL | NO | HIGH | Keep logic, add auth and sponsor scope | UNSAFE |
| `app/api/team-assessment/campaign/[id]/aggregate/route.ts` | App API | Returns aggregate and claim for any campaign id | YES | PARTIAL | NO | HIGH | Internal aggregation service only until auth exists | UNSAFE |
| `app/api/team-assessment/respond/[token]/route.ts` | App API | Invite-token respondent submission | YES | YES | SUPPORTING | MEDIUM | Canonical respondent ingress | SUPPORTING |
| `app/api/alignment/enterprise/campaigns/route.ts` | App API | Create enterprise campaign and optional participants | YES | NO | PARTIAL | HIGH | Rebuild behind sponsor/operator auth | UNSAFE |
| `app/api/alignment/enterprise/campaigns/[id]/route.ts` | App API | Read/update campaign by id | YES | NO | PARTIAL | HIGH | Internal repository facade only until auth exists | UNSAFE |
| `app/api/alignment/enterprise/campaigns/[id]/report/route.ts` | App API | Returns participant rows, snapshots, assessments, and metadata | YES | NO | NO | CRITICAL | Restrict to admin/operator only or replace with sponsor-safe aggregate contract | UNSAFE |
| `app/api/campaigns/[id]/report/route.ts` | App API | Builds executive report from campaign with anonymity threshold enforcement | YES | SUPPORTING | YES | MEDIUM | Supporting governed report generator | SUPPORTING |
| `app/api/admin/campaigns/route.ts` | App API | Admin-only campaign list via `requireAdminAppRoute()` | YES | NO | NO | LOW | Canonical admin list endpoint | CANONICAL |
| `lib/admin/campaign/service.ts` | Server helper | Campaign data load, participant response extraction, threshold access | YES | SUPPORTING | SUPPORTING | HIGH | Internal reporting helper, not sponsor-safe as-is | SUPPORTING |
| `components/admin/campaigns/participant-table.tsx` | Admin component | Admin participant list surface | YES | NO | NO | MEDIUM | Keep for operator console only | SUPPORTING |
| `components/admin/campaigns/audit-invite.tsx` | Admin component | Admin invite audit/control surface | YES | NO | NO | MEDIUM | Keep for operator console only | SUPPORTING |
| `components/admin/campaigns/campaign-actions.tsx` | Admin component | Admin campaign action controls | YES | NO | NO | LOW | Keep for operator console only | SUPPORTING |
| `app/admin/organisations/[id]/dashboard/page.tsx` | Admin page | Org dashboard with campaign counts and completion | YES | NO | NO | LOW | Good reference for Control Room v0 aggregate fields | SUPPORTING |
| `app/admin/organisations/[id]/report/page.tsx` | Admin page | Organisation report for admin/operator review | YES | NO | NO | MEDIUM | Supporting operator report view | SUPPORTING |
| `lib/constitution/multi-user-collision.ts` | Domain helper | Detects cross-respondent truth gaps using raw spine comparison | YES | PARTIAL | PARTIAL | HIGH | Keep internal, expose only via sponsor-safe summary wrapper | CANONICAL |
| `lib/alignment/organization-engine.ts` | Browser helper | LocalStorage-based pseudo-organisation analytics | UNKNOWN | NO | NO | HIGH | Retire from product foundation | LEGACY |
| `docs/product/multi-user-domain-model-audit.md` | Doc | Prior high-level model inventory | YES | YES | YES | LOW | Supporting reference, superseded by this file for implementation decisions | SUPPORTING |
| `docs/product/multi-user-control-room-guardrails.md` | Doc | Product/privacy guardrails | YES | YES | YES | LOW | Canonical doctrine for privacy behavior | CANONICAL |

---

## Key Findings

### Canonical server-side foundation already exists

- Organisation, membership, campaign, participant, response, aggregate, and snapshot models are already present in Prisma.
- Team aggregation already writes back into the diagnostic journey via `persistDiagnosticStage()`, which means evidence tier uplift can be grounded in existing evidence infrastructure rather than a new parallel store.

### The main blocker is not schema, it is authorization and privacy exposure

- Team campaign create/invite/aggregate routes are public.
- Enterprise campaign create/read/report routes are public.
- Enterprise report route returns participant rows and assessment payloads that are not safe for sponsor-facing Control Room access.

### Operator/admin surfaces are active but are not product-safe sponsor surfaces

- Existing admin campaign pages and organisation dashboards are useful references for v0 state design.
- They should not be reused directly as customer-facing Control Room without role and privacy sanitization.

### Legacy local browser organisation logic must not be revived

- `lib/alignment/organization-engine.ts` is localStorage-backed and disconnected from the Prisma organisation/campaign system.
- It is incompatible with premium institutional evidence governance.

---

## Recommended Source of Truth

### Use as canonical

- Prisma models:
  - `Organisation`
  - `OrganisationMembership`
  - `OrganisationInvite`
  - `AlignmentCampaign`
  - `CampaignParticipant`
  - `EnterpriseAssessment`
  - `TeamAssessmentCampaign`
  - `TeamAssessmentInvite`
  - `TeamAssessmentResponse`
  - `TeamAssessmentAggregate`
  - `OrganisationAssessmentSnapshot`
- Product/privacy docs:
  - `docs/product/multi-user-control-room-guardrails.md`
- Internal multi-user logic:
  - `lib/team/team-assessment-store.ts`
  - `lib/constitution/multi-user-collision.ts` behind a summary wrapper

### Use as supporting only

- Admin pages/components for operator workflow reference
- `lib/admin/campaign/service.ts`
- `TeamAssessmentSnapshot` and `LeadershipGapSnapshot`

### Treat as unsafe until rebuilt behind auth/privacy rules

- `app/api/team-assessment/campaign/create/route.ts`
- `app/api/team-assessment/campaign/[id]/invites/route.ts`
- `app/api/team-assessment/campaign/[id]/aggregate/route.ts`
- `app/api/alignment/enterprise/campaigns/route.ts`
- `app/api/alignment/enterprise/campaigns/[id]/route.ts`
- `app/api/alignment/enterprise/campaigns/[id]/report/route.ts`

### Treat as legacy

- `lib/alignment/organization-engine.ts`
