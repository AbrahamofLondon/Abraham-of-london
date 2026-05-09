# Evidence Posture Enforcement Standard

**Date:** 2026-05-09
**Purpose:** Canonical rules for evidence posture labelling across all surfaces

---

## Allowed Evidence Postures

| Posture | When to Use | Example |
|---------|-------------|---------|
| `USER_REPORTED` | User explicitly stated this in intake, form, or assessment | "Based on your stated decision context" |
| `SYSTEM_INFERRED` | System computed from user inputs | "System-inferred from assessment responses" |
| `SYSTEM_MEASURED` | System measured from checkpoint/execution data | "Measured from recorded checkpoints" |
| `SYSTEM_COMPUTED` | System calculated from multiple inputs | "Computed from diagnostic evidence" |
| `ESTIMATED` | Projected/scenario from stated inputs | "Estimated exposure — scenario only" |
| `AGGREGATED` | Combined from multiple respondents | "Aggregated from N respondents" |
| `OPERATOR_REVIEWED` | Reviewed by authorised human operator | "Reviewed by qualified analyst" |
| `OUTCOME_VERIFIED` | Confirmed by actual outcome evidence | "Verified against documented outcomes" |
| `SUPPRESSED` | Withheld for privacy/safety/entitlement | "Detail withheld to preserve privacy" |
| `INSUFFICIENT_DATA` | Not enough evidence to classify | "Insufficient evidence" |

---

## Rules

### VERIFIED / OUTCOME_VERIFIED
- May ONLY be used when there is actual outcome confirmation, documentary evidence, or operator-verified evidence
- Self-reported outcomes must use `USER_REPORTED`, not `VERIFIED`
- System-measured data must use `SYSTEM_MEASURED` or `MEASURED` confidence label, not `VERIFIED`
- The guard script `scripts/evidence-posture-guard.mjs` enforces this in CI

### Financial Exposure
- Must ALWAYS carry `ESTIMATED` posture unless externally audited
- Must include "Scenario only — not a financial forecast" disclaimer
- Must state the basis: "from your stated inputs" / "from declared revenue exposure"

### Team / Multi-Respondent Data
- Must use `AGGREGATED` posture
- Must state respondent count
- Must be suppressed below minimum sample threshold (currently N < 3)

### Counsel Output
- Must use `OPERATOR_REVIEWED` only when an authorised operator has actually reviewed the case
- Pre-review counsel data must use `SYSTEM_INFERRED`

### Raw User Text
- Must always be labelled `USER_REPORTED`
- Must never be labelled `VERIFIED` or `SYSTEM_INFERRED`
- Must include attribution: "You indicated..." or "You stated..."

### Suppressed Evidence
- Must show suppression reason, not blank silence
- Use: "Detail withheld to preserve privacy" or "Evidence suppressed — insufficient sample"
- Never silently omit evidence without explanation

---

## Confidence Labels

| Label | When to Use |
|-------|-------------|
| `MEASURED` | System has measured this from recorded data |
| `INFERRED` | System has inferred this from available signals |
| `REVIEWED` | Operator has reviewed this |
| `VERIFIED` | Outcome has been independently confirmed (ONLY with OUTCOME_VERIFIED posture) |
| `PARTIAL` | Some evidence exists but is incomplete |
| `UNAVAILABLE` | Not enough data to assign confidence |
| `CAPTURED` | Evidence has been recorded but not yet assessed |
| `ESTIMATED` | Projection from stated inputs |

---

## Violations Fixed in This Pass

| File | Before | After | Issue |
|------|--------|-------|-------|
| `lib/analytics/decision-velocity.ts:160` | `confidenceLabel: "VERIFIED"` for SYSTEM_MEASURED | `confidenceLabel: "MEASURED"` | System-measured data is not "verified" |
| `components/proof/PublicProofBlocks.tsx` | `VERIFIED_CASE_EVIDENCE` for self-reported data | `SOURCE_LABELLED_EVIDENCE` | Self-reported accuracy signals are not verified evidence |
| `lib/product/proof-pack-generator.ts` | `posture: "VERIFIED"` for diagnosticsCompleted and checkpointsCreated | `posture: "SYSTEM_INFERRED"` | Completing a diagnostic is not verification |
| `components/alignment/OGRHandoverDocument.tsx` | "verified Resonance Fidelity" | "measured Resonance Fidelity" | Measurement is not independent verification |
| `components/alignment/OGRCoherenceLock.tsx` | "verified against" | "measured against" | Same — measurement, not verification |

---

## Enforcement

The guard script `scripts/evidence-posture-guard.mjs` runs in CI and blocks:
1. Any use of `VERIFIED_CASE_EVIDENCE` classification
2. Any `confidenceLabel: "VERIFIED"` outside of outcome-verification and contradiction-graph (where VERIFIED is contextually correct for OUTCOME_VERIFIED posture)

Extend the script as new posture patterns emerge.
