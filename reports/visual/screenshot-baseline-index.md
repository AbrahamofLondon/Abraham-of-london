# Screenshot Baseline Index — Phase 0

## Status: durable, disk-persisted, committed

This supersedes the first Phase 0 pass, which only had in-conversation
browser-tool screenshots (no file-write capability, not reproducible). A
real, disk-persisted, committed screenshot corpus now exists — see stats
below.

## Infrastructure — newly established, not an existing suite extended

**`playwright.config.ts` and `tests/e2e/*.ts` were found to be genuinely
0-byte empty files** (confirmed via `git log -p --follow -- playwright.config.ts`:
the file was created 2025-12-10 by literally copying an empty `README.md` —
"copy from README.md to playwright.config.ts, similarity index 100%" — a
~7-month-old scaffolding gap, not a recent regression). Despite this,
`package.json`'s `test:e2e` script references `playwright test` as if
functional, and a leftover artifact
(`tests/e2e/visual.spec.ts-snapshots/home-1280x900-chromium-win32.png`)
implies the suite once worked before being wiped.

**This is therefore correctly described as: VISUAL BASELINE CAPTURE
INFRASTRUCTURE, NEWLY ESTABLISHED** — a real `playwright.config.ts`
(minimal, scoped only to run this one spec) and a new
`tests/e2e/visual-authority-baseline.spec.ts` were authored from scratch.
It is **not** "existing Playwright test infrastructure extended" — that
framing would be false. The other ~10 empty spec files were deliberately
left untouched (flagged separately as a distinct pre-existing infrastructure
gap, out of scope here — do not populate unrelated empty specs merely to
make the suite look fuller).

## Capture stats

```
SCREENSHOT ROOT PATH:  reports/visual/screenshots/
PNG COUNT:             32 (8 routes × 4 viewports)
TOTAL BYTE SIZE:       18,001,856 bytes (17.17 MB)
AVERAGE FILE SIZE:     562,558 bytes (~549 KB)
LARGEST FILE:          805,028 bytes — intelligence__1440x900.png
SMALLEST FILE:         360,062 bytes — intelligence_gmi_q2-2026__390x844.png
MANIFEST PATH:         reports/visual/screenshots/manifest.json
COMMIT SHA RECORDED:   b60bf4cbce2f0ba36c92f7793b33a6259e773907 (single, consistent
                       across all 32 shots — verified, not mixed with any later commit)
VIEWPORTS:             1440x900, 1024x768, 768x1024, 390x844
FONT READY METHOD:     await page.evaluate(() => document.fonts.ready) before each capture
ANIMATION DISABLE:     page.addInitScript injecting a stylesheet forcing
                       animation-duration/delay, transition-duration/delay to 0s
                       and scroll-behavior:auto on every element, before navigation
FAILED CAPTURES:       0 (32/32 passed, Playwright run: "32 passed (2.9m)")
```

All 32 shots were captured from the exact same application SHA
(`b60bf4cbce2f0ba36c92f7793b33a6259e773907`) — the manifest does not mix
that baseline SHA with any later commit's rendering state. The measurement
*scripts* (`scripts/visual/extract-*.mjs`, `lib/visual/contrast.ts`) have
evolved since that SHA was captured, but the application code the
screenshots depict has not — the two are independent and this file records
which SHA the pixels represent.

## Coverage — all 8 routes, all 4 viewports, full disk persistence

| Route | 1440×900 | 1024×768 | 768×1024 | 390×844 |
|---|---|---|---|---|
| `/enterprise-decision-scan` | ✅ | ✅ | ✅ | ✅ |
| `/decision-centre` | ✅ | ✅ | ✅ | ✅ |
| `/diagnostics` | ✅ | ✅ | ✅ | ✅ |
| `/intelligence` | ✅ | ✅ | ✅ | ✅ |
| `/intelligence/gmi/q2-2026` | ✅ | ✅ | ✅ | ✅ |
| `/foundry/decision-test` | ✅ | ✅ | ✅ | ✅ |
| `/boardroom-brief` | ✅ | ✅ | ✅ | ✅ |
| `/checkout/personal-decision-audit` | ✅ | ✅ | ✅ | ✅ |

The earlier session's in-conversation-only screenshots (full 3-viewport +
node-level contrast pass on `/enterprise-decision-scan`, desktop + worst-5
sample on the other 7) remain the source of the detailed contrast findings
in `contrast-baseline.csv` and `visual-authority-baseline.md` — those
per-node measurements are not re-derived from the PNGs, they were taken
directly from computed styles in the browser during that pass. The 32-shot
corpus here is the reproducible visual record; the contrast CSV is the
reproducible numeric record. They cover the same routes but were captured
through different mechanisms.

## Storage policy — established now, before it becomes ad hoc

```
BASELINE REFERENCE PNGS       → versioned (committed via the reports/visual/**
                                 .gitignore exception)
ROUTINE CI RUN SCREENSHOTS    → workflow artifacts only, NEVER committed
APPROVED NEW BASELINES        → versioned only after an intentional, reviewed
                                 visual-approval step — not automatically
                                 overwritten by every capture run
```

17.17 MB for 32 reference images is a reasonable, deliberate size for a
load-bearing baseline the whole convergence programme measures against —
not an accident of an uncontrolled capture loop. Re-running
`npx playwright test` locally will regenerate these files in place; that
regeneration should not be committed casually — only when the baseline
itself is intentionally being moved forward (e.g. after the reference
surface migration in brief §16 is owner-approved), never as routine CI
output.
