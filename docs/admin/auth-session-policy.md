# Admin Authentication Session Policy

**Last updated:** 2026-05-22  
**Applies to:** `lib/auth/config.ts`, `lib/access/server.ts`

---

## Session lifetime

| Role | Session TTL | Enforcement mechanism |
|------|-------------|----------------------|
| ADMIN | 8 hours | `adminSessionIssuedAt` stamp in JWT, checked in `requireAdminApi` |
| OWNER | 8 hours | Same as ADMIN |
| Non-admin users | NextAuth default (30 days) | Standard NextAuth `maxAge` |

Admin and OWNER sessions expire after 8 hours from the time of first login, regardless of activity. This is a hard expiry — not an idle timeout. Re-authentication is required after 8 hours.

---

## Implementation

### JWT stamp (`lib/auth/config.ts`)

On first login with an ADMIN or OWNER role, the JWT callback sets:

```typescript
token.adminSessionIssuedAt = Date.now(); // milliseconds
```

This stamp is written **once** — it is not updated on subsequent JWT refresh cycles. If the user's role is removed or downgraded, the stamp is cleared:

```typescript
delete token.adminSessionIssuedAt;
```

### Session propagation (`lib/auth/config.ts`)

The session callback propagates the stamp to `session.user`:

```typescript
session.user.adminSessionIssuedAt = token.adminSessionIssuedAt;
```

### Expiry check (`lib/access/server.ts`)

`requireAdminApi()` calls `isAdminSessionExpired()` on every admin API request:

```typescript
function isAdminSessionExpired(session): boolean {
  const issuedAt = session?.user?.adminSessionIssuedAt;
  if (typeof issuedAt !== "number") return false; // not an admin session
  return Date.now() - issuedAt > ADMIN_SESSION_MAX_AGE_MS; // 8h
}
```

If expired, the API returns:

```json
{
  "ok": false,
  "error": "Admin session expired after 8 hours. Please sign in again.",
  "code": "ADMIN_SESSION_EXPIRED"
}
```

HTTP status: `401`.

---

## Credentials login rate limiting

The credentials provider applies rate limiting inside the `authorize()` callback **before** password verification:

- **Limit:** 5 attempts per 600 seconds (10 minutes)
- **Scope key:** `auth-credentials-login`
- **Identifier:** SHA-256 hash of the email address (raw email never stored in rate limit table)
- **Behaviour on breach:** Returns `null` (same as wrong password — does not reveal whether email exists)

---

## CSRF / Origin protection

All admin mutation routes (POST/PUT/PATCH/DELETE) require same-origin requests via `verifyAdminMutationOrigin()` in `lib/api/admin-mutation-guard.ts`.

- Checks `Origin` header (or falls back to `Referer`)
- Allowed origins: `abrahamoflondon.com`, `www.abrahamoflondon.com`, `NEXTAUTH_URL`, `localhost` (dev only)
- Cross-origin mutation requests return `403`

High-risk actions (scheduler live-run, forceRepublish, lock toggle) additionally require:

```
X-Institutional-Action: <action-name>
```

---

## Login flow

1. User submits credentials via `/admin/login`
2. NextAuth credentials `authorize()` callback:
   a. Rate limit check (5/10 min per hashed email)
   b. Email/password verification
   c. Returns user object with `role` field
3. JWT callback sets `adminSessionIssuedAt` for ADMIN/OWNER roles
4. Session callback propagates stamp to session
5. Every admin API route call checks `isAdminSessionExpired()` via `requireAdminApi()`
6. After 8 hours: API returns `401 ADMIN_SESSION_EXPIRED` — client must re-authenticate

---

## Security notes

- The `adminSessionIssuedAt` timestamp is stored in the **JWT** (server-side signing key required to read it). It is not stored in the database.
- Non-admin users are not subject to the 8-hour limit. Their sessions follow the standard NextAuth `maxAge`.
- The expiry is enforced at the **API layer** — admin pages that rely on server-side props also call `requireAdminPage` → `resolvePageAccess` which checks the same session.
- Tokens (OAuth, API keys) are **never** returned to the client in session data or API responses.
