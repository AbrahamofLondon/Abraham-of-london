# Local Admin Authentication Troubleshooting

## Symptom

Opening an admin route such as `/admin/outbound/linkedin` redirects to:

```text
/admin/login?returnTo=%2Fadmin%2Foutbound%2Flinkedin
```

or a visibly double-encoded variant:

```text
/admin/login?returnTo=%252Fadmin%252Foutbound%252Flinkedin
```

or the login form shows:

```text
Authentication service returned an invalid response.
```

This is an Abraham of London admin authentication issue. It is separate from LinkedIn outbound OAuth and does not indicate that LinkedIn publishing is connected or broken.

If the browser lands on `/api/auth/error`, diagnose the NextAuth provider path first: missing provider credentials, callback URL mismatch, an unstable/missing `NEXTAUTH_SECRET`, or a provider response rejected by NextAuth can all produce that route before the LinkedIn outbound console is reached.

## How Admin Access Works

Admin pages call `requireAdminPage`, which reads the NextAuth session and resolves the user through the access layer. If no authenticated admin session exists, the request is redirected to `/admin/login`.

The local admin login page supports:

1. Custom admin magic link via `/api/admin/auth/send-link`.
2. Google OAuth, if Google provider credentials are configured.
3. Credentials provider only when bootstrap admin credentials are configured.

The custom magic-link route must return JSON. If the browser receives HTML instead, the login page reports an invalid authentication response.

## Required Local Environment

Set the following for local admin access:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<strong 32+ character secret>
```

`AUTH_SECRET` may exist for other auth conventions, but this code path reads `NEXTAUTH_SECRET`.

At least one authorised admin email must be present in the admin allow-list. Admin emails are resolved by `lib/access/admin-email-resolver.ts` from:

- the hardcoded bootstrap list used to prevent lockout, and
- optional `ADMIN_USER_EMAILS` environment values.
- optional legacy `ADMIN_ALLOWED_EMAILS` environment values.

`ADMIN_USER_EMAILS` and `ADMIN_ALLOWED_EMAILS` accept comma, semicolon, or whitespace-separated email values. Values are lowercased and trimmed. Do not expose the full allow-list publicly.

Do not repeat `ADMIN_USER_EMAIL` multiple times in the same env file. Only one value will win. Use `ADMIN_USER_EMAILS` for multiple allow-listed admin emails.

If using magic-link login, configure email delivery:

```env
RESEND_API_KEY=
EMAIL_FROM=Abraham of London <admin@abrahamoflondon.org>
MAIL_FROM=Abraham of London <admin@abrahamoflondon.org>
```

If using Google sign-in, configure:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Supported aliases in code include `GOOGLE_ID`, `GOOGLE_SECRET`, `AUTH_GOOGLE_ID`, and `AUTH_GOOGLE_SECRET`.

The local callback should match the NextAuth provider route for the local origin. For a normal local server this means:

```text
http://localhost:3000/api/auth/callback/google
```

If using bootstrap credentials, configure:

```env
ADMIN_USER_EMAIL=
ADMIN_USER_PASSWORD=<bcrypt or argon2 hash>
```

Supported aliases in code include `NEXTAUTH_ADMIN_EMAIL` and `NEXTAUTH_ADMIN_PASSWORD`. The password value must be a hash; plaintext passwords are rejected.

## Database Setup

The Prisma schema provider is `postgresql`. `DATABASE_URL` must start with `postgresql://` or `postgres://`. A SQLite `file:` URL will cause a `PrismaClientInitializationError` and the send-link endpoint will return:

```json
{ "ok": false, "error": "DATABASE_URL_INVALID", "message": "Admin sign-in requires a valid PostgreSQL DATABASE_URL in this environment." }
```

Use a [Neon](https://neon.tech) or local Postgres instance:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
```

After setting the URL, ensure the schema is current:

```bash
pnpm db:generate
pnpm db:status
```

The `VerificationToken` and `User` tables must exist. If migrations are pending:

```bash
pnpm db:push        # apply schema directly (dev only)
# or
pnpm db:migrate     # run prisma migrate dev
```

Redis is used for rate-limit caching but is not required for token storage. Redis unavailability logs a warning and fails-open in development — it does not block the sign-in flow.

If Prisma CLI commands work but the Next.js runtime still fails, restart the dev server. Next reads `.env.local` / `.env` at process start, and `.env.local` can override values you expected from `.env`.

Credential-specific checks:

- Confirm the password was not copied as redacted asterisks from a dashboard.
- URL-encode special characters in the database password before placing it in `DATABASE_URL`.
- Check Neon pooled and direct connection strings separately.
- Use `pnpm db:status` to confirm CLI connectivity.
- Restart the dev server after any env change.

Error meanings:

- `DATABASE_URL_INVALID`: missing, malformed, or non-PostgreSQL `DATABASE_URL`.
- `DATABASE_AUTHENTICATION_FAILED`: database host was reached, but the configured database credentials were rejected.
- `AUTH_DATABASE_UNAVAILABLE`: database host could not be reached or timed out.
- `TOKEN_STORAGE_FAILED`: token write failed for another reason.

## Production Database Checks

Production authentication also depends on Prisma reaching the configured PostgreSQL database. On Netlify, `DATABASE_URL` must be a valid Neon PostgreSQL connection string. If `DIRECT_URL` is used for migrations or direct connections, it should point at the corresponding direct Neon connection string.

Runtime and migration URLs may differ:

- `DATABASE_URL` is commonly the pooled Neon runtime endpoint.
- `DIRECT_URL` is commonly the direct Neon endpoint used by Prisma migrations.

If the pooled hostname is unreachable, verify the Neon project, branch, region, connection string, and pooler status in the Neon dashboard. Then update the Netlify environment variable and redeploy. Changing Netlify env vars does not affect an already-running deploy until a new deploy is triggered.

The browser must never show Prisma invocation text, database hostnames, SQL, stack traces, or raw connection errors. Database auth failures should surface only as safe auth error codes such as `AUTH_DATABASE_UNAVAILABLE` or `AUTH_DATABASE_CONFIGURATION_ERROR`.

## Diagnosis Steps

1. Confirm `NEXTAUTH_URL` exactly matches the local origin, usually `http://localhost:3000`.
2. Confirm `NEXTAUTH_SECRET` is set and stable between server restarts.
3. Confirm `DATABASE_URL` starts with `postgresql://` or `postgres://`.
4. Run `pnpm db:status` and confirm no pending migrations.
5. Confirm the login email appears in `lib/access/admin-email-resolver.ts` or `ADMIN_USER_EMAILS`.
6. Confirm `RESEND_API_KEY` is present if using magic links.
7. Confirm the browser network response for `/api/admin/auth/send-link` is JSON.
8. If Google sign-in is used, confirm the Google OAuth callback URL matches the local NextAuth callback URL.
9. In production, confirm Netlify has the same database env values expected by the deployed branch.
10. If the verify link returns `RATE_LIMIT_EXCEEDED`, wait for the returned `retryAfter` value or request a fresh sign-in link.

In development only, an admin-auth rate-limit key can be cleared with:

```bash
curl -X POST http://localhost:3000/api/admin/auth/reset-rate-limit \
  -H "Content-Type: application/json" \
  -d "{\"routeKey\":\"admin-verify\"}"
```

The reset helper is unavailable in production and only accepts `admin-verify` or `admin-send-link`.

## Return Target Handling

Admin return targets must be local paths only.

Safe:

```text
/admin/outbound/linkedin
```

Unsafe values are rejected and replaced with `/admin`:

```text
https://example.com/admin
//example.com/admin
javascript:alert(1)
```

The login page decodes return targets at most two times, so:

```text
%252Fadmin%252Foutbound%252Flinkedin
```

resolves safely to:

```text
/admin/outbound/linkedin
```

Known safe local URL:

```text
http://localhost:3000/admin/outbound/linkedin
```

## LinkedIn Scope Boundary

Accessing `/admin/outbound/linkedin` requires Abraham of London admin authentication first.

After admin access succeeds, LinkedIn publishing readiness is evaluated separately:

- Member OAuth scopes such as `openid`, `profile`, `email`, `r_profile_basicinfo`, `r_verify`, and `w_member_social` are not enough for Company Page publishing.
- Abraham of London Company Page publishing requires LinkedIn organisation social access, especially `w_organization_social`.
- Organisation/page discovery may require `r_organization_social`.
- Until LinkedIn grants those organisation scopes, the console must keep Page publishing blocked.

Member-profile fallback must remain blocked unless an explicit future workflow enables it.
