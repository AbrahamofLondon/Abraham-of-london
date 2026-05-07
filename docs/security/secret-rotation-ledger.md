# Secret Rotation Ledger

> Established: 2026-05-07 | Status: Initial audit -- all rotation dates unknown

---

## Rotation Policy Key

| Policy | Interval | Rationale |
|---|---|---|
| **Critical** | 90 days | Session signing, encryption keys, master bypass keys |
| **Standard** | 180 days | API keys, webhook secrets, OAuth credentials |
| **Annual** | 365 days | Salts, peppers, static hashes |
| **On-compromise** | Immediate | Any secret with suspected exposure |

---

## Secret Inventory

### Tier 1 -- Critical (90-day rotation)

| Secret | Purpose | Rotation Policy | Last Rotation | Blast Radius if Compromised |
|---|---|---|---|---|
| `NEXTAUTH_SECRET` | Signs all NextAuth session JWTs. | Critical (90d) | Unknown | **Total auth compromise.** All user sessions invalidated. |
| `JWT_SECRET` | Signs application-level JWTs (non-NextAuth). | Critical (90d) | Unknown | **Auth bypass.** Arbitrary JWT tokens can be forged. |
| `ENCRYPTION_KEY` | AES encryption for sensitive data at rest. | Critical (90d) | Unknown | **Data exposure.** All encrypted fields in the database become readable. |
| `INTERNAL_BYPASS_KEY` | Master key for `X-Directorate-Bypass` header. Bypasses ALL authentication. | Critical (90d) | Unknown | **Complete system compromise.** Attacker bypasses all auth, rate limiting, and access control across every route. |
| `ADMIN_JWT_SECRET` | Signs admin JWT tokens. | Critical (90d) | Unknown | **Admin impersonation.** Arbitrary admin tokens can be forged. |
| `ADMIN_API_KEY` | Authenticates admin API requests. | Critical (90d) | Unknown | **Admin API takeover.** Full admin API access. |
| `ADMIN_SECRET_TOKEN` | Admin token validation. | Critical (90d) | Unknown | **Admin access.** Admin actions can be performed. |
| `ADMIN_SECRET` | General admin secret. | Critical (90d) | Unknown | **Admin access.** Depends on usage context. |
| `X_ADMIN_SECRET` | Admin secret header value. | Critical (90d) | Unknown | **Admin access.** Header-based admin auth bypass. |
| `ADMIN_USER_PASSWORD` | Admin user password (plaintext in env). | Critical (90d) | Unknown | **Admin login.** Direct admin account access. |
| `ADMIN_PASSWORD_HASH` | bcrypt hash of admin password. | Critical (90d) | Unknown | **Admin login** (if hash is reversed or rainbow-tabled). |
| `CSRF_SECRET` | Signs CSRF tokens. | Critical (90d) | Unknown | **CSRF bypass.** All CSRF protection defeated. |
| `ACCESS_COOKIE_SECRET` | Encrypts access cookies. | Critical (90d) | Unknown | **Session hijacking.** Cookies can be forged or decrypted. |

### Tier 2 -- Standard (180-day rotation)

| Secret | Purpose | Rotation Policy | Last Rotation | Blast Radius if Compromised |
|---|---|---|---|---|
| `STRIPE_SECRET_KEY` | Stripe payment API authentication. | Standard (180d) | Unknown | **Financial exposure.** Charges, refunds, and customer data accessible. |
| `STRIPE_WEBHOOK_SECRET` | Validates Stripe webhook signatures. | Standard (180d) | Unknown | **Payment spoofing.** Fake payment events can be injected. |
| `STRIPE_DIAGNOSTIC_REPORT_WEBHOOK_SECRET` | Validates diagnostic report webhooks. | Standard (180d) | Unknown | **Webhook spoofing.** Fake diagnostic payment events. |
| `RESEND_API_KEY` | Resend email API authentication. | Standard (180d) | Unknown | **Email abuse.** Emails sent as the organization. |
| `RESEND_WEBHOOK_SECRET` | Validates Resend webhook signatures. | Standard (180d) | Unknown | **Webhook spoofing.** Fake email events injected. |
| `RECAPTCHA_SECRET_KEY` | Server-side reCAPTCHA validation. | Standard (180d) | Unknown | **Bot bypass.** reCAPTCHA verification can be faked. |
| `OPENAI_API_KEY` | OpenAI API access. | Standard (180d) | Unknown | **Cost exposure.** Unauthorized API usage billed to account. |
| `ANTHROPIC_API_KEY` | Anthropic API access. | Standard (180d) | Unknown | **Cost exposure.** Unauthorized API usage. |
| `DEEPSEEK_API_KEY` | DeepSeek API access. | Standard (180d) | Unknown | **Cost exposure.** Unauthorized API usage. |
| `GOOGLE_API_KEY` | Google API access. | Standard (180d) | Unknown | **Cost exposure.** Unauthorized Google API usage. |
| `GITHUB_SECRET` | GitHub OAuth client secret. | Standard (180d) | Unknown | **OAuth hijack.** GitHub auth flow can be intercepted. |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Google OAuth client secret. | Standard (180d) | Unknown | **OAuth hijack.** Google auth flow intercepted. |
| `SLACK_CLIENT_SECRET` | Slack OAuth client secret. | Standard (180d) | Unknown | **OAuth hijack.** Slack auth flow intercepted. |
| `SLACK_SIGNINGIN_TOKEN` | Slack signing/signing-in token. | Standard (180d) | Unknown | **Slack impersonation.** |
| `SLACK_VERIFICATION_TOKEN` | Slack event verification. | Standard (180d) | Unknown | **Webhook spoofing.** Fake Slack events injected. |
| `OAUTH_TOKEN_ENCRYPTION_KEY` | Encrypts OAuth tokens at rest (AES-256-GCM). | Standard (180d) | Unknown | **Token exposure.** All stored OAuth tokens decrypted. |
| `CRON_SECRET` | Authenticates cron job requests. | Standard (180d) | Unknown | **Cron abuse.** Unauthorized cron jobs triggered. |
| `INNER_CIRCLE_JWT_SECRET` | Signs Inner Circle JWTs. | Standard (180d) | Unknown | **IC auth bypass.** Inner Circle tokens forged. |
| `INNER_CIRCLE_KEY_SECRET` | Encrypts Inner Circle keys. | Standard (180d) | Unknown | **IC key exposure.** Member keys decrypted. |
| `INNER_CIRCLE_ADMIN_KEY` | Inner Circle admin auth. | Standard (180d) | Unknown | **IC admin access.** Full IC admin control. |
| `ENTERPRISE_ALIGNMENT_INVITE_SECRET` | Signs enterprise invite tokens. | Standard (180d) | Unknown | **Invite forgery.** Fake enterprise invites created. |
| `TEAM_ASSESSMENT_INVITE_SECRET` | Signs team assessment invites. | Standard (180d) | Unknown | **Invite forgery.** |
| `DIAGNOSTIC_HMAC_SECRET` | HMAC signing for diagnostic data. | Standard (180d) | Unknown | **Data tampering.** Diagnostic results can be forged. |
| `DIAGNOSTIC_WATERMARK_SECRET` | Watermarks diagnostic PDFs. | Standard (180d) | Unknown | **Watermark bypass.** Diagnostic PDFs created without tracking. |
| `DOWNLOAD_TOKEN_SECRET` | Signs download tokens. | Standard (180d) | Unknown | **Unauthorized downloads.** Premium content accessed freely. |
| `ARTIFACT_ACCESS_SECRET` | Authenticates artifact access. | Standard (180d) | Unknown | **Artifact exposure.** Protected artifacts accessed. |
| `OGR_SESSION_SECRET` | Signs OGR sessions. | Standard (180d) | Unknown | **OGR session forgery.** |
| `OGR_SOVEREIGN_KEY` | OGR sovereign authentication. | Standard (180d) | Unknown | **Sovereign impersonation.** |
| `SOVEREIGN_ACCESS_KEY` | Sovereign access authentication. | Standard (180d) | Unknown | **Sovereign bypass.** |
| `NOTIFICATION_WEBHOOK_URL` | Discord/Slack notification webhook. | Standard (180d) | Unknown | **Notification spam.** Arbitrary messages sent to channels. |
| `CRM_API_KEY` | HubSpot/CRM API key. | Standard (180d) | Unknown | **CRM data exposure.** Customer data accessible. |
| `HUBSPOT_ACCESS_TOKEN` | HubSpot access. Falls back to `CRM_API_KEY`. | Standard (180d) | Unknown | **CRM access.** |
| `MFA_ENCRYPTION_KEY` | Encrypts MFA secrets. | Standard (180d) | Unknown | **MFA bypass.** TOTP secrets exposed. |
| `MFA_BACKUP_CODE_PEPPER` | Peppers MFA backup codes. Falls back to `MFA_ENCRYPTION_KEY`. | Standard (180d) | Unknown | **MFA bypass.** Backup codes predictable. |
| `SECURE_CLIENT_STATE_SECRET` | Signs client-side state. | Standard (180d) | Unknown | **State tampering.** Client state forged. |

### Tier 3 -- Annual (365-day rotation)

| Secret | Purpose | Rotation Policy | Last Rotation | Blast Radius if Compromised |
|---|---|---|---|---|
| `SYSTEM_INTEGRITY_SALT` | Salt for PDF/vault watermark integrity. | Annual | Unknown | **Watermark forgery.** Document integrity checks defeated. |
| `AOL_HASH_SALT` | Brand hash salt. | Annual | Unknown | **Hash prediction.** Brand hashes reversible. |
| `ANONYMITY_SALT` | Anonymization of user data. | Annual | Unknown | **De-anonymization.** Anonymous user data re-identified. |
| `DENYLIST_PEPPER` | Peppers denylist hashes. | Annual | Unknown | **Denylist bypass.** Denied entries not recognized. |
| `NEW_INTERNAL_SALT` | Internal operations salt. | Annual | Unknown | **Internal hash prediction.** |
| `NTERNAL_SALT` | Internal salt (likely typo of INTERNAL_SALT). | Annual | Unknown | **Internal hash prediction.** |
| `DYNAMIC_THRESHOLD_SALT` | Dynamic threshold computation. | Annual | Unknown | **Threshold manipulation.** |
| `AUDIT_EDGE_SECRET` | Audit edge authentication. | Annual | Unknown | **Audit tampering.** Audit logs manipulated. |

### Database Credentials

| Secret | Purpose | Rotation Policy | Last Rotation | Blast Radius if Compromised |
|---|---|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string (contains password). | Critical (90d) | Unknown | **Full database access.** All application data exposed, modified, or deleted. |
| `DIRECT_URL` | Direct (non-pooled) DB connection (contains password). | Critical (90d) | Unknown | **Full database access.** Same credentials as DATABASE_URL. |
| `INNER_CIRCLE_DB_URL` | Inner Circle database (contains password). | Critical (90d) | Unknown | **IC data exposure.** Inner Circle member data. |
| `MONGODB_URI` | MongoDB connection string (contains password). | Critical (90d) | Unknown | **MongoDB access.** Vault data exposed. |
| `REDIS_URL` | Redis connection (may contain password). | Standard (180d) | Unknown | **Cache/session access.** Cached data and sessions exposed. |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST API token. | Standard (180d) | Unknown | **Cache access.** Remote cache data exposed. |

---

## Rotation Procedure Checklist

When rotating any secret:

1. Generate new value with cryptographically secure randomness (`openssl rand -hex 32` or equivalent)
2. Update in Vercel environment variables (production, preview, development)
3. Update in `.env.local` for local development
4. Trigger a redeployment to pick up the new value
5. For secrets with fallback chains, rotate BOTH the primary and fallback secret
6. For database credentials, coordinate with connection pooler (Neon) to avoid downtime
7. For Stripe keys, update in Stripe dashboard first, then update env vars
8. For OAuth secrets, update in provider dashboard first, then update env vars
9. Log the rotation date in this ledger
10. Verify application functionality after rotation

---

## Rotation Log

| Date | Secret Rotated | Rotated By | Verified |
|---|---|---|---|
| -- | *No rotations recorded yet* | -- | -- |
