# Hostile Test Manifest

**Project:** Abraham of London — Check Visual
**Last updated:** 2026-05-07
**Owner:** Security Lead

---

## Overview

This document defines a deterministic, repeatable hostile test inventory for the application. Each test has a unique ID, a specific attack vector, an expected response, and a designation of whether it can run locally or requires staging infrastructure.

**Base URL convention:**
- Local: `http://localhost:3000`
- Staging: `https://<branch>--<site>.netlify.app`
- Production: `https://abrahamoflondon.com`

All examples below use `$BASE` as a placeholder. Set it before running:

```bash
export BASE="http://localhost:3000"
```

---

## AUTH — Authentication and Authorization Bypass

| ID | Category | Attack | Target Route | Expected Response | Infra Required | Env |
|----|----------|--------|-------------|-------------------|----------------|-----|
| A01 | Auth | Unauthenticated admin access | `GET /admin/dashboard` | 302/307 redirect to login | None | Local |
| A02 | Auth | Forged session cookie | `GET /admin/dashboard` | 302/307 redirect to login (cookie rejected) | None | Local |
| A03 | Auth | Expired JWT | `GET /api/v2/users` | 401 Unauthorized | None | Local |
| A04 | Auth | Role escalation (member to admin) | `GET /admin/dashboard` | 302/307 redirect to login or 403 | DB (seeded user) | Local |
| A05 | Auth | Cross-user session access | `GET /api/sovereign/report` | 401 or scoped to own data only | DB (two users) | Local |
| A06 | Auth | Cron without CRON_SECRET | `POST /api/cron/snapshot` | 401 Unauthorized | None | Local |
| A07 | Auth | Cron with wrong secret | `POST /api/cron/snapshot` | 401 Unauthorized | None | Local |
| A08 | Auth | Cron via GET (method bypass) | `GET /api/cron/snapshot` | 405 Method Not Allowed | None | Local |
| A09 | Auth | Sovereign auth with forged cookie | `GET /api/sovereign/report` | 401 Unauthorized | None | Local |
| A10 | Auth | Admin IP restriction bypass (X-Forwarded-For spoof) | `GET /admin/dashboard` | 302/307 or 403 (spoofed header ignored) | None | Local |

### A01: Unauthenticated admin access

```bash
curl -s -o /dev/null -w "%{http_code}" "$BASE/admin/dashboard"
# Expected: 302 or 307
```

### A02: Forged session cookie

```bash
curl -s -o /dev/null -w "%{http_code}" \
  -H "Cookie: next-auth.session-token=forged-invalid-session-token-abc123" \
  "$BASE/admin/dashboard"
# Expected: 302 or 307
```

### A03: Expired JWT

```bash
# Generate an expired JWT (iat and exp in the past)
EXPIRED_JWT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEiLCJyb2xlIjoibWVtYmVyIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDAwMDF9.invalid"
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $EXPIRED_JWT" \
  "$BASE/api/v2/users"
# Expected: 401
```

### A04: Role escalation (member to admin)

```bash
# Log in as a member-tier user, then attempt admin access
# Requires a seeded member-role session token
curl -s -o /dev/null -w "%{http_code}" \
  -H "Cookie: next-auth.session-token=<MEMBER_SESSION_TOKEN>" \
  "$BASE/admin/dashboard"
# Expected: 302 or 403 (not 200)
```

### A05: Cross-user session access

```bash
# User A's session attempting to read User B's sovereign report
curl -s -o /dev/null -w "%{http_code}" \
  -H "Cookie: next-auth.session-token=<USER_A_SESSION_TOKEN>" \
  "$BASE/api/sovereign/report?userId=<USER_B_ID>"
# Expected: 401 or returns only User A's data (never User B's)
```

### A06: Cron without CRON_SECRET

```bash
curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE/api/cron/snapshot"
# Expected: 401
```

### A07: Cron with wrong secret

```bash
curl -s -o /dev/null -w "%{http_code}" \
  -X POST \
  -H "Authorization: Bearer wrong-secret-value" \
  "$BASE/api/cron/snapshot"
# Expected: 401
```

### A08: Cron via GET (method bypass)

```bash
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $CRON_SECRET" \
  "$BASE/api/cron/snapshot"
# Expected: 405
```

### A09: Sovereign auth with forged cookie

```bash
curl -s -o /dev/null -w "%{http_code}" \
  -H "Cookie: ogr_sovereign_session=forged-sovereign-session-value" \
  "$BASE/api/sovereign/report"
# Expected: 401
```

### A10: Admin IP restriction bypass (X-Forwarded-For spoof)

```bash
curl -s -o /dev/null -w "%{http_code}" \
  -H "X-Forwarded-For: 127.0.0.1" \
  "$BASE/admin/dashboard"
# Expected: 302 or 403 (spoofed IP must not grant access)
```

---

## TOKEN — Download Token Abuse

| ID | Category | Attack | Target Route | Expected Response | Infra Required | Env |
|----|----------|--------|-------------|-------------------|----------------|-----|
| T01 | Token | Expired download token | `GET /api/download/[token]` | 401 or 403 (token expired) | DB (expired token row) | Staging |
| T02 | Token | Token replay (same token twice) | `GET /api/download/[token]` | 403 on second use (if single-use) | DB (valid token) | Staging |
| T03 | Token | Token purpose mismatch | `GET /api/download/[token]` | 403 (wrong purpose) | DB (report token) | Staging |
| T04 | Token | Token for different user | `GET /api/download/[token]` | 403 (user binding mismatch) | DB (two users + token) | Staging |
| T05 | Token | Malformed token (truncated) | `GET /api/download/[token]` | 400 or 404 | None | Local |
| T06 | Token | Token with future iat | `GET /api/download/[token]` | 401 or 403 | DB (crafted token) | Staging |

### T01: Expired download token

```bash
# Insert an expired token into the database first, then:
curl -s -o /dev/null -w "%{http_code}" \
  "$BASE/api/download/expired-token-id-here"
# Expected: 401 or 403
```

### T02: Token replay (same token twice)

```bash
# Use a valid token once (should succeed), then replay:
TOKEN="valid-single-use-token"
curl -s -o /dev/null -w "%{http_code}" "$BASE/api/download/$TOKEN"
# First call: 200
curl -s -o /dev/null -w "%{http_code}" "$BASE/api/download/$TOKEN"
# Second call: 403 (if single-use enforced) or 200 with usage counter incremented
```

### T03: Token purpose mismatch

```bash
# Use a token created for "report" purpose on the download endpoint:
curl -s -o /dev/null -w "%{http_code}" \
  "$BASE/api/download/report-purpose-token-id"
# Expected: 403
```

### T04: Token for different user

```bash
# Log in as User B, use a download token bound to User A:
curl -s -o /dev/null -w "%{http_code}" \
  -H "Cookie: next-auth.session-token=<USER_B_SESSION>" \
  "$BASE/api/download/user-a-token-id"
# Expected: 403 (binding mismatch)
```

### T05: Malformed token (truncated)

```bash
curl -s -o /dev/null -w "%{http_code}" \
  "$BASE/api/download/abc"
# Expected: 400 or 404
```

### T06: Token with future iat

```bash
# Insert a token with iat set 1 hour in the future:
curl -s -o /dev/null -w "%{http_code}" \
  "$BASE/api/download/future-iat-token-id"
# Expected: 401 or 403
```

---

## ENTITLEMENT — Commercial Gate Bypass

| ID | Category | Attack | Target Route | Expected Response | Infra Required | Env |
|----|----------|--------|-------------|-------------------|----------------|-----|
| E01 | Entitlement | Download without entitlement | `POST /api/checkout` then `GET /api/download/[token]` | 403 (no entitlement) | DB (user without entitlement) | Staging |
| E02 | Entitlement | Price injection in checkout | `POST /api/checkout` | 400 or ignored (price from server catalog) | Stripe test mode | Staging |
| E03 | Entitlement | Entitlement slug injection | `POST /api/checkout` | 400 (invalid slug rejected) | None | Local |
| E04 | Entitlement | Direct PDF URL access | `GET /assets/downloads/any.pdf` | 3xx redirect or 403/404 | None | Local |
| E05 | Entitlement | Legacy /api/dl/ bypass | `GET /api/dl/some-file` | 404 or 403 | None | Local |

### E01: Download without entitlement

```bash
# As a user with no entitlements, attempt to generate a download:
curl -s -o /dev/null -w "%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=<NO_ENTITLEMENT_USER_SESSION>" \
  -d '{"slug":"check-visual-report"}' \
  "$BASE/api/checkout"
# Then attempt to use any fabricated token:
curl -s -o /dev/null -w "%{http_code}" \
  "$BASE/api/download/fabricated-token"
# Expected: 403
```

### E02: Price injection in checkout

```bash
# Attempt to pass a custom price in the checkout payload:
curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"slug":"check-visual-report","price":0,"currency":"gbp"}' \
  "$BASE/api/checkout"
# Expected: 400 (strict schema rejects extra fields) or price ignored
# The zod schema uses .strict() — extra fields cause validation failure
```

### E03: Entitlement slug injection

```bash
curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"slug":"../../etc/passwd"}' \
  "$BASE/api/checkout"
# Expected: 400 (slug validation fails)
```

### E04: Direct PDF URL access

```bash
curl -s -o /dev/null -w "%{http_code}" \
  "$BASE/assets/downloads/check-visual-report.pdf"
# Expected: 301/302/307 redirect to /api/downloads/ or 403 or 404
# MUST NOT return 200 with PDF content
```

### E05: Legacy /api/dl/ bypass

```bash
curl -s -o /dev/null -w "%{http_code}" \
  "$BASE/api/dl/check-visual-report"
# Expected: 404 or 403
```

---

## INPUT — Input Validation and Injection

| ID | Category | Attack | Target Route | Expected Response | Infra Required | Env |
|----|----------|--------|-------------|-------------------|----------------|-----|
| I01 | Input | Oversized JSON payload | `POST /api/checkout` | 413 or 400 | None | Local |
| I02 | Input | Invalid JSON | `POST /api/checkout` | 400 Bad Request | None | Local |
| I03 | Input | Proto pollution | `POST /api/checkout` | 400 (strict schema) | None | Local |
| I04 | Input | Path traversal in dynamic params | `GET /api/downloads/../../etc/passwd` | 400 or 404 | None | Local |
| I05 | Input | Unicode abuse in form fields | `POST /api/auth/sovereign` | 400 or sanitized input | None | Local |
| I06 | Input | HTML injection in diagnostic answers | `POST /api/diagnostics/outcome` | 400 or sanitized (no reflection) | DB (session) | Local |

### I01: Oversized JSON payload

```bash
# Generate a 2MB JSON payload
PAYLOAD=$(python3 -c "import json; print(json.dumps({'slug': 'a'*2000000}))")
curl -s -o /dev/null -w "%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  "$BASE/api/checkout"
# Expected: 413 or 400
```

### I02: Invalid JSON

```bash
curl -s -o /dev/null -w "%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{invalid json here' \
  "$BASE/api/checkout"
# Expected: 400
```

### I03: Proto pollution

```bash
curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"slug":"test","__proto__":{"isAdmin":true},"constructor":{"prototype":{"isAdmin":true}}}' \
  "$BASE/api/checkout"
# Expected: 400 (strict zod schema rejects unknown keys)
```

### I04: Path traversal in dynamic params

```bash
curl -s -o /dev/null -w "%{http_code}" \
  "$BASE/api/downloads/..%2F..%2F..%2Fetc%2Fpasswd"
# Expected: 400 or 404
```

### I05: Unicode abuse in form fields

```bash
curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"key":"\u0000\u200b\ufeff\u202eadmin\u202c"}' \
  "$BASE/api/auth/sovereign"
# Expected: 400 (invalid key after trim/normalization)
```

### I06: HTML injection in diagnostic answers

```bash
curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=<VALID_SESSION>" \
  -d '{"answers":["<script>alert(1)</script>","<img src=x onerror=alert(1)>"]}' \
  "$BASE/api/diagnostics/outcome"
# Expected: 400 (schema validation) or input sanitized before storage
```

---

## RATE — Rate Limit Enforcement

| ID | Category | Attack | Target Route | Expected Response | Infra Required | Env |
|----|----------|--------|-------------|-------------------|----------------|-----|
| R01 | Rate | Burst 20 requests to diagnostics capture | `POST /api/diagnostics/outcome` | 429 after threshold | Rate limiter (Redis or persistent) | Staging |
| R02 | Rate | Burst 20 requests to checkout | `POST /api/checkout` | 429 after threshold | Rate limiter (Redis or persistent) | Staging |
| R03 | Rate | Burst 20 requests to sovereign login | `POST /api/auth/sovereign` | 429 after threshold | Rate limiter (persistent) | Staging |

### R01: Burst 20 requests to /api/diagnostics/outcome

```bash
for i in $(seq 1 20); do
  curl -s -o /dev/null -w "Request $i: %{http_code}\n" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"answers":["test"]}' \
    "$BASE/api/diagnostics/outcome" &
done
wait
# Expected: early requests return 200/400, later requests return 429
```

### R02: Burst 20 requests to /api/checkout

```bash
for i in $(seq 1 20); do
  curl -s -o /dev/null -w "Request $i: %{http_code}\n" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"slug":"test-product"}' \
    "$BASE/api/checkout" &
done
wait
# Expected: 429 after rate limit threshold
```

### R03: Burst 20 requests to /api/auth/sovereign

```bash
for i in $(seq 1 20); do
  curl -s -o /dev/null -w "Request $i: %{http_code}\n" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"key":"wrong-key-attempt-'$i'"}' \
    "$BASE/api/auth/sovereign" &
done
wait
# Expected: 429 after threshold (persistent rate limit via consumePersistentRateLimit)
```

---

## WEBHOOK — Stripe Webhook Abuse

| ID | Category | Attack | Target Route | Expected Response | Infra Required | Env |
|----|----------|--------|-------------|-------------------|----------------|-----|
| W01 | Webhook | Webhook without Stripe signature | `POST /api/billing/webhook` | 400 or 401 | None | Local |
| W02 | Webhook | Webhook with forged signature | `POST /api/billing/webhook` | 400 or 401 | None | Local |
| W03 | Webhook | Webhook event replay (same event ID) | `POST /api/billing/webhook` | 200 (idempotent) or 409 | Stripe test mode | Staging |

### W01: Webhook without Stripe signature

```bash
curl -s -o /dev/null -w "%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"type":"checkout.session.completed","data":{"object":{"id":"cs_test_fake"}}}' \
  "$BASE/api/billing/webhook"
# Expected: 400 (missing stripe-signature header)
```

### W02: Webhook with forged signature

```bash
curl -s -o /dev/null -w "%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "stripe-signature: t=9999999999,v1=forgedsignaturevalue" \
  -d '{"type":"checkout.session.completed","data":{"object":{"id":"cs_test_fake"}}}' \
  "$BASE/api/billing/webhook"
# Expected: 400 (signature verification failed)
```

### W03: Webhook event replay (same event ID)

```bash
# Send a legitimate test webhook event, then replay it with the same event ID:
# This requires Stripe CLI in test mode:
# stripe trigger checkout.session.completed
# Then capture the event payload and re-send it:
curl -s -o /dev/null -w "%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "stripe-signature: <CAPTURED_SIGNATURE>" \
  -d '<CAPTURED_PAYLOAD>' \
  "$BASE/api/billing/webhook"
# Expected: 200 (idempotent handling) or 409 (duplicate rejected)
# The Stripe SDK rejects replayed signatures outside the tolerance window
```

---

## PRIVACY — Cross-User Data Access

| ID | Category | Attack | Target Route | Expected Response | Infra Required | Env |
|----|----------|--------|-------------|-------------------|----------------|-----|
| P01 | Privacy | Delete another user's account | `POST /api/user/delete` | 401/403 or action scoped to own account | DB (two users) | Staging |
| P02 | Privacy | Unsubscribe another user's email | `POST /api/user/unsubscribe` | 401/403 or action scoped to own email | DB (two users) | Staging |
| P03 | Privacy | Access another user's diagnostic report | `GET /api/sovereign/report` | 401/403 or scoped to own data | DB (two users) | Staging |

### P01: Delete another user's account

```bash
# As User A, attempt to delete User B's account:
curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=<USER_A_SESSION>" \
  -d '{"email":"user-b@example.com"}' \
  "$BASE/api/user/delete"
# Expected: action is scoped to the authenticated user's own email only
# The endpoint uses resolveIdentity() to bind to the session, not the payload email
```

### P02: Unsubscribe another user's email

```bash
# As User A, attempt to unsubscribe User B:
curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=<USER_A_SESSION>" \
  -d '{"email":"user-b@example.com"}' \
  "$BASE/api/user/unsubscribe"
# Expected: action scoped to authenticated user only; User B unaffected
```

### P03: Access another user's diagnostic report

```bash
# As User A, attempt to access User B's sovereign report:
curl -s -w "\n%{http_code}" \
  -H "Cookie: next-auth.session-token=<USER_A_SESSION>" \
  "$BASE/api/sovereign/report?userId=<USER_B_ID>"
# Expected: 401/403 or returns only User A's data
```

---

## Environment Classification Summary

### Can run locally (no external services required)

| IDs |
|-----|
| A01, A02, A03, A06, A07, A08, A09, A10 |
| T05 |
| E03, E04, E05 |
| I01, I02, I03, I04, I05 |
| W01, W02 |

**Total: 17 tests**

### Requires local database (seeded users/tokens)

| IDs |
|-----|
| A04, A05 |
| I06 |

**Total: 3 tests** (can run locally with `docker-compose up` and seed data)

### Requires staging infrastructure

| IDs | Reason |
|-----|--------|
| T01, T02, T03, T04, T06 | Need database with token rows and entitlement state |
| E01, E02 | Need Stripe test mode + database entitlements |
| R01, R02, R03 | Need persistent rate limiter (Redis or database-backed) |
| W03 | Need Stripe test mode webhook with valid signatures |
| P01, P02, P03 | Need two seeded user accounts with sessions |

**Total: 13 tests**

---

## Execution Order

For a full red-team pass, execute in this order:

1. **Local-only tests** (17 tests) — run against `pnpm dev`
2. **Local + DB tests** (3 tests) — run against `pnpm dev` with `docker-compose up`
3. **Staging tests** (13 tests) — run against Netlify preview deploy with staging DB

---

## Automation

To integrate into CI, create a test runner that:

1. Reads this manifest.
2. Executes each curl command.
3. Asserts the HTTP status code matches the expected response.
4. Reports pass/fail per test ID.

The existing `scripts/security/red-team-smoke.mjs` can be extended to cover these test cases.
