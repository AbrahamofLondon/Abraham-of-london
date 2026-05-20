# Netlify Database Auth Checklist

Use this checklist when production authentication fails or redirects to an auth error page.

## Environment Variables

Verify in Netlify project settings:

```env
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
NEXTAUTH_URL=https://www.abrahamoflondon.org
NEXTAUTH_SECRET=<configured secret>
```

`DATABASE_URL` must be a valid Neon PostgreSQL URL. It may use the pooled Neon runtime endpoint. `DIRECT_URL`, where used, should match the direct Neon connection endpoint for migration and schema operations.

Do not paste database URLs into browser-visible logs, support tickets, or screenshots.

## Neon Checks

1. Confirm the Neon project is active.
2. Confirm the branch referenced by the connection string exists.
3. Confirm the hostname and region match the current Neon dashboard value.
4. Confirm the pooler endpoint is available if `DATABASE_URL` uses the pooler.
5. Confirm the direct endpoint is available if `DIRECT_URL` is used.

## Schema Checks

Run from a trusted local or CI environment with the intended Neon env values:

```bash
pnpm db:generate
pnpm db:status
```

If migrations are pending, apply the approved migration process before testing login again.

## Netlify Redeploy

After changing `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_URL`, or `NEXTAUTH_SECRET`:

1. Save the Netlify env var changes.
2. Trigger a fresh deploy.
3. Confirm the deploy picked up the new env values.

## Runtime Verification

1. Visit `/api/auth/session`.
2. Attempt login.
3. Confirm a failed login does not expose:
   - Prisma invocation text
   - database hostnames
   - SQL
   - stack traces
   - raw provider payloads
   - connection strings
4. Expected safe browser-facing message:

```text
Authentication is temporarily unavailable. Please try again later or contact support.
```

5. Expected safe error codes include:
   - `AUTH_DATABASE_UNAVAILABLE`
   - `AUTH_DATABASE_CONFIGURATION_ERROR`
   - `AUTH_SIGNIN_FAILED`
