# Commercial Activation Convergence Programme

**Status**: Blueprint for Phase 1-9 implementation  
**Owner-authorized**: Per release mandate, Q2 lifecycle and durable receipt are immutable source truth  
**Current blocker**: Universal `checkDoNotSellGate()` in `pages/api/billing/checkout.ts:88` blocks GMI (and decision instruments) unnecessarily

---

## Objective

Replace the universal `checkDoNotSellGate()` gate with a **policy-routed commercial access layer** that determines, per product:

1. Whether a product is public
2. Whether it is purchasable  
3. Which prerequisite evaluator applies (if any)
4. Whether prior evidence (diagnostic) is required
5. Which fulfilment path follows successful payment

**No product may be subjected to a prerequisite merely because it shares the canonical checkout endpoint.**

---

## Phase 0: Preserve Immutable Source Truth

DO NOT MUTATE:
- Q2 lifecycle state: `ACTIVE_UNTIL_SUPERSEDED`
- Q2 durable release receipt: Postgres `gmi_release_receipts` row (published 2026-07-08)
- Q1 superseded state: `SUPERSEDED` (by GMI-Q2-2026)
- Stripe product identities: `prod_UNnSL8r6DMedEH` (GMI), others
- Stripe price IDs: `price_1TP1rRQFpelVFMXJWaFMOpJQ` (GMI Q2), others
- Entitlement identities: `gmi_quarterly`, etc.

Current defects are **downstream in commercial activation**, not in these.

---

## Phase 1-2: Commercial Access Policy Type & Definitions

### Type Definition

```typescript
// lib/commercial/commercial-access-policy.ts

export type CommercialAccessPolicy = {
  // Product identity
  productCode: string;
  familyCode: string;

  // How is this product acquired?
  acquisitionMode:
    | "FREE"
    | "SELF_SERVE_CHECKOUT"        // Immediate checkout, no prerequisites
    | "EVIDENCE_GATED_CHECKOUT"    // Checkout available only if evidence passes
    | "ADMISSION_GATED_CHECKOUT"   // Checkout available only if admitted
    | "MANUAL_BILLING"             // Manual fulfilment (no self-serve checkout)
    | "CONTRACT"                   // Contract/enterprise only
    | "ARCHIVE_ONLY";              // Historical reference, no acquisition

  // What (if any) prerequisite must pass before acquisition?
  prerequisitePolicy:
    | "NONE"                       // No prerequisites
    | "RELEASE_RECEIPT"            // Durable receipt must exist (GMI)
    | "INTELLIGENCE_SPINE"         // Diagnostic journey must be completed
    | "EXECUTIVE_REPORTING_ADMISSION"  // Admission evaluator
    | "BOARDROOM_HANDOFF"          // Boardroom-specific rules
    | "CUSTOM";                    // Product-specific evaluator

  // Does the product existence depend on a durable release proof?
  releaseProofRequired: boolean;

  // Does the product cost money?
  paymentRequired: boolean;

  // Is an entitlement record required to track access?
  entitlementRequired: boolean;

  // Can this product appear on public surfaces?
  publicSurfaceAllowed: boolean;

  // After successful payment, how is the product fulfilled?
  fulfilmentMode:
    | "INTERACTIVE_ACCESS"    // Immediate access to decision instrument
    | "PDF_DOWNLOAD"          // PDF artifact download (gated by entitlement)
    | "DOSSIER_DELIVERY"      // Quarterly/periodic delivery
    | "SESSION_BOOKING"       // Facilitated session scheduling
    | "SUBSCRIPTION"          // Ongoing subscription
    | "MANUAL";               // Manual email/contact-based fulfilment

  // Where does the user go after successful checkout?
  successPath: string;

  // Optional: product-specific evaluator function
  customEvaluator?: (context: EvaluationContext) => Promise<EvaluationResult>;
};

export type EvaluationContext = {
  email: string;
  userId?: string;
  productCode: string;
  policy: CommercialAccessPolicy;
  // Additional context as needed
};

export type EvaluationResult = {
  allowed: boolean;
  reason?: string;
  recoveryPath?: string;
};
```

### Family Policies

#### GMI Current Edition (Q2 2026)

```typescript
{
  productCode: "gmi_q2_2026",
  familyCode: "gmi_quarterly",
  
  acquisitionMode: "SELF_SERVE_CHECKOUT",
  prerequisitePolicy: "RELEASE_RECEIPT",     // Must check receipt exists
  releaseProofRequired: true,
  paymentRequired: true,
  entitlementRequired: true,
  publicSurfaceAllowed: true,
  fulfilmentMode: "PDF_DOWNLOAD",
  successPath: "/intelligence/gmi/q2-2026",
}
```

**Gate sequence (not: ask if they've done a diagnostic)**:
```
1. Q2 exists? (catalog check)
2. Q2 purchasable? (commercial state)
3. Durable receipt present? ← THIS, not a diagnostic journey
4. Price authority valid? (Stripe)
5. Create checkout session
```

#### Decision Instruments (Exposure, Alignment Gap Map, Mandate Clarity, Execution Risk Index)

```typescript
{
  productCode: "decision_exposure",    // and others
  familyCode: "decision_instruments",
  
  acquisitionMode: "SELF_SERVE_CHECKOUT",
  prerequisitePolicy: "NONE",          // ← NOT Intelligence Spine
  releaseProofRequired: false,
  paymentRequired: true,
  entitlementRequired: true,
  publicSurfaceAllowed: true,
  fulfilmentMode: "INTERACTIVE_ACCESS",
  successPath: "/diagnostics/decision-exposure",  // Immediate access
}
```

**Rationale**: Surface promise is "You are acquiring a decision instrument. Immediate use expected."  
**Cannot** promise immediate use while demanding a diagnostic prerequisite.

#### Executive Reporting

```typescript
{
  productCode: "executive_reporting",
  familyCode: "executive_reporting",
  
  acquisitionMode: "ADMISSION_GATED_CHECKOUT",
  prerequisitePolicy: "EXECUTIVE_REPORTING_ADMISSION",
  releaseProofRequired: false,
  paymentRequired: true,
  entitlementRequired: true,
  publicSurfaceAllowed: true,
  fulfilmentMode: "PDF_DOWNLOAD",
  successPath: "/professional/executive-reporting",
  
  customEvaluator: evaluateExecutiveReportingAdmission,  // Existing admitter
}
```

#### Boardroom Brief

```typescript
{
  productCode: "boardroom_brief",
  familyCode: "boardroom_brief",
  
  acquisitionMode: "SELF_SERVE_CHECKOUT",
  prerequisitePolicy: "BOARDROOM_HANDOFF",     // Explicit rule, not a hardcoded bypass
  releaseProofRequired: false,
  paymentRequired: true,
  entitlementRequired: true,
  publicSurfaceAllowed: true,
  fulfilmentMode: "PDF_DOWNLOAD",
  successPath: "/professional/boardroom-brief",
  
  customEvaluator: evaluateBoardroomHandoff,
}
```

**Remove from code**:
```typescript
// ❌ DO NOT KEEP THIS
if (productCode === "boardroom_brief") {
  return { allowed: true };
}
```

An exception in procedural code is not product governance.

---

## Phase 3: Checkout Pipeline Refactor

**Current flow** (`pages/api/billing/checkout.ts`):
```typescript
const gate = await checkDoNotSellGate(String(email).trim().toLowerCase(), code);
if (!gate.allowed) {
  return res.status(403).json({ ...gate });
}
// ... continue to Stripe
```

**New flow**:
```typescript
// 1. Resolve identity
const email = String(req.body.email).trim().toLowerCase();

// 2. Resolve product
const product = CATALOG[code];
if (!product) return res.status(400).json({ code: "PRODUCT_NOT_FOUND" });

// 3. Resolve commercial action
const action = resolveCommercialAction(product, getGovernanceState(code));

// 4. Resolve commercial access policy
const policy = resolveCommercialAccessPolicy(code);
if (!policy) return res.status(500).json({ code: "NO_POLICY_DEFINED", productCode: code });

// 5. Evaluate ONLY the prerequisite named by that policy
const prereq = await evaluateCommercialPrerequisite({
  policy,
  email,
  productCode: code,
  context: { /* ... */ }
});
if (!prereq.allowed) {
  return res.status(prereq.code === "PREREQUISITE_REQUIRED" ? 400 : 403)
    .json({
      ok: false,
      code: prereq.code,
      publicMessage: getPublicCheckoutMessage(prereq.code),
      recoveryHref: prereq.recoveryPath,
      incidentRef: generateIncidentRef(),
    });
}

// 6. Evaluate product-specific authority
const authResult = await evaluateProductAuthority(code, email);
// GMI: check receipt exists
// ER: already done by custom evaluator
// etc.

// 7. Check price / Stripe configuration
if (!product.stripePriceId) {
  return res.status(500).json({ code: "STRIPE_NOT_CONFIGURED", productCode: code });
}

// 8. Create checkout session
const session = await stripe.checkout.sessions.create({
  // ... standard params
  metadata: {
    productCode: code,
    editionId: code.includes("gmi") ? "GMI-Q2-2026" : undefined,  // Where relevant
    receiptId: code === "gmi_q2_2026" ? currentReceipt?.id : undefined,
  },
});

// 9. Record launch
await recordCheckoutLaunch(email, code, session.id);

// 10. Entitlement grant happens in webhook
return res.json({ ok: true, sessionUrl: session.url });
```

---

## Phase 4: Five Truth Dimensions (Permanently Separated)

Every product surface must distinguish:

### 1. **RELEASE STATE**
Can this product/edition exist publicly at all?
- PUBLIC: Product is released and should appear
- ARCHIVED: Superseded, available for reference only
- DRAFT: In preparation, no public access
- WITHDRAWN: Deliberately removed

Example:
```
GMI-Q1-2026: ARCHIVED (superseded by Q2)
GMI-Q2-2026: PUBLIC (released 2026-07-08)
Q3 draft: DRAFT
```

### 2. **COMMERCIAL STATE**
Can it be acquired, and through which mode?
- SELF_SERVE_CHECKOUT
- EVIDENCE_GATED_CHECKOUT
- ADMISSION_GATED_CHECKOUT
- MANUAL_BILLING
- CONTRACT
- ARCHIVED (no longer sold)
- FREE

Example:
```
GMI-Q2: SELF_SERVE_CHECKOUT (with RELEASE_RECEIPT prerequisite)
ER: ADMISSION_GATED_CHECKOUT
Decision Instruments: SELF_SERVE_CHECKOUT (no prerequisites)
```

### 3. **PROGRESSION STATE**
Is this the recommended next move for this user?
- AVAILABLE: Suitable for this session's profile
- RECOMMENDED: Explicitly suggested
- BLOCKED_BY_PROGRESSION: Later in journey, user not ready
- ALREADY_OWNED: User already has entitlement

### 4. **CLAIM AUTHORITY**
What claims may the product make?
- FULL_AUTHORITY: All features available
- BOUNDED_OPERATIONAL_CLAIMS: Strategic only, not predictive
- REFERENCE_ONLY: Historical record, no new claims
- PENDING_AUTHORITY: Awaiting governance approval

Example:
```
GMI-Q2: FULL_AUTHORITY (published with scored record)
GMI-Q1: REFERENCE_ONLY (historical judgment available, no new claims)
```

### 5. **RUNTIME HEALTH**
Does the route actually function?
- HEALTHY: Route works, entitlements resolve, fulfillment works
- DEGRADED: Partial functionality
- UNAVAILABLE: Route/service down
- UNVERIFIED: Not yet smoke-tested in production

---

## Phase 5: Remove Internal Authority UI from Public Surfaces

### Audit Required

Search for and classify:
- `ProductAuthorityPanel`
- `ProductAuthorityNotice`
- `ProductAuthorityBadge`
- `resolveProductAuthority` (in render, not logic)
- Raw `blockingReasons` in output
- Evidence ledger inventory (tests, data flow checks)
- Validation chain status (red-team, anti-toy)

### Classification per Route

```
/diagnostics/* 
  - INTERNAL_GOVERNANCE_DETAIL: Remove authority panels
  - CUSTOMER_SAFE_PROJECTION: Keep entry/exit UI

/intelligence/* (public records)
  - CUSTOMER_SAFE_PROJECTION: Keep publication role, edition lineage
  - ADMIN_TRUST_INSPECTION: Move detailed authority to admin surface only

/professional/* (checkout surfaces)
  - CUSTOMER_SAFE_PROJECTION: Keep product pitch, price, CTA
  - INTERNAL_GOVERNANCE_DETAIL: Remove authority detail

/api/checkout
  - CUSTOMER_SAFE_PROJECTION: Bounded error codes + recovery paths
  - ADMIN_TRUST_INSPECTION: Detailed logs only
```

### Example: Enterprise Decision Scan

**Remove from public surface**:
- Authority panel showing "Product validation in progress"
- Raw reason codes
- Validation chain status badges
- Evidence inventory

**Keep on public surface**:
- Product pitch
- Price
- CTA ("Request access" or "View assessment")

**Move to admin-only surface** (`/admin/products`):
- Full authority audit trail
- Validation chain with timings
- Evidence ledger status

---

## Phase 6: Checkout Error Architecture

### Current Problems

**GMI**:
```typescript
throw new Error(data?.reason || data?.error ...)  // Throws "NO_DIAGNOSTIC"
```
Customer sees: `NO_DIAGNOSTIC` (machine code, not helpful)

**Decision Instruments**:
```typescript
catch (e) {
  showError("Unable to complete purchase");  // Too generic
}
```
Customer sees: Nothing useful; can't recover

### Solution: CheckoutFailureCode + PublicMessage

```typescript
export type CheckoutFailureCode =
  | "EMAIL_REQUIRED"
  | "PRODUCT_UNAVAILABLE"
  | "PREREQUISITE_REQUIRED"
  | "ADMISSION_RESTRICTED"
  | "RELEASE_PROOF_MISSING"
  | "PAYMENT_PROVIDER_UNAVAILABLE"
  | "CHECKOUT_CREATION_FAILED"
  | "SESSION_EXPIRED"
  | "ENTITLEMENT_GRANT_FAILED";

export type CheckoutFailureResponse = {
  ok: false;
  code: CheckoutFailureCode;
  publicMessage: string;        // Customer-safe explanation
  recoveryHref?: string;        // Where to go next (e.g., /diagnostics if evidence missing)
  incidentRef: string;          // For support: "INC-20260709-abc123"
};

// Map code → customer message
const PUBLIC_MESSAGES: Record<CheckoutFailureCode, string> = {
  EMAIL_REQUIRED: "Please provide your email address.",
  PRODUCT_UNAVAILABLE: "This product is not currently available for purchase.",
  PREREQUISITE_REQUIRED: "This product requires a completed evidence step before purchase.",
  ADMISSION_RESTRICTED: "Access to this product is limited. Please contact support.",
  RELEASE_PROOF_MISSING: "This edition is not yet available. Please check back later.",
  PAYMENT_PROVIDER_UNAVAILABLE: "Payment processing is temporarily unavailable. Please try again shortly.",
  CHECKOUT_CREATION_FAILED: "We couldn't create your checkout session. Please try again or contact support.",
  SESSION_EXPIRED: "Your session has expired. Please refresh and try again.",
  ENTITLEMENT_GRANT_FAILED: "We processed your payment but couldn't complete the access setup. Support has been notified.",
};

// Internal logs retain detailed reasons
logger.error("checkout_failed", {
  code: "PREREQUISITE_REQUIRED",
  productCode: "gmi_q2_2026",
  email: "user@example.com",
  reason: "NO_RELEASE_RECEIPT",  // ← Detailed, for debugging
  timestamp: new Date(),
  incidentRef: "INC-20260709-abc123",
});
```

---

## Phase 7-8: Commerce Estate Audit & Proof Matrix

### Audit Classification

Every checkout path must be classified:

```
CANONICAL
  pages/api/billing/checkout.ts → Stripe session → webhook → entitlement

COMPATIBILITY_ADAPTER
  Living Case checkout → maps to canonical flow

PRODUCT_SPECIFIC_BY_DESIGN
  Executive Reporting admission → custom evaluator → canonical checkout

LEGACY
  Personal Decision Audit old path (if still active)

RETIRED
  Paths no longer used
```

### Proof Matrix (Positive Tests)

Each should succeed without manual intervention:

```
✓ GMI Q2
  - No prior diagnostic
  - checkout session created
  - metadata includes editionId, receipt reference

✓ Decision Exposure Instrument
  - No prior diagnostic
  - checkout session created
  - successPath → /diagnostics/decision-exposure

✓ Decision Alignment Gap Map
  - No prior diagnostic
  - checkout session created
  - successPath → /diagnostics/alignment-gap-map

✓ Executive Reporting
  - User has qualifying evidence
  - checkout session created
  - successPath → /professional/executive-reporting

✓ Boardroom Brief
  - Standard self-serve checkout
  - metadata correct
  - successPath → /professional/boardroom-brief

✓ Personal Decision Audit
  - Correct commercial path (not blocked)
```

### Negative Tests

Each should fail safely and return recovery path:

```
✗ GMI Q2 without receipt → RELEASE_PROOF_MISSING + no recovery (product unavailable, check back later)

✗ Decision Instrument after platform down → PAYMENT_PROVIDER_UNAVAILABLE + recovery href (try again in 5 min)

✗ Evidence-gated product without evidence → PREREQUISITE_REQUIRED + recovery href → /diagnostics

✗ Q1 GMI → PRODUCT_UNAVAILABLE (superseded; link to Q2)

✗ Unknown product → PRODUCT_NOT_FOUND (not a customer error; internal)
```

---

## Phase 9: Production Proof (No Real Spending)

Use the controlled proof mode (`proof_token` + server-applied promotion code) for production verification.

**Do not**:
- Make real purchases to test
- Expose the proof token to customers
- Use proof mode in customer-visible flows

**Required production matrix**:
```
GMI Q2: checkout session generated, metadata correct, receipt ref present
Decision Exposure: checkout session generated, correct successPath
Decision Alignment: checkout session generated, correct successPath
Executive Reporting: admission evaluator called correctly
Boardroom Brief: correct policy behavior
Personal Decision Audit: correct commercial path resolved

Verify for each:
  - Stripe session metadata (product identity, edition identity where relevant, receipt ref)
  - Webhook event received
  - Entitlement grant via webhook
  - Success route resolution (user lands on correct next surface)
  - Access resolution (entitlement prevents duplicate checkout)
```

---

## Implementation Checklist

- [ ] Phase 1: Create `CommercialAccessPolicy` type
- [ ] Phase 2: Define all product family policies
- [ ] Phase 3: Refactor checkout pipeline (policy-routed prerequisites)
- [ ] Phase 4: Document & verify five truth dimensions in code
- [ ] Phase 5: Audit public surfaces, remove internal authority UI
- [ ] Phase 6: Implement CheckoutFailureCode + publicMessage architecture
- [ ] Phase 7: Classify all checkout paths (canonical/adapter/product-specific/legacy/retired)
- [ ] Phase 8: Write positive and negative tests for each policy family
- [ ] Phase 9: Production smoke verification with controlled proof mode

---

## Related Files (Current State)

- `pages/api/billing/checkout.ts:88` — Universal gate (needs refactor)
- `lib/commercial/commercial-action-resolver.ts` — Current prerequisite logic
- `lib/commercial/do-not-sell-gate.ts` — Universal gate (becomes policy-optional)
- `lib/product/product-authority-gate.ts` — Product authority (may feed into policy evals)
- Tests: `lib/commercial/*.test.ts` — Will need new matrix tests

---

## Immutable Guarantees

This refactor **must not** change:
- Q2 `lifecycleState` = `ACTIVE_UNTIL_SUPERSEDED`
- Q2 `publishedAt` = `2026-07-08T20:40:02.415Z`
- Q2 receipt row in Postgres (hash-bound proof)
- Q1 `lifecycleState` = `SUPERSEDED`
- Stripe product/price IDs
- Entitlement slug identities

Verify these with a full checkout test after implementation.
