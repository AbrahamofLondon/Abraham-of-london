# Visual Authority Baseline — Phase 0

**Branch:** `integration/visual-authority-convergence`
**Branched from:** `origin/main` @ `7ff57c855544b708ebdebfbb6ae550322ec8268d` (rollback SHA)
**Captured:** 2026-07-10
**Changes made to reach this baseline:** none — this is a pure measurement pass, zero lines of application code touched.

---

## 1. Token inventory and conflicts

Full data: `token-ownership-matrix.csv`, `token-conflict-register.json`

- **214** CSS custom-property definitions scanned across the 4 known global sources (`styles/globals.css`, `app/globals.css`, `styles/design-system.css`, `styles/brand-system.css`)
- **156** distinct variable names
- **18 genuine cross-file conflicts** — the same `--aol-*`/`--font-*` name resolves to a *different value* depending on which file defines it. All 18 are `styles/globals.css` (Pages Router) vs `app/globals.css` (App Router) — this is the direct mechanism of the ROUTER PARITY FAILURE named in the brief. Concrete examples:
  - `--aol-bg`: `6 6 9` (Pages) vs `4 4 5` (App)
  - `--aol-panel`: `0 0 0` (Pages) vs `18 18 20` (App)
  - `--aol-gold-strong`: `245 158 11` (amber-500, Pages) vs `222 190 126` (a different, softer gold, App) — not a rounding difference, a materially different colour
  - `--aol-ink`, `--aol-ink-dim`, `--aol-ink-muted`, `--aol-danger`, `--aol-success`, `--aol-warning`, `--font-serif`, `--font-mono`, `--font-sans` all similarly diverge
- **11 same-file "conflicts"** in `styles/design-system.css` — these are **not real defects**, they're per-surface selector-scoped overrides (`.ds-surface-canon`, `.ds-surface-vault`, dark/light variants of `--ds-text`, `--ds-accent`, etc.). Flagged separately so they aren't miscounted.
- Tailwind exposes **9 distinct colour namespaces** claiming some form of brand authority: `aol`, `ds`, `brand`, `softGold`, `gold`, `amber`, `cream`, `warmWhite`, plus legacy `surface-*` aliases.

## 2. Duplicate selector register

Full data: `duplicate-selector-register.json`

All 9 selectors named in the brief (§12) are confirmed duplicated:

| Selector | Definitions | Files | Consumers found |
|---|---:|---:|---:|
| `city-gate-card` | 3 | 3 | 6 |
| `architecture-card` | 2 | 2 | 0 (literal-grep; may use dynamic composition) |
| `nav-pill-premium` | 2 | 2 | 0 |
| `aol-grain` | 2 | 2 | 12 |
| `aol-grain-overlay` | 2 | 2 | 1 |
| `hairline-premium` | 2 | 2 | 0 |
| `hairline-gold` | 2 | 2 | 0 |
| `forensic-trace` | 4 | 2 | 0 |
| `aol-mdx-content` | 2 | 2 | 8 |

Zero-consumer results are from literal substring search only — do not treat as proof of dead code before Phase 3's proper consumer audit; some may be reached via `cn()`/template-literal class composition.

## 3. Tailwind alias consumer matrix

Full data: `tailwind-alias-consumer-matrix.csv`

| Alias | Usages | Files | Note |
|---|---:|---:|---|
| `softGold` | 111 | 27 | |
| `cream` | 106 | 43 | |
| `warmWhite` | 19 | 14 | |
| `amber` | 3723 | 483 | **Not a clean signal** — `amber` is also Tailwind's own default palette family (`amber-400`, `amber-500`, …), so this count conflates the repo's custom brand alias with plain framework usage. This is exactly why the brief's own alias matrix (§10.1) marks `amber`'s canonical replacement as "explicit role required" rather than a direct swap — confirmed correct call. Needs a smarter scan (distinguish `bg-amber` bare vs `bg-amber-500` shade) before Phase 3 migration. |
| `charcoal` | 11 | 7 | |
| `deepCharcoal` | 45 | 23 | |
| `softBlack` | 1 | 1 | |
| `obsidian` | 0 | 0 | dead |
| `lightGrey` | 32 | 20 | |
| `forest` | 55 | 20 | |
| `gold` | 320 | 36 | |

## 4. Raw colour / inline style / tiny type baseline

Full data: `raw-colour-baseline.json`, `type-floor-baseline.json`

Scanned `pages/`, `app/`, `components/` — 2,143 files:

- **Raw hex literals:** 3,078
- **Raw `rgb()`/`rgba()` literals:** 9,177
- **Files with raw colour:** 733 of 2,143 (34%)
- **Inline `style={{ }}` blocks:** 11,859
- **Tiny type (<11px) violations:** 5,685 across 431 files

These are recorded as the **CURRENT BASELINE** per brief §13.2 — the `gate:visual-raw-colour` and `gate:visual-type-floor` gates (Phase 2) must block *new* violations against these numbers, not attempt to zero them in one pass.

## 5. Tailwind extractor trigger inventory

Full data: `tailwind-extractor-trigger-inventory.json`

The custom extractor (`tailwind.config.cjs`) skips class extraction entirely
for any file containing the literal substring `.replace(/[-:.]`. Scanned the
full content glob (`pages`, `components`, `app`, `layouts`, `lib`, `src`):

- **3 files trigger it**, all in `lib/`: `lib/diagnostics/store.ts`, `lib/reports/store.ts`, `lib/server/diagnostics/store.ts`
- None are component/page files, so there is no known *live* class-truncation incident today — but the mechanism has no build-time warning, so any future file containing that exact substring silently loses Tailwind class extraction. Full empirical extractor investigation (§11: emission diff, sentinel-class comparison) is **Phase 3 scope**, deferred.

## 6. Contrast baseline — this is the headline finding

Full data: `contrast-baseline.csv`. Measured via real computed styles in a
running browser (not source-string estimation), with proper alpha
compositing against the actual resolved background — see methodology note
below, since the first pass of this measurement had a bug worth recording.

**Methodology correction made during this pass:** the first contrast script
computed luminance from `rgba(r,g,b,a)` while discarding `a` — i.e. treating
`rgba(255,255,255,0.3)` as opaque white. That silently overstates every
alpha-based colour's contrast and would have produced a false-clean
baseline. Fixed to properly composite (`fg×a + bg×(1−a)`) before computing
the WCAG ratio. **This bug is itself evidence for brief §6 Rule 2**: contrast
cannot be inferred from a source colour string; it must be measured post-composition.

Sampled all 8 reference routes. Every one shows the same defect family:

- **`/enterprise-decision-scan` (full 3-viewport + node-level pass, the reference surface):**
  - Placeholder text: `rgba(255,255,255,0.2)` → composited `rgb(53,53,55)` on `rgb(3,3,5)` → **1.69:1** (needs 4.5:1) — the "nearly invisible placeholders" defect named explicitly in brief §16, now measured precisely.
  - Secondary explanatory body ("This is not a consumer quiz…"): `rgba(255,255,255,0.3)` → **2.5:1**.
  - Eyebrow label ("For organisations"), 9px: gold at 0.533 alpha → **3.16:1**, and fails the 11px type floor too.
  - Form field labels, 11px: gold at 0.667 alpha → **4.44:1** — fails the 4.5:1 minimum, but only marginally; closest to passing of anything measured.
  - Primary explanatory body ("A 15-minute scan…"): white at 0.5 alpha → **5.29:1** — actually **passes** 4.5:1. Not everything on this page is broken; the failure is concentrated in secondary/tertiary text and placeholders specifically.
- **`/decision-centre`:** three 9px card labels ("Test a Decision", "Decision Pressure", "Quick Check") measured at **1.0:1** — visually confirmed near-invisible in screenshot.
- **`/diagnostics`:** two full card headings ("Do leadership intent and team reality diverge…", "Where has organisational strain become systemic…") render **fully invisible**. Root-caused precisely: `<p class="... text-lg" style="color:rgba(255,255,255,0.5)">` sits inside a parent with Tailwind class `opacity-60` applied to the *entire card wrapper* (`border p-5 transition hover:opacity-80 opacity-60`). This is **opacity multiplication**, one of the exact defect categories named in brief §2 — 0.5 (text) × 0.6 (parent) ≈ 0.3 effective alpha against a near-black card background. Confirmed by direct DOM inspection, not inferred.
- **`/intelligence`:** live 7px and 7.5px type still present in rendered output (`"Public"`/`"Member"` badges at 7px → 2.08:1, `"Directory"` at 7.5px → 1.69:1) — the font-size sweep referenced in earlier sessions did not reach this route/branch.
- **`/intelligence/gmi/q2-2026`, `/foundry/decision-test`, `/boardroom-brief`, `/checkout/personal-decision-audit`:** same pattern on visual inspection — faint secondary body copy, faint fine print, faint button labels. Not separately node-measured this pass; flagged for the full Phase 2 contrast suite.

**No universal alpha floor recommendation** — per brief §6 Rule 2, the fix is not "make everything ≥0.55 opacity." The primary-body text at 0.5 alpha already passes; the eyebrow label at 0.533 alpha fails because it's *also* 9px (type floor violation compounds the alpha issue). Each violation needs its own semantic-role fix, not a global sweep.

## 7. Dark-only / theme policy (§9) — preliminary note

Not fully audited this pass (scheduled alongside Phase 1/2). One observation
from the `/intelligence` screenshot: the page transitions from a dark hero
into a light cream "WHERE TO BEGIN" section — this may be an intentional
editorial dual-regime pattern (consistent with prior GMI Q2 dual-regime
design decisions) rather than a light-mode leak, but needs explicit
confirmation against the dark-only policy before Phase 1 concludes, since
visually it's indistinguishable from an accidental light-mode fragment
without checking the source.

## 8. What Phase 0 does NOT yet cover

Per brief §19, these required reports are **Phase 2/3 deliverables**, not
Phase 0, and are intentionally not produced yet:
`tailwind-extractor-audit.md` (needs the full extraction experiment, §11
steps 3–6), `tailwind-emission-diff.json` (same), `router-parity-report.json`
(needs the actual fixture-mount comparison, §13.5), `surface-migration-register.json`
(populated as migration proceeds, starting after the reference surface).

## 9. Rollback

```
ROLLBACK SHA: 7ff57c855544b708ebdebfbb6ae550322ec8268d  (= origin/main)
BRANCH: integration/visual-authority-convergence
```
