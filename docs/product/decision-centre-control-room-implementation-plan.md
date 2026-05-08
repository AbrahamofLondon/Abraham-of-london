# Decision Centre, Control Room & Operator Console Implementation Plan

**Date:** 2026-05-07
**Authority:** Decision Infrastructure by Abraham of London

---

## Task Classification

| Priority | Meaning |
|----------|---------|
| NOW | Can implement safely with existing schema and modules |
| NEXT | Requires moderate work, no schema migration |
| LATER | Requires design decisions or significant work |
| SCHEMA_REQUIRED | Needs Prisma schema changes — requires approval |
| DESIGN_DECISION_REQUIRED | Needs product/UX decision before implementation |
| DO_NOT_TOUCH_YET | Too early, risky, or dependent on other work |

---

## Decision Centre (Individual User)

| Task | Priority | Notes |
|------|----------|-------|
| Create `/decision-centre` route (app router) | NOW | New page, no conflict |
| Create `/api/decision-centre/cases` API route | NOW | Uses `deriveLivingCase()` + entitlement lookups |
| Create `lib/product/decision-centre-contract.ts` | NOW | TypeScript types for API response |
| Wire Living Case cards with evidence tier, admission status | NOW | Data already available |
| Add entitlement status (owned/eligible/restricted products) | NOW | `ClientEntitlement` already queryable |
| Add admission status per deep surface | NOW | Admission modules already exist |
| Add Return Brief links with trajectory status | NOW | Data from existing API |
| Add Decision Credit display | NEXT | `getCreditProfile()` exists |
| Add outcome verification queue | NEXT | `OutcomeVerificationRecord` queryable |
| Add continuity markers per case | NEXT | `deriveSignalContinuity()` exists |
| Retire legacy `/dashboard` routes → redirect to `/decision-centre` | NEXT | After Decision Centre is stable |
| Add historical diagnostic records as archive subsection | LATER | Migration from existing pattern |

---

## Control Room (Organisation Sponsors)

| Task | Priority | Notes |
|------|----------|-------|
| Design Control Room UX | DESIGN_DECISION_REQUIRED | See architecture doc |
| Create `/control-room` or `/organisation/[slug]/control-room` route | NEXT | After design approval |
| Create `/api/control-room/organisation/[id]` API | NEXT | Aggregates campaigns, members, evidence |
| Wire campaign completion and divergence data | NEXT | TeamAssessmentSnapshot, aggregates exist |
| Add respondent privacy enforcement | NOW (documentation) | Rules defined in campaign architecture doc |
| Add org-level admission status | NEXT | Derive from member campaign data |
| Organisation-level entitlement model | SCHEMA_REQUIRED | Currently per-user only |

---

## Operator Console (Internal Admins)

| Task | Priority | Notes |
|------|----------|-------|
| Restructure admin index.tsx navigation into console sections | NEXT | Non-breaking — navigation change only |
| Merge access-revoke.tsx into access-keys.tsx | NOW | access-revoke already redirects |
| Merge pdf-status.tsx into pdf-dashboard.tsx | NEXT | Consolidation |
| Add Living Cases overview section | NEXT | New aggregation view over DiagnosticJourney |
| Add admission queue view | NEXT | Aggregates from StrategyInquiry + admission results |
| Add permission levels (Operator, Reviewer, Finance, etc.) | LATER | Requires role model extension |
| Rename admin sections to console sections | DESIGN_DECISION_REQUIRED | Naming approval needed |

---

## Paid Ladder

| Task | Priority | Notes |
|------|----------|-------|
| Map all products to access states | NOW | Documentation — see paid-ladder-readiness-map.md |
| Wire `evaluateERAdmission()` → checkout | DONE | Already implemented |
| Wire `evaluateStrategyRoomAdmission()` → execution | DONE | Already implemented |
| Add product access state to Decision Centre case cards | NOW | Uses ClientEntitlement + admission |
| Add "eligible to commission" language replacing "Buy report" | NOW | Copy change |
| Configure Constitutional/Team/Enterprise as SUBSIDISED | DESIGN_DECISION_REQUIRED | Pricing decision |
| Add retainer tier visibility | LATER | RetainerContract model exists |

---

## Multi-User Team/Enterprise

| Task | Priority | Notes |
|------|----------|-------|
| Document campaign privacy rules | NOW | See campaign architecture doc |
| Validate existing campaign models support architecture | NOW | Already validated — models are comprehensive |
| Add completion threshold enforcement | NEXT | Logic exists, needs formal enforcement |
| Add divergence detection | NEXT | Gap analysis exists, needs aggregation view |
| Add campaign-to-Living-Case generation | LATER | Requires design decision on org-level cases |
| Add respondent consent tracking | SCHEMA_REQUIRED | Named mode consent not explicitly tracked |
| Add cross-campaign divergence persistence | LATER | New analysis layer |

---

## Recommended Next Implementation Pass

**Pass 1 (NOW):**
1. Create `lib/product/decision-centre-contract.ts`
2. Create `/api/decision-centre/cases` API route
3. Create `/decision-centre` page (app router)
4. Wire Living Case, entitlements, admissions into case cards
5. Merge access-revoke into access-keys

**Pass 2 (NEXT):**
1. Add Decision Credit, continuity markers, outcome queue to Decision Centre
2. Restructure admin navigation into Operator Console sections
3. Begin Control Room design
4. Add campaign completion threshold enforcement

**Pass 3 (LATER):**
1. Implement Control Room
2. Add organisation-level entitlement model
3. Configure paid tiers for mid-ladder diagnostics
4. Add permission levels to Operator Console
