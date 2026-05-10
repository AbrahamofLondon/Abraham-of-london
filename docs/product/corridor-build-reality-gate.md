# Corridor Build Reality Gate

**Audit date:** 2026-05-10
**Project root:** `C:\aol-check-visual`
**Framework:** Next.js 16.2.3 (Turbopack) — Pages Router + App Router hybrid

---

## 1. TypeScript Result

| Check | Result |
|-------|--------|
| `npx tsc --noEmit --pretty false` | ✅ PASS — 0 errors |

---

## 2. NODE_ENV Value

| Variable | Value | Classification |
|----------|-------|----------------|
| `$env:NODE_ENV` | `development` | **LOCAL_ENVIRONMENT_TRAP** |

**Impact:** When `NODE_ENV=development` (non-standard), Next.js 16.2.3 Turbopack produces `<Html>` prerender errors on MDX content pages. This is a **Next.js 16 Turbopack bug** triggered by non-production environment values. The build passes cleanly with `NODE_ENV=production`.

**Recommendation:** The Netlify deploy pipeline sets `NODE_ENV=production` automatically. This is not a production risk. Documented for local dev awareness.

---

## 3. Production Build Result

| Metric | Value |
|--------|-------|
| `NODE_ENV=production npx next build` | ✅ PASS |
| Compilation | 2.8 min |
| TypeScript | 4.8 min (0 errors) |
| Static pages generated | **358/358** |
| Static generation time | 32.6s |
| Turbopack warnings | 6 (all NON_BLOCKING) |
| Build exit code | 0 |

---

## 4. Static Generation Result

All 358 pages generated successfully. No prerender errors, no route failures.

---

## 5. Failed Routes

**None.** All routes built and generated under `NODE_ENV=production`.

### Previously failing routes (now resolved)

| Route | Previous Error | Fix | Status |
|-------|---------------|-----|--------|
| `/outcome/check` | `<Html>` prerender error | Added `getServerSideProps` | ✅ Fixed |
| `/canon/glossary` | `<Html>` prerender error (cascade) | Resolved by `NODE_ENV=production` | ✅ Passes |
| `/library/[slug]` | `<Html>` prerender error (cascade) | Resolved by `NODE_ENV=production` | ✅ Passes |
| `/lexicon/[slug]` | `<Html>` prerender error (cascade) | Resolved by `NODE_ENV=production` | ✅ Passes |
| `/resources/[...slug]` | `<Html>` prerender error (cascade) | Resolved by `NODE_ENV=production` | ✅ Passes |

---

## 6. Warning Classification

| Warning | Count | Classification |
|---------|-------|----------------|
| `next.config.mjs` in NFT list (file tracing) | 6 | **NON_BLOCKING** — `withContentlayer` integration artifact |
| Large page data (>128 kB threshold) | 3 routes | **SEPARATE_PERFORMANCE_MIGRATION** — `/books/[slug]` (839 kB), `/vault/briefs/[slug]` (777 kB), `/blog/[...slug]` (138 kB) |
| Empty string `src` attribute | 3 occurrences | **NON_BLOCKING** — image assets with conditional rendering |
| `<title>` children as Array (not string) | Multiple | **NON_BLOCKING** — MDX content interpolation pattern |
| Custom Cache-Control headers | 1 | **FALSE_POSITIVE** — intentional CDN config in `next.config.mjs` |

---

## 7. Corridor Demo Readiness

**✅ Build does not block corridor demo.**

All corridor routes compile, generate, and are reachable. The `NODE_ENV=development` trap only affects local dev — the Netlify deploy pipeline uses `NODE_ENV=production`.

---

## 8. Production Deploy Readiness

**✅ Build does not block production deploy.**

| Check | Status |
|-------|--------|
| TypeScript errors | 0 |
| Build failures | 0 |
| Prerender errors | 0 |
| Guard scripts (infrastructure, DTO, intelligence) | All PASS |
| Static generation | 358/358 complete |

---

## Verification Checklist

| Check | Status |
|-------|--------|
| [x] `/outcome/check` has `getServerSideProps` | ✅ Confirmed |
| [x] `/outcome/check` is not statically prerendered | ✅ Dynamic (ƒ) |
| [x] MDX pages build under `NODE_ENV=production` | ✅ All pass |
| [x] `/canon/glossary` builds | ✅ Static (○) |
| [x] `/library/[slug]` builds | ✅ SSG (●) |
| [x] `/lexicon/[slug]` builds | ✅ SSG (●) |
| [x] `/resources/[...slug]` builds | ✅ SSG (●) |
| [x] Turbopack broad file warnings fixed/suppressed/classified | ✅ 3 fixed with `turbopackIgnore`, 6 NFT classified NON_BLOCKING |
| [x] Large page-data warnings documented separately | ✅ 3 routes documented above |
