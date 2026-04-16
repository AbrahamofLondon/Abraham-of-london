# Canonical Tier Model

## Goal

Replace the current mismatch between declared tiers and enforced tiers with one canonical hierarchy.

## Recommended final tier set

Keep the model lean unless a tier has a live business use.

```ts
type Tier =
  | "public"
  | "member"
  | "inner_circle"
  | "client"
  | "architect"
  | "owner";
```

## Tier definitions

### public
Anonymous web visitor.

Capabilities:
- public pages
- public previews
- no member-only or restricted content

### member
Registered but not yet fully elevated.

Use cases:
- basic account holder
- pending or low-clearance member
- eligible for upgrade / activation path

Capabilities:
- authenticated identity
- limited member-only surfaces if defined
- not equivalent to Inner Circle

### inner_circle
Activated member with gated access.

Capabilities:
- core protected member surfaces
- inner-circle content
- vault-eligible content if policy allows

### client
Paying or explicitly contracted user.

Capabilities:
- all inner_circle capability
- client-specific consulting or restricted materials
- not automatically an operator

### architect
Senior/founding/high-trust member.

Capabilities:
- broader restricted access
- governance / advanced diagnostics if product requires
- still not the same as system owner unless explicitly intended

### owner
System operator / top administrative authority.

Capabilities:
- full internal access
- operational/admin routes
- override and revocation capability

## Ordering

```ts
const TIER_ORDER = {
  public: 0,
  member: 1,
  inner_circle: 2,
  client: 3,
  architect: 4,
  owner: 5,
} as const;
```

## Access rule

A subject satisfies a required tier when:

```ts
TIER_ORDER[resolvedTier] >= TIER_ORDER[requiredTier]
```

Use one canonical helper, e.g.:

```ts
hasAccess(resolvedTier, requiredTier)
```

This helper must be reused across:
- middleware
- server guards
- API wrappers
- page loaders
- UI helpers

## What to remove or explicitly justify

The following current notions must not survive by accident:
- restricted
- legacy
- top_secret

Only keep any of them if:
1. there is a current product/business requirement
2. routes and APIs genuinely enforce them
3. schema, policy, and UI all agree on what they mean

Otherwise delete them.

## Internal / operator distinction

`isInternal` is not itself a tier.  
It is a trust attribute that may accompany a tier.

Example:
- a subject may be `owner + isInternal=true`
- a subject may be `architect + isInternal=false`

Use `isInternal` only where genuinely needed for operator-only actions.  
Do not let it become a second hidden hierarchy.

## Required files to align

During migration, all of the following must be aligned to the exact same tier set:
- tier policy definitions
- tier maps
- Prisma enums or schema mappings
- middleware gate rules
- server guards
- HOCs / wrappers
- API auth wrappers
- client type definitions
- admin UI / operator tools

## Success condition

The model is correct when:
- there is one declared hierarchy
- every enforcement point uses it
- no code path references a ghost tier
- no route/API relies on a different ordering
- admin/operator logic is explicit, not accidental
