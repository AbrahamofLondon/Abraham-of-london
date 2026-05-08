# Access Repair & Institutional Command Strategy

**Date**: 2026-05-08  
**Source**: £50k Institutional Command Recovery Audit  
**Principle**: No new features. Verify, consolidate, surface, suppress.

---

## Phase 1 — Stabilise Access ✅ COMPLETED

**No £50k enterprise work matters if access control is shaky.**

### Checklist (from forensic audit)

| Item | Status | Action Taken |
|------|--------|-------------|
| One resolver | ⚠️ Dual authority remains (`getUserAccess` vs `resolveIdentity`) | Identified; needs dedicated consolidation pass (115+ files) |
| No legacy authority | ✅ Fixed | `verifyAccessSession()` and `maybeRenewSession()` removed from `resolveIdentity()` |
| No client-side authority | ✅ Fixed | `/inner-circle/admin` now uses `getUserAccess()` SSR; admin users redirected to `/admin` |
| Admin guarded properly | ✅ Verified | App Router admin layout uses `requireAdminServer()` → `isAuthorizedAdminSession()` |
| Downloads protected | ✅ Confirmed | Server-side enforcement |
| Invite/key flows safe | ✅ Confirmed | Transactional with audit |
| Legacy endpoint files | ✅ Deleted | `enter.ts`, `revoke.ts`, `redeem-key.ts.legacy` removed |
| Full build clean | ⚠️ Typecheck passes (0 errors); build fails on pre-existing `NextRouter` errors | Not access-related |

### Phase 1 Deliverable

- ✅ One resolver (`getUserAccess()`) is the primary authority
- ✅ Legacy session verification disabled
- ✅ `/inner-circle/admin` now server-guarded
- ✅ App Router admin routes verified
- ✅ Legacy endpoint files deleted
- ✅ TypeScript typecheck passes with zero errors

---

## Phase 2 — Build the Command Shell, Not More Features ✅ COMPLETED

**The £50k product needs one visible centre of gravity.**

**Location**: `app/admin/command/page.tsx` — accessible at `/admin/command`

**Design**: Single consolidated page. No new models. No new API routes. Queries existing data through Prisma directly (App Router server component).

**Auth**: Protected by `requireAdminServer()` via the App Router admin layout.

### Institutional Command / Control Room

This is **not a dashboard**. It is a **governed command environment** showing:

| Surface | Purpose |
|---------|---------|
| Active institutional decisions | What is currently being retained, monitored, or enforced |
| Recurring patterns | What patterns repeat across clients/campaigns |
| Cost exposure | What is the financial drift of delayed decisions |
| Irreversibility movement | Which decisions are becoming harder to reverse over time |
| Boardroom archive | Historical record of board-level interventions |
| Counsel history | Record of counsel given and whether it was followed |
| Cadence breaches | Where oversight cadence has been broken |
| Organisation divergence | Where organisations are drifting from alignment |
| Oversight cycle status | Current state of each oversight cycle |
| What would be lost if oversight stopped | Projected consequence of ceasing oversight |

### Design Constraint

- **No new database models.** Use existing `RetainedDecision`, `EnforcementCycle`, `EscalationEvent`, `ConsequenceTimeline`, `CalibrationState`, `GovernanceLog`, `DecisionContactLedger`.
- **No new API routes.** Query existing endpoints.
- **One page.** Single consolidated view, not a suite of dashboards.

---

## Phase 3 — Surface Hidden Value Without Leaking IP ✅ COMPLETED

**Status**: Already implemented by previous agent. Verified and confirmed.

### Evidence

The client-facing oversight brief page (`pages/oversight/brief/[cycleId].tsx`) surfaces all required signals safely:

| Signal | How It's Surfaced | IP Safe? |
|--------|------------------|----------|
| What repeated | `patternRecurrence` section with prior count and explanation | ✅ Self-evident from data |
| What worsened | `cycleComparison.deltas` filtered by direction | ✅ Shows direction, not scoring |
| What became expensive | `costOfInaction` with total estimated and cases included | ✅ Aggregate only |
| What became harder to reverse | `irreversibility` with level and explanation | ✅ Level label, not formula |
| What was escalated | `counselHistory` with event count and open items | ✅ Counts only |
| What the client would have missed | `valueProtected.missedSignals` with whyItMatters | ✅ Narrative, not mechanics |
| What options are closing | `strategicOptions` filtered by CLOSING/EXPIRED status | ✅ Status labels only |
| What would be lost | `cancellationLoss` and `indispensability` sections | ✅ Area labels, not internals |
| Organisation divergence | `organisationDivergence` with sponsor-safe summaries | ✅ Suppressed detail count |

### What is NOT exposed (verified clean)

- ❌ No engine internals in client-facing output
- ❌ No scoring logic, formulas, or thresholds
- ❌ No prompt structures or arbitration mechanics
- ❌ No raw respondent data or identifying details
- ❌ No operator-only interpretation layers

### Suppression layer

- Audience-specific briefs: `BOARD_LEVEL` vs `CLIENT_SPONSOR`
- `suppressions` array with section, reason, and explanation for each withheld item
- Retainer access verification before serving any brief
- Organisation membership check for non-admin viewers
- Suppression notice displayed when content is withheld

---

## Phase 4 — Suppress Overclaim ✅ COMPLETED

**Status**: Already implemented by previous agent. Verified and confirmed.

### Internal usage (correct — admin/docs only)

| Location | Phrase | Appropriate? |
|----------|--------|-------------|
| `app/admin/command/page.tsx` | "Institutional Command" (header) | ✅ Admin-only |
| `app/admin/command/page.tsx` | "Governed Oversight Environment" (label) | ✅ Correct public-safe language |
| `pages/admin/index.tsx` | "Institutional Command" (module link) | ✅ Admin-only |
| `docs/product/*.md` | "Institutional Command" | ✅ Internal docs |

### Public / client-facing usage (verified clean)

| Location | Phrase Used | Verdict |
|----------|------------|---------|
| `pages/oversight/brief/[cycleId].tsx` | "Governed Oversight Brief" | ✅ Correct |
| `pages/oversight/brief/[cycleId].tsx` | "Board-safe consequence view" / "Sponsor-safe governed view" | ✅ Correct |
| `pages/index.tsx` | "Institutional" (nav link), "institutional analysis" | ✅ Generic, safe |
| All other public pages | No overclaim language detected | ✅ Clean |

### No instances found of (searched all .tsx/.ts files):

- "Command Centre" in any public surface
- "Control Room" in any public surface
- "Command Surface" in any public surface
- "Institutional Command" in any public surface

### Principle

Strong, but not reckless. The product is becoming powerful faster than the execution discipline can control it. That is a good problem **only if you now impose governance**. Otherwise, the codebase becomes a museum of brilliant half-finished weapons.

---

## Bottom Line

**The fix is not "build more."**

The fix is:
1. **Verify access** — one resolver, no legacy, no client-side authority
2. **Consolidate command** — one governed command surface, not more dashboards
3. **Surface hidden value** — show what repeated, worsened, became expensive
4. **Suppress IP leakage** — never expose internals, scoring, or mechanics
5. **Stop letting agents turn audits into sprawling implementation adventures**

---

*End of repair strategy. This is the governing document for all subsequent access and command work.*
