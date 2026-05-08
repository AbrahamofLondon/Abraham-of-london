# Constitutional Result Consistency Check

> Date: 2026-05-08
> Scope: Verify all result surfaces remain correct after q5/q9 rewrites

---

## Surfaces Checked

### 1. Constitutional Diagnostic result page
**File:** `components/diagnostics/ConstitutionalDiagnostic.tsx`

- Questions rendered from `DEFAULT_DIAGNOSTIC_QUESTIONS` dynamically (line 273)
- Result micro-report rendered from `deriveConstitutionalMicroReport()` output
- No hardcoded question text in result display
- Key findings generated from numeric thresholds, not question wording
- Route summary uses posture labels, not question references
- **Status: COMPATIBLE**

### 2. Constitutional narrative block
**File:** `lib/diagnostics/constitutional-diagnostic-derivation.ts` (lines 231-243)

- `buildSummary()` generates narrative from posture classification
- References: "disorder-risk", "misalignment", "drift", "relatively ordered"
- No question text referenced
- **Status: COMPATIBLE**

### 3. Strategy Room constitutional result surface
**File:** `lib/diagnostics/constitutional-bridge.ts`

- Transforms `ConstitutionalMicroReport` into seed payloads for downstream stages
- References numeric scores only: authorityScore, coherenceScore, trustScore, frictionScore
- No question text referenced
- **Status: COMPATIBLE**

### 4. Decision Centre inherited signals
**File:** `lib/constitution/assessment-engine.ts`

- Uses "materially intact" in result interpretation for ORDERED posture (line 537)
- This is result narrative language about institutional order, not a q5 reference
- The phrase describes the posture classification outcome, not the question input
- **Status: COMPATIBLE** -- no conflict with q5 rewrite

### 5. Executive Reporting inherited constitutional posture
**File:** `pages/diagnostics/executive-reporting/run.tsx`

- Inherits `ConstitutionalMicroReport` via session/localStorage bridge
- References: `authorityType`, `posture`, `readinessTier`, numeric scores
- No question text referenced in ER surface
- **Status: COMPATIBLE**

---

## Specific Checks

### q5 rewrite impact on result copy
The trust domain findings in `buildFindings()` (line 286-288):
```
if (input.trustScore < 45) {
  findings.push("Trust condition is compromised and may reduce safe intervention fit.");
}
```
This text describes the trust condition, not the question. It remains accurate whether q5 asks about "materially intact" trust or "objections tested against the decision." Both measure the trust domain.

### q9 rewrite impact on result copy
The pattern domain feeds into `frictionScore`. Friction findings (lines 270-277):
```
"Structural friction is high and likely compounding execution drag."
"Friction is present and meaningful."
"Friction is present but currently governable."
```
These describe friction state, not question wording. The q9 rewrite (pattern recurrence) still feeds friction via the pattern domain. Correct.

### Generic language check
No result surface uses:
- "leadership assessment"
- "personality"
- "self-help"
- "personal development"
- "engagement"

All result language is structural: "disorder-risk", "misalignment", "drift", "governance discipline", "intervention readiness."

---

## Verdict

All 5 result surfaces verified. No result language references old q5/q9 wording. No result interpretation becomes inaccurate. All outputs remain structural and decision-oriented.
