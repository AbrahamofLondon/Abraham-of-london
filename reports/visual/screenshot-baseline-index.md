# Screenshot Baseline Index — Phase 0

**Captured:** 2026-07-10, via `next dev` on `integration/visual-authority-convergence` @ `7ff57c855` (branch point, zero visual changes made before capture).

## Tooling limitation — read before using this index

The browser tool available in this session (`preview_screenshot`) renders images
inline into the agent conversation but has **no file-write capability** — it
cannot persist PNG/JPEG files into the repository. This index is therefore a
**written observation record**, not a folder of image files. A permanently
reproducible, disk-persisted screenshot corpus requires Playwright (already
approved for `test:visual-regression` in Phase 2/3 — see brief §13.7) and
should be generated as part of that gate's build-out, using this same route
list so the two baselines line up.

## Coverage actually captured this session

| Route | 1440×900 | 1024×768 | 768×1024 | 390×844 | Notes |
|---|---|---|---|---|---|
| `/enterprise-decision-scan` | ✅ | ✅ | — (viewport not separately captured; 1024×768 used as tablet proxy) | ✅ | Full 3-viewport + computed-contrast pass — this is the reference surface, see contrast-baseline.csv |
| `/decision-centre` | ✅ | — | — | — | Desktop only |
| `/diagnostics` | ✅ | — | — | — | Desktop only. **Critical finding**: two card headings render fully invisible (contrast ratio 1.0, foreground = background) |
| `/intelligence` | ✅ | — | — | — | Desktop only. Confirms live 7px/7.5px type still present on this branch |
| `/intelligence/gmi/q2-2026` | ✅ | — | — | — | Desktop only |
| `/foundry/decision-test` | ✅ | — | — | — | Desktop only |
| `/boardroom-brief` | ✅ | — | — | — | Desktop only |
| `/checkout/personal-decision-audit` | ✅ | — | — | — | Desktop only |

Every route sampled (8/8) shows the same pattern: faint secondary/tertiary
body text, near-invisible placeholders, sub-11px labels. This is what makes
the defect systemic rather than page-specific — see
`visual-authority-baseline.md` for the synthesis.

## Full 4-viewport treatment given to `/enterprise-decision-scan` only

This session prioritised full desktop/tablet/mobile coverage plus
node-level computed-style contrast measurement for the **first reference
surface** (`/enterprise-decision-scan`, brief §16) over shallow desktop-only
coverage for all 8, since that route is the one actually being migrated and
proven this pass. The remaining 7 reference routes got a desktop screenshot
plus a lighter automated contrast sample (worst-5 nodes) sufficient to
confirm the systemic pattern — see `contrast-baseline.csv`.

**Follow-up required in Phase 2** (`test:visual-regression` build-out):
generate the full 8×4 = 32-shot disk-persisted baseline via Playwright,
using this route list, before that gate goes live — otherwise there is no
durable pixel record to regress against.
