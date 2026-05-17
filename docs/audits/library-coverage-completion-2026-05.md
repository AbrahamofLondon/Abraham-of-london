# Library Coverage Completion — 2026-05-17

## Executive verdict

The confirmed Library indexing gaps are closed without widening public exposure.

- **Before:** 452 indexed Library records.
- **After:** 497 indexed Library records.
- **Contentlayer now:** 391 valid documents, with the collection landing file remaining outside the Intelligence brief count.
- **Net new Library records:** 45.

The additional 44 records come from metadata-only discovery surfaces rather than raw-body exposure:

| Gap | Added | Treatment |
| --- | ---: | --- |
| Intelligence | 13 | Existing Contentlayer documents now wired through the server facade, plus one new public-facing brief |
| Toolkits | 19 | Metadata-only index records from `content/toolkits/` |
| Evidence | 8 | Metadata-only index records from `content/evidence/` |
| Vault index | 1 | Restricted metadata-only record for `rise-decay-index` |
| EPUBs | 4 | Indexed from the existing EPUB manifest |

The brief expected **13** Intelligence items. The collection now contains:

- `strategic-autonomy-001.mdx` through `strategic-autonomy-012.mdx`
- one new public-facing Intelligence brief, `decision-delay-governance-cost.mdx`
- one separate collection landing file, `index.mdx`

The follow-up reconciliation established the counting doctrine:

- `/intelligence` does **not** require an MDX landing file because it is already served by `pages/intelligence/index.tsx`.
- `index.mdx` remains a collection/landing artefact, not a normal brief.
- The Library now indexes **13 valid Intelligence briefs**. The collection landing file is intentionally excluded from that count.

## Gap status

### 1. Intelligence wiring — closed

`getAllIntelligence()` now exists in the content facade and the Library aggregator consumes it. The 13 valid `content/intelligence/` briefs now appear under **Intelligence & Briefs**.

### 2. Toolkits indexing — closed with metadata-only posture

All 19 toolkit MDX files are now represented under **Frameworks & Playbooks**.

- Top-level toolkit records route to the nearest live `/toolkits/[slug]` surface where available.
- Nested toolkit records also resolve to the nearest safe parent toolkit surface rather than pretending a direct public route exists.
- Access remains tier-aware: public, paid, or restricted according to toolkit metadata.
- No toolkit body content is exposed through `LibraryIndexItem`.

### 3. Evidence indexing — closed with controlled discovery

All 8 evidence files are now indexed as **Evidence** records under **Intelligence & Briefs**.

- The 3 already-public dossiers route to their live `/evidence/[slug]` pages.
- The 5 route-less outcome files remain **restricted metadata records** and point only to the safe `/evidence` overview.
- No dossier body, raw material, or hidden evidence text is exposed through the Library index.

### 4. Vault indices — closed safely

`content/vault/indices/rise-decay-index.mdx` is now represented as a restricted metadata-only Library item.

- It appears in the **Vault** section.
- It routes to `/vault`, not directly to a route that would expose the underlying body.
- This closes discoverability without weakening vault protection.

### 5. EPUB registry — closed

The existing `public/epubs/epub-manifest.json` is now consumed by the Library index.

- 4 EPUBs are indexed.
- `The Ultimate Purpose of Man` is grouped with **Books & Manuscripts**.
- The worksheet/template EPUBs are grouped with **Downloads & Resources**.
- The flagship title is preserved editorially from the manifest rather than inferred from filenames.

### 6. Artifacts investigation — recommendation only

`content/artifacts/` contains 2 files:

1. `global-market-outlook-q1-2026-public.mdx`
2. `global-market-intelligence-report-q1-2026.mdx`

These should **not** be separately indexed now.

- Both overlap existing routed/public product surfaces and entries already represented in `lib/premium/content-registry.ts`.
- Indexing the MDX files independently would create duplicate Library records for the same commercial intelligence family.
- Recommendation: **merge the route/source-of-truth story into the premium registry over time** and keep the current Library representation registry-backed until that consolidation is explicit.

## Final coverage

| Section | Count |
| --- | ---: |
| Essays & Analysis | 121 |
| Books & Manuscripts | 6 |
| Canon & Lexicon | 78 |
| Frameworks & Playbooks | 38 |
| Intelligence & Briefs | 107 |
| Downloads & Resources | 143 |
| Vault | 2 |
| Events | 2 |

| Type / source | Count |
| --- | ---: |
| Intelligence | 13 |
| Toolkit metadata | 19 |
| Evidence metadata | 8 |
| Vault-index metadata | 1 |
| EPUB manifest | 4 |

## Confirmed exclusions

These remain intentionally excluded:

- `content/outbound/linkedin/**`
- generated operational files under `reports/`
- `content/downloads/linked-*` companion MDX
- body/content/bodyCode/raw fields on every Library item
- duplicate `content/artifacts/` indexing while premium-registry-backed product records already exist

## PDF registry metadata quality backlog

No bulk PDF metadata edits were made in this pass. A quick registry scan found:

- **83** PDF registry entries total
- **0** missing descriptions
- **0** missing categories
- **83** entries with no tags

### Ten weakest auto-generated titles / metadata records

| ID | Current title | Main issue |
| --- | --- | --- |
| `audit-of-ease` | Audit Of Ease | No tags; category is filename-derived |
| `canon-builders-rule-of-life` | Canon Builders Rule Of Life | No tags; category is filename-derived |
| `canon-system-constitution` | Canon System Constitution | No tags; category is filename-derived |
| `conviction-vs-coercion` | Conviction Vs Coercion | No tags; category is filename-derived |
| `extremism-shield` | Extremism Shield | No tags; category is filename-derived |
| `frontier-resilience-01` | Frontier Resilience 01 | No tags; title is mechanically generated |
| `frontier-resilience-beyond-survival-mode` | Frontier Resilience Beyond Survival Mode | No tags; category is filename-derived |
| `frontier-resilience-crisis-loops-and-lost-judgment` | Frontier Resilience Crisis Loops And Lost Judgment | No tags; category is filename-derived |
| `frontier-resilience-decision-latency-as-hidden-risk` | Frontier Resilience Decision Latency As Hidden Risk | No tags; category is filename-derived |
| `frontier-resilience-drift-in-the-second-line` | Frontier Resilience Drift In The Second Line | No tags; category is filename-derived |

### Strong candidates for editorial enrichment

- `governance-diagnostic-toolkit`
- `frontier-resilience-decision-latency-as-hidden-risk`
- `frontier-resilience-fragility-of-unowned-decisions`
- `frontier-resilience-when-recovery-needs-governance`
- `institutional-alpha-the-discipline-of-decision-grade-intelligence`
- `institutional-alpha-why-executive-summaries-mislead`
- `sovereign-intelligence-the-governance-cost-of-permanent-exception`

These are commercially or product-significant because they align directly with governed decision-making, executive intelligence, governance diagnosis, or resilience narratives that already appear elsewhere in the product ladder.

## Remaining backlog

1. Decide whether route-less toolkit leaf records deserve future first-class routes or should remain discovery metadata that rolls up to parent toolkit surfaces.
2. Decide whether the five route-less evidence outcome files should receive governed public pages or remain restricted proof metadata only.
3. Consolidate the artifact source-of-truth between `content/artifacts/` and the premium registry to avoid long-term duplication.
4. Editorially enrich PDF tags and malformed filename-derived categories in a separate metadata quality pass.

## Intelligence discrepancy reconciliation

| Question | Finding |
| --- | --- |
| Actual file count under `content/intelligence/` | **14 physical files** |
| Files present | `index.mdx`, `decision-delay-governance-cost.mdx`, and `strategic-autonomy-001.mdx` through `strategic-autonomy-012.mdx` |
| `content/intelligence/index.mdx` present? | **Yes** — maintained as a collection/landing file |
| Was `index.mdx` created in the Library coverage commit? | **No** — it was added in the follow-up editorial completion pass as a collection landing file |
| Does `/intelligence` require it? | **No** — the collection landing route is already implemented in `pages/intelligence/index.tsx` |
| Does Contentlayer count the current `index.mdx` as an Intelligence document? | **No** — it remains collection metadata, not a normal brief |
| Final Contentlayer Intelligence count | **13** |
| Final Library Intelligence count | **13** |

## Verification run

- `pnpm contentlayer2 build`
- `pnpm library:audit`
- `pnpm vitest run lib/library`
- `pnpm typecheck`

The remaining global verification commands were run after implementation as part of the final pass.
