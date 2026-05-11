# Purpose Alignment — Paid Implementation Summary

## Classification: `PURPOSE_ALIGNMENT_PAID_INSTRUMENT_UNDERPRICED_AND_CORRIDOR_READY`

## Files Created

| File | Purpose |
|------|---------|
| `lib/alignment/purpose-alignment-paid-contract.ts` | **P1** — Paid result contract (10 deliverables) |
| `lib/alignment/purpose-alignment-corridor-bridge.ts` | **P5** — Corridor bridge to ER/Strategy Room/DC |
| `lib/pdf/templates/PurposeAlignmentPaidDossier.tsx` | **P3** — Full PDF dossier (3-page A4) |
| `netlify/functions_src/functions/purpose-alignment-paid-dossier.tsx` | **P3** — Netlify function for paid PDF with entitlement check |
| `pages/checkout/personal-decision-audit.tsx` | **P2** — Stripe checkout page for £49 purchase |

## Files Modified

| File | Change |
|------|--------|
| `app/api/purpose-alignment/assessments/route.ts` | **P2** — Added entitlement check + paid result enrichment + DC memory write |
| `lib/alignment/PurposeAlignmentAssessment.tsx` | **P4** — Added `isPaid`/`paidResult` state, paid UI sections, conditional PDF link |
| `lib/commercial/catalog.ts` | **P2** — Updated `personal_decision_audit` with delivery metadata |

## Architecture

```
User completes assessment (free)
  → POST /api/purpose-alignment/assessments
    → scorePurposeProfile() → free result
    → resolveCanonicalEntitlement("personal-decision-audit")
      → if entitled: buildPaidResult() → full £49 result
        → createCheckpointForCommand() → Decision Centre memory
        → paidResult returned in response
      → if not entitled: free result only
    → Client renders based on isPaid flag
      → Free: existing UI
      → Paid: badge + full dossier link + corridor bridge display
```

## The 10 Paid Deliverables

1. **Mandate clarity reading** — declared vs inferred mandate, alignment band, viability, operating sentence
2. **Obligation conflict map** — primary competing obligation, consequence, distortion effect, nature, renegotiation path, carrying cost
3. **Decision behaviour pattern** — primary + secondary pattern, manifestation, trigger conditions, recurrence risk
4. **Alignment drift warning** — active drift detection, 30/60/90-day projections, corrective vector
5. **Execution integrity implication** — integrity score, must-protect/must-stop lists, execution risk
6. **Personal decision constitution summary** — governing principle, decision rules, authority boundaries, escalation triggers, rights statement
7. **Next admissible move** — single move, rationale, cost of delay, time sensitivity, escalation qualification
8. **Decision Centre memory write** — checkpoint created, memory items for DC display
9. **PDF dossier** — 3-page A4 document with all 10 deliverables, watermark, QR code
10. **ER/Strategy Room bridge** — corridor bridge payload when escalation is justified

## Future Corridor Readiness

The `purpose-alignment-corridor-bridge.ts` file defines the future standalone corridor:

```
Personal Mandate → Decision Pattern → Obligation Conflict →
Alignment Drift → Execution Integrity → Life/Work Governance
```

Each stage maps to a field in the paid result contract, making it trivial to build the corridor UI when required.

## Commercial Flow

1. User lands on `/diagnostics/purpose-alignment` (free entry)
2. Completes assessment → gets free result
3. Sees upgrade prompt → clicks → `/checkout/personal-decision-audit`
4. Purchases £49 → entitlement granted → redirected back to assessment
5. Re-takes or views existing result → `isPaid=true` → full dossier available
6. PDF download → `/.netlify/functions/purpose-alignment-paid-dossier?assessmentId=X&email=Y`
7. If escalation justified → corridor bridge feeds Executive Reporting
