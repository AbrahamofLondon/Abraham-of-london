# Client Dashboard Reclassification

**Date:** 2026-05-07
**Current state:** Legacy diagnostic record archive. Most dashboard routes redirect to `/admin` or are retired.
**Target state:** Decision Centre — a governed operating console for individual paying users.

---

## Current Client-Facing Dashboards

| Route | Status | Purpose |
|-------|--------|---------|
| `/pages/dashboard.tsx` | RETIRED | Redirects to /admin (owner/admin) or /access (authenticated) |
| `/pages/board/dashboard.tsx` | RETIRED | Redirects to /admin |
| `/pages/client/dashboard.tsx` | RETIRED | Redirects to /admin |
| `/pages/inner-circle/dashboard.tsx` | ACTIVE | Inner Circle member dashboard |
| `/app/dashboard/live/page.tsx` | ACTIVE | Sovereign Live Terminal: PDF Analytics Engine |
| `/app/dashboard/pdf-analytics/page.tsx` | ACTIVE | PDF analytics |
| `/app/dashboard/purpose-alignment/page.tsx` | RETIRED | Redirects to /diagnostics/purpose-alignment |

---

## Why The Current Dashboard Must Change

The current dashboard pattern treats the user as someone who **completed diagnostics and buys reports**.

Decision Infrastructure requires treating the user as someone with **active Living Cases under governed intelligence**.

| Current framing | Required framing |
|----------------|-----------------|
| Diagnostic records list | Active Living Cases |
| Score / severity / band | Evidence tier / cognitive state / continuity |
| "Buy Premium Report" button | "Eligible to commission Executive Reporting" (admission-governed) |
| Report download links | Governed artifacts with access grants |
| No case continuity | Continuity markers, prior commitments, outcome verification |
| No admission visibility | Admission status per deep surface |
| No repair path | Repair actions for restricted surfaces |

---

## Recommendation

The current diagnostic record archive should become either:

1. **A legacy subsection** within the new Decision Centre (under "Historical Records")
2. **Retired entirely** with records accessible through the Living Case view

The new Decision Centre (`/decision-centre`) should be the primary authenticated user experience, built on server-authoritative Living Case data via `deriveLivingCase()`.

See `docs/product/decision-centre-v0-architecture.md` for the full v0 spec.

---

## Migration path

| Step | Priority |
|------|----------|
| Create `/decision-centre` route | NOW |
| Create `/api/decision-centre/cases` API | NOW |
| Wire `deriveLivingCase()` as data source | NOW |
| Add entitlement + admission enrichment | NOW |
| Link from existing nav/header | NOW |
| Retire `/dashboard` redirect → point to `/decision-centre` | NEXT |
| Archive legacy diagnostic record view as subsection | NEXT |
| Add organisation-level Control Room link for sponsors | LATER |
