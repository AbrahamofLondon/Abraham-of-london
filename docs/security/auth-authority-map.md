# Auth Authority Map

## Primary Authority

1. Login authority
`lib/auth/config.ts` via NextAuth providers is the primary login authority.

2. Session verification authority
`lib/server/auth/tokenStore.postgres.ts` is the primary verification authority.
It resolves the NextAuth JWT and derives access from Prisma-backed user access state.

3. Inner Circle access authority
`lib/inner-circle/access.server.ts` and `lib/inner-circle/middleware.ts` must resolve through `lib/server/auth/tokenStore.postgres.ts`.
Redis may cache session metadata, but it does not override the NextAuth/Postgres result.

4. Sovereign access authority
`app/api/auth/sovereign/route.ts` is the sovereign entry gate.
Its access decision is based on server-side hash verification of configured sovereign key material.

## Cache And Persistence Roles

- `lib/server/auth/tokenStore.redis.ts`
Role: cache only.
Status: non-authoritative. It may accelerate lookups or cache revocation metadata, but it must not contradict NextAuth/Postgres.

- `lib/server/auth/tokenStore.postgres.ts`
Role: canonical verification adapter for NextAuth JWT plus entitlements.
Status: authoritative.

- `lib/auth/sessions.ts`
Role: legacy session store path.
Status: deprecated. It should be removed or reduced to a compatibility shim because it creates a second session authority model.

## Deprecated Or Conflicting Paths

- `lib/auth/sessions.ts`
Reason: parallel session authority.
Disposition: remove or convert to compatibility shim.

- `lib/server/auth/tokenStore.redis.ts`
Reason: historically treated as a primary path.
Disposition: retain only as cache/write-through helper.

- `lib/inner-circle/access.server.ts`
Status after remediation: switched back to `tokenStore.postgres` authority.

## Files Requiring Removal Or Shim Work

- `lib/auth/sessions.ts`
- Any route or helper importing `lib/server/auth/tokenStore.redis.ts` for access decisions instead of caching
- Any legacy `aol_access` issuance path that attempts to mint authority independently of NextAuth

## Decision Rule

If a request can be answered by both Redis and NextAuth/Postgres, NextAuth/Postgres wins.
Redis may accelerate, never authorize independently.
