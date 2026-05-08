# Pricing Route Remediation Plan

Generated: 2026-05-07

## Current State

- Active file: `app/(dashboard)/pricing/page.tsx`
- Public path: `/pricing`
- Current protection: inherited from `app/(dashboard)/layout.tsx` via `requireAdminServer()`

The immediate exposure risk is resolved. The remaining problem is authority confusion: `/pricing` reads like a buyer-facing route, but the underlying surface is dashboard/admin pricing matrix logic.

## Protection Confirmation

Current `(dashboard)` group members:

- `app/(dashboard)/pricing/page.tsx`
- `app/(dashboard)/portfolio/page.tsx`

Both inherit the same group layout:

- `app/(dashboard)/layout.tsx`

That layout blocks access before rendering children, so all routes in the group are protected consistently unless a route bypasses the layout, which these do not.

## Recommended Future Canonical Paths

Preferred order:

1. `/admin/pricing`
2. `/dashboard/pricing`
3. `/internal/pricing`

Reasoning:

- `/admin/pricing` is the clearest authority signal and best matches the current access policy.
- `/dashboard/pricing` is viable if the broader group is meant to become a named authenticated workspace.
- `/internal/pricing` is accurate but less idiomatic than `/admin/pricing`.

## Why The Route Is Not Being Moved In This Pass

- Route renaming changes live authority and risks breaking deep links, internal references, and any undocumented tooling.
- The current protection is already working.
- Existing references are mostly documentary at the moment, but a route move still needs a planned compatibility layer and redirect decision.

## Safe Future Remediation Path

1. Create the chosen canonical route, preferably `/admin/pricing`.
2. Move the pricing matrix implementation behind that explicit namespace.
3. Leave `/pricing` as one of the following, depending on the launch plan:
   - protected compatibility redirect to the admin path
   - hard 404/410 if no public pricing page is intended
   - future buyer-facing public pricing page, only when explicitly assigned
4. Update internal references and smoke coverage.
5. Remove the hidden-authority `(dashboard)` path only after reference confirmation.

## Risk Assessment

- Short-term launch risk: low, because access control is in place.
- Trust/clarity risk: medium, because `/pricing` still looks public.
- Migration risk: medium, because the path is simple but route authority changes can have undocumented consumers.
