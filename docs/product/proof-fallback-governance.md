# Proof Fallback Governance

**Date:** 2026-05-07
**Scope:** Where DB-backed approved evidence is missing and proof blocks fall back to canned outcomes.
**Rule:** Fallback output must be classified as demonstration/sample and must not be presented as verified outcome.

---

## Fallback locations

### 1. Homepage Public Proof Blocks

**Components:** `components/proof/PublicProofBlocks.tsx`
**API:** `GET /api/proof/public`
**Data source:** `proof_evidence` table via Prisma

**Behaviour:**
- `AccuracyMetricsBlock` fetches precision %, clarification %, next-step-changed % from DB
- `ObservedOutcomesBlock` fetches anonymised outcome summaries from DB
- Both require minimum sample size of 5 approved public evidence records

**Fallback trigger:** When `approvedCount < 5` or no approved evidence exists.

**Fallback content (canned):**
```
"Leadership misalignment identified -> decision cadence stabilised within 30 days"
"Governance drift detected -> execution clarity restored across teams"
"High-risk decisions surfaced early -> escalation prevented structural damage"
```

**Risk:** These statements describe patterns the system is designed to detect, but presenting them without qualification could imply they are verified outcomes from the live system.

**Classification:** `DEMONSTRATION_FALLBACK` (per `lib/product/evidence-classification.ts`)

**Guardrail:** The `classifyProofStatus()` function in `evidence-classification.ts` returns the appropriate classification. Proof blocks should check this status and, when in fallback mode, append a visible or data-level indicator.

---

### 2. Homepage Refusal Engine Demo

**Component:** `components/homepage/CategoryFrontDoor.tsx` (section 2)
**Data source:** `const DEMO_STEPS` — hardcoded deterministic object

**Behaviour:** Shows a sample decision moving through the governing sequence with a visible RESTRICT moment.

**Fallback:** N/A — this is always static. It is labelled: "This is a deterministic demonstration."

**Classification:** `DEMONSTRATION_CASE`

**Risk:** Low. The disclaimer is visible and the content is clearly labelled as a demonstration.

---

### 3. Homepage Hero Micro-Proof Strip

**Component:** `components/homepage/CategoryFrontDoor.tsx` (hero section)
**Data source:** Static inline data

**Behaviour:** Shows four proof signals: "Evidence tested", "Contradiction found", "Directive: RESTRICT", "Action required"

**Classification:** `DEMONSTRATION_CASE`

**Risk:** Low. This is a visual representation of the system's governing sequence, not a claim about a specific verified outcome.

---

## Guardrail recommendations

### Already in place

1. The refusal engine demo includes: "This is a deterministic demonstration. Real decisions are scored by the C3 fidelity engine, contradiction kernel, action simulation, and outcome verification system."

2. The proof API returns `null` metrics when sample < 5, preventing publication of statistically unreliable percentages.

3. Evidence dossiers at `/evidence/[slug]` are rendered via static generation and labelled "Observed in practice" — not "verified by the system."

### Implemented (2026-05-07)

1. **Proof block fallback indicator:** `ObservedOutcomesBlock` now includes `data-proof-status` attribute (`VERIFIED_CASE_EVIDENCE` or `DEMONSTRATION_FALLBACK`) on the container element. Individual cards include `data-evidence-classification`. When in fallback mode, a visible label reads: "Demonstration patterns · Verified case evidence displayed when available."

2. **AccuracyMetricsBlock:** Now includes `data-proof-status="VERIFIED_CASE_EVIDENCE"` and `data-sample-size` attributes. This block only renders when sample >= 5, so it is always live evidence.

3. **Analytics tracking:** `track("proof_displayed")` now includes `proof_status` field classifying the evidence tier.

### Recommended (future)

1. **API response classification:** The `/api/proof/public` endpoint should include `proofStatus` in its response body.

2. **Deprecation of canned fallbacks:** Once the `proof_evidence` table has 5+ approved records, the canned fallback content should be deprecated. This should be a monitoring check, not a code removal.

---

## Classification reference

| Surface | Data Source | Classification | Labelled? |
|---------|-----------|---------------|-----------|
| Refusal engine demo | Static `DEMO_STEPS` | `DEMONSTRATION_CASE` | Yes — "deterministic demonstration" |
| Hero micro-proof strip | Static inline | `DEMONSTRATION_CASE` | Yes — visual only |
| Proof metrics block | DB or fallback | `LIVE_EVIDENCE` or `DEMONSTRATION_FALLBACK` | Partial — null on insufficient sample |
| Observed outcomes block | DB or fallback | `LIVE_EVIDENCE` or `DEMONSTRATION_FALLBACK` | No — canned fallbacks not labelled |
| Evidence dossiers | Static hardcoded | `STATIC_PROOF_ASSET` | Yes — "Observed in practice" |

---

## Non-touch zones

- Do not fake DB-backed proof
- Do not present demonstration content as verified outcome
- Do not remove fallback safety nets
- Do not lower the minimum sample threshold below 5
