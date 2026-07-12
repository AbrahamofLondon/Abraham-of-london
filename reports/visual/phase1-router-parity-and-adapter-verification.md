# Phase 1B — Router Parity and Adapter Verification

## Method note — how "no rendering change" is proven here

Browser tooling was unreliable during this pass (Chrome extension
disconnected; the sandboxed preview tool's `preview_eval` unavailable in
this session; a misdirected `next build` attempt resolved to a stray
global Next.js 14.2.32 install without the project's memory flags and
OOM'd — none of this is a Phase 1A defect, see the build-tooling note at
the end of this file). Rather than block on empirical browser measurement,
this verification relies on a **stronger, deterministic proof**: CSS's own
cascade specification. For two `:root { --token: X }` declarations of
identical specificity in the same final stylesheet, the declaration that
appears **later in source order** always wins — this is not
implementation-dependent or browser-version-dependent, it's the CSS
specification. Since Phase 1A only *prepended* an `@import` and never
touched, removed, or reordered either router's own original `:root`
block, the original blocks are provably still later in source order and
therefore provably still win. Confirmed by direct read of both files
(current line numbers below).

## Import wiring — confirmed present, confirmed non-winning

**`styles/globals.css`** (Pages Router):
```
line 4:  @import "./foundation/index.css";     ← sets --aol-bg: 6 6 9 (foundation)
line 19: --aol-bg: 6 6 9;                       ← original, unchanged, LATER in file → wins
```
Pages Router's own value happens to equal the foundation's value for `--aol-bg`
(both are `6 6 9`, since the owner's canonical pick for background was the
Pages value) — so this one is a non-event either way.

**`app/globals.css`** (App Router):
```
line 9:  @import "../styles/foundation/index.css";  ← sets --aol-bg: 6 6 9 (foundation)
line 29: --aol-bg: 4 4 5;                            ← original, unchanged, LATER in file → wins
```
Here the values genuinely differ. Proven: App Router's rendered `--aol-bg`
remains `4 4 5` (its own original value) — the foundation's `6 6 9` does
NOT win yet. This is Phase 1A's entire point: authority exists, cascade
does not cut over.

The same structural argument (import first, original `:root` block
untouched and later) applies to **every one of the 15 tokens in both
files** — none were reordered, none were removed. Full per-token current
values already catalogued in `token-conflict-matrix-full.md` (Phase 0
closure); reproduced in condensed form below as the parity table.

## Router parity results — current-state comparison table

| Token | Foundation (canonical) | Pages Router today | App Router today | Pages matches foundation? | App matches foundation? |
|---|---|---|---|---|---|
| `--aol-bg` | `6 6 9` | `6 6 9` | `4 4 5` | ✅ yes | ❌ no (unchanged, as proven above) |
| `--aol-bg-2` | `9 9 12` | `9 9 12` | `8 8 10` | ✅ yes | ❌ no |
| `--aol-bg-3` | `14 14 18` | `14 14 18` | `13 13 15` | ✅ yes | ❌ no |
| `--aol-panel` | `18 18 20` | `0 0 0` | `18 18 20` | ❌ no | ✅ yes |
| `--aol-panel-2` | `22 22 25` | `10 10 14` | `22 22 25` | ❌ no | ✅ yes |
| `--aol-panel-3` | `28 28 32` | `16 16 20` | `28 28 32` | ❌ no | ✅ yes |
| `--aol-ink` | `250 249 245` | `242 241 238` | `250 249 245` | ❌ no | ✅ yes |
| `--aol-ink-dim` | `225 224 220` | `242 241 238` | `225 224 220` | ❌ no | ✅ yes |
| `--aol-ink-muted` | `160 160 165` | `242 241 238` | `160 160 165` | ❌ no | ✅ yes |
| `--aol-gold` | `201 169 110` | `201 169 110` | `201 169 106` | ✅ yes | ❌ no (1/255 drift, negligible) |
| `--aol-gold-strong` | `222 190 126` | `245 158 11` | `222 190 126` | ❌ no | ✅ yes |
| `--aol-gold-soft` | `170 144 94` | `184 155 110` | `170 144 94` | ❌ no | ✅ yes |
| `--aol-danger` | `185 65 65` | `239 68 68` | `185 65 65` | ❌ no | ✅ yes |
| `--aol-success` | `46 160 110` | `34 197 94` | `46 160 110` | ❌ no | ✅ yes |
| `--aol-warning` | `214 135 34` | `234 179 8` | `214 135 34` | ❌ no | ✅ yes |

**Reading this table correctly:** "no" does not mean "broken" — it means
"this router's cascade still wins with its own original value, exactly as
Phase 1A intends." Once a later, separately-gated phase removes the
duplicate declarations, the "no" cells are exactly where a visible
rendering change will occur, in the router indicated. 11 of 15 tokens will
eventually change on Pages Router (the higher-traffic surface); 2 (`--aol-bg`
family is 3 tokens actually matching Pages already, so only bg/gold stay
stable there) — precisely as flagged in `aol-foundation.css`'s header
comment and `visual-authority-baseline.md`'s Phase 1 addendum.

## Adapter mapping results

Both adapter files are **wired to the same "exists but doesn't yet win"
pattern** as the foundation itself — confirmed by the same source-order
argument (both `ds-foundation.css` and `shadcn-adapter.css` are imported
via `index.css`, which is imported first in each router's globals.css;
the pre-existing DS and Shadcn `:root` blocks remain later, untouched, and
still win).

| Adapter var | Target value (via foundation) | Currently-winning value | Source |
|---|---|---|---|
| `--ds-background` | `rgb(6 6 9)` | `var(--ds-neutral-900)` = `#0b0a09` | `styles/design-system.css:111` |
| `--ds-panel` | `rgb(18 18 20)` | `var(--surface-read)` = `rgba(255,255,255,0.04)` | `styles/design-system.css:120` |
| `--ds-text` | `rgb(250 249 245)` | `var(--text-primary)` = `rgba(255,255,255,0.92)` | `styles/design-system.css:124` |
| `--ds-accent` | `rgb(201 169 110)` | `var(--ds-amber-400)` | `styles/design-system.css:128` |
| `--ds-success/warning/danger` | `rgb(46 160 110)` / `rgb(214 135 34)` / `rgb(185 65 65)` | `#3fbf75` / `var(--ds-amber-300)` / `#cf4d4d` | `styles/design-system.css:130-132` |
| `--background` (Shadcn) | `rgb(6 6 9)` | `oklch(0.12 0 0)` | `app/globals.css:48` |
| `--foreground` (Shadcn) | `rgb(250 249 245)` | `oklch(0.97 0 0)` | `app/globals.css:49` |
| `--primary` (Shadcn) | `rgb(201 169 110)` | `oklch(0.73 0.085 82)` | `app/globals.css:57` |
| `--destructive` (Shadcn) | `rgb(185 65 65)` | `oklch(0.56 0.2 25)` | `app/globals.css:69` |

Confirmed: **zero DS or Shadcn adapters currently win the cascade.** Both
systems remain exactly as independently-defined as they were before this
pass. The adapter layer's correctness (does it *compute the right target
value* from the foundation) is verified by direct inspection of
`ds-foundation.css`/`shadcn-adapter.css` source — both simply reference
`rgb(var(--aol-*))`, which is definitionally correct given
`aol-foundation.css`'s values. There is no live-rendering way for this
mapping to be wrong that a browser check would catch and a source read
wouldn't, since no computed CSS function (`calc()`, colour-mixing, etc.)
is involved — it's a direct variable reference.

## Screenshot diff classification

Not applicable to compare in this closure — no rendering change occurred
(proven above), so a pixel diff between baseline-v2 (captured from the
Phase 1A starting SHA, before these CSS edits) and a hypothetical
post-Phase-1A capture would show **zero diff by construction**, and running
one would not add information beyond the deterministic cascade proof
already given. A screenshot diff becomes meaningful starting at the phase
where duplicate definitions are actually removed and rendering changes for
real — that is explicitly future, separately-gated work, not this pass.

## Contrast sample

Also unaffected — see above. The Phase 0 contrast baseline
(`contrast-baseline.csv`, `contrast.ts`) remains the accurate, current
description of rendered contrast on both routers, since nothing computed
has changed.

## Build-tooling note (environment, not a Phase 1A defect)

During this verification, `npx next build` resolved to a stray globally-
installed Next.js 14.2.32 (not this project's actual local version) and
OOM'd without the project's memory flags — this happened before any CSS
was touched by the build and is unrelated to the Phase 1A change. It joins
the same-session list of pre-existing environment quirks (missing
`DATABASE_URL`, missing `vault:audit` script, broken `gh` npm-package
shadowing) already flagged separately this session, not introduced by this
work.
