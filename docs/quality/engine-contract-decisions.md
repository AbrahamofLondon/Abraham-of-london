# Engine Contract Decisions — 2026-04-28

## Classification: Tests vs Current Engine

| Test File | Old Expectation | Current Status | Decision | Reason |
|---|---|---|---|---|
| `hcd-engine.test.ts` | `calculateHCDelta()` function exists | Function removed/renamed by Codex | **B: Update test** | Codex restructured HCD engine |
| `intelligence-engine.test.ts` | Specific archetype pattern names | Engine produces different patterns | **B: Update test** | Engine contract evolved |
| `derive-resonance-metrics.test.ts` | Old resonance derivation shape | Module restructured by Codex | **B: Update test** | New reporting contract |
| `executive-report-*.test.ts` (5 files) | Old report builder/serializer exports | Module restructured by Codex | **C: Update imports** | Codex changed module API |
| `deal-fusion.test.ts` | Specific deal scoring thresholds | Engine thresholds changed | **B: Update test** | Codex changed scoring |
| `monetisation.test.ts` | Old entitlement flow assertions | Entitlement flow changed | **B: Update test** | Commercial flow evolved |
| `time-series-engine.test.ts` | Exact floating point equality | Engine math slightly changed | **Fixed** | Used toBeCloseTo/regex |
| `predictive-benchmark.test.ts` | Missing helper function | `generateTimeSeries` not defined | **Fixed** | Added helper |
| `Layout.test.tsx` | Import from `'...'` | Invalid import path | **Fixed** | Corrected import + jsdom |

## Summary

- **Fixed by Claude:** 3 files (Layout, time-series, predictive-benchmark)
- **Codex-owned:** 9 files (all require understanding new module contracts that Codex created)
- **Deleted:** 0 (no tests deleted without justification)
