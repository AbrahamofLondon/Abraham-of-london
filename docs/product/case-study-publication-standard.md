# Case Study Publication Standard

**Date:** 2026-05-08
**Authority:** Decision Infrastructure by Abraham of London

---

## Pipeline Stages

1. **Candidate detected** — outcome verification record exists
2. **Evidence assembled** — situation, contradiction, decision, intervention, outcome extracted
3. **Verification classified** — SELF_REPORTED / BEHAVIOURAL / DOCUMENTARY / OPERATOR_CONFIRMED
4. **Integrity seal assigned** — BRONZE / SILVER / GOLD / PLATINUM
5. **Anonymisation applied** — names, organisations, identifiers stripped; financial figures ranged
6. **Human review required** — reviewer confirms anonymisation, accuracy, and non-identifiability
7. **Publication decision recorded** — APPROVED / REJECTED / SUPPRESSED with reason
8. **Public-safe narrative generated** — five sections: situation, contradiction, decision, intervention, outcome
9. **Client permission checked** — no client identifier published without express authorisation
10. **Published or withheld** — public status set; classification label attached

## Case Study Content Requirements

Each published case must include:
- Evidence classification (e.g., "Documentary evidence")
- Verification method (e.g., "Operator-confirmed")
- Seal level (e.g., "Gold Seal")
- Publication status (e.g., "Published — reviewed 2026-05-08")
- What was observed (five narrative sections)
- What was not claimed (explicit caveat)
- Timeframe (generalised if identification risk)
- Caveat statement

## Publication Rules

- Do not publish below SILVER seal
- Do not publish SELF_REPORTED outcomes as proof
- Do not publish without human review
- Do not publish without anonymisation verification
- If fewer than 3 SILVER+ cases exist, do not create a public case studies page

## Current Status

No case studies are currently published. The pipeline exists. When evidence meets the threshold, cases will be published through the governed pipeline with full seal and classification labelling.

## Implementation

- Generator: `lib/evidence/case-study-generator.ts`
- Draft builder: `lib/evidence/case-draft-builder.ts`
- Types: `lib/evidence/case-study-types.ts`
- Seal: `lib/evidence/evidence-integrity-seal.ts`
