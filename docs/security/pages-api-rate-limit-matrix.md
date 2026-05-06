# Pages API Rate-Limit Matrix

This file captures the high-risk `pages/api/**` routes classified during the 2026-05-06 closure pass.

| Route | Method | Classification | Rate limit status | Notes |
| --- | --- | --- | --- | --- |
| `/api/diagnostics/score` | `POST` | `protected` | persistent | keyed by IP, session hint, payload hash |
| `/api/diagnostics/challenge` | `POST` | `protected` | persistent | keyed by IP and abuse heuristics |
| `/api/diagnostics/constitutional-intake/report` | `POST` | `protected` | persistent | keyed by IP and session hint |
| `/api/diagnostics/capture` | `POST` | `protected` | persistent | keyed by IP, email hash, result/session ref |
| `/api/admin/status-report` | `GET` | `protected` | persistent | enforced through `requireAdminServer()` |
| `/api/admin/security/events` | `GET` | `protected` | persistent | enforced through `requireAdminServer()` |
| `/api/admin/export-vips` | `GET` | `protected` | persistent | export-specific limit |
| `/api/admin/export-audit` | `GET` | `protected` | persistent | export-specific limit |
| `/api/admin/users/upgrade` | `POST` | `protected` | persistent | enforced through `requireAdminServer()` |
| `/api/admin/audit-logs` | `GET` | `protected` | persistent | enforced through `requireAdminServer()` |
| `/api/admin/jobs/process` | `POST` | `protected` | persistent | enforced through `requireAdminServer()` |
| `/api/admin/jobs/dead-letter` | `GET`,`POST` | `protected` | persistent | enforced through `requireAdminServer()` |
| `/api/admin/jobs/dead-letter/replay` | `POST` | `protected` | persistent | enforced through `requireAdminServer()` |
| `/api/admin/diagnostics/jobs/process` | `POST` | `protected` | persistent | enforced through `requireAdminServer()` |
| `/api/admin/pdf-analytics` | `GET` | `protected` | persistent | enforced through `requireAdminServer()` |
| `/api/admin/security/appeal` | `POST` | `protected` | persistent | enforced through `requireAdminServer()` |
| `/api/admin/security/resolve-appeal` | `POST` | `protected` | persistent | enforced through `requireAdminServer()` |
| `/api/admin/members/upgrade` | `POST` | `protected` | persistent | enforced through `requireAdminServer()` |
| `/api/admin/members/revoke` | `POST` | `protected` | persistent | enforced through `requireAdminServer()` |
| `/api/admin/members/list` | `GET` | `protected` | persistent | enforced through `requireAdminServer()` |
| `/api/admin/members/keys` | `GET` | `protected` | persistent | enforced through `requireAdminServer()` |
| `/api/admin/onboard-principal` | `POST` | `protected` | persistent | enforced through `requireAdminServer()` |
| `/api/billing/checkout` | `POST` | `deprecated-disabled` | pending | still requires canonical checkout normalization |
| `/api/billing/webhook` | `POST` | `protected` | exempt-webhook | signature verification is primary control; replay hardening still pending |

## Notes

- `protected` means the route is actively used and must fail closed when the persistent limiter is unavailable.
- `deprecated-disabled` means the route should not be treated as launch-safe until it is either closed or normalized to canonical controls.
- `exempt-webhook` is limited to provider-signed webhook traffic and should not rely on end-user style IP throttling.
