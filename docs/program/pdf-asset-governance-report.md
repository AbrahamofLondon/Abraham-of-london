# PDF Asset Governance Report

Generated as part of the download / PDF asset stabilisation pass.

## Canonical Decision

The canonical public binary target for PDF assets is:

```text
/assets/downloads/{slug}.pdf
```

This pass does not delete or move legacy files. Legacy direct-file paths remain compatibility surfaces until their use is proven safe to retire.

Generated namespaces remain valid but explicitly classified:

```text
/assets/downloads/content-downloads/*
/assets/downloads/lib-pdf/*
```

## Registry Summary

Registry output:

```text
reports/pdf-asset-registry.json
```

Totals:

- Public PDFs scanned: 821
- Candidate canonical downloads: 247
- Generated downloads: 198
- Legacy `/downloads` PDFs: 30
- Resource PDFs: 104
- Vault PDFs: 109
- Vault brief PDFs: 96
- Print PDFs: 6
- Lexicon PDFs: 24
- Other PDFs: 7
- Duplicate filename groups: 252
- Assets in duplicate groups: 645

Canonicality status:

- candidate_canonical: 247
- generated: 198
- legacy_compatibility: 30
- specialty_route_asset: 339
- other: 7

## Hardcoded PDF Verification Summary

Verification output:

```text
reports/pdf-link-verification.json
```

Final verifier result:

- Hardcoded PDF references scanned: 662
- Unique public-style PDF URLs: 489
- Real missing public PDF references: 0
- OK references: 652
- Comment/example references: 3
- Placeholder references: 4
- Private registry references: 3

The verifier exits non-zero only for real `missing` references. It does not fail on comments, examples, explicit placeholders, or private storage registry references.

Targeted fixes made during this pass:

- Replaced stale `surrender-not-submission` frontmatter resource URLs with existing canonical PDF assets.
- Replaced misleading raw PDF text in `fathering-principles` with route-page resource links.
- Replaced stale `legacy-architecture-canvas-a4-premium.pdf` with existing `legacy-architecture-canvas.pdf`.
- Replaced missing legacy canvas preview PDF URL with an existing PDF asset URL.
- Removed a missing `sovereignty-index-v1.pdf` artifact reference where no matching public PDF exists.

## Duplicate Intelligence Summary

Duplicate report outputs:

```text
reports/pdf-duplicate-report.json
reports/pdf-duplicate-report.md
```

Duplicate groups:

- Total duplicate filename groups: 252
- Identical duplicate groups: 115
- Divergent duplicate groups: 32
- Generated/static conflict groups: 105
- Safe redirect candidate groups: 115
- Manual-resolution groups: 137

Top manual-review clusters:

- `extremism-shield.pdf` — 5 files, 4 hashes, divergent duplicate
- `brotherhood-starter-kit.pdf` — 4 files, 3 hashes, generated/static conflict
- `decision-log-template.pdf` — 4 files, 3 hashes, generated/static conflict
- `entrepreneur-operating-pack.pdf` — 4 files, 3 hashes, generated/static conflict
- `leadership-playbook.pdf` — 4 files, 3 hashes, generated/static conflict
- `mentorship-starter-kit.pdf` — 4 files, 3 hashes, generated/static conflict
- `standards-brief.pdf` — 4 files, 3 hashes, generated/static conflict
- `strategic-autonomy-002.pdf` — 4 files, 3 hashes, generated/static conflict
- `weekly-operating-rhythm.pdf` — 4 files, 3 hashes, generated/static conflict

Manual-resolution groups must not be deleted or redirected automatically.

## Redirect Integration Summary

Redirect candidate outputs:

```text
reports/pdf-redirect-candidates.json
reports/pdf-redirect-candidates.toml
```

Integrated into `netlify.toml`:

- Safe PDF alias redirects added: 109
- Redirect status: 301
- Redirect source class: byte-identical legacy direct-file aliases only
- Redirect target class: canonical `/assets/downloads/{slug}.pdf`

The redirect block is marked:

```text
# PDF canonical alias redirects
# Generated from duplicate report
# Only byte-identical legacy direct-file aliases included
...
# End PDF canonical alias redirects
```

## Safe Cleanup Sequence

1. Keep all physical PDFs in place while redirects deploy and settle.
2. Run `pnpm pdf:audit` in CI or before release changes.
3. Review manual-resolution duplicate groups one cluster at a time.
4. For each divergent group, choose the correct canonical binary by content, not filename.
5. Update content/frontmatter/UI references to route pages or canonical PDF URLs as appropriate.
6. Add redirects only after byte-identical or manually verified equivalence is proven.
7. Remove physical legacy files only in a later deletion-specific pass after redirects and references are verified in production.

## Operator Decision State

The system can now answer:

- what PDF assets exist
- which paths are candidate canonical binaries
- which paths are generated outputs
- which hardcoded links resolve
- which duplicates are byte-identical
- which duplicates require manual judgement
- which legacy aliases are safe redirect candidates

No asset deletion was performed in this pass.
