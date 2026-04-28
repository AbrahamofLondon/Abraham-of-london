# Rate Limit Coverage Map

## Legend

| Status | Meaning |
|--------|---------|
| protected | Redis-backed `consumePersistentRateLimit` with Postgres fallback, `failClosed: true` |
| unprotected | No rate limiting applied |

---

## Auth Endpoints

| Endpoint | Method | Limiter | Limit | Window | Risk | Status |
|----------|--------|---------|-------|--------|------|--------|
| `/api/auth/sovereign` | POST | persistent Redis/Postgres | 10 | 60s | MED | protected |
| `/api/auth/signin` (NextAuth) | POST | None (NextAuth internal) | — | — | LOW | unprotected |
| `/api/auth/csrf` | GET | None | — | — | LOW | unprotected |
| `/api/auth/session` | GET | None | — | — | LOW | unprotected |

## Admin Endpoints

| Endpoint | Method | Limiter | Limit | Window | Risk | Status |
|----------|--------|---------|-------|--------|------|--------|
| `/api/admin/auth/send-link` | POST | persistent Redis/Postgres | 5 | 60s | HIGH | protected |
| `/api/admin/auth/verify` | GET | persistent Redis/Postgres | 20 | 60s | MED | protected |
| `/api/admin/dev-login` | POST | persistent Redis/Postgres | 5 | 60s | HIGH | protected |
| `/api/admin/*` (general) | ALL | persistent Redis/Postgres | 100 | 60s | LOW | protected |

## Inner Circle Endpoints

| Endpoint | Method | Limiter | Limit | Window | Risk | Status |
|----------|--------|---------|-------|--------|------|--------|
| `/api/inner-circle/verify` | POST | persistent Redis/Postgres | 30 | 60s | MED | protected |
| `/api/inner-circle/issue` | POST | persistent Redis/Postgres | 20 | 60s | MED | protected |

## Download Endpoints

| Endpoint | Method | Limiter | Limit | Window | Risk | Status |
|----------|--------|---------|-------|--------|------|--------|
| `/api/download/[token]` | GET | persistent Redis/Postgres | 20 | 60s | MED | protected |

## General API Endpoints

| Endpoint | Method | Limiter | Limit | Window | Risk | Status |
|----------|--------|---------|-------|--------|------|--------|
| `/api/*` (general) | ALL | persistent Redis/Postgres | 100 | 60s | LOW | protected |
| `/api/contact` | POST | persistent Redis/Postgres | 10 | 60s | LOW | protected |
| `/api/search` | POST | persistent Redis/Postgres | 30 | 60s | MED | protected |

## Implementation Notes

- All protected endpoints use `consumePersistentRateLimit` from `lib/server/security/persistent-rate-limit.ts`
- **Three-tier architecture:**
  1. **Redis** — primary fast-path (atomic INCR + PTTL via ioredis MULTI)
  2. **Postgres** — fallback when Redis is unavailable (transaction-safe upsert on `RateLimitBucket` model via Prisma)
  3. **Fail-closed** — if both Redis and Postgres are unavailable, requests are DENIED (`failClosed: true`)
- The `source` field in the result indicates which store was used: `"redis"`, `"postgres"`, or `"unavailable"`
- Rate limiting is **Postgres-authoritative with Redis optional acceleration**. No protected production route depends solely on Redis.
- In-memory rate limiting is NOT used in production for any protected endpoint.
