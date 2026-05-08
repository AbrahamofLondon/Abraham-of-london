# Environment Variable Governance

> Generated: 2026-05-07 | Source: automated codebase scan of `process.env.*` usage

Current incident policy:

- `ACTION_TOKEN_SECRET`, `DOWNLOAD_TOKEN_SECRET`, `ADMIN_JWT_SECRET`, `SECURE_CLIENT_STATE_SECRET`, `CSRF_SECRET`, `DYNAMIC_THRESHOLD_SALT`, `OAUTH_TOKEN_ENCRYPTION_KEY`, and `INNER_CIRCLE_JWT_SECRET` must not fall back to any shared secret.
- `RESEND_WEBHOOK_SECRET` must fail closed in production.
- `INTERNAL_BYPASS_KEY` and `DEV_ADMIN_PASSWORD` are development-only controls and must not be treated as production-operable access paths.

---

## 1. Complete Environment Variable Registry

### Authentication

| Variable | Required in Prod | Secret | Has Fallback | Notes |
|---|---|---|---|---|
| `NEXTAUTH_SECRET` | Yes | Yes | No | Core NextAuth session signing |
| `NEXTAUTH_URL` | Yes | No | No | NextAuth callback URL |
| `JWT_SECRET` | Yes | Yes | No | JWT token signing |
| `JWT_ALGORITHM` | No | No | No | Default: HS256 |
| `JWT_EXPIRES_IN` | No | No | No | Default: 30d |
| `ENCRYPTION_KEY` | Yes | Yes | No | AES encryption key |
| `CSRF_SECRET` | Yes | Yes | No | CSRF token signing |
| `ACCESS_COOKIE_SECRET` | Yes | Yes | No | Cookie encryption |
| `SESSION_COOKIE_PREFIX` | No | No | No | Default: aol |
| `ADMIN_JWT_SECRET` | Yes | Yes | No | Admin JWT signing |
| `ADMIN_API_KEY` | Yes | Yes | No | Admin API authentication |
| `ADMIN_SECRET_TOKEN` | Yes | Yes | No | Admin token validation |
| `ADMIN_SECRET` | Yes | Yes | No | Admin secret |
| `X_ADMIN_SECRET` | No | Yes | No | Additional admin secret header |
| `ADMIN_PASSWORD_HASH` | Yes | Yes | No | bcrypt hash for admin login |
| `ADMIN_USER_EMAIL` | Yes | No | No | Admin user email(s) |
| `ADMIN_USER_PASSWORD` | No | Yes | No | Admin user password |
| `ADMIN_ALLOWED_EMAILS` | Yes | No | No | Comma-separated admin emails |
| `ADMIN_ALLOWED_IPS` | No | No | No | IP allowlist for admin routes |
| `ADMIN_IP_ALLOWLIST` | No | No | No | Alias for admin IP filtering |
| `ADMIN_JWT_ENABLED` | No | No | No | Toggle admin JWT auth |
| `DEV_ADMIN_PASSWORD` | No | Yes | No | Dev-only admin password |
| `ADMIN_NOTIFICATION_EMAIL` | No | No | No | Alert recipient |
| `RECAPTCHA_SECRET_KEY` | Yes | Yes | No | Server-side reCAPTCHA |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Yes | No | No | Client-side reCAPTCHA |
| `RECAPTCHA_MIN_SCORE` | No | No | No | Default: 0.5 |

### Payment (Stripe)

| Variable | Required in Prod | Secret | Has Fallback | Notes |
|---|---|---|---|---|
| `STRIPE_SECRET_KEY` | Yes | Yes | No | Stripe API secret |
| `STRIPE_WEBHOOK_SECRET` | Yes | Yes | No | Stripe webhook signature |
| `STRIPE_DIAGNOSTIC_REPORT_WEBHOOK_SECRET` | No | Yes | No | Diagnostic report webhook |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | No | No | Client-side Stripe key |
| `STRIPE_EXECUTIVE_REPORTING_PRICE_ID` | No | No | No | Price ID |
| `STRIPE_STRATEGY_ROOM_PRODUCT_ID` | No | No | No | Product ID |
| `STRIPE_STRATEGY_ROOM_PRICE_ID` | No | No | No | Price ID |
| `STRIPE_STRATEGY_ROOM_PRICE_ID_MULTIPLE` | No | No | No | Multi-seat price ID |

### Database

| Variable | Required in Prod | Secret | Has Fallback | Notes |
|---|---|---|---|---|
| `DATABASE_URL` | Yes | Yes | No | Primary Prisma database URL |
| `DIRECT_URL` | No | Yes | No | Direct (non-pooled) DB URL |
| `MONGODB_URI` | No | Yes | No | MongoDB connection string |
| `INNER_CIRCLE_DB_URL` | Yes | Yes | Fallback: `DATABASE_URL` | Inner circle database. **Fallback chain.** |
| `INNER_CIRCLE_STORE` | No | No | No | Storage backend type |
| `DB_PROVIDER` | No | No | No | sqlite / postgres |
| `SKIP_DB` | No | No | No | Skip database init |
| `FORCE_DB` | No | No | No | Force database init |

### Redis / Cache

| Variable | Required in Prod | Secret | Has Fallback | Notes |
|---|---|---|---|---|
| `REDIS_URL` | No | Yes | Fallback: `INNER_CIRCLE_REDIS_URL` | Redis connection. **Fallback chain.** |
| `REDIS_HOST` | No | No | No | Redis host |
| `REDIS_PORT` | No | No | No | Redis port |
| `REDIS_PASSWORD` | No | Yes | No | Redis auth |
| `REDIS_DB` | No | No | No | Redis database index |
| `REDIS_DISABLED` | No | No | No | Disable Redis |
| `USE_REDIS` | No | No | No | Enable Redis |
| `UPSTASH_REDIS_REST_URL` | No | No | No | Upstash REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | No | Yes | No | Upstash REST token |
| `VAULT_CACHE_SECONDS` | No | No | No | Cache TTL |

### Email

| Variable | Required in Prod | Secret | Has Fallback | Notes |
|---|---|---|---|---|
| `RESEND_API_KEY` | Yes | Yes | No | Resend email API key |
| `RESEND_AUDIENCE_ID` | No | No | No | Resend audience |
| `RESEND_WEBHOOK_SECRET` | Yes | Yes | No | Resend webhook signing |
| `EMAIL_FROM` | Yes | No | No | Sender address |
| `EMAIL_PROVIDER` | No | No | No | Email provider name |
| `EMAIL_SERVER` | No | No | No | SMTP server |
| `EMAIL_PORT` | No | No | No | SMTP port |
| `EMAIL_USER` | No | No | No | SMTP user |
| `EMAIL_SERVER_HOST` | No | No | No | SMTP host |
| `EMAIL_SERVER_PORT` | No | No | No | SMTP port |
| `EMAIL_SERVER_USER` | No | No | No | SMTP user |
| `EMAIL_SERVER_PASSWORD` | No | Yes | No | SMTP password |
| `EMAIL_REPLY_TO` | No | No | No | Reply-to address |
| `EMAIL_SECURE` | No | No | No | TLS toggle |
| `MAIL_FROM` | No | No | Fallback: `MAIL_TO` | Sender display. **Fallback chain.** |
| `MAIL_TO` | No | No | No | Default recipient |
| `MAIL_TO_PRIMARY` | No | No | Fallback: `MAIL_TO` | Primary recipient. **Fallback chain.** |
| `MAIL_TO_FALLBACK` | No | No | No | Fallback recipient |
| `MAIL_OPS_TO` | No | No | No | Ops recipient |
| `MAIL_REPLY_TO` | No | No | No | Reply-to |
| `INVITE_FROM_EMAIL` | No | No | No | Invitation sender |
| `CONTACT_RECEIVER_EMAIL` | No | No | No | Contact form recipient |
| `ACCESS_REQUEST_TO` | No | No | No | Access request recipient |
| `INNER_CIRCLE_FROM_EMAIL` | No | No | No | Inner circle sender |
| `NOTIFICATION_WEBHOOK_URL` | No | Yes | No | Discord/Slack webhook |

### Security / Cryptography

| Variable | Required in Prod | Secret | Has Fallback | Notes |
|---|---|---|---|---|
| `SYSTEM_INTEGRITY_SALT` | Yes | Yes | No | PDF/vault watermark signing |
| `AOL_HASH_SALT` | Yes | Yes | No | Brand hash salt |
| `ANONYMITY_SALT` | Yes | Yes | No | Anonymization salt |
| `DENYLIST_PEPPER` | Yes | Yes | No | Denylist hashing pepper |
| `NEW_INTERNAL_SALT` | No | Yes | No | Internal salt (new) |
| `NTERNAL_SALT` | No | Yes | No | Typo? Should be INTERNAL_SALT |
| `INTERNAL_BYPASS_KEY` | No | Yes | No | Development-only internal bypass key |
| `AUDIT_EDGE_SECRET` | Yes | Yes | No | Audit edge auth |
| `SOVEREIGN_ACCESS_KEY` | Yes | Yes | No | Sovereign access auth |
| `OGR_SESSION_SECRET` | Yes | Yes | No | OGR session signing |
| `OGR_SOVEREIGN_KEY` | Yes | Yes | No | OGR sovereign key |
| `OGR_SOVEREIGN_KEY_HASH` | No | No | No | Precomputed hash |
| `SOVEREIGN_ACCESS_KEY_HASH` | No | No | No | Precomputed hash |
| `SOVEREIGN_ACCESS_TOKEN` | No | Yes | No | Sovereign token |
| `SOVEREIGN_AUTH_KEY` | No | Yes | No | Sovereign auth |
| `SOVEREIGN_KEYS` | No | Yes | No | Sovereign key set |
| `SOVEREIGN_KEY_HASHES` | No | No | No | Precomputed hashes |
| `MFA_BACKUP_CODE_PEPPER` | No | Yes | Fallback: `MFA_ENCRYPTION_KEY` | MFA backup codes. **Fallback chain.** |
| `MFA_ENCRYPTION_KEY` | No | Yes | No | MFA encryption |
| `SECURE_CLIENT_STATE_SECRET` | Yes | Yes | No | Client state signing |
| `DYNAMIC_THRESHOLD_SALT` | Yes | Yes | No | Dynamic threshold |
| `OAUTH_TOKEN_ENCRYPTION_KEY` | Yes | Yes | No | OAuth token AES encryption |
| `RATE_LIMIT_MAX_REQUESTS` | No | No | No | Rate limit config |
| `RATE_LIMIT_WINDOW_MS` | No | No | No | Rate limit window |
| `SECURITY_LOCKDOWN_MODE` | No | No | No | System lockdown toggle |

### Inner Circle / Enterprise

| Variable | Required in Prod | Secret | Has Fallback | Notes |
|---|---|---|---|---|
| `INNER_CIRCLE_JWT_SECRET` | Yes | Yes | No | IC JWT signing |
| `INNER_CIRCLE_KEY_SECRET` | Yes | Yes | No | IC key encryption |
| `INNER_CIRCLE_KEY_EXPIRY_DAYS` | No | No | No | Key expiry |
| `INNER_CIRCLE_SESSION_TTL_DAYS` | No | No | No | Session TTL |
| `INNER_CIRCLE_ADMIN_KEY` | No | Yes | No | IC admin auth |
| `INNER_CIRCLE_TOKENS` | No | Yes | No | IC tokens |
| `INNER_CIRCLE_CACHE_TTL` | No | No | No | Cache TTL |
| `INNER_CIRCLE_ENABLE_CACHE` | No | No | No | Cache toggle |
| `INNER_CIRCLE_CDN_BASE` | No | No | No | CDN URL |
| `INNER_CIRCLE_JWT_AUDIENCE` | No | No | No | JWT audience claim |
| `INNER_CIRCLE_JWT_ISSUER` | No | No | No | JWT issuer claim |
| `ENTERPRISE_ALIGNMENT_INVITE_SECRET` | Yes | Yes | No | Enterprise invite signing |
| `TEAM_ASSESSMENT_INVITE_SECRET` | No | Yes | No | Team assessment invite |
| `COMMERCIAL_ACCESS_SECRET` | No | Yes | No | Commercial access |
| `COMMERCIAL_COOKIE_SECRET` | No | Yes | No | Commercial cookie |

### Diagnostics

| Variable | Required in Prod | Secret | Has Fallback | Notes |
|---|---|---|---|---|
| `DIAGNOSTIC_HMAC_SECRET` | Yes | Yes | No | Diagnostic HMAC signing |
| `DIAGNOSTIC_WATERMARK_SECRET` | Yes | Yes | No | Diagnostic watermark |
| `DIAGNOSTIC_STORAGE_PROVIDER` | No | No | No | local / s3 |
| `DIAGNOSTIC_DEFAULT_CURRENCY` | No | No | No | Default: gbp |
| `DIAGNOSTIC_S3_ENDPOINT` | No | No | No | S3 endpoint |
| `DIAGNOSTIC_S3_REGION` | No | No | No | S3 region |
| `DIAGNOSTIC_SIGNED_URL_TTL_SECONDS` | No | No | No | Signed URL TTL |
| `DIAGNOSTIC_S3_FORCE_PATH_STYLE` | No | No | No | S3 path style |

### Premium / Downloads

| Variable | Required in Prod | Secret | Has Fallback | Notes |
|---|---|---|---|---|
| `DOWNLOAD_TOKEN_SECRET` | Yes | Yes | No | Download token signing |
| `ARTIFACT_ACCESS_SECRET` | Yes | Yes | No | Artifact access auth |
| `DOWNLOAD_SECRET` | No | Yes | No | Download auth |
| `DOWNLOAD_SIGNING_SECRET` | No | Yes | No | Download signing |
| `ASSET_SECRET` | No | Yes | No | Asset auth |
| `PREMIUM_ASSET_BACKEND` | No | No | No | local / s3 |
| `ACTION_TOKEN_SECRET` | Yes | Yes | No | Action token signing |

### AI / External APIs

| Variable | Required in Prod | Secret | Has Fallback | Notes |
|---|---|---|---|---|
| `OPENAI_API_KEY` | No | Yes | No | OpenAI API |
| `ANTHROPIC_API_KEY` | No | Yes | No | Anthropic API |
| `DEEPSEEK_API_KEY` | No | Yes | No | DeepSeek API |
| `GOOGLE_API_KEY` | No | Yes | No | Google API |

### OAuth Integrations

| Variable | Required in Prod | Secret | Has Fallback | Notes |
|---|---|---|---|---|
| `GITHUB_ID` | No | No | No | GitHub OAuth client ID |
| `GITHUB_SECRET` | No | Yes | No | GitHub OAuth secret |
| `GOOGLE_OAUTH_CLIENT_ID` | No | No | No | Google OAuth client ID |
| `GOOGLE_OAUTH_CLIENT_SECRET` | No | Yes | No | Google OAuth secret |
| `SLACK_CLIENT_ID` | No | No | No | Slack OAuth client ID |
| `SLACK_CLIENT_SECRET` | No | Yes | No | Slack OAuth secret |
| `SLACK_SIGNINGIN_TOKEN` | No | Yes | No | Slack signing token |
| `SLACK_VERIFICATION_TOKEN` | No | Yes | No | Slack verification |

### CRM

| Variable | Required in Prod | Secret | Has Fallback | Notes |
|---|---|---|---|---|
| `CRM_ENDPOINT` | No | No | No | CRM API endpoint |
| `CRM_API_KEY` | No | Yes | No | CRM auth |
| `CRM_WEBHOOK_URL` | No | No | No | CRM webhook |
| `CRM_WEBHOOK_BEARER` | No | Yes | No | CRM webhook auth |
| `HUBSPOT_ACCESS_TOKEN` | No | Yes | Fallback: `CRM_API_KEY` | HubSpot token. **Fallback chain.** |
| `HUBSPOT_PORTAL_ID` | No | No | No | HubSpot portal |
| `DIAGNOSTICS_CRM_WEBHOOK_URL` | No | No | No | Diagnostics CRM webhook |
| `MAILCHIMP_API_KEY` | No | Yes | No | Mailchimp API |
| `MAILCHIMP_API_SERVER` | No | No | No | Mailchimp server |
| `MAILCHIMP_AUDIENCE_ID` | No | No | No | Mailchimp audience |
| `BUTTONDOWN_API_KEY` | No | Yes | No | Buttondown API |

### Brand / Identity / Config

| Variable | Required in Prod | Secret | Has Fallback | Notes |
|---|---|---|---|---|
| `AOL_BRAND_NAME` | No | No | No | Brand display name |
| `AOL_ISSUER_ID` | No | No | No | Issuer identifier |
| `AOL_WATERMARK_ISSUER_MEMBERID` | No | No | No | Watermark member ID |
| `AOL_SESSION_TTL_DAYS` | No | No | No | Session TTL |
| `AOL_TOKENSTORE_BACKEND` | No | No | No | Token store backend |
| `AOL_TOKEN_TTL_HOURS` | No | No | No | Token TTL |
| `NEXT_PUBLIC_APP_URL` | No | No | No | App URL |
| `NEXT_PUBLIC_SITE_URL` | Yes | No | No | Canonical site URL |
| `SITE_URL` | No | No | No | Server-side site URL |
| `SITE_DOMAIN` | No | No | No | Domain name |
| `ALLOWED_ORIGINS` | Yes | No | No | CORS origins |
| `NEXT_PUBLIC_APP_NAME` | No | No | No | App name |
| `NEXT_PUBLIC_APP_ENV` | No | No | No | Environment label |
| `NEXT_PUBLIC_CANONICAL_HOST` | No | No | No | Canonical host |
| `NEXT_PUBLIC_CDN_URL` | No | No | No | CDN URL |
| `NEXT_PUBLIC_BASE_URL` | No | No | No | Base URL |
| `APP_NAME` | No | No | No | App name |
| `APP_URL` | No | No | No | App URL |

### Analytics / Monitoring

| Variable | Required in Prod | Secret | Has Fallback | Notes |
|---|---|---|---|---|
| `ENABLE_ANALYTICS` | No | No | No | Analytics toggle |
| `GA_MEASUREMENT_ID` | No | No | No | Google Analytics ID |
| `NEXT_PUBLIC_GA_ID` | No | No | No | GA ID (client) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | No | No | No | GA measurement ID (client) |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | No | No | No | Client analytics toggle |
| `SENTRY_DSN` | No | No | No | Sentry error tracking |
| `ENABLE_METRICS` | No | No | No | Metrics toggle |
| `ANALYTICS_WEBHOOK_URL` | No | No | No | Analytics webhook |
| `ALERTS_ENABLED` | No | No | No | Alerts toggle |
| `ALERT_EMAIL_ENABLED` | No | No | No | Email alert toggle |
| `ALERTS_EMAIL_TO` | No | No | No | Alert email recipient |
| `ALERT_WEBHOOK_URL` | No | No | No | Alert webhook |
| `DISCORD_ALERT_WEBHOOK` | No | No | Fallback: `SLACK_ALERT_WEBHOOK` | Discord alerts. **Fallback chain (non-secret).** |
| `SLACK_ALERT_WEBHOOK` | No | No | No | Slack alerts |
| `DISCORD_STRATEGY_ROOM_WEBHOOK` | No | No | No | Strategy room webhook |
| `WATCHDOG_DORMANCY_DAYS` | No | No | No | Watchdog config |

### Feature Flags

| Variable | Required in Prod | Secret | Has Fallback | Notes |
|---|---|---|---|---|
| `ENABLE_PDF_GENERATION` | No | No | No | PDF generation toggle |
| `ENABLE_EMAIL_NOTIFICATIONS` | No | No | No | Email notification toggle |
| `ENABLE_API_KEYS` | No | No | No | API key auth toggle |
| `ENABLE_DATABASE_BACKUPS` | No | No | No | DB backup toggle |
| `ENABLE_PERFORMANCE_MONITORING` | No | No | No | Perf monitoring toggle |
| `BYPASS_SOVEREIGN` | No | No | No | **Dev-only.** Bypass sovereign auth |
| `DISABLE_DIAGNOSTIC_SCORING` | No | No | No | **Dev-only.** Disable scoring |
| `PREMIUM_DEV_BYPASS` | No | No | No | **Dev-only.** Bypass premium checks |
| `ALLOW_RECAPTCHA_BYPASS` | No | No | No | **Dev-only.** Bypass reCAPTCHA |
| `NEXT_PUBLIC_ALLOW_RECAPTCHA_BYPASS` | No | No | No | **Dev-only.** Client reCAPTCHA bypass |
| `SKIP_ASSET_AUDIT` | No | No | No | **Dev-only.** Skip asset verification |
| `NEXT_PUBLIC_DISABLE_BUILD_CHECKS` | No | No | No | Disable build checks |

### PDF

| Variable | Required in Prod | Secret | Has Fallback | Notes |
|---|---|---|---|---|
| `PDF_OUTPUT_DIR` | No | No | No | PDF output path |
| `PDF_TEMP_DIR` | No | No | No | PDF temp path |
| `PDF_FONTS_DIR` | No | No | No | Fonts directory |
| `PDF_DEFAULT_FORMAT` | No | No | No | Paper format |
| `PDF_QUALITY` | No | No | No | Image quality |
| `PDF_SCALE` | No | No | No | Scale factor |
| `PDF_PRINT_BACKGROUND` | No | No | No | Print backgrounds |
| `PDF_MARGIN_*` | No | No | No | Page margins |
| `PDF_BATCH_CONCURRENCY` | No | No | No | Batch concurrency |
| `PDF_GENERATED_RETENTION_DAYS` | No | No | No | Retention policy |
| `PDF_TEMP_RETENTION_HOURS` | No | No | No | Temp retention |
| `PDF_TIER` | No | No | No | PDF tier |
| `PDF_GENERATION_API_KEY` | No | Yes | No | PDF API key |

### Infrastructure / Platform

| Variable | Required in Prod | Secret | Has Fallback | Notes |
|---|---|---|---|---|
| `NODE_ENV` | Yes | No | No | Runtime environment |
| `LOG_LEVEL` | No | No | No | Logging level |
| `IS_WINDOWS` | No | No | No | Windows platform flag |
| `DEBUG_CONTENTLAYER` | No | No | No | Contentlayer debug |
| `DEBUG_BUILD_SAFE` | No | No | No | Build-safe debug |
| `RUNNING_IN_DOCKER` | No | No | No | Docker detection |
| `VERCEL` | No | No | No | Vercel platform detection |
| `VERCEL_ENV` | No | No | No | Vercel environment |
| `VERCEL_REGION` | No | No | No | Vercel region |
| `VERCEL_GIT_COMMIT_SHA` | No | No | No | Git commit on Vercel |
| `CI` | No | No | No | CI environment |
| `CRON_SECRET` | Yes | Yes | No | Cron job authentication |
| `INTERNAL_API_KEY` | No | Yes | No | Internal API auth |
| `STORAGE_URL` | No | No | No | Storage URL |
| `ASSET_STORAGE_URL` | No | No | No | Asset storage |
| `AUDIT_SERVICE_URL` | No | No | No | Audit service |
| `PRIVATE_TOKENS` | No | Yes | No | Private token store |
| `ACCESS_TOKENS_JSON` | No | Yes | No | Access tokens |

---

## 2. Fallback Chain Security Concerns

The following secret variables use `A || B` fallback patterns, meaning if the primary secret is unset, a different secret is silently substituted. This is a security concern because:
- It obscures which secret is actually in use
- Rotation of one secret may not invalidate the other
- Blast radius analysis becomes unreliable

| Primary Secret | Fallback | Location |
|---|---|---|
| `MFA_BACKUP_CODE_PEPPER` | `MFA_ENCRYPTION_KEY` | `lib/auth/mfa.ts:277` |
| `INNER_CIRCLE_DB_URL` | `DATABASE_URL` | `lib/server/secrets-db.ts:9` |
| `HUBSPOT_ACCESS_TOKEN` | `CRM_API_KEY` | `lib/hubspot/client.ts:11` |
| `REDIS_URL` | `INNER_CIRCLE_REDIS_URL` | `lib/server/token-store.ts:20` |

Secret-domain fallback chains for action, download, admin JWT, and secure client state were removed on 2026-05-07. Remaining rows above are the residual fallback map still requiring review.

---

## 3. Bypass Mechanisms

### 3.1 `BYPASS_SOVEREIGN` (proxy.ts:948, proxy.ts:1199)

- **What it bypasses:** Sovereign authentication on constitutional routes. Grants full `SOVEREIGN` authority level with wildcard scope.
- **Dev-only guard:** Yes -- gated behind `NODE_ENV === "development"`.
- **Production protection:** Enforced. The condition checks `NODE_ENV` first.
- **Risk:** LOW in production. If `NODE_ENV` is incorrectly set to `development` in prod, all sovereign routes are open.

### 3.2 `INTERNAL_BYPASS_KEY` + `X-Directorate-Bypass` header (proxy.ts:1207-1213, lib/auth/proxy.ts:129-134)

- **What it bypasses:** ALL middleware authentication and authorization. Complete proxy bypass.
- **Dev-only guard:** Yes. Active only when `NODE_ENV === "development"`.
- **Production protection:** Production must not honor the header.
- **Risk:** LOW in production if environment classification is correct. Still sensitive in development.
- **Recommendation:** Keep usage auditable and remove entirely if it is no longer needed by local recovery flows.

### 3.3 `X-Institutional-Action: true` header (lib/auth/proxy.ts:181)

- **What it bypasses:** Admin API signature validation in `lib/auth/proxy.ts`. Required for `/api/admin/*` routes.
- **Dev-only guard:** No. The header check is active in production.
- **Production protection:** REMOVED from main `proxy.ts` (line 1216-1219 documents the ban). However, `lib/auth/proxy.ts:181` still checks this header. The main `proxy.ts` has a comment noting this was "Banned per auth-migration/05-ban-list.md", but the secondary proxy at `lib/auth/proxy.ts` still enforces it as a requirement (not a bypass per se -- it demands the header be present).
- **Risk:** MEDIUM. The header is trivially spoofable. Any HTTP client can set `X-Institutional-Action: true`. In `lib/auth/proxy.ts`, it acts as a gate (must be true), not a bypass -- but it provides no real security since any client can set it.

### 3.4 `ALLOW_RECAPTCHA_BYPASS` / `NEXT_PUBLIC_ALLOW_RECAPTCHA_BYPASS` (lib/recaptchaClient.ts:53, lib/recaptchaServer.ts:55, lib/strategy-room/enrol-core.ts:59)

- **What it bypasses:** reCAPTCHA verification on forms and enrollment.
- **Dev-only guard:** No explicit `NODE_ENV` check. Controlled solely by the env var value.
- **Production protection:** NOT enforced. If this variable is set to `"true"` in production, reCAPTCHA is disabled.
- **Risk:** MEDIUM. Must never be `true` in production. The `.env` file currently has `ALLOW_RECAPTCHA_BYPASS!=true`.

### 3.5 `DISABLE_DIAGNOSTIC_SCORING` (pages/api/diagnostics/*.ts, lib/env.ts)

- **What it bypasses:** Diagnostic scoring engine -- returns mock/empty scores.
- **Dev-only guard:** No explicit `NODE_ENV` check in API handlers.
- **Production protection:** NOT enforced. Purely controlled by env var.
- **Risk:** MEDIUM. If set in production, diagnostic products return non-functional results.

### 3.6 `PREMIUM_DEV_BYPASS` (pages/api/premium/content/index.ts:110)

- **What it bypasses:** Premium content access checks -- allows unauthenticated access to premium content.
- **Dev-only guard:** No explicit `NODE_ENV` check.
- **Production protection:** NOT enforced. Purely controlled by env var.
- **Risk:** HIGH if enabled in prod. Grants free access to paid content.

### 3.7 `SKIP_ASSET_AUDIT` (lib/server/content-verify.ts:13)

- **What it bypasses:** Asset integrity verification.
- **Dev-only guard:** Yes -- gated behind `NODE_ENV === "development"`.
- **Production protection:** Enforced.
- **Risk:** LOW in production.

### 3.8 `isAllowedIp` development bypass (proxy.ts:612)

- **What it bypasses:** Admin IP allowlist. In development, all IPs are permitted.
- **Dev-only guard:** Yes -- `NODE_ENV === "development"`.
- **Production protection:** Enforced.
- **Risk:** LOW in production.

### 3.9 `pages/api/inner-circle/resend.ts:18` development bypass

- **What it bypasses:** Email resend rate limiting / auth check.
- **Dev-only guard:** Yes -- `NODE_ENV === "development"`.
- **Production protection:** Enforced.
- **Risk:** LOW in production.

### 3.10 Dev-login route (`app/api/admin/dev-login/route.ts`)

- **What it bypasses:** Normal admin authentication. Creates a dev-only cookie.
- **Dev-only guard:** Should be; requires verification.
- **Risk:** HIGH if accessible in production.

---

## 4. Critical Findings

### 4.1 Duplicate keys in `.env`

The following keys are defined multiple times in `.env`:
- `NODE_ENV` (x2)
- `ADMIN_USER_EMAIL` (x3)
- `ADMIN_NOTIFICATION_EMAIL` (x2)
- `EMAIL_FROM` (x2)
- `SYSTEM_INTEGRITY_SALT` (x3)
- `AOL_ISSUER_ID` (x3)
- `AOL_BRAND_NAME` (x2)
- `ENCRYPTION_KEY` (x2)

Only the **last** definition takes effect. This is a configuration integrity risk.

### 4.2 Placeholder values still present

- `ADMIN_JWT_SECRET="your-32-character-jwt-secret-here"` -- in both `.env` and `.env.local`
- `EMAIL_SERVER_USER=your-account`
- `EMAIL_SERVER_PASSWORD=your-app-password` (in `.env.local`)
- `DIAGNOSTIC_HMAC_SECRET="replace-with-long-random-secret"`
- `DIAGNOSTIC_WATERMARK_SECRET="replace-with-long-random-secret-2"`
- `DIAGNOSTIC_S3_ACCESS_KEY_ID=xxxx`
- `DIAGNOSTIC_S3_SECRET_ACCESS_KEY=xxxx`
- `DIAGNOSTIC_S3_BUCKET=your-bucket-name`
- `RESEND_API_KEY=re_1234567890abcdefghijklmnopqrstuvwxyz` -- looks like a placeholder

### 4.3 Dev-only defaults used as production secrets

Many secrets in the "Missing vars (safe defaults)" section use `aol-*-dev` patterns (e.g., `aol-download-token-dev`). These MUST be replaced with cryptographically random values before production deployment.

### 4.4 Typo: `NTERNAL_SALT`

There is a variable `NTERNAL_SALT` which is likely meant to be `INTERNAL_SALT`. This should be corrected.
