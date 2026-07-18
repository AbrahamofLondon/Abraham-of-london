# Decision Authority Phase 1.6 Validation

Recorded: 2026-07-18
Branch: `fix/decision-authority-gap-closure-2026`
Release status: NOT RELEASE READY

## Phase 1.5 Commit Normalisation

The former Phase 1.5 mixed commit was split into reviewable commits while preserving the prior four programme commits:

| Slice | Commit |
|---|---|
| Runtime authority contract | `de8b5294ee4cf475f123d29ba59cd4cb37a9ce51` |
| Public signal transport controls | `d178ae23130bf271cfa74b8ea7d18aec1ce19c8c` |
| Authority/router consistency tests | `bcd11ebc8e375c49caa2a3a40b8bab1c6d479e87` |
| Architecture decision docs/reports | `d758e94091b206077a37e6fe87921af8555e392d` |
| Split SHA record | `4da58b09049dce6cb3ac267b5aa44de466ff854a` |

Programme PR: Draft PR #101, https://github.com/AbrahamofLondon/Abraham-of-london/pull/101.

## Baseline Unit Failure Classification

The two failing unit tests reproduce on `origin/main`, so they are not programme branch regressions.

| Test | Classification | Baseline Repair |
|---|---|---|
| `tests/pages/intelligence/intelligence-index.test.tsx > intelligence landing > features the public delay-governance brief without rendering the index manuscript wholesale` | STALE_TEST / BASELINE_DEFECT | PR #102 updates the assertion to the current public link contract. |
| `tests/pages/intelligence/market-briefs.test.tsx > market intelligence related briefs > emits live links only for public canonical briefs and keeps restricted items metadata-only` | STALE_TEST / BASELINE_DEFECT | PR #102 updates the assertion to the current current/reference/upcoming GMI props contract. |

Baseline repair PR: Draft PR #102, https://github.com/AbrahamofLondon/Abraham-of-london/pull/102.

Blocker: the available GitHub token cannot mark the PR ready for review, and the Vercel deployment context reports an account-level deployment block. The baseline repair is pushed but not merged.

## Playwright Startup Closure

Previous failure: Playwright waited for `http://localhost:3000/` and timed out after 120 seconds.

Configuration now uses the existing lightweight health endpoint as the webServer readiness URL:

- command: `pnpm exec next dev --webpack`
- expected port: `3000`
- readiness URL: `http://127.0.0.1:3000/api/system/health`
- manual readiness: HTTP 200, `ok:true`, service `abraham-of-london`
- time to ready in manual diagnostic: 80.72 seconds

`pnpm test:e2e` now launches the application and executes the suite. It is not passing:

- exit code: 1
- duration: 3.9m
- discovered: 45 tests
- passed: 6
- failed: 7
- skipped: 32

Failures:

- `tests/e2e/a11y-blog-crawl.spec.ts`: `/blog` navigation timed out.
- `tests/e2e/a11y.spec.ts`: `/` navigation timed out.
- `tests/e2e/a11y.spec.ts`: `/downloads` axe run timed out.
- `tests/e2e/downloads-assets.spec.ts`: `/downloads` exposed zero `/downloads/` links.
- `tests/e2e/editorial-series-reader.spec.ts`: light preference paragraph locator missing.
- `tests/e2e/editorial-series-reader.spec.ts`: dark preference paragraph locator missing.
- `tests/e2e/visual.spec.ts`: home snapshot height/diff mismatch.

## Public Signal Transport Controls

Local handler tests verify `Cache-Control: no-store, private` on:

- success;
- clarification required;
- validation error;
- rate limited;
- oversized parsed body;
- internal error.

No `Pragma` or `Expires` compatibility headers are emitted by this route because the explicit requirement is `Cache-Control: no-store, private`; CDN compatibility must be checked in preview before adding extra headers.

Request size controls:

- Next Pages API body parser limit: `8kb`.
- Parsed `situation` limit: 6,000 characters.
- Oversized parsed body response: 413.
- Malformed JSON remains a Next parser-level bounded 400 before the handler; full live transport proof is still required.

Rate limit authority:

- store: IN_MEMORY_PROCESS
- authority level: BEST_EFFORT_PROCESS_LOCAL
- durable/global security control: no
- limitations: process restart, cold start and multi-instance deployments reset or fragment the counter.
- raw situation text is not used in the limiter key.

## Focused Validation

| Command | Exit | Result | Totals |
|---|---:|---|---|
| `pnpm exec vitest run tests\product\decision-authority-runtime-contract.test.ts tests\product\public-signal-transport-controls.test.ts tests\product\public-signal-rate-limit-contract.test.ts` | 0 | PASS | 3 files passed; 24 tests passed; 1.96s |
| `pnpm test:e2e` | 1 | FAIL, EXECUTED | 45 tests discovered; 6 passed; 7 failed; 32 skipped; 3.9m |

## Phase 1.6 Exit Conditions

| Condition | Status |
|---|---|
| Phase 1.5 commit history truthful and reviewable | PASS_LOCAL |
| Branch pushed and remotely reviewed | PASS_DRAFT_PR_OPEN |
| Two unit failures fixed or repaired through merged baseline PRs | FAIL: baseline PR #102 open but not merged |
| Playwright successfully starts and executes tests | PASS_EXECUTES_WITH_FAILURES |
| All 56 vault findings individually classified | PASS: ledger created with 56 findings |
| No vault finding remains UNKNOWN | PASS: zero UNKNOWN |
| Rate limiting has explicit production authority level | PASS: BEST_EFFORT_PROCESS_LOCAL |
| Request-size enforcement tests actual payload size | PARTIAL: config and handler tests exist; live malformed/chunked proof pending |
| No-store behaviour verified across all responses | PASS_LOCAL_HANDLER_TESTS; preview/CDN pending |
| Architecture records distinguish target from implemented runtime | PASS |
| Full release-gate results accurately recorded | FAIL: not rerun after Phase 1.6 changes |
| No graph accumulation has begun | PASS |