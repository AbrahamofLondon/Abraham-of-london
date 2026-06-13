# Product Anti-Toy Review

Hard rules: toyRiskScore > 5 cannot be gold_standard; toyRiskScore > 20 is blocked_from_release.
The decisive instrument is cross-input comparison: the same product run against two materially different situations must produce materially different judgement.

## Tested Outputs (actual composer execution)

### fast_diagnostic

- **Tested output source:** live_route_capture: /diagnostics/fast -> /foundry/decision-test via /api/public/kernel-signal
- **Toy risk score:** 0/100 — passes
- **Reasons:**

- **Required corrections:**


### team_assessment

- **Tested output source:** live_route_capture: /diagnostics/team-assessment
- **Toy risk score:** 0/100 — passes
- **Reasons:**

- **Required corrections:**


### enterprise_assessment

- **Tested output source:** live_route_capture: /diagnostics/enterprise-assessment
- **Toy risk score:** 0/100 — passes
- **Reasons:**

- **Required corrections:**


### case_dossier_tariff_shock

- **Tested output source:** live_route_capture: /evidence/tariff-shock-growth-break
- **Toy risk score:** 23/100 — FAILS anti-toy test
- **Reasons:**
  - High input echo (42%).
  - Consequence section is not grounded in the user's stated situation.
  - Next action lacks an owner or a timeframe.
- **Required corrections:**
  - Cut restated input; keep only what anchors the judgement.
  - Tie the consequence to the user's named stake, not to a universal warning.
  - Bind the next action to a named owner and a concrete timeframe.

### case_dossier_team_alignment

- **Tested output source:** live_route_capture: /evidence/team-alignment-illusion
- **Toy risk score:** 23/100 — FAILS anti-toy test
- **Reasons:**
  - High input echo (47%).
  - Consequence section is not grounded in the user's stated situation.
  - Next action lacks an owner or a timeframe.
- **Required corrections:**
  - Cut restated input; keep only what anchors the judgement.
  - Tie the consequence to the user's named stake, not to a universal warning.
  - Bind the next action to a named owner and a concrete timeframe.

### case_dossier_escalation_denied

- **Tested output source:** live_route_capture: /evidence/escalation-denied-case
- **Toy risk score:** 15/100 — FAILS anti-toy test
- **Reasons:**
  - High input echo (45%).
  - Next action lacks an owner or a timeframe.
- **Required corrections:**
  - Cut restated input; keep only what anchors the judgement.
  - Bind the next action to a named owner and a concrete timeframe.


## Untestable Outputs

- None

## Estate Position

All 43 products are held to this standard. Products never internally certified remain blocked pending external proof; no anti-toy pass can be assumed from structure, language, or internal scores.
