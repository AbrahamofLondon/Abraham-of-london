# Decision Authority Validation Baseline

Recorded: 2026-07-18
Branch: `fix/decision-authority-gap-closure-2026`
Baseline HEAD: `92ce83ddc2d6261f5cd5e8c8632d1afa235fea3a`
Implementation HEAD before programme commit: `3b8e52c99cb1ddb73d9c204be6cc7ae664417ab0`

This is not a passing release baseline. It records the current evidence and failures exactly enough to continue without restarting the audit.

## Command Results

| Command | Exit | Status | Evidence |
|---|---:|---|---|
| `pnpm install --frozen-lockfile` | 0 | PASS | Lockfile up to date; Prisma Client v6.6.0 generated; pnpm v10.33.0; done in 47.5s. |
| `pnpm contentlayer2 build` | 0 | PASS | 838 documents generated; 838 valid; 0 invalid. |
| `pnpm typecheck` | 0 | PASS | `tsc --noEmit` completed. |
| `pnpm build` | 0 | PASS | Next build completed; static pages generated 786/786; public link integrity checks passed during build. |
| `pnpm test` | 1 | FAIL | 510 files: 508 passed, 2 failed. 7,633 tests: 7,631 passed, 2 failed. |
| `pnpm test:e2e` | 1 | FAIL | 0 tests executed; Playwright timed out waiting 120000ms for `config.webServer`. |
| `pnpm vault:audit` | 1 | FAIL | 1,027 files scanned; 1,445 links validated; 26 briefs verified; 56 link regressions. |
| `node scripts/check-public-route-integrity.mjs` | 0 | PASS | All public aperture integrity checks passed. |
| focused public signal persistence test | 0 | PASS | 1 file passed; 3 tests passed. |
| `git diff --check` | 0 | PASS | No whitespace errors. |

## Known Failing Unit Tests

- `tests/pages/intelligence/intelligence-index.test.tsx`: expected rendered HTML to contain `When Delay Becomes a Governance Cost`.
- `tests/pages/intelligence/market-briefs.test.tsx`: expected legacy `briefs` props shape but received current/reference/upcoming GMI shape.

## Not Yet Implemented

- E2E golden path A: free diagnostic across route boundaries.
- E2E golden path B: paid report checkout-to-access.
- E2E golden path C: fulfilment failure recovery.
- E2E golden path D: outcome loop.
- Database restart durability test for public-safe events.
- Database unavailable/write-timeout adversarial persistence tests.
- Case isolation and retention/deletion adversarial tests.
- Runtime observability alert tests.

## Stop Conditions

| Condition | Status |
|---|---|
| Current roadmap tracked | PASS_AFTER_PROGRAMME_COMMIT |
| Current Phase 0 and Phase 1 changes committed | PASS |
| Gap ledger exists | PASS |
| Consumer inventory complete | PASS: static scan found 1,199 consumers and 0 UNKNOWN classifications. |
| Baseline full-suite results recorded | PASS_WITH_FAILURES_RECORDED |
| No current consumer is UNKNOWN | PASS |
| Memory fallback semantics explicit | PASS_DOCUMENTED; implementation remains `IMPLEMENTING`. |
| Payment compatibility policy explicit | PASS |


