# Full System Map -- Abraham of London

Generated: 2026-05-07 | Audit scope: every public-facing surface, diagnostic flow, paid surface, email flow, download flow, admin surface, error state.

Auth model reference (from `proxy.ts`):
- **Tier 0 / Public** -- no auth required
- **Tier 1 / Member** -- NextAuth session required (prefixes: `/consulting`, `/strategy`)
- **Tier 2 / Inner Circle** -- AL access cookie required (prefixes: `/inner-circle`, `/private`, `/vault`, `/board`)
- **Tier 3 / Architect+** -- Admin role required (prefixes: `/inner-circle/admin`, `/api/admin`, `/directorate`)

`PUBLIC_PREFIXES` in proxy.ts additionally whitelist: `/diagnostics`, `/purpose-alignment`, `/strategy`, `/consulting`, `/speaking`, `/founders`, `/fatherhood`, `/leadership`, `/inner-circle/login`, `/admin/login`, `/restricted`.

---

## 1. Public Pages (no auth required)

### 1.1 Core Marketing / Institutional

| Path | Purpose | Key CTA | Mobile-critical |
|------|---------|---------|-----------------|
| `/` | Homepage -- institutional threshold. Displays product ladder, editorial rail, proof blocks, decision instruments with prices | Start diagnostic, Buy instrument, Join Inner Circle | Yes |
| `/about` | About the system -- decision authority positioning | Links to evidence, trust, diagnostics | Yes |
| `/about/founder` | Founder bio | Contact | Yes |
| `/method` | Explains the method: contradiction, consequence, decision | Start diagnostic, view instruments | Yes |
| `/trust` | Trust surface -- who this is for, what to expect | Links to evidence, foundations, playbooks | Yes |
| `/foundations` | Intellectual foundations -- scriptural, classical, historical sources | Read canon | Yes |
| `/verification` | Externally verifiable trust surface -- links to evidence, trust, privacy, security | Navigate to evidence | Yes |
| `/contact` | Contact form with enquiry type selector (reCAPTCHA protected) | Submit enquiry | Yes |
| `/contact/success` | Contact form success confirmation | Return home | No |

### 1.2 Content / Editorial (Public)

| Path | Purpose | Key CTA | Mobile-critical |
|------|---------|---------|-----------------|
| `/blog` | Editorial archive -- posts index with search | Read post | Yes |
| `/blog/[...slug]` | Individual blog post | Share, next post | Yes |
| `/canon` | Canon archive -- tiered access (public / inner-circle / restricted) | Read canon entry | Yes |
| `/canon/[slug]` | Individual canon entry | Next entry | Yes |
| `/canon/glossary` | Canon glossary | Browse terms | No |
| `/shorts` | Short-form content index -- category filters, list/grid modes | Read short | Yes |
| `/shorts/[...slug]` | Individual short | Like, Save, Share | Yes |
| `/books` | Books index | View book | Yes |
| `/books/[slug]` | Individual book page | Purchase / Read | Yes |
| `/books/the-architecture-of-human-purpose-landing` | Landing page for flagship book | Purchase | Yes |
| `/editorials` | Editorials index | Read editorial | Yes |
| `/editorials/[slug]` | Individual editorial | Cite, Share | Yes |
| `/editorials/catalogue` | Editorial catalogue browser | Browse | No |
| `/editorials/discovery` | Editorial discovery | Explore | No |
| `/lexicon` | Lexicon index | Browse terms | Yes |
| `/lexicon/[slug]` | Individual lexicon entry | Related terms | No |
| `/library` | Library index | Browse | Yes |
| `/library/[slug]` | Library entry | Download / Read | Yes |
| `/events` | Events index (upcoming, past, TBC) | Register | Yes |
| `/events/[slug]` | Individual event | Register / Buy ticket | Yes |
| `/events/success` | Event registration confirmation | Dashboard link | No |
| `/evidence` | Evidence index -- proof of system outcomes | View case | Yes |
| `/evidence/[slug]` | Individual evidence case | Next case | No |
| `/playbooks` | Playbooks index | Start playbook | Yes |
| `/playbooks/[slug]` | Individual playbook | Execute playbook | Yes |
| `/toolkits` | Toolkits index | Use toolkit | Yes |
| `/toolkits/[slug]` | Individual toolkit | Download / Use | No |
| `/resources` | Resources index | Browse | Yes |
| `/resources/[...slug]` | Individual resource | Download | Yes |
| `/resources/board-decision-log-template` | Board decision log template | Download | No |
| `/resources/strategic-frameworks` | Strategic frameworks index | View framework | Yes |
| `/resources/strategic-frameworks/[slug]` | Individual framework | Apply | No |
| `/resources/surrender-framework` | Surrender framework index | View | No |
| `/resources/surrender-framework/[slug]` | Individual surrender framework | Apply | No |

### 1.3 Content Types (Continued)

| Path | Purpose | Key CTA | Mobile-critical |
|------|---------|---------|-----------------|
| `/artifacts` | Artifacts index (premium archive / publications) | View artifact | Yes |
| `/artifacts/[id]` | Individual artifact detail | Access / Purchase | Yes |
| `/artifacts/global-market-outlook-q1-2026-public` | Public Q1 2026 market outlook | Read | No |
| `/intelligence/global-market-intelligence-q1-2026` | Global market intelligence report | Read | No |
| `/prints` | Prints index | View print | No |
| `/prints/[slug]` | Individual print | Purchase | No |
| `/content` | Content index | Browse | Yes |
| `/content/[...slug]` | Catch-all content page | Read | Yes |
| `/content/simple` | Simple content view | Read | No |
| `/registry` | Registry index | Browse | No |
| `/registry/[type]/[slug]` | Registry entry (pages dir) | View | No |
| `/[slug]` | Catch-all slug (pages dir) | Varies | Yes |

### 1.4 Sector / Audience Landing Pages

| Path | Purpose | Key CTA | Mobile-critical |
|------|---------|---------|-----------------|
| `/consulting` | Consulting services landing | Book consultation | Yes |
| `/consulting/interventions` | Interventions service page | Request intervention | Yes |
| `/speaking` | Speaking engagements landing | Enquire | Yes |
| `/founders` | Founders audience page | Start diagnostic | Yes |
| `/fatherhood` | Fatherhood audience page | Read / Subscribe | Yes |
| `/leadership` | Leadership audience page | Start diagnostic | Yes |
| `/institutional` | Institutional services page | Contact | Yes |
| `/education-research` | Education and research page | Learn more | Yes |
| `/media` | Media page | Press enquiry | Yes |
| `/brands` | Brands page | Partner | No |
| `/private-clients` | Private clients page | Contact | Yes |
| `/ventures` | Ventures index | Explore | No |
| `/ventures/[slug]` | Individual venture | Learn more | No |
| `/canon-campaign` | Canon campaign landing | Join | No |

### 1.5 Legal / Policy / Compliance

| Path | Purpose | Key CTA | Mobile-critical |
|------|---------|---------|-----------------|
| `/privacy` | Privacy policy | -- | Yes |
| `/terms` | Terms | -- | Yes |
| `/terms-of-service` | Full terms of service | -- | Yes |
| `/cookie-policy` | Cookie policy | -- | Yes |
| `/cookies` | Cookie settings | Manage cookies | Yes |
| `/security` | Security overview | -- | No |
| `/security-policy` | Security policy | -- | No |
| `/accessibility` | Accessibility statement | -- | No |
| `/accessibility-statement` | Alternative accessibility page | -- | No |
| `/why-not-ai` | Position on AI | -- | No |

### 1.6 Subscription / Newsletter

| Path | Purpose | Key CTA | Mobile-critical |
|------|---------|---------|-----------------|
| `/newsletter` | Inner Circle newsletter signup | Subscribe (email) | Yes |
| `/subscribe` | Founding Readers Circle signup | Subscribe (email) | Yes |

### 1.7 Miscellaneous Public

| Path | Purpose | Key CTA | Mobile-critical |
|------|---------|---------|-----------------|
| `/controls` | Controls page | -- | No |
| `/works-in-progress` | Works in progress listing | Browse | No |
| `/decision-paths` | Decision paths index | Choose path | Yes |
| `/chatham-rooms` | Chatham house rules rooms | Enter | No |

---

## 2. Diagnostic Surfaces

### 2.1 Diagnostic Ladder (public, no auth)

All diagnostics are public per `PUBLIC_PREFIXES`. This is the core product funnel.

| Path | Purpose | Duration | Key CTA | Mobile-critical |
|------|---------|----------|---------|-----------------|
| `/diagnostics` | Diagnostics hub -- the product ladder with 4 rungs + entry signals | Choose starting point | Yes |
| `/diagnostics/purpose-alignment` | **Stage 0**: Personal diagnostic. Free. Reads alignment across 6 domains | Complete 8-min assessment | Yes |
| `/diagnostics/fast` | **Fast diagnostic**: 5-step decision exposure instrument. Captures decision, authority, consequence, commitment | Complete steps, get result | Yes |
| `/diagnostics/constitutional-diagnostic` | **Stage 1**: Constitutional diagnostic. 6 min. Routes to STRATEGY/DIAGNOSTIC/REJECT with confidence score | Start diagnostic | Yes |
| `/diagnostics/team-assessment` | **Stage 2**: Team assessment. 10 min. Leader perception vs team perception gap analysis, fragility classification | Begin assessment | Yes |
| `/diagnostics/enterprise-assessment` | **Stage 3**: Enterprise assessment. 15 min. Structural pressure map, governance reliability, escalation routing | Begin assessment | Yes |
| `/diagnostics/enterprise` | Legacy enterprise assessment (likely redirects or parallel) | -- | No |
| `/diagnostics/executive-reporting` | **Stage 4**: Executive reporting. 12 min. Board-grade position, financial exposure, priority stack. PAID paywall gate | View / Purchase | Yes |
| `/diagnostics/executive-reporting/run` | Active executive reporting run. Shows trajectory, AI terrain, engagement readiness, board snapshot | Complete reporting | Yes |
| `/diagnostics/watch` | WATCH classification result page -- governed observation, monitoring cadence | Monitor | No |
| `/diagnostics/team-alignment` | Team alignment diagnostic variant | Begin | No |
| `/diagnostic` | Singular diagnostic entry (likely redirects) | -- | No |

### 2.2 Diagnostic Redirects

| Path | Destination | Type |
|------|-------------|------|
| `/diagnostics/directional-integrity` | `/diagnostics/constitutional-diagnostic` | Permanent redirect |

### 2.3 Decision Instruments (Public entry, Paid execution)

| Path | Purpose | Key CTA | Mobile-critical |
|------|---------|---------|-----------------|
| `/decision-instruments` | Index of 4 paid instruments with prices | Purchase instrument | Yes |
| `/decision-instruments/[slug]` | Individual instrument detail | Buy | Yes |
| `/decision-instruments/decision-exposure-instrument/start` | DEI start page | Begin | Yes |
| `/decision-instruments/decision-exposure-instrument/run` | DEI execution | Complete | Yes |
| `/decision-instruments/mandate-clarity-framework/start` | MCF start page | Begin | Yes |
| `/decision-instruments/mandate-clarity-framework/run` | MCF execution | Complete | Yes |
| `/decision-instruments/intervention-path-selector/start` | IPS start page | Begin | Yes |
| `/decision-instruments/intervention-path-selector/run` | IPS execution | Complete | Yes |
| `/decision-instruments/operator-decision-pack/start` | ODP start page | Begin | Yes |
| `/decision-instruments/operator-decision-pack/run` | ODP execution | Complete | Yes |

### 2.4 Assessment Surfaces (App Router)

| Path | Purpose | Auth | Mobile-critical |
|------|---------|------|-----------------|
| `/assessment/[token]` | Token-gated enterprise/team assessment response page (for campaign participants) | Token-based | Yes |
| `/assessment/success` | Post-assessment success confirmation | None | No |
| `/purpose-alignment` (app) | Purpose alignment parallel route (component wrapper) | Public | Yes |
| `/audit/[id]` | Sovereign telemetry audit entry (campaign participant) | DB lookup | No |
| `/audit/[id]/success` | Post-audit success page | None | No |

### 2.5 Outcome / Follow-up

| Path | Purpose | Auth | Mobile-critical |
|------|---------|------|-----------------|
| `/outcome/check` | 30-day outcome verification follow-up. Loads spine, asks if action was taken, classifies outcome | Spine-based | Yes |

---

## 3. Paid / Premium Surfaces

### 3.1 Strategy Room (Commercially gated via HMAC cookies, NOT sovereign auth)

| Path | Purpose | Auth | Key CTA | Mobile-critical |
|------|---------|------|---------|-----------------|
| `/strategy-room` | Highest-consequence page. Three states: GATE (locked) -> ENTRY BRIEF (paid) -> EXECUTION CHAMBER (active) | Stripe checkout / HMAC cookie | Purchase / Enter | Yes |
| `/strategy-room/session/[id]` | Active strategy room session | Commercial access | Execute | Yes |
| `/strategy-room/success` (app) | Post-purchase strategy room results page | Session-based | Download, next steps | No |
| `/consulting/strategy-room` | Legacy route -- permanent redirect to `/strategy-room` | -- | -- | -- |

### 3.2 Executive Reporting (Paid)

| Path | Purpose | Auth | Key CTA | Mobile-critical |
|------|---------|------|---------|-----------------|
| `/diagnostics/executive-reporting` | Gate page with paywall component. Checks if user has Stripe entitlement | Stripe checkout | Purchase / Unlock | Yes |
| `/diagnostics/executive-reporting/run` | Active execution. Board snapshot, trajectory, AI terrain, advantage path | Paid access | Complete, export | Yes |

### 3.3 Retainer Surface

| Path | Purpose | Auth | Mobile-critical |
|------|---------|------|-----------------|
| `/retainer` | Retainer client dashboard. Shows retained decisions, enforcement cycles, contract surface | Tier 2+ (access verified via `resolvePageAccess`) | No |

### 3.4 Return Briefs

| Path | Purpose | Auth | Mobile-critical |
|------|---------|------|-----------------|
| `/briefing/return/[sessionId]` (app) | Return brief -- makes inaction visible. Shows original contradiction, move, forecast, and asks what happened | Session-based (HMAC) | Yes |

### 3.5 Checkout / Payment Confirmation

| Path | Purpose | Auth | Mobile-critical |
|------|---------|------|-----------------|
| `/membership/success` | Post-membership purchase success page | NextAuth session required | No |
| `/events/success` | Event clearance confirmation | None (post-redirect) | No |

### 3.6 Premium Content

| Path | Purpose | Auth | Mobile-critical |
|------|---------|------|-----------------|
| `/premium/library` | Redirect to `/artifacts` | -- | -- |

### 3.7 Pricing

| Path | Purpose | Auth | Mobile-critical |
|------|---------|------|-----------------|
| `/(dashboard)/pricing` (app) | Pricing page | Layout-dependent | Yes |

---

## 4. Email Flows

### 4.1 Email Infrastructure

- **Provider**: Resend (via `lib/email/core/sendEmail.ts`)
- **Email types**: CONTACT, INNER_CIRCLE, INVITE, ENTERPRISE, SYSTEM, TRANSACTIONAL

### 4.2 Email Templates

| Template | Trigger | File |
|----------|---------|------|
| **Contact (internal)** | Contact form submission | `emails/ContactEmail.tsx` |
| **Contact teaser** | Contact form with teaser opt-in -- sends "Fathering Without Fear" first briefing | `components/emails/TeaserEmail.tsx` |
| **Inner Circle registration** | New Inner Circle signup -- sends access key + unlock URL | `lib/email/templates/InnerCircleEmail.tsx` |
| **Inner Circle resend** | Re-send access link | Same template, `mode: "resend"` |
| **Strategy Room accepted** | Strategy Room purchase confirmation | `emails/StrategyRoomAccepted.tsx` |
| **Nudge email** | Campaign participant nudge | `lib/mail/templates/nudge-email.tsx` |
| **Decision email** | Decision-related transactional emails | `lib/email/decision-email-builder.ts` |

### 4.3 Email Capture Points

| Surface | Capture mechanism |
|---------|-------------------|
| `/newsletter` | NewsletterForm component |
| `/subscribe` | NewsletterForm component |
| `/contact` | Contact form with newsletter opt-in |
| Diagnostic result pages | `ResultEmailCapture` component |
| Inner Circle registration | Email + name form on `/inner-circle` |

### 4.4 API Routes for Email

| Route | Purpose |
|-------|---------|
| `/api/contact` | Contact form submission + optional teaser email |
| `/api/newsletter` | Newsletter subscription |
| `/api/subscribe` | Subscription endpoint |
| `/api/verify-newsletter` | Newsletter email verification |
| `/api/inner-circle/register` | Inner Circle registration email |
| `/api/inner-circle/resend` | Resend access link |
| `/api/follow-up/register` | Register for outcome follow-up |
| `/api/follow-up/process` | Process follow-up emails |
| `/api/decision-instruments/send-purchase-email` | Instrument purchase confirmation |
| `/api/webhooks/resend` | Resend webhook handler |

---

## 5. Download Flows

### 5.1 Download Pages

| Path | Purpose | Auth | Mobile-critical |
|------|---------|------|-----------------|
| `/downloads` | Downloads index -- lists all available downloads with access level badges (public, inner-circle, private) | Varies by item | Yes |
| `/downloads/[...slug]` | Individual download page | Varies by item | Yes |
| `/downloads/vault` (app) | Vault downloads page | Tier 2 (inner circle) | No |

### 5.2 Download API Routes

| Route | Purpose | Auth |
|-------|---------|------|
| `/api/dl/[token]` | Token-gated download delivery | Token verification |
| `/api/downloads/resolve/[slug]` | Resolve download slug to asset | Public |
| `/api/downloads/resolve/[slug]/[...rest]` | Deep resolve for nested downloads | Public |
| `/api/downloads/instrument-pdf` | Instrument PDF delivery | Purchase verification |
| `/api/downloads/mdx` | MDX content download | Varies |
| `/api/downloads/[slug]` (app) | App router download handler | Varies |
| `/api/download/[token]` (app) | App router token download | Token |
| `/api/access/download` | Access-gated download | Access cookie |
| `/api/surrender/download/[id]` | Surrender framework download | Access check |
| `/api/premium/content/download/[id]` | Premium content download | Premium entitlement |

### 5.3 PDF Generation & Delivery

| Route | Purpose |
|-------|---------|
| `/api/generate-pdf` | Single PDF generation |
| `/api/generate-all-pdfs` | Batch PDF generation |
| `/api/generate-pdfs/batch` | Batch PDF generation (alt) |
| `/api/pdfs/generate` | PDF generation endpoint |
| `/api/pdfs/[id]` | PDF retrieval by ID |
| `/api/pdfs/[id]/generate` | Generate specific PDF |
| `/api/pdfs/list` | List all PDFs |
| `/api/assets/serve-pdf` | Serve PDF asset |
| `/api/assets/retrieve` | Retrieve asset |
| `/api/diagnostics/report/pdf` | Diagnostic report PDF |
| `/api/diagnostics/report/signed-url` | Signed URL for report PDF |
| `/api/diagnostics/reports/download` | Download diagnostic report |

### 5.4 Guarded PDF Access

From proxy.ts: any request matching `/assets/downloads/*.pdf` is intercepted and redirected to `/api/downloads/[slug]` (307 redirect). This forces all PDF downloads through the entitlement check layer.

---

## 6. Admin / Internal

### 6.1 Admin Pages (Tier 3 -- admin role required, IP-restricted in production)

| Path | Purpose |
|------|---------|
| `/admin` | Admin command center -- dashboard with links to all admin surfaces |
| `/admin/login` | Admin magic-link login (PUBLIC per proxy) |
| `/admin/access-keys` | Manage access keys |
| `/admin/access-revoke` | Revoke access keys |
| `/admin/assets` | Asset management |
| `/admin/authority-center` | Authority center |
| `/admin/calibration` | Calibration controls |
| `/admin/command-wall` | Command wall |
| `/admin/conversion-dashboard` | Conversion funnel dashboard |
| `/admin/enterprise-foundation` | Enterprise foundation admin |
| `/admin/enterprise-pipeline` | Enterprise pipeline |
| `/admin/intelligence` | Intelligence dashboard |
| `/admin/inner-circle/` | Inner Circle member management |
| `/admin/outcome-ledger` | Outcome ledger |
| `/admin/pdf-dashboard` | PDF generation dashboard |
| `/admin/pdf-status` | PDF status monitor |
| `/admin/proof` | Proof/evidence admin |
| `/admin/redis` | Redis admin |
| `/admin/validation` | Validation admin |

### 6.2 Admin Pages (App Router)

| Path | Purpose |
|------|---------|
| `/admin/audit` | Audit log viewer |
| `/admin/campaigns` | Campaign management |
| `/admin/campaigns/new` | Create new campaign |
| `/admin/campaigns/[id]` | Campaign detail + participant table + actions |
| `/admin/campaigns/[id]/report` | Campaign report |
| `/admin/commercial` | Commercial dashboard |
| `/admin/decision-intelligence` | Decision intelligence dashboard |
| `/admin/decision/efficacy` | Decision efficacy metrics |
| `/admin/decision/governance` | Decision governance alerts |
| `/admin/decision/performance` | Decision performance |
| `/admin/decision/contextual-efficacy` | Contextual efficacy |
| `/admin/decision/contextual-ranking` | Contextual ranking |
| `/admin/decision/metadata-audit` | Metadata audit |
| `/admin/organisations` | Organisation management |
| `/admin/organisations/new` | Create organisation |
| `/admin/organisations/[id]` | Organisation detail |
| `/admin/organisations/[id]/dashboard` | Org dashboard with OGR view |
| `/admin/organisations/[id]/report` | Org report |
| `/admin/organisations/[id]/campaigns/new` | New campaign for org |
| `/admin/reporting/executive/[id]` | Executive report viewer |
| `/admin/reporting/executive/[...slug]` | Executive report (slug variant) |
| `/admin/reports` | Reports management |
| `/admin/snapshot` | System snapshot |

### 6.3 Inner Circle Admin

| Path | Purpose |
|------|---------|
| `/inner-circle/admin` | IC admin index |
| `/inner-circle/admin/dashboard` | IC admin dashboard |
| `/inner-circle/admin/artifacts` | IC artifact management |
| `/inner-circle/admin/reports` | IC reports index |
| `/inner-circle/admin/reports/[id]` | IC report detail |

### 6.4 Directorate (Tier 3)

| Path | Purpose |
|------|---------|
| `/directorate/oversight` | Directorate oversight dashboard |
| `/directorate/dossier/[id]` | Individual dossier |

### 6.5 Internal / Debug Pages

| Path | Purpose |
|------|---------|
| `/debug/content` | Content debug viewer |
| `/dev/dashboard` | Development dashboard |
| `/test-readers` | Test readers utility |

### 6.6 Admin API Routes (Selected)

Total admin API routes: 50+. Key categories:
- `/api/admin/access-keys/*` -- key CRUD + revocation
- `/api/admin/campaigns/*` -- campaign management
- `/api/admin/diagnostics/*` -- diagnostic records, regeneration, retention
- `/api/admin/invites/*` -- invite management
- `/api/admin/members/*` -- member list, upgrade, revoke
- `/api/admin/reports/*` -- report queue, delivery
- `/api/admin/security/*` -- events, appeals, locks
- `/api/admin/jobs/*` -- dead letter queue, processing
- `/api/admin/system-health` -- system health check
- `/api/admin/pdf-analytics` -- PDF analytics
- `/api/admin/inner-circle/*` -- IC admin operations

---

## 7. Error States

### 7.1 Dedicated Error Pages

| Path | Type | Behaviour |
|------|------|-----------|
| `/404` (pages) | Custom 404 | "The archive exists. This address does not." -- Return Home CTA. `noindex,nofollow`. |
| `/500` (pages) | Custom 500 | "The archive is intact. The interface failed." -- Return Home CTA. `noindex,nofollow`. |
| `/_error` (pages) | Universal error handler | Handles both 404 and 500 via `getInitialProps`. Shows code-specific messaging. CTAs: Return Home, About. `noindex,nofollow`. No Layout wrapper (safe for SSR errors). |
| `/offline` (pages) | Service worker offline page | "Connection Interrupted" -- Retry button. Displayed when non-cached route requested without network. |
| `/restricted` (app) | Access restriction gate | Shows access key input form. Displayed for locked-down routes, maintenance, insufficient clearance. |

### 7.2 Error Boundaries (App Router)

| Path | Type |
|------|------|
| `/admin/error.tsx` (app) | Admin section error boundary |
| `/admin/campaigns/[id]/not-found.tsx` (app) | Campaign not-found handler |
| `/briefs/[slug]/not-found.tsx` (app) | Brief not-found handler |

### 7.3 System-Level Error Responses

| Trigger | Response |
|---------|----------|
| Global lockdown active (non-admin) | API: 503 `SYSTEM_LOCKED` with Retry-After. Page: redirect to `/restricted?reason=maintenance` |
| Rate limit exceeded | 429 `RATE_LIMIT_EXCEEDED` with retry headers |
| Constitutional access denied | API: 401 `CONSTITUTIONAL_ACCESS_REQUIRED`. Page: redirect to `/restricted` |
| Constitutional authority insufficient | API: 403 with reason. Page: redirect to `/auth/access-denied` |
| Admin IP not allowed | API: 403 `ACCESS_DENIED`. Page: redirect to `/auth/access-denied` |
| Tier check failed (unauthenticated) | API: 401 `AUTH_REQUIRED`. Page: redirect to login for tier |
| Tier check failed (insufficient clearance) | API: 403 `CLEARANCE_REQUIRED`. Page: redirect to `/auth/access-denied` |

---

## 8. Supplementary: Auth / Access Surfaces

| Path | Purpose | Auth |
|------|---------|------|
| `/auth/signin` | NextAuth sign-in page | Public |
| `/inner-circle` | Unified authentication gate -- register, enter key, or login | Public |
| `/inner-circle/login` | Inner Circle login | Public |
| `/inner-circle/unlock` | Unlock access with key | Public |
| `/inner-circle/resend` | Resend access link | Public |
| `/inner-circle/locked` | Locked state page | Public |
| `/inner-circle/insufficient-clearance` | Insufficient clearance notice | Public |
| `/inner-circle/dashboard` | IC member dashboard | Tier 2 |
| `/inner-circle/account` | IC account management | Tier 2 |
| `/inner-circle/briefs` | IC briefs index | Tier 2 |
| `/inner-circle/briefs/[...slug]` | IC individual brief | Tier 2 |
| `/inner-circle/reports` | IC reports index | Tier 2 |
| `/inner-circle/reports/[ref]` | IC individual report | Tier 2 |
| `/inner-circle-portal` | IC portal (legacy entry) | Tier 2 |
| `/access` | Access management index | Varies |
| `/access/accept` | Accept invite | Token-based |
| `/access/redeem` | Redeem access key | Key-based |
| `/my-access` | Re-exports `/my-instruments` | Session |
| `/my-instruments` | User's purchased instruments | Session |
| `/sovereign/authorize` | Sovereign authorization page | Sovereign |
| `/dashboard` | User dashboard | Session |
| `/dashboard/diagnostics` | User diagnostics dashboard | Session |
| `/client/dashboard` | Client dashboard | Client tier |

### App Router Auth/Dashboard Surfaces

| Path | Purpose | Auth |
|------|---------|------|
| `/dashboard/live` (app) | Live dashboard | Session |
| `/dashboard/pdf-analytics` (app) | PDF analytics dashboard | Session |
| `/dashboard/purpose-alignment` (app) | Purpose alignment dashboard | Session |
| `/(dashboard)/portfolio` (app) | Portfolio page | Session |
| `/settings/integrations` (app) | Integration settings (Google, Slack) | Session |
| `/pdf-dashboard` (app) | PDF dashboard (constitutional: PARTICIPANT min) | Constitutional |
| `/enterprise/alignment/campaigns/[campaignId]` (app) | Enterprise campaign alignment view | Session |

---

## 9. Supplementary: Sitemap / SEO Routes

| Path | Purpose |
|------|---------|
| `/[type]-sitemap.xml` | Dynamic sitemap by content type |
| `/blog-sitemap.xml` | Blog sitemap |
| `/books-sitemap.xml` | Books sitemap |
| `/canons-sitemap.xml` | Canons sitemap |
| `/downloads-sitemap.xml` | Downloads sitemap |
| `/events-sitemap.xml` | Events sitemap |
| `/inner-circle-sitemap.xml` | Inner circle sitemap |
| `/resources-sitemap.xml` | Resources sitemap |
| `/shorts-sitemap.xml` | Shorts sitemap |
| `/strategies-sitemap.xml` | Strategies sitemap |
| `/vault-sitemap.xml` | Vault sitemap |

---

## 10. Supplementary: Redirects

| Source | Destination | Type |
|--------|-------------|------|
| `/consulting/strategy-room` | `/strategy-room` | Permanent |
| `/diagnostics/directional-integrity` | `/diagnostics/constitutional-diagnostic` | Permanent |
| `/premium/library` | `/artifacts` | Temporary |
| `/my-access` | `/my-instruments` | Re-export |

---

## Surface Count Summary

| Category | Count |
|----------|-------|
| Public pages (no auth) | ~85 |
| Diagnostic surfaces | ~18 |
| Decision instruments | 9 (index + 4 instruments x start/run) |
| Paid/premium surfaces | ~8 |
| Email templates | 7 |
| Download routes | ~15 API routes |
| Admin pages | ~35 |
| Admin API routes | 50+ |
| Error states | 5 pages + 3 app error boundaries + 7 proxy error responses |
| Sitemap routes | 11 |
| Auth/access pages | ~20 |
| **Total mapped surfaces** | **~250+** |
