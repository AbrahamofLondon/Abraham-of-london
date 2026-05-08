# Team / Enterprise Campaign Architecture

**Date:** 2026-05-07
**Authority:** Decision Infrastructure by Abraham of London

---

## Campaign Lifecycle

```
1. Create Campaign (Sponsor/Admin)
2. Invite Respondents (token-authenticated)
3. Collect Responses (dual-axis, timed window)
4. Validate Completion (threshold check)
5. Aggregate Signals (perception gaps, fragility, divergence)
6. Detect Divergence (leadership vs. team, cross-domain)
7. Generate Team/Enterprise Living Case
8. Issue Admission/Restriction (for ER/Strategy Room)
9. Recommend Next Surface
10. Track Outcome (14/30-day verification)
```

---

## Campaign Configuration

| Parameter | Team Assessment | Enterprise Assessment |
|-----------|----------------|---------------------|
| Minimum respondents | 3 (recommended 5+) | 5 (recommended 10+) |
| Anonymous mode | Supported | Supported |
| Named mode | Supported (sponsor sees identity) | Supported |
| Response window | Configurable (default 7 days) | Configurable (default 14 days) |
| Completion reminders | At 50%, 75%, and 24h before close | At 50%, 75%, and 48h before close |
| Sponsor can see raw responses | Named mode only | Named mode only |
| Aggregation threshold | 3+ complete responses | 5+ complete responses |

---

## Privacy Rules

| Rule | Enforcement |
|------|-------------|
| Anonymous responses are never linked to respondent identity | System-level. No admin override. |
| Named mode requires explicit respondent consent | Consent captured at invite acceptance. |
| Sponsor sees aggregated signals only (anonymous mode) | UI and API enforce. |
| Individual respondent scores are never shown to sponsor in anonymous mode | API returns aggregates only. |
| Raw response text is never exposed to sponsor | Always aggregated or anonymised. |
| Admin can see response metadata but not content in anonymous mode | Audit-level access only. |

---

## Aggregation Rules

| Signal | Computation | Source |
|--------|------------|--------|
| Perception gap | Leader score - mean respondent score per domain | TeamAssessmentResponse |
| Fragility index | Bessel-corrected standard deviation across domains | Computed from response variance |
| Domain weakness | Domains where gap > 1.5 standard deviations | Gap analysis |
| Divergence pattern | Domains where leadership and respondent means disagree by > 2 points | Cross-analysis |
| Compound severity | Combined team + enterprise signals | Cross-assessment if both exist |

---

## Evidence Tier Upgrade Logic

| Current Tier | Campaign Completion | New Tier |
|-------------|-------------------|----------|
| single_source (individual only) | Team campaign (3+ responses) | multi_source |
| single_source | Enterprise campaign (5+ responses) | multi_source |
| multi_source | Both team + enterprise campaigns | multi_source (strengthened) |
| multi_source | + outcome verification | outcome_verified |

---

## Admission Impact

| Event | Admission Effect |
|-------|-----------------|
| Team campaign completed | Enterprise Assessment becomes available |
| Enterprise campaign completed | Executive Reporting admission threshold met |
| Divergence pattern detected | Escalation trigger — Strategy Room may be warranted |
| Campaign below threshold | Results marked as "insufficient respondent sample" — does not upgrade evidence tier |

---

## Existing Prisma Models

| Model | Role |
|-------|------|
| `AlignmentCampaign` | Campaign container |
| `CampaignParticipant` | Respondent roster with status |
| `TeamAssessmentCampaign` | Team-specific campaign config |
| `TeamAssessmentInvite` | Token-authenticated invitations |
| `TeamAssessmentResponse` | Individual scored responses |
| `TeamAssessmentSnapshot` | Point-in-time aggregation |
| `TeamAssessmentAggregate` | Band-level aggregation |
| `EnterpriseAssessment` | Per-participant enterprise scoring |
| `OrganisationAssessmentSnapshot` | Org-wide aggregation |
