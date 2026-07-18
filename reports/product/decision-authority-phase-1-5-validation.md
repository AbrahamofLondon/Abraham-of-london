# Decision Authority Phase 1.5 Validation

Recorded: 2026-07-18
Branch: `fix/decision-authority-gap-closure-2026`
Baseline HEAD at phase start: `da2b4c212bd06f0846ee823f7d25be40ffd00c85`

This phase is not release-ready. It proves and records runtime authority boundaries, but existing release gates remain non-clean.

## Command Results

| Command | Exit | Status | Evidence |
|---|---:|---|---|
| `pnpm install --frozen-lockfile` | 0 | PASS | Lockfile accepted; install completed. |
| `pnpm contentlayer2 build` | 0 | PASS | 838 documents generated; 838 valid; 0 invalid. |
| `pnpm typecheck` | 0 | PASS | `tsc --noEmit` completed. |
| `pnpm build` | 0 | PASS | Next build completed. |
| `pnpm test` | 1 | FAIL | 511 files: 509 passed, 2 failed. 7,644 tests: 7,642 passed, 2 failed. |
| `pnpm test:e2e` | 1 | FAIL | 0 tests executed; Playwright timed out waiting 120000ms for `config.webServer`. |
| `pnpm vault:audit` | 1 | FAIL | 1,027 files scanned; 1,445 links validated; 26 briefs verified; 56 link regressions. |
| `node scripts/check-public-route-integrity.mjs` | 0 | PASS | Public aperture integrity passed. |
| Phase 1.5 focused tests | 0 | PASS | 3 files passed; 26 tests passed. |
| `git diff --check` | 0 | PASS | No whitespace errors. |

## Remaining Gate Classifications

- `tests/pages/intelligence/intelligence-index.test.tsx`: STALE_TEST, owned by Intelligence surface owner.
- `tests/pages/intelligence/market-briefs.test.tsx`: STALE_TEST, owned by Market intelligence owner.
- Playwright webServer timeout: ENVIRONMENT_BLOCKER, owned by Platform/test infrastructure.
- 56 vault audit link regressions: REAL_PRODUCT_DEFECT, owned by Content/platform routing owner.

## Phase Exit Status

| Condition | Status |
|---|---|
| Every engine export has a named role | PASS |
| Every user-facing route has a proven call chain for named phase routes | PASS |
| One evaluation authority is selected | PASS: target `LAYERED_CANONICAL_ARCHITECTURE`, not fully implemented. |
| One canonical record contract exists | PASS |
| Duplicate decision creation is prevented | PARTIAL: contract/test exists; full route persistence enforcement remains open. |
| SharedMemoryBridge is classified | PASS: UNUSED. |
| Redis need is decided from evidence | PASS: NOT_PROVEN; Redis not introduced. |
| Router consistency has zero UNKNOWN | PASS |
| Security divergences are repaired | PASS: zero SECURITY_GAP found. Customer-critical behavioural gaps repaired on public signal route. |
| Release-gate failures are individually classified | PASS |
| Roadmap and ledgers are updated | PASS |
| No graph accumulation introduced prematurely | PASS |

## Phase 1.5 Split Commits

| Slice | Commit |
|---|---|
| Runtime authority contract | `de8b5294ee4cf475f123d29ba59cd4cb37a9ce51` |
| Public signal transport controls | `d178ae23130bf271cfa74b8ea7d18aec1ce19c8c` |
| Authority/router consistency tests | `bcd11ebc8e375c49caa2a3a40b8bab1c6d479e87` |
| Architecture decision docs/reports | `d758e94091b206077a37e6fe87921af8555e392d` |

