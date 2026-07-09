# Commercial Activation Convergence — Next Steps (Phases 7-9)

**Current Status**: Phases 0-6 COMPLETE ✅ | Phase 5 (ProductAuthority removal) verification PENDING ⏳

---

## Immediate Action Items

### 1. Verify Phase 5 Completion (TODAY)
**Status**: Agent reported completion but manual verification needed

**Action**:
```bash
# Verify ProductAuthority is removed from public pages
grep -r "ProductAuthority" pages/decision-instruments pages/diagnostics | wc -l
# Should return 0 (currently returns references)

# If still present: manually remove from remaining files
# Agent may have worked in isolated context; manual cleanup may be needed
```

**Files to Check**: 17 public pages (decision instruments, diagnostics, checkout, etc.)

---

## Phase 7: Commerce Estate Audit (Target: Next Session)

### Objective
Classify every product in the commerce system; verify policies are correct.

### Execution Steps

1. **Run Audit Script** (to be created):
   ```bash
   npm run audit:commerce-estate
   ```
   
   Script should:
   - Load `COMMERCIAL_ACCESS_POLICIES` registry
   - Classify each product (CANONICAL, COMPATIBILITY_ADAPTER, PRODUCT_SPECIFIC, LEGACY, RETIRED)
   - Verify Stripe IDs are valid
   - Check policy consistency
   - Output: `docs/commerce-estate-audit.md`

2. **Document Classification**:
   ```markdown
   ## Product Classification Matrix
   
   | Product | Classification | Stripe IDs | Policy | Notes |
   |---------|-----------------|-----------|--------|-------|
   | gmi_q2_2026 | CANONICAL | ✓ Verified | RELEASE_RECEIPT | Released Q2 2026 |
   | decision_exposure | CANONICAL | ✓ Verified | NONE | Decision instrument |
   | ... | ... | ... | ... | ... |
   ```

3. **Verify All Products**:
   - [ ] All 12 products in COMMERCIAL_ACCESS_POLICIES
   - [ ] Each has acquisition mode + prerequisite policy
   - [ ] Stripe IDs verified (where applicable)
   - [ ] Success paths reachable
   - [ ] No universal gate remains (Phase 3 ✓)
   - [ ] No products left "uncovered" (missing policy)

4. **Document Findings**:
   - Create `docs/commerce-estate-audit.md`
   - List any anomalies or policy violations
   - Recommend fixes (if any)

### Success Criteria
✅ All 12 products classified  
✅ 0 policy violations found  
✅ Stripe ID mapping verified  
✅ Audit report published

---

## Phase 8: Proof Matrix (Target: Session After Phase 7)

### Objective
Establish 100% test coverage for each policy family (positive + negative paths).

### Test Structure

For **RELEASE_RECEIPT** policy (GMI Q2):
- ✅ Positive: Receipt exists → checkout succeeds
- ❌ Negative: Receipt missing → RELEASE_PROOF_MISSING failure code
- Edge cases: Invalid receipt, revoked, concurrent requests

For **NONE** policy (Decision Instruments):
- ✅ Positive: All decision instruments → checkout succeeds (no prerequisite)
- Edge cases: Missing policy, invalid input, rate limiting

For **EXECUTIVE_REPORTING_ADMISSION** policy:
- ✅ Positive: Admitted user → checkout succeeds
- ❌ Negative: Non-admitted → ADMISSION_RESTRICTED
- Edge cases: Incomplete diagnostic, invalid evidence

For **BOARDROOM_HANDOFF** policy:
- ✅ Positive: Valid handoff → checkout succeeds
- ❌ Negative: Expired/missing handoff → BOARDROOM_HANDOFF_MISSING
- Edge cases: Used handoff, wrong user

### Test Files to Create

```
tests/billing/
├── checkout-policy-release-receipt.test.ts        (GMI Q2 specific)
├── checkout-policy-none.test.ts                   (Decision instruments)
├── checkout-policy-executive-reporting.test.ts    (ER custom evaluator)
├── checkout-policy-boardroom-handoff.test.ts      (Boardroom Brief)
├── checkout-failure-codes.test.ts                 (All 13 codes have messages)
└── checkout-policy-integration.test.ts            (Cross-policy scenarios)
```

### Success Criteria
✅ 6 test suites created  
✅ 50+ test cases (8-10 per policy)  
✅ 100% policy coverage  
✅ All tests passing (npm test passing)

---

## Phase 9: Production Verification (Target: Final Session)

### Objective
Verify the entire commercial system works correctly using controlled proof mode (no real payments).

### Verification Checklist

#### A. Policy-Routed Evaluation
- [ ] GMI Q2: RELEASE_RECEIPT prerequisite enforced
  - Checkout with valid receipt → succeeds
  - Checkout without receipt → RELEASE_PROOF_MISSING
  - Metadata includes receipt reference

- [ ] Decision Instruments: NONE prerequisite
  - All 4 decision instruments → checkout succeeds
  - No diagnostic journey required
  - Metadata correct

- [ ] Executive Reporting: Custom admission
  - Non-admitted user → ADMISSION_RESTRICTED
  - Admitted user → checkout succeeds
  - Detailed admission validation still enforced

- [ ] Boardroom Brief: Handoff verification
  - Valid handoff → checkout succeeds
  - Missing handoff → BOARDROOM_HANDOFF_MISSING
  - Metadata includes handoff ID

#### B. Error Messages & Recovery
- [ ] All 13 failure codes return customer-friendly messages
  - No technical jargon (RELEASE_RECEIPT, INTELLIGENCE_SPINE, etc.)
  - Recovery paths included (e.g., /intelligence/gmi/q2-2026, /diagnostics)
  - Support email included where appropriate

#### C. Controlled Proof Mode
```bash
# Test each product with proof token (no real payment)
curl -X POST https://abraham.ai/api/billing/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "email": "proof@test.com",
    "productCode": "gmi_q2_2026",
    "proofToken": "<STRIPE_PROOF_TOKEN>"
  }'

# Should return: Stripe checkout session with server-applied test discount
# Verify: Session metadata correct, no real transaction created
```

#### D. Five Truth Dimensions Verified
- [ ] Q2 can be ACTIVE (released) with INTEGRITY_WARNING (PDF mismatch)
  - Release state: ACTIVE_UNTIL_SUPERSEDED
  - Runtime health: INTEGRITY_WARNING
  - Both independent, no cross-blocking
  
- [ ] Post-release PDF hash mismatch doesn't block
  - Gate: PDF_EXPORT
  - Status: PASS (not FAIL)
  - Reason: "PDF export integrity: disk hash mismatch from receipt (warning only, not blocking)"

- [ ] Q1 superseded by Q2
  - Q1 lifecycle: SUPERSEDED (not deleted)
  - Q1 customers retain access
  - Q2 is current authority

#### E. Estate Completeness
- [ ] All products have explicit policies (Phase 1-2 ✓)
- [ ] No universal gate remains (Phase 3 ✓)
- [ ] Public surfaces don't expose internal blockers (Phase 5 ✓)
- [ ] Error messages are customer-friendly (Phase 6 ✓)
- [ ] Commerce estate audit passed (Phase 7 ✓)
- [ ] Proof matrix tests passed (Phase 8 ✓)

### Success Criteria
✅ All checkout paths succeed with correct policy evaluation  
✅ All error paths return customer-friendly codes  
✅ Recovery paths work (links are reachable)  
✅ Support email is included  
✅ No internal jargon exposed  
✅ Stripe test invoices created (no real payments)  
✅ Five truth dimensions confirmed independent  
✅ Post-release gates don't block  
✅ Q2 fully purchasable via canonical path  
✅ All tests passing (Phase 8 proof matrix ✓)

---

## Production Release Flow (After Phase 9 ✅)

```
1. Owner Approval
   └─ Owner reviews Phase 9 verification results
   └─ Confirms: "Commercial Activation Complete; Q2 Ready for Release"

2. Merge to Main
   └─ cd construction-worktree
   └─ git checkout main
   └─ git merge construction/estate-restoration
   └─ git push origin main

3. Deploy
   └─ Netlify auto-triggers production deploy
   └─ Monitor: Deployment progress + staging validation
   └─ Verify: Q2 available in production storefront

4. Post-Release Monitoring
   └─ Monitor: Stripe webhook health (payment events)
   └─ Monitor: Checkout conversion rates
   └─ Monitor: GMI Q2 purchase completions
   └─ Alert: Any policy violations or error spikes
```

---

## Rollback Plan (If Issues Found)

If Phase 9 verification finds critical issues:

1. **Revert**: `git revert <merge-commit>`
2. **Investigate**: Run Phase 7-8 tests to identify root cause
3. **Fix**: Update policy, evaluator, or checkout logic
4. **Re-verify**: Run Phase 9 again
5. **Release**: Once verified, merge again

---

## Timeline Estimate

- **Phase 7** (Audit): 1-2 hours
- **Phase 8** (Proof Matrix Tests): 2-3 hours
- **Phase 9** (Production Verification): 1-2 hours
- **Total**: 4-7 hours (can run in 1-2 sessions)

---

## Contact & Questions

All code is documented inline. Key files:
- `lib/commercial/commercial-access-policy.ts` — Policy registry
- `lib/commercial/prerequisite-evaluators.ts` — Evaluation logic
- `pages/api/billing/checkout.ts` — Checkout endpoint (policy-routed)
- `docs/architecture/five-truth-dimensions.md` — Architecture principles
- `docs/COMMERCIAL_ACTIVATION_CONVERGENCE_STATUS.md` — Detailed status

---

**Next Step**: Verify Phase 5 completion, then proceed with Phase 7 audit.
