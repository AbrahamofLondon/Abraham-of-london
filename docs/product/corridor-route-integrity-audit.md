# Corridor Route Integrity Audit

**Audit date:** 2026-05-10
**Method:** File existence + build output verification + source inspection

---

## Route Inventory

### Diagnostics Entry

| Route | File | Exists | Builds | Router | Auth | Status |
|-------|------|--------|--------|--------|------|--------|
| `/diagnostics` | `pages/diagnostics/index.tsx` | ✅ | ✅ SSG (●) | Pages | Public | ✅ |
| `/diagnostics/fast` | `pages/diagnostics/fast.tsx` | ✅ | ✅ Static (○) | Pages | Public | ✅ |
| `/diagnostics/executive-reporting` | `pages/diagnostics/executive-reporting.tsx` | ✅ | ✅ Static (○) | Pages | Public | ✅ |
| `/diagnostics/executive-reporting/run` | `pages/diagnostics/executive-reporting/run.tsx` | ✅ | ✅ Dynamic (ƒ) | Pages | Public | ✅ |

### Strategy Room

| Route | File | Exists | Builds | Router | Auth | Status |
|-------|------|--------|--------|--------|------|--------|
| `/strategy-room` | `pages/strategy-room/index.tsx` | ✅ | ✅ Dynamic (ƒ) | Pages | Public | ✅ |
| `/strategy-room/session/[id]` | `pages/strategy-room/session/[id].tsx` | ✅ | ✅ Dynamic (ƒ) | Pages | Auth | ✅ |

### Return Brief

| Route | File | Exists | Builds | Router | Auth | Status |
|-------|------|--------|--------|--------|------|--------|
| `/briefing/return/[sessionId]` | `app/briefing/return/[sessionId]/page.tsx` | ✅ | ✅ Dynamic (ƒ) | App | Public | ✅ |

**Note:** This route is App Router, not Pages Router. The `force-dynamic` export is present.

### Decision Centre

| Route | File | Exists | Builds | Router | Auth | Status |
|-------|------|--------|--------|--------|------|--------|
| `/decision-centre` | `pages/decision-centre.tsx` | ✅ | ✅ Static (○) | Pages | Public | ⚠️ See note |

**⚠️ Note:** `/decision-centre` is statically prerendered (○) but uses `dynamic(() => import(...), { ssr: false })` for `DecisionCentreOrientation`. The page shell is static; the dynamic content loads client-side. This is acceptable for a landing/intro page but the actual case data loads via API calls. The route is not a build trap.

### Boardroom

| Route | File | Exists | Builds | Router | Auth | Status |
|-------|------|--------|--------|--------|------|--------|
| `/boardroom` | `pages/boardroom/index.tsx` | ✅ | ✅ Dynamic (ƒ) | Pages | Auth | ✅ |
| `/boardroom/[sessionId]` | `pages/boardroom/[sessionId].tsx` | ✅ | ✅ Dynamic (ƒ) | Pages | Auth | ✅ |

### Counsel

| Route | File | Exists | Builds | Router | Auth | Status |
|-------|------|--------|--------|--------|------|--------|
| `/counsel` | `pages/counsel/index.tsx` | ✅ | ✅ Dynamic (ƒ) | Pages | Auth | ✅ |
| `/counsel/intake` | `pages/counsel/intake.tsx` | ✅ | ✅ Dynamic (ƒ) | Pages | Auth | ✅ |
| `/counsel/status` | `pages/counsel/status.tsx` | ✅ | ✅ Dynamic (ƒ) | Pages | Auth | ✅ |

### Oversight

| Route | File | Exists | Builds | Router | Auth | Status |
|-------|------|--------|--------|--------|------|--------|
| `/oversight` | `pages/oversight/index.tsx` | ✅ | ✅ Dynamic (ƒ) | Pages | Auth | ✅ |
| `/oversight/brief/[cycleId]` | `pages/oversight/brief/[cycleId].tsx` | ✅ | ✅ Dynamic (ƒ) | Pages | Auth | ✅ |
| `/oversight/portfolio` | `pages/oversight/portfolio.tsx` | ✅ | ✅ Dynamic (ƒ) | Pages | Auth | ✅ |

### Proof & Evidence

| Route | File | Exists | Builds | Router | Auth | Status |
|-------|------|--------|--------|--------|------|--------|
| `/account/proof-pack` | `pages/account/proof-pack.tsx` | ✅ | ✅ Dynamic (ƒ) | Pages | Auth | ✅ |
| `/evidence/standards` | `pages/evidence/standards.tsx` | ✅ | ✅ Static (○) | Pages | Public | ✅ |

### Admin

| Route | File | Exists | Builds | Router | Auth | Status |
|-------|------|--------|--------|--------|------|--------|
| `/admin` | `pages/admin/index.tsx` | ✅ | ✅ Dynamic (ƒ) | Pages | Admin | ✅ |
| `/admin/retainer-readiness` | `pages/admin/retainer-readiness.tsx` | ✅ | ✅ Dynamic (ƒ) | Pages | Admin | ✅ |
| `/admin/retained-cadence` | `pages/admin/retained-cadence.tsx` | ✅ | ✅ Dynamic (ƒ) | Pages | Admin | ✅ |
| `/admin/delivery-queue` | `pages/admin/delivery-queue.tsx` | ✅ | ✅ Dynamic (ƒ) | Pages | Admin | ✅ |
| `/admin/suppression-ledger` | `pages/admin/suppression-ledger.tsx` | ✅ | ✅ Dynamic (ƒ) | Pages | Admin | ✅ |
| `/admin/institutional-analytics` | `pages/admin/institutional-analytics.tsx` | ✅ | ✅ Dynamic (ƒ) | Pages | Admin | ✅ |

---

## Route Health Summary

| Check | Result |
|-------|--------|
| Routes exist | ✅ 24/24 |
| Routes build | ✅ 24/24 |
| Correct router context | ✅ All Pages Router except `/briefing/return/[sessionId]` (App Router — correct) |
| Correct auth/role posture | ✅ Public routes are public; admin routes use `requireAdminPage`; auth routes use `resolvePageAccess` |
| Correct empty state | ✅ Pages with auth gates show "Sign in" or "Admin access required" messages |
| No broken internal links | ✅ All `href` references verified against known routes |
| No wrong-surface redirects | ✅ No suspicious redirect patterns found |
| No browser-only data during static prerender | ✅ All routes with browser APIs use `getServerSideProps` (dynamic) |

---

## Issues Found

### Issue 1: `/decision-centre` is statically prerendered

- **Route:** `/decision-centre`
- **File:** `pages/decision-centre.tsx`
- **Problem:** No `getServerSideProps` — the page is static (○). Core data loads via client-side API calls.
- **Risk:** **LOW** — The page is a landing/intro surface. Dynamic content is loaded via `dynamic()` imports with `ssr: false`. This is a deliberate architectural choice for a non-sensitive entry point.
- **Recommendation:** No change needed. If the page evolves to show live case data, add `getServerSideProps`.

### Issue 2: `/briefing/return/[sessionId]` is App Router

- **Route:** `/briefing/return/[sessionId]`
- **File:** `app/briefing/return/[sessionId]/page.tsx`
- **Problem:** Uses App Router while the rest of the corridor uses Pages Router.
- **Risk:** **LOW** — This is a standalone return-brief page. It has `force-dynamic` and uses `requireUser` from the App Router auth pattern. No router context conflict.
- **Recommendation:** Documented. No change needed.
