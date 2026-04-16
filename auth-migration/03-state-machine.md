# Lifecycle State Machine

## Goal

Define a real lifecycle for members and sessions.

The current system behaves as if users are simply “in DB” or “not in DB.”  
That is not sufficient.

## Member statuses

Minimum canonical statuses:
- invited
- active
- expired
- suspended

Optional later:
- pending_activation
- revoked

## Session statuses

Minimum canonical session statuses:
- active
- expired
- revoked

## Activation key statuses

Minimum canonical key statuses:
- active
- redeemed
- expired
- revoked

## Lifecycle states

### INVITED
Subject has been issued an activation instrument but is not yet active.

Characteristics:
- may not have a full member record yet, depending on implementation choice
- may have an email and an issued key
- no normal member access yet

### ACTIVE
Subject has completed activation or valid identity linkage and holds a valid session.

Characteristics:
- member status = active
- entitled to tiered access
- session can be renewed on active use

### RETURNING TRUSTED
This is not necessarily a separate member status; it is a session/trust condition.

Characteristics:
- valid existing session
- recognized device/session
- low-friction return path

### EXPIRED
Subject’s active access/session has lapsed.

Characteristics:
- may still have identity
- no longer allowed to use protected resources requiring active membership
- must re-activate, renew, or re-auth according to policy

### SUSPENDED
Subject is explicitly denied access.

Characteristics:
- sessions revoked
- keys revoked
- access denied regardless of prior trust state

### DOWNGRADED
Not necessarily a status enum; often a transition event.

Characteristics:
- member remains active
- tier reduced
- existing sessions invalidated or re-issued

## Core transitions

### Invite issued
- from: none
- to: invited
- action: create activation key, set expiry, send invite

### Activation redeemed
- from: invited or expired
- to: active
- action:
  - validate key
  - create or update member record
  - issue canonical session
  - optionally mark key redeemed / increment redemption count

### Trusted return
- from: active
- to: active (same member status, new trust/session state)
- action:
  - validate session
  - renew if sliding TTL threshold reached

### Session expiry
- from: active
- to: expired
- action:
  - mark session expired
  - clear cookie on next request or logout path

### Re-activation
- from: expired
- to: active
- action:
  - validate new or renewed activation instrument
  - issue new canonical session

### Suspension
- from: any member state
- to: suspended
- action:
  - revoke active sessions
  - revoke active keys
  - deny future access until reinstated

### Tier downgrade
- from: active at higher tier
- to: active at lower tier
- action:
  - update tier
  - invalidate existing sessions
  - require fresh session at new tier
  - optionally present downgrade reason

## Session renewal policy

Use a sliding renewal policy for active users.

Recommended rule:
- if a valid session has consumed more than 50% of its TTL, renew it for a fresh full TTL

This avoids forcing active users to re-authenticate on a rigid schedule while keeping idle sessions finite.

## Key policy

Activation/access keys must have explicit rules:
- purpose
- expiry
- redemption limits
- revocation support
- linkage to member or invite target
- auditability

Keys are not general-purpose permanent credentials.

## UX implications

### Invited user
Should see:
- activation language
- clear explanation
- no misleading “login with password you don’t yet have” experience

### Active returning user
Should experience:
- direct entry if session valid
- no repeated activation friction

### Expired user
Should see:
- clear expiration state
- re-activation / renewal path
- no ambiguous “wrong password” messaging for an entitlement lapse

### Suspended user
Should see:
- clear denial
- operator contact or review path if appropriate
- no silent loop back to generic login

## Success condition

The state machine is correct when:
- every important auth state is explicit
- transitions are intentional
- expiry is handled deliberately
- revocation is enforceable
- downgrade is not silent chaos
- UI states map cleanly to actual server states
