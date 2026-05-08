# Integrity Seal Public Standard

**Date:** 2026-05-08
**Authority:** Decision Infrastructure by Abraham of London

---

## Seal Levels

### BRONZE
**Public language:** "Verified internally. Not publishable."

- Minimum confidence: 85%
- Verification method: Any
- Financial impact: Not required
- Contract trace: Not required
- Publication: NOT PERMITTED
- Currently issuable: YES
- Currently published: NO (by design — BRONZE is internal-only)

**What it means:** The outcome has been recorded and passes minimum confidence. It has not been independently confirmed.

**What it does not mean:** The outcome is proven, validated, or ready for external consumption.

### SILVER
**Public language:** "Outcome-supported and publication-eligible after review."

- Minimum confidence: 85%
- Verification method: BEHAVIOURAL or DOCUMENTARY required
- Financial impact: Required
- Contract trace: Not required
- Publication: PERMITTED after human review
- Currently issuable: YES (when evidence pipeline produces eligible outcomes)
- Currently published: NO (no cases have passed the full pipeline yet)

**What it means:** The outcome has behavioural or documentary evidence, includes financial impact, and has been reviewed for publication eligibility.

**What it does not mean:** The outcome is guaranteed or universally replicable.

### GOLD
**Public language:** "Operator-confirmed with documentary and commercial trace."

- Minimum confidence: 90%
- Verification method: OPERATOR_CONFIRMED or DOCUMENTARY required
- Financial impact: Required
- Contract trace: Required
- Publication: PERMITTED after human review
- Currently issuable: YES (when operator-confirmed outcomes exist with contract trace)
- Currently published: NO

**What it means:** The outcome includes operator confirmation, documentary support, financial impact trace, and human review. The evidence chain is traceable to a specific contract or decision record.

**What it does not mean:** Perfection. It means the evidence met a governed threshold for transparency and accountability.

### PLATINUM
**Public language:** "Reserved — not currently issued."

- Minimum confidence: 95%
- Verification method: OPERATOR_CONFIRMED or DOCUMENTARY required
- Financial impact: Required
- Contract trace: Required
- Multiple cases confirmed: Required
- Publication: PERMITTED after human review
- Currently issuable: **NO** — `multipleCasesConfirmed` mechanism not yet operational
- Currently published: NO

**What it means:** When operational, PLATINUM will require repeated verified patterns across multiple independent cases.

**What it does not mean:** That we claim to have PLATINUM evidence. We do not. This level is reserved until the evidence threshold can be truthfully met.

---

## Publication Rules

1. `sealPermitsPublication()` blocks anything below SILVER
2. SELF_REPORTED outcomes cannot receive a publishable seal
3. Every seal output includes: seal level, confidence, verification method, publication eligibility, missing fields
4. No seal is issued without: confidence score, verification method classification, and data completeness assessment
5. Human review is required before any sealed evidence is published
6. PLATINUM must not appear on any public surface as "available" until the mechanism supports it

---

## Implementation Reference

- Seal logic: `lib/evidence/evidence-integrity-seal.ts`
- Types: `lib/evidence/case-study-types.ts`
- Generator: `lib/evidence/case-study-generator.ts`
- Publication gate: `sealPermitsPublication()` — returns `false` for BRONZE and any seal with critical missing fields
