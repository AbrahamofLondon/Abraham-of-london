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

`ADMIN_USER_EMAILS` accepts comma, semicolon, or whitespace-separated email values. Values are lowercased and trimmed. Do not expose the full allow-list publicly.

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

## Diagnosis Steps

1. Confirm `NEXTAUTH_URL` exactly matches the local origin, usually `http://localhost:3000`.
2. Confirm `NEXTAUTH_SECRET` is set and stable between server restarts.
3. Confirm the login email appears in `lib/access/admin-email-resolver.ts` or `ADMIN_USER_EMAILS`.
4. Confirm Prisma can write `VerificationToken` and `User` rows.
5. Confirm `RESEND_API_KEY` is present if using magic links.
6. Confirm the browser network response for `/api/admin/auth/send-link` is JSON.
7. If Google sign-in is used, confirm the Google OAuth callback URL matches the local NextAuth callback URL.

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
