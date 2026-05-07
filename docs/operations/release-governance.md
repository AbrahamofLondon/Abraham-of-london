# Release Governance Framework

**Project:** Abraham of London — Check Visual
**Last updated:** 2026-05-07
**Owner:** Engineering Lead

---

## 1. Pre-Release Checklist

Every release to production MUST satisfy every gate below. A single failure is a hard stop.

| # | Gate | Command | Pass Criteria |
|---|------|---------|---------------|
| 1 | Clean working tree | `git status --short` | Empty output |
| 2 | Prisma schema valid | `pnpm exec prisma validate` | Exit 0 |
| 3 | Prisma client generated | `pnpm exec prisma generate` | Exit 0 |
| 4 | TypeScript compiles | `pnpm exec tsc --noEmit` | Exit 0, zero errors |
| 5 | Production build | `pnpm build` | Exit 0 |
| 6 | Dependency audit | `pnpm audit --prod` | 0 critical, 0 high |
| 7 | Client bundle secret scan | `node scripts/security/audit-client-bundle-secrets.mjs` | Exit 0 |
| 8 | Public IP exposure scan | `node scripts/security/audit-public-ip-exposure.mjs` | Exit 0 |
| 9 | Env integrity check | `node scripts/security/env-integrity-check.mjs --ci` | Exit 0 (if script exists) |
| 10 | Red-team smoke | `node scripts/security/red-team-smoke.mjs` | All assertions pass (where infra available) |

### Sign-off procedure

```
- [ ] Gate 1:  `git status --short` returns empty
- [ ] Gate 2:  `pnpm exec prisma validate` passes
- [ ] Gate 3:  `pnpm exec prisma generate` passes
- [ ] Gate 4:  `pnpm exec tsc --noEmit` passes
- [ ] Gate 5:  `pnpm build` passes
- [ ] Gate 6:  `pnpm audit --prod` — 0 critical/high
- [ ] Gate 7:  `node scripts/security/audit-client-bundle-secrets.mjs` passes
- [ ] Gate 8:  `node scripts/security/audit-public-ip-exposure.mjs` passes
- [ ] Gate 9:  `node scripts/security/env-integrity-check.mjs --ci` passes (if exists)
- [ ] Gate 10: Red-team smoke passes (where infra available)
```

---

## 2. Deployment Verification

After deployment to production, verify the following within 10 minutes:

### 2.1 Health endpoint

```bash
curl -sf https://<PRODUCTION_URL>/api/v2/health | jq .
# Expected: { "status": "healthy", "version": "v2", ... }
# HTTP 200
```

Also verify the Pages API health endpoint:

```bash
curl -sf https://<PRODUCTION_URL>/api/health
# Expected: HTTP 200
```

### 2.2 Security headers

```bash
curl -sI https://<PRODUCTION_URL>/ | grep -iE 'content-security-policy|strict-transport|x-frame-options|x-content-type'
```

Required headers:

| Header | Expected Value |
|--------|---------------|
| `Content-Security-Policy` | Present, non-empty |
| `Strict-Transport-Security` | `max-age=` with a value >= 31536000 |
| `X-Frame-Options` | `DENY` or `SAMEORIGIN` |
| `X-Content-Type-Options` | `nosniff` |

### 2.3 PDF direct access blocked

```bash
curl -sI https://<PRODUCTION_URL>/assets/downloads/any-file.pdf
# Expected: 3xx redirect to /api/downloads/ OR 403/404
# MUST NOT return 200 with application/pdf body
```

### 2.4 Admin routes require authentication

```bash
curl -s -o /dev/null -w "%{http_code}" https://<PRODUCTION_URL>/admin/dashboard
# Expected: 302 or 307 redirect to login
```

### 2.5 Inner Circle routes require authentication

```bash
curl -s -o /dev/null -w "%{http_code}" https://<PRODUCTION_URL>/inner-circle
# Expected: 302 or 307 redirect to login
```

---

## 3. Rollback Procedure

### 3.1 Netlify deploy rollback

Netlify maintains immutable deploy snapshots. To rollback:

1. Open the Netlify dashboard for the site.
2. Navigate to **Deploys**.
3. Locate the last known-good deploy (green checkmark, prior to the broken release).
4. Click the deploy, then click **Publish deploy**.
5. The site reverts immediately (DNS TTL permitting, usually < 60s).
6. Verify with the Deployment Verification checklist above.

**CLI alternative:**

```bash
# List recent deploys
netlify api listSiteDeploys --data '{"site_id":"<SITE_ID>"}' | jq '.[0:5] | .[] | {id, created_at, state}'

# Publish a specific deploy
netlify api restoreSiteDeploy --data '{"site_id":"<SITE_ID>","deploy_id":"<DEPLOY_ID>"}'
```

### 3.2 Database migration rollback

This project uses Prisma with a PostgreSQL database.

1. **Identify the migration to revert.** Check `prisma/migrations/` for the most recent migration directory.
2. **Take a database backup BEFORE rolling back:**
   ```bash
   pg_dump "$DATABASE_URL" > backup-$(date +%Y%m%d-%H%M%S).sql
   ```
3. **Revert the migration manually.** Prisma does not support automatic down-migrations. You must:
   - Write a SQL script that undoes the schema changes (drop columns, restore old types, etc.).
   - Execute it against the database:
     ```bash
     psql "$DATABASE_URL" < rollback-<migration-name>.sql
     ```
   - Mark the migration as rolled back in `_prisma_migrations`:
     ```sql
     DELETE FROM _prisma_migrations WHERE migration_name = '<migration_dir_name>';
     ```
4. **Redeploy the previous code version** (which expects the old schema).
5. **Validate** with `pnpm exec prisma validate` and a health check.

**Prevention:** Always test migrations on staging first. Keep rollback SQL scripts alongside each migration.

### 3.3 Secret rotation procedure

When a secret is compromised or rotated:

1. **Generate the new secret** using a cryptographically secure method:
   ```bash
   openssl rand -base64 32
   ```
2. **Update the secret in Netlify environment variables:**
   - Dashboard: Site settings > Environment variables
   - Or CLI: `netlify env:set SECRET_NAME "new-value"`
3. **Redeploy** to pick up the new environment variable.
4. **Revoke the old secret** at the provider (Stripe dashboard, database password rotation, etc.).
5. **Secrets that require rotation in specific locations:**

   | Secret | Where to rotate |
   |--------|----------------|
   | `STRIPE_SECRET_KEY` | Stripe Dashboard > API Keys |
   | `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard > Webhooks > Signing secret |
   | `DATABASE_URL` | Database provider admin panel |
   | `NEXTAUTH_SECRET` | Regenerate with `openssl rand -base64 32`, set in Netlify |
   | `CRON_SECRET` | Regenerate, update in Netlify env + any cron scheduler config |
   | `SOVEREIGN_KEY_HASH` | Regenerate the key, re-hash, update env |

6. **Verify** the deployment works with the new secrets (health check + smoke test).

---

## 4. Staging Parity

### 4.1 Environment differences

| Concern | Local (`pnpm dev`) | Staging (Netlify preview) | Production |
|---------|-------------------|--------------------------|------------|
| Runtime | Node.js (direct) | Netlify Functions / Edge | Netlify Functions / Edge |
| Database | Local PostgreSQL or Docker (`docker-compose.yml`) | Staging DB (separate instance) | Production DB |
| Stripe | Test keys (`sk_test_*`) | Test keys (`sk_test_*`) | Live keys (`sk_live_*`) |
| Email (Resend) | Sandbox / suppressed | Sandbox or staging domain | Production domain |
| Redis | Local instance or none | Depends on plan | Production instance (if provisioned) |
| CDN/Edge | None | Netlify CDN (preview URL) | Netlify CDN (custom domain) |
| HTTPS | HTTP (localhost) | HTTPS (auto) | HTTPS (auto) |
| Auth | NextAuth with local callback URL | NextAuth with preview URL | NextAuth with production URL |
| HubSpot | Sandbox portal or disabled | Sandbox portal | Production portal |

### 4.2 Environment variables that differ

| Variable | Local | Staging | Production |
|----------|-------|---------|------------|
| `DATABASE_URL` | `postgresql://...localhost...` | Staging DB connection string | Production DB connection string |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | `https://<branch>--<site>.netlify.app` | `https://abrahamoflondon.com` |
| `STRIPE_SECRET_KEY` | `sk_test_...` | `sk_test_...` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Local CLI webhook secret | Staging webhook endpoint secret | Production webhook endpoint secret |
| `NEXTAUTH_URL` | `http://localhost:3000` | Preview deploy URL | Production URL |
| `NODE_ENV` | `development` | `production` | `production` |
| `CRON_SECRET` | Local value | Staging value | Production value (unique) |

### 4.3 Services that differ

| Service | Local | Staging | Production |
|---------|-------|---------|------------|
| **PostgreSQL** | Docker container (`docker-compose.yml` with `DB_PASSWORD`) or local install | Managed instance (e.g., Neon, Supabase) | Managed instance (separate) |
| **Stripe** | Test mode, local webhook forwarding via `stripe listen` | Test mode, Netlify webhook endpoint | Live mode |
| **Redis** | Optional local instance or mocked | May not be provisioned | Provisioned if rate limiting / caching requires it |
| **Resend (email)** | Suppressed or sandbox | Staging domain | Production domain |
| **HubSpot** | Disabled or sandbox | Sandbox portal | Production portal |
| **Netlify Functions** | Not used (Next.js dev server) | Active (preview deploy) | Active |

### 4.4 Known parity gaps to address

1. **Rate limiting** may behave differently locally (no Redis) vs production.
2. **Webhook signatures** cannot be validated locally without `stripe listen --forward-to`.
3. **Edge functions** and middleware run differently in `next dev` vs Netlify Edge Runtime.
4. **PDF generation** with `@react-pdf/renderer` may have font differences between environments.
5. **CRON jobs** do not run locally; they are triggered by external schedulers against `/api/cron/*` endpoints.

---

## 5. Release Cadence

| Release Type | Frequency | Approval Required |
|-------------|-----------|-------------------|
| Hotfix (security) | Immediate | Post-hoc review within 24h |
| Bugfix | As needed | Pre-merge review |
| Feature | Weekly or sprint-aligned | Pre-merge review + staging verification |
| Infrastructure | Scheduled maintenance window | Pre-merge review + staging verification + rollback script prepared |

---

## 6. Incident Response

If a deployment causes a production incident:

1. **Rollback immediately** (Section 3.1).
2. Open an incident thread.
3. Verify rollback with the Deployment Verification checklist.
4. Root-cause analysis within 48 hours.
5. Update this governance document if the incident reveals a gap.
