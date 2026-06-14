# Hardcoded Evidence State Audit

Generated: 2026-06-14T07:54:48.692Z

Gate: PASSED_NO_HARDCODED_EVIDENCE_TRUTH

Total occurrences: 102

## Classifications

- authority_path_hardcoded: 0
- derived_from_verifier: 27
- display_only: 0
- test_fixture: 2
- historical_report: 0
- safe_constant: 73
- needs_refactor: 0

## Failing Occurrences

- None

## Occurrences

| File | Line | Term | Classification | Detail |
| --- | ---: | --- | --- | --- |
| lib/product/authority-grant-firewall.ts | 10 | ledger_entry_exists | safe_constant | Firewall proof-check identifier/type; no evidence truth asserted. |
| lib/product/authority-grant-firewall.ts | 48 | ledger_entry_exists | safe_constant | Firewall proof-check identifier/type; no evidence truth asserted. |
| lib/product/derived-evidence-state.ts | 13 | canGrantAuthority | derived_from_verifier | Derived evidence loader reads verifier output and exposes derived state. |
| lib/product/derived-evidence-state.ts | 17 | hasValidV2Evidence | derived_from_verifier | Derived evidence loader reads verifier output and exposes derived state. |
| lib/product/derived-evidence-state.ts | 36 | trusted_artifact_supported | derived_from_verifier | Derived evidence loader reads verifier output and exposes derived state. |
| lib/product/derived-evidence-state.ts | 43 | hasValidV2Evidence | derived_from_verifier | Derived evidence loader reads verifier output and exposes derived state. |
| lib/product/derived-evidence-state.ts | 45 | canGrantAuthority | derived_from_verifier | Derived evidence loader reads verifier output and exposes derived state. |
| lib/product/derived-evidence-state.ts | 82 | trusted_artifact_supported | derived_from_verifier | Derived evidence loader reads verifier output and exposes derived state. |
| lib/product/derived-evidence-state.ts | 152 | hasValidV2Evidence | derived_from_verifier | Derived evidence loader reads verifier output and exposes derived state. |
| lib/product/derived-evidence-state.ts | 166 | hasValidV2Evidence | derived_from_verifier | Derived evidence loader reads verifier output and exposes derived state. |
| lib/product/derived-evidence-state.ts | 168 | canGrantAuthority | derived_from_verifier | Derived evidence loader reads verifier output and exposes derived state. |
| lib/product/derived-evidence-state.ts | 185 | trusted_artifact_supported | derived_from_verifier | Derived evidence loader reads verifier output and exposes derived state. |
| lib/product/derived-evidence-state.ts | 186 | trusted_artifact_supported | derived_from_verifier | Derived evidence loader reads verifier output and exposes derived state. |
| lib/product/derived-evidence-state.ts | 188 | hasValidV2Evidence | derived_from_verifier | Derived evidence loader reads verifier output and exposes derived state. |
| lib/product/derived-evidence-state.ts | 188 | trusted_artifact_supported | derived_from_verifier | Derived evidence loader reads verifier output and exposes derived state. |
| lib/product/derived-evidence-state.ts | 190 | trusted_artifact_supported | derived_from_verifier | Derived evidence loader reads verifier output and exposes derived state. |
| lib/product/derived-evidence-state.ts | 196 | hasValidV2Evidence | derived_from_verifier | Derived evidence loader reads verifier output and exposes derived state. |
| lib/product/derived-evidence-state.ts | 198 | canGrantAuthority | derived_from_verifier | Derived evidence loader reads verifier output and exposes derived state. |
| lib/product/derived-evidence-state.ts | 211 | trusted_artifact_supported | derived_from_verifier | Derived evidence loader reads verifier output and exposes derived state. |
| lib/product/derived-evidence-state.ts | 212 | trusted_artifact_supported | derived_from_verifier | Derived evidence loader reads verifier output and exposes derived state. |
| lib/product/product-authority-contract.ts | 39 | canGrantAuthority | safe_constant | Contract type/validation reads contract fields; no artifact truth asserted. |
| lib/product/product-authority-contract.ts | 44 | evidenceLedgerV2Present | safe_constant | Contract type/validation reads contract fields; no artifact truth asserted. |
| lib/product/product-authority-contract.ts | 92 | publicClaimAllowed | safe_constant | Contract type/validation reads contract fields; no artifact truth asserted. |
| lib/product/product-authority-contract.ts | 155 | canGrantAuthority | safe_constant | Contract type/validation reads contract fields; no artifact truth asserted. |
| lib/product/product-authority-contract.ts | 162 | evidenceLedgerV2Present | safe_constant | Contract type/validation reads contract fields; no artifact truth asserted. |
| lib/product/product-authority-contract.ts | 162 | publicClaimAllowed | safe_constant | Contract type/validation reads contract fields; no artifact truth asserted. |
| lib/product/product-authority-contract.ts | 169 | publicClaimAllowed | safe_constant | Contract type/validation reads contract fields; no artifact truth asserted. |
| lib/product/resolve-product-authority.ts | 96 | hasValidV2Evidence | safe_constant | No authority-path evidence assertion detected. |
| lib/product/resolve-product-authority.ts | 153 | canGrantAuthority | safe_constant | No authority-path evidence assertion detected. |
| lib/product/resolve-product-authority.ts | 160 | canGrantAuthority | safe_constant | No authority-path evidence assertion detected. |
| lib/product/resolve-product-authority.ts | 169 | canGrantAuthority | safe_constant | No authority-path evidence assertion detected. |
| lib/product/resolve-product-authority.ts | 174 | canGrantAuthority | safe_constant | No authority-path evidence assertion detected. |
| lib/product/resolve-product-authority.ts | 192 | Evidence Ledger v2 not present | safe_constant | No authority-path evidence assertion detected. |
| lib/product/resolve-product-authority.ts | 288 | publicClaimAllowed | safe_constant | No authority-path evidence assertion detected. |
| lib/product/resolve-product-authority.ts | 312 | canGrantAuthority | safe_constant | No authority-path evidence assertion detected. |
| lib/product/resolve-product-authority.ts | 317 | evidenceLedgerV2Present | safe_constant | No authority-path evidence assertion detected. |
| lib/product/resolve-product-authority.ts | 351 | publicClaimAllowed | safe_constant | No authority-path evidence assertion detected. |
| scripts/audit-admin-authority-coverage.mjs | 35 | publicClaimAllowed | safe_constant | No authority-path evidence assertion detected. |
| scripts/audit-context-bound-validation-readiness.mjs | 43 | canGrantAuthority | safe_constant | No authority-path evidence assertion detected. |
| scripts/audit-context-bound-validation-readiness.mjs | 132 | canGrantAuthority | safe_constant | No authority-path evidence assertion detected. |
| scripts/audit-product-authority-coverage.mjs | 184 | publicClaimAllowed | safe_constant | No authority-path evidence assertion detected. |
| scripts/check-authority-grant-firewall.mjs | 11 | ledger_entry_exists | safe_constant | No authority-path evidence assertion detected. |
| scripts/check-authority-grant-firewall.mjs | 43 | ledger_entry_exists | safe_constant | No authority-path evidence assertion detected. |
| scripts/check-authority-safety-gate.mjs | 166 | trusted_artifact_supported | safe_constant | Safety gate reads generated gate reports and does not grant authority. |
| scripts/check-no-hardcoded-evidence-truth.mjs | 10 | hasValidV2Evidence | safe_constant | No authority-path evidence assertion detected. |
| scripts/check-no-hardcoded-evidence-truth.mjs | 11 | evidenceLedgerV2Present | safe_constant | No authority-path evidence assertion detected. |
| scripts/check-no-hardcoded-evidence-truth.mjs | 12 | ledger_entry_exists | safe_constant | No authority-path evidence assertion detected. |
| scripts/check-no-hardcoded-evidence-truth.mjs | 13 | trusted_artifact_supported | safe_constant | No authority-path evidence assertion detected. |
| scripts/check-no-hardcoded-evidence-truth.mjs | 14 | Evidence Ledger v2 not present | safe_constant | No authority-path evidence assertion detected. |
| scripts/check-no-hardcoded-evidence-truth.mjs | 15 | canGrantAuthority | safe_constant | No authority-path evidence assertion detected. |
| scripts/check-no-hardcoded-evidence-truth.mjs | 16 | publicClaimAllowed | safe_constant | No authority-path evidence assertion detected. |
| scripts/check-no-hardcoded-evidence-truth.mjs | 107 | canGrantAuthority | safe_constant | No authority-path evidence assertion detected. |
| scripts/check-no-hardcoded-evidence-truth.mjs | 107 | publicClaimAllowed | safe_constant | No authority-path evidence assertion detected. |
| scripts/check-no-hardcoded-evidence-truth.mjs | 110 | Evidence Ledger v2 not present | safe_constant | No authority-path evidence assertion detected. |
| scripts/check-no-hardcoded-evidence-truth.mjs | 116 | trusted_artifact_supported | safe_constant | No authority-path evidence assertion detected. |
| scripts/check-no-hardcoded-evidence-truth.mjs | 141 | hasValidV2Evidence | safe_constant | No authority-path evidence assertion detected. |
| scripts/check-no-hardcoded-evidence-truth.mjs | 145 | canGrantAuthority | safe_constant | No authority-path evidence assertion detected. |
| scripts/check-no-mock-authority.mjs | 122 | canGrantAuthority | test_fixture | Test or fraud simulation fixture. |
| scripts/check-product-authority-contract.mjs | 88 | canGrantAuthority | safe_constant | Non-granting contract constant or positive-state guard. |
| scripts/check-product-authority-contract.mjs | 103 | canGrantAuthority | safe_constant | Non-granting contract constant or positive-state guard. |
| scripts/check-product-authority-contract.mjs | 107 | trusted_artifact_supported | safe_constant | No authority-path evidence assertion detected. |
| scripts/check-product-authority-contract.mjs | 117 | canGrantAuthority | safe_constant | Non-granting contract constant or positive-state guard. |
| scripts/check-product-authority-contract.mjs | 121 | Evidence Ledger v2 not present | safe_constant | Non-granting missing-evidence blocking language. |
| scripts/check-product-authority-contract.mjs | 129 | canGrantAuthority | safe_constant | Non-granting contract constant or positive-state guard. |
| scripts/check-product-authority-contract.mjs | 134 | Evidence Ledger v2 not present | safe_constant | Non-granting missing-evidence blocking language. |
| scripts/check-product-authority-contract.mjs | 170 | publicClaimAllowed | safe_constant | No authority-path evidence assertion detected. |
| scripts/check-product-authority-contract.mjs | 182 | publicClaimAllowed | safe_constant | No authority-path evidence assertion detected. |
| scripts/check-product-authority-contract.mjs | 247 | canGrantAuthority | safe_constant | No authority-path evidence assertion detected. |
| scripts/check-product-authority-contract.mjs | 248 | canGrantAuthority | safe_constant | No authority-path evidence assertion detected. |
| scripts/check-product-authority-contract.mjs | 254 | publicClaimAllowed | safe_constant | Non-granting contract constant or positive-state guard. |
| scripts/check-product-authority-contract.mjs | 269 | canGrantAuthority | safe_constant | Non-granting contract constant or positive-state guard. |
| scripts/check-product-authority-contract.mjs | 273 | Evidence Ledger v2 not present | safe_constant | Non-granting missing-evidence blocking language. |
| scripts/check-product-authority-contract.mjs | 277 | publicClaimAllowed | safe_constant | Non-granting contract constant or positive-state guard. |
| scripts/check-product-authority-contract.mjs | 287 | hasValidV2Evidence | derived_from_verifier | Contract gate reads verifier-derived evidence. |
| scripts/check-product-authority-contract.mjs | 289 | evidenceLedgerV2Present | safe_constant | No authority-path evidence assertion detected. |
| scripts/check-product-authority-contract.mjs | 319 | canGrantAuthority | safe_constant | No authority-path evidence assertion detected. |
| scripts/check-product-authority-contract.mjs | 319 | publicClaimAllowed | safe_constant | No authority-path evidence assertion detected. |
| scripts/check-product-authority-contract.mjs | 342 | publicClaimAllowed | safe_constant | No authority-path evidence assertion detected. |
| scripts/check-product-authority-contract.mjs | 372 | canGrantAuthority | safe_constant | Non-granting contract constant or positive-state guard. |
| scripts/check-product-authority-contract.mjs | 376 | trusted_artifact_supported | derived_from_verifier | Contract gate reads verifier-derived evidence. |
| scripts/check-product-authority-contract.mjs | 381 | hasValidV2Evidence | safe_constant | No authority-path evidence assertion detected. |
| scripts/check-product-authority-contract.mjs | 383 | canGrantAuthority | safe_constant | Non-granting contract constant or positive-state guard. |
| scripts/check-product-authority-contract.mjs | 424 | publicClaimAllowed | safe_constant | No authority-path evidence assertion detected. |
| scripts/check-product-claim-recovery.mjs | 22 | hasValidV2Evidence | safe_constant | No authority-path evidence assertion detected. |
| scripts/check-product-claim-recovery.mjs | 51 | hasValidV2Evidence | safe_constant | No authority-path evidence assertion detected. |
| scripts/check-product-claim-recovery.mjs | 52 | hasValidV2Evidence | safe_constant | No authority-path evidence assertion detected. |
| scripts/check-product-claim-recovery.mjs | 59 | hasValidV2Evidence | safe_constant | No authority-path evidence assertion detected. |
| scripts/check-product-claim-recovery.mjs | 60 | hasValidV2Evidence | safe_constant | No authority-path evidence assertion detected. |
| scripts/check-product-claim-recovery.mjs | 67 | hasValidV2Evidence | safe_constant | No authority-path evidence assertion detected. |
| scripts/check-product-claim-recovery.mjs | 68 | hasValidV2Evidence | safe_constant | No authority-path evidence assertion detected. |
| scripts/check-release-authority-firewall.mjs | 22 | hasValidV2Evidence | safe_constant | No authority-path evidence assertion detected. |
| scripts/check-release-authority-firewall.mjs | 58 | hasValidV2Evidence | safe_constant | No authority-path evidence assertion detected. |
| scripts/lib/read-evidence-ledger-v2.mjs | 46 | hasValidV2Evidence | safe_constant | No authority-path evidence assertion detected. |
| scripts/lib/read-evidence-ledger-v2.mjs | 142 | hasValidV2Evidence | safe_constant | No authority-path evidence assertion detected. |
| scripts/reconcile-product-authority-truth.mjs | 222 | trusted_artifact_supported | derived_from_verifier | Reconciliation reads artifact verifier output. |
| scripts/reconcile-product-authority-truth.mjs | 246 | trusted_artifact_supported | derived_from_verifier | Reconciliation reads artifact verifier output. |
| scripts/test-authority-fraud-scenarios.mjs | 11 | ledger_entry_exists | test_fixture | Test or fraud simulation fixture. |
| scripts/verify-evidence-ledger-artifacts.mjs | 9 | trusted_artifact_supported | derived_from_verifier | Artifact verifier produces the trusted ledger state. |
| scripts/verify-evidence-ledger-artifacts.mjs | 65 | trusted_artifact_supported | derived_from_verifier | Artifact verifier produces the trusted ledger state. |
| scripts/verify-evidence-ledger-artifacts.mjs | 72 | trusted_artifact_supported | derived_from_verifier | Artifact verifier produces the trusted ledger state. |
| scripts/verify-evidence-ledger-artifacts.mjs | 200 | trusted_artifact_supported | derived_from_verifier | Artifact verifier produces the trusted ledger state. |
| scripts/verify-evidence-ledger-artifacts.mjs | 329 | trusted_artifact_supported | derived_from_verifier | Artifact verifier produces the trusted ledger state. |
