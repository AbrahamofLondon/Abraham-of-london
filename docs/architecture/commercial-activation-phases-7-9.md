# Commercial Activation Convergence — Phases 7–9

## Phase 7: Commerce Estate Audit & Classification

**Purpose**: Verify that every product in the estate is correctly classified and has the right commercial policy.

### Classification Framework

Every product must be classified as one of:

- **CANONICAL**: Product is current, using the new policy-routed architecture
- **COMPATIBILITY_ADAPTER**: Product is legacy but still in use; policy layer acts as adapter
- **PRODUCT_SPECIFIC**: Product requires custom evaluator logic (e.g., Executive Reporting)
- **LEGACY**: Product is deprecated but accessible to existing customers
- **RETIRED**: Product is removed; no new customers, customers directed to successor

### Audit Checklist

For each product in COMMERCIAL_ACCESS_POLICIES registry:

- [ ] Policy is defined
- [ ] Stripe IDs (if applicable) are verified
- [ ] Acquisition mode matches commercial reality
- [ ] Prerequisite policy is justified (document why if non-NONE)
- [ ] Success path is reachable and correct
- [ ] Classification (CANONICAL/COMPATIBILITY_ADAPTER/etc.) is documented
- [ ] If custom evaluator is used, implementation is reviewed and tested

### Audit Output

Create `docs/commerce-estate-audit.md` documenting:
- Classification matrix (product code → CANONICAL | COMPATIBILITY_ADAPTER | PRODUCT_SPECIFIC | LEGACY | RETIRED)
- Policy correctness assessment
- Any anomalies or policy violations
- Remediation plan for each violation

---

## Phase 8: Proof Matrix & Test Coverage

**Purpose**: Establish positive and negative test cases for each policy family.

### Test Structure

For each unique prerequisite policy, create:

**Positive test (happy path)**:
- Customer meets prerequisite
- Checkout succeeds
- Receipt records correctly

**Negative test (failure path)**:
- Customer does NOT meet prerequisite
- Checkout returns appropriate failure code
- Public message is customer-friendly
- Recovery path is provided

### Proof Matrix Template

```
Policy: RELEASE_RECEIPT (GMI Q2)
├─ Positive: receipt exists, checkout succeeds
├─ Negative: receipt missing, RELEASE_PROOF_MISSING returned
├─ Edge case: receipt exists but invalid, handled gracefully
├─ Edge case: receipt revoked, access denied
└─ Coverage: 4/4 test scenarios

Policy: NONE (Decision Instruments)
├─ Positive: all decision instruments check out
├─ Negative: N/A (no prerequisite)
├─ Edge case: product policy missing, fallback works
└─ Coverage: 2/2 test scenarios
```

### Test Files

Create these test suites:
- `tests/billing/checkout-policy-release-receipt.test.ts` — GMI Q2 specific
- `tests/billing/checkout-policy-none.test.ts` — Decision instruments
- `tests/billing/checkout-policy-executive-reporting.test.ts` — ER admission
- `tests/billing/checkout-policy-boardroom-handoff.test.ts` — Boardroom Brief
- `tests/billing/checkout-failure-codes.test.ts` — Verify all codes have messages

---

## Phase 9: Production Verification (Controlled Proof Mode)

**Purpose**: Verify the commercial system works correctly without real transactions.

### Controlled Proof Mode

Use STRIPE_PROOF_TOKEN to trigger server-applied test discount:

```bash
curl -X POST https://abraham.ai/api/billing/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "email": "proof@test.com",
    "productCode": "gmi_q2_2026",
    "proofToken": "PROOF_TOKEN_VALUE"
  }'
```

Stripe will automatically apply the promotion code; no real payment occurs.

### Verification Checklist

- [ ] **Q2 checkout path**: Policy-routed prerequisite passes → checkout succeeds
  - Test: With valid release receipt
  - Verify: Session created, metadata correct, email metadata recorded

- [ ] **Decision instrument checkout**: NONE prerequisite → checkout succeeds
  - Test: Multiple decision instruments (exposure, alignment_gap_map, etc.)
  - Verify: All pass without diagnostic prerequisite

- [ ] **Executive Reporting admission**: Custom evaluator → checkout gated
  - Test: Non-admitted user → fails with ADMISSION_RESTRICTED
  - Test: Admitted user → checkout succeeds
  - Verify: Public message is customer-friendly

- [ ] **Boardroom Brief handoff**: BOARDROOM_HANDOFF policy → checkout succeeds
  - Test: Valid handoff → checkout proceeds
  - Verify: Metadata includes handoff ID

- [ ] **Error messages**: All failures return customer-friendly codes
  - Verify: No raw blockingReasons leaked
  - Verify: Recovery paths are reachable
  - Verify: Support email is included

- [ ] **Post-release integrity checks**: PDF export gates don't block
  - Test: Q2 released, PDF hash mismatches → INTEGRITY_WARNING only
  - Verify: Release state is ACTIVE_UNTIL_SUPERSEDED (not blocked)

- [ ] **Policy audit**: All products have explicit policies
  - Verify: No universal gate remains
  - Verify: COMMERCIAL_ACCESS_POLICIES covers all products
  - Verify: validate policies() passes

### Success Criteria

✓ All checkout paths succeed with correct policy evaluation
✓ All failure paths return customer-friendly messages
✓ No internal technical reasons leak to customers
✓ Recovery paths work correctly
✓ Post-release products are purchasable via canonical path
✓ Five truth dimensions are independent and clearly separated
✓ Policy registry is complete and consistent

### Verification Flow

1. Run controlled proof mode checkouts for each policy family (Phase 9A)
2. Verify Stripe test invoices record correctly (Phase 9B)
3. Run full proof matrix tests (Phase 9C)
4. Commerce estate audit passes (Phase 9D)
5. Owner sign-off: "Commercial activation complete" (Phase 9E)

---

## Completion Criteria

All nine phases complete when:

1. ✓ Durable release state is immutable source truth (Phase 0)
2. ✓ Policy registry covers all products (Phase 1-2)
3. ✓ Checkout uses policy-routed evaluation (Phase 3)
4. ✓ Five truth dimensions are documented and separated (Phase 4)
5. ✓ Public surfaces don't expose internal authority/blockers (Phase 5)
6. ✓ Error responses use CheckoutFailureCode with public messages (Phase 6)
7. ✓ All products are classified and audited (Phase 7)
8. ✓ Proof matrix provides 100% coverage (Phase 8)
9. ✓ Controlled proof mode tests pass; owner approves (Phase 9)

GMI Q2 is then ready for production release via:
```bash
cd construction-worktree
git add -A
git commit -m "Phase 9: Production verification complete; Q2 release ready"
git checkout main
git merge construction/estate-restoration -m "Merge: Commercial Activation Convergence Phases 0-9 complete"
git push origin main
# Netlify deploy trigger
```
