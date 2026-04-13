# DEBT REGISTER

Authoritative ledger of load-bearing compile errors and runtime hazards
that remain on `main` after `recovery/rebuild-zero-ts` merges. Every
residual TypeScript error in the recovery merge maps to exactly one
entry below, and every entry names its retirement vehicle.

Reviewers of the recovery merge PR: use this file to verify that the
error count does not imply oversight. If a residual error cannot be
matched to an entry here, that is a blocker.

Retirement vehicles:
- **schema chain PR 1** — `SCHEMA-PR-CHAIN-CHECKLIST-01` PR 1: `AccessTier` expansion to 9-tier canonical, `MemberStatus` adds `paused`, tier data migration.
- **schema chain PR 2** — `SCHEMA-PR-CHAIN-CHECKLIST-01` PR 2: consumer updates for tier/status writes, retire bridge patterns, align contentlayer vocabulary.
- **schema chain PR 3** — `SCHEMA-PR-CHAIN-CHECKLIST-01` PR 3: `SystemConfig` + `ConstitutionalSession*` models, `SystemAuditLog` hash chain columns, full audit writer funnel.
- **schema chain PR 4** — `SCHEMA-PR-CHAIN-CHECKLIST-01` PR 4: market-data honest 503, `PRODUCT_CODES` catalog additions, final `typescript.ignoreBuildErrors` flip.
- **post-chain debt** — tracked after the schema chain completes; not retired in any named PR above.

---

## 1. C1 tier migration

**Retirement PR:** schema chain PR 1 + schema chain PR 2.

**Affected files / error sites:**
- `lib/access/tier-map.ts` (12 errors) — every `DbTier.public`, `DbTier.inner_circle`, `DbTier.legacy`, `DbTier.architect`, `DbTier.owner` reference. The file is entirely forward-looking; its returns compile against the 9-value enum that PR 1 creates. **Red-line in recovery: do not touch.**
- `pages/api/webhooks/stripe.ts` write lines (2 errors at lines 116, 215) — `InnerCircleMember.tier` writes from the canonical 9-tier app value into the current 5-value Prisma enum. Read-side normalization was applied in Packet 3; write-side clears when PR 1 expands the enum and PR 2 removes any remaining bridging.
- `pages/api/admin/onboard-principal.ts` (1 error at line 134) — `DbAccessTier → AccessTier` contagion at the onboarding tier write.

**Notes:**
- The `contentlayer.config.ts` rogue 5-value tier vocabulary (`"verified"`, `"top-secret"` etc.) is bundled into PR 2's consumer alignment even though it is not a Prisma write site.

**Retired helper (not created):** the originally-planned `lib/access/prisma-tier-bridge.ts` narrow-lie staging helper was **retired before creation** because no truthful pre-migration 9→5 mirror source exists in the codebase. `lib/access/tier-map.ts`, which was the named source of truth, is entirely forward-looking and never successfully produced a current-enum value from a canonical app value. Any bridge written today would be a new mapping decision rather than a mirror. The schema chain closes C1 via PR 1 (enum expansion) and PR 2 (consumer alignment) without the bridge.

---

## 2. Identity rewrite cluster

**Retirement PR:** **closed in recovery, not deferred.**

**Status:** retired in full during Packet 2 of `PHASE-1-CLOSEOUT-01`. Four files rewritten to use `InnerCircleMember` as the sole persisted identity truth:
- `pages/api/access/revoke.ts` — commit `e6956d233`
- `pages/api/admin/security/resolve-appeal.ts` — commit `58f2ca2f3`
- `pages/api/admin/identity-audit.ts` — commit `909432d1c`
- `pages/api/admin/sync-fix.ts` — commit `862ec2d79` (converted to explicit no-op under consolidated identity; prior drift-detection model is obsolete)

No `prisma.user` references remain in `app/`, `pages/`, `lib/` outside NextAuth context objects. No `InnerCircleMember.userId` or `InnerCircleMember.user` relation references remain in the codebase. This entry is documented here for reviewer completeness — it is **not** a pending retirement.

---

## 3. Status enum expansion

**Retirement PR:** schema chain PR 1.

**Affected files / error sites:**
- `lib/security/anomaly-monitor.ts` (1 error at line 78) — velocity-triggered auto-lock writes `status: "paused"`.
- `lib/security/watchdog-delegate.ts` (1 error at line 62) — dormancy-triggered auto-lock writes `status: "paused"`.
- `lib/server/inner-circle-store.ts` (rogue local status type `"active" | "paused" | "disabled"`) — retired as part of PR 2 consumer alignment.

**Decision:** `MemberStatus` enum gains `paused` as a distinct value, preserving the semantic separation between system-auto lockout (`paused`) and admin-imposed suspension (`suspended`).

---

## 4. Audit chain

**Retirement PR:** schema chain PR 3.

**Affected files / error sites:**
- `lib/security/audit-chain.ts` (2 errors at lines 15, 31) — reads and writes `SystemAuditLog.hash` and `SystemAuditLog.prevHash` columns that do not exist in the current schema.

**Decision:** `SystemAuditLog` gains nullable `hash` and `prevHash` columns. Every `prisma.systemAuditLog.create` caller in the codebase is funneled through `writeChainedAudit` in the same PR. A chain verifier ships with the migration. **Conditional:** if any writer cannot be funneled within PR 3's scope, the decision flips to retire `audit-chain.ts` entirely (Option B per `SCHEMA-DECISION-FRAME-01 §3.4`).

---

## 5. Session telemetry

**Retirement PR:** schema chain PR 3.

**Affected files / error sites:**
- `lib/analytics/session-tracker.ts` (8 errors across lines 120, 174, 189, 307, 360, 382, plus 2 index-typing errors at 403) — writes to `db.constitutionalSession` and `db.constitutionalSessionEvent`, models that do not exist.

**Runtime hazard:** session tracker is wired into the live middleware path (`middleware/session-tracker.ts`, `proxy.ts`). Every request that trips the tracker is broken today. This is a pre-existing hazard on `main` that the recovery merge does not change.

**Decision:** PR 3 adds `ConstitutionalSession` and `ConstitutionalSessionEvent` models with the shape implied by the tracker's writes. JSON payloads stored as `String` columns on SQLite.

---

## 6. SystemConfig

**Retirement PR:** schema chain PR 3.

**Affected files / error sites:**
- `pages/api/admin/security/toggle-lock.ts` (1 error at line 26) — upserts `SystemConfig { key: "GLOBAL_LOCKDOWN" }` on a model that does not exist.

**Runtime hazard:** `components/admin/GlobalLockToggle.tsx` is wired to this route. The admin global-lockdown toggle is visible in the admin UI and crashes on press. Pre-existing hazard.

**Decision:** PR 3 adds a minimal `SystemConfig` key/value model matching the upsert shape. Long-term migration of the kill-switch to an env/flag store is logged separately as post-chain debt.

---

## 7. Market-data honest 503

**Retirement PR:** schema chain PR 4.

**Affected files / error sites:**
- `lib/predictive/services/executive-report-service.ts` (4 errors at lines 6, 7, 36, 45) — missing `ExecutiveReport` / `ReportMetadata` type exports, missing `db.marketData` model, implicit-any parameter.

**Runtime hazard:** `app/api/analytics/executive-report/route.ts` is a live route with no ingestion pipeline feeding the (non-existent) `MarketData` model. The route crashes on every call today. Pre-existing hazard.

**Decision:** PR 4 converts the route to return HTTP 503 with `{ error: "Market data ingestion pipeline not configured", code: "MARKET_DATA_UNAVAILABLE" }`. The service file gains local `ExecutiveReport` / `ReportMetadata` type declarations and a parameter annotation. **No `MarketData` Prisma model is created** — honest unavailable is the product posture.

---

## 8. Catalog cleanup

**Retirement PR:** schema chain PR 4 (partial) + post-chain debt.

### 8a. Live revenue codes missing from canonical set — schema chain PR 4

**Affected files / error sites:**
- `pages/api/billing/checkout.ts` — uses literal `"diagnostic_report_basic"` and `"diagnostic_report_pro"` as product codes, both of which flow through Stripe checkout but are not in `PRODUCT_CODES`. These are **live revenue flows**.

**Decision:** PR 4 adds `DIAGNOSTIC_REPORT_BASIC` and `DIAGNOSTIC_REPORT_PRO` to the canonical set in `lib/server/billing/entitlements.ts`, preserving the underscore-flat form as live-revenue debt.

### 8b. Aspirational `assessment.*` codes — post-chain debt

**Affected files / error sites:**
- `lib/server/billing/assessment-suite-entitlements.ts` (9 errors) — 9 dot-namespaced product codes that are not in `PRODUCT_CODES` and not in any live Stripe flow.

**Status:** requires operator product decision on whether the four `assessment.*` codes (`constitutional`, `team`, `enterprise`, `executive_reporting`) are real SKUs and whether the five `executive-report.*` / `strategy-room.*` codes are a notation migration or aspirational duplication of the canonical hyphen-flat set. **Not retired in the schema chain.**

### 8c. `mandate-commercialisation.ts productCode: string` widening — post-chain debt

**Affected files / error sites:**
- `lib/server/sovereign/mandate-commercialisation.ts` (2 errors at line 4 missing module, line 21 string → ProductCode).

**Status:** tightening `CommercialiseMandateInput.productCode` from `string` to `ProductCode` requires auditing every live caller to confirm canonical compliance. Deferred.

### 8d. `ExecutiveReportProductCode` cosmetic drift — post-chain debt

**Affected files / error sites:**
- `lib/reporting/executive-report-contract.ts` — `ExecutiveReportProductCode` type uses near-miss spellings of the canonical 5 codes (`executive-reporting-sample` vs `executive-report-sample`, `artifacts` vs `artefacts`).

**Status:** cosmetic, no live entitlement consumers of its string values as product codes. Deferred.

---

## 9. Provider truth / SQLite sensitivity

**Retirement PR:** post-chain debt.

**Affected files / error sites:**
- `lib/vault-engine.ts` (2 errors at lines 353, 354) — `{ contains: q, mode: "insensitive" }` on Prisma `StringFilter`. The current SQLite datasource does not support `mode: "insensitive"`.

**Decision:** retires either by (a) datasource migration to Postgres/Neon (implied by other codebase references to Neon but not in the schema chain), or (b) removing `mode` and accepting case-sensitive vault search. **Not scheduled in the named schema chain.**

---

## Additional non-chain debt (also deferred)

The following error sites are tracked but do not have a named schema chain retirement vehicle:

- `lib/alignment/sovereign-logic.ts` (1 error at line 104) — `PulseAnalysis.varianceIndex` missing. Governance friction formula 60/40 weighted; halving the dissonance leg by zeroing is a runtime semantic change. Requires operator audit of whether `varianceIndex` was renamed, nested, or never wired. **Post-chain debt.**
- `lib/alignment/campaign-actions.ts` (1 error at line 4) — missing `@/lib/resend` module. Conditional SAFE if an existing Resend wrapper is found; otherwise DEBT tied to campaign email nudge functionality. **Post-chain debt.**
- `lib/alignment/intervention-tracker.ts` — retired in Packet 1 commit `3a947ae83`. Not pending.
- `lib/decision/constitutional-guidance-assembler.ts` — retired in Packet 1 commit `3a947ae83`. Not pending.

---

## Red-line files (do not touch in recovery)

Any edit to these files before the schema chain lands is a lie. Reviewers should block PRs that touch them outside the schema chain:

- `lib/access/tier-map.ts` — every reference is forward-looking fiction until PR 1.
- `pages/api/webhooks/stripe.ts` write-side lines 116, 215 — C1 boundary; touched only for surrounding read-normalization context in Packet 3.
- `lib/security/audit-chain.ts` — no fake fix, no defensive `any` cast. PR 3 decides chain semantics.
- `lib/server/billing/assessment-suite-entitlements.ts` — no literal invention. PR 4 / post-chain.
- `pages/api/admin/onboard-principal.ts` — C1 boundary; PR 1 clears.
