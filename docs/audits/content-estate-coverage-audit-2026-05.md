# Content Estate Coverage Audit — May 2026

**Audit date:** 2026-05-17  
**Auditor:** Claude Sonnet 4.6  
**Scope:** All content/document estates in the repository  
**Verification:** `pnpm contentlayer2 build` (390 valid, 0 invalid) · `pnpm library:audit` (452 items, PASS) · `pnpm typecheck` (clean)

---

## 1. Count Summary

| Source | Count | Notes |
|---|---|---|
| Raw `.mdx` files in `content/` | 599 | Across all subdirectories |
| Raw `.md` files in `content/` | 2 | Total content: 601 |
| Contentlayer generated documents | **390** | 0 invalid |
| Library index items (total, published) | **452** | 417 public · 18 member · 17 restricted |
| PDF binary assets (`public/assets/downloads/`) | 84 | 83 canonical + 1 generated |
| PDF registry entries (`lib/pdf/pdf-registry.generated.ts`) | 83 | 76 tool · 6 strategic · 1 assessment |
| Premium content registry (`lib/premium/content-registry.ts`) | 4 | 3 GMI editions + 1 flagship editorial |
| LinkedIn outbound queue (`content/outbound/linkedin/`) | 15 ready + 1 script | Admin-only |
| LinkedIn posted archive (`content/outbound/linkedin/posted/`) | 5 | Admin-only |
| EPUBs (`public/epubs/`) | 4 + 1 manifest | Not indexed anywhere |
| Public downloads (`public/downloads/`) | 29 | PDFs and other assets |

### Why Contentlayer shows 390 and Library shows 452

The library index aggregates from **three sources**, not one:

1. **Contentlayer documents** — The library calls content/server facade functions for 15 of Contentlayer's 17 types. Intelligence (13 docs) and Dispatch (1 doc) have no corresponding `getAll*` export in `lib/content/server.ts` and are therefore unreachable from the library. Of the 376 reachable Contentlayer docs, ~365 pass the `published` filter.
2. **PDF registry** — `lib/pdf/pdf-registry.generated.ts` contributes 83 entries, mapped to `downloads_resources` section.
3. **Premium content registry** — `lib/premium/content-registry.ts` contributes 4 items, mapped to `intelligence_briefs` section.

**Reconciliation:** ~365 (Contentlayer published) + 83 (PDF registry) + 4 (premium) = **452**

---

## 2. Contentlayer Document Types

| Contentlayer Type | File Pattern | Raw Files | Generated Docs | Content Path |
|---|---|---|---|---|
| Post | `blog/**` | 25 | 26 | `content/blog/` |
| Short | `shorts/**` | 96 | 97 | `content/shorts/` |
| Brief | `briefs/**` | 82 | 84 | `content/briefs/` |
| Lexicon | `lexicon/**` | 64 | 64 | `content/lexicon/` |
| Download | `downloads/**` | 33 (root only) | 34 | `content/downloads/` |
| Resource | `resources/**` | 29 | 28 | `content/resources/` |
| Canon | `canon/**` | 15 | 16 | `content/canon/` |
| Book | `books/**` | 5 | 6 | `content/books/` |
| Playbook | `playbooks/**` | 8 | 9 | `content/playbooks/` |
| Intelligence | `intelligence/**` | 12 | 13 | `content/intelligence/` |
| VaultBrief | `vault/briefs/**` | 12 | 13 | `content/vault/briefs/` |
| Print | `prints/**` | 6 | 7 | `content/prints/` |
| Event | `events/**` | 2 | 3 | `content/events/` |
| Strategy | `strategy/**` | 3 | 3 | `content/strategy/` |
| Vault | `vault/*.{md,mdx}` | ~2 | 2 | `content/vault/` (top-level) |
| Dispatch | `dispatches/**` | 1 | 1 | *(no content/dispatches dir)* |
| **Total** | | | **390** | |

**Note on Dispatch:** One dispatch document is generated but `content/dispatches/` does not exist as a content directory — this document originates elsewhere or from an in-memory source. The Dispatch type has no corresponding `getAllDispatches()` in `lib/content/server.ts`.

---

## 3. Full Estate Coverage Table

| Estate / Folder | Raw Files | CL Type | In CL? | In /library? | Public? | Admin-only? | Should Index? | Reason | Missing Metadata | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|---|
| `content/blog/` | 25 | Post | ✅ Yes | ✅ Yes (as `essay`) | ✅ Yes | No | Yes | Website essays; primary public content | Some missing SEO fields | No action |
| `content/shorts/` | 96 | Short | ✅ Yes | ✅ Yes (as `short`) | ✅ Yes | No | Yes | Short-form field notes; high volume | Consistent — good | No action |
| `content/briefs/` | 82 | Brief | ✅ Yes | ✅ Yes (as `brief`) | Mostly | No | Yes | Intelligence briefs; mixed access tiers | Some missing `audience` | No action |
| `content/lexicon/` | 64 | Lexicon | ✅ Yes | ✅ Yes (as `lexicon`) | ✅ Yes | No | Yes | Governing doctrine; canonical definitions | All have `title` (required) | No action |
| `content/canon/` | 15 | Canon | ✅ Yes | ✅ Yes (as `canon`) | ✅ Yes | No | Yes | Governing worldview; institutional doctrine | Good coverage | No action |
| `content/books/` | 5 | Book | ✅ Yes | ✅ Yes (as `book`) | ✅ Yes | No | Yes | Published volumes and manuscripts | Good coverage | No action |
| `content/downloads/` (root, 33) | 33 | Download | ✅ Yes | ✅ Yes (as `download`) | Mostly | No | Yes | Downloadable assets with MDX frontmatter | Some auto-generated with thin metadata | Review metadata quality |
| `content/downloads/linked-briefs/` | 76 | None | ❌ Excluded | ❌ No | No | No | No | Machine-generated companion MDX; excluded by `downloads/linked-*/**` glob | N/A — intentional | No action; exclusion correct |
| `content/downloads/linked-shorts/` | 82 | None | ❌ Excluded | ❌ No | No | No | No | Machine-generated companion MDX; excluded | N/A — intentional | No action; exclusion correct |
| `content/downloads/linked-intel/` | 2 | None | ❌ Excluded | ❌ No | No | No | No | Machine-generated intel companion MDX; excluded | N/A — intentional | No action; exclusion correct |
| `content/intelligence/` | 12 | Intelligence | ✅ Yes | ⚠️ **No** | Mixed | No | **Yes — gap** | In CL but no `getAllIntelligence()` in server facade; library-index.ts does not call it | Missing from library index | Add `getAllIntelligence` to server facade; call it in `buildLibraryIndex()` |
| `content/playbooks/` | 8 | Playbook | ✅ Yes | ✅ Yes (as `playbook`) | Mixed | No | Yes | Execution playbooks; mixed access | Generally complete | No action |
| `content/resources/` | 29 | Resource | ✅ Yes | ✅ Yes (as `resource` or `framework`) | ✅ Yes | No | Yes | Strategic frameworks and resources | `resources/strategic-frameworks/` maps to `framework` type | No action |
| `content/prints/` | 6 | Print | ✅ Yes | ✅ Yes (as `print`) | ✅ Yes | No | Yes | Print-optimised PDFs with page routes | Good | No action |
| `content/strategy/` | 3 | Strategy | ✅ Yes | ✅ Yes (as `strategy`) | ✅ Yes | No | Yes | Strategic instruments | Good | No action |
| `content/events/` | 2 | Event | ✅ Yes | ✅ Yes (as `event`) | ✅ Yes | No | Yes | Events and briefings | Good | No action |
| `content/vault/briefs/` | 12 | VaultBrief | ✅ Yes | ✅ Yes (as `vault`) | ❌ Restricted | No | Yes — restricted | Controlled member-access briefs | `accessLevel: restricted` set correctly | No action |
| `content/vault/` (top-level) | ~2 | Vault | ✅ Yes | ✅ Yes (as `vault`) | ❌ Restricted | No | Yes — restricted | Top-level vault index entries | Good | No action |
| `content/vault/indices/` | 1 | **None** | ⚠️ **Gap** | ⚠️ No | — | No | Assess | `vault/indices/rise-decay-index.mdx` not matched by `vault/*.mdx` (top-level only) or `vault/briefs/**` | — | Extend Vault pattern to `vault/**/*.{md,mdx}` or add VaultIndex type |
| `content/toolkits/` | 19 | **None** | ❌ **Not included** | ❌ No | Mixed | No | **Yes — gap** | Toolkits not in `contentDirInclude`; `inferTypeFromPath` knows about `toolkits/` but library never loads them; tier: enterprise/paid | No title/date verified | Add `toolkits/` to `contentDirInclude`; add `Toolkit` document type; add `getAllToolkits()` to server facade and library index |
| `content/evidence/` | 8 | **None** | ❌ **Not included** | ❌ No | ❌ Restricted | No | **Assess** | Evidence dossiers; classified anonymised case files; not in `contentDirInclude`; appropriate as library-restricted items | classification present; may need `accessLevel` | Add `evidence/` to `contentDirInclude` with an Evidence type (or reuse Brief); add to library as `evidence` type |
| `content/outbound/linkedin/` | 15 + 1 script | **None** | ❌ No | ❌ No | ❌ No | ✅ Yes | **No** | Admin publishing queue; LinkedIn-specific format and frontmatter; not website content | N/A | No action; exclusion correct and intentional |
| `content/outbound/linkedin/posted/` | 5 | **None** | ❌ No | ❌ No | ❌ No | ✅ Yes | No | Posted archive; admin-only state tracking | postedAt/linkedinPostUrl in frontmatter | No action; posted archive is operational record |
| `content/artifacts/` | 2 | **None** | ❌ No | ❌ No | ❌ Restricted | No | **Assess** | Premium intelligence surface pages (GMI Q1 2026); serve as companion pages to premium PDF products; already have surface pages in `content/intelligence/` | — | These MDX files appear to duplicate the intelligence surface. Confirm whether a `/artifacts/[slug]` route exists or if they should be folded into `content/intelligence/`. |
| `content/_partials/` | 1 | None | ❌ Excluded | ❌ No | No | No | No | `authoring-rules.txt`; excluded by `_*.{mdx,md}` glob | N/A | No action |
| `public/assets/downloads/` | 84 PDFs | None | ❌ No | Via PDF registry | ✅ Yes (mostly) | No | Yes (metadata only) | Binary PDF assets; indexed via `lib/pdf/pdf-registry.generated.ts`; never as CL documents | Registry has thin auto-generated metadata | Enrich PDF registry metadata (titles, categories) |
| `public/epubs/` | 4 EPUBs | None | ❌ No | ❌ **No** | ✅ Yes | No | **Yes — gap** | 4d-surrender-framework-worksheet, surrender-decision-matrix, ultimate-purpose-of-man-editorial, weekly-surrender-audit-template; no registry entry for any | Not in any registry | Add EPUBs to PDF registry or create a separate EPUB registry; link from relevant download/resource pages |
| `public/downloads/` | 29 files | None | ❌ No | Partially | ✅ Yes (mostly) | No | Partially | Mixed PDFs and assets served directly; some may overlap with `public/assets/downloads/`; not fully audited | — | Cross-reference with PDF registry to identify unregistered files |
| `reports/` | 10 files | None | ❌ No | ❌ No | ❌ No | ✅ Yes | No | Generated JSON/MD artefacts from PDF governance tooling; operational records | N/A | No action; correctly excluded |
| `lib/pdf/pdf-registry.generated.ts` | 83 entries | None (code) | ❌ No | ✅ Yes (via library) | ✅ Yes | No | Yes — already indexed | Auto-generated; maps binary PDFs to library items | Thin metadata: titles are auto-generated from filenames; types all `tool` or `strategic` | Manual metadata enrichment needed; types should reflect actual document purpose |
| `lib/premium/content-registry.ts` | 4 items | None (code) | ❌ No | ✅ Yes (via library) | Mixed | No | Yes — already indexed | Hardcoded registry for GMI report editions and flagship editorial; 2 restricted (high confidential), 2 public | Good structure | No action |

---

## 4. Specific Questions Answered

### Q1. Are outbound LinkedIn posts intentionally excluded from Contentlayer?

**Yes, intentionally.** `content/outbound/` is not in `contentDirInclude` and there is no Contentlayer type defined for LinkedIn posts. These files use LinkedIn-specific frontmatter (`platform`, `channel`, `pillar`, `audience`, `charCount`) not applicable to website content. This is correct.

### Q2. Should outbound LinkedIn posts appear in /library?

**No.** LinkedIn posts are an admin publishing queue, not public intellectual content. The posting workflow is managed via `pages/api/admin/outbound/linkedin/publish.ts`. There is no public archive strategy for these posts, and exposing them in `/library` would be architecturally incoherent — they are distribution artefacts, not source content. If a public LinkedIn post archive is ever desired, it should be a separate, intentionally designed surface (e.g., `/library/outbound` with explicit access controls), not derived from the admin queue.

### Q3. Are any public essays/resources/books/briefs missing from both Contentlayer and Library?

**Three categories are missing entirely:**

1. **Toolkits** (`content/toolkits/`, 19 files, 7 top-level + 12 in subdirectories): Not in `contentDirInclude`, not in the library index. These are enterprise/paid-tier documents with rich frontmatter. `inferTypeFromPath()` in the library already knows about `toolkits/` paths — the loading pipeline just isn't wired up.

2. **Evidence dossiers** (`content/evidence/`, 8 files): Not in `contentDirInclude`. These are classified anonymised case files (`classification: ANONYMISED + MODELLED`) that would sit in the `intelligence_briefs` section. They are appropriate as restricted library items.

3. **Intelligence documents** (`content/intelligence/`, 12 files): _In_ Contentlayer (13 generated docs) but _not_ in the library index — `lib/content/server.ts` does not export `getAllIntelligence()`, and `buildLibraryIndex()` does not call it. This is the most immediately actionable gap: Intelligence is live Contentlayer content with no library path.

### Q4. Are toolkits/evidence/frameworks represented correctly, or only through PDFs?

**Frameworks: partially.** The `content/resources/strategic-frameworks/` directory (9 files) _is_ indexed via the Resource type, mapped to `framework` in the library. However, `content/toolkits/` (19 files) is completely unindexed.

**Evidence: not represented at all.** The 8 evidence dossiers in `content/evidence/` are neither in Contentlayer nor in the library index.

**Toolkits (as PDFs): partially.** Some toolkit-like PDFs exist in the PDF registry (type `tool`) but these are binary downloads, not the rich MDX toolkit content in `content/toolkits/`.

### Q5. Are generated PDFs represented safely as metadata only?

**Yes.** The PDF registry (`lib/pdf/pdf-registry.generated.ts`) contains only metadata: `id`, `title`, `type`, `tier`, `outputPath`, `fileSizeBytes`, `md5`, etc. No body content is stored. Binary PDFs are in `public/assets/downloads/` and served directly. The library `pnpm library:audit` data integrity check confirms: "No body/content exposed."

**Concern:** PDF registry metadata quality is thin. Titles are auto-generated from filenames (`"Audit Of Ease"` from `audit-of-ease.pdf`), categories are filename-derived (`"audit-of-easepdf"`), and all 83 entries are typed as either `tool` or `strategic`. Richer metadata would improve library discoverability.

### Q6. Are vault/restricted materials protected from body/content leakage?

**Yes, confirmed.** The library:audit data integrity check passes: "No body/content exposed." The library index shape (`LibraryIndexItem`) does not include `body` or `content` fields. The `buildFromContentlayerDoc()` function extracts only: `id`, `title`, `summary`, `description`, `type`, `section`, `href`, `access`, `format`, `status`, `date`, `tags`, `category`, `featured`, `sourceType`, `sourcePath` — no document body.

**One pattern gap noted:** `content/vault/indices/rise-decay-index.mdx` (a restricted index document) is not matched by either the `Vault` pattern (`vault/*.{md,mdx}` — top-level only) or `VaultBrief` pattern (`vault/briefs/**`). It silently falls through. If it were to be rendered through a catch-all route without access control, the body could be exposed. Recommend extending the Vault pattern or adding an explicit VaultIndex type.

### Q7. Are any active commercial products missing related library/resource entries?

**Two gaps:**

1. **Toolkits as commercial products:** `content/toolkits/` contains enterprise/paid-tier products (Crisis Leadership, Succession Engineering, Board Governance, etc.) with `tier: enterprise` or `tier: paid` frontmatter. These are active products with no library presence, no Contentlayer route, and no discoverability.

2. **EPUBs:** 4 EPUB files in `public/epubs/` — including `ultimate-purpose-of-man-editorial.epub` (the flagship product) — have no registry entry, no download MDX page, and no library item. The premium content registry has an entry for the PDF edition but not the EPUB edition. Users cannot discover or link to EPUBs from the library.

### Q8. Are any retired/inactive assets still visible as live public content?

**Not confirmed from this audit.** No explicit `draft: true` or `status: archived` patterns were surfaced in the affected content directories. The library index filters to `status === "published"` which respects the `draft` frontmatter field. However, the PDF registry has no draft/archived state — all 83 entries are treated as published regardless. Any retired PDF needs to be manually removed from `pdf-registry.generated.ts`.

**One caution:** The `dispatches/` directory is in `contentDirInclude` and has 1 generated document, but no `content/dispatches/` folder exists and the type has no server facade export. The origin of this document is unclear — it may be a ghost from a previous iteration. Recommend locating and either formalising or purging it.

### Q9. Why does Contentlayer show 390 documents while Library index shows 452?

**Reconciliation (confirmed):**

| Source | Items |
|---|---|
| Contentlayer built documents | 390 |
| — Intelligence type (not exported by server facade) | −13 |
| — Dispatch type (not exported by server facade) | −1 |
| — Draft/unpublished filter | −11 (approx.) |
| **Contentlayer items reaching library** | **~365** |
| PDF registry entries | +83 |
| Premium content registry entries | +4 |
| **Library total (published)** | **452** |

The 62-item difference (452 − 390) comes from: PDF registry (+83) and premium registry (+4) minus the Intelligence and Dispatch items lost to the server facade gap (−14) and unpublished items (−11).

### Q10. What is the target canonical count for the public Library?

Based on this audit, the current realistic target once gaps are closed:

| Addition | Estimated Items |
|---|---|
| Current library total | 452 |
| + Intelligence (once wired) | +13 |
| + Toolkits (once added to CL + library) | +19 |
| + Evidence dossiers (once added to CL + library) | +8 |
| + EPUBs (once registered) | +4 |
| **Target canonical public library** | **~496** |

Refined target: **~490–500 indexed items** with all current content estates wired, plus the next content batch. This excludes outbound LinkedIn (intentionally), machine-generated linked downloads (excluded by design), and admin-only operational content.

---

## 5. Priority Action Matrix

| Priority | Action | Files Affected | Effort |
|---|---|---|---|
| **High** | Export `getAllIntelligence()` from `lib/content/server.ts`; call it in `buildLibraryIndex()` | `lib/content/server.ts`, `lib/library/library-index.ts` | Low |
| **High** | Add `toolkits/` to `contentDirInclude` in `contentlayer.config.ts`; define `Toolkit` document type; add `getAllToolkits()` to server facade and library index | `contentlayer.config.ts`, `lib/content/server.ts`, `lib/library/library-index.ts` | Medium |
| **Medium** | Add `evidence/` to `contentDirInclude`; wire into library index as `evidence` type | `contentlayer.config.ts`, `lib/content/server.ts`, `lib/library/library-index.ts` | Medium |
| **Medium** | Fix `vault/indices/` pattern gap: extend Vault pattern to `vault/**/*.{md,mdx}` or add `VaultIndex` type | `contentlayer.config.ts` | Low |
| **Medium** | Register 4 EPUBs in a resource registry (extend PDF registry or create EPUB registry); link from relevant download pages | `lib/pdf/pdf-registry.generated.ts` or new registry | Low |
| **Low** | Enrich PDF registry metadata: replace auto-generated titles, fix categories, correct `type` classifications from `tool` to the actual document type | `lib/pdf/pdf-registry.generated.ts` | High (editorial) |
| **Low** | Investigate `artifacts/` MDX files — confirm whether a `/artifacts/[slug]` route exists or if they should merge into `content/intelligence/` | `content/artifacts/`, page routes | Low |
| **Low** | Locate the Dispatch document source; either formalise the `content/dispatches/` directory and server export or remove the type | `contentlayer.config.ts`, `lib/content/server.ts` | Low |
| **Low** | Audit `public/downloads/` (29 files) against PDF registry (83 entries) to identify unregistered files | `public/downloads/`, `lib/pdf/pdf-registry.generated.ts` | Low |

---

## 6. Verification Gate Results

| Check | Result |
|---|---|
| `pnpm contentlayer2 build` | ✅ 390 valid, 0 invalid |
| `pnpm library:audit` | ✅ PASS — 452 items, no body/content leakage |
| `pnpm typecheck` | ✅ Clean |
| `git diff --check` | ✅ No whitespace violations |

---

*Audit covers the state of the content estate as of commit `865a30c10` (HEAD). No code changes were made in this pass.*
