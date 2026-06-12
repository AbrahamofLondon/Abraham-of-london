# Product Anti-Toy Review

Hard rules: toyRiskScore > 5 cannot be gold_standard; toyRiskScore > 20 is blocked_from_release.
The decisive instrument is cross-input comparison: the same product run against two materially different situations must produce materially different judgement.

## Tested Outputs (actual composer execution)

### fast_diagnostic

- **Tested output source:** composer_execution: lib/product/fast-diagnostic-gold-composer.ts (not yet wired to live route /diagnostics/fast)
- **Toy risk score:** 35/100 — FAILS anti-toy test
- **Reasons:**
  - Near-identical judgement (84% similar) for two materially different situations — this is a template wearing the language of judgement.
  - A generic AI prompt given the same input could plausibly produce this output — the product adds structure, not proprietary judgement.
- **Required corrections:**
  - Derive diagnosis branches from the actual input pattern so different situations produce materially different judgement, not different interpolations.
  - Add judgement a generic prompt cannot produce: pattern classification across cases, calibrated severity, or evidence the platform alone holds.

### team_assessment

- **Tested output source:** composer_execution: lib/product/free-signal-gold-composer.ts (not yet wired to live surface /diagnostics (team corridor stage))
- **Toy risk score:** 45/100 — FAILS anti-toy test
- **Reasons:**
  - Moderate template share (58% cross-input similarity).
  - Consequence section is not grounded in the user's stated situation.
  - The next action is the same regardless of the situation.
  - The next action does not reference the user's actual case.
  - Nothing in the output supports later reuse.
- **Required corrections:**
  - Reduce fixed framing text relative to case-specific judgement.
  - Tie the consequence to the user's named stake, not to a universal warning.
  - Select the next action from the input pattern; identical advice for different cases is not advice.
  - Anchor the next action in the user's named decision, owner, or stake.
  - Add a checkpoint, record, or review element the user can return to.

### enterprise_assessment

- **Tested output source:** composer_execution: lib/product/free-signal-gold-composer.ts (not yet wired to live surface /diagnostics (enterprise corridor stage))
- **Toy risk score:** 45/100 — FAILS anti-toy test
- **Reasons:**
  - Moderate template share (58% cross-input similarity).
  - Consequence section is not grounded in the user's stated situation.
  - The next action is the same regardless of the situation.
  - The next action does not reference the user's actual case.
  - Nothing in the output supports later reuse.
- **Required corrections:**
  - Reduce fixed framing text relative to case-specific judgement.
  - Tie the consequence to the user's named stake, not to a universal warning.
  - Select the next action from the input pattern; identical advice for different cases is not advice.
  - Anchor the next action in the user's named decision, owner, or stake.
  - Add a checkpoint, record, or review element the user can return to.


## Untestable Outputs

- **case_dossier_tariff_shock**: Customer-facing artefact is a static evidence page; no machine-readable rendered output was captured in this pass, so external proof cannot be established.
- **case_dossier_team_alignment**: Customer-facing artefact is a static evidence page; no machine-readable rendered output was captured in this pass, so external proof cannot be established.
- **case_dossier_escalation_denied**: Customer-facing artefact is a static evidence page; no machine-readable rendered output was captured in this pass, so external proof cannot be established.

## Estate Position

All 43 products are held to this standard. Products never internally certified remain blocked pending external proof; no anti-toy pass can be assumed from structure, language, or internal scores.
