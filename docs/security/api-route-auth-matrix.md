# API Route Auth Matrix

This file documents the priority API surfaces reviewed in the defensive closure pass on 2026-05-06.

| Route | Method | Class | Auth guard used | Rate limit used | Input validation used | Returns sensitive data | Object-level authorization |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/api/cron/decision-state` | `POST` | `system` | `Authorization: Bearer CRON_SECRET` | implicit scheduler frequency only | query `dryRun` only | no | n/a |
| `/api/user/delete` | `POST` | `public-sensitive` | same-origin or signed proof token | persistent (`user-delete`) | Zod strict body | no | yes, email-bound proof |
| `/api/user/unsubscribe` | `POST` | `public-sensitive` | same-origin or signed proof token | persistent (`user-unsubscribe`) | Zod strict body | no | yes, email-bound proof |
| `/api/purpose-alignment/capture` | `POST` | `public` | same-origin browser gate | persistent (`purpose-alignment-capture`) | Zod strict body | no | session-scoped only |
| `/api/strategy-room/briefing/return/[sessionId]` | `GET` | `private` | signed access token or authenticated entitlement + session ownership | none | path + query validation | yes | yes |
| `/api/strategy-room/session/followup` | `POST` | `private-browser` | same-origin browser gate | persistent (`strategy-room-followup`) | Zod strict body | no | session key scoped |
| `/api/diagnostics/evidence` | `POST` | `private-high-risk` | authenticated identity or signed `diagnostic_evidence` token | persistent (`diagnostic-evidence`) | Zod strict body | no | yes, decision/session ownership enforced |
| `/api/strategy-room/session/init` | `POST` | `private-commercial` | authenticated identity or signed `strategy_room_init` token | persistent (`strategy-room-init`) | Zod strict body | yes | yes, intake email and session ownership enforced |
| `/api/strategy-room/execution` | `GET`,`POST` | `private-commercial` | authenticated owner or signed access token | none on reads / persistent on create | Zod strict body on `POST` | yes | yes |
| `/api/strategy-room/execution/[id]` | `GET`,`PATCH` | `private-commercial` | authenticated owner or signed access token | none | Zod strict body on `PATCH` | yes | yes |
| `/api/strategy-room/execution/[id]/state` | `GET` | `private-commercial` | authenticated owner or signed access token | none | path validation | yes | yes |
| `/api/strategy-room/execution/[id]/decisions` | `POST`,`PATCH` | `private-commercial` | authenticated owner | none | Zod strict body | yes | yes |
| `/api/strategy-room/results` | `GET` | `private-commercial` | authenticated owner or signed access token | none | query validation | yes | yes |
| `/api/diagnostics/score` | `POST` | `public-high-risk` | shield + abuse controls | persistent (`diagnostics-score`) | Zod strict body | yes, reduced DTO only | n/a |
| `/api/diagnostics/challenge` | `POST` | `public-high-risk` | replication shield | persistent (`diagnostics-challenge`) | Zod strict body | yes, reduced DTO only | n/a |
| `/api/diagnostics/constitutional-intake/report` | `POST` | `public-high-risk` | replication controls | persistent (`constitutional-intake-report`) | Zod strict body | yes, minimized report DTO only | session/campaign scoped |
| `/api/auth/sovereign` | `POST` | `auth` | hashed sovereign key comparison | persistent (`sovereign-auth`) | Zod strict body | no | n/a |
| `/api/inner-circle/verify` | `POST` | `auth` | key verification service | persistent (`inner-circle-verify`) | Zod strict body | no | n/a |
| `/api/inner-circle/issue` | `POST` | `private-browser` | same-origin browser gate | persistent (`inner-circle-issue`) | Zod strict body | yes, one-time key material | n/a |
| `/api/checkout` | `POST` | `commercial` | canonical identity resolution | persistent (`checkout`) | Zod strict body | limited commercial state only | yes, entitlement authority server-side |

## Route Families Reviewed

| Family | Expected baseline |
| --- | --- |
| `app/api/admin/**` | `requireAdminServer()`, persistent rate limit, audit log, no client authority trust |
| `pages/api/admin/**` | admin-session verification, persistent rate limit, audit log, no client authority trust |
| `pages/api/billing/**` and `pages/api/webhooks/**` | canonical catalog authority, Stripe signature verification, idempotent fulfillment |
| `app/api/download/**` and `app/api/downloads/**` | entitlement check, canonical slug/path resolution, expiring token verification |

## Remaining Documentation Gap

This matrix captures the highest-risk and explicitly named routes from the hardening brief. The wider legacy Pages Router surface still needs the same row-by-row normalization into this format before a final "complete inventory" claim is warranted.
