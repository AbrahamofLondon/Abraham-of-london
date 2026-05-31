# Decision Intelligence System Inventory
**Phase 0 — Stop Fragmentation**
Generated: 2026-05-31

## Status
Every module is classified as: KEEP | REWIRE | RESERVE | RETIRE | CONSOLIDATE

---

## Core Intelligence Modules

| Module | Path | Classification | Notes |
|--------|------|----------------|-------|
| Constraint Reality Layer | `lib/decision/constraint-reality-layer.ts` | **REWIRE** | Becomes ConstraintRealityLens inside kernel |
| Decision Failure Map | `lib/decision/decision-failure-map.ts` | **REWIRE** | Becomes FailureModeLens inside kernel |
| Foundry Analytics | `lib/foundry/track.ts` | **KEEP** | Browser-safe analytics helper; used across apertures |

---

## Public Surface Modules (Apertures)

| Module | Path | Classification | Notes |
|--------|------|----------------|-------|
| Decision Test Page | `pages/foundry/decision-test.tsx` | **REWIRE** | Renders FREE_SIGNAL aperture from Living Decision Case |
| Market Signal Test | `pages/foundry/market-signal-test.tsx` | **REWIRE** | Renders market/claim aperture from Living Decision Case |
| Release Risk Test | `pages/foundry/release-risk-test.tsx` | **REWIRE** | Renders release/operational aperture from Living Decision Case |
| Foundry Front Door | `pages/foundry/index.tsx` | **REWIRE** | Entry to decision aperture; must not be a tool menu |
| Verify Page | `pages/verify.tsx` | **KEEP** | Wire to case verification reference when engine is live |
| Continuity Page | `pages/continuity.tsx` | **KEEP** | Continuity doctrine; consistent with product doctrine |

---

## Interest Capture & Intake

| Module | Path | Classification | Notes |
|--------|------|----------------|-------|
| Interest Form | `components/foundry/InterestForm.tsx` | **REWIRE** | Becomes case intake; currently collects structured fields |
| Interest API | `pages/api/foundry/interest.ts` | **REWIRE** | Becomes `POST /api/cases` case creation endpoint |
| Verify API | `pages/api/verify.ts` | **KEEP** | Honest token classification; extend for real case tokens |

---

## Admin & Health

| Module | Path | Classification | Notes |
|--------|------|----------------|-------|
| Foundry Health | `pages/api/admin/foundry-health.ts` | **REWIRE** | Add intelligence quality metrics per brief §25 |

---

## Tests

| Module | Path | Classification | Notes |
|--------|------|----------------|-------|
| Ladder Reality Suite | `tests/product/ladder-reality.spec.ts` | **REWIRE** | 36 CRL tests still valid; extend for kernel lenses |
| DFM Tests | (not yet created) | **CREATE** | Failing tests before kernel build |

---

## Prisma Models

| Model | Table | Classification | Notes |
|-------|-------|----------------|-------|
| FoundryInterest | `foundry_interest` | **REWIRE** | Becomes case intake; extend or replace with `living_cases` |

---

## Diagnostic Modules Not Yet Classified

These exist across the product but are not yet wired to the Decision Intelligence path.

| Module | Location | Classification | Notes |
|--------|----------|----------------|-------|
| Fast Diagnostic | `app/admin/...` | **RESERVE** | Rewire to kernel in Phase 2 |
| Strategy Room | `app/admin/...` | **REWIRE** | Must continue a Living Decision Case; not restart intake |
| Executive Report | `app/api/admin/intelligence-foundry/...` | **RESERVE** | Rewire as EXECUTIVE_BOARD tier output in Phase 8 |

---

## Modules That Must Not Grow Until Kernel Is Live

Per brief §30:
- No new public surfaces
- No new monetisation routes
- No new checkout paths
- No new diagnostics
- No homepage expansion

---

## Exit Criteria for Phase 0

- [x] All modules classified
- [x] Canonical ladder documented (see product-ladder-canonical-map.md)
- [ ] Kernel skeleton started (Phase 1)
- [ ] 12 scenario fixtures representable (Phase 1)
