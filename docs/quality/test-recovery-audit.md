# Test Recovery Audit — 2026-04-28

## Baseline

- **Total tests:** 385
- **Passing:** 305
- **Failing:** 80
- **Skipped:** 0
- **Test files:** 86 total (45 passing, 41 failing)

## Failure Classification

### Group D: Runner Conflict — E2E in Vitest (16 files, ~16 tests)

**Files:** `tests/e2e/*.spec.ts` (8 files) + `.next/standalone/` duplicates (8 files)

**Root cause:** Vitest picks up Playwright `.spec.ts` files. These are not unit tests — they require a running browser/server. Vitest correctly reports "No test suite found" because Playwright uses `test()` not `describe()/it()`.

**Also:** Vitest scans `.next/standalone/` which duplicates every test file.

**Fix:** Update vitest.config.ts to exclude `tests/e2e/` and `.next/`.

### Group C: Removed/Renamed API — HCD Engine (21 tests)

**File:** `lib/alignment/hcd-engine.test.ts`

**Error:** `TypeError: calculateHCDelta is not a function`

**Root cause:** The HCD engine exports were renamed or restructured by Codex. Test imports are stale.

### Group B: Stale Expectation — Intelligence Engine (7 tests)

**File:** `lib/alignment/intelligence-engine.test.ts`

**Error:** Pattern matching assertions fail — engine produces different archetype labels than tests expect.

**Root cause:** Engine contract changed. Tests expect old pattern names.

### Group C: Removed/Renamed API — Executive Reporting (5 files)

**Files:** `lib/admin/reporting/executive-report-*.test.ts`

**Error:** Module import failures — test files can't resolve updated exports.

**Root cause:** Codex restructured the reporting module. Tests reference old exports.

### Group B: Stale Expectation — Derive Resonance Metrics (14 tests)

**File:** `lib/admin/reporting/derive-resonance-metrics.test.ts`

**Root cause:** Codex changed the resonance metrics derivation contract. Tests expect old shape.

### Group C: Removed/Renamed API — Deal Fusion (3 tests)

**File:** `lib/ai/__tests__/deal-fusion.test.ts`

**Root cause:** Engine restructured. Test expectations stale.

### Group C: Removed/Renamed API — Monetisation (2 tests)

**File:** `lib/commercial/monetisation.test.ts`

**Error:** `checkout_grants_entitlement` and `repairs missing entitlement` assertions fail.

**Root cause:** Entitlement flow changed.

### Group F: Broken Fixture — Layout (1 file)

**File:** `_tests_/components/Layout.test.tsx`

**Error:** `Cannot find module '...'`

**Root cause:** Stale import path. Test imports from `'...'` which is invalid.

### Group B: Stale Expectation — Predictive/Time-Series (5 tests)

**Files:** `tests/predictive/engines/time-series-engine.test.ts`, `tests/performance/predictive-benchmark.test.ts`

**Error:** Floating point assertion failures, performance threshold misses.

**Root cause:** Engine math changed (floating point precision), benchmark thresholds too tight.

## Fix Plan

1. **Vitest config** — exclude e2e and .next/standalone
2. **Layout test** — fix import path or retire
3. **HCD engine** — audit exports, update test imports
4. **Intelligence engine** — update pattern expectations
5. **Reporting tests** — update to new module shape
6. **Resonance metrics** — update to new contract
7. **Deal fusion** — update expectations
8. **Monetisation** — update entitlement assertions
9. **Predictive** — relax floating point tolerance, adjust benchmarks
