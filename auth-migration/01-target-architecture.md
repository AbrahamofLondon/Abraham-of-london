# Target Architecture

## Objective

Replace the fragmented auth stack with one coherent trust chain.

The target architecture is:
- NextAuth retained for identity/session framework
- server-side entitlement resolution added as the real access authority
- activation keys used for enrollment and re-activation
- canonical resolved identity used everywhere
- client UI becomes a consumer of server truth, not an author of it

## High-level model

### 1. Identity layer

Establishes who the subject is.

Allowed identity sources:
- OAuth
- credentials (operator/admin only)
- activation key redemption
- trusted session restore

Identity does **not** by itself imply access to any protected resource.

### 2. Enrollment layer

Tracks lifecycle status of the subject.

Required statuses:
- invited
- active
- expired
- suspended

Optional future statuses:
- pending_activation
- revoked

### 3. Session layer

Issues one canonical server-authoritative session.

Session requirements:
- httpOnly cookie
- secure in production
- server-backed lookup
- revocable
- renewable via sliding TTL for active users
- tied to member status and current tier
- invalidated on suspension, revocation, or tier downgrade

### 4. Entitlement / clearance layer

Defines what the subject may access.

A subject may be:
- authenticated but inactive
- authenticated but expired
- authenticated and active at a low tier
- authenticated and operator
- anonymous but carrying a valid activation instrument

Access is determined from resolved identity, not from whatever token happened to appear in the browser.

### 5. Enforcement layer

One access engine used everywhere.

Boundaries that must use the same logic:
- middleware / proxy
- page guards
- server loaders
- API wrappers
- client visibility helpers

## Canonical resolved identity shape

Every server request should resolve to one object with a shape conceptually like:

```ts
type ResolvedIdentity = {
  subjectId: string | null;
  identityType: "anonymous" | "member" | "operator";
  memberStatus: "invited" | "active" | "expired" | "suspended" | null;
  tier: "public" | "member" | "inner_circle" | "client" | "architect" | "owner";
  isInternal: boolean;
  sessionId: string | null;
  trustLevel: "none" | "session" | "trusted_device";
  source: "anonymous" | "oauth" | "credentials" | "activation_key" | "session_cookie";
  expiresAt: string | null;
};
```

Exact fields may vary, but the concept must remain.

## Canonical request flow

### Anonymous visitor
1. no valid session
2. resolveIdentity() returns anonymous/public
3. public content allowed, restricted content denied

### Invited / activation flow
1. visitor arrives with activation key
2. server validates key
3. member record created or reactivated
4. canonical session issued
5. future requests resolve through normal session path

### Returning active member
1. httpOnly session cookie sent
2. session resolved server-side
3. status and tier checked
4. session renewed if sliding TTL threshold reached
5. access granted consistently

### Operator / admin
1. operator identity established via dedicated internal path
2. resolved identity marked internal and tiered appropriately
3. access checks use same engine, not a shadow regime

## What must be retired

Retire as authority:
- localStorage Inner Circle JWT
- client-side token-based gating as real access control
- multi-cookie ambiguity where multiple legacy cookie names are all considered
- ad-hoc route-level header auth except for explicitly documented machine-to-machine paths
- spoofable bypasses of any kind

## Boundary rules

### Middleware
- performs early coarse gating
- must use canonical identity resolution
- must not invent its own tier hierarchy
- must not trust spoofable client headers

### Pages and server data loaders
- use canonical access helper
- do not re-implement tier logic

### APIs
- use canonical API auth wrapper
- no custom one-off checks unless explicitly justified and documented

### Client
- may reflect access state for UX
- must never be the source of truth
- must not hold authoritative long-lived access tokens in localStorage

## Success condition

The architecture is correct when:
- one subject produces one resolved identity per request
- one access function determines permission
- one tier hierarchy exists
- one lifecycle model exists
- one session model exists
- operators and members are separated cleanly
- no protected route depends on client-only state for authority
