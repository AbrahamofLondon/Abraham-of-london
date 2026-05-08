# Purpose Alignment Result Consistency Check

> Date: 2026-05-08
> Scope: Verify result page integrity after question changes

---

## Check 1: No removed question referenced in results

**Status: PASS**

No questions were removed. All 18 IDs remain in `PURPOSE_ALIGNMENT_QUESTIONS`. The result page references questions via their IDs from `result.rawResponses`, which are populated from the same array. No orphan references.

## Check 2: No rewritten question breaks result interpretation

**Status: PASS**

The result page (`PurposeAlignmentAssessment.tsx`) references questions in two places:
1. **"How this was determined" details section** (line 734): Renders `item.statement` from `result.rawResponses` — this pulls from `PURPOSE_ALIGNMENT_QUESTIONS[].statement`, so rewrites are automatically reflected.
2. **Pattern trigger explanation** (line 756): Uses `result.primaryPattern` which is computed from domain scores, not question text.

No result interpretation depends on specific question wording.

## Check 3: Contradictions still cite valid evidence

**Status: PASS**

Contradiction detection in `lib/alignment/intelligence-engine.ts` operates on domain scores and dual-axis gap patterns, not on question text. Contradiction evidence strings are generated from domain labels and score values. The rewritten questions do not affect contradiction logic.

## Check 4: Domain scoring maps correctly

**Status: PASS**

Scoring in `lib/alignment/scoring.ts`:
- `scorePurposeProfile()` iterates `PURPOSE_ALIGNMENT_QUESTIONS` to compute domain profiles
- Each question contributes to its domain via `resonance × certaintyWeight`
- Domain assignment is by `question.domain`, not by question text
- All 18 questions retain their original domain assignment

Domain balance:
- identity: 3 questions (unchanged)
- decision: 3 questions (unchanged)
- environment: 3 questions (unchanged)
- behaviour: 3 questions (unchanged)
- emotional_order: 3 questions (unchanged)
- legacy: 3 questions (unchanged)

## Check 5: "What would strengthen this" remains accurate

**Status: PASS**

The corrections/strengths in `scoring.ts` (`getCorrections()`, `getStrengths()`) are generated from domain-level analysis, not from question text. The correction messages reference domains (e.g., "Rewrite your current mandate") not specific question wording.

## Check 6: Context answers used where available

**Status: PASS**

Context answers are used in:
1. Result narrative (lines 692–694): `contextAnswers.avoidedDecision`, `contextAnswers.competingObligation`
2. "You indicated" section (lines 731–733): All 3 context answers listed
3. Living intelligence panels (line 830): `contextAnswers.avoidedDecision` shown
4. API persistence (line 297–300): All 3 sent as reflections

Context questions were not modified in this pass.

## Check 7: Result feels bespoke, not template-driven

**Status: PASS**

The result references:
- User's avoided decision by exact text
- User's competing obligation by exact text
- User's consequence by exact text
- Pattern-specific narrative from `anchorNarrative`
- Domain-specific pressure point
- Contradiction evidence from dual-axis gap analysis
- Cost of inaction timeline (30/60/90 days)
- Required move specific to pattern

The result is structurally bespoke.

## Check 8: No generic self-help language in result copy

**Status: PASS**

Result copy uses:
- "This is not random. This is structural." (line 657)
- "Where is your direction breaking down?" (line 449)
- "This is not a confidence exercise. It is a structural reading..." (line 453)
- Domain corrections use language like "Remove one recurring source of noise" and "Stabilise sleep, input, and response rhythm" — clinical, not inspirational.

No self-help language detected.

---

## Verdict

All 8 consistency checks pass. The question rewrites are fully compatible with the result page, scoring engine, contradiction detection, and downstream surfaces.
