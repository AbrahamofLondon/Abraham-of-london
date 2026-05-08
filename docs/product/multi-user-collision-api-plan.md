# Multi-User Collision Detection API Plan

**Date:** 2026-05-07
**Status:** PLAN ONLY — not implemented. `lib/constitution/multi-user-collision.ts` does not exist in the codebase.

---

## Context

Deepseek referenced a `multi-user-collision.ts` module. Investigation confirms this file does not exist. The collision detection capability must be built.

## What collision detection means

In multi-respondent campaigns, "collision" refers to structural disagreements between:
- Leadership perception vs. team reality (perception gap)
- Cross-domain divergence (authority says X, execution says Y)
- Cross-respondent divergence (respondent A says high trust, respondent B says no trust)
- Cross-campaign divergence (team campaign and enterprise campaign disagree)

## Existing foundations

| Capability | Location | Status |
|-----------|----------|--------|
| Perception gap analysis | `pages/diagnostics/team-assessment.tsx` (local computation) | EXISTS — per-domain gap |
| Fragility index | `calculateFragility()` | EXISTS — Bessel-corrected |
| Team aggregation | `TeamAssessmentAggregate` Prisma model | EXISTS — band-level |
| Enterprise aggregation | `OrganisationAssessmentSnapshot` | EXISTS — org-wide |
| Cross-respondent divergence | `DiagnosticEvidenceNode` with kind `respondent_divergence` | EXISTS — evidence node type |
| Divergence pattern type | `lib/product/evidence-classification.ts` `SignalContinuity` | EXISTS |

## Proposed API

```
GET /api/admin/organisations/[id]/collisions
Authorization: admin-only (requireAdminPage)

Response:
{
  ok: true,
  organisationId: string,
  campaigns: [{
    campaignId: string,
    title: string,
    collisions: [{
      domain: string,
      type: "perception_gap" | "cross_respondent" | "cross_domain" | "cross_campaign",
      severity: "low" | "medium" | "high" | "critical",
      leaderScore: number | null,
      aggregateRespondentScore: number | null,
      gap: number | null,
      description: string,
      privacyClassification: "aggregated" | "named_only"
    }],
    totalCollisions: number,
    highestSeverity: string
  }]
}
```

## Privacy requirements

- Response MUST include `privacyClassification` per collision
- Anonymous campaign collisions: `"aggregated"` — no individual attribution
- Named campaign collisions: `"named_only"` — individual attribution possible
- Minimum 3 respondents per domain for any collision to be reported
- API is admin-only — never exposed to sponsor without role check

## Implementation steps

1. Create `lib/diagnostics/collision-detection.ts` with aggregation logic
2. Reuse existing gap analysis from team assessment
3. Create API route at `pages/api/admin/organisations/[id]/collisions.ts`
4. Protect with `requireAdminPage()`
5. Add privacy classification to every collision
6. Add minimum sample enforcement

## Risk: LOW — admin-only, aggregated data, no new schema required.
