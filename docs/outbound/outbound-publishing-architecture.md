# Outbound Publishing Architecture

> Generated: 2026-05-22  
> Scope: Facebook, X (Twitter), LinkedIn — all three providers under `lib/outbound/` and `pages/api/admin/outbound/`

---

## Overview

Three production-active outbound publishing providers share the same admin root (`/admin/outbound/`) and follow the same governance pattern: OAuth → encrypted token storage → publish gate → audited publish attempt. No provider exposes a token to the client at any point.

---

## Provider Registry

`lib/outbound/provider-registry.ts`

| Provider  | Label         | Status  | Admin UI                  |
|-----------|---------------|---------|---------------------------|
| facebook  | Facebook      | active  | `/admin/outbound/facebook`|
| x         | X (Twitter)   | active  | `/admin/outbound/x`       |
| linkedin  | LinkedIn      | active  | `/admin/outbound/linkedin`|

---

## Facebook

### Environment Variables
| Variable                          | Purpose                                    |
|-----------------------------------|--------------------------------------------|
| `FACEBOOK_APP_ID`                 | Meta App ID for OAuth                      |
| `FACEBOOK_APP_SECRET`             | Meta App Secret                            |
| `FACEBOOK_PAGE_ID`                | Target Page ID                             |
| `FACEBOOK_PAGE_ACCESS_TOKEN`      | Fallback env-token (pre-OAuth path)        |
| `FACEBOOK_REDIRECT_URI`           | OAuth callback URL                         |
| `FACEBOOK_TOKEN_ENCRYPTION_KEY`   | AES-256-GCM key for token at rest          |
| `NEXT_PUBLIC_BASE_URL`            | Used to build callback URL                 |

### OAuth Routes
| Route                                              | Method | Purpose                                              |
|----------------------------------------------------|--------|------------------------------------------------------|
| `/api/admin/outbound/facebook/oauth/start`         | GET    | Generates state cookie, redirects to Meta Auth URL   |
| `/api/admin/outbound/facebook/oauth/callback`      | GET    | Validates state, exchanges code, stores encrypted token |

### Diagnostics Route
`GET /api/admin/outbound/facebook/diagnostics`  
Returns `FacebookConnectionStatus` — never includes token values.

### Publish Route
`POST /api/admin/outbound/facebook/publish`  
Body: `{ slug, assetType, customTitle?, customText?, customLink?, customImagePath?, finalApproval, dryRun, syncToX? }`

### Token Storage Model
`prisma/schema.prisma` → `FacebookOAuthConnection`  
Fields: `encryptedPageAccessToken`, `pageId`, `pageName`, `scopesJson`, `connectedAt`, `expiresAt`, `revokedAt`

### Encryption Mechanism
`lib/outbound/facebook-token-encryption.ts`  
AES-256-GCM. Key from `FACEBOOK_TOKEN_ENCRYPTION_KEY`. Format: `ivHex:tagHex:encHex`. Missing key → throws in production (fail-closed). IV is random per encryption.

### Required Permissions
`pages_manage_posts`, `pages_read_engagement`  
Additional granted: `pages_show_list`

### Publish Gate
`lib/outbound/facebook-publish-gate.ts` → `canPublishFacebookPost(asset, connection)`

Checks:
- Asset not null
- Connection active + canPublish
- Required permissions present (deduplicated)
- Link domain in `FACEBOOK_ALLOWED_LINK_PREFIXES` (or null)
- Image path in `FACEBOOK_ALLOWED_IMAGE_PREFIXES` (or null)
- Text not empty, ≤ 2200 chars
- Text does not start with MDX frontmatter (`---`)
- No disallowed claims: "AI predicts", "guaranteed", "investment advice"
- Title not empty
- Warning: internal control language detected
- Warning: env_token connection (recommend OAuth)

### Audit Events
`lib/outbound/facebook-publishing-audit.ts`

| Event                          | Trigger                                   |
|--------------------------------|-------------------------------------------|
| `FACEBOOK_OAUTH_CONNECTED`     | Successful OAuth callback                 |
| `FACEBOOK_OAUTH_REVOKED`       | (not yet wired — reserved)                |
| `FACEBOOK_PUBLISH_DRY_RUN`     | dryRun=true publish attempt               |
| `FACEBOOK_PUBLISH_BLOCKED`     | Gate blocked, attempt recorded            |
| `FACEBOOK_PUBLISH_FAILED`      | API call failed                           |
| `FACEBOOK_POST_PUBLISHED`      | Successful publish                        |
| `FACEBOOK_TOKEN_INVALID`       | Token decryption or auth failure          |
| `FACEBOOK_SYNCED_FROM_X`       | Post triggered via X→FB sync             |

### Admin UI Page
`pages/admin/outbound/facebook.tsx`  
Shows: connection status, page name, granted/missing permissions, asset cards with gate results, char count, dryRun, final approval, syncToX (if X connected), attempt history with xSync badge.

### Sync Capabilities
- **FB → X**: If `syncToX=true` in publish body, adapter calls `adaptFacebookTextToTweet()` then `publishTweetToX()`. Secondary failure does not fail the primary Facebook post.
- **X → FB**: If `syncToFacebook=true` in X publish body, calls `publishLinkPostToFacebook()`. Secondary failure does not fail primary X post.

### Rate-Limit Scope
`FACEBOOK_OUTBOUND_PUBLISH` — 10 / 3600s

### Failure States
| State            | Meaning                                         |
|------------------|-------------------------------------------------|
| `not_connected`  | No token in DB and no env token                 |
| `env_token`      | Using `FACEBOOK_PAGE_ACCESS_TOKEN` (not OAuth)  |
| `oauth`          | Full OAuth connection active                    |
| `expired`        | Token past `expiresAt`                          |
| `revoked`        | Manually revoked                                |
| `invalid`        | Decryption failed or unexpected DB state        |

---

## X (Twitter)

### Environment Variables
| Variable                        | Purpose                                      |
|---------------------------------|----------------------------------------------|
| `X_CLIENT_ID`                   | Twitter API v2 OAuth 2.0 Client ID           |
| `X_CLIENT_SECRET`               | Twitter API v2 Client Secret (optional PKCE) |
| `X_REDIRECT_URI`                | OAuth callback URL                           |
| `X_TOKEN_ENCRYPTION_KEY`        | AES-256-GCM key for token at rest            |

### OAuth Routes
| Route                                         | Method | Purpose                                              |
|-----------------------------------------------|--------|------------------------------------------------------|
| `/api/admin/outbound/x/oauth/start`           | GET    | Generates PKCE verifier+challenge, sets two cookies, redirects to Twitter |
| `/api/admin/outbound/x/oauth/callback`        | GET    | Validates state cookie + verifier, exchanges code with PKCE, stores encrypted tokens |

PKCE: code_verifier (32 random bytes, base64url), code_challenge (SHA256 of verifier, base64url).  
State cookie: base64url JSON with `{nonce, returnTo}`. returnTo sanitised to `/admin/*` only.

### Diagnostics Route
`GET /api/admin/outbound/x/diagnostics`  
Returns `XConnectionStatus` — never includes token values.

### Publish Route
`POST /api/admin/outbound/x/publish`  
Body: `{ slug?, assetType?, customTitle?, customText?, customLink?, finalApproval, dryRun, syncToFacebook?, facebookText?, facebookLink? }`

### Token Storage Model
`prisma/schema.prisma` → `XOAuthConnection`  
Fields: `userId`, `username`, `encryptedAccessToken`, `encryptedRefreshToken`, `scopesJson`, `connectedAt`, `expiresAt`, `revokedAt`  
Attempt log: `XPublishAttempt` — `assetType`, `assetSlug`, `assetTitle`, `status`, `tweetId`, `tweetUrl`, `syncedFromFacebook`, `errorCode`, `errorMessageSafe`, `actorEmailHash`, `requestId`, `dryRun`

### Encryption Mechanism
`lib/outbound/x-token-encryption.ts`  
AES-256-GCM. Key from `X_TOKEN_ENCRYPTION_KEY` (falls back to `LINKEDIN_TOKEN_ENCRYPTION_KEY` in dev only). Format: `ivHex:tagHex:encHex`. Missing key → throws (fail-closed). Random IV per call.

### Required Scopes
`tweet.read`, `tweet.write`, `users.read`, `offline.access`

### Token Refresh
`resolveXAccessToken()` in `lib/outbound/x-oauth.ts`: reads from DB, checks expiry, auto-refreshes when `encryptedRefreshToken` exists. Uses HTTP Basic auth if `X_CLIENT_SECRET` set, otherwise public PKCE client.

### Publish Gate
`lib/outbound/x-publish-gate.ts` → `canPublishXPost(asset, connection)`

Checks:
- Asset not null
- Connection not null + `canPublish`
- `tweet.write` scope present
- Text not empty
- Text ≤ 280 weighted chars (`countTweetChars` — URLs count as 23)
- Text does not start with MDX frontmatter
- No disallowed claims: "AI predicts", "guaranteed", "investment advice", "buy now/today", "guarantee"
- Link domain in `X_ALLOWED_LINK_PREFIXES` (or null)
- Title not empty
- Warning: internal control language

### Character Counting
`countTweetChars(text)`: replaces all URLs with a 23-char placeholder before `length`, matching Twitter's t.co behaviour.

### Audit Events
`lib/outbound/x-publishing-audit.ts`

| Event                      | Trigger                                       |
|----------------------------|-----------------------------------------------|
| `X_OAUTH_STARTED`          | OAuth start route called                      |
| `X_OAUTH_CONNECTED`        | Successful callback + token stored            |
| `X_OAUTH_FAILED`           | OAuth exchange failed                         |
| `X_PUBLISH_DRY_RUN`        | dryRun=true                                   |
| `X_PUBLISH_BLOCKED`        | Gate blocked                                  |
| `X_PUBLISH_FAILED`         | API call failed                               |
| `X_POST_PUBLISHED`         | Successful tweet                              |
| `X_TOKEN_INVALID`          | Token resolution failed                       |
| `X_SYNCED_FROM_FACEBOOK`   | X post triggered via FB→X sync               |
| `X_SYNCED_FROM_X`          | (reserved)                                    |

### Admin UI Page
`pages/admin/outbound/x.tsx`  
Shows: connection status, @handle, userId, scopes (granted/missing), CharBar component (count/280, colour-coded), asset cards with gate result, dryRun, final approval, syncToFacebook checkbox (shown only if Facebook connected), attempt history with syncedFromFacebook badge.

### Sync Capabilities
- **X → FB**: If `syncToFacebook=true`, checks `getFacebookConnectionStatus().canPublish`, calls `publishLinkPostToFacebook()`. Failure does not fail primary X post.
- **FB → X**: Handled on the Facebook publish route.

### Rate-Limit Scope
`X_OUTBOUND_PUBLISH` — 10 / 3600s

### Failure States
| State           | Meaning                                      |
|-----------------|----------------------------------------------|
| `not_connected` | No record in `XOAuthConnection`              |
| `oauth`         | Active OAuth connection                      |
| `expired`       | Token past `expiresAt` (refresh attempted)   |
| `revoked`       | Revoked by admin or API rejection            |
| `invalid`       | Unexpected DB or decryption state            |

---

## LinkedIn

### Environment Variables
| Variable                            | Purpose                                              |
|-------------------------------------|------------------------------------------------------|
| `LINKEDIN_CLIENT_ID` (legacy)       | Legacy app client ID                                 |
| `LINKEDIN_CLIENT_SECRET` (legacy)   | Legacy app client secret                             |
| `LINKEDIN_REDIRECT_URI` (legacy)    | OAuth callback for legacy app                        |
| `LINKEDIN_CLIENT_ID_COMMUNITY`      | Community app client ID                              |
| `LINKEDIN_CLIENT_SECRET_COMMUNITY`  | Community app client secret                          |
| `LINKEDIN_REDIRECT_URI_COMMUNITY`   | OAuth callback for community app                     |
| `LINKEDIN_TOKEN_ENCRYPTION_KEY`     | AES-256-GCM key for tokens at rest                   |
| `LINKEDIN_ORGANIZATION_URN`         | `urn:li:organization:{id}` for org publishing        |
| `LINKEDIN_DEFAULT_OWNER_TYPE`       | `"organization"` or `"member"` (default: org)        |
| `LINKEDIN_PUBLISHING_ENABLED`       | Must be `"true"` to allow publishing                 |
| `CSRF_SECRET` / `NEXTAUTH_SECRET`   | Used to sign OAuth state (HMAC-SHA256)               |
| `LINKEDIN_ACTIVE_PROFILE`           | `"legacy"` or `"community"` (active app profile)     |

### OAuth Routes
| Route                                              | Method | Purpose                                              |
|----------------------------------------------------|--------|------------------------------------------------------|
| `/api/admin/outbound/linkedin/oauth/start`         | GET    | Builds auth URL with HMAC-signed state, redirects    |
| `/api/admin/outbound/linkedin/oauth/callback`      | GET    | Validates signed state, exchanges code, upserts connection |

State: base64url JSON `{nonce, profileKey, returnTo, issuedAt}` + `.HMAC-SHA256-signature`. Signature verified with `crypto.timingSafeEqual`. returnTo locked to `/admin/outbound/linkedin`.

### Diagnostics Route
`GET /api/admin/outbound/linkedin/diagnostics`  
Returns `LinkedInConnectionStatus` — never includes token values.

### Publish Route
`POST /api/admin/outbound/linkedin/publish`  
Body: `{ slug, confirm }` (`confirm` must be `true`)

### Token Storage Model
`prisma/schema.prisma` → `LinkedInPublishingConnection`  
Unique constraint: `(provider, profileKey, ownerType)`  
Fields: `profileKey`, `ownerType` (member/organization), `ownerUrn`, `accountMemberId`, `ownerName`, `displayName`, `isDefaultPublishingTarget`, `requiredScope`, `encryptedAccessToken`, `encryptedRefreshToken`, `expiresAt`, `scope`, `status`, `lastValidationStatus`, `lastVerifiedAt`  
Attempt log: `LinkedInPublishAttempt`

### Encryption Mechanism
`lib/outbound/linkedin-token-encryption.ts`  
AES-256-GCM. Key from `LINKEDIN_TOKEN_ENCRYPTION_KEY`. Fail-closed on missing key.

### Profile Architecture (Dual-App)
`lib/integrations/linkedin/linkedin-app-profile.ts`  
Two OAuth app profiles: `legacy` and `community`. Active profile selected via `LINKEDIN_ACTIVE_PROFILE`. Each has its own `clientId`, `clientSecret`, `redirectUri`, and `requiredScopes`.

### Required Scopes
- Organization publishing: `w_organization_social`
- Member publishing: `w_member_social`
- Also required: `openid`, `profile` (for user info)

### Publish Gate
`lib/outbound/linkedin-publish-gate.ts` → `canPublishLinkedInOutbound(item, context)`

Checks:
- Item not null
- `draft !== true`, `status !== "draft"`, `status !== "posted"`, `status !== "retired"`
- Status must be `"ready"` or `"published"`
- `published === true` or `release === true`
- `validateLinkedInOutboundItem(item)` governance check
- If `linkedReportId` present: record must exist, lifecycle must be `ACTIVE` or `ACTIVE_UNTIL_SUPERSEDED`
- Hard block on `GMI-Q2-2026` while draft
- `claimRisk === "HIGH"` requires `manualApprovalNote`
- Connection active + `publishingEnabled === true` + required scope present
- selectedPublishingTarget must be set; organization target requires `ownerUrn`
- Text not empty, ≤ 3000 chars (configurable)
- Text does not start with `---` (frontmatter)
- Disallowed claims: "AI predicts", "guaranteed", "investment advice", Q2 report availability phrase
- Warning: internal control language

### Audit Events
`lib/outbound/linkedin-publishing-audit.ts`

| Event                          | Trigger                         |
|--------------------------------|---------------------------------|
| `LINKEDIN_OAUTH_CONNECTED`     | OAuth callback success          |
| `LINKEDIN_OAUTH_REVOKED`       | Manual revoke                   |
| `LINKEDIN_PUBLISH_GATE_RUN`    | Gate evaluated                  |
| `LINKEDIN_PUBLISH_BLOCKED`     | Gate blocked                    |
| `LINKEDIN_POST_PUBLISHED`      | Successful post                 |
| `LINKEDIN_POST_FAILED`         | API failure                     |

### Admin UI Page
`pages/admin/outbound/linkedin.tsx`  
Shows: dual-profile connection status, selectedPublishingTarget, scopes, org URN, publishing target status badges, asset cards with gate result, claim risk, char count, confirm button, attempt history.

### Sync Capabilities
None currently. LinkedIn does not participate in bidirectional sync with Facebook or X.

### Rate-Limit Scope
No LinkedIn-specific rate-limit scope defined yet (`FACEBOOK_OUTBOUND_PUBLISH` and `X_OUTBOUND_PUBLISH` exist; LinkedIn publish route does not call `checkRateLimit`).

### Failure States
| State           | Meaning                                         |
|-----------------|-------------------------------------------------|
| `not_connected` | No record in `LinkedInPublishingConnection`     |
| `active`        | Connected and token valid                       |
| `expired`       | Token past `expiresAt`                          |
| `revoked`       | Admin or API revoke                             |
| `invalid`       | Unexpected state or decryption failure          |

---

## Shared Infrastructure

### Admin Guard
`lib/access/server`
- API routes: `requireAdminApi(req, res)` — returns null (already sent 401) or session guard
- Page routes: `requireAdminPage(ctx)` — redirects to login if not admin

### Audit Infrastructure
`lib/server/audit` → `logAuditEvent(input)`  
All three providers wrap calls in a `*AuditSafe()` helper that catches errors and returns `{ok, warning?}` — audit failure never blocks publishing.

Standard audit fields: `actorType`, `actorId`, `action`, `resourceType`, `resourceId`, `resourceName`, `status`, `severity`, `requestId`, `tags`, `metadata`

### Rate Limiting
`lib/server/rate-limit` → `checkRateLimit({scope, identifier, limit, windowSeconds})`  
Postgres-primary. Identifiers are HMAC-hashed before storage. Fail-closed on DB unavailability.

| Scope                       | Limit      | Window   |
|-----------------------------|------------|----------|
| `FACEBOOK_OUTBOUND_PUBLISH` | 10         | 3600s    |
| `X_OUTBOUND_PUBLISH`        | 10         | 3600s    |
| LinkedIn                    | Not wired  | —        |

### Content Resolvers
- `lib/outbound/facebook-content-resolver.ts` — `getFacebookAssetBySlug()`, `getBlogSeriesFacebookAssets()`
- `lib/outbound/x-content-resolver.ts` — `getXAssetBySlug()`, `getBlogSeriesXAssets()`, `adaptFacebookTextToTweet()`, `buildCustomXAsset()`
- `lib/outbound/linkedin-content-resolver.ts` — `getResolvedLinkedInOutboundBySlug()`, `getResolvedLinkedInOutboundAssets()`

### Token Encryption Pattern (all three providers)
```
AES-256-GCM
Key source: provider-specific env var
IV: crypto.randomBytes(16) — unique per encryption call
Ciphertext format: {ivHex}:{tagHex}:{encHex}
Missing key: throws (fail-closed) — never silently degrades
```

### Shared Disallowed Claims (all three providers)
- "AI predicts"
- "guaranteed" / "guarantee"
- "investment advice"
- "buy now" / "buy today"
- Q2 report availability assertions while report is in draft

### Shared Internal Control Language Warning
Triggers a warning (not a blocker) if text contains: `release gate`, `quality gate`, `lifecycle state`, `contentlayer`

---

## Gaps and Consolidation Targets

| Gap                                              | Phase |
|--------------------------------------------------|-------|
| No shared provider contract type                 | 2     |
| Policy gate logic duplicated 3×                  | 3     |
| Asset resolution scattered across 3 resolvers    | 4     |
| Token audit coverage needs test suite            | 5     |
| FB and X OAuth state not HMAC-signed (LI is)    | 6     |
| No unified audit shape across providers          | 7     |
| Sync orchestration inline in publish routes      | 8     |
| No shared UI components for connection panels    | 9     |
| No LinkedIn rate-limit scope                     | 3/10  |
| No `dryRun` on LinkedIn publish route            | 10    |

---

## Contentlayer Indexing Policy

### Scope
All filesystem outbound content under `content/outbound/[provider]` is Contentlayer-indexed for inventory visibility and build-time schema hygiene.

Three document types exist, one per provider:

| Document Type       | Provider  | File Pattern                              | Count |
|---------------------|-----------|-------------------------------------------|-------|
| `LinkedInOutbound`  | linkedin  | `outbound/linkedin/**/*.{md,mdx}`         | 43    |
| `FacebookOutbound`  | facebook  | `outbound/facebook/**/*.{md,mdx}`         | 10    |
| `XOutbound`         | x         | `outbound/x/**/*.{md,mdx}`               | 25    |

### Classification ≠ Publication
- Contentlayer classification is **not** publication approval.
- Provider queues and publish routes still use the governed outbound loaders and validators as the source of publishing readiness.
- Contentlayer schemas are intentionally **permissive** — all fields are optional at the Contentlayer level to avoid blocking builds on metadata incompleteness.

### Publication Approval
Publication approval is controlled by:
- `approvalStatus` and `requiresFinalApproval` frontmatter fields
- Provider-specific publish gates (`*-publish-gate.ts`)
- Ledger idempotency checks
- Scheduler eligibility
- Admin action via publish routes

### Strict Validation
Strict field requirements per provider are enforced by dedicated validator scripts, not by Contentlayer:

| Script                                    | Scope                          |
|-------------------------------------------|--------------------------------|
| `scripts/validate-outbound-content.mjs`   | All outbound content           |
| `scripts/check-editorial-style.mjs`       | Style and spelling             |
| `scripts/audit/verify-linkedin-outbound.ts` | LinkedIn-specific checks     |

These validators enforce required fields by provider and status. No publishable outbound item can pass without required metadata.

### Public Surface Exclusion

Outbound Contentlayer documents are **internal publishing inventory records**. They are indexed for schema hygiene and admin tooling only. They are **not public content** and must be excluded from public archives, search, sitemap, RSS, and public document APIs.

The exclusion is enforced at the data layer in `lib/contentlayer-helper.ts`:

```typescript
const INTERNAL_DOC_TYPES = new Set([
  "LinkedInOutbound",
  "FacebookOutbound",
  "XOutbound",
]);
```

The `getAllContentlayerDocs()` function filters out any document whose `type` field matches these values or whose raw path starts with `outbound/`. This ensures:

- `allDocuments` (and its Proxy in `lib/contentlayer.ts`) never includes outbound docs
- `getAllCombinedDocs()` (used by sitemap generators) never includes outbound docs
- `getDocBySlug()` cannot resolve outbound document slugs
- Per-kind loaders (`getAllPosts()`, `getAllShorts()`, etc.) are unaffected since outbound docs never match known `DocKind` values
- The library index (`buildLibraryIndex()`) only uses per-kind loaders, so outbound docs are naturally excluded
- The search index (`buildSearchIndex()`) iterates over `documentKinds` which does not include outbound types

**If a new public content consumer is added**, ensure it either:
1. Uses per-kind loaders only (preferred), or
2. Explicitly filters out `INTERNAL_DOC_TYPES` from any `allDocuments`-style aggregation
