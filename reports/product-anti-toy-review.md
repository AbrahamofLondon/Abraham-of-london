# Product Anti-Toy Review

Hard rules: toyRiskScore > 5 cannot be gold_standard; toyRiskScore > 20 is blocked_from_release.
The decisive instrument is cross-input comparison: the same product run against two materially different situations must produce materially different judgement.

## Tested Outputs (actual composer execution)

### fast_diagnostic

- **Tested output source:** composer_execution: lib/product/fast-diagnostic-gold-composer.ts (not yet wired to live route /diagnostics/fast)
- **Toy risk score:** 0/100 — passes
- **Reasons:**

- **Required corrections:**


### team_assessment

- **Tested output source:** composer_execution: lib/product/free-signal-gold-composer.ts (not yet wired to live surface /diagnostics (team corridor stage))
- **Toy risk score:** 8/100 — FAILS anti-toy test
- **Reasons:**
  - Consequence section is not grounded in the user's stated situation.
- **Required corrections:**
  - Tie the consequence to the user's named stake, not to a universal warning.

### enterprise_assessment

- **Tested output source:** composer_execution: lib/product/free-signal-gold-composer.ts (not yet wired to live surface /diagnostics (enterprise corridor stage))
- **Toy risk score:** 8/100 — FAILS anti-toy test
- **Reasons:**
  - Consequence section is not grounded in the user's stated situation.
- **Required corrections:**
  - Tie the consequence to the user's named stake, not to a universal warning.


## Untestable Outputs

- **case_dossier_tariff_shock**: Customer-facing artefact is a static evidence page; no machine-readable rendered output was captured in this pass, so external proof cannot be established.
- **case_dossier_team_alignment**: Customer-facing artefact is a static evidence page; no machine-readable rendered output was captured in this pass, so external proof cannot be established.
- **case_dossier_escalation_denied**: Customer-facing artefact is a static evidence page; no machine-readable rendered output was captured in this pass, so external proof cannot be established.

## Estate Position

All 43 products are held to this standard. Products never internally certified remain blocked pending external proof; no anti-toy pass can be assumed from structure, language, or internal scores.
