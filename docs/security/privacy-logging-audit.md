# Privacy and Logging Audit

**Date:** 2026-05-07
**Status:** CLOSED — launch signoff complete

## Scope Verified

| File / Directory | Purpose |
|---|---|
| `lib/email/decision-email-builder.ts` | Outbound email construction |
| `lib/server/follow-up/decision-state-orchestrator.server.ts` | Email triggering and cooldown |
| `lib/server/privacy/identity-service.server.ts` | Encrypted identity, unsubscribe, deletion |
| `lib/server/observability/event-log.server.ts` | SystemAuditLog event writes |
| `lib/server/observability/metrics.server.ts` | Funnel/shield metrics |
| `lib/server/observability/request-context.server.ts` | AsyncLocalStorage context |
| `lib/security/audit-log.ts` | Security audit writes |

---

## Check 1: No raw email in application logs

**Result: PASS**

- `lib/server/observability/` — no `console.log`/`console.error` calls include email.
- `lib/server/follow-up/` — single `console.error("[decision-state-orchestrator]", error)` with no email.
- `writeSecurityAudit()` stores `actorEmail` in the protected `SystemAuditLog` table for access-control audit trail only. This is a security audit table (admin-access only), not application logs.
- Strategy Room init redacts email from Prisma error messages (`[redacted-email]` replacement at line 85 of `app/api/strategy-room/session/init/route.ts`).

---

## Check 2: No raw decision text in outbound emails

**Result: PASS**

- `decision-email-builder.ts` receives:
  - `decision` — always `conditionSummary || "the open decision"` (system-generated label, not user input)
  - `pattern` — `stateResult.reason` (system-computed state description)
  - `contradictionSummary` — brief challenge/trajectory reason (system-generated)
- No raw user-submitted anchors, intake text, or decision free-text appears in email body.
- All string values are HTML-escaped via `escapeHtml()` before insertion.

---

## Check 3: No raw anchors in audit events

**Result: PASS**

- `writeSecurityAudit` metadata contains only: action labels, route paths, session keys, severity codes, stage identifiers.
- No `DecisionAnchors`, `AnchorContradiction`, or raw intake text is stored in audit metadata.
- Observability `logEvent()` writes category, action, resourceId, and structured metadata — no raw decision content.

---

## Check 4: Unsubscribe checked before send

**Result: PASS**

- `decision-state-orchestrator.server.ts` line 306: `if (await isUnsubscribed(session.email))` — checked BEFORE any email build/send.
- `isUnsubscribed()` queries `userIdentity.unsubscribed` by email hash lookup.
- If unsubscribed, the session is skipped (`result.skippedIdle++`).

---

## Check 5: Non-enumerating delete/unsubscribe behavior

**Result: PASS**

- `unsubscribeUser()` and `deleteUserIdentity()` operate by SHA-256 email hash.
- Both return boolean success regardless of whether the identity existed.
- API endpoints (`/api/user/delete`, `/api/user/unsubscribe`) do not reveal whether an email is registered.
- The red-team smoke test confirms: malformed unsubscribe returns 400/403, not 200/404 that would enumerate.

---

## Residual Notes

- `actorEmail` stored in `SystemAuditLog` is acceptable for security audit trail (admin-protected table, required for access forensics). This is not "application logging" in the OWASP sense.
- No PII appears in `console.*` calls that would reach infrastructure log aggregators.
