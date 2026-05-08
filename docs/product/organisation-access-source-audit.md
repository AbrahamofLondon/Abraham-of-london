# Organisation Access Source Audit

**Date:** 2026-05-08

---

## Models

| Model | Fields relevant to access | Classification |
|-------|--------------------------|---------------|
| `Organisation` | id, slug, status | CANONICAL |
| `OrganisationMembership` | organisationId, email, roleTitle, isExecutive, status | CANONICAL — primary access source |
| `AlignmentCampaign` | organisationId, status, createdByMembershipId | CANONICAL — campaign ownership |
| `CampaignParticipant` | campaignId, email, status | CANONICAL — respondent identity |
| `TeamAssessmentCampaign` | campaignId, status | SUPPORTING |
| `TeamAssessmentInvite` | campaignId, tokenHash, email, status | SUPPORTING — invite-based access |
| `RetainerContract` | organisationId, tier, status | CANONICAL — retainer access |
| `OrganisationInvite` | organisationId, email, status | SUPPORTING — onboarding |

## Auth helpers

| Helper | Location | Classification |
|--------|----------|---------------|
| `resolveIdentity()` | `lib/auth/resolve-identity.ts` | CANONICAL — user identity |
| `getUserAccess()` | `lib/access/get-user-access.ts` | CANONICAL — tier/entitlement |
| `requireAdminPage()` | `lib/server/auth/admin.ts` | CANONICAL — admin gate |
| `evaluateOrganisationAccess()` | `lib/product/organisation-access.ts` | CANONICAL — NEW, org-scoped access |
| `hasAccess()` | `lib/access/tier-policy.ts` | SUPPORTING — tier comparison |

## Current gaps

| Gap | Severity | Status |
|-----|----------|--------|
| No org-scoped access layer existed | HIGH | RESOLVED — `organisation-access.ts` created |
| OrganisationMembership has no explicit "role" enum | MEDIUM | MITIGATED — role derived from roleTitle + isExecutive |
| No organisation-level entitlement model | MEDIUM | DOCUMENTED — derive from member entitlements initially |
| Campaign creator not enforced as sponsor | LOW | `createdByMembershipId` exists but not checked in access helper |
| Named vs anonymous enforcement per-campaign | MEDIUM | Handled by `multi-user-privacy.ts` — default anonymous |
