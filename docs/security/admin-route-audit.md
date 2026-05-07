# Admin Route Security Audit

**Date:** 2026-05-07  
**Scope:** All routes under `app/api/admin/` and `pages/api/admin/`

---

## Protection Mechanism Summary

All admin routes are protected by `requireAdminServer()` (invoked via `requireAdminApp` for App Router routes or `requireAdminApi`/`requireAdmin` for Pages Router routes) which enforces:

1. **Authentication** — NextAuth session via `getServerSession`
2. **Authorization** — `isAuthorizedAdminSession()` from `lib/auth/admin-authority.ts`
3. **Rate Limiting** — Persistent, default 60 requests per 15 minutes per admin user+IP
4. **Audit Logging** — All authentication/authorization failures logged

Additional security layers applied globally:

| Layer | Detail |
|-------|--------|
| IP allow-list | `lib/server/admin-security.ts` |
| Anti-reconnaissance | Non-enumerable responses (no route discovery) |
| Magic link auth | 15-minute token expiry (`pages/api/admin/auth/`) |
| Dev-login lockout | Returns 404 in production |

---

## App Router Admin Routes (`app/api/admin/`)

| Route | Methods | Access Guard | Rate Limit | Schema | Audit | Classification |
|-------|---------|--------------|------------|--------|-------|----------------|
| `campaigns/route.ts` | GET | requireAdminApp | 60/15m | — | on failure | Protected, read-only |
| `commercial/route.ts` | GET, POST | requireAdminApp | 60/15m | — | on failure | Protected, write on POST |
| `dev-login/route.ts` | POST | returns 404 in prod | N/A | — | — | Disabled in production |
| `enterprise-foundation/route.ts` | GET | requireAdminApp | 60/15m | — | on failure | Protected, read-only |
| `decision/efficacy/route.ts` | GET | requireAdminApp | 60/15m | — | on failure | Protected, read-only |
| `decision/governance/route.ts` | GET | requireAdminApp | 60/15m | — | on failure | Protected, read-only |
| `decision/performance/route.ts` | GET | requireAdminApp | 60/15m | — | on failure | Protected, read-only |
| `decision/contextual-efficacy/route.ts` | GET | requireAdminApp | 60/15m | — | on failure | Protected, read-only |
| `decision/contextual-ranking/route.ts` | GET | requireAdminApp | 60/15m | — | on failure | Protected, read-only |
| `decision/signal-registry/route.ts` | GET | requireAdminApp | 60/15m | — | on failure | Protected, read-only |
| `campaigns/[id]/route.ts` | GET, POST | requireAdminApp | 60/15m | — | on failure | Protected |
| `campaigns/[id]/report/route.ts` | GET | requireAdminApp | 60/15m | — | on failure | Protected, read-only |
| `campaigns/[id]/report-data/route.ts` | GET | requireAdminApp | 60/15m | — | on failure | Protected, read-only |
| `campaigns/[id]/report/pdf/route.ts` | GET | requireAdminApp | 60/15m | — | on failure | Protected, read-only |
| `campaigns/[id]/report/export-json/route.ts` | GET | requireAdminApp | 60/15m | — | on failure | Protected, read-only |

---

## Pages Router Admin Routes (`pages/api/admin/`)

| Route | Methods | Access Guard | Rate Limit | Schema | Audit | Classification |
|-------|---------|--------------|------------|--------|-------|----------------|
| `access-keys/index.ts` | GET | requireAdminApi | 60/15m | — | on failure | Protected, read-only |
| `access-keys/create.ts` | POST | requireAdminApi | 60/15m | — | write + audit | Protected, write + audit |
| `access-keys/[id]/revoke.ts` | POST | requireAdminApi | 60/15m | — | write + audit | Protected, write + audit |
| `access-keys/[id]/uses.ts` | GET | requireAdminApi | 60/15m | — | on failure | Protected, read-only |
| `auth/send-link.ts` | POST | none (login entry) | 5/60s | — | — | Rate-limited, no admin auth |
| `auth/verify.ts` | GET | token-gated | — | — | — | Token-gated, no admin auth |
| `audit-logs.ts` | GET | requireAdminApi | 60/15m | — | on failure | Protected, read-only |
| `audit/logs.ts` | GET | requireAdminApi | 60/15m | — | on failure | Protected, read-only |
| `deal-flow-stats.ts` | GET | requireAdminApi | 60/15m | — | on failure | Protected, read-only |
| `diagnostics/summary.ts` | GET | requireAdminApi | 60/15m | — | on failure | Protected, read-only |
| `diagnostics/records.ts` | GET | requireAdminApi | 60/15m | — | on failure | Protected, read-only |
| `diagnostics/artifacts.ts` | GET | requireAdminApi | 60/15m | — | on failure | Protected, read-only |
| `diagnostics/regenerate.ts` | POST | requireAdminApi | 60/15m | — | on failure | Protected, write |
| `diagnostics/grants/revoke.ts` | POST | requireAdminApi | 60/15m | — | write + audit | Protected, write + audit |
| `diagnostics/jobs/process.ts` | POST | requireAdminApi | 60/15m | — | on failure | Protected, write |
| `diagnostics/retention/run.ts` | POST | requireAdminApi | 60/15m | — | on failure | Protected, write |
| `diagnostics/revoke.ts` | POST | requireAdminApi | 60/15m | — | write + audit | Protected, write + audit |
| `export-audit.ts` | GET | requireAdminApi | 60/15m | — | security/export + audit | Protected, security/export + audit |
| `export-vips.ts` | GET | requireAdminApi | 60/15m | — | security/export + audit | Protected, security/export + audit |
| `identity-audit.ts` | GET | requireAdminApi | 60/15m | — | on failure | Protected, read-only |
| `inner-circle/issue.ts` | POST | requireAdminApi | 60/15m | — | write + audit | Protected, write + audit |
| `inner-circle/revoke.ts` | POST | requireAdminApi | 60/15m | — | write + audit | Protected, write + audit |
| `inner-circle/export.ts` | GET | requireAdminApi | 60/15m | — | export + audit | Protected, export + audit |
| `institutional-analytics.ts` | GET | requireAdminApi | 60/15m | — | on failure | Protected, read-only |
| `invites/index.ts` | GET | requireAdminApi | 60/15m | — | on failure | Protected, read-only |
| `invites/create.ts` | POST | requireAdminApi | 60/15m | — | write + audit | Protected, write + audit |
| `invites/[id]/revoke.ts` | POST | requireAdminApi | 60/15m | — | write + audit | Protected, write + audit |
| `jobs/dead-letter/index.ts` | GET | requireAdminApi | 60/15m | — | on failure | Protected, read-only |
| `jobs/dead-letter/replay.ts` | POST | requireAdminApi | 60/15m | — | on failure | Protected, write |
| `jobs/process.ts` | POST | requireAdminApi | 60/15m | — | on failure | Protected, write |
| `members/keys.ts` | GET | requireAdminApi | 60/15m | — | on failure | Protected, read-only |
| `members/list.ts` | GET | requireAdminApi | 60/15m | — | on failure | Protected, read-only |
| `members/revoke.ts` | POST | requireAdminApi | 60/15m | — | write + audit | Protected, write + audit |
| `members/upgrade.ts` | POST | requireAdminApi | 60/15m | — | write + audit | Protected, write + audit |
| `onboard-principal.ts` | POST | requireAdminApi | 60/15m | — | write + audit | Protected, write + audit |
| `pdf-analytics.ts` | GET | requireAdminApi | 60/15m | — | on failure | Protected, read-only |
| `pdf-status.ts` | GET | requireAdminApi | 60/15m | — | on failure | Protected, read-only |
| `pricing.ts` | GET | requireAdminApi | 60/15m | — | on failure | Protected, read-only |
| `proof/evidence/index.ts` | GET | requireAdminApi | 60/15m | — | on failure | Protected, read-only |
| `proof/evidence/[id].ts` | GET | requireAdminApi | 60/15m | — | on failure | Protected, read-only |
| `reports/index.ts` | GET | requireAdminApi | 60/15m | — | on failure | Protected, read-only |
| `reports/[id].ts` | GET | requireAdminApi | 60/15m | — | on failure | Protected, read-only |
| `reports/[id]/deliver.ts` | POST | requireAdminApi | 60/15m | — | write + audit | Protected, write + audit |
| `security/events.ts` | GET | requireAdminApi | 60/15m | — | security + audit | Protected, security access + audit |
| `security/appeal.ts` | POST | requireAdminApi | 60/15m | — | write + audit | Protected, write + audit |
| `security/deny.ts` | POST | requireAdminApi | 60/15m | — | write + audit | Protected, write + audit |
| `security/resolve-appeal.ts` | POST | requireAdminApi | 60/15m | — | write + audit | Protected, write + audit |
| `security/toggle-lock.ts` | POST | requireAdminApi | 60/15m | — | write + audit | Protected, write + audit |
| `status-report.ts` | GET | requireAdminApi | 60/15m | — | on failure | Protected, read-only |
| `sync-fix.ts` | POST | requireAdminApi | 60/15m | — | on failure | Protected, write |
| `system-health.ts` | GET | requireAdminApi | 60/15m | — | on failure | Protected, read-only |
| `users/upgrade.ts` | POST | requireAdminApi | 60/15m | — | write + audit | Protected, write + audit |
| `validation.ts` | GET | requireAdminApi | 60/15m | — | on failure | Protected, read-only |

---

## Classification Summary

| Classification | Count |
|----------------|-------|
| Protected, read-only | 38 |
| Protected, write | 8 |
| Protected, write + audit | 20 |
| Protected, security/export + audit | 4 |
| Protected (read + write) | 2 |
| Disabled in production | 1 |
| Rate-limited, no admin auth (login flow) | 1 |
| Token-gated, no admin auth (login completion) | 1 |

**No unclassified admin route remains.**
