# Book Reader Rendering Fix Report

Date: 2026-06-27

## Verdict

PASS - shared book reader rendering was corrected locally. No deploy or push was performed.

## Affected Routes

- `/books/architecture-of-ascension`
- `/books/the-builders-catechism`

## Root Cause

The book detail shell was loading the MDX reader through a client-only dynamic import with a visible loading fallback, so public raw-MDX books could appear stuck in `Reading Chamber - Loading...` when client enhancement failed or stalled. The table-of-contents extractor also fell back to scanning `main`, which allowed global navigation/footer headings to be collected instead of book-body headings.

For gated/professional books, the unlock path could surface raw API reason codes such as `SESSION_INVALID` directly to the reader.

The raw-MDX fallback also stripped entire custom component blocks, which could remove framework/canon body content instead of preserving the text inside those blocks.

## Files Changed

- `components/content/DirectorateOversight.tsx`
- `components/mdx/ClientOnlyMDXRenderer.tsx`
- `components/mdx/TableOfContents.tsx`
- `pages/books/[slug].tsx`

## Content Changes

No doctrine/book prose was changed in this commit. The fix is renderer/access handling only.

## Renderer Changes

- Replaced the dynamic client-only MDX reader import in the book shell with a direct reader import.
- Removed the permanent visible `Loading...` reader fallback from the public reader path.
- Added a scoped `data-reader-content="true"` wrapper around rendered book content.
- Preserved text inside raw-MDX custom components such as `Note`, `Verse`, `Quote`, `DocumentFooter`, `Rule`, and `Link` instead of deleting whole blocks.
- Applied the existing `aol-mdx-content` typography class to raw-MDX fallback output.
- Fixed the book page `<title>` rendering warning by using a template-string title value.

## Access / Session Handling

- Raw unlock failures are now mapped to reader-facing messages.
- `SESSION_INVALID` is no longer displayed directly in the book page UI.
- Professional-access fallback language remains dignified and non-commercial.

## TOC Fix

- The table of contents now scopes extraction to the actual reader body.
- The extractor no longer falls back to scanning the whole `main` element.
- `h1` headings are included so catechism/framework section structures can appear in the TOC.
- Generated heading IDs are de-duplicated and written back to the DOM target.

## Global Directory Leakage

Fixed by scoping TOC extraction to `[data-reader-content="true"]` and removing the `main` fallback. HTML verification found no broad-nav TOC leakage on the two target routes.

## Local Route Verification

Local server: `http://localhost:3008`

| Route | HTTP | Loading residue | SESSION_INVALID visible | Reader/body result | Global TOC leakage |
| --- | ---: | --- | --- | --- | --- |
| `/books/architecture-of-ascension` | 200 | No | No | Public reader body present; framework body detected | No |
| `/books/the-builders-catechism` | 200 | No | No | Professional access copy present for unauthenticated visitor | No |

Headless Chromium viewport inspection was attempted but the local browser process hung in this shell. The verification above used rendered HTML from the local Next server plus production build validation.

## Desktop / Mobile Result

Desktop and mobile structural safeguards were applied in the shared reader:

- reader content is scoped independently from layout/footer content
- mobile reader padding was reduced from `p-8` to `p-6`
- the TOC no longer scans global layout headings
- production build completed successfully

Full screenshot-based viewport confirmation could not be completed because headless Chromium hung locally.

## Validation Results

| Check | Result | Notes |
| --- | --- | --- |
| `pnpm contentlayer2 build` | PASS | 838 valid documents, 0 invalid |
| `pnpm typecheck` | PASS | `tsc --noEmit` |
| `pnpm mdx:integrity` | PASS | 114 files scanned; no corruption detected |
| `pnpm mdx:gate` | PASS | 1030 assets verified |
| `pnpm build` | PASS | Completed after long build; existing warnings only |
| `git diff --check` | PASS | No whitespace errors |

Production build warnings observed:

- existing PDF governance duplicate filename warning
- local development DB schema drift warning during vault sync
- existing `fs` resolution warnings in product modules
- large page-data warnings for `/content` and `/registry`

None were introduced by this reader fix.

## Git Status

Pre-commit status: four source files modified; no generated build artifacts retained.

Current branch: `main`

Branch ahead count before this commit: `1`

Commit hash: pending until local commit is created.

Push/deploy status: not pushed, not deployed.
