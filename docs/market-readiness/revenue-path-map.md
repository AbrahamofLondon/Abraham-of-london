# Revenue Path Map — Abraham of London

**Audit date:** 2026-05-07
**Source:** lib/commercial/catalog.ts (single source of truth), checkout routes, webhook handlers, pricing engines

---

## Catalog Summary

The product catalog (`lib/commercial/catalog.ts`) defines **18 products** across 7 layers. Of these, **9 are active and paid**, 3 are active and free, and 6 are inactive/placeholder.

| # | Product | Price | Status | Access Type |
|---|---------|-------|--------|-------------|
| 1 | Decision Exposure Instrument | £29 | Active | One-time |
| 2 | Mandate Clarity Framework | £49 | Active | One-time |
| 3 | Intervention Path Selector | £79 | Active | One-time |
| 4 | Operator Decision Pack (bundle: 1+2+3) | £129 | Active | One-time |
| 5 | Case Dossier — Tariff Shock | Free | Active | Free |
| 6 | Case Dossier — Team Alignment | Free | Active | Free |
| 7 | Case Dossier — Escalation Denied | Free | Active | Free |
| 8 | Global Market Intelligence Report Q1 2026 | £59 | Active | One-time |
| 9 | Executive Reporting | £295 | Active | One-time |
| 10 | Diagnostic Report — Basic | £250 | **Inactive** | One-time |
| 11 | Diagnostic Report — Pro | £750 | **Inactive** | One-time |
| 12 | Executive Reporting — Advanced | £295 | Active | One-time |
| 13 | Strategy Room — Entry | £750 | Active | One-time |
| 14 | Strategy Room — Active/Multi-Decision | £1,250 | Active | One-time |
| 15 | Inner Circle | £30/mo | **Inactive** | Subscription |
| 16 | Retainer — Core | Contracted monthly | **Inactive** | Subscription |
| 17 | Retainer — Operational | Contracted monthly | **Inactive** | Subscription |
| 18 | Retainer — Institutional | Contracted monthly | **Inactive** | Subscription |

Currency: GBP throughout.

---

## Revenue Path 1: Decision Instruments (£29–£129)

### Entry trigger
User visits `/decision-instruments/[slug]`, reads instrument landing page, clicks checkout button.

### Checkout flow
1. `CheckoutButton` component (`components/commercial/CheckoutButton.tsx`) collects email inline (shown on first click if no email provided).
2. POST to `/api/billing/checkout` with `productCode`, `email`, `originPath`.
3. Checkout handler resolves product identity via `resolveProductIdentity()`, validates email, runs `checkDoNotSellGate()` (only active for products that require a completed diagnostic), validates via `checkCheckoutEligibility()`.
4. Stripe Checkout Session created with embedded `stripePriceId` from catalog.
5. User redirected to Stripe-hosted checkout.
6. On success, Stripe redirects to `successPath` (e.g., `/decision-instruments/decision-exposure-instrument/start`).
7. Webhook at `/api/billing/webhook` grants entitlement via `grantEntitlement()`, records audit log in `accessAuditLog`, runs `ensureEntitlementAfterPayment()` verification, resolves bundle entitlements if applicable.

### Fulfillment
- Entitlement slug stored in database.
- User accesses instrument run page (e.g., `/decision-instruments/decision-exposure-instrument/run`).
- Operator Decision Pack (£129) grants all 3 individual instruments as bundle entitlements via `resolveEntitlementSlugs()`.

### Price points
- Decision Exposure Instrument: £29 (Stripe price `price_1TP1XIQFpelVFMXJ35YurntT`)
- Mandate Clarity Framework: £49 (Stripe price `price_1TP1ZaQFpelVFMXJovfynFoS`)
- Intervention Path Selector: £79 (Stripe price `price_1TP1dRQFpelVFMXJvVlFQjWH`)
- Operator Decision Pack: £129 (Stripe price `price_1TP1idQFpelVFMXJG77Vj5bE`)

### Failure modes
- Stripe key not configured: returns 500 `STRIPE_NOT_CONFIGURED`
- Product inactive: returns 400 `PRODUCT_INACTIVE`
- Email missing: returns 400 `EMAIL_REQUIRED`
- Stripe session creation fails: returns 502 `STRIPE_CHECKOUT_CREATE_FAILED`
- Webhook entitlement sync fails: returns 500 `ENTITLEMENT_SYNC_FAILED` (payment taken but entitlement not granted — self-repair attempted via `ensureEntitlementAfterPayment`)

---

## Revenue Path 2: Strategy Room (£750–£1,250)

### Entry trigger
User completes a diagnostic, views Executive Reporting results, sees `StrategyRoomConversionBridge` component at bottom of report. Two tiers are offered:
- **Entry** (£750): "One controlled execution environment for the active decision."
- **Active / Multi-Decision** (£1,250): "Execution sequencing across multiple linked decisions."

### Checkout flow
Same Stripe flow as Decision Instruments via `/api/billing/checkout`. `StrategyRoomConversionBridge` collects email via inline input, POSTs to checkout endpoint.

### Fulfillment
- Entitlement: `strategy-room.entry` or `strategy-room-extended`
- Cookie set: `aol_paid_strategy_room`
- Redirects to `/strategy-room` where AI-powered session begins
- Strategy room has session init (`/api/strategy-room/session/init`), follow-up, results, execution flow, and briefing/return mechanisms

### Do-Not-Sell gate
`checkDoNotSellGate()` in `lib/commercial/do-not-sell-gate.ts` blocks purchase if:
1. No completed diagnostic exists for the email
2. Stated cost < £100/month
3. Accuracy not confirmed
4. Intent not declared

This means Strategy Room cannot be purchased cold — it requires a diagnostic journey first.

### Failure modes
- Do-Not-Sell gate block: returns 403 with reason and message (e.g., "You are not ready to purchase. Complete the diagnostic properly or leave.")
- Checkout cancelled by user: `?checkout=cancelled` param shows "Entry cancelled. No payment was taken. The decision remains unresolved."
- All standard Stripe failure modes apply

---

## Revenue Path 3: Executive Reporting (£295)

### Entry trigger
User completes fast diagnostic at `/diagnostics/fast`, views results, encounters `ExecutiveReportingPaywall` component. Paywall shows price (£295 from catalog) and collects email.

### Checkout flow
Same canonical Stripe flow via `/api/billing/checkout`.

### Fulfillment
- Entitlement: `assessment.executive_reporting`
- Cookie: `aol_paid_executive_reporting`
- Redirects to `/diagnostics/executive-reporting/run`
- Report generated using AI with constitutional thread data from diagnostic

### Price points
- Executive Reporting: £295
- Executive Reporting — Advanced: £295 (same price, different entitlement slug `executive-reporting-priority`, same Stripe product)

### Failure modes
- Same as standard checkout flow
- Report generation failure after payment: results page may show partial/error state

---

## Revenue Path 4: Global Market Intelligence Report (£59)

### Entry trigger
User visits `/artifacts/global-market-intelligence-report-q1-2026` or intelligence landing pages.

### Fulfillment
- Entitlement: `global-market-intelligence-report-q1-2026`
- One-time PDF access after purchase

### Failure modes
- Standard checkout failures
- Note: `stripeProductId` is null — relies entirely on `stripePriceId` for Stripe resolution

---

## Revenue Path 5: Event Tickets (Dynamic Pricing)

### Entry trigger
User visits event page, selects ticket tier, fills delegate info.

### Checkout flow
Separate from catalog system. Uses `pages/api/events/checkout.ts`:
1. Validates eventId, ticketId, quantity (1-10), email, name
2. Calls `getEventPrice(eventId, ticketId)` for dynamic pricing
3. Creates Stripe Checkout Session with `price_data` (not catalog price IDs)
4. Redirects to `/events/success?session_id={CHECKOUT_SESSION_ID}`

### Ticket tiers
`public`, `member`, `verified`, `restricted`, `top-secret`

### Failure modes
- Invalid price from `getEventPrice()`: returns 500 "Invalid price configuration"
- Stripe error: returns 500 with masked message in production ("Failed to create checkout session. Please try again.")
- No entitlement system — webhook integration unclear (separate diagnostic report webhook exists at `/api/stripe/diagnostic-report-webhook`)

---

## Revenue Path 6: Diagnostic Report Orders (Legacy)

### Entry trigger
Inner Circle members (`tierAtLeast("inner-circle")`) can request reports via `/api/reports/request`.

### Checkout flow
Uses `lib/reports/catalogue` for package resolution and creates Stripe Checkout Session. Separate webhook at `/api/stripe/diagnostic-report-webhook` marks `diagnosticReportOrder` as paid.

### Fulfillment
- Updates `diagnosticReportOrder.status` to "paid" in database
- Calls `markDiagnosticReportPaid()` with tier (standard/premium)

### Failure modes
- Auth required: returns 401 `AUTH_REQUIRED`
- Session invalid: returns 401 `SESSION_INVALID`
- Insufficient clearance: returns 403 `INSUFFICIENT_CLEARANCE`
- Stripe not configured: silent failure

---

## Revenue Path 7: PDF Asset Downloads (Tiered Pricing)

### Entry trigger
User visits `/downloads/[slug]`, asset pricing resolved via `lib/commercial/pricing-engine.ts`.

### Pricing tiers (base)
| Category | Base Price |
|----------|-----------|
| Worksheet | £19 |
| Framework | £29 |
| Playbook | £49 |
| Brief | £29 |
| Report | £79 |
| Toolkit | £129 |
| Case Evidence | Free |

### Tier-based discounts
- **Inner Circle**: Frameworks and briefs free; reports at 50% off
- **Registered users**: 10% discount on all assets
- **Public**: Full base price

### Fulfillment
- `/api/downloads/[slug]` route: resolves identity, checks entitlement, serves PDF from `private_storage/premium-content/`
- `/api/download/[token]` route: token-verified download with forensic watermarking, session binding, and rate limiting (20 req/60s per IP)

### Failure modes
- PDF not found: returns 404 "PDF asset not found"
- Not entitled: returns 401 or 403 with price/reason/nextAction
- PDF file missing on disk: returns 404 "PDF unavailable" with `htmlFallback` link
- Token invalid: returns 403 with specific reason
- Token binding mismatch: returns 403 "Access restricted to original session"
- Document generation failure: returns 500 "Document generation failed"
- Rate limit exceeded: returns 429 with `Retry-After` header

---

## Revenue Path 8: Retainers (Inactive — Future Revenue)

### Current state
Three retainer tiers defined in catalog: Core (1 decision), Operational (3 decisions), Institutional (unlimited). All are **inactive** with no Stripe price IDs.

### Qualification engine
`lib/retainer/qualification.ts` evaluates whether a retainer should be offered based on:
1. Contradiction persists across assessments
2. Pattern recurrence detected
3. Multi-stakeholder divergence present

The `RetainerEntryGate` component renders conditionally only when qualification criteria are met.

### Retainer service
`lib/retainers/retainer-service.ts` manages contract creation, decision capacity tracking, enforcement cycles, and Stripe subscription sync. The Stripe webhook handler syncs subscription status via `syncRetainerContractFromSubscription()`.

### Revenue projection
These are contracted monthly subscriptions. No self-serve pricing — "Contracted monthly" displayed to users.

---

## Revenue Path 9: Inner Circle Membership (£30/mo — Inactive)

### Current state
Inner Circle defined at £30/mo subscription. **Currently inactive** in catalog.

### Existing infrastructure
- Membership elevation via Stripe webhook at `/api/webhooks/stripe`
- Tier stored in `innerCircleMember` table
- Subscription cancellation handled: tier reverts to "member"
- Access gating exists throughout (reports, downloads, dashboard features)

---

## Email Capture → Revenue Pipeline

### Capture points
1. **Post-diagnostic ResultEmailCapture** (`components/diagnostics/ResultEmailCapture.tsx`): "Save this reading" after result impact. Saves to `/api/diagnostics/capture`.
2. **Newsletter signup** (`/api/newsletter`): reCAPTCHA-protected, syncs to Resend audience and HubSpot.
3. **Contact form** (`/api/contact`): syncs to Resend audience, HubSpot, and Discord notification.
4. **Strategy Room intake**: email stored in session for checkout.
5. **Diagnostic submit**: email attached to diagnostic record, synced to CRM.

### Conversion path
Email → Diagnostic → Executive Reporting (£295) → Strategy Room (£750+) → Retainer (contracted monthly)

Each step requires completion of the previous step. The Do-Not-Sell gate enforces this — no payment is accepted without diagnostic evidence.

### CRM integration
- HubSpot sync on checkout start, payment confirmation, and diagnostic completion
- Resend audience sync on contact/newsletter
- Discord notifications on contact form submissions

---

## Webhook Architecture

| Endpoint | Purpose | Stripe Events |
|----------|---------|---------------|
| `/api/billing/webhook` | Canonical product fulfillment | `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted` |
| `/api/webhooks/stripe` | Legacy membership elevation | `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted` |
| `/api/stripe/diagnostic-report-webhook` | Diagnostic report payment confirmation | `checkout.session.completed` |
| `/api/reports/webhook` | Report request payment | (exists but not fully audited) |

### Idempotency
The canonical webhook (`/api/billing/webhook`) implements proper idempotency via `processedWebhookEvent` table with insert-before-processing pattern and unique constraint.

The legacy webhook (`/api/webhooks/stripe`) does **not** implement idempotency — relies on Prisma's update semantics.

---

## Revenue Risk Summary

| Risk | Severity | Detail |
|------|----------|--------|
| Dual webhook architecture | High | Two overlapping Stripe webhooks (`/api/billing/webhook` and `/api/webhooks/stripe`) process `checkout.session.completed` — potential for double processing or missed events |
| Inactive high-value products | Medium | Inner Circle (£30/mo), Retainers (contracted), Diagnostic Report Basic (£250), Diagnostic Report Pro (£750) all inactive |
| Event checkout isolated | Medium | Event ticket purchases use separate checkout without catalog integration or idempotency |
| GMI report has no stripeProductId | Low | Relies solely on `stripePriceId` — works but product-level Stripe metadata absent |
| Entitlement repair path | Low | Self-healing exists but adds complexity — payment can succeed while entitlement sync fails |
