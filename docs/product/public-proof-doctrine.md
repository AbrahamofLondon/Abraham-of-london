# Public Proof Doctrine

**Date:** 2026-05-08
**Authority:** Decision Infrastructure by Abraham of London
**Status:** Canonical — all proof surfaces must comply

---

## Principles

1. **Standards may be published before outcomes.** We can disclose how we classify proof without having published cases. This builds trust in the institution.

2. **Aggregate metrics may be published only when sample thresholds are met.** Minimum N=15 for any public aggregate claim. No statement below threshold. Return `INSUFFICIENT_SAMPLE` instead.

3. **Case studies may be published only after integrity seal approval.** Minimum SILVER seal. Human review required. No auto-publication.

4. **Client names must never be exposed unless expressly authorised.** No exceptions. No implied identification through sector + size + timeframe combination.

5. **Self-reported outcomes must never be represented as independently verified.** Self-reported evidence is labelled `SELF_REPORTED` and never receives a publishable seal.

6. **Demonstration patterns must be visibly labelled.** Every static or illustrative proof block must carry `data-proof-status="DEMONSTRATION_FALLBACK"` or equivalent visible classification.

7. **Static proof assets must be visibly labelled.** Case dossiers built from anonymised, pre-written narratives must be labelled `STATIC_PROOF_ASSET`.

8. **Proof claims must always show evidence class, cohort size, or verification method where relevant.** No bare percentage. No bare claim. Every metric accompanied by its basis.

9. **No scoring formulas, arbitration logic, prompt structures, contradiction graph mechanics, or proprietary weighting methods may be published.** Proof describes governance standards, not engine internals.

10. **Proof language must describe governance standards, not engine internals.** Say "evidence tested for clarity, contradiction, and consequence" not "C3 fidelity scorer applied."

---

## What Public Proof Must Answer

- What standard was applied?
- What kind of evidence supports this?
- What was verified?
- What was not verified?
- What sample size applies?
- What confidence threshold applies?
- What publication gate was passed?

## What Public Proof Must Not Reveal

- How the contradiction engine works
- Internal signal extraction logic
- Engine weights
- Arbitration mechanics
- Private prompt structures
- Exact admission/refusal thresholds
- Proprietary state architecture

---

## Proof Vocabulary

### Preferred
- evidence-supported
- publication-eligible
- review-gated
- anonymised aggregate
- demonstration pattern
- verified within the review window
- outcome-supported
- operator-confirmed
- documentary trace
- client-safe
- insufficient sample
- reserved until evidence threshold is met

### Forbidden on public surfaces
- "proven" (unless supported by published, sealed evidence)
- "guaranteed"
- "verified" without method
- "statistical" without N
- "outcome" without classification
- "AI-powered proof"
- "platinum" (unless issuable — currently reserved)
- "case study" (unless published and sealed)
- "live evidence" (if fallback)
- "behaviour verified" (if self-reported)
- "institutional intelligence" (if only case-level data)
