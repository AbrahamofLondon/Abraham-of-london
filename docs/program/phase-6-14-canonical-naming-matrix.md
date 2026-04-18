# Phase 6-14 Canonical Naming Matrix

Status: PARTIAL
Live surface truth: Some terms and routes here are already live, while others are planning standards for future cleanup and should not be read as completed product migration.

## Purpose

This document governs naming for the Abraham of London build program across Phases 6-14.

It exists to stop vocabulary drift across:

- product surfaces
- route labels
- content systems
- access tiers
- governance artifacts
- monetization architecture

This is a program-control document, not a live-route rewrite order.

## Operating Rule

Use one canonical term per business object.

Where legacy terms already exist in code, content, or links:

- preserve compatibility where needed
- record the legacy term as an alias
- avoid introducing new synonyms
- migrate only when the owning lane is safe

## Boundaries

Codex may use this matrix now for:

- documentation
- planning packs
- content/funnel mapping
- offer architecture
- governance artifacts
- reporting specs
- non-critical cleanup prep

Codex should not use this document as justification to change, in parallel:

- auth provider behavior
- strategy-room submit or enrol logic
- middleware or proxy routing
- live diagnostics handlers
- production-critical redirects

## Naming Domains

### 1. Brand and system level

| Domain | Canonical term | Use for | Avoid / alias |
|---|---|---|---|
| Brand | Abraham of London | The public brand and institutional identity | AOL as public-facing shorthand |
| Program | Phase 1-14 Program Build | Internal build sequence across this repo | roadmap rebuild, total reset |
| Integrated system | Abraham of London Operating System | Phase 14 synthesis artifact | platform stack, empire OS |
| Doctrine layer | The Canon | Core intellectual spine and doctrine body | canon library, canon archive |

### 2. Commercial ladder

| Order | Canonical term | Object type | Current route anchor | Notes | Avoid / alias |
|---|---|---|---|---|---|
| 1 | Diagnostics | Entry gate | `/diagnostics` | Top-level signal and qualification system | assessment hub, diagnostic ladder as primary label |
| 2 | Executive Reporting | Flagship paid interpretation product | `/diagnostics/executive-reporting` | Productized board-grade interpretation | executive report run as product name |
| 3 | Strategy Room | Private advisory chamber | `/strategy-room` | Qualified advisory engagement | mandate chamber as poetic descriptor only |
| 4 | Advisory Engagement | Delivery category after Strategy Room qualification | no single canonical public route yet | Commercial/service category in docs and offers | consulting as the primary commercial noun |
| 5 | Membership | Recurring access layer | mixed legacy surface | Commercial access construct for Phase 6 docs | Inner Circle as the commercial umbrella |
| 6 | Vault Access | Member benefit class | `/vault`, `/vault/briefs` | Access entitlement, not the membership brand | premium vault, private library |

### 3. Funnel stages

| Funnel object | Canonical term | Notes | Avoid / alias |
|---|---|---|---|
| Entry signal layer | Diagnostics | Parent term for all diagnostic stages | assessments as top-level system name |
| Stage 1 | Constitutional Diagnostic | Keep exact route-aligned name | purpose alignment if referring to the live diagnostics ladder |
| Stage 2 | Team Assessment | Keep route-aligned name | team alignment as canonical stage label |
| Stage 3 | Enterprise Assessment | Keep route-aligned name | enterprise diagnostic |
| Stage 4 | Executive Reporting | Product and funnel stage are intentionally the same | executive report as parent label |
| Stage 5 | Strategy Room | Advisory gate and chamber | strategy session, consulting room |

### 4. Content system

| Domain | Canonical term | Role in system | Avoid / alias |
|---|---|---|---|
| Short-form thought leadership | Shorts | Top-of-funnel attention and resonance | clips, dispatch shorts |
| Long-form thought leadership | Essays | Public-facing editorial depth | blog as editorial brand, editorials as primary noun |
| Core doctrine | The Canon | Foundational conceptual spine | canon archive |
| Books | Books | Formal published works | volumes as nav primary |
| Practical frameworks | Playbooks | Action-oriented implementation guides | framework pack, protocol pack |
| Downloadable assets | Resources | Operational assets and downloadable tools | downloads as the master content noun |
| Restricted operational archive | Vault | Gated asset environment | private library, member archive |
| Restricted document subset | Vault Briefs | Premium briefing collection inside Vault | briefs vault, private briefs |
| Reference definitions | Lexicon | Controlled language layer | glossary |
| Strategic models | Strategic Frameworks | Named framework library under resources | frameworks library |

### 5. Access and tier language

This is the least stable naming zone in the repo. Current code mixes:

- `member`
- `inner-circle`
- `verified`
- `restricted`
- `top-secret`
- `premium`
- `architect`
- `owner`

For Phase 6-14 documentation, use the following canonical business language:

| Layer | Canonical term | Notes | Existing aliases in repo |
|---|---|---|---|
| Public access | Public | Open access | free, open, unclassified |
| Paid recurring access | Member | Default commercial membership tier language | inner-circle in older content/config |
| Elevated qualified access | Principal | Reserved for higher-trust or higher-value access classes in future docs | verified, architect |
| Restricted internal/admin access | Restricted | Internal control term, not a marketing term | premium, confidential |
| Internal sovereign/admin-only access | Internal | Operational-only control term | top-secret, hardened, owner |

### Access-tier rule

Use `Membership` as the commercial construct and `Member` as the default paid-access identity.

Treat `Inner Circle` as a legacy prestige label still present in:

- routes
- content
- email templates
- access code
- PDF tier logic

Do not expand `Inner Circle` into new architecture docs unless the specific workstream is explicitly about legacy compatibility.

### 6. Service and offer language

| Domain | Canonical term | Notes | Avoid / alias |
|---|---|---|---|
| Paid interpretation product | Executive Reporting | Flagship non-advisory offer | report package |
| Paid advisory chamber | Strategy Room | Qualification-first advisory surface | consulting session |
| Ongoing retained work | Advisory Engagement | Umbrella term for retained or implementation work | consulting package |
| Session operator materials | Operator Playbook | Canonical artifact type for delivery SOPs | facilitator guide, sales script pack |
| Offer stack | Product Ladder | Canonical monetization architecture term | value ladder if used as primary label |
| Revenue logic | Revenue Architecture | Canonical Phase 6 planning term | offer map, pricing tree |

### 7. Authority and market position

| Domain | Canonical term | Notes | Avoid / alias |
|---|---|---|---|
| Thought leadership engine | Authority Engine | Internal planning term for content-to-market system | content machine |
| Topic map | Territory Map | Controlled topic ownership map | niche map |
| Named flagship models | Framework Registry | Controlled list of named intellectual property | random framework naming |
| Distribution strategy | Distribution Map | Partner and channel design | growth channels as primary strategic noun |
| Major research assets | Briefing Papers | Policy, capital, infrastructure, or institutional papers | white papers only, unless format specifically requires it |

### 8. Governance and institution-building

| Domain | Canonical term | Notes | Avoid / alias |
|---|---|---|---|
| Formal doctrine package | Doctrine | Governing body of principles | canon package as generic term |
| Preserved body of teachings/assets | Canon + Vault | Distinguish doctrine from restricted archive | doctrine vault as one merged noun |
| Operating procedures | SOPs | Keep plain operational language | ritual docs |
| Role architecture | Operator Model | Canonical org-design term | staffing ladder |
| Long-term governance | Stewardship | Preferred term for continuity and ethical control | ownership alone |
| Ethics/control layer | Stewardship Charter | Phase 13 governing artifact | ethics memo |
| Continuity design | Continuity Blueprint | Phase 12 artifact | succession memo |
| Final integration map | Operating System Document | Phase 14 master synthesis | master playbook |

## Canonical Route Labels

These are the labels docs and UI copy should prefer unless a local screen requires something more specific.

| Route / surface | Canonical label | Notes |
|---|---|---|
| `/diagnostics` | Diagnostics | Parent funnel entry |
| `/diagnostics/constitutional-diagnostic` | Constitutional Diagnostic | Stage 1 |
| `/diagnostics/team-assessment` | Team Assessment | Stage 2 |
| `/diagnostics/enterprise-assessment` | Enterprise Assessment | Stage 3 |
| `/diagnostics/executive-reporting` | Executive Reporting | Product page |
| `/diagnostics/executive-reporting/run` | Executive Reporting Intake | Internal/product-operational label |
| `/strategy-room` | Strategy Room | Canonical chamber label |
| `/vault` | Vault | Canonical restricted archive label |
| `/vault/briefs` | Vault Briefs | Sub-collection |
| `/playbooks` | Playbooks | Practical frameworks library |
| `/shorts` | Shorts | Short-form authority surface |
| `/blog` | Essays | Route may remain `/blog`; label should prefer `Essays` |
| `/downloads` | Resources | Route may remain `/downloads`; docs should treat `Resources` as parent noun when possible |
| `/inner-circle` | Membership | Route can remain legacy; preferred business label is `Membership` |

## Alias and Deprecation Rules

### Approved legacy aliases

Use only when needed for compatibility with existing routes, content, or technical surfaces.

| Legacy term | Canonical term |
|---|---|
| Inner Circle | Membership or Member, depending on context |
| Blog | Essays |
| Downloads | Resources |
| Mandate Chamber | Strategy Room |
| Consulting | Advisory Engagement |
| Premium | Restricted or Member, depending on actual access meaning |
| Executive Report | Executive Reporting |

### Disallowed future drift

Do not introduce new primary nouns for existing objects, including:

- chamber
- salon, unless referring to an actual event format
- guild, unless referring to a defined doctrine/community construct
- archive, when the actual object is Vault
- package, when the actual object is a product
- stack, when the actual object is the Product Ladder

## Implementation Guidance

### Safe now

- update planning docs to canonical terms
- write revenue and offer packs using this matrix
- write authority/content/governance artifacts using this matrix
- annotate legacy terms in cleanup plans
- prepare non-critical copy cleanup inventories

### Wait until live lane closes

- renaming auth-facing endpoints
- changing `/inner-circle` route architecture
- changing strategy-room API nouns
- changing diagnostics submit handler terminology
- rewriting route labels embedded in production-critical redirects

## Immediate Cleanup Priorities After Live Lane Stabilizes

1. Standardize public-facing labels so `Essays`, `Resources`, `Membership`, and `Strategy Room` are used consistently in navigation and copy.
2. Audit all `Inner Circle` usage and split it into three buckets: route legacy, access-control logic, and marketing copy.
3. Normalize tier vocabulary around one commercial default: `Member`.
4. Separate `Vault` from `Resources` in copy so the archive/product boundary is clear.
5. Create a controlled framework registry before introducing new named frameworks in Phases 8-11.

## Repo Evidence Informing This Matrix

This matrix was grounded in current repo terminology visible in:

- `CLAUDE_SESSION_LOG.md`
- `contentlayer.config.ts`
- `config/site.ts`
- `components/EnhancedFooter.tsx`
- `content/resources/**`
- `content/playbooks/**`
- `content/vault/**`
- `pages/diagnostics/**`
- `pages/api/inner-circle/**`
- `app/api/strategy-room/**`

## Decision Summary

The core naming decision is:

- `Diagnostics` is the funnel entry system
- `Executive Reporting` is the flagship paid interpretation layer
- `Strategy Room` is the private advisory chamber
- `Membership` is the commercial access layer
- `Vault` is the restricted archive
- `Resources` is the general downloadable asset category
- `Essays` is the preferred editorial label even where the route remains `/blog`

Anything outside that vocabulary should be treated as either legacy residue or a new term that needs explicit approval.
