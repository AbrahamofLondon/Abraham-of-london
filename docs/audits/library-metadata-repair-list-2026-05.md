# Library Metadata Repair List — 2026-05-17

**Generated from:** Library index aggregation audit  
**Scope:** Items missing critical metadata fields needed for a proper institutional library  
**Status:** Report only — no content changes made

---

## 1. Methodology

The library index aggregation (`lib/library/library-index.ts`) processes all Contentlayer documents, PDF registry entries, and premium content items. During aggregation, the normalizer (`lib/library/normalise-library-item.ts`) logs missing fields. This report catalogs what was found.

---

## 2. Missing Titles

Items where `title` is empty or missing entirely.

| Source | ID / Slug | Type | Notes |
|--------|----------|------|-------|
| Contentlayer | (any with empty title) | — | Check all docs have `title` in frontmatter |

**Action:** Ensure every Contentlayer document has a `title` field in its frontmatter. The normalizer falls back to the filename or "Untitled" but this should not happen in production.

---

## 3. Missing Summaries / Descriptions

Items where both `excerpt` AND `description` AND `summary` are empty. The library card display relies on `summary` for the card body text.

| Source | Type | Count Estimate | Notes |
|--------|------|---------------|-------|
| Contentlayer downloads | download | ~50% | Many downloads have auto-generated descriptions |
| PDF registry | pdf | ~80% | Most entries have generic "X — Abraham of London resource." descriptions |
| Contentlayer resources | resource | ~30% | Some resources lack descriptions |

**Action:** Add meaningful `description` or `excerpt` fields to:
- All download pages (193 items — priority)
- All PDF registry entries (64 items — priority)
- All resource pages (27 items)

---

## 4. Missing Dates

Items where no date field is present (`date`, `eventDate`, `startDate`, `datetime`, `startsAt`, `updated`, `lastUpdated`, `createdAt` all empty).

| Source | Type | Count Estimate | Impact |
|--------|------|---------------|--------|
| PDF registry | pdf | ~64 | No dates — cannot sort by newest |
| Contentlayer downloads | download | ~30% | Some missing dates |
| Contentlayer resources | resource | ~20% | Some missing dates |

**Action:** Ensure all Contentlayer documents have a `date` field. For PDF registry entries, the `lastModified` field should be populated.

---

## 5. Missing Tags

Items where `tags` array is empty.

| Source | Type | Count Estimate | Impact |
|--------|------|---------------|--------|
| Contentlayer downloads | download | ~70% | Cannot filter by tag |
| Contentlayer resources | resource | ~40% | Cannot filter by tag |
| Contentlayer briefs | brief | ~20% | Some untagged |
| PDF registry | pdf | ~90% | Most have no tags |
| Contentlayer vault | vault | ~50% | Some untagged |

**Action:** Add relevant tags to:
- All download pages (priority)
- All PDF registry entries (priority)
- All resource pages
- All vault items

---

## 6. Missing Categories

Items where `category` field is empty.

| Source | Type | Count Estimate | Impact |
|--------|------|---------------|--------|
| Contentlayer downloads | download | ~60% | Cannot filter by category |
| Contentlayer shorts | short | ~50% | Cannot categorise |
| PDF registry | pdf | ~100% | Category is auto-generated from slug (e.g. "audit-of-easepdf") |

**Action:** Add meaningful `category` values to all document types. For PDF registry, fix the category generation to produce readable values.

---

## 7. Missing Routes / Unresolvable Hrefs

Items where the library index could not resolve a valid `href`.

| Source | ID | Type | Notes |
|--------|----|------|-------|
| Contentlayer | (any without slug) | — | Check all docs have a resolvable slug |
| PDF registry | entries without outputPath | pdf | Some may lack `outputPath` |

**Action:** Ensure every document has either a `slug` field or a resolvable `_raw.flattenedPath`. For PDF registry, ensure `outputPath` is always populated.

---

## 8. Duplicate Titles

Items sharing the same title string (potential duplicates).

| Title | Source 1 | Source 2 | Notes |
|-------|----------|----------|-------|
| (Check during build) | Contentlayer | PDF registry | Some PDFs may have matching MDX pages |

**Action:** Run the library index and check for duplicate titles. Where a PDF has both an MDX download page AND a PDF registry entry, decide which should be the canonical entry.

---

## 9. Unknown Access

Items where the access tier could not be determined.

| Source | Count | Notes |
|--------|-------|-------|
| Contentlayer | ~0 (all have computed `accessTierSafe`) | Good — Contentlayer computes this |
| PDF registry | ~0 (all have `tier` field) | Good |
| Premium registry | ~0 | Good |

**Action:** None required — access normalisation is working correctly.

---

## 10. Unresolved Asset Hrefs (PDF Registry)

PDF registry entries where the `outputPath` does not correspond to an existing file on disk.

| ID | Path | Status |
|----|------|--------|
| (Check at build time) | `/assets/downloads/...` | Verify file exists |

**Action:** Run `getAllPDFItemsNode()` to check which generated PDFs actually exist on disk. Remove or flag entries where the file is missing.

---

## 11. Priority Repair Order

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| **P0** | Add `description` to all download pages (193) | Medium | Library cards show meaningful text |
| **P0** | Add `tags` to all download pages (193) | Medium | Filtering works |
| **P1** | Add `date` to all PDF registry entries (64) | Low | Sorting by date works |
| **P1** | Add `tags` to PDF registry entries (64) | Medium | Filtering works |
| **P2** | Add `category` to all shorts (96) | Medium | Categorisation works |
| **P2** | Fix PDF registry category generation | Low | Clean category display |
| **P3** | Add `coverImage` to books and downloads | High | Visual library cards |
| **P3** | Deduplicate MDX pages vs PDF registry entries | Medium | Clean data |

---

## 12. How to Verify

```bash
# Build the library index and run tests
pnpm vitest run lib/library

# Run the coverage audit
node scripts/audit-library-coverage.mjs

# Build contentlayer
pnpm contentlayer2 build
```

The library index tests will fail if:
- Any item has an empty title
- Any item has a missing href
- Any item has unknown access
- Any item exposes body content
