# Admin Consolidation Plan

> Goal: `app/admin` becomes the canonical admin operating system. `pages/admin` is triaged.

## Current State

**pages/admin/** — 19 real pages (Pages Router, SSR)
**app/admin/** — 23 pages (App Router, RSC)

Both operate independently with separate navigation patterns. Users need to know which admin system to use.

## Triage: pages/admin/

### A. PROMOTE AND MIGRATE (high-value, should move to app/admin)

| Page | Value | Migration path |
|------|-------|---------------|
| `/admin/intelligence` | HIGH — deal flow, audit stream | Create `app/admin/intelligence/page.tsx` |
| `/admin/command-wall` | HIGH — control surface, context registry | Create `app/admin/command-wall/page.tsx` |
| `/admin/conversion-dashboard` | HIGH — funnel health | Create `app/admin/conversion/page.tsx` |
| `/admin/enterprise-pipeline` | HIGH — pipeline management | Create `app/admin/pipeline/page.tsx` |
| `/admin/outcome-ledger` | HIGH — outcome tracking | Create `app/admin/outcomes/page.tsx` |
| `/admin/proof` | HIGH — proof queue | Create `app/admin/proof/page.tsx` |
| `/admin/calibration` | HIGH — calibration tools | Create `app/admin/calibration/page.tsx` |
| `/admin/authority-center` | MEDIUM — lead management | Create `app/admin/authority/page.tsx` |

### B. KEEP TEMPORARILY (specialist ops, low migration priority)

| Page | Reason to keep |
|------|---------------|
| `/admin/redis` | Ops tool, low traffic, not user-facing |
| `/admin/validation` | Launch readiness checker |
| `/admin/access-keys` | Key management with revocation |
| `/admin/enterprise-foundation` | Enterprise config |
| `/admin/inner-circle` | IC admin panel (separate domain) |

### C. MERGE INTO EXISTING app/admin

| Page | Merge target |
|------|-------------|
| `/admin/pdf-dashboard` | Merge with `/admin/pdf-status` → single `app/admin/documents/page.tsx` |
| `/admin/pdf-status` | See above |
| `/admin/assets` | Merge into documents surface |

### D. RETIRE

| Page | Reason |
|------|--------|
| `/admin/access-revoke` | Already redirects to access-keys |

## First Implementation: Admin Operations Hub

Create `app/admin/operations/page.tsx` as the consolidated entry point that links all operational surfaces:

### Sections:
1. **Intelligence** — links to intelligence, command-wall, conversion-dashboard
2. **Pipeline** — links to enterprise-pipeline, authority-center, conversion
3. **Governance** — links to outcome-ledger, proof, calibration, constitutional command-centre
4. **Enterprise** — links to campaigns, organisations, enterprise-foundation
5. **Decision** — links to decision-intelligence, efficacy, governance, performance
6. **Infrastructure** — links to redis, validation, documents, access-keys

This creates one governed command shell without breaking existing pages.
