# Derived Evidence State Refactor Report

## Gate Result
PASSED_AS_DERIVED_EVIDENCE_REFACTOR_WITH_AUTHORITY_RESTORATION_FROZEN

## Commit
this commit; exact hash recorded in final response

## Starting Issue
`hasValidV2Evidence` was previously configuration-driven in the authority resolver and default product configs. That allowed manual or stale config to represent evidence truth.

## Hardcoded Evidence State Audit
`scripts/check-no-hardcoded-evidence-truth.mjs` now audits authority-path evidence terms and writes:

- `reports/hardcoded-evidence-state-audit.json`
- `reports/hardcoded-evidence-state-audit.md`

Current result:

- Gate: `PASSED_NO_HARDCODED_EVIDENCE_TRUTH`
- Authority-path hardcoded occurrences: `0`
- Needs-refactor occurrences: `0`
- Derived-from-verifier occurrences: `27`

## Derived Evidence State Loader
`lib/product/derived-evidence-state.ts` now derives evidence state from `reports/evidence-ledger-artifact-verification.json` first. The Evidence Ledger v2 file is used only as a supplemental artifact reference source.

The loader fails closed:

- missing verifier row -> `missing` or `unknown`
- verifier unavailable -> no authority grant
- untrusted verifier classification -> no authority grant
- `canGrantAuthority` remains `false`

## Resolver Refactor
`lib/product/resolve-product-authority.ts` no longer exposes or consumes `hasValidV2Evidence` as resolver input.

Authority resolution now uses:

- `ProductAuthorityContract` policy/current state
- optional `DerivedEvidenceState`
- validation/safety state as non-granting context

If no derived evidence state is supplied, the resolver records `evidence_state_unknown` and remains non-granting.

## Contract Check Update
`scripts/check-product-authority-contract.mjs` now reads `reports/evidence-ledger-artifact-verification.json`.

Current result:

- Gate: `CORE_AND_PUBLIC_CONTRACT_COVERAGE_PASSED`
- Direct contracts validated: `22`
- Public/non-exempt covered: `18/18`
- Estate coverage complete: `false`
- Positive authority restored: `no`

## Safety Gate Update
`scripts/check-authority-safety-gate.mjs` now consumes the no-hardcoded evidence truth report as a blocking authority signal.

Current result:

- Overall state: `authority_pending_reconciliation`
- Products allowed positive authority: `0`
- Products blocked from restoration: `43`
- Authority safe: `no`

## No-Hardcoded-Evidence-Truth Gate
Created `scripts/check-no-hardcoded-evidence-truth.mjs`.

The gate fails on authority-path manual evidence truth such as:

- `hasValidV2Evidence: true`
- `hasValidV2Evidence: false`
- `input.hasValidV2Evidence`
- `canGrantAuthority: true`

Current result: `PASSED_NO_HARDCODED_EVIDENCE_TRUTH`.

## team_assessment Derived State
`team_assessment` evidence is now derived from artifact verifier output:

- Verifier state: `trusted_artifact_supported`
- Contract state: `legacy_validated_pending_v2_revalidation`
- Truth reconciliation: `blocked_correctly`
- Rendered output artifact: `rendered_output_hash_artifact_found`
- Positive authority: `0`
- Authority restored: `no`

## Products Allowed Positive Authority
None.

## Authority Restoration Status
Not performed. Authority restoration remains frozen.

## Commands Run
- `pnpm exec tsc --noEmit` — timed out without diagnostics
- `pnpm exec tsc --noEmit --pretty false --incremental false` — passed
- `node scripts/check-no-hardcoded-evidence-truth.mjs` — passed
- `node scripts/verify-evidence-ledger-artifacts.mjs` — passed
- `node scripts/check-authority-safety-gate.mjs` — `authority_pending_reconciliation`
- `node scripts/check-product-authority-contract.mjs` — passed
- `node scripts/reconcile-product-authority-truth.mjs` — passed with holds
- `node scripts/check-surface-claim-authority.mjs` — passed
- `node scripts/test-authority-fraud-scenarios.mjs` — passed, 7/7 blocked
- `node scripts/check-authority-grant-firewall.mjs` — passed, positive authority allowed 0

## Worktree Status
Pending final `git diff --check`, `git diff --cached --check`, and `git status --short` after this report is written.

## Final Recommendation
Do not restore authority. The architecture now derives evidence state from verifier output rather than config, but authority remains pending reconciliation until the full authority restoration chain is explicitly approved in a separate pass.
