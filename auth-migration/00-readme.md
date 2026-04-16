# Auth Migration — Source of Truth

This directory defines the target authentication, entitlement, and clearance model for Abraham of London.

Use these files as the governing brief for implementation. They exist to stop ad-hoc auth drift and to force one coherent pipeline across public pages, member surfaces, restricted areas, operator tools, and APIs.

## Scope

This migration covers:
- identity establishment
- enrollment and activation
- session issuance and renewal
- clearance / tier enforcement
- route and API protection
- revocation, expiry, downgrade, and suspension behavior
- trusted return behavior
- operator/admin access separation

## What this replaces

The current system is structurally fragmented. It contains:
- parallel session systems
- client-side authority via localStorage
- inconsistent tier enforcement
- mismatched guard logic across middleware, pages, and APIs
- activation keys that behave like a separate auth universe
- security holes that should not exist in a serious system

This migration does **not** start from “fix the login form.” It starts from “fix the trust model.”

## Non-negotiable principles

1. **Server authority only**
   - No client-side token is authoritative.
   - No localStorage token may grant or imply real access.

2. **Identity and entitlement are separate**
   - Identity answers who the subject is.
   - Entitlement answers what the subject may access.

3. **One canonical resolved identity**
   - Every request resolves to a single server-side identity object.
   - Every boundary uses the same access decision logic.

4. **Activation keys are enrollment instruments**
   - Keys are used to invite, activate, and re-activate.
   - Keys are not a permanent parallel session model.

5. **One tier model**
   - One canonical hierarchy.
   - No declared hierarchy that differs from enforced hierarchy.

6. **One enforcement contract**
   - Middleware, pages, APIs, and server guards all rely on the same access engine.

## Expected implementation order

1. Close critical security holes
2. Unify session resolution
3. Unify access enforcement
4. Implement lifecycle state machine
5. Align tiers and schema
6. Add device trust / operator tooling only after the core is stable

## Deliverable expectation for implementation agents

Before code changes:
- read every file in this directory
- treat these files as source-of-truth
- do not invent a competing architecture

During implementation:
- work in phases
- do not patch only UI
- do not preserve unsafe legacy behavior “for convenience”
- do not commit until local verification passes

After implementation:
- return changed files
- return verification notes
- return remaining risks / migration debt

## Required outcome

The finished pipeline should feel simple from the outside:
- invited users can activate access cleanly
- active members return without friction
- expired users are handled deliberately
- suspended users are locked out decisively
- operators have a separate, explicit control path
- pages, APIs, and middleware agree on access
- the system can be audited without archaeology
