# PDF Inventory Cleanup Note

**Date:** 2026-05-25
**Warning:** `generated_pdf_inventory_outside_canonical_path: 1 generated PDF artifact remains outside /assets/downloads/{slug}.pdf`

## Stray PDF

| Field | Value |
|---|---|
| Path | `public/assets/downloads/content-downloads/frontier-resilience-01.pdf` |
| Classification | **Legacy duplicate** |
| Canonical path | `public/assets/downloads/frontier-resilience-01.pdf` (exists) |
| Manifest entry | Listed in `pdf-manifest.json` with `category: "content-downloads"` |

## Analysis

The file `frontier-resilience-01.pdf` exists in two locations:
1. `public/assets/downloads/frontier-resilience-01.pdf` — canonical path ✓
2. `public/assets/downloads/content-downloads/frontier-resilience-01.pdf` — legacy subdirectory

The canonical path already contains the file. The `content-downloads/` subdirectory is a legacy inventory pattern that was superseded by flat `/assets/downloads/{slug}.pdf` naming.

## Action

**Safe to leave as non-blocking warning.** The canonical path has the file. The legacy duplicate does not introduce a public raw PDF link leak because:
- The file is behind the same `/assets/downloads/` base path
- No public route references the `content-downloads/` subdirectory path
- The PDF enforcement report shows 0 failures (only 1 warning)

## Next Action

When the PDF inventory is next regenerated:
1. Remove `public/assets/downloads/content-downloads/frontier-resilience-01.pdf`
2. Remove `public/assets/downloads/content-downloads/frontier-resilience-01.pdf.fingerprint`
3. Update `pdf-manifest.json` to remove the `content-downloads` category entry
4. Re-run PDF enforcement to verify 0 warnings

Do not remove the file during a build hygiene pass — it is a legacy artefact that requires coordinated cleanup with the PDF generation pipeline.
