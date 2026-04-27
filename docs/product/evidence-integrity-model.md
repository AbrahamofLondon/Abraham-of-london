# Evidence Integrity Model

## Proof Doctrine — Abraham of London

---

## Why Evidence Is Not Self-Declared

Most organisations publish "case studies" that are self-declared success stories. The client says they were happy. The vendor publishes it. There is no verification layer. There is no audit trail. There is no way to distinguish between marketing copy and demonstrated outcome.

Abraham of London does not operate on self-declared evidence. Every published case study must trace back through a four-layer verification chain:

```
Published Case Study
  → Approved by Human Review
    → Integrity Seal (BRONZE/SILVER/GOLD/PLATINUM)
      → Verified Outcome Record
        → PatternBreakerContract (commitment + breach tracking)
          → DiagnosticDecisionObject (decision identified)
            → IntelligenceSpine (user's own inputs)
```

This chain ensures that every claim in a published case study is grounded in data the user themselves provided, actions the system tracked, and outcomes the system verified.

---

## Verification Confidence Caps

Every outcome carries a confidence score (0-1) derived from:

| Factor | Weight | Source |
|--------|--------|--------|
| Outcome classification | 40% | `OutcomeVerificationRecord.outcomeClassification` |
| Magnitude of change | 25% | Delta between baseline and follow-up |
| Intervention effectiveness | 25% | `effectivenessScore` with contradiction penalties |
| Verification method | 10% | SELF_REPORTED / BEHAVIOURAL / DOCUMENTARY / OPERATOR_CONFIRMED |

**Confidence caps by verification method:**

| Method | Max Confidence | Why |
|--------|---------------|-----|
| SELF_REPORTED | 0.70 | User says it happened. No independent verification. |
| BEHAVIOURAL | 0.85 | System detected behavioural change. Correlated but not confirmed. |
| DOCUMENTARY | 0.92 | External documentation supports the claim. |
| OPERATOR_CONFIRMED | 0.98 | Human operator verified the outcome directly. |

A case study may only be generated when confidence >= 0.85. This eliminates self-reported outcomes from the evidence pipeline.

---

## Integrity Seal Levels

Every generated case draft receives an integrity seal. The seal level determines whether the draft may be published.

| Level | Requirements | Publication Allowed |
|-------|-------------|-------------------|
| **BRONZE** | Verified outcome, confidence >= 0.85 | No |
| **SILVER** | Behavioural/documentary evidence + financial impact | Yes |
| **GOLD** | Operator-confirmed/documentary evidence + financial impact + contract trace | Yes |
| **PLATINUM** | All GOLD requirements + repeated pattern across multiple cases | Yes |

**BRONZE** cases are useful for internal review and pattern detection but cannot be used as public proof. They lack the verification depth required for external credibility.

**SILVER** cases are the minimum for publication. They include behavioural or documentary evidence and a quantified financial impact.

**GOLD** cases add contract traceability — the outcome can be traced back to a specific commitment with breach tracking.

**PLATINUM** cases demonstrate that the same pattern has been successfully resolved multiple times, indicating structural rather than situational effectiveness.

---

## Why Self-Reported Cases Cannot Be Public Proof

A self-reported outcome (confidence < 0.85, verification method = SELF_REPORTED) is a claim, not evidence. The system explicitly blocks these from the publication pipeline because:

1. **No independent verification** — The system cannot distinguish between "it happened" and "the user believes it happened."
2. **No behavioural data** — Self-reporting does not generate the delta measurements that the outcome verification engine requires.
3. **No breach trace** — Self-reported outcomes are not linked to PatternBreakerContracts, so there is no commitment-to-action chain.
4. **Competitor vulnerability** — Self-reported case studies are indistinguishable from marketing copy. They provide no competitive defence.

The rule is absolute: **No public case may be marked "verified" without an integrity seal.**

---

## Outcome → Contract → Decision Trace

Every published case study must maintain an internal trace to its source records:

```
Published Case (public)
  → EvidenceCaseDraft (internal, retains sourceOutcomeId)
    → OutcomeVerificationRecord (internal, retains payload)
      → PatternBreakerContract (internal, retains commitment + breach data)
        → DiagnosticDecisionObject (internal, retains decision text)
```

The public output removes all source IDs. The internal record retains them. This enables:

- **Auditability** — Any published case can be traced back to its source data
- **Credibility defence** — If challenged, the system can produce the verification chain
- **Pattern detection** — Multiple cases tracing to the same contract or decision indicate structural recurrence

---

## How This Creates a Defensible Evidence Layer

| Competitor Practice | Abraham of London Practice | Defensive Advantage |
|-------------------|--------------------------|-------------------|
| Self-declared success stories | Verified outcomes with integrity seals | Cannot be replicated without the verification infrastructure |
| Testimonials from "happy clients" | Anonymised, traceable outcome data | No reliance on client willingness to provide quotes |
| Case studies as marketing copy | Case studies as auditable evidence | Can withstand scrutiny that would destroy competitor claims |
| One-off stories | Pattern-repeated PLATINUM seals | Demonstrates systematic rather than anecdotal effectiveness |
| No verification method disclosed | Confidence caps by verification method | Transparency creates trust; competitors cannot match the specificity |

The evidence integrity model transforms case studies from marketing assets into **defensible proof**. Competitors who claim similar outcomes without the verification infrastructure are making claims they cannot substantiate. The integrity seal makes this visible.

---

## Publication Rules Summary

1. Only approved drafts can become public evidence
2. Only drafts with SILVER, GOLD, or PLATINUM seals may be approved for publication
3. BRONZE seals are for internal use only
4. Rejected drafts remain internal and are never published
5. Published cases must retain `sourceOutcomeId` internally
6. Public output must remove all identifying details (source IDs, client names, specific dates)
7. No draft auto-publishes — human review is always required
8. Published cases may be recalled for correction if new information emerges
