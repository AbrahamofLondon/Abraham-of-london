# Earned Progression Safety Audit

Date: 2026-05-09
Scope owner: Agent 3

## Classification scale

- `EARNED`: The CTA appears only after evidence or entitlement thresholds are met.
- `OPTIONAL`: The CTA is available but not framed as necessary.
- `PREMATURE`: The CTA appears before the evidence chain has earned it.
- `SUPPRESS`: The CTA should be hidden in the current state.
- `CONTRACTED_ONLY`: The CTA is appropriate only for retained or already-contracted users.
- `COUNSEL_ONLY`: The CTA is appropriate only when counsel escalation is warranted.

## Findings

### `lib/commercial/recommendation-engine.ts`

- Classification: `EARNED`
- Reason: The engine explicitly returns `null` when unresolved checkpoints or insufficient evidence are present. Paid progression is gated behind authority, ownership, intervention, or institutional-stakes evidence.
- Safety note: The engine already contains the correct anti-funnel rule: no paid recommendation when a checkpoint remains unresolved.

### `components/commercial/ProductRecommendationCard.tsx`

- Classification: `OPTIONAL`
- Reason: The card explains why access was earned, what the instrument will test, and what happens if the user stops. The stop-path is preserved.
- Safety note: The card does not currently force conversion language. Contracted products route to retained oversight rather than checkout.

### `lib/alignment/PurposeAlignmentAssessment.tsx`

- Classification: `EARNED`
- Reason: The assessment primarily drives evidence capture and result interpretation. It does not hard-push paid progression before the result exists.
- Safety note: The governed-memory language is firm but not coercive because it describes follow-up behaviour, not a purchase requirement.

### `pages/diagnostics/fast.tsx`

- Classification: `EARNED`
- Reason: Result-stage progression is evidence-derived through `recommendNextInstrument()`.
- Safety note: The page includes strong language around Return Brief follow-up, but that is behavioural governance rather than a commercial funnel.

### `pages/decision-centre.tsx`

- Classification: `OPTIONAL`
- Reason: Decision Centre contains action surfaces and return-brief access, but the primary emphasis is on unresolved conditions and checkpoints rather than product upsell.
- Safety note: Commercial escalation should remain subordinate to the action console role of the page.

### `pages/counsel/index.tsx`

- Classification: `COUNSEL_ONLY`
- Reason: Counsel should remain locked behind evidence thresholds, escalation conditions, or operator override. The current route already follows that architecture.
- Safety note: Counsel is correctly framed as an escalation chamber rather than a brochure.

## Required posture

- No CTA should override an unresolved checkpoint.
- No counsel CTA should appear where diagnostic evidence does not yet warrant human review.
- No retained oversight CTA should imply inevitability. It must remain evidence-based and optional unless a contract already exists.
- When evidence is insufficient, the system should be willing to say no paid step is warranted yet.

## Outcome

No coercive CTA change was required to keep this owned scope safe. The current progression architecture remains acceptable provided future edits preserve the same gating rules.
