# Schema Chain Execution Checklist

**Authoritative Implementation Plan — PR 1 → PR 4 + Deploy Gate**

---

## Overview

This document is the **single source of truth** for executing the schema chain following the recovery merge.

**Chain order (locked):**

1. Recovery merge → main
2. PR 1 — Enum expansion + data migration
3. PR 2 — Consumer alignment
4. PR 3 — Runtime hazard closure + audit chain
5. PR 4 — Honest 503 + catalog completion + type/build honesty
6. Deploy Gate — runtime readiness validation

**Critical rule:**
Merge ≠ Deploy.
Production deploy occurs **only after the full chain completes and passes the deploy gate.**

---

# PR 1 — Schema Expansion + Data Migration

## Objective

Expand `AccessTier` from 5 → 9 canonical values and extend `MemberStatus` with `paused`.

## Changes

* Expand `AccessTier` enum:

  ```
  public, member, inner_circle, restricted, client, legacy, architect, owner, top_secret
  ```
* Remove:

  ```
  partner, executive, sovereign
  ```
* Add:

  ```
  MemberStatus.paused
  ```

## Data Migration (must run before enum drop)

```
partner   → architect
executive → architect
sovereign → owner
```

Apply to all columns:

* InnerCircleMember.tier
* ContentMetadata.classification
* StrategicFramework.tier
* CanonEntry.tier
* BriefPrint.tier
* Print.tier
* AccessAuditLog.requiredTier
* AccessAuditLog.currentTier

## Preconditions

* No unexpected tier values in DB
* Stripe metadata audit complete
* Full DB backup created
* Prisma client generates successfully

## Acceptance

* No rows retain partner/executive/sovereign
* Row counts unchanged
* Prisma validate passes
* TypeScript errors may increase (expected)

## Do NOT include

* Any consumer code changes
* Any additional schema changes
* Any product/catalog logic

---

# PR 2 — Consumer Alignment

## Objective

Align all application code to the new 9-tier canonical enum.

## Scope

### Tier Consumers

* Delete or neutralize `lib/access/tier-map.ts`
* Replace all `toDbTier` usage with direct enum values
* Fix tier writes in:

  * Stripe webhook
  * onboarding routes
  * inner-circle routes
  * admin upgrade paths

### Status Consumers

* Ensure `"paused"` is used as a valid enum
* Remove any fake/local status unions

### Contentlayer

* Align tier vocabulary to canonical underscore format
* Ensure MDX builds clean

## Cleanup

* Remove all dash-form literals:

  ```
  inner-circle → inner_circle
  top-secret   → top_secret
  ```
* Remove all:

  ```
  "partner", "executive", "sovereign"
  ```

## Acceptance

* All tier/status errors resolved
* No `tier-map` imports remain
* Contentlayer builds successfully
* TypeScript error count drops significantly

## Do NOT include

* Any schema change
* Any audit/session work
* Any product catalog changes

---

# PR 3 — Runtime Hazard Closure + Audit Chain

## Objective

Fix broken runtime surfaces and implement **real audit-chain integrity**.

## Schema Additions

### New Models

* `SystemConfig`
* `ConstitutionalSession`
* `ConstitutionalSessionEvent`

### SystemAuditLog

Add:

```
hash     (string)
prevHash (string)
```

Backfill:

```
hash = 'GENESIS' for all existing rows
```

---

## Hazards Closed

1. Session tracker → now persists
2. GlobalLockToggle → now functional
3. Audit chain → now real (not theoretical)

---

## Audit Chain Rule (Non-negotiable)

* Only ONE writer allowed:

  ```
  writeChainedAudit(...)
  ```
* All existing writers must be routed through it

## Required Work

* Replace all:

  ```
  prisma.systemAuditLog.create
  logSystemAudit(...)
  ```

  with funnel

* Extend writer to support transactions

## Chain Verifier (Mandatory)

* Command: `npm run verify:audit-chain`
* Must:

  * validate full chain
  * detect tampering

## Acceptance

* All audit writes funnel through single function
* Verifier passes on clean data
* Verifier fails on tampered data
* Session tracker writes succeed
* Toggle lock works correctly

## Fatal Conditions

* Any audit writer bypasses funnel → STOP
* No verifier → STOP
* Chain partially implemented → STOP

---

# PR 4 — Closeout + Honest Runtime

## Objective

Finalize system honesty and prepare for deploy.

---

## Market Data Route

Replace all handlers:

```
/api/analytics/executive-report
```

Return:

```json
{
  "error": "Market data ingestion pipeline not configured",
  "code": "MARKET_DATA_UNAVAILABLE"
}
```

* No service call
* No retry logic
* Always 503

---

## Product Catalog

Add:

```
diagnostic_report_basic
diagnostic_report_pro
```

to `PRODUCT_CODES`.

---

## Type Fix (Service File Only)

* Inline missing types
* Fix implicit any
* Do NOT change runtime behavior

---

## Build Honesty

Attempt:

```
typescript.ignoreBuildErrors → false
```

If not possible:

* leave true
* document blockers

---

## Acceptance

* Route returns 503 consistently
* Product codes valid in Stripe webhook
* Service compiles
* TypeScript errors reduced to post-chain debt only

---

# DEPLOY GATE — FINAL AUTHORIZATION

## Must ALL pass

### Technical

* All PRs merged in correct order
* All migrations applied
* Prisma validate passes
* Build completes

### Data Integrity

* No retired tier values exist
* Audit chain valid
* Product codes consistent

### Runtime Paths

* Auth works
* Stripe writes succeed
* Session tracker writes
* Global lock works
* Audit chain intact
* Market route returns 503

### Code Integrity

* No prisma.user usage
* Only one audit writer
* No legacy tier literals

---

## Production Deploy = Allowed ONLY IF:

ALL of the following are true:

* Chain complete
* DB migrated
* Runtime validated
* No blocking debt remains
* Deploy gate checklist fully satisfied

---

## Non-Blocking Debt (Post-Chain)

* sovereign-logic.ts
* campaign-actions.ts
* vault-engine SQLite sensitivity
* assessment catalog decisions
* product code normalization
* kill-switch architecture refactor

---

## Final Rule

**Compile clean ≠ Production ready**
**Green CI ≠ Deployment authorization**

Only the deploy gate determines release readiness.

---

**END**
