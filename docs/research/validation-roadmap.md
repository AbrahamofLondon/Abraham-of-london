# Validation Roadmap

> Current status: Decision-structure instruments in production use.
> Validation stage: Operational with outcome tracking planned.

## 1. Outcome Tracking Plan

- **14-day check-in**: Automated email follow-up asking whether the recommended action was taken.
- **30-day outcome review**: Structured review of whether the identified tension was resolved, persisted, or escalated.
- **90-day impact assessment**: For Strategy Room and Executive Reporting clients, a follow-up measuring whether the decision structure materially changed.

### Implementation

- Follow-up emails sent via existing email infrastructure (Resend).
- Outcome data stored in `SystemAuditLog` or dedicated `OutcomeReview` table.
- All outcome data anonymised before aggregation.

## 2. Reliability Testing Plan

- **Test-retest reliability**: Offer returning users the option to retake the fast diagnostic after 14 days. Measure consistency of structural findings when reported situation has not changed.
- **Internal consistency**: Monitor cross-question consistency scores already computed by the challenge engine.
- **Inter-rater comparison (team/enterprise)**: When multi-respondent mode is active, compare leader-estimated results against team-aggregated results.

### Target

- Publish internal reliability report after 200+ paired responses.
- Make reliability data available to institutional clients on request.

## 3. User Feedback Loop

- Post-result "Did this reading help?" prompt (binary + optional text).
- "This does not fit my situation" feedback path on all result screens.
- "Challenge this reading" option linked to human review via support.
- Aggregated feedback reviewed monthly by product team.

## 4. Multi-Rater Team Validation

- **Phase 1 (current)**: Single-respondent team assessment labelled as "leader-estimated."
- **Phase 2 (planned)**: Multi-respondent team assessment with individual invite links.
- **Phase 3 (target)**: Cross-respondent divergence analysis showing where leader perception and team reality differ.

### Evidence Tier Framework

| Tier | Label | Meaning |
|------|-------|---------|
| 1 | Single-source | One respondent's perspective |
| 2 | Multi-source | Multiple respondent inputs aggregated |
| 3 | Outcome-verified | Validated against real-world outcomes |
| 4 | Human-reviewed | Reviewed by a qualified analyst |

## 5. Report Accuracy Review

- Executive Reports that generate financial exposure projections will carry clear labelling:
  - "Scenario projection" (not forecast)
  - Assumptions listed
  - Confidence band noted
  - "Not financial advice" disclaimer
- Periodic review of projection accuracy against client-reported outcomes.

## 6. Case Study Standard

Published case evidence must meet:

1. Anonymised identity
2. Verifiable condition (what was measured)
3. Decision taken (what action followed)
4. Outcome observed (what changed)
5. Time window documented
6. Limitations acknowledged

Current published cases: 3 (see `/evidence`).
Target: 6+ outcome-verified cases within 12 months.

## 7. Evidence Tier Framework (Component)

Implemented as `components/trust/EvidenceTierBadge.tsx`.
Available tiers: `single_source`, `multi_source`, `outcome_verified`, `human_reviewed`.

Displayed on all assessment result screens to clearly communicate evidence strength.

## 8. External Validation Path

- No claim of independent psychometric validation is made.
- If independent validation is pursued, it will follow established standards (e.g., BPS guidelines for occupational testing).
- Current instruments are positioned as decision-structure tools, not clinical measures.

---

*This roadmap is a living document. Updated as validation milestones are reached.*
