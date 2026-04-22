# Production Commercial Foundation Validation

Status: `NO-GO UNTIL COMPLETED`

Rule: do not broaden exposure until every relevant line below is marked `PASS` with observed production or staging evidence. Code confidence is not sufficient.

Use one real Stripe payment for each product class:

- Executive Reporting
- Strategy Room
- one Decision Instrument
- GMI
- one Diagnostic Report product

## 1. Stripe / Webhook Authority

### 1.1 Canonical Webhook Routing

Confirm in live Stripe configuration:

- Commercial checkout events go to the canonical commercial webhook.
- Membership and subscription events go to the membership webhook.
- No endpoint is missing.
- No endpoint is unintentionally duplicated.

Evidence required:

| Endpoint URL | Subscribed Events | Last Delivery Status | Owner | Result |
| --- | --- | --- | --- | --- |
|  |  |  | Commercial checkout |  |
|  |  |  | Membership/subscription |  |
|  |  |  | Diagnostic/report status, if retained |  |

PASS only if the actual Stripe dashboard confirms the intended routing.

### 1.2 Webhook Event Delivery

For each test payment, confirm:

- `checkout.session.completed` delivered.
- Response status is `200`.
- No retries are stuck.
- No `400` from missing metadata.
- No duplicate conflicting grant behavior.

Evidence required:

| Product | Stripe Event ID | Webhook Endpoint | Response | Server Log Reference | Result |
| --- | --- | --- | --- | --- | --- |
| Executive Reporting |  |  |  |  |  |
| Strategy Room |  |  |  |  |  |
| Decision Instrument |  |  |  |  |  |
| GMI |  |  |  |  |  |
| Diagnostic Report |  |  |  |  |  |

## 2. Payment Integrity

### 2.1 Fake Session Rejection

In production, confirm:

- `simulated:*` is rejected.
- `test:*` is rejected.
- No pseudo-session can create a `ClientEntitlement`.

Evidence required:

| Attempt | Route | Expected Response | Actual Response | Log Reference | Result |
| --- | --- | --- | --- | --- | --- |
| `simulated:*` |  | rejected |  |  |  |
| `test:*` |  | rejected |  |  |  |

### 2.2 Real Checkout Success

For each product class, confirm:

- Checkout starts correctly.
- Payment completes.
- Success return works.
- Entitlement exists afterward.

| Product | Checkout Starts | Payment Completes | Success Return | Entitlement Exists | Result |
| --- | --- | --- | --- | --- | --- |
| Executive Reporting |  |  |  |  |  |
| Strategy Room |  |  |  |  |  |
| Decision Instrument |  |  |  |  |  |
| GMI |  |  |  |  |  |
| Diagnostic Report |  |  |  |  |  |

## 3. Return Access Matrix

Run this for each tested product.

| Product | Payment | Immediate Return | Repeat Same Browser | Logged Out | Different Device | DB Entitlement | Admin Visible | Webhook OK | Final |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Executive Reporting |  |  |  |  |  |  |  |  |  |
| Strategy Room |  |  |  |  |  |  |  |  |  |
| Decision Instrument |  |  |  |  |  |  |  |  |  |
| GMI |  |  |  |  |  |  |  |  |  |
| Diagnostic Report |  |  |  |  |  |  |  |  |  |

Per product, verify:

- User returns from Stripe.
- Page unlocks correctly.
- No false locked state appears.
- Refresh works.
- Revisit after a few minutes works.
- Convenience cookie, if used, behaves correctly.
- Logged-out access resolves through durable entitlement where expected.
- Different browser or device access resolves through DB entitlement.

## 4. Database Entitlement Authority

For each test purchase, confirm in DB or admin tooling:

- `ClientEntitlement` row exists.
- Product code / slug is correct.
- Status is active or valid.
- Source path is inspectable.
- `createdAt` is correct.
- `endsAt` matches policy.

| Product | Email | Product Code | Status | Source | Created At | Ends At | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Executive Reporting |  | `assessment.executive_reporting` |  |  |  |  |  |
| Strategy Room |  | `strategy-room.entry` |  |  |  |  |  |
| Decision Instrument |  |  |  |  |  |  |  |
| GMI |  | `global-market-intelligence-report-q1-2026` |  |  |  |  |  |
| Diagnostic Report |  |  |  |  |  |  |  |

Lifetime access must show `endsAt = null` only where intentional.

## 5. Strategy Room Specific Checks

### 5.1 Success Smoothing

Confirm:

- Short-lived Strategy Room convenience cookie is set on verified return.
- Page unlocks immediately after checkout return.
- Cookie is not treated as durable authority.

Evidence:

| Check | Evidence | Result |
| --- | --- | --- |
| Cookie set after verified return |  |  |
| Immediate unlock |  |  |
| Durable DB entitlement required later |  |  |

### 5.2 Durable Access

Confirm:

- Strategy Room opens later via DB entitlement.
- Session page access is correctly enforced.

### 5.3 Session Persistence

Confirm:

- Decision log persists.
- Refresh restores state.
- Returning later restores state.
- Blocked decision requires reason.
- Admin/server can inspect session if needed.

| Session ID | Decision Persisted | Refresh Restored | Later Return Restored | Block Reason Enforced | Result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

## 6. Failed Grant / Recovery Path

If safe, force or simulate a DB write failure in staging.

Confirm:

- Grant is not marked verified.
- No fake durable access is created.
- `FailedEntitlementGrant` row appears.
- Admin can see it.
- Admin repair works.
- Repaired entitlement becomes valid.

If this cannot be safely forced in production, validate fully in staging and confirm the route exists in production code.

| Environment | Forced Failure Method | Failed Row Created | Admin Visible | Repair Works | Result |
| --- | --- | --- | --- | --- | --- |
| Staging |  |  |  |  |  |
| Production code presence |  |  |  |  |  |

## 7. Admin Mastery Check

From the admin commercial view, confirm an admin can answer for any tested purchase:

1. Did they pay?
2. Did Stripe confirm it?
3. Was entitlement granted?
4. Which webhook/path handled it?
5. What product code/slug was granted?
6. Is access currently active?
7. If something failed, can it be repaired immediately?

Test:

- Email lookup.
- Recent grants.
- Failed grant queue.
- Manual repair.
- Manual grant.
- Product catalog clarity.

| Admin Task | Evidence | Result |
| --- | --- | --- |
| Email lookup |  |  |
| Recent grants |  |  |
| Failed grant queue |  |  |
| Manual repair |  |  |
| Manual grant |  |  |
| Product catalog clarity |  |  |

PASS only if this is fast and obvious.

## 8. Cancel / Abandonment Paths

For each product class, confirm:

- Cancel from Stripe returns to the correct page.
- User is not returned to the wrong commercial surface.
- Page state after cancel is sane.
- No false access grant occurs.

| Product | Cancel Path | Correct Surface | No False Access | Result |
| --- | --- | --- | --- | --- |
| Executive Reporting |  |  |  |  |
| Strategy Room |  |  |  |  |
| Decision Instrument |  |  |  |  |
| GMI |  |  |  |  |
| Diagnostic Report |  |  |  |  |

## 9. Policy Consistency

Confirm documented behavior matches runtime behavior:

- Which products are lifetime access.
- Which products use convenience cookies.
- Which products use email-based entitlement.
- Which webhook is authoritative for each class.
- What admin should do on failed grants.

| Policy Area | Documented | Runtime Verified | Result |
| --- | --- | --- | --- |
| Lifetime access products |  |  |  |
| Convenience-cookie products |  |  |  |
| Email entitlement products |  |  |  |
| Webhook authority by class |  |  |  |
| Failed grant recovery |  |  |  |

## 10. Go / No-Go

GO only if all are true:

- Real Stripe routing is verified.
- No fake-session bypass exists.
- All tested product classes grant durable entitlement correctly.
- Same-browser and cross-device return access works.
- Strategy Room post-payment experience works immediately and durably.
- Admin can inspect and repair failures confidently.
- Failed grant path is visible and recoverable.
- Cancel paths are correct.

NO-GO if any remain unresolved:

- Webhook routing uncertain.
- Paid user can return to locked state.
- Entitlement can fail silently.
- Admin cannot explain a purchase lifecycle quickly.
- Any product class behaves differently without intentional reason.

Final production decision:

`NO-GO`

Decision owner:

Evidence bundle location:

Date:
