# Runtime Route Classification

**Generated:** 2026-05-26  
**Total routes scanned:** 961  
**Architecture decision:** Vercel (full Next.js runtime) + Netlify (proxy/domain layer only)

---

## Classification Summary

| Category | Count | Serves on | Notes |
|---|---|---|---|
| STATIC_NETLIFY | 63 | Vercel (cached at edge) | SSG — `getStaticProps` only |
| PUBLIC_DYNAMIC | 567 | Vercel | SSR or client-shell requiring server |
| ADMIN_DYNAMIC | 262 | Vercel | Admin pages + admin API routes |
| CLIENT_DELIVERY_DYNAMIC | 33 | Vercel | Client reports, boardroom, inner-circle |
| FOUNDRY_DYNAMIC | 25 | Vercel | Intelligence Foundry API routes |
| PAYMENT_DYNAMIC | 5 | Vercel | Stripe webhook + checkout |
| DOWNLOAD_DYNAMIC | 6 | Vercel | Secure download API |
| OUTBOUND_DYNAMIC | 0 | Vercel | Outbound content APIs |

**Key finding:** 129 pages export `getServerSideProps` (require SSR). `output: "export"` is NOT viable
for Netlify — those pages break the export build. The only viable static/dynamic split is:
- Vercel handles ALL Next.js routes (SSG cached at edge, SSR rendered on-demand)
- Netlify is a proxy/CDN layer that routes all traffic to Vercel (no `___netlify-server-handler`)

---

## Category Definitions

### STATIC_NETLIFY
Pages using `getStaticProps` (no `getServerSideProps`). Pre-rendered at build time.
In the Vercel deployment these are served from Vercel's edge CDN with the same speed as any CDN.
There is no technical benefit to serving them from Netlify separately — Vercel caches them at edge.

**Example routes:** `/blog/[slug]`, `/events/[slug]`, `/lexicon/[slug]`, `/canon/[slug]`,
`/briefs/[slug]`, `/books/[slug]`, `/editorials/[slug]`, `/downloads/index`

### PUBLIC_DYNAMIC
Public-facing pages that use `getServerSideProps` or are client-side shells served by the
Next.js server. Cannot be exported statically.

**Example routes:** `/about/founder`, `/diagnostic`, `/boardroom`, `/strategy-room`,
`/access/accept`, `/account/organisation`, all `[slug]` catch-alls

### ADMIN_DYNAMIC
All `/admin/**` pages and `/api/admin/**` API routes. Require session auth (NextAuth).
Must be on the dynamic runtime.

**Example routes:** `/admin`, `/admin/intelligence-foundry/**`, `/admin/command-wall`,
`/admin/reporting/executive/**`, `/api/admin/**`

### CLIENT_DELIVERY_DYNAMIC
Routes serving paying clients: secure reports, boardroom dossiers, inner-circle content,
case sharing. All require token or session auth.

**Example routes:** `/client/reports/[reportId]`, `/boardroom/[sessionId]`,
`/inner-circle/**`, `/directorate/dossier/[id]`, `/case/shared/[token]`

### FOUNDRY_DYNAMIC
Intelligence Foundry API routes. Research engine endpoints, simulation runners,
Foundry run management.

**Example routes:** `/api/admin/intelligence-foundry/**`

### PAYMENT_DYNAMIC — CRITICAL
Stripe webhook and checkout API. Webhook signature verification requires the raw
request body — must NOT be proxied through additional layers (see stripe note below).

**Routes:**
- `app/api/stripe/webhook/route.ts` → `POST /api/stripe/webhook`
- `pages/api/billing/checkout.ts` → `POST /api/billing/checkout` (or equivalent)
- Stripe checkout session API routes

**⚠️ Stripe Webhook Note:** Configure the Stripe webhook URL to point DIRECTLY to the
Vercel deployment URL (`https://PROJECT.vercel.app/api/stripe/webhook`), NOT through
the Netlify proxy. Stripe signature verification may fail if headers are modified in
transit through a proxy layer. After DNS is confirmed stable, you may switch to the
`abrahamoflondon.org` domain.

### DOWNLOAD_DYNAMIC
Authenticated download API routes. Serve PDFs and assets via signed tokens.

**Example routes:** `/api/downloads/[slug]`, `/api/download/[token]`

---

## Why `output: "export"` Was Rejected

Next.js `output: "export"` fails the build if ANY page uses `getServerSideProps`.
This project has **129 pages** with `getServerSideProps` (all admin pages, access/auth
pages, and several public pages). Excluding them would require either:

1. Rewriting all 129 pages to use only `getStaticProps` — not viable
2. Using `exportPathMap` to only export SSG pages — deprecated in Next.js 14+
3. Running two separate Next.js builds — doubles build time and complexity

None of these is appropriate for this project. Vercel handles static + dynamic correctly
without any architectural gymnastics.

---

## Vercel vs Netlify Constraint Comparison

| Constraint | Netlify | Vercel |
|---|---|---|
| Server handler size limit | 250 MB unzipped (hard) | No monolithic handler |
| Function architecture | Single Lambda per deployment | Per-route/API serverless fns |
| Max function size | 250 MB | 250 MB per function, many functions |
| Static pages | Served from CDN | Served from edge CDN |
| SSR pages | Packaged into handler | Individual serverless functions |
| API routes | Packaged into handler | Individual serverless functions |
| Next.js native support | Via `@netlify/plugin-nextjs` | Native (built by Vercel) |
| `output: "standalone"` | Required for size reduction | Auto-optimised |

Vercel's per-route function model means the 250 MB constraint is per-function, not
per-deployment. Most individual Next.js functions are 5–50 MB. No packaging crisis.

---

## Dynamic Routes Requiring Direct Access (Not Through Netlify Proxy)

These routes should be configured with their actual Vercel URL in external systems:

| Route | System | Reason |
|---|---|---|
| `/api/stripe/webhook` | Stripe Dashboard | Signature verification of raw body |
| `/api/billing/webhook` (if exists) | Stripe Dashboard | Same reason |
| `/api/auth/[...nextauth]` | NextAuth NEXTAUTH_URL | Cookie domain alignment |
| Email webhook endpoints | Resend/email provider | Raw body integrity |
| Cron endpoints | Vercel Cron / external schedulers | Direct invocation |
