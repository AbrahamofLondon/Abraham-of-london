# Five Truth Dimensions Architecture

**Immutable Separation Principle**: These five dimensions are permanently independent. No dimension may constrain another without explicit authorization. Each dimension is owned, evaluated, and reported independently.

## 1. Release State
**Authority**: Release authority (owner-signed)
**Values**: DRAFT, RELEASE_CANDIDATE, RELEASE_AUTHORIZED, ACTIVE, ACTIVE_UNTIL_SUPERSEDED, SUPERSEDED, ARCHIVED

**Semantics**:
- DRAFT: Development state, not ready for publication
- RELEASE_CANDIDATE: Candidate for release, awaiting gates
- RELEASE_AUTHORIZED: Owner has signed the release (hash-bound authority)
- ACTIVE: Currently published, accepting new customers
- ACTIVE_UNTIL_SUPERSEDED: Published, accepting new customers until superseded
- SUPERSEDED: Previous edition replaced by newer edition; existing customers retain access
- ARCHIVED: Historical reference only, no customer acquisition

**Source**: `gmi_release_receipts` (durable row per edition), `gmi_release_state` (lifecycle)

**Constraints**: Once ACTIVE, cannot revert to DRAFT. Superseded → ARCHIVED is one-way.

**Verification**: `getDurableReleaseState()` + receipt check

---

## 2. Commercial State
**Authority**: Commercial governance + policy registry
**Values**: FREE, SELF_SERVE_CHECKOUT, EVIDENCE_GATED_CHECKOUT, ADMISSION_GATED_CHECKOUT, MANUAL_BILLING, CONTRACT, ARCHIVE_ONLY

**Semantics** (AcquisitionMode from `commercial-access-policy.ts`):
- FREE: No payment required, immediate access
- SELF_SERVE_CHECKOUT: Customer pays, instant access (unless policy specifies prerequisites)
- EVIDENCE_GATED_CHECKOUT: Customer pays only if evidence passes first
- ADMISSION_GATED_CHECKOUT: Customer pays only if admitted by external evaluator (e.g., Executive Reporting)
- MANUAL_BILLING: Sales-assisted, no self-serve checkout
- CONTRACT: Enterprise/agreement-based, no self-serve
- ARCHIVE_ONLY: Not for acquisition, reference only

**Prerequisites** (PrerequisitePolicy):
- NONE: No prerequisites (decision instruments)
- RELEASE_RECEIPT: Durable receipt must exist (GMI Q2)
- INTELLIGENCE_SPINE: Diagnostic journey must be complete
- EXECUTIVE_REPORTING_ADMISSION: Custom admission evaluator
- BOARDROOM_HANDOFF: Boardroom-specific rules
- CUSTOM: Product-specific evaluator

**Source**: `COMMERCIAL_ACCESS_POLICIES` registry

**Constraints**: MANUAL_BILLING and CONTRACT products cannot use self-serve checkout. FREE products must have `paymentRequired: false`.

**Verification**: `resolveCommercialAccessPolicy()` → check policy consistency

---

## 3. Progression State
**Authority**: Product lifecycle + customer entitlement history
**Values**: Initial, Exploring, Committed, Renewing, Upgraded, At_Risk

**Semantics**:
- Initial: Customer just acquired the product
- Exploring: Using the product, gathering evidence of value
- Committed: Repeated use, established value signals
- Renewing: Subscription approaching renewal (subscription products only)
- Upgraded: Customer expanded from lower-tier product
- At_Risk: Usage declining, risk of churn

**Source**: Customer entitlement history, usage analytics

**Constraints**: Progression is one-way forward (no backtracking to "Initial" after "Exploring"). Churn resets to "Initial" on re-acquisition.

**Verification**: Analytics engine (separate from release/commercial layers)

---

## 4. Claim Authority
**Authority**: Evidence gating + release authority
**Values**: NONE, SINGLE_SOURCE, MULTI_SOURCE, AUTHORITATIVE

**Semantics**:
- NONE: No verified evidence; claims are provisional
- SINGLE_SOURCE: Evidence from one call/assessment
- MULTI_SOURCE: Evidence from multiple calls/assessments (≥3)
- AUTHORITATIVE: Independently reviewed, falsification tested, board-relevant

**Source**: Release evidence gates (CALL_REVIEW, DATA_PROVENANCE, FALSIFICATION_REVIEW, BOARD_PULSE)

**Constraints**: Claim authority cannot exceed what evidence supports. AUTHORITATIVE requires all five release gates PASS.

**Verification**: `resolveDurableReleaseGateVector()` → check evidence gates

---

## 5. Runtime Health
**Authority**: Operational monitoring + integrity checks
**Values**: OPERATIONAL, DEGRADED, UNAVAILABLE, INTEGRITY_WARNING, UNKNOWN

**Semantics**:
- OPERATIONAL: All systems nominal
- DEGRADED: Partial functionality loss (e.g., slow load times, reduced features)
- UNAVAILABLE: Service is down or inaccessible
- INTEGRITY_WARNING: Consistency check failed (e.g., post-release PDF hash mismatch), but operation continues
- UNKNOWN: Health status unknown (e.g., new product, monitoring not yet active)

**Source**: Real-time monitoring, integrity verification checks, post-release evidence gates

**Constraints**: INTEGRITY_WARNING does NOT block purchased access (post-release). It informs support and analytics.

**Verification**: Post-release gates check consistency but don't block. Pre-release gates are strict blockers.

---

## Separation and Independence

### Example: GMI Q2 Release
After release transaction commits:
- **Release State**: ACTIVE_UNTIL_SUPERSEDED ✓ (durable receipt exists)
- **Commercial State**: SELF_SERVE_CHECKOUT with RELEASE_RECEIPT prerequisite ✓
- **Progression State**: Customer's first purchase → "Initial" ✓
- **Claim Authority**: AUTHORITATIVE (all gates passed at release) ✓
- **Runtime Health**: OPERATIONAL (all checks pass) OR INTEGRITY_WARNING (PDF hash mismatch post-release) ✓

All five dimensions exist independently:
- If commercial policy changes → Release state unchanged
- If PDF file regenerated with new hash → Release state unchanged, integrity check warnings only
- If customer progresses in usage → Release state unchanged
- If evidence gate fails post-release → Release state unchanged, integrity check only

### Key Invariants
1. **No dimension constrains another without explicit governance**: A product can be ACTIVE but MANUAL_BILLING. A product can be SELF_SERVE but not yet ACTIVE (pre-release).
2. **Post-release integrity checks don't block**: Once released, evidence gates become informational. Only pre-release gates block.
3. **Authority is independent**: Release authority (owner) is separate from commercial governance (policy registry), separate from claim authority (evidence gates).

---

## Implementation Checklist

- [ ] Release State: Durable store (DONE), lifecycle resolver (DONE), receipt verification (DONE)
- [ ] Commercial State: Policy registry (DONE), prerequisite evaluators (DONE), policy-routed checkout (DONE)
- [ ] Progression State: Customer entitlement tracking (separate), usage analytics (separate)
- [ ] Claim Authority: Evidence gates (DONE), post-release integrity checks (DONE)
- [ ] Runtime Health: Monitoring integration (separate), integrity check reporting (DONE)

- [ ] **Phase 4 (Current)**: Document five dimensions (THIS FILE), verify separation throughout codebase
- [ ] **Phase 5**: Remove internal authority UI from public surfaces (ProductAuthorityPanel, raw blockingReasons)
- [ ] **Phase 6**: Implement CheckoutFailureCode enum + publicMessage architecture
- [ ] **Phase 7-9**: Commerce estate audit, proof matrix, production verification

---

## Separation Verification Checklist

For each product and each dimension:
- [ ] Does release state depend on commercial state? (NO)
- [ ] Does commercial state depend on runtime health? (NO)
- [ ] Does claim authority block release? (NO, post-release)
- [ ] Do internal blockers leak to customer responses? (NO, see Phase 5)
- [ ] Are all five dimensions independently documented? (IN PROGRESS)
