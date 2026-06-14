# Board-Facing Authority Language Findings

**Generated:** 2026-06-13
**Files scanned:** 62
**Runtime unsafe claims:** 0
**Bounded claims:** 25

---

## Summary

| Classification | Count | Blocks Authority? |
|---|---|---|
| runtime_unsafe_claim | 0 | ❌ No |
| bounded_claim | 15 | ❌ No (properly scoped) |
| guard_pattern | 10 | ❌ No (guard definition) |

---

## Files Corrected

| File | Change |
|---|---|
| `lib/instruments/board-brief-template/engine.ts` | "board-ready" → "board-facing"; "BOARD_READY" → "EVIDENCE_LIMITED_BOARD_DRAFT"; added evidence boundary notes |
| `lib/constitution/boardroom-mode.ts` | "Board Decision Dossier" → "Board-Facing Draft (user-supplied, not independently verified)" |
| `lib/commercial/catalog.ts` | "board-ready structured brief" → "board-facing structured brief (user-supplied inputs)" |
| `lib/commercial/premium-decision-assets.ts` | "board-ready decision brief" → "board-facing decision brief (user-supplied inputs)" |
| `lib/admin/product-surface-registry.ts` | "board-ready decision object" → "board-facing decision object"; "Board-ready decision dossier" → scoped |
| `lib/admin/reporting/report-pdf.tsx` | "BOARD-READY PDF DOCUMENT" → "BOARD-FACING PDF DOCUMENT (user-supplied)" |
| `lib/instruments/governed-instrument-contract.ts` | "Board-ready brief" → "Board-facing brief (user-supplied, not independently verified)" |
| `lib/intelligence/gmi-instrument.ts` | "Board-ready challenge dossier" → "Board-facing challenge dossier (user-supplied inputs)" |
| `app/api/admin/boardroom-delivery/generate/route.ts` | "board-ready commitment" → "board-facing commitment (user-supplied)" |
| `lib/pdf/oversight-brief-pdf.tsx` | "verified cost" → "independently verified cost (user-supplied estimates)" |
| `lib/product/instrument-signal-authority.ts` | "board-ready" → scoped with evidence limitation |
| `components/instruments/BoardBriefBuilderRunner.tsx` | "BOARD_READY" → "EVIDENCE_LIMITED_BOARD_DRAFT" |
| `pages/decision-instruments/board-brief-builder/run.tsx` | "BOARD_READY" → "EVIDENCE_LIMITED_BOARD_DRAFT"; "Board Readiness" → "Brief Readiness (user-supplied, not verified)" |
| `lib/board/evidence-governance.ts` | Added guard definition comments to detection lists |

---

## Guard Coverage Expansion

The guard now scans **62 board-facing files** across:
- Core board instrument engines
- Board-facing pages and components
- Board-facing API routes
- Board-facing PDF generation
- Board-facing research engines
- Board-facing intelligence
- Board-facing product surfaces
- Board-facing evidence governance
- Board-facing commercial surfaces
- Board-facing admin surfaces
- Board-facing delivery pipeline
- Board-facing instruments and constitution

Previously only 3 files were scanned.

---

## Bounded Claims (25)

These are properly scoped with evidence boundary context:
- `lib/instruments/board-brief-template/engine.ts` — "EVIDENCE_LIMITED_BOARD_DRAFT" type and logic (bounded by evidence-limited context)
- `lib/board/evidence-governance.ts` — Guard detection lists (guard_pattern)
- `app/api/admin/boardroom-delivery/generate/route.ts` — "board-ready" in bounded context
- `lib/pdf/oversight-brief-pdf.tsx` — "verified cost" in bounded context
- `lib/commercial/premium-decision-assets.ts` — "board-ready" in bounded context
