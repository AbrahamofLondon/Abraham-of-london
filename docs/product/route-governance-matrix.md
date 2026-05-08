# Route Governance Matrix

> Classification of every route family. Canonical = keeps its identity. Transitional = migrating. Legacy = still works but being replaced. Redirect = points elsewhere. Retire = remove. Merge = absorb into another surface.

## LANE 1: PUBLIC AUTHORITY ESTATE

| Route | Current role | Canonical lane | Business value | Action | Priority |
|-------|-------------|---------------|---------------|--------|----------|
| `/` | Homepage, entry point | Public Authority | CRITICAL | Canonical. Keep. | — |
| `/about`, `/about/founder` | Brand authority | Public Authority | HIGH | Canonical | — |
| `/method` | Methodology | Public Authority | HIGH | Canonical | — |
| `/canon`, `/canon/[slug]`, `/canon/glossary` | Doctrine | Public Authority | HIGH | Canonical | — |
| `/blog`, `/blog/[...slug]` | Essays/editorial | Public Authority | HIGH | Canonical | — |
| `/editorials/*` | Long-form thinking | Public Authority | MEDIUM | Canonical | — |
| `/shorts/*` | Short-form signals | Public Authority | MEDIUM | Canonical | — |
| `/books/*` | Published works | Public Authority | MEDIUM | Canonical | — |
| `/library/*` | Knowledge shelf | Public Authority | MEDIUM | Merge into Knowledge System | P2 |
| `/lexicon/*` | Glossary | Public Authority | LOW | Canonical | — |
| `/evidence/*` | Proof cases | Public Authority | HIGH | Canonical. Wire to outcome verification | P1 |
| `/trust` | Trust page | Public Authority | HIGH | Canonical | — |
| `/verification` | Verification | Public Authority | MEDIUM | Canonical | — |
| `/foundations` | Foundations | Public Authority | MEDIUM | Canonical | — |
| `/ventures/*` | Portfolio companies | Public Authority | LOW | Canonical | — |
| `/events/*` | Gatherings | Public Authority | MEDIUM | Canonical | — |
| `/media` | Media page | Public Authority | LOW | Canonical | — |
| `/speaking` | Speaking engagements | Public Authority | LOW | Canonical | — |
| `/education-research` | Education sector | Public Authority | LOW | Canonical | — |
| `/contact`, `/contact/success` | Contact form | Public Authority | HIGH | Canonical | — |
| `/newsletter`, `/verify-newsletter` | Newsletter | Public Authority | MEDIUM | Canonical | — |
| `/why-not-ai` | AI criticism | Public Authority | LOW | Canonical | — |
| `/works-in-progress` | WIP showcase | Public Authority | LOW | Canonical | — |
| `/privacy`, `/terms`, `/terms-of-service` | Legal | Public Authority | REQUIRED | Canonical. Merge `/terms` + `/terms-of-service` | P2 |
| `/cookie-policy`, `/cookies` | Cookies | Public Authority | REQUIRED | Merge to single route | P3 |
| `/security`, `/security-policy` | Security | Public Authority | REQUIRED | Merge to single route | P3 |
| `/accessibility`, `/accessibility-statement` | Accessibility | Public Authority | REQUIRED | Merge to single route | P3 |
| `/refund-policy` | Refund/cancellation | Public Authority | REQUIRED | Canonical | — |

## LANE 2: DIAGNOSTIC ESCALATION LADDER

| Route | Current role | Canonical lane | Business value | Action | Priority |
|-------|-------------|---------------|---------------|--------|----------|
| `/diagnostics` | Diagnostic hub | Diagnostic Ladder | CRITICAL | Canonical entry point | — |
| `/diagnostics/fast` | Fast diagnostic | Diagnostic Ladder | CRITICAL | Canonical Stage 0 | — |
| `/diagnostics/purpose-alignment` | Purpose alignment | Diagnostic Ladder | HIGH | Canonical Stage 1 | — |
| `/diagnostics/constitutional-diagnostic` | Constitutional | Diagnostic Ladder | CRITICAL | Canonical Stage 2 | — |
| `/diagnostics/team-assessment` | Team | Diagnostic Ladder | HIGH | Canonical Stage 3 | — |
| `/diagnostics/team-alignment` | Team alignment (alt) | Diagnostic Ladder | MEDIUM | Merge into team-assessment | P2 |
| `/diagnostics/enterprise-assessment` | Enterprise | Diagnostic Ladder | HIGH | Canonical Stage 4 | — |
| `/diagnostics/enterprise` | Enterprise (alt) | Diagnostic Ladder | MEDIUM | Redirect to enterprise-assessment | P2 |
| `/diagnostics/directional-integrity` | Directional integrity | Diagnostic Ladder | LOW | Evaluate: merge into constitutional or retire | P3 |
| `/diagnostics/executive-reporting` | Executive Reporting gate | Diagnostic Ladder | CRITICAL | Canonical Stage 5 | — |
| `/diagnostics/executive-reporting/run` | Executive Reporting run | Diagnostic Ladder | CRITICAL | Canonical | — |
| `/diagnostics/watch` | Watch state | Diagnostic Ladder | LOW | Keep as monitoring surface | — |
| `/app/purpose-alignment` | Purpose alignment (app) | Diagnostic Ladder | MEDIUM | Redirect to /diagnostics/purpose-alignment | P2 |
| `/app/dashboard/purpose-alignment` | Deprecated PA dashboard | Diagnostic Ladder | NONE | Retire (marked for deletion in code) | P1 |

## LANE 3: DECISION INSTRUMENT SUITE

| Route | Current role | Canonical lane | Business value | Action | Priority |
|-------|-------------|---------------|---------------|--------|----------|
| `/decision-instruments` | Instrument index | Instruments | HIGH | Canonical | — |
| `/decision-instruments/[slug]` | Instrument detail | Instruments | HIGH | Canonical | — |
| `/decision-instruments/decision-exposure-instrument/*` | Decision exposure | Instruments | HIGH | Canonical. Wire to spine | P1 |
| `/decision-instruments/mandate-clarity-framework/*` | Mandate clarity | Instruments | HIGH | Canonical. Wire to spine | P1 |
| `/decision-instruments/intervention-path-selector/*` | Intervention selector | Instruments | HIGH | Canonical. Wire to spine | P1 |
| `/decision-instruments/operator-decision-pack/*` | Operator pack | Instruments | HIGH | Canonical. Wire to spine | P1 |
| `/my-instruments` | User's instruments | Instruments | MEDIUM | Canonical | — |

## LANE 4: STRATEGY ROOM / INTERVENTION

| Route | Current role | Canonical lane | Business value | Action | Priority |
|-------|-------------|---------------|---------------|--------|----------|
| `/strategy-room` | Strategy Room entry | Strategy Room | CRITICAL | Canonical | — |
| `/strategy-room/session/[id]` | Active session | Strategy Room | CRITICAL | Canonical. Wire dormant panels | P0 |
| `/app/strategy-room/success` | Post-payment success | Strategy Room | HIGH | Canonical (already upgraded) | — |
| `/consulting` | Consulting page | Strategy Room | HIGH | Canonical. Links to Strategy Room | — |
| `/consulting/interventions` | Interventions page | Strategy Room | MEDIUM | Canonical | — |
| `/consulting/strategy-room` | SR marketing page | Strategy Room | MEDIUM | Redirect to /strategy-room | P3 |
| `/retainer` | Retained enforcement | Strategy Room | HIGH | Canonical | — |
| `/outcome/check` | Outcome verification | Strategy Room | HIGH | Canonical. Wire to outcome loop | P1 |
| `/app/briefing/return/[sessionId]` | Return brief | Strategy Room | HIGH | Canonical | — |

## LANE 5: ENTERPRISE OPERATING SYSTEM

| Route | Current role | Canonical lane | Business value | Action | Priority |
|-------|-------------|---------------|---------------|--------|----------|
| `/app/admin/campaigns` | Campaign registry | Enterprise | CRITICAL | Canonical | — |
| `/app/admin/campaigns/[id]` | Campaign detail | Enterprise | CRITICAL | Canonical | — |
| `/app/admin/campaigns/[id]/report` | Campaign report | Enterprise | HIGH | Canonical | — |
| `/app/admin/campaigns/new` | Create campaign | Enterprise | HIGH | Canonical | — |
| `/app/admin/organisations` | Organisation registry | Enterprise | CRITICAL | Canonical | — |
| `/app/admin/organisations/[id]` | Organisation detail | Enterprise | HIGH | Canonical | — |
| `/app/admin/organisations/[id]/dashboard` | Org dashboard | Enterprise | HIGH | Canonical | — |
| `/app/admin/organisations/[id]/report` | Org report | Enterprise | HIGH | Canonical | — |
| `/app/admin/organisations/[id]/campaigns/new` | Create org campaign | Enterprise | HIGH | Canonical | — |
| `/app/admin/reporting/executive/*` | Executive reporting | Enterprise | HIGH | Canonical | — |
| `/app/admin/reports` | Reports list | Enterprise | MEDIUM | Canonical | — |
| `/app/enterprise/alignment/campaigns/[id]` | Enterprise alignment | Enterprise | HIGH | Canonical | — |
| `/app/assessment/[token]` | Assessment responder | Enterprise | HIGH | Canonical | — |
| `/app/audit/[id]` | Audit view | Enterprise | MEDIUM | Canonical | — |
| `/institutional` | Institutional page | Enterprise | MEDIUM | Canonical entry for enterprise | — |

## ADMIN OPERATIONS (Internal)

| Route | Current role | Canonical lane | Business value | Action | Priority |
|-------|-------------|---------------|---------------|--------|----------|
| `/admin` | Command Center | Admin Ops | CRITICAL | Canonical admin hub | — |
| `/admin/intelligence` | Intelligence center | Admin Ops | HIGH | Keep | — |
| `/admin/command-wall` | Control surface | Admin Ops | HIGH | Keep | — |
| `/admin/conversion-dashboard` | Conversion tracking | Admin Ops | HIGH | Keep | — |
| `/admin/enterprise-pipeline` | Pipeline management | Admin Ops | HIGH | Keep | — |
| `/admin/outcome-ledger` | Outcome tracking | Admin Ops | HIGH | Keep | — |
| `/admin/calibration` | Calibration tools | Admin Ops | HIGH | Keep | — |
| `/admin/authority-center` | Authority controls | Admin Ops | MEDIUM | Keep | — |
| `/admin/proof` | Proof management | Admin Ops | HIGH | Keep | — |
| `/admin/enterprise-foundation` | Enterprise config | Admin Ops | MEDIUM | Keep | — |
| `/admin/validation` | Validation tools | Admin Ops | MEDIUM | Keep | — |
| `/admin/pdf-dashboard` | PDF metrics | Admin Ops | LOW | Keep | — |
| `/admin/pdf-status` | PDF status | Admin Ops | LOW | Merge into pdf-dashboard | P3 |
| `/admin/redis` | Redis monitoring | Admin Ops | LOW | Keep as ops tool | — |
| `/admin/access-keys` | Key management | Admin Ops | MEDIUM | Keep | — |
| `/admin/login` | Admin login | Admin Ops | REQUIRED | Canonical | — |
| `/app/admin/decision/*` | Decision intelligence | Admin Ops | HIGH | Canonical (app router) | — |
| `/app/admin/decision-intelligence` | Intelligence dashboard | Admin Ops | HIGH | Canonical | — |
| `/app/admin/commercial` | Commercial ops | Admin Ops | MEDIUM | Canonical | — |
| `/app/admin/audit` | Audit log | Admin Ops | MEDIUM | Canonical | — |
| `/app/admin/snapshot` | System snapshot | Admin Ops | LOW | Keep | — |
| `/constitution/command-centre` | Constitutional CC | Admin Ops | HIGH | Canonical | — |

## MEMBER ACCESS

| Route | Current role | Canonical lane | Business value | Action | Priority |
|-------|-------------|---------------|---------------|--------|----------|
| `/inner-circle` | IC landing | Member Access | HIGH | Canonical | — |
| `/inner-circle/dashboard` | Member dashboard | Member Access | HIGH | Canonical | — |
| `/inner-circle/login` | IC login | Member Access | REQUIRED | Canonical | — |
| `/inner-circle/briefs/*` | Member briefs | Member Access | HIGH | Canonical | — |
| `/inner-circle/reports/*` | Member reports | Member Access | HIGH | Canonical | — |
| `/inner-circle/account` | Account settings | Member Access | MEDIUM | Canonical | — |
| `/inner-circle/admin/*` | IC admin tools | Member Access | MEDIUM | Keep | — |
| `/access/*` | Access flows | Member Access | MEDIUM | Canonical | — |
| `/vault/*` | Vault content | Member Access | HIGH | Canonical | — |

## KNOWLEDGE SYSTEM

| Route | Current role | Canonical lane | Business value | Action | Priority |
|-------|-------------|---------------|---------------|--------|----------|
| `/downloads/*` | Downloads | Knowledge | MEDIUM | Merge into unified knowledge surface | P2 |
| `/resources/*` | Resources | Knowledge | MEDIUM | Merge into unified knowledge surface | P2 |
| `/playbooks/*` | Playbooks | Knowledge | HIGH | Canonical (operational knowledge) | — |
| `/toolkits/*` | Toolkits | Knowledge | MEDIUM | Merge into playbooks | P3 |
| `/premium/library` | Premium library | Knowledge | MEDIUM | Merge into vault/inner-circle | P3 |
| `/prints/*` | Prints | Knowledge | LOW | Keep | — |

## RETIRE / REDIRECT

| Route | Current role | Action | Priority |
|-------|-------------|--------|----------|
| `/board/*` (3 pages) | All redirect to /admin | Already redirecting. Remove files after 90d | P3 |
| `/client/dashboard` | Redirects to /admin | Already redirecting. Remove file | P3 |
| `/dev/dashboard` | Redirects to /admin | Already redirecting. Remove file | P3 |
| `/directorate/oversight` | Redirects to /admin | Already redirecting. Remove file | P3 |
| `/dashboard` | Role-based redirect | Keep as smart redirect | — |
| `/app/dashboard/purpose-alignment` | Deprecated | Retire (code says "for deletion") | P1 |
| `/shortcuts/index.migrated.tsx` | Legacy migrated | Remove file | P3 |
| `/debug/content` | Debug page | Keep dev-only | — |
| `/content/simple` | Simple layout | Keep or remove | P3 |
| `/test-readers` | Test page | Keep dev-only | — |
| `/resources/board-decision-log-template` | Redirects to /admin | Already redirecting. Remove file | P3 |
| `/consulting/strategy-room` | Duplicate of /strategy-room | Redirect to /strategy-room | P3 |
| `/diagnostics/enterprise` | Alt for enterprise-assessment | Redirect to enterprise-assessment | P2 |
| `/terms` vs `/terms-of-service` | Duplicate legal | Pick one, redirect other | P2 |
| `/cookies` vs `/cookie-policy` | Duplicate | Pick one, redirect other | P3 |
| `/security` vs `/security-policy` | Duplicate | Pick one, redirect other | P3 |
| `/accessibility` vs `/accessibility-statement` | Duplicate | Pick one, redirect other | P3 |
