# 18-Token Conflict Matrix — Full Analysis

Supersedes the flat conflict count in `token-conflict-register.json`'s
`conflicts` array (that file remains the raw machine-extracted data source;
this file is the analysed matrix). Consumer counts are direct `var(--token)`
references in `pages/`, `app/`, `components/` only — Tailwind class-based
consumption is covered separately per token where relevant.

**Third source discovered during this closure pass**: `tailwind.config.cjs`'s
`colors.aol.*` namespace hardcodes its own literal RGB values (e.g.
`aol.void: rgb(3 3 5)`), independent of both `--aol-*` CSS files, and
matching neither. It has **zero verified class-usage consumers**
(`bg-aol-*`/`text-aol-*`/`border-aol-*` all return 0 hits) — recorded as a
third value source per token below for completeness, but it is dead weight,
not a live rendering conflict, since nothing consumes it as a class.

| Token | Pages value (`styles/globals.css`) | App value (`app/globals.css`) | Tailwind `aol.*` literal (dead, 0 consumers) | DS relation | Direct `var()` consumers | Conflict class | Proposed canonical target |
|---|---|---|---|---|---:|---|---|
| `--aol-bg` | `6 6 9` (#060609) | `4 4 5` (#040405) | `void: rgb(3 3 5)` (3rd distinct value) | `--ds-background` → `--ds-neutral-900` (`#0b0a09`, unrelated palette) | 4 | CROSS_FILE + DEAD_THIRD_SOURCE | **Pages value** (`6 6 9`) — matches reference-surface baseline measured in Phase 0; App's `4 4 5` and Tailwind's `3 3 5` both retire |
| `--aol-bg-2` | `9 9 12` | `8 8 10` | `lifted: rgb(9 9 12)` (matches Pages exactly) | none direct | 0 | CROSS_FILE | **Pages value** — also already matches the (unused) Tailwind literal, lowest-friction choice |
| `--aol-bg-3` | `14 14 18` | `13 13 15` | `panel: rgb(14 14 18)` (matches Pages exactly) | none direct | 0 | CROSS_FILE | **Pages value** — same reasoning |
| `--aol-panel` | `0 0 0` (pure black) | `18 18 20` | none | `--ds-panel` → `--surface-read` (translucent overlay, different concept entirely) | 0 | CROSS_FILE | **Needs owner input, not auto-resolvable** — pure black vs a lifted dark grey are visually very different design intents, not a rounding gap. Flagging rather than silently picking Pages here. |
| `--aol-panel-2` | `10 10 14` | `22 22 25` | none | see above | 0 | CROSS_FILE | Same flag as `--aol-panel` — resolve together as one decision |
| `--aol-panel-3` | `16 16 20` | `28 28 32` | none | see above | 0 | CROSS_FILE | Same flag |
| `--aol-ink` | `242 241 238` | `250 249 245` | `body: rgb(255 255 255 / 0.92)` (neither, alpha-based) | `--ds-text` → `--text-primary` (`rgba(255,255,255,0.92)`) | 8 | CROSS_FILE | **Pages value**, preserving Phase 0's measured reference-surface state; flagged in `aol-foundation.css` draft that Pages' ink/ink-dim/ink-muted are degenerate (all identical) — real luminance-step redesign is separate governed work, not this token pick |
| `--aol-ink-dim` | `242 241 238` (== ink, degenerate) | `225 224 220` (genuinely distinct) | none | `--ds-text-muted` → `rgba(255,255,255,0.72)` | 7 | CROSS_FILE + DEGENERATE_SOURCE | **Contested** — App's value is architecturally correct (an actual distinct step); Pages' is a duplicate of `--aol-ink`. Picking Pages preserves current pixels but preserves a real design defect. Recommend: adopt Pages numerically for zero-diff Phase 1, explicitly schedule a follow-up ink-ladder redesign ticket — do not silently fix this inside a "no appearance change" phase. |
| `--aol-ink-muted` | `242 241 238` (degenerate) | `160 160 165` (genuinely distinct) | none | `--ds-text-subtle` → `rgba(255,255,255,0.56)` | 3 | CROSS_FILE + DEGENERATE_SOURCE | Same as `--aol-ink-dim` — same recommendation |
| `--aol-gold` | `201 169 110` (#C9A96E) | `201 169 106` (#C9A96A) | `gold: rgb(201 169 110)` (matches Pages) | `--ds-accent` → `--ds-amber-400` (independent amber scale) | 22 | CROSS_FILE (minor, 1-component drift) | **Pages value** — highest-consumer token (22 direct refs), smallest drift (1/255 per channel), lowest-risk pick, already matches the dead Tailwind literal |
| `--aol-gold-strong` | `245 158 11` (amber-500) | `222 190 126` (soft gold) | `gold-strong: rgb(212 175 55)` (3rd distinct value — none of the three agree) | none direct | 6 | CROSS_FILE (severe — 3 genuinely different colours, not variants) | **Needs owner input** — this is not a rounding conflict, it's three different design intents (a saturated amber CTA colour vs a soft gold vs a classic "goldenrod"). Recommend owner picks the intended visual before Phase 1 locks this one; defaulting to Pages only for the mechanical file build, flagged loudly. |
| `--aol-gold-soft` | `184 155 110` | `170 144 94` | `gold-soft: rgb(201 169 110 / 0.24)` (different mechanism — alpha-based, not solid) | none direct | 0 | CROSS_FILE | **Pages value** — no live consumers found, low risk either way |
| `--aol-danger` | `239 68 68` (red-500) | `185 65 65` | none | `--ds-danger` → `#cf4d4d` (a 4th distinct value) | 0 | CROSS_FILE + DEAD_THIRD_SOURCE (DS) | **Pages value** (standard Tailwind red-500, most recognisable/conventional choice) |
| `--aol-success` | `34 197 94` (green-500) | `46 160 110` | none | `--ds-success` → `#3fbf75` (a 4th distinct value) | 0 | CROSS_FILE + DEAD_THIRD_SOURCE (DS) | **Pages value** (standard Tailwind green-500) |
| `--aol-warning` | `234 179 8` (yellow-500) | `214 135 34` | none | `--ds-warning` → `--ds-amber-300` (a 4th distinct value) | 0 | CROSS_FILE + DEAD_THIRD_SOURCE (DS) | **Pages value** (standard Tailwind yellow-500) |
| `--font-serif` | `"Cormorant Garamond"` | `var(--font-cormorant), "Cormorant Garamond", Georgia, serif` | n/a | none | 3 | CROSS_FILE (App's is a superset fallback stack, not a real conflict) | **App's fallback stack** — it's strictly more robust (same primary font, adds a Google-Fonts-variable reference plus Georgia/serif fallback); adopting it changes nothing for a browser that has the font loaded, only improves failure-mode behaviour |
| `--font-mono` | `"JetBrains Mono"` | `var(--font-mono), "JetBrains Mono", ui-monospace, monospace` | n/a | none | 16 | CROSS_FILE (same pattern as above) | **App's fallback stack**, same reasoning |
| `--font-sans` | `"Inter"` | `var(--font-inter), Inter, system-ui, sans-serif` | n/a | none | 1 | CROSS_FILE (same pattern) | **App's fallback stack**, same reasoning |

## Summary counts

- **True colour conflicts requiring an owner decision (not mechanically resolvable by "prefer Pages"):** `--aol-panel` family (3 tokens, pure-black vs lifted-grey is a design intent difference) and `--aol-gold-strong` (3-way disagreement, no clear majority).
- **Mechanically resolvable in favour of Pages** (preserves Phase 0 baseline, lowest risk): `--aol-bg` family (3), `--aol-ink` family (3, with the degenerate-source caveat flagged separately), `--aol-gold`, `--aol-gold-soft`, `--aol-danger`, `--aol-success`, `--aol-warning` — 12 tokens.
- **Mechanically resolvable in favour of App** (strictly-better fallback stacks, not a real value disagreement): all 3 font tokens.
- **Dead third/fourth value sources found and flagged, not previously counted**: `tailwind.config.cjs`'s `colors.aol.*` (0 consumers, 7 of these 18 tokens have a literal counterpart there, agreeing with Pages on 3, agreeing with neither source on `void`/`gold-strong`), and `styles/design-system.css`'s DS semantic layer independently hardcodes `--ds-danger`/`--ds-success`/`--ds-warning` as a 4th value set unrelated to either AOL source.

This matrix should gate the actual `aol-foundation.css` value choices in Phase 1 — the `--aol-panel` and `--aol-gold-strong` rows should not be resolved silently.
