# System Truth Gate Meaningfulness Audit

Generated: 2026-06-13T19:46:49.491Z

Gates audited: 8

## Summary

- medium_gate: 4
- narrow_gate: 2
- failing_gate: 1
- misleading_gate: 1

| Script | Classification | Claims To Verify | Actually Verifies | Runtime Wiring | Imports | Rendered Output | Generated Evidence | Can Pass While Unsafe | Correction |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| scripts/check-product-authority-contract.mjs | medium_gate | ProductAuthorityContract consistency and public/non-exempt coverage. | Builds/validates contract records; does not prove product engine runtime behavior. | yes | yes | yes | yes | yes | Keep as useful signal, but do not let it imply runtime truth alone. |
| scripts/check-estate-authority-integrity.mjs | medium_gate | Estate-level authority readiness from generated coverage reports. | Reads generated reports and checks aggregate failures; depends on upstream report correctness. | yes | no | no | yes | yes | Keep as useful signal, but do not let it imply runtime truth alone. |
| scripts/check-no-mock-authority.mjs | narrow_gate | No mock/fixture/placeholder authority grants. | Scans selected paths for suspicious terms; produces many lexical findings but can pass. | yes | no | no | yes | yes | Broaden file coverage and add runtime/rendered-output checks. |
| scripts/check-surface-claim-authority.mjs | narrow_gate | Public claim language does not exceed authority. | Scans registered surfaces/claims; does not exhaustively scan all public copy. | no | no | no | yes | yes | Broaden file coverage and add runtime/rendered-output checks. |
| scripts/audit-market-adoption-posture.mjs | medium_gate | Market adoption posture and pain clarity. | Static script/content inspection. | yes | yes | yes | yes | no | Keep as useful signal, but do not let it imply runtime truth alone. |
| scripts/audit-wave-2-product-readiness.mjs | medium_gate | Wave 2 product readiness classification. | Static script/content inspection. | yes | no | yes | yes | no | Keep as useful signal, but do not let it imply runtime truth alone. |
| scripts/check-board-facing-authority-language.mjs | failing_gate | Board-facing language does not overstate evidence. | Scans three files for a small phrase list; currently fails and misses several board-facing surfaces. | yes | no | no | yes | yes | Fix violations and expand scanned surface area before treating as protective. |
| scripts/generate-v2-evidence-ledger.mjs | misleading_gate | Generate Evidence Ledger v2 authority evidence. | Generates ledger metadata; generation is not independent validation. | yes | yes | yes | yes | yes | Rename or scope as generation only; independent validation must be separate. |
