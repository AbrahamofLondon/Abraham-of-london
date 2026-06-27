# Book Reader Rendering Fix Report

**Date:** 2026-06-27
**Author:** Automated diagnostic

---

## Git Reality

| Check | Result |
|-------|--------|
| `4e203ddca` on `origin/main` | ✅ YES |
| `344ae659b` on `origin/main` | ✅ YES |
| `a7d7d9fbb` on `origin/main` | ✅ YES |
| Did `344ae659b` revert shared renderer changes? | **No** — `DirectorateOversight.tsx`, `ClientOnlyMDXRenderer.tsx`, `TableOfContents.tsx` are identical in both commits |
| Working tree clean? | ✅ YES |

### Commit Chain (all on `origin/main`)

```
a7d7d9fbb (HEAD -> main, origin/main) repair book reader mdx rendering and toc scoping
344ae659b fix book mdx rendering and access fallbacks
4e203ddca fix book reader rendering and gated access fallback
e9600ee34 Fix MDX parse defect: convert formula-style bold line to plain prose
224f290a0 Rewrite: The Architecture of Ascension — expanded to production-grade doctrinal asset
```

---

## Root Cause of Remaining Live Failure

**Contentlayer on Windows** wraps compiled MDX output in a CommonJS module wrapper that includes `__esModule` and `Object.defineProperty(exports...)` patterns. The detection logic in both `getRenderableBody()` (server-side, `lib/content/render-body.ts`) and `ClientOnlyMDXRenderer` (client-side, `components/mdx/ClientOnlyMDXRenderer.tsx`) treated these patterns as "leaked module code" — causing compiled MDX to be rejected.

### For `/books/architecture-of-ascension` (public):

Before fix:
- `body.code` (785KB compiled MDX with `jsxDEV`, `_jsx`, `__esModule`) was classified as "suspicious" because `looksLikeLeakedModuleCode` matched `__esModule` and `Object.defineProperty`
- Fell through to `body.raw` (33KB raw MDX source)
- `transformRawMdxToMarkdownLike` stripped JSX components (Verse, Rule, Note, Link, DocumentFooter) and produced degraded markdown
- The markdown fallback rendered without custom components

After fix:
- `body.code` is classified as "compiled" because `looksLikeCompiledMdx` is checked **before** `looksLikeLeakedModuleCode`
- Passed to `useMDXComponent` which evaluates the compiled code with all custom components

### For `/books/the-builders-catechism` (gated):

Before fix:
- Same detection bug in client-side `ClientOnlyMDXRenderer`
- API route returned compiled code, but renderer classified it as "suspicious" → showed "Content Warning"

After fix:
- Same priority fix — compiled markers take precedence

---

## Files Changed (all 3 commits)

| File | Commit | Change |
|------|--------|--------|
| `components/content/DirectorateOversight.tsx` | `4e203ddca` | Removed `dynamic()` wrapper for ClientOnlyMDXRenderer (static import); added `readerContentRef` with `data-reader-content="true"`; passed `contentRef` to `SafeTableOfContents` |
| `components/mdx/ClientOnlyMDXRenderer.tsx` | `4e203ddca` | Added `Note`, `Verse`, `Quote`, `DocumentFooter`, `Divider`, `Rule` handling to `transformRawMdxToMarkdownLike`; added `Link` preservation |
| `components/mdx/ClientOnlyMDXRenderer.tsx` | `a7d7d9fbb` | **Critical fix**: Changed detection priority — `isCompiled` checked before `isSuspicious` |
| `components/mdx/TableOfContents.tsx` | `4e203ddca` | Added `[data-reader-content='true']` and `.smdx-content` selectors; removed `document.querySelector("main")` fallback; added `h1` to heading collection; sets `el.id` |
| `lib/content/render-body.ts` | `a7d7d9fbb` | **Critical fix**: Removed `!looksLikeLeakedModuleCode` guard from compiled MDX detection |
| `pages/books/[slug].tsx` | `4e203ddca` | Added `readerFacingUnlockError` mapping; added `lockMessage` passing |
| `pages/books/[slug].tsx` | `344ae659b` | Improved error messages; passed `doc.lockMessage` to `AccessGate` and `DirectorateOversight` |
| `content/books/the-builders-catechism.mdx` | `344ae659b` | Updated `lockMessage` to match canonical "Professional" display tier |

---

## Current State Verification

### Compiled MDX Detection (confirmed against actual contentlayer output)

| File | body.code size | Has `jsxDEV` | Has `_jsx` | Has `__esModule` | Classification (with fix) |
|------|---------------|--------------|------------|------------------|--------------------------|
| `architecture-of-ascension.mdx` | 785,988 bytes | ✅ YES | ✅ YES | ✅ YES | **COMPILED** |
| `the-builders-catechism.mdx` | (gated) | ✅ YES | ✅ YES | ✅ YES | **COMPILED** |
| `the-architecture-of-human-purpose.mdx` | 25,551 bytes | ✅ YES | ✅ YES | ✅ YES | **COMPILED** |

### TOC Scoping

The `SafeTableOfContents` component now uses this priority for root selection:
1. `contentRef?.current` (passed from DirectorateOversight)
2. `[data-reader-content='true']` (set on the MDX content wrapper div)
3. `.smdx-content` (markdown fallback)
4. `.aol-mdx-content`
5. `.prose-hardened`

It **no longer** falls back to `document.querySelector("main")` which was the source of global nav leakage.

### Access Error Messages

All raw auth codes now map to reader-facing messages:

| Code | Displayed Message |
|------|------------------|
| `CLEARANCE_REQUIRED` | "Sign in to access this volume. Professional or Inner Circle access required." |
| `SESSION_INVALID` | "Your session has expired. Please sign in again to continue reading." |
| `INSUFFICIENT_CLEARANCE` | "Your account does not have access to this volume. Upgrade your access tier to continue." |
| `UNLOCK_FAILED` | "Unable to verify access. Please sign in again or refresh the page." |
| `UNLOCK_NETWORK_FAILURE` | "Unable to verify access. Please check your connection and try again." |
| `UNLOCK_PAYLOAD_MISSING` | "This volume could not be loaded. Please refresh or try again." |
| `BODY_UNAVAILABLE` | "This volume is temporarily unavailable in the reading chamber." |

### Gated Book Lock State

The Builder's Catechism now shows:
- Access label: **Professional** (canonical display name for `inner-circle` tier)
- Lock message: "Professional access required. This canon volume is available inside the professional reading chamber. Join to unlock this volume and the rest of the Canon."
- No raw `SESSION_INVALID` code
- No empty chamber
- Graceful AccessGate with Sign In / View Access Options buttons

---

## Validation Results

| Check | Result |
|-------|--------|
| Contentlayer build | ✅ 838 documents, 0 invalid |
| TypeScript typecheck | ✅ Passed |
| MDX Integrity | ✅ 114 files, no corruption |
| MDX JSX Gate | ✅ 1030 assets, no issues |
| Production build | ✅ Complete |
| Git status | ✅ Clean |

---

## Gated Book Access Fix (Commit `977933994`)

### Root Cause of Stuck Verification

The book page at `pages/books/[slug].tsx` renders "Verifying clearance…" when `needsAuth` is `true` and `useSession()` status is `"loading"`. This is the NextAuth session check. If the session endpoint is slow, unreachable, or the auth provider hangs, this state persists **indefinitely** — the user never transitions to the AccessGate locked state.

### Fix

Added a **5-second timeout** to the session loading state:

```tsx
const [sessionTimeout, setSessionTimeout] = React.useState(false);
React.useEffect(() => {
  if (status === "loading") {
    const timer = setTimeout(() => setSessionTimeout(true), 5000);
    return () => clearTimeout(timer);
  }
}, [status]);
```

The loading condition changed from:
```tsx
if (needsAuth && status === "loading")
```
to:
```tsx
if (needsAuth && status === "loading" && !sessionTimeout)
```

When the timeout fires:
1. `sessionTimeout` becomes `true`
2. The loading condition becomes `false`
3. Falls through to `needsAuth && (!session?.user || !canRead)` which is `true`
4. Renders `AccessGate` with `isAuthenticated={false}` → dignified locked state

### Files Changed

| File | Change |
|------|--------|
| `pages/books/[slug].tsx` | Added 5-second session loading timeout |

### Behaviour Matrix

| Scenario | Before | After |
|----------|--------|-------|
| No valid session, auth fast | "Verifying clearance…" briefly, then AccessGate | Same (no regression) |
| No valid session, auth slow/hanging | **"Verifying clearance…" indefinitely** | "Verifying clearance…" for max 5s, then AccessGate |
| No valid session, auth endpoint missing | **"Verifying clearance…" indefinitely** | "Verifying clearance…" for max 5s, then AccessGate |
| Valid session, eligible | "Verifying clearance…" briefly, then content | Same (no regression) |
| Valid session, not eligible | "Verifying clearance…" briefly, then AccessGate | Same (no regression) |

---

## Verification Status

| Status | Value |
|--------|-------|
| **Local verified** | ✅ YES — production build passes, all checks pass |
| **Pushed** | ✅ YES — `977933994` on `origin/main` |
| **Deployed/live verified** | ⏳ Pending deployment — requires Vercel/Netlify redeploy |

### To verify live after deployment:

1. Visit `https://www.abrahamoflondon.org/books/architecture-of-ascension`
   - Expected: Framework content renders with Verse, Rule, Note, DocumentFooter components
   - Expected: No permanent "Loading…" state
   - Expected: TOC shows "Pillar I" through "Pillar XII", "Rise–Decay Index", etc.
   - Expected: No global nav items (Doctrine, Works, Intelligence, Archive, etc.) in TOC

2. Visit `https://www.abrahamoflondon.org/books/the-builders-catechism` (unauthenticated)
   - Expected: Graceful lock state with "Professional" access label
   - Expected: Lock message from frontmatter
   - Expected: No `SESSION_INVALID` or raw auth codes
   - Expected: No empty reading chamber

3. Visit `https://www.abrahamoflondon.org/books/the-builders-catechism` (authenticated, Professional tier)
   - Expected: Full catechism content with Divider, Callout, Quote components
   - Expected: Q&A sections render correctly
   - Expected: TOC shows "Foundations", "The Person", "The Family", etc.