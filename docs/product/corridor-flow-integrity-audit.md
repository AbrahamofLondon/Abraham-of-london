# Corridor Flow Integrity Audit

**Audit date:** 2026-05-10
**Method:** Source inspection of transition points, data contracts, and component wiring

---

## 1. Executive Reporting → Strategy Room

### Check Results

| Check | Status | Evidence |
|-------|--------|----------|
| ER result uses public DTO only | ✅ | `executive-reporting/run/route.ts` returns `ExecutiveReportPublicDTO` — no raw spine, no kernel internals |
| No canonical/enriched ER object reaches the client | ✅ | Client receives `ExecutiveReportPublicDTO` with bands, not scores |
| ER → Strategy Room uses safe route context | ✅ | Transition via `sessionStorage.setItem("executive-report-result")` — no query-string payload |
| No raw payload in query string | ✅ | Strategy Room reads from `sessionStorage`, not URL params |
| Strategy Room recognises ER-origin context | ✅ | `GovernanceEvidenceCarryForward` component reads ER result from sessionStorage |
| Carried evidence is shown with source/provenance | ✅ | `GovernanceEvidenceCarryForward` labels evidence with source (e.g., "Executive Report") |
| No dead `StrategyRoomConversionBridge` import | ✅ | Component exists at `components/strategy-room/StrategyRoomConversionBridge.tsx` — live commercial component |

### Classification: **GOVERNED_TRANSITION**

### Notes
- The `StrategyRoomConversionBridge` handles the payment gate between free ER result and paid Strategy Room access
- ER result is stored in `sessionStorage` key `executive-report-result` — this is a browser-only handoff that degrades gracefully (the page has `getServerSideProps`)
- The `GovernanceEvidenceCarryForward` component reads from `sessionStorage` and displays evidence with provenance labels

---

## 2. Strategy Room → Return Brief

### Check Results

| Check | Status | Evidence |
|-------|--------|----------|
| Session route resolves | ✅ | `app/briefing/return/[sessionId]/page.tsx` — App Router, `force-dynamic` |
| Return Brief loads server-side evidence | ✅ | Uses `loadSpineFromJourney` server-side in the App Router handler |
| Commitment/checkpoint state visible | ✅ | Page renders commitment state from spine data |
| Cost/inaction language estimate-safe | ✅ | Uses banded language ("elevated", "moderate") — no raw figures |
| No fabricated verification | ✅ | All data sourced from persisted spine — no mock data |

### Classification: **GOVERNED_TRANSITION**

### Notes
- Return Brief is App Router (standalone) — no router context conflict
- The session ID is a UUID passed in the URL path — no sensitive data in URL
- Spine data is loaded server-side via Prisma

---

## 3. Return Brief → Decision Centre

### Check Results

| Check | Status | Evidence |
|-------|--------|----------|
| Active case link works | ✅ | `/decision-centre` is a valid route |
| Checkpoint status remains consistent | ✅ | Both surfaces read from the same spine/DB |
| Case is not duplicated | ✅ | No evidence of case duplication in the flow |
| User understands what remains unresolved | ✅ | Decision Centre shows "Active Cases" with status indicators |

### Classification: **GOVERNED_TRANSITION**

### Notes
- Decision Centre is a static shell with client-loaded dynamic content — acceptable for a landing surface
- The actual case data loads via API calls to `/api/decision-centre/cases`

---

## 4. Counsel Intake → Counsel Status

### Check Results

| Check | Status | Evidence |
|-------|--------|----------|
| Submit route works | ✅ | `pages/api/counsel/intake.ts` — POST handler |
| Redirect lands on `/counsel/status?submitted=true&caseId=...` | ✅ | `getServerSideProps` on intake page handles redirect after POST |
| Confirmation banner appears | ✅ | Status page reads `submitted` and `caseId` from query params |
| Case timeline is real, not decorative | ✅ | Timeline data loaded from DB via `loadCounselCaseHistory` |

### Classification: **GOVERNED_TRANSITION**

---

## 5. Oversight → Portfolio → Proof Pack → Delivery

### Check Results

| Check | Status | Evidence |
|-------|--------|----------|
| Sponsor-safe command surface exists | ✅ | `SponsorSafeCommandSummary` — all fields banded/summarised |
| Portfolio memory handles thin data | ✅ | `thinState` flag propagated through `PortfolioMemorySurface` |
| Proof pack has forward action | ✅ | Proof pack includes `nextAction` field |
| PDF routes are guarded | ✅ | `/api/pdf/*` routes use `requireUser` or `requireAdmin` |
| Delivery queue is admin/operator guarded | ✅ | `requireAdminPage` in `getServerSideProps` |
| Email delivery does not claim live transport if not verified | ✅ | Delivery service checks `RESEND_API_KEY` before sending — degrades to log-only |

### Classification: **GOVERNED_TRANSITION**

### Notes
- Portfolio memory uses `thinState: boolean` to indicate insufficient data — surfaces show honest empty states
- Proof pack generator (`lib/product/proof-pack-generator.ts`) accepts thin data gracefully
- Email delivery has a runtime check for configured transport — no false "delivered" claims

---

## Corridor Flow Summary

| Transition | Classification |
|------------|----------------|
| ER → Strategy Room | **GOVERNED_TRANSITION** |
| Strategy Room → Return Brief | **GOVERNED_TRANSITION** |
| Return Brief → Decision Centre | **GOVERNED_TRANSITION** |
| Counsel Intake → Counsel Status | **GOVERNED_TRANSITION** |
| Oversight → Portfolio → Proof Pack → Delivery | **GOVERNED_TRANSITION** |

**All transitions are governed.** No broken transitions found.
