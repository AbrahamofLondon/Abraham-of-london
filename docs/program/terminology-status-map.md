# Terminology Status Map

Status: PARTIAL
Live surface truth: This document distinguishes between current live terms, preferred program terms, and planning-only language. It is a migration-readiness tool, not a claim that naming cleanup is complete.

## Objective

Create one migration-ready language map so strategic docs stop drifting between:

- live route language
- preferred product language
- planning language

## Current vs Preferred

| Domain | Current term in repo | Preferred term | Live status | Notes |
|---|---|---|---|---|
| Funnel entry | Diagnostics | Diagnostics | LIVE | Canonical live system entry |
| Paid interpretation | Executive Reporting | Executive Reporting | LIVE | Existing live surface and preferred term align |
| Advisory chamber | Strategy Room | Strategy Room | LIVE | Route is live; older docs/code still reference `/consulting/strategy-room` |
| Private advisory category | Consulting | Advisory | PARTIAL | `Consulting` still exists in route and page language; `Advisory` is the preferred commercial frame |
| Retained work | Advisory / Consulting | Advisory Engagement | PLANNED | Future offer-language cleanup |
| Membership layer | Inner Circle / Membership | Membership | PARTIAL | `Inner Circle` remains live in code and routes; `Membership` is preferred business language |
| Restricted archive | Vault | Vault | LIVE | Live and understandable with contextual copy |
| Long-form editorial | Blog / Essays | Essays | PARTIAL | Route remains `/blog`; public label should prefer `Essays` |
| Short-form signal | Shorts | Shorts | LIVE | Live and already clear |
| Deeper analysis | Artifacts / Intelligence | Intelligence | PARTIAL | `/artifacts` currently functions as the practical destination; `Intelligence` is the preferred user-facing label |
| Practical models | Playbooks / Frameworks | Frameworks | PARTIAL | `Playbooks` is the current live library; `Frameworks` is a broader planning term |
| Doctrine | Canon | Canon | LIVE | Live but still needs micro-context for first-time users |

## Route Truth Map

| Preferred label | Current safe route |
|---|---|
| Diagnostics | `/diagnostics` |
| Constitutional Diagnostic | `/diagnostics/constitutional-diagnostic` |
| Executive Reporting | `/diagnostics/executive-reporting` |
| Strategy Room | `/strategy-room` |
| Essays | `/blog` |
| Shorts | `/shorts` |
| Intelligence | `/artifacts` |
| Membership | `/inner-circle` |
| Vault | `/vault` |
| Frameworks / Playbooks | `/playbooks` |

## Migration Readiness

### Ready for safe copy cleanup later

- `Blog` -> `Essays`
- `Inner Circle` -> `Membership` in user-facing planning docs
- `Consulting` -> `Advisory` in offer architecture docs
- `Artifacts` -> `Intelligence` in contextual UI copy where route can remain unchanged

### Not ready for broad code rename

- `Inner Circle` in auth/access logic
- `/consulting/strategy-room` references on live surfaces without route verification
- payment or checkout terminology
- tier vocabulary in entitlement logic
