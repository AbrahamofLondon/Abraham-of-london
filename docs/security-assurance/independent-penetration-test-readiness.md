# Independent Penetration Test Readiness

Status: preparation checklist  
Last updated: 2026-05-18

This checklist prepares the platform for a future independently commissioned penetration test. It does not state that such a test has already been completed.

## Scope to test

- public web application surfaces;
- authentication and session handling;
- user data access controls;
- admin surfaces;
- provenance verification paths;
- governed download routes;
- payment and webhook-facing flows;
- API rate limiting and abuse controls.

## Environments

- dedicated staging environment preferred;
- production only where separately authorised and rate limits / monitoring are understood;
- documented test accounts and seed data isolated from real client material.

## Authentication flows

- magic-link flow;
- OAuth flow where enabled;
- session lifecycle and expiry;
- privileged-route access controls;
- cross-user isolation;
- token replay / token misuse scenarios.

## Admin surfaces

- route protection;
- role enforcement;
- IP / perimeter assumptions where applicable;
- audit and provenance admin endpoints;
- unauthorised read and write attempts.

## Provenance APIs

- record-hash verification;
- client-safe summary boundaries;
- anchor continuity checks;
- disclosure limits;
- confirmation that current claims remain internal-boundary claims, not external immutability claims.

## Download / payment surfaces

- entitlement checks;
- token misuse;
- direct-asset bypass attempts;
- checkout parameter tampering;
- webhook signature handling;
- replay and idempotency behavior.

## Exclusions

Document exclusions before test start. Likely examples include:

- social engineering;
- physical security;
- denial-of-service testing beyond agreed safe limits;
- third-party provider infrastructure outside the platform boundary;
- unapproved production-data access.

## Evidence needed before test

- current architecture overview;
- route inventory;
- authentication and authorisation matrix;
- environment details;
- test accounts;
- data classification and pilot boundary summary;
- current incident-response summary;
- list of known limitations and open risks;
- rules of engagement;
- named points of contact.

## Remediation workflow after findings

1. Triage each finding by severity and exploitability.
2. Confirm ownership and target remediation date.
3. Fix critical and high findings first.
4. Retest remediated findings.
5. Record accepted residual risks explicitly.
6. Update public and procurement-facing statements only after verification supports them.

