# Extraction Script Determinism Report

All report-generating extraction scripts run twice consecutively on a
clean tree; outputs SHA256-hashed with the `generatedAt` timestamp field
stripped first (that field is intentionally non-deterministic — an ISO
timestamp — and its presence would make every run "differ" trivially
without saying anything about the actual extracted data).

**Screenshots are explicitly exempted from this determinism requirement**
(per closure review point 10.C): browser rendering across separate capture
runs is not guaranteed byte-identical even with fonts-ready and
animations-disabled controls (subpixel/anti-aliasing variance is a known
Playwright limitation), so the screenshot corpus is a captured artifact,
not a proof of deterministic generation. The extraction/report *generators*
are held to the strict standard; the *screenshots* are not.

## Result: 11/11 deterministic

| Script output | Result |
|---|---|
| `token-ownership-matrix.csv` | DETERMINISTIC |
| `token-conflict-register.json` | DETERMINISTIC |
| `duplicate-selector-register.json` | DETERMINISTIC |
| `tailwind-alias-consumer-matrix.csv` | DETERMINISTIC |
| `raw-colour-baseline.json` | DETERMINISTIC |
| `type-floor-baseline.json` | DETERMINISTIC |
| `raw-colour-baseline-by-category.json` | DETERMINISTIC |
| `type-floor-baseline-by-category.json` | DETERMINISTIC |
| `component-reachability-register.json` | DETERMINISTIC |
| `raw-colour-baseline-two-dimensional.json` | DETERMINISTIC |
| `type-floor-baseline-two-dimensional.json` | DETERMINISTIC |

Method: `sha256sum` on each output file after stripping `generatedAt`
lines, compared across two independent, sequential, clean invocations of
all 6 producing scripts (`extract-token-inventory.mjs`,
`extract-duplicate-selectors.mjs`, `extract-usage-baselines.mjs`,
`extract-usage-baselines-by-category.mjs`,
`extract-component-reachability.mjs`,
`extract-usage-baselines-two-dimensional.mjs` — the last two depend on the
reachability register existing first, run in that order both times).
