# Corridor Access Boundary Audit

**Audit date:** 2026-05-10
**Method:** Source inspection + guard script execution

---

## Guard Script Results

| Script | Result |
|--------|--------|
| `node scripts/infrastructure-boundary-guard.mjs` | ✅ PASS |
| `node scripts/public-dto-guard.mjs` | ✅ PASS |
| `node scripts/intelligence-boundary-guard.mjs` | ✅ PASS |

---

## Role Boundary Checks

### 1. Respondents cannot view sponsor command surfaces

| Surface | Guard | Status |
|---------|-------|--------|
| `/oversight` | `resolvePageAccess` + `canViewSponsorCommandSummary` | ✅ |
| `/oversight/brief/[cycleId]` | `requireUser` + `canViewOversightBrief` | ✅ |
| `/oversight/portfolio` | `resolvePageAccess` + `canViewPortfolioMemory` | ✅ |
| `/boardroom` | `resolvePageAccess` + `canViewBoardroomArchive` | ✅ |
| `/boardroom/[sessionId]` | `getServerSideProps` with auth check | ✅ |

### 2. Clients cannot view admin surfaces

| Surface | Guard | Status |
|---------|-------|--------|
| `/admin/*` (all routes) | `requireAdminPage` in `getServerSideProps` | ✅ |
| `/api/admin/*` (all routes) | `requireAdmin` or `requireAdminAppRoute` | ✅ |

### 3. Sponsor-safe surfaces suppress respondent text

| Surface | Finding | Status |
|---------|---------|--------|
| `SponsorSafeCommandSummary` | All fields are banded/summarised — no raw respondent text | ✅ |
| Portfolio memory | Uses `isMemoryDisplaySafe` to filter content | ✅ |

### 4. Operator notes never appear client-side

| Check | Finding | Status |
|-------|---------|--------|
| Operator notes in API responses | Filtered server-side before reaching client | ✅ |
| Delivery queue admin view | Operator notes visible only in admin context | ✅ |

### 5. Counsel notes never appear client-side

| Check | Finding | Status |
|-------|---------|--------|
| Counsel notes in status page | Filtered by role — only visible to counsel reviewers | ✅ |
| Counsel intake responses | Stored server-side, never exposed to other users | ✅ |

### 6. Admin APIs are guarded

| API Group | Guard | Status |
|-----------|-------|--------|
| `pages/api/admin/*` | `requireAdminPage` or `requireAdmin` | ✅ |
| `app/api/admin/*` | `requireAdminAppRoute` | ✅ |

### 7. Public-safe APIs return only DTOs/bands/summaries

| API | Return Type | Status |
|-----|-------------|--------|
| `/api/live/constitutional-posture` | `ExecutiveReportConstitution` — banded | ✅ |
| `/api/admin/constitutional-health` | `ConstitutionalHealthPublicSafe` — bands only | ✅ |
| `/api/executive-reporting/run` | `ExecutiveReportPublicDTO` — no raw scores | ✅ |

### 8. Tier-policy not imported into client-reachable code

| Check | Finding | Status |
|-------|---------|--------|
| `@/lib/access/tier-policy` in client files | Zero occurrences after refactor | ✅ |
| All client components use `@/lib/access/public` | ✅ Confirmed in build hygiene fix | ✅ |

---

## Boundary Guard Script Details

### Infrastructure Boundary Guard

Scans for:
- Deprecated Redis imports → **0 violations**
- Deprecated reCAPTCHA imports → **0 violations**
- Server-only infrastructure imports from client files → **0 violations**
- Prisma/DB imports from client files → **0 violations**

### Public DTO Guard

Scans for raw score/threshold exposure in public API responses → **PASS**

### Intelligence Boundary Guard

Scans for kernel/internal method leakage in public surfaces → **PASS**

---

## Summary

| Check | Status |
|-------|--------|
| Respondents cannot view sponsor surfaces | ✅ |
| Clients cannot view admin surfaces | ✅ |
| Sponsor-safe surfaces suppress respondent text | ✅ |
| Operator notes never appear client-side | ✅ |
| Counsel notes never appear client-side | ✅ |
| Admin APIs are guarded | ✅ |
| Public-safe APIs return only DTOs/bands | ✅ |
| Tier-policy not in client code | ✅ |
| Infrastructure boundary guard | ✅ PASS |
| Public DTO guard | ✅ PASS |
| Intelligence boundary guard | ✅ PASS |

**All access boundaries are intact.**
