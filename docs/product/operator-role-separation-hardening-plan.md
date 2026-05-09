# Operator Role Separation Hardening Plan

Current state: role separation is real but still partly env-driven.

## Current boundaries

- Public pages: no operator-only data should be imported or rendered.
- Sponsor-safe pages: aggregate visibility only; no raw respondent text, operator notes, or counsel notes.
- Operator/admin pages: currently enforced through admin session checks and environment email lists.

## Current limitation

- `lib/product/operator-role-access.ts` derives oversight operator roles from environment lists.
- This is workable for controlled delivery, but not yet robust enough for a generalised high-value retained oversight claim.

## Low-risk improvement delivered in this pass

- Sponsor-safe retained oversight now composes from sponsor-safe read models rather than operator surfaces.

## Next hardening steps

1. Centralise operator-role resolution behind one server helper used by all oversight, counsel, and boardroom admin routes.
2. Replace environment-only role assignment with durable operator-role records.
3. Add route-level assertions so sponsor-safe pages cannot import operator-only data loaders by mistake.
4. Add audit logging for role-elevated views.

## Readiness implication

- Sufficient for `SELECTIVE_15K_READY`.
- Not sufficient for `GENERAL_50K_READY`.

