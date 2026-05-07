# Dependency Audit — Production

**Updated:** 2026-05-07
**Status:** PASS — 0 critical/high, 0 moderate, 2 low (documented unreachable)

## Resolved

| Package | Severity | Advisory | Fix |
|---------|----------|----------|-----|
| hono (via sst) | moderate | GHSA-9vqf-7f2p-gf9v — bodyLimit bypass | Override bumped to >=4.12.16 |
| hono (via sst) | moderate | GHSA-69xw-7hcm-h432 — JSX HTML injection | Override bumped to >=4.12.16 |

## Accepted — Low / No Patch Available

### 1. aws-sdk v2 (via sst)

- **Severity:** low
- **Advisory:** GHSA-j965-2qgj-vjmq — region parameter validation
- **Path:** `.>sst>aws-sdk`
- **Patched versions:** `<0.0.0` (no fix; advisory recommends migrating to v3)
- **Production reachable:** NO — aws-sdk v2 is a transitive dependency of `sst` (infrastructure toolkit). SST controls all region parameters internally via its own config. No user input flows to the `region` parameter. The project's own AWS usage is via `@aws-sdk/client-s3` (v3).
- **Action:** Accepted as unreachable. Will be eliminated when sst drops aws-sdk v2.

### 2. elliptic (via crypto-browserify > browserify-sign)

- **Severity:** low
- **Advisory:** GHSA-848j-6mx2-7j84 — risky cryptographic implementation
- **Path:** `.>crypto-browserify>browserify-sign>elliptic`
- **Patched versions:** `<0.0.0` (no fix available)
- **Production reachable:** NO — `crypto-browserify` is a Node.js crypto polyfill for browser bundles. The project uses it as a webpack polyfill; no ECDSA signing operations are performed via this path. All production crypto uses `jose`, `argon2`, or Node.js native `crypto`.
- **Action:** Accepted as unreachable. Override for `>=6.6.1` already in place to pick up any future patch.

## Verdict

Zero critical, high, or moderate vulnerabilities in production dependencies.
Two low-severity advisories formally documented as unreachable — no user input reaches the vulnerable code paths, and no patches exist.
