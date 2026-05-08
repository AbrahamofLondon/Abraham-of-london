# Product Access Contract

**Date:** 2026-05-07
**Authority:** Decision Infrastructure by Abraham of London
**Implementation:** `lib/product/decision-centre-contract.ts` (types), existing modules (logic)

---

## Access Resolution Query

```
canActorAccessProduct({
  actorId,        // User ID or email
  organisationId, // Optional — for org-level products
  caseId,         // Living Case ID — for admission-gated products
  productCode,    // From catalog SSOT
  requestedSurface, // The specific page/API being accessed
})
```

## Access Resolution Response

```
{
  access: "ALLOW" | "PAY_REQUIRED" | "ADMISSION_REQUIRED" | "RESTRICT" | "BLOCK",
  entitlementStatus: "ACTIVE" | "EXPIRED" | "REVOKED" | "NONE",
  admissionStatus: "ADMITTED" | "RESTRICTED" | "NOT_EVALUATED",
  roleStatus: "AUTHORISED" | "INSUFFICIENT" | "NOT_REQUIRED",
  evidenceStatus: "SUFFICIENT" | "INSUFFICIENT" | "NOT_REQUIRED",
  reason: string,
  repairActions: string[],
  checkoutPath: string | null,
  returnPath: string,
}
```

---

## Resolution Logic

```
1. Check entitlement (ClientEntitlement or Entitlement by email/userId + productCode)
   → ACTIVE: continue to admission check
   → EXPIRED/REVOKED: return PAY_REQUIRED or BLOCK
   → NONE: check if product is OPEN/SUBSIDISED

2. Check product access state (from catalog)
   → OPEN: return ALLOW (no payment, no admission)
   → SUBSIDISED: return ALLOW (currently free)
   → PAID_REQUIRED: check if purchased → PAY_REQUIRED if not

3. Check admission (for gated surfaces: ER, Strategy Room)
   → Call evaluateERAdmission() or evaluateStrategyRoomAdmission()
   → ADMITTED: return ALLOW
   → RESTRICTED: return ADMISSION_REQUIRED with repair actions

4. Check role (for org-level products)
   → Is actor a sponsor/admin of the organisation?
   → AUTHORISED: continue
   → INSUFFICIENT: return RESTRICT

5. Return access decision with full context
```

---

## Existing Implementation Mapping

| Step | Existing Module | Location |
|------|----------------|----------|
| Entitlement check | `resolveCanonicalEntitlement()` | `lib/server/strategy-room/access.server.ts` |
| Product catalog | `checkCheckoutEligibility()` | `lib/commercial/catalog.ts` |
| ER admission | `evaluateERAdmission()` | `lib/diagnostics/executive-reporting/admission.ts` |
| SR admission | `evaluateStrategyRoomAdmission()` | `lib/strategy-room/admission.ts` |
| Do-not-sell gate | `checkDoNotSellGate()` | `lib/commercial/do-not-sell-gate.ts` |
| Tier policy | `hasAccess()` | `lib/access/tier-policy.ts` |
| Living Case | `deriveLivingCase()` | `lib/product/living-case-store.ts` |

The access resolution contract does not replace these modules. It describes the conceptual flow that a unified `canActorAccessProduct()` function would implement by composing them.

---

## Per-Product Access Rules

| Product | Entitlement Required | Admission Required | Evidence Required | Role Required |
|---------|---------------------|-------------------|------------------|--------------|
| Fast Diagnostic | No | No | No | No |
| Purpose Alignment | No | No | No | No |
| Constitutional Diagnostic | No | No | No | No |
| Team Assessment | No | No | No | Sponsor (respondent mode) |
| Enterprise Assessment | No | No | No | Sponsor (respondent mode) |
| Executive Reporting | Yes (`assessment.executive_reporting`) | Yes (`evaluateERAdmission`) | Yes (upstream stages) | No |
| Strategy Room | Yes (`strategy-room.entry`) | Yes (`evaluateStrategyRoomAdmission`) | Yes (constitutional + decision) | No |
| Return Brief | Yes (via SR entitlement) | Yes (session access) | Yes (execution record) | No |
| Decision Tools | Yes (per tool) | No | No | No |
| Retainer | Yes (contracted) | N/A | N/A | Org sponsor |
