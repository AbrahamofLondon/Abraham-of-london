# Briefs Publication Status Audit

**Status:** OPEN
**Owner:** Abraham of London (content governance)
**Opened:** 2026-06-17
**Trigger:** Content persistence verification identified that 75 of 83 Brief documents are missing `publicationStatus: "published"` in their frontmatter, causing them to be excluded from public routes by the `isPublishedBrief` filter in `pages/briefs/[slug].tsx`.

## Scope

Audit all Brief MDX files in `content/briefs/` that lack `publicationStatus: "published"` and decide which should be made public.

## Current state

| Status | Count | Notes |
|---|---|---|
| `publicationStatus: "published"` | 4 | institutional-alpha briefs — correctly public |
| `publicationStatus: "scheduled"` | 27 | institutional-alpha + sovereign-intelligence — correctly excluded |
| `publicationStatus: undefined` | 52 | frontier-resilience + others — **need decision** |

## Files to audit (52 docs missing publicationStatus)

All in `content/briefs/`:

- `frontier-resilience-*.mdx` (30 files)
- `audit-of-ease.mdx`
- `canon-builders-rule-of-life.mdx`
- `canon-system-constitution.mdx`
- `conviction-vs-coercion.mdx`
- `governance-diagnostic-toolkit.mdx`
- `institutional-integrity-audit.mdx`
- `extremism-shield.mdx`

## Decision per file

For each file, determine:

1. Is this brief ready for public publication?
2. If yes, add `publicationStatus: published` to frontmatter.
3. If no, leave as-is (excluded from public routes).

## Not in scope

- Do not change the `isPublishedBrief` filter logic in code.
- Do not weaken `publicationStatus` governance.
- Do not blanket-publish all 75.

## Related

- `scripts/check-content-persistence.mjs` uses `/briefs/institutional-alpha-why-leaders-stop-hearing-reality` as the known-public brief route for persistence regression testing.
