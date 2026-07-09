# Legibility Standard — Audit of the 331-File Replacement (0ce5ff4b9)

**Date:** 2026-07-09 · **Auditor:** owner-authorised release editor
**Commit audited:** `0ce5ff4b9` "estate-wide legibility standard — replace all 7px/7.5px/8px font sizes with 11px"

## Honest verdict

The commit performed an **estate-wide replacement of three selected hard-coded
inline font sizes** (`fontSize: "7px" | "7.5px" | "8px"` → `11px`). It did
**not** establish an estate-wide legibility standard:

1. **The dominant styling idiom was untouched.** Tailwind arbitrary classes
   remain at illegible sizes: `text-[8px]` ×567, `text-[7px]` ×258,
   `text-[6px]` ×49, `text-[7.5px]` ×45, `text-[6.5px]` ×8.
2. **Smaller inline sizes survived** in the same layouts: `6px` ×217,
   `6.5px` ×177, `8.5px` ×83, plus `9px` ×327 and `10px` ×282 that may be
   legitimate in dense internal surfaces but were never classified.
3. Mechanical success (`331 files, 2,188 corrections, 0 typecheck errors`)
   proves the replacement ran — not that the estate became more legible.
   Typecheck cannot detect wrapping, clipping, sticky-header collisions,
   table-density distortion, or mobile overflow.

## File classification (331 changed files)

| Surface bucket | Files |
|---|---|
| Shared components | 184 |
| Public marketing pages | 72 |
| Interactive instruments | 37 |
| Public product pages | 25 |
| Admin | 9 |
| Other | 4 |

A public marketing page and a dense internal admin console should not share
one typography density. The replacement applied one rule to all buckets.

## Semantic type tokens (now available in tailwind.config.cjs)

| Token | Size | Use |
|---|---|---|
| `text-type-admin-meta` | 10px | Dense internal/admin metadata only |
| `text-type-evidence-xs` | 11px | Floor for meaningful public text: evidence refs, hashes, badges |
| `text-type-meta-sm` | 12px | Metadata, table support text |
| `text-type-support` | 14px | Secondary copy |
| `text-type-body` | 16px | Body copy |
| `text-type-body-lg` | 18px | Lead paragraphs |

## Rules going forward

- **No further global text-size replacements** until the visual regression
  audit below is complete for the affected bucket.
- New/edited surfaces use the semantic tokens; arbitrary `text-[Npx]` below
  11px requires a written justification (admin-density is the only accepted
  one, at 10–11px).
- The principle is not "everything must be 11px"; it is **nothing important
  should be illegible.**

## Outstanding visual regression checklist (per bucket, 1440/1024/768/390)

- [ ] wrapping and clipping in fixed-width columns (4rem/5rem) and badges
- [ ] sticky mobile headers
- [ ] card height balance
- [ ] dense-table density and row alignment
- [ ] admin console usability at the new sizes
- [x] assessment-family surfaces (visual acceptance run recorded separately)
