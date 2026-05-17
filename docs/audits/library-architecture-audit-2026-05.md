
# Library Architecture Audit — 2026-05-17

**Project:** Abraham of London  
**Audit Type:** Read-only architecture investigation  
**Scope:** Library page, content estate, routing, metadata, taxonomy  
**Status:** Complete (no code changes made)

---

## 1. EXACT PROBLEM: Current /library is not systematic

The current `pages/library/index.tsx` builds its groups like this:

```typescript
const groups: Group[] = [
  { title: "Essays",           count: posts.length + shorts.length },  // merges 2 types
  { title: "Briefs",           count: briefs.length },                 // 1 type
  { title: "Playbooks",        count: playbooks.length },              // 1 type
  { title: "Frameworks",       count: frameworkResources.length },     // subset of 1 type
  { title: "Market Intelligence", count: briefs.length + intelligenceArtifacts.length }, // double-counts briefs
  { title: "Books",            count: books.length },                  // 1 type
  { title: "Evidence Materials", count: downloads.length },            // WRONG: counts downloads as evidence
  { title: "Vault",            count: vault.length },                  // 1 type
];
```

**Problems:**
1. **"Evidence Materials"** shows the count of **Downloads** (193) but links to `/evidence` — completely wrong mapping
2. **"Market Intelligence"** double-counts Briefs (82) AND intelligence artifacts — briefs appear in two groups
3. **"Frameworks"** only counts a subset of Resources (those in `strategic-frameworks/` subfolder) — not all 27 resources
4. **"Essays"** merges Posts (25) + Shorts (96) into one count with no distinction
5. **8 content types are completely absent:** Downloads, Lexicon, Prints, Events, Strategy, Toolkits, Evidence, Premium Content
6. **No search, no filtering, no access tier indicators**

---

## 2. COMPLETE CONTENT INVENTORY (Systematic)

### 2.1 Contentlayer-Managed Types (16 types, ~551 files)

These are the authoritative content collections managed through Contentlayer:

| # | Type Name | Content Dir | Files | Route | Access | Current Library Status |
|---|-----------|------------|------:|-------|--------|----------------------|
| 1 | **Post** (essays) | `content/blog/` | 25 | `/blog/[...slug]` | Public | ✅ "Essays" (merged with shorts) |
| 2 | **Short** | `content/shorts/` | 96 | `/shorts/[...slug]` | Public | ✅ "Essays" (merged with posts) |
| 3 | **Book** | `content/books/` | 5 | `/books/[slug]` | Public | ✅ "Books" |
| 4 | **Canon** | `content/canon/` | 15 | `/canon/[slug]` | Public | ✅ (linked separately) |
| 5 | **Brief** | `content/briefs/` | 82 | `/briefs/[slug]` | Public | ✅ "Briefs" + double-counted in "Market Intelligence" |
| 6 | **VaultBrief** | `content/vault/briefs/` | (in vault) | `/vault/briefs/[slug]` | Restricted | ❌ |
| 7 | **Intelligence** | `content/intelligence/` | 12 | `/intelligence/` | Mixed | ✅ "Market Intelligence" |
| 8 | **Dispatch** | `content/dispatches/` | 0 | `/dispatches/` | Public | ❌ (empty — dead config) |
| 9 | **Download** | `content/downloads/` | 193 | `/downloads/[...slug]` | Mixed | ❌ **MISSING** |
| 10 | **Event** | `content/events/` | 2 | `/events/[slug]` | Public | ❌ **MISSING** |
| 11 | **Print** | `content/prints/` | 6 | `/prints/[slug]` | Public | ❌ **MISSING** |
| 12 | **Resource** | `content/resources/` | 27 | `/resources/[...slug]` | Public | ⚠️ Only "strategic-frameworks" subset shown |
| 13 | **Strategy** | `content/strategy/` | 3 | `/strategy/[...slug]` | Public | ❌ **MISSING** |
| 14 | **Lexicon** | `content/lexicon/` | 64 | `/lexicon/[slug]` | Public | ❌ **MISSING** |
| 15 | **Vault** | `content/vault/` | 13 | `/vault/[...slug]` | Restricted | ✅ "Vault" |
| 16 | **Playbook** | `content/playbooks/` | 8 | `/playbooks/[slug]` | Mixed | ✅ "Playbooks" |

### 2.2 Additional Content (NOT Contentlayer-managed)

| Directory | Files | Route | Access | Current Library Status |
|-----------|------:|-------|--------|----------------------|
| `content/evidence/` | 8 | `/evidence/[slug]` | Public | ❌ **MISSING** |
| `content/toolkits/` | 19 | `/toolkits/[slug]` | Public | ❌ **MISSING** |
| `content/artifacts/` | 2 | `/artifacts/[id]` | Mixed | ❌ **MISSING** |
| `content/outbound/` | 21 | No public route | Internal | ❌ (internal only) |

### 2.3 Premium Content Registry (hardcoded in lib/premium/content-registry.ts)

| Item | Type | Access | Current Library Status |
|------|------|--------|----------------------|
| Ultimate Purpose of Man (editorial) | PDF | Public | ❌ **MISSING** |
| Global Market Outlook Q1 2026 | PDF | Public | ❌ **MISSING** |
| Global Market Intelligence Report Q1 2026 | PDF | Restricted | ❌ **MISSING** |
| Global Market Intelligence Board Deck Q1 2026 | PPTX | Restricted | ❌ **MISSING** |

### 2.4 Generated PDF Registry (lib/pdf/pdf-registry.generated.ts)

~64 generated PDF entries (tools, worksheets, frameworks) stored at `/assets/downloads/`. Many are public/free tier. **None are surfaced on /library.**

---

## 3. PROPOSED SYSTEMATIC ORGANISATION

### 3.1 The Library Taxonomy

The library should organise all content into **8 clear sections**, each with a distinct intellectual purpose:

```
LIBRARY
│
├── 📖 I.   ESSAYS & ANALYSIS          (121 items)
│   ├── Essays (25)           — long-form thought, commentary, analysis
│   └── Shorts (96)           — brief reflections, field notes, insights
│   Route: /library/essays → /blog + /shorts
│
├── 📚 II.  BOOKS & MANUSCRIPTS        (5 items)
│   └── Books (5)             — published volumes, long-form works
│   Route: /library/books → /books
│
├── 🏛️  III. CANON & LEXICON           (79 items)
│   ├── Canon (15)            — governing doctrine, principles, worldview
│   └── Lexicon (64)          — decision language, definitions, categories
│   Route: /library/canon → /canon + /lexicon
│
├── ⚙️  IV.  FRAMEWORKS & PLAYBOOKS    (38 items)
│   ├── Playbooks (8)         — execution-grade methodologies
│   ├── Frameworks (from resources) — strategic instruments
│   ├── Strategies (3)        — tactical frameworks
│   └── Toolkits (19)         — practical instrument packs
│   Route: /library/frameworks → /playbooks + /resources + /strategy + /toolkits
│
├── 📊 V.   INTELLIGENCE & BRIEFS      (102 items)
│   ├── Intelligence Reports (12) — market intelligence, strategic analysis
│   ├── Strategic Briefs (82)  — briefs, notes, dispatches
│   └── Evidence Dossiers (8) — proof materials, standards, seals
│   Route: /library/intelligence → /intelligence + /briefs + /evidence
│
├── 📄 VI.  DOWNLOADS & RESOURCES      (290 items)
│   ├── Download Pages (193)  — MDX-described PDFs, worksheets, tools
│   ├── Generated PDFs (~64)  — build-time generated PDF assets
│   ├── Prints (6)            — printable materials
│   └── Resources (27)        — general resource pages
│   Route: /library/downloads → /downloads + /prints + /resources
│
├── 🔒 VII. VAULT (RESTRICTED)         (13+ items)
│   ├── Vault Items (13)      — controlled archive materials
│   └── Vault Briefs          — restricted briefs
│   Route: /library/vault → /vault (auth-gated)
│
└── 📅 VIII.EVENTS                     (2 items)
    └── Events (2)            — past and upcoming events
    Route: /library/events → /events
```

**Total: ~650 items across 8 sections, 16 content types.**

### 3.2 What Changes vs Current /library

| Current Group | Current Count | Current Mapping | Problem | Proposed Group | Correct Count |
|--------------|--------------|----------------|---------|---------------|--------------|
| Essays | 121 | posts + shorts merged | No distinction between long and short form | I. Essays & Analysis | 25 essays + 96 shorts |
| Books | 5 | books | ✅ Correct | II. Books & Manuscripts | 5 |
| *(missing)* | — | — | Canon and Lexicon not grouped together | III. Canon & Lexicon | 15 + 64 |
| Frameworks | ~5 | only strategic-frameworks subset | Under-counted | IV. Frameworks & Playbooks | 8 + 27 + 3 + 19 |
| Playbooks | 8 | playbooks | ✅ Correct | IV. Frameworks & Playbooks | (included above) |
| Briefs | 82 | briefs | ✅ Correct count but wrong section | V. Intelligence & Briefs | 82 |
| Market Intelligence | 94 | briefs + artifacts | **Double-counts briefs** | V. Intelligence & Briefs | 12 intelligence + 82 briefs + 8 evidence |
| Evidence Materials | 193 | **downloads count** | **WRONG — shows download count, links to /evidence** | V. Intelligence & Briefs | 8 evidence (correct) |
| *(missing)* | — | — | Downloads completely absent | VI. Downloads & Resources | 193 + 64 + 6 + 27 |
| Vault | 13 | vault | ✅ Correct | VII. Vault | 13+ |
| *(missing)* | — | — | Events completely absent | VIII. Events | 2 |

---

## 4. PROPOSED ROUTE ARCHITECTURE

### 4.1 New Library Routes

| Route | Purpose | Content Sources |
|-------|---------|----------------|
| `/library` | Master index — all 8 sections with counts, descriptions, and search | All types |
| `/library/essays` | Essays + Shorts listing | `getAllPosts()` + `getAllShorts()` |
| `/library/books` | Books listing | `getAllBooks()` |
| `/library/canon` | Canon + Lexicon listing | `getAllCanons()` + `getAllLexicon()` |
| `/library/frameworks` | Playbooks + Frameworks + Strategies + Toolkits | `getAllPlaybooks()` + `getAllResources()` + `getAllStrategies()` + toolkits |
| `/library/intelligence` | Intelligence + Briefs + Evidence | `getAllIntelligence()` + `getAllBriefs()` + evidence |
| `/library/downloads` | Downloads + Prints + Resources + PDFs | `getAllDownloads()` + `getAllPrints()` + `getAllResources()` + PDF registry |
| `/library/vault` | Restricted archive (auth-gated) | `getAllVault()` |
| `/library/events` | Events listing | `getAllEvents()` |

### 4.2 Existing Routes — Keep and Cross-Link

All existing routes (`/blog`, `/shorts`, `/books`, `/canon`, `/lexicon`, `/briefs`, `/intelligence`, `/evidence`, `/playbooks`, `/downloads`, `/prints`, `/resources`, `/strategy`, `/toolkits`, `/vault`, `/events`) should be **preserved** and cross-linked from the new library sub-routes. No redirects needed — the library is a discovery layer, not a replacement.

---

## 5. FILTERING & SEARCH

### 5.1 Required Filters on Master Index

| Filter | Values | Implementation |
|--------|--------|---------------|
| **Section** | Essays, Books, Canon, Frameworks, Intelligence, Downloads, Vault, Events | Group by section |
| **Access Tier** | Public, Member, Restricted, Paid | From `accessTierSafe` computed field |
| **Format** | Article, PDF, EPUB, Framework, Playbook, Report, Book, Short, Toolkit | From new `format` field |
| **Theme** | Strategy, Governance, Leadership, Theology, Market, Operations, Personal | From `category`/`tags` |
| **Sort** | Newest, Featured, Title A-Z, Most Recent | From `date`, `featured`, `title` |

### 5.2 Search

Add client-side search on the master `/library` page:
- Fields: title, description/excerpt, tags, type name, section name
- No external dependency (Algolia etc.) needed at this stage
- Simple JavaScript filter on the loaded array

---

## 6. METADATA REPAIR PRIORITIES

| Field | Status | Action |
|-------|--------|--------|
| `title` | ✅ Present on most | Ensure none missing |
| `description`/`excerpt` | ⚠️ Often auto-generated | Add manual descriptions |
| `date` | ⚠️ Inconsistent | Ensure all dated |
| `tags` | ⚠️ Many untagged | Add tags for filtering |
| `category` | ⚠️ Inconsistent | Add for theme filtering |
| `coverImage` | ⚠️ Many missing | Add for visual library |
| `format` | ❌ Not defined | **Add to all types** (article, PDF, EPUB, framework, playbook, report, book, short) |
| `featured` | ❌ Rarely set | Set on signature works |

---

## 7. RISK LIST

| Risk | Severity | Detail |
|------|----------|--------|
| Current "Evidence Materials" shows 193 downloads | **High** — Misleading to users | Fix the group mapping |
| Current "Market Intelligence" double-counts briefs | **Medium** — Inflated count | Fix the group mapping |
| Downloads (193 items) completely hidden | **High** — Largest collection invisible | Add to library |
| Lexicon (64 items) completely hidden | **High** — Core reference invisible | Add to library |
| No search | **Medium** — Returning users can't find items | Add client-side search |
| Contentlayer not built in this environment | **Low** — Build needed before testing | Run `pnpm contentlayer2 build` |

---

## 8. IMPLEMENTATION PLAN

### Batch 1 — Fix the Current /library Page (quick wins)
1. Fix "Evidence Materials" to show actual evidence count (8), not downloads (193)
2. Fix "Market Intelligence" to not double-count briefs
3. Add missing types: Downloads (193), Lexicon (64), Prints (6), Events (2), Strategy (3), Toolkits (19), Evidence (8)
4. Add access tier badges to each group
5. Add simple client-side search

### Batch 2 — Add Library Sub-Routes
1. Create `/library/essays` 
2. Create `/library/books`
3. Create `/library/canon`
4. Create `/library/frameworks`
5. Create `/library/intelligence`
6. Create `/library/downloads`
7. Create `/library/vault`
8. Create `/library/events`

### Batch 3 — Metadata & Cross-Linking
1. Add `format` field to all Contentlayer document types
2. Add `featured` flag to signature works
3. Add library cross-links to all content detail pages
4. Add library to main navigation

### Batch 4 — Cleanup
1. Remove `pages/premium/library.tsx` (dead redirect)
2. Remove `content/dispatches/` config if unused
3. Clean up stale migration files

---

## 9. VERIFICATION

```bash
pnpm contentlayer2 build    # Verify document counts
pnpm typecheck              # TypeScript check
pnpm doctrine:audit         # Doctrine audit
pnpm surfaces:audit         # Surface audit
```

---

## 10. SUMMARY

The current `/library` page has **three fundamental problems**:

1. **Wrong mappings** — "Evidence Materials" shows download count (193), "Market Intelligence" double-counts briefs
2. **Incomplete** — 8 of 16 content types are missing entirely (including the largest: 193 Downloads, 64 Lexicon entries)
3. **No search or filtering** — users cannot find specific items

The fix is to organise all content into **8 clear sections** (Essays, Books, Canon/Lexicon, Frameworks/Playbooks, Intelligence/Briefs, Downloads/Resources, Vault, Events) with proper counts, access tier indicators, and client-side search.

*No code changes have been made in this audit.*