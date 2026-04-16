# Execution Order

## Goal

Implement auth unification in a sequence that reduces risk and stops security exposure first.

Do not attempt a grand rewrite in one swing.

## Phase 0 — Immediate security closure

These are mandatory before structural refinements.

### Required fixes
1. Remove spoofable bypass headers
2. Verify constitutional/session signatures properly
3. Fix activation key format mismatch
4. Consolidate admin secret/header model
5. Remove unsafe fallback secrets from any non-local environment

### Output
- no auth bypass via spoofable request header
- no acceptance of unsigned/forged authority cookies
- key redemption path works consistently
- one machine/admin secret contract
- no embarrassing default secrets leaking across environments

## Phase 1 — Canonical session unification

### Objective
Establish one server-authoritative trust path.

### Required work
1. Retire localStorage Inner Circle JWT as authority
2. Build canonical `resolveIdentity()` on the server
3. Align NextAuth identity with entitlement session issuance
4. Normalize request identity into one resolved shape
5. Reduce cookie ambiguity where feasible

### Output
- one authoritative identity/session resolution path
- client consumes access state, does not author it
- OAuth/admin/member paths resolve into same server-side identity model

## Phase 2 — Enforcement unification

### Objective
Make all boundaries use the same access logic.

### Required work
1. Replace fragmented guards with canonical helpers:
   - `withAuth(requiredTier)`
   - `withApiAuth(requiredTier)`
   - middleware access check using canonical tier model
2. Ensure all protected pages and APIs use the same tier comparison rules
3. Remove or deprecate ad-hoc one-off checks

### Output
- one enforcement method
- one tier hierarchy in practice
- no mismatch between middleware and page/API checks

## Phase 3 — Lifecycle state machine

### Objective
Implement explicit lifecycle behavior.

### Required work
1. add member statuses if absent
2. add sliding session renewal
3. invalidate sessions on suspension/revocation/tier downgrade
4. provide clear expired/reactivation path
5. ensure activation key lifecycle is explicit

### Output
- active users renew cleanly
- expired users re-enter deliberately
- revoked users are actually revoked
- tier changes take effect coherently

## Phase 4 — Tier and schema cleanup

### Objective
Remove conceptual debris.

### Required work
1. align all tier declarations to the canonical tier set
2. remove ghost tiers or implement them properly
3. align Prisma/schema/type definitions
4. document final hierarchy in one canonical place

### Output
- no mismatch between declared and enforced tiers
- fewer ceremonial abstractions
- easier auditing

## Phase 5 — Optional advanced trust controls

Do only after the core is clean.

### Possible additions
1. device/session inventory
2. key redemption limits per device
3. suspicious-device flags
4. session dashboard and targeted revocation
5. renewal / downgrade notification UX

### Output
- more operator control
- more trust intelligence
- not required for core correctness

## Working rules during implementation

- no UI-only patching before backend model is aligned
- no localStorage authority
- no preserve-everything legacy sentimentality
- no commit until each phase is verified locally
- no moving to later phases while known critical flaws remain open

## Verification gates

### After Phase 0
- spoofable bypass closed
- signature verification works
- key format mismatch gone

### After Phase 1
- localStorage authority retired
- one resolved identity object available
- basic public/member/operator flows work

### After Phase 2
- middleware, pages, and APIs agree on access
- no route-level guard contradiction

### After Phase 3
- expiry / re-activation / suspension flows behave predictably

### After Phase 4
- canonical tier hierarchy reflected across code and schema

## Deliverable expectation

At the end of each phase:
- changed files
- verification notes
- remaining risks
- no silent scope creep
