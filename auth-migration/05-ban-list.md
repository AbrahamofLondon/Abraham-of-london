# Ban List

This file defines patterns that must not survive the auth migration.

## Absolute bans

### 1. Client-side token authority
Banned:
- localStorage JWT as real access credential
- sessionStorage token as real access credential
- client-only entitlement logic that can disagree with server truth

Reason:
Client storage is not a safe trust anchor for protected access.

---

### 2. Spoofable bypasses
Banned:
- request headers that disable auth without cryptographic verification
- “internal” bypass switches that any client can send
- undocumented middleware bypass branches

Reason:
These are not shortcuts. They are holes.

---

### 3. Parallel truth models
Banned:
- multiple independent session systems with no canonical reconciliation
- different guards using different tier hierarchies
- page/UI assuming access the server does not grant

Reason:
Conflicting truth models create race conditions, broken UX, and security drift.

---

### 4. Ad-hoc API auth
Banned:
- route-specific secret header names invented per endpoint
- operator/admin auth implemented as scattered copy-paste checks
- one-off access logic outside canonical wrappers without documented exception

Reason:
This is fragile and impossible to audit properly at scale.

---

### 5. Ghost tiers
Banned:
- declaring tiers not enforced anywhere
- enforcing tiers not declared canonically
- multiple ordering schemes in different files

Reason:
A hierarchy that changes by file is theatre, not policy.

---

### 6. Unverified authority cookies or session claims
Banned:
- accepting signed-looking strings without verifying signature
- trusting format and expiry alone
- treating structured cookies as proof without integrity validation

Reason:
Integrity checks are not optional.

---

### 7. Activation keys treated as permanent auth regime
Banned:
- letting activation/access keys become a shadow login system forever
- key redemption that never collapses into canonical session truth
- unlimited uncontrolled reuse without policy

Reason:
Keys are lifecycle tools, not a permanent second empire.

---

### 8. Silent expiry chaos
Banned:
- expired users appearing logged in client-side while server rejects them
- tier downgrade without session invalidation
- revocation that leaves old sessions alive

Reason:
Expiry and revocation must be coherent or they mean nothing.

---

### 9. Hardcoded fallback secrets outside strictly local development
Banned:
- non-production environments relying on convenience secrets by default
- staging environments sharing unsafe fallback behavior
- undocumented secret fallbacks in auth-sensitive code

Reason:
Temporary convenience becomes permanent exposure.

---

### 10. UI-first auth redesign without pipeline redesign
Banned:
- redesigning the login page while leaving fragmented trust model intact
- solving activation with only front-end wording changes
- shipping visual polish on top of contradictory backend rules

Reason:
The form is not the system.

## Strong discouragements

These are not absolute bans, but require explicit justification.

### A. Device fingerprinting as a hard identity factor
Use cautiously. Prefer it as a risk signal, not gospel.

### B. Overcomplicated tier growth
Do not add more tiers because they sound sophisticated.

### C. Multi-cookie legacy compatibility forever
Use migration bridges temporarily, then cut the dead branches.

### D. Client polling to discover entitlement
Prefer server-resolved access where practical, and keep client polling narrow and cache-conscious.

## Rule of interpretation

When in doubt, prefer:
- server truth over client convenience
- explicit policy over magical fallback
- one canonical resolver over multiple partial checks
- fewer tiers over symbolic inflation
- revocable sessions over long-lived browser secrets

## Success condition

The migration is on the right path when:
- trust is server-authoritative
- access checks are unified
- lifecycle states are explicit
- operators can explain the system without drawing three parallel diagrams
