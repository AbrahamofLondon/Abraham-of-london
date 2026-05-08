# Controlled Surface Remediation Plan

**Date:** 2026-05-08
**Authority:** Decision Infrastructure by Abraham of London
**Source audit:** `docs/product/controlled-surface-audit.md`

---

## TOP 10 URGENT FIXES

| # | Issue | File(s) | Risk | Action |
|---|-------|---------|------|--------|
| 1 | `/admin/redis` has NO auth guard | `pages/admin/redis.tsx` | CRITICAL — infrastructure metrics publicly accessible | Add `requireAdminPage()` to `getServerSideProps` |
| 2 | `/admin/pdf-status` has NO auth guard | `pages/admin/pdf-status.tsx` | HIGH — 75 PDF filenames and sizes publicly enumerable | Add `requireAdminPage()` to `getServerSideProps` |
| 3 | `/testing/lab` has NO auth guard or layout | `app/testing/lab/page.tsx` | HIGH — internal analysis tool exposed | Create `app/testing/layout.tsx` with `requireAdminServer()` |
| 4 | `/downloads/vault` has NO auth guard | `app/downloads/vault/page.tsx` | CRITICAL — proprietary IP (artifact titles, categories, IDs) publicly visible | Create `app/downloads/layout.tsx` with auth |
| 5 | `micro-tension` internal engine term exposed to users | `components/strategy-room/ExecutionFlow.tsx` | CRITICAL IP — internal validation mechanism named publicly | Rename variable and UI label to generic term (e.g., "execution tension") |
| 6 | `anchor narrative` engine term in client output | `lib/alignment/PurposeAlignmentAssessment.tsx`, `pages/diagnostics/fast.tsx`, `pages/diagnostics/executive-reporting.tsx` | HIGH IP — narrative composition system exposed | Rename to "decision narrative" or "core finding" in all client-facing DTOs |
| 7 | `cognitive state` labels exposed raw on Decision Centre | `pages/decision-centre.tsx` | HIGH IP — internal intelligence lifecycle stage names visible | Replace with user-friendly labels (e.g., "Early Signal" instead of "SIGNAL_DISCOVERY") |
| 8 | `evidence graph` label on public method page | `pages/method.tsx` line ~105 | HIGH IP — internal architecture term on PUBLIC surface | Replace with "decision evidence basis" |
| 9 | "Sovereign Telemetry" / "Anonymous_Protocol" security theatre | `app/audit/[id]/page.tsx` | HIGH trust risk — false confidence created by unverifiable claims | Replace with plain language: "Confidential Team Survey" |
| 10 | "End-to-End Encryption Active" unverified claim | `app/audit/[id]/page.tsx` | HIGH claim risk — encryption claim without technical backing | Remove or replace with "Responses transmitted securely via HTTPS" |

---

## TOP 10 MARKET-IMPROVING UPGRADES

| # | Upgrade | File(s) | Impact |
|---|---------|---------|--------|
| 1 | Publish at least 1 full anonymised case dossier | `pages/evidence/` | HIGH — proves evidence standard; removes "all claim, no proof" risk |
| 2 | Add pricing transparency to Executive Reporting and Strategy Room | `pages/decision-paths/index.tsx` | HIGH — removes qualified lead dropout from unknown cost |
| 3 | Add visual consequence scale to Strategy Room (0-25 low, 26-50 moderate, 51-75 high, 76-100 critical) | `pages/strategy-room/session/[id].tsx` | MEDIUM — removes opaque numeric scoring |
| 4 | Add "Which product for me?" decision matrix | `pages/decision-instruments/index.tsx` or `pages/decision-paths/index.tsx` | MEDIUM — reduces entry confusion |
| 5 | Add mobile-responsive breakpoints to Return Brief | `app/briefing/return/[sessionId]/page.tsx` | HIGH — currently fixed 680px, breaks on mobile |
| 6 | Add explainer tooltips for Living Case, Evidence Tier, Decision Credit | `pages/decision-centre.tsx` | MEDIUM — reduces cognitive load |
| 7 | Add consent flow to campaign survey | `app/audit/[id]/page.tsx` | HIGH — required for GDPR compliance |
| 8 | Add semantic Likert labels to assessment | `app/assessment/[token]/page.tsx` | MEDIUM — replaces confusing numeric buttons |
| 9 | Add response SLA to contact form | `pages/contact.tsx` | LOW — sets expectations |
| 10 | Add visual "Members only" badges to gated leadership content | `pages/leadership/index.tsx` | LOW — reduces access confusion |

---

## TOP 10 IP EXPOSURE REDUCTIONS

| # | Exposure | File(s) | Action |
|---|---------|---------|--------|
| 1 | `micro-tension` variable and label in ExecutionFlow | `components/strategy-room/ExecutionFlow.tsx` | Rename to generic UI feedback name |
| 2 | `anchor narrative` in diagnostic DTOs | `lib/alignment/PurposeAlignmentAssessment.tsx`, `pages/diagnostics/fast.tsx`, `pages/diagnostics/executive-reporting.tsx` | Rename to "decision narrative" in client output |
| 3 | `cognitive state` labels (SIGNAL_DISCOVERY, etc.) on Decision Centre | `pages/decision-centre.tsx` | Replace with user-friendly stage names |
| 4 | `evidence graph` label on public method page | `pages/method.tsx` | Replace with "decision evidence basis" |
| 5 | `consequence score` raw numeric on Strategy Room | `pages/strategy-room/session/[id].tsx` | Add visual scale; remove raw number |
| 6 | `intelligence spine` reference in outcome check | `pages/outcome/check.tsx` | Remove from client-facing code |
| 7 | Mock data in admin reporting exposes full analytical framework | `app/admin/reporting/executive/[id]/page.tsx`, `app/admin/snapshot/page.tsx` | Replace specific domain names and thresholds with generic mock values |
| 8 | Retainer page exposes velocity scoring, acceleration risk, enforcement playbook triggers | `pages/retainer.tsx` | Abstract internal metrics; show outcomes not mechanisms |
| 9 | Oversight Brief exposes full cycle-based reporting model, evidence boundary filtering, suppression criteria | `pages/oversight/brief/[cycleId].tsx` | Add glossary; disclose filtering criteria transparently |
| 10 | `governed synthesis` user-visible text in tournament engine | `lib/alignment/tournament-engine.ts` line ~340 | Suppress from client output |

---

## TOP 10 MOBILE / UX CORRECTIONS

| # | Issue | File(s) | Fix |
|---|-------|---------|-----|
| 1 | Return Brief fixed 680px max-width | `app/briefing/return/[sessionId]/page.tsx` | Add responsive breakpoints; reflow below 680px |
| 2 | Strategy Room 3-column grid collapses poorly | `pages/strategy-room/session/[id].tsx` | Stack intervention details vertically on mobile |
| 3 | Decision Centre grid layout on mobile | `pages/decision-centre.tsx` | Responsive card layout |
| 4 | Oversight Brief 2-column grids | `pages/oversight/brief/[cycleId].tsx` | Stack sections vertically on mobile |
| 5 | Retainer page tabular layout | `pages/retainer.tsx` | Card-based layout for mobile |
| 6 | Diagnostics Hub 4-column grid | `pages/diagnostics/index.tsx` | Progressive disclosure on mobile |
| 7 | Decision Paths pricing table | `pages/decision-paths/index.tsx` | Vertical stack on mobile |
| 8 | Assessment 5-button Likert cramped on mobile | `app/assessment/[token]/page.tsx` | Vertical button stack |
| 9 | Homepage heavy animation performance | `pages/index.tsx` | Reduce motion on mobile; lazy-load |
| 10 | Directorate Dossier raw JSON overflow | `pages/directorate/dossier/[id].tsx` | Hide JSON behind toggle; vertical layout |

---

## SURFACE CLASSIFICATIONS

### SAFE_FOR_PUBLIC
- Homepage (`/`)
- About (`/about`)
- Method (`/method`) — after "evidence graph" fix
- Trust (`/trust`)
- Verification (`/verification`)
- Security (`/security`)
- Foundations (`/foundations`)
- Evidence (`/evidence`)
- Diagnostics Hub (`/diagnostics`)
- Decision Paths (`/decision-paths`)
- Decision Instruments (`/decision-instruments`)
- Lexicon (`/lexicon`)
- Contact (`/contact`)
- Institutional (`/institutional`)
- Leadership (`/leadership`)
- Education/Research (`/education-research`)
- Pricing (`/pricing`)

### CONTROLLED_ENTRY_ONLY
- Fast Diagnostic
- Purpose Alignment
- Constitutional Diagnostic
- Team Assessment
- Enterprise Assessment
- Executive Reporting
- Decision Centre
- Return Brief
- Strategy Room
- Outcome Check
- Campaign Survey (`/audit/[id]`) — after consent fix
- Assessment (`/assessment/[token]`)
- Why Not AI (`/why-not-ai`) — after claim softening

### RETAINER_READY
- Retainer page — after IP metric abstraction
- Oversight Brief — after glossary and filtering disclosure

### INTERNAL_ONLY
- Admin Command Centre (`/admin`)
- Admin Campaigns (`/admin/campaigns`)
- Admin Organisations (`/admin/organisations`)
- Admin Decision Intelligence (`/admin/decision-intelligence`)
- Admin Decision/* (`/admin/decision/*`)
- Admin Reporting (`/admin/reporting`)
- Admin Snapshot (`/admin/snapshot`)
- Admin Audit Log (`/admin/audit`)
- Directorate Dossier (`/directorate/dossier/[id]`)
- Sovereign Authorize (`/sovereign/authorize`)
- Controls (`/controls`)
- Restricted (`/restricted`)

### DO_NOT_EXPOSE
- CSS Diagnostic (`/diagnostic`) — dev tool, remove from public
- Debug Content (`/debug/content`) — has production gate but should be hardened

### NEEDS_SECURITY_REVIEW
- `/admin/redis` — unguarded
- `/admin/pdf-status` — unguarded
- `/testing/lab` — unguarded
- `/downloads/vault` — unguarded
- `/inner-circle/admin/dashboard` — page-level guard missing
- `/private/admin/premium-downloads` — page-level guard missing

---

## EXACT FILE PATHS TO CHANGE

### Security fixes (auth guards):
1. `pages/admin/redis.tsx` — add requireAdminPage()
2. `pages/admin/pdf-status.tsx` — add requireAdminPage()
3. `app/testing/layout.tsx` — CREATE with requireAdminServer()
4. `app/downloads/layout.tsx` — CREATE with auth guard

### IP term fixes:
5. `components/strategy-room/ExecutionFlow.tsx` — rename micro-tension
6. `pages/decision-centre.tsx` — abstract cognitive state labels
7. `pages/method.tsx` — remove "evidence graph" label

### Trust fixes:
8. `app/audit/[id]/page.tsx` — replace security theatre language

---

## VALIDATION COMMANDS

```bash
npx tsc --noEmit --pretty false
npx next build
```

---

## FINAL LAUNCH-RISK CLASSIFICATION

| Category | Status |
|----------|--------|
| **Public surface IP leakage** | MEDIUM — "evidence graph" on method page, "micro-tension" in Strategy Room |
| **Unguarded admin routes** | CRITICAL — 4 routes with no auth, 2 with partial auth |
| **Claim risk** | MEDIUM — Return Brief and Strategy Room make strong claims without methodology |
| **Mobile readiness** | MEDIUM — Return Brief, Strategy Room, Decision Centre need responsive fixes |
| **Tone consistency** | LOW risk — Institutional tone maintained across all surfaces |
| **Generic copy risk** | LOW — All primary entry points are BESPOKE or MOSTLY BESPOKE |
| **Evidence standard** | MEDIUM — Proof blocks classified, but no full case dossier published |
| **Commercial readiness** | CONTROLLED_ENTRY_ONLY — Ready for design partners, not broad public launch |

**Overall verdict:** The system is ready for controlled market entry with design partners after the 4 security fixes are applied. Broad public launch requires the IP term fixes, mobile responsiveness, and at least 1 published evidence dossier.
