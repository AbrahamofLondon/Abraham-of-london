# Constitutional Scoring Compatibility Check

> Date: 2026-05-08
> Scope: Verify scoring integrity after q5 and q9 rewrites

---

## 1. Question IDs remain stable

| ID | Before | After | Status |
|----|--------|-------|--------|
| q1-q4 | Unchanged | Unchanged | STABLE |
| q5 | q5 | q5 | STABLE |
| q6-q8 | Unchanged | Unchanged | STABLE |
| q9 | q9 | q9 | STABLE |
| q10 | Unchanged | Unchanged | STABLE |

**Result: PASS** -- all 10 IDs unchanged.

## 2. Answer scale remains stable

All 10 questions use dual-axis (resonance 0-10 + certainty 0-10). No change.
**Result: PASS**

## 3. Reverse scoring remains correct

| ID | Domain | Reverse | Before | After |
|----|--------|---------|--------|-------|
| q3 | environment | true | true | UNCHANGED |
| q4 | execution | true | true | UNCHANGED |
| q5 | trust | false | false | UNCHANGED |
| q6 | friction | true | true | UNCHANGED |
| q9 | pattern | true | true | UNCHANGED |

q5 was already forward-scored (high resonance = high trust). The rewrite preserves this: high resonance on "objections tested against the decision" = trust present. **Correct.**

q9 was already reverse-scored (high resonance = problems recur = bad). The rewrite preserves this: high resonance on "same problems keep resurfacing" = pattern failure. **Correct.**

**Result: PASS**

## 4. Domain mapping remains correct

| ID | Domain | Before | After |
|----|--------|--------|-------|
| q5 | trust | trust | UNCHANGED |
| q9 | pattern | pattern | UNCHANGED |

**Result: PASS**

## 5. No result language becomes inaccurate

Result language is generated from:
- `buildSummary(posture)` -- references posture label, not question text
- `buildFindings(scores)` -- references numeric thresholds (e.g., "trustScore < 45"), not question text
- Route summary -- references route label, not question text

The only text that references "trust" in findings is: "Trust condition is compromised and may reduce safe intervention fit." This remains accurate regardless of how q5 is worded, because the trust domain still measures trust.

**Result: PASS**

## 6. No route decision is distorted

Route decisions in `lib/constitution/rules.ts` use:
- `clarityScore` (from coherenceScore)
- `authorityType`
- `readinessTier`
- `seriousnessScore`
- `governanceDiscipline`
- `trustCondition` (from trustScore)
- `failureModeCount`
- `mandateFit`

None of these reference question text. The q5 rewrite still produces a trustScore via the trust domain. The q9 rewrite still feeds frictionScore via the pattern domain. Route logic unchanged.

**Result: PASS**

## 7. No admission gate is affected incorrectly

Strategy Room admission gates (`lib/strategy-room/admission.ts`) check:
- Required stages completed
- Evidence tier
- Route decision (STRATEGY)
- Decision statement length
- Authority signal
- Pre-commitment flags

None reference Constitutional question text. Admission depends on the route decision, which depends on scores, which depend on domains and IDs -- all unchanged.

**Result: PASS**

---

## Summary

| Check | Status |
|-------|--------|
| Question IDs stable | PASS |
| Answer scale stable | PASS |
| Reverse scoring correct | PASS |
| Domain mapping correct | PASS |
| Result language accurate | PASS |
| Route decisions undistorted | PASS |
| Admission gates unaffected | PASS |

**Overall: FULLY COMPATIBLE. Zero scoring regressions.**
