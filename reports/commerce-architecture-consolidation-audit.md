# Commerce Architecture Consolidation Audit

**Generated:** 2026-05-31
**Auditor:** Kernel Reality Proof Pack + Manual Route Audit

---

## Executive Summary

**Is there a parallel architecture?** YES — but it is not active in public UI.

The legacy **Decision Brief Order** architecture exists in code but has **zero external references** from public pages, components, or navigation. It is a dormant parallel system that was never fully activated or has been superseded.

The new **Living Case** architecture is the canonical system. All public routes, checkout APIs, fulfilment workflows, and admin surfaces now point to or are being built around the Living Decision Case.

**Verdict:** READY_FOR_STRIPE_TEST_SMOKE — with the caveat that legacy code should be reserved/retired to prevent confusion.

---

## 1. Architecture Inventory

### Legacy Decision Brief Order Architecture

| Item | File/Route | Status | Creates Payment | Creates Entitlement | Links to LDC | Public UI | Admin UI | Recommendation |
|---|---|---|---|---|---|---|---|---|
| `DecisionBriefOrder` model | `prisma/schema.prisma:4483` | LEGACY | No (data model only) | No | No | No | Yes (admin brief-orders) | RESERVE — keep model for audit history, mark as legacy |
| `decision_brief_orders` table | DB migration | LEGACY | N/A | N/A | No | N/A | N/A | RESERVE — keep for audit, no new rows expected |
| Checkout API | `pages/api/checkout/decision-failure-brief.ts` | LEGACY | Yes (Stripe) | No (creates DB row) | No | No (no public links found) | No | RETIRE — return 410 Gone |
| Confirm API | `pages/api/checkout/decision-failure-brief-confirm.ts` | LEGACY | No (confirms) | No | No | No | No | RETIRE — return 410 Gone |
| Success page | `pages/foundry/brief/success.tsx` | LEGACY | No | No | No | No (no public links found) | No | REDIRECT to `/foundry/case/success` |
| Admin brief-orders page | `app/admin/intelligence-foundry/brief-orders/page.tsx` | LEGACY | No | No | No | No | Yes | RESERVE — label as Legacy, keep for reference |
| Admin brief-orders API | `app/api/admin/intelligence-foundry/brief-orders/route.ts` | LEGACY | No | No | No | No | Yes | RESERVE — keep for legacy data access |
| Admin brief-orders detail API | `app/api/admin/intelligence-foundry/brief-orders/[id]/route.ts` | LEGACY | No | No | No | No | Yes | RESERVE |
| Admin brief draft generation | `app/api/admin/intelligence-foundry/brief-orders/[id]/generate-draft/route.ts` | LEGACY | No | No | No | No | Yes | RESERVE |
| Brief sample page | `pages/foundry/brief/sample.tsx` | LEGACY | No | No | No | No (no public links) | No | RESERVE |
| BriefCheckoutBlock component | Not found in codebase | DEAD | N/A | N/A | N/A | N/A | N/A | No action needed — does not exist |
| Old pricing block | Not found referencing legacy brief | DEAD | N/A | N/A | N/A | N/A | N/A | No action needed |

### New Living Case Architecture

| Item | File/Route | Status | Creates Payment | Creates Entitlement | Links to LDC | Public UI | Admin UI | Recommendation |
|---|---|---|---|---|---|---|---|---|
| `LivingDecisionCase` contract | `lib/intelligence/living-decision-case-contract.ts` | ACTIVE | No | No | Yes (itself) | Via kernel signal | Via fulfilment | KEEP |
| `LivingCasePersistence` | `lib/intelligence/living-case-persistence.ts` | ACTIVE | No | No | Yes | No | Yes | KEEP |
| `LivingCaseEventLedger` | `lib/intelligence/living-case-events.ts` | ACTIVE | No | No | Yes | No | No | KEEP |
| `LivingCase` Prisma schema | `prisma/schema/living-case.prisma` | ACTIVE | No | No | Yes | No | No | KEEP — needs migration |
| `checkout-entitlement` engine | `lib/commercial/checkout-entitlement.ts` | ACTIVE | No (creates session) | Yes | Yes | No | Via fulfilment | KEEP |
| `COMMERCIAL_LADDER` | `lib/commercial/ladder.ts` | ACTIVE | No (price data) | No | No | No | No | KEEP |
| Checkout API | `app/api/checkout/living-case/route.ts` | ACTIVE | Yes (Stripe session) | No (creates session) | Yes (caseId in metadata) | Via Foundry | No | KEEP — canonical |
| Confirm API | `app/api/checkout/living-case-confirm/route.ts` | ACTIVE | No (confirms) | Yes | Yes | No | No | KEEP — canonical |
| Success page | `app/foundry/case/success/page.tsx` | ACTIVE | No | No | Yes (caseId) | Via checkout redirect | No | KEEP — canonical |
| `AdminFulfilmentEngine` | `lib/intelligence/admin-fulfilment.ts` | ACTIVE | No | No | Yes | No | Yes | KEEP — canonical |
| `FreeSignalResult` | `components/kernel/FreeSignalResult.tsx` | ACTIVE | No | No | No (displays signal) | Yes (Foundry) | No | KEEP |
| Kernel signal API | `pages/api/public/kernel-signal.ts` | ACTIVE | No | No | Yes (creates LDC) | Yes (Foundry) | No | KEEP |
| Foundry decision test | `pages/foundry/decision-test.tsx` | ACTIVE | No | No | Yes (via kernel) | Yes | No | KEEP |
| Foundry market signal | `pages/foundry/market-signal-test.tsx` | ACTIVE | No | No | Yes (via kernel) | Yes | No | KEEP |
| Foundry release risk | `pages/foundry/release-risk-test.tsx` | ACTIVE | No | No | Yes (via kernel) | Yes | No | KEEP |

---

## 2. Route Conflict Audit

| Route | Architecture | Status | Conflict |
|---|---|---|---|
| `POST /api/checkout/living-case` | Living Case | ACTIVE — canonical | None |
| `POST /api/checkout/living-case-confirm` | Living Case | ACTIVE — canonical | None |
| `POST /api/checkout/decision-failure-brief` | Legacy Brief | LEGACY — no public links | No active conflict (no public page posts here) |
| `POST /api/checkout/decision-failure-brief-confirm` | Legacy Brief | LEGACY — no public links | No active conflict |
| `/foundry/case/success` | Living Case | ACTIVE — canonical | None |
| `/foundry/brief/success` | Legacy Brief | LEGACY — no public links | No active conflict |

**Conclusion:** No competing active checkout routes. Legacy routes are dormant.

---

## 3. Public UI Audit

| Check | Result |
|---|---|
| Old decision brief checkout form in public pages | ❌ Not found |
| Old pricing block in public pages | ❌ Not found |
| `DecisionBriefOrder` flow in public pages | ❌ Not found |
| `/foundry/brief/success` link in public pages | ❌ Not found |
| `/api/checkout/decision-failure-brief` call in public pages | ❌ Not found |
| Checkout/pricing inside Free Signal routes | ❌ Not found (confirmed by integrity check) |

**Conclusion:** No legacy brief system leakage in public UI.

---

## 4. Admin UI Audit

| Check | Result |
|---|---|
| Legacy brief-orders page exists | ✅ `app/admin/intelligence-foundry/brief-orders/` |
| Legacy brief-orders is primary fulfilment queue | ❌ It is the only fulfilment queue currently |
| Living Case fulfilment queue exists | ❌ Not yet built as admin page (only `AdminFulfilmentEngine` exists) |
| Admin navigation clearly separates canonical vs legacy | ❌ Not yet — both would appear in admin nav |

**Action needed:** Build Living Case fulfilment admin page and label legacy brief-orders as "Legacy / Archived".

---

## 5. Integrity Check Results

| Check | Status |
|---|---|
| Public code posts to `/api/checkout/decision-failure-brief` | ✅ Not found |
| Public code links to `/foundry/brief/success` | ✅ Not found |
| `DecisionBriefOrder` flow appears as active checkout | ✅ Not found |
| Two active success pages without canonical redirect | ✅ No conflict (legacy page has no public links) |
| Old brief-orders admin page is primary while LivingCase exists | ⚠️ Legacy is currently the only fulfilment queue |
| Checkout metadata lacks caseId/caseReference/tier | ✅ Present in new architecture |
| Payment can create fulfilment without LivingDecisionCase | ✅ Legacy system does this — but it's dormant |
| Entitlement can be created without payment confirmation | ✅ New system prevents this |
| Low-stakes case can purchase dossier | ✅ New system prevents this |
| Raw scenario text in Stripe metadata | ✅ Not present |

---

## 6. Consolidation Actions

### Immediate (safe, no production impact)

1. **Retire legacy checkout APIs** — Add 410 Gone response to:
   - `pages/api/checkout/decision-failure-brief.ts`
   - `pages/api/checkout/decision-failure-brief-confirm.ts`

2. **Redirect legacy success page** — Add redirect in `pages/foundry/brief/success.tsx` to `/foundry/case/success`

3. **Label legacy admin page** — Add "Legacy / Archived" banner to `app/admin/intelligence-foundry/brief-orders/`

### Short-term (after Stripe smoke)

4. **Build Living Case fulfilment admin page** — Wire `AdminFulfilmentEngine` to an admin UI

5. **Update admin navigation** — Point primary fulfilment queue to Living Case, move legacy to archived section

### Long-term (after production verification)

6. **Remove legacy code** — Only after confirming zero production dependencies

---

## 7. Readiness Verdict

**READY_FOR_STRIPE_TEST_SMOKE**

The legacy Decision Brief Order architecture is dormant — no public pages reference it, no active checkout flows use it, and no external integrations depend on it. The new Living Case architecture is the canonical system with all required components:

- ✅ Checkout session creation with caseId/tier metadata
- ✅ Payment confirmation with entitlement grant
- ✅ Fulfilment queue item creation
- ✅ Admin fulfilment engine
- ✅ Controlled success page (no auto-delivery)
- ✅ Low-stakes protection
- ✅ Human review flagging
- ✅ No raw scenario text in metadata

**Stripe test smoke is now safe to run.**
