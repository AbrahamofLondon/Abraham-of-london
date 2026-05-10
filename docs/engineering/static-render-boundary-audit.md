# Static Render Boundary Audit

**Audit date:** 2026-05-10
**Method:** Source inspection of all corridor pages for browser-only API usage, SSR safety, and static render traps

---

## Risky Route Analysis

### `/outcome/check` — `pages/outcome/check.tsx`

| Check | Finding |
|-------|---------|
| Uses `sessionStorage` | ✅ Yes — `loadSpineFromSession()` |
| Uses `localStorage` | ❌ No |
| Calls `window`/`document` | ❌ No |
| Depends on `useEffect` for core data | ✅ Yes — loads spine in `useEffect` |
| Imports MDX renderers | ❌ No |
| Imports Contentlayer hooks | ❌ No |
| Imports server-only policy files | ❌ No |
| Has data-fetching function | ✅ `getServerSideProps` (added in build hygiene fix) |
| Static render classification | **DYNAMIC_REQUIRED** — now correctly guarded |

### `/canon/glossary` — `pages/canon/glossary.tsx`

| Check | Finding |
|-------|---------|
| Uses `sessionStorage` | ❌ No |
| Uses `localStorage` | ❌ No |
| Calls `window`/`document` | ❌ No |
| Depends on `useEffect` for core data | ❌ No — pure static data from `CANON_GLOSSARY` constant |
| Imports MDX renderers | ❌ No |
| Imports Contentlayer hooks | ❌ No |
| Imports server-only policy files | ❌ No |
| Has data-fetching function | ❌ No — pure static page |
| Static render classification | **STATIC_SAFE** — no browser dependencies |

### `/library/[slug]` — `pages/library/[slug].tsx`

| Check | Finding |
|-------|---------|
| Uses `sessionStorage` | ❌ No |
| Uses `localStorage` | ❌ No |
| Calls `window`/`document` | ❌ No |
| Depends on `useEffect` for core data | ❌ No |
| Imports MDX renderers | ✅ Yes — `ServerMDXRenderer` |
| Imports Contentlayer hooks | ✅ Yes — via `ServerMDXRenderer` → `SafeMDXRenderer` → `useMDXComponent` |
| Imports server-only policy files | ❌ No |
| Has data-fetching function | ✅ `getStaticProps` + `getStaticPaths` |
| Static render classification | **STATIC_SAFE** — `useMDXComponent` is a client component, but the page has `getStaticProps` and the MDX code is passed as a prop. The `<Html>` error was a `NODE_ENV` issue, not a static render trap. |

### `/lexicon/[slug]` — `pages/lexicon/[slug].tsx`

| Check | Finding |
|-------|---------|
| Uses `sessionStorage` | ❌ No |
| Uses `localStorage` | ❌ No |
| Calls `window`/`document` | ❌ No |
| Depends on `useEffect` for core data | ❌ No |
| Imports MDX renderers | ✅ Yes — `ServerMDXRenderer` |
| Imports Contentlayer hooks | ✅ Yes — via `ServerMDXRenderer` |
| Imports server-only policy files | ❌ No |
| Has data-fetching function | ✅ `getStaticProps` + `getStaticPaths` |
| Static render classification | **STATIC_SAFE** — same as `/library/[slug]` |

### `/resources/[...slug]` — `pages/resources/[...slug].tsx`

| Check | Finding |
|-------|---------|
| Uses `sessionStorage` | ❌ No |
| Uses `localStorage` | ❌ No |
| Calls `window`/`document` | ❌ No |
| Depends on `useEffect` for core data | ❌ No |
| Imports MDX renderers | ✅ Yes — `ServerMDXRenderer` |
| Imports Contentlayer hooks | ✅ Yes — via `ServerMDXRenderer` |
| Imports server-only policy files | ❌ No |
| Has data-fetching function | ✅ `getStaticProps` + `getStaticPaths` |
| Static render classification | **STATIC_SAFE** — same as above |

### `/diagnostics/executive-reporting/run` — `pages/diagnostics/executive-reporting/run.tsx`

| Check | Finding |
|-------|---------|
| Uses `sessionStorage` | ✅ Yes — reads prior assessment results |
| Uses `localStorage` | ❌ No |
| Calls `window`/`document` | ✅ Yes — `window.scrollTo`, `window.location.search`, `window.sessionStorage`, `window.addEventListener` |
| Depends on `useEffect` for core data | ✅ Yes — loads assessment chain |
| Imports MDX renderers | ❌ No |
| Imports Contentlayer hooks | ❌ No |
| Imports server-only policy files | ❌ No |
| Has data-fetching function | ✅ `getServerSideProps` |
| Static render classification | **SSR_REQUIRED** — correctly uses `getServerSideProps`. All browser APIs are called inside `useEffect` or event handlers, never during SSR. |

### `/strategy-room/index.tsx` — `pages/strategy-room/index.tsx`

| Check | Finding |
|-------|---------|
| Uses `sessionStorage` | ✅ Yes — reads ER result and tension thread |
| Uses `localStorage` | ✅ Yes — form draft persistence |
| Calls `window`/`document` | ✅ Yes — `window.location.search`, `window.setTimeout`, `window.scrollTo` |
| Depends on `useEffect` for core data | ✅ Yes — loads ER result, form drafts |
| Imports MDX renderers | ❌ No |
| Imports Contentlayer hooks | ❌ No |
| Imports server-only policy files | ❌ No |
| Has data-fetching function | ✅ `getServerSideProps` |
| Static render classification | **SSR_REQUIRED** — correctly uses `getServerSideProps`. All browser APIs are guarded inside `useEffect` or event handlers. |

### `/strategy-room/session/[id].tsx` — `pages/strategy-room/session/[id].tsx`

| Check | Finding |
|-------|---------|
| Uses `sessionStorage` | ❌ No |
| Uses `localStorage` | ❌ No |
| Calls `window`/`document` | ✅ Yes — `window.location.search`, `document.querySelector` |
| Depends on `useEffect` for core data | ✅ Yes |
| Imports MDX renderers | ❌ No |
| Imports Contentlayer hooks | ❌ No |
| Imports server-only policy files | ❌ No |
| Has data-fetching function | ✅ `getServerSideProps` |
| Static render classification | **SSR_REQUIRED** — correctly guarded |

---

## Summary

| Route | Classification | Risk |
|-------|---------------|------|
| `/outcome/check` | **DYNAMIC_REQUIRED** | ✅ Fixed |
| `/canon/glossary` | **STATIC_SAFE** | ✅ |
| `/library/[slug]` | **STATIC_SAFE** | ✅ |
| `/lexicon/[slug]` | **STATIC_SAFE** | ✅ |
| `/resources/[...slug]` | **STATIC_SAFE** | ✅ |
| `/diagnostics/executive-reporting/run` | **SSR_REQUIRED** | ✅ |
| `/strategy-room/index.tsx` | **SSR_REQUIRED** | ✅ |
| `/strategy-room/session/[id]` | **SSR_REQUIRED** | ✅ |

**No build traps found.** All pages with browser dependencies use `getServerSideProps`. All static pages are genuinely static.
