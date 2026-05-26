# Split Architecture Setup Guide

**Generated:** 2026-05-26  
**Architecture:** Netlify (domain/CDN/proxy) → Vercel (full Next.js runtime)  
**Status:** Ready to deploy — follow this guide top-to-bottom

---

## Overview

```
Browser → Netlify (abrahamoflondon.org)
                │
                ├── Static files in public/ → served directly by Netlify CDN
                ├── 301 PDF alias redirects → /api/downloads/* on Vercel (via proxy)
                └── Everything else (/*) → transparent 200 proxy to Vercel
```

Netlify has NO Next.js build, NO `@netlify/plugin-nextjs`, NO `___netlify-server-handler`.  
Vercel runs `pnpm contentlayer2 build && node scripts/generate-briefs-registry.mjs && pnpm build:fast`.

---

## Step 1 — Deploy to Vercel

### 1a. Connect repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the `aol-check-visual` repository
3. Framework: **Next.js** (auto-detected from `vercel.json`)
4. Root directory: `.` (project root)
5. Build command, install command, output directory are all set in `vercel.json` — do not override them in the UI

### 1b. Set environment variables on Vercel

Set every variable in the **Vercel dashboard → Settings → Environment Variables**.  
Mark variables as **Production** + **Preview** as appropriate.  
Never commit `.env` or `.env.local` to git.

#### Required — will break at runtime if missing

| Variable | Value | Notes |
|---|---|---|
| `DATABASE_URL` | `postgresql://...?sslmode=require` | Neon pooler connection URL |
| `DIRECT_URL` | `postgresql://...?sslmode=require` | Neon direct (non-pooler) URL — used by Prisma migrations |
| `NEXTAUTH_SECRET` | 32+ char random string | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://www.abrahamoflondon.org` | Must match the public domain, NOT the Vercel URL |
| `NEXT_PUBLIC_APP_URL` | `https://www.abrahamoflondon.org` | Used by `config/site.ts` and `lib/config/runtime.ts` |
| `NEXT_PUBLIC_SITE_URL` | `https://www.abrahamoflondon.org` | Duplicate of above; both are read in different places |
| `SITE_URL` | `https://www.abrahamoflondon.org` | Server-side canonical URL |
| `SITE_DOMAIN` | `www.abrahamoflondon.org` | Used in email headers and cookie domain |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Live Stripe key |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | **Must match the Stripe webhook endpoint — see Step 3** |
| `RESEND_API_KEY` | `re_...` | Email delivery |
| `NEXTAUTH_SECRET` | 32+ char random string | NextAuth session signing |
| `JWT_SECRET` | 32+ char random string | Token signing |
| `ENCRYPTION_KEY` | 32+ char random string | AES encryption for stored tokens |
| `DOWNLOAD_TOKEN_SECRET` | 32+ char random string | Signed download URL tokens |
| `ARTIFACT_ACCESS_SECRET` | 32+ char random string | PDF artifact access signing |
| `CRON_SECRET` | 32+ char random string | Vercel Cron job auth header |
| `INTERNAL_BYPASS_KEY` | 32+ char random string | Internal API auth |

#### Required — commercial/paid features

| Variable | Value | Notes |
|---|---|---|
| `ADMIN_JWT_SECRET` | 32+ char random string | Admin session signing |
| `ADMIN_API_KEY` | 32+ char random string | Admin API authentication |
| `ADMIN_SECRET_TOKEN` | 32+ char random string | Admin webhook auth |
| `ADMIN_USER_EMAILS` | `info@abrahamoflondon.org,...` | Comma-separated admin email addresses |
| `ADMIN_ALLOWED_EMAILS` | Same as above | NextAuth admin allowlist |
| `INNER_CIRCLE_JWT_SECRET` | 32+ char random string | Inner Circle session tokens |
| `INNER_CIRCLE_KEY_SECRET` | 32+ char random string | Inner Circle encryption |
| `INNER_CIRCLE_STORE` | `postgres` | Use postgres (not redis) for IC membership |
| `DIAGNOSTIC_HMAC_SECRET` | 32+ char random string | Diagnostic report signing |
| `DIAGNOSTIC_WATERMARK_SECRET` | 32+ char random string | PDF watermark key |
| `SYSTEM_INTEGRITY_SALT` | 16+ char random string | Vault/brief PDF watermarking |
| `AOL_HASH_SALT` | 32+ char random string | Member ID hashing |

#### Optional but recommended

| Variable | Value | Notes |
|---|---|---|
| `UPSTASH_REDIS_REST_URL` | `https://...upstash.io` | Redis caching (rate limiting, session cache) |
| `UPSTASH_REDIS_REST_TOKEN` | `AXxx...` | Upstash auth token |
| `REDIS_DISABLED` | `false` | Set to `false` when Upstash is configured |
| `OPENAI_API_KEY` | `sk-...` | Semantic search (`/api/search`) |
| `RESEND_WEBHOOK_SECRET` | `whsec_...` | Resend email status webhook verification |
| `AUDIT_EDGE_SECRET` | 32+ char random string | Edge audit event auth |
| `GITHUB_CLIENT_ID` | OAuth app client ID | GitHub admin login |
| `GITHUB_CLIENT_SECRET` | OAuth app secret | GitHub admin login |
| `OAUTH_TOKEN_ENCRYPTION_KEY` | 32+ char string | Encrypt LinkedIn/Facebook/X tokens at rest |

#### Feature flags (set these explicitly for production)

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_APP_ENV` | `production` |
| `NEXT_TELEMETRY_DISABLED` | `1` |
| `SKIP_DB` | `false` |
| `LOG_LEVEL` | `warn` |
| `ENABLE_PDF_GENERATION` | `true` |
| `ENABLE_EMAIL_NOTIFICATIONS` | `true` |
| `AOL_TOKENSTORE_BACKEND` | `postgres` |
| `DIAGNOSTIC_STORAGE_PROVIDER` | `local` |

### 1c. Deploy and note the Vercel URL

After deployment, Vercel assigns a URL like `aol-check-visual-xxxx.vercel.app` or your configured alias.  
Note this URL — you will need it for Step 2 and Step 3.

---

## Step 2 — Wire Netlify Proxy to Vercel

### 2a. Set Netlify environment variable

Netlify environment variables in `netlify.toml` cannot be used in redirect `to` fields (Netlify does not interpolate them there). The Vercel URL is therefore a literal value in `netlify.toml`.

Open `netlify.toml` and find the last `[[redirects]]` block (the catch-all proxy rule):

```toml
[[redirects]]
  from = "/*"
  to = "https://YOUR_PROJECT.vercel.app/:splat"
  status = 200
  force = true
```

Replace `YOUR_PROJECT.vercel.app` with the actual Vercel hostname from Step 1c.  
Commit and push this change — Netlify will redeploy automatically.

### 2b. Confirm Netlify build settings in the UI

In the Netlify dashboard → Site Settings → Build & Deploy:

| Setting | Value |
|---|---|
| Base directory | _(blank)_ |
| Build command | `echo 'Netlify proxy mode: no Next.js build — all routes served via Vercel'` |
| Publish directory | `public` |

These match `netlify.toml` and should be auto-populated. Do not override them.

### 2c. Verify Netlify environment variables

Set in the Netlify UI (these are NOT secrets — they affect the CDN layer only):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://www.abrahamoflondon.org` |
| `NEXT_PUBLIC_APP_ENV` | `production` |

---

## Step 3 — Update Stripe Webhook URL

**⚠️ Critical:** The Stripe webhook URL must point DIRECTLY to the Vercel deployment URL, NOT through the Netlify proxy. Proxying the Stripe webhook changes headers and may cause signature verification failure.

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Update the webhook endpoint URL from the old Netlify URL to:
   ```
   https://YOUR_PROJECT.vercel.app/api/stripe/webhook
   ```
3. Copy the new **Signing secret** (`whsec_...`)
4. Update `STRIPE_WEBHOOK_SECRET` on Vercel to the new signing secret
5. Confirm events: `checkout.session.completed`, `payment_intent.succeeded`, `customer.subscription.*`

If you also have `/api/billing/webhook` or `/api/webhooks/stripe` registered in Stripe, update those endpoint URLs to the Vercel URL as well.

After DNS is confirmed stable (abrahamoflondon.org resolves correctly and the proxy works), you may switch the Stripe webhook URL to `https://www.abrahamoflondon.org/api/stripe/webhook` — the proxy will forward it correctly once the domain routing is stable.

---

## Step 4 — Update NEXTAUTH_URL on Vercel

`NEXTAUTH_URL` must match the URL that users see in their browser. Because Netlify proxies all requests transparently, users see `https://www.abrahamoflondon.org` — not the Vercel URL.

Set on Vercel:
```
NEXTAUTH_URL = https://www.abrahamoflondon.org
```

**Do NOT set it to the Vercel deployment URL** (e.g., `https://aol.vercel.app`). NextAuth uses `NEXTAUTH_URL` for:
- Cookie domain binding
- OAuth callback URLs
- CSRF token validation
- Email sign-in links

If `NEXTAUTH_URL` is set to the Vercel URL, admin login links sent by email will redirect to `.vercel.app` instead of the public domain, and cookies may not persist across the proxy boundary.

---

## Step 5 — Custom Domain on Vercel (Optional but Recommended)

To ensure cookies, CORS, and CSP work without cross-origin complexity:

1. In Vercel → Project → Settings → Domains: add `www.abrahamoflondon.org`
2. Vercel will issue a TLS certificate for the domain
3. In Netlify → Domain Settings: ensure Netlify does NOT set DNS for `abrahamoflondon.org` if Vercel owns the domain
4. If Netlify owns DNS: add a CNAME from `www.abrahamoflondon.org` → Netlify's load balancer, and let Netlify proxy to Vercel

The typical setup is:
- DNS registrar → Netlify's nameservers
- Netlify handles `www.abrahamoflondon.org` with its CDN
- Netlify `[[redirects]]` proxy sends all requests to `*.vercel.app`

---

## Step 6 — URL References to Audit and Update

These are all places where a hardcoded URL or env var must use `https://www.abrahamoflondon.org` (not any `.vercel.app` URL):

### Environment variables (set on Vercel)

| Variable | Required value |
|---|---|
| `NEXTAUTH_URL` | `https://www.abrahamoflondon.org` |
| `NEXT_PUBLIC_APP_URL` | `https://www.abrahamoflondon.org` |
| `NEXT_PUBLIC_SITE_URL` | `https://www.abrahamoflondon.org` |
| `SITE_URL` | `https://www.abrahamoflondon.org` |
| `ALLOWED_ORIGINS` | `https://www.abrahamoflondon.org` (add localhost for dev) |

### OAuth redirect URIs (update in external dashboards)

These OAuth callback URLs are registered in third-party dashboards. They must match the domain the user sees:

| Provider | Callback URL to register |
|---|---|
| GitHub OAuth app | `https://www.abrahamoflondon.org/api/auth/callback/github` |
| LinkedIn | `https://www.abrahamoflondon.org/api/admin/outbound/linkedin/oauth/callback` |
| Facebook | `https://www.abrahamoflondon.org/api/admin/outbound/facebook/oauth/callback` |
| X (Twitter) | `https://www.abrahamoflondon.org/api/admin/outbound/x/oauth/callback` |
| Google OAuth | `https://www.abrahamoflondon.org/api/auth/callback/google` |

Also update the corresponding env vars:
```
LINKEDIN_LEGACY_REDIRECT_URI=https://www.abrahamoflondon.org/api/admin/outbound/linkedin/oauth/callback
LINKEDIN_COMMUNITY_REDIRECT_URI=https://www.abrahamoflondon.org/api/admin/outbound/linkedin/oauth/callback
FACEBOOK_REDIRECT_URI=https://www.abrahamoflondon.org/api/admin/outbound/facebook/oauth/callback
X_REDIRECT_URI=https://www.abrahamoflondon.org/api/admin/outbound/x/oauth/callback
```

### Stripe checkout success/cancel URLs

In `pages/api/billing/checkout.ts` and any checkout session creation, `success_url` and `cancel_url` must use the public domain. Check for hardcoded `.vercel.app` URLs:

```bash
grep -r "vercel.app" pages/api/billing pages/api/stripe pages/api/events --include="*.ts"
```

If any exist, replace with `https://www.abrahamoflondon.org` or `process.env.NEXT_PUBLIC_APP_URL`.

### Email templates

Links in emails sent by Resend must use the public domain. The Stripe checkout links, secure report delivery links, Inner Circle invite links, and diagnostic report links should all use `NEXT_PUBLIC_APP_URL` or `SITE_URL` — not hardcoded `.vercel.app` URLs.

Key files to audit:
- `lib/server/email.ts`
- `lib/email/core/sendEmail.ts`
- `lib/product/return-brief-delivery-service.ts`
- `lib/product/oversight-brief-delivery-service.ts`

### Secure report and boardroom links

`/client/reports/[reportId]`, `/boardroom/[sessionId]`, `/directorate/dossier/[id]` generate shareable links. These are typically constructed from `NEXT_PUBLIC_APP_URL` or `SITE_URL`. Verify they do not hardcode the Vercel URL.

---

## Step 7 — Cron Jobs

Cron jobs have been moved from `netlify.toml` to `vercel.json`. They run on Vercel's cron system and invoke the app's own API routes.

| Path | Schedule | Purpose |
|---|---|---|
| `/api/cleanup-download-tokens` | `0 2 * * *` (2am daily) | Expire old signed download tokens |
| `/api/cron/escalation` | `0 */6 * * *` (every 6h) | Intelligence Foundry escalation |
| `/api/cron/decision-state` | `0 */12 * * *` (every 12h) | Decision state machine tick |

Vercel cron jobs send a request with the `Authorization: Bearer <CRON_SECRET>` header. Ensure `CRON_SECRET` is set on Vercel and that the cron handler verifies it.

---

## Step 8 — Deployment Verification Checklist

After deploying both platforms, run through this checklist:

### Netlify
- [ ] Build completes with `echo 'Netlify proxy mode...'` (no Next.js build)
- [ ] No `___netlify-server-handler` artifact is created
- [ ] `https://www.abrahamoflondon.org/` loads (proxied from Vercel)
- [ ] `https://www.abrahamoflondon.org/admin` loads (proxied from Vercel)
- [ ] A PDF redirect (e.g., `/lexicon/brotherhood.pdf`) returns 301 to `/api/downloads/brotherhood`

### Vercel
- [ ] Build completes (`pnpm build:fast` exits 0)
- [ ] `https://YOUR_PROJECT.vercel.app/` loads the homepage
- [ ] `https://YOUR_PROJECT.vercel.app/api/v2/health` returns `{"status":"ok"}` or similar
- [ ] Admin login at `/admin` works with correct email
- [ ] NextAuth session cookie is set on `www.abrahamoflondon.org` (not `.vercel.app`)

### Stripe
- [ ] Webhook endpoint URL is the Vercel URL (not Netlify)
- [ ] `STRIPE_WEBHOOK_SECRET` on Vercel matches the Stripe webhook signing secret
- [ ] Test webhook delivery succeeds in Stripe Dashboard

### End-to-end
- [ ] Checkout flow: `/api/billing/checkout` → Stripe → success/cancel redirect to `abrahamoflondon.org`
- [ ] Download: `/api/downloads/[slug]` returns a signed PDF
- [ ] Inner Circle invite email contains correct domain links
- [ ] Admin email magic link points to `abrahamoflondon.org`

---

## Architecture Decision Record

See `docs/deployment/runtime-route-classification.md` for why `output: "export"` was rejected and why Vercel was chosen as the dynamic runtime.

See `docs/deployment/netlify-handler-limit-decision.md` for the full history of the Netlify 250 MB handler size problem and the decision to move to this proxy architecture.
