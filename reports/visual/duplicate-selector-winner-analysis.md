# Duplicate Selector Winner Analysis

For each of the 9 named selectors (brief §12), the actual rule bodies from
`duplicate-selector-register.json` compared, with a recommendation and
explicit risk flag. "Consumer count" is literal-substring grep across
`pages/`, `app/`, `components/` — treat 0-consumer results as *unconfirmed
dead*, not *proven dead* (may be reached via dynamic `cn()`/template-literal
class composition).

| Selector | Consumers | Definitions differ by | Recommendation | Risk |
|---|---:|---|---|---|
| `city-gate-card` | 6 (components only — dashboard/alignment cluster) | Pages: flat `rgb(var(--aol-bg-3))` background. App: gold-tinted radial gradient + `backdrop-blur-md`. `styles/brand-system.css`: a third, unloaded Tailwind-v4 treatment. Border-radius actually matches (28px both) once units are normalised. | Discard the orphaned `brand-system.css` version outright (never loaded, incompatible Tailwind syntax). Between Pages/App: **needs owner confirmation** — App's richer gradient+blur treatment reads as the intended "premium institutional" aesthetic, but adopting it changes the rendered appearance for whichever router currently wins per-consumer. Do not silently pick one. | HIGH — 6 real consumers, visually distinct treatments, not a rounding gap |
| `architecture-card` | 0 (grep) | Same flat-vs-gradient pattern as `city-gate-card` | Confirm true consumer count (dynamic class composition check) before deciding — do not consolidate a selector whose live usage is unconfirmed | LOW *if* genuinely dead; unknown until confirmed |
| `nav-pill-premium` | 0 (grep) | Near-identical intent; **both definitions independently hardcode `font-size: 9px`** — this selector is itself a live tiny-type violation baked into the CSS, not just component-level misuse | If resurrected in Phase 3, the 9px must be corrected to the 11px floor as part of migration, not preserved as "the existing value" | LOW usage risk, but embeds a real type-floor defect regardless of which definition wins |
| `aol-grain` | 12 (highest — pages + components) | Pages: SVG noise `baseFrequency 0.65`. App: `0.72`. Decorative texture only, not text-adjacent. | **Pages value** — matches the default "prefer Pages, matches Phase-0-measured baseline" policy; difference is imperceptible and purely decorative (brief §7 gives latitude here) | LOW — decorative-only, both values are within one design intent |
| `aol-grain-overlay` | 1 (`components/AppShell.tsx` — shared shell, likely rendered under both routers) | opacity `0.015` (Pages) vs `0.013` (App) — negligible | **Pages value**, same reasoning as `aol-grain` | LOW |
| `hairline-premium` | 0 (grep) | border opacity `0.12` (Pages) vs `0.10` (App) | Confirm true consumer count before deciding; if resolved, Pages value per default policy | LOW *if* genuinely dead |
| `hairline-gold` | 0 (grep) | Pages **hardcodes** `rgba(201,169,110,0.34)` as a raw literal. App **references** `rgba(var(--aol-gold), 0.28)` — token-based, architecturally the correct pattern, but a different resulting intensity (0.34 vs 0.28). | Adopt **App's token-referencing pattern** (correctness of mechanism), but the actual opacity value (0.34 vs 0.28) is a real visual decision — **needs owner confirmation**, don't default silently | MEDIUM — pattern choice is clear, value choice is not |
| `forensic-trace` | 0 (grep) | Two rule *contexts* per file (screen + `@media print`). The print-context rule is **byte-identical** in both files (`border:1px solid #ccc...`) — a genuine non-conflict, safe to consolidate immediately. The screen-context rule differs materially: Pages hardcodes `rgba(242,241,238,0.68)` text / `0.10` border; App references `rgba(var(--aol-ink-muted),0.96)` text / `0.14` border — both the alpha level and the hardcoded-vs-token pattern differ. | Print variant: consolidate now, no decision needed. Screen variant: confirm true consumer count, then apply the same "adopt token-referencing pattern, confirm the value" treatment as `hairline-gold` | LOW for print variant (safe now); MEDIUM for screen variant pending consumer confirmation |
| `aol-mdx-content` | 8 (blog/editorial series pages + MDX renderer components — real, live content-rendering path) | `line-height: 1.80` (Pages) vs `1.82` (App) — the smallest, most negligible difference of all 9 selectors | **Pages value** — safest of all 9 to resolve mechanically, real consumers but functionally imperceptible difference | LOW despite real consumer count, because the delta itself is trivial |

## What this means for Phase 3 scope

Two selectors (`city-gate-card`, `hairline-gold`) have live consumers *and*
a genuine, non-trivial visual decision behind them — these should not be
resolved as part of a "no appearance change" mechanical pass; they need an
explicit owner call, same treatment as the `--aol-panel` and
`--aol-gold-strong` token conflicts in `token-conflict-matrix-full.md`.
Three selectors (`architecture-card`, `nav-pill-premium`, `hairline-premium`)
have unconfirmed-dead status and need a real consumer audit (not just
literal grep) before any consolidation decision is made. The remaining four
(`aol-grain`, `aol-grain-overlay`, `forensic-trace`'s print variant,
`aol-mdx-content`) are safe to mechanically consolidate toward the Pages
value with negligible visual risk.
