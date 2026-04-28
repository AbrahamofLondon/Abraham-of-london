# Operational Debt Register

## Root Scripts

- Risk: medium
- Owner: platform engineering
- Disposition: document
- Note: root scripts are numerous and unevenly governed; several maintenance scripts still assume local-only execution and limited auditability.

## PDF Generators

- Risk: medium
- Owner: reporting platform
- Disposition: rewrite
- Note: PDF/report generation paths remain broad and should be reduced behind stricter server-only boundaries and explicit data contracts.

## SQLite/Postgres Duality

- Risk: high
- Owner: platform engineering
- Disposition: delete
- Note: dual persistence assumptions increase session and auth ambiguity and make control verification harder.

## Contentlayer Repair Scripts

- Risk: low
- Owner: content infrastructure
- Disposition: move
- Note: build-repair utilities should be isolated from production runtime assumptions.

## Observability Gaps

- Risk: high
- Owner: security engineering
- Disposition: keep
- Note: there is still inconsistent coverage for rate-limit failure telemetry, privileged route denial telemetry, and secret-misconfiguration detection.

## Test Gaps

- Risk: high
- Owner: platform engineering
- Disposition: rewrite
- Note: auth authority, middleware protections, MFA encryption, and failure-closed rate limiting need explicit regression coverage.

## Feature Flag Gaps

- Risk: medium
- Owner: platform engineering
- Disposition: document
- Note: some security-sensitive behavior is hard-wired rather than controlled through explicit rollout flags, which complicates staged remediation.
