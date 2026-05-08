# Operator Console Navigation Plan

**Date:** 2026-05-08
**Rule:** Do not refactor admin pages yet. Map existing pages into a coherent navigation structure first.

---

## Proposed top-level sections

| Section | Purpose | Existing page(s) |
|---------|---------|------------------|
| **Admissions** | SR/ER admission queue, restricted cases | `authority-center.tsx` |
| **Living Cases** | Active cases across all users | NEW — aggregation over DiagnosticJourney |
| **Organisations** | Organisation management | Linked from admin index |
| **Campaigns** | Campaign management, completion | Linked from admin index |
| **Evidence Integrity** | Evidence quality, calibration, validation | `calibration.tsx`, `validation.tsx` |
| **Strategy Room Queue** | SR inquiries, execution sessions | `authority-center.tsx` (SR section), `enterprise-pipeline.tsx` |
| **Executive Reporting Queue** | ER requests, artifact delivery | `authority-center.tsx` (ER section), `pdf-dashboard.tsx` |
| **Outcome Verification** | Outcome ledger, verification status | `outcome-ledger.tsx` |
| **Proof Publication** | Evidence review, approval, anonymisation | `proof.tsx` |
| **Entitlements** | Access keys, invites, revenue | `access-keys.tsx`, `conversion-dashboard.tsx` |
| **Access & Revocation** | Key management, revocation | `access-keys.tsx` |
| **System Health** | Redis, foundation risk, assets | `redis.tsx`, `enterprise-foundation.tsx`, `assets.tsx` |
| **Audit Logs** | Audit stream, intelligence | `intelligence.tsx`, `command-wall.tsx` |

---

## Page disposition

| Page | Action | Target section | Risk |
|------|--------|---------------|------|
| `index.tsx` | KEEP — update navigation to reflect sections | Console home | LOW |
| `authority-center.tsx` | KEEP — primary operational view | Admissions + Queues | LOW |
| `command-wall.tsx` | KEEP — advanced control surface | Audit Logs | LOW |
| `outcome-ledger.tsx` | KEEP | Outcome Verification | LOW |
| `proof.tsx` | KEEP | Proof Publication | LOW |
| `calibration.tsx` | KEEP | Evidence Integrity | LOW |
| `intelligence.tsx` | KEEP | Audit Logs | LOW |
| `enterprise-pipeline.tsx` | KEEP | Admissions (pipeline) | LOW |
| `enterprise-foundation.tsx` | KEEP | System Health | LOW |
| `conversion-dashboard.tsx` | KEEP | Entitlements | LOW |
| `assets.tsx` | KEEP | System Health | LOW |
| `validation.tsx` | KEEP | Evidence Integrity | LOW |
| `access-keys.tsx` | KEEP | Access & Revocation | LOW |
| `access-revoke.tsx` | MERGE into access-keys | Access & Revocation | NONE — already redirects |
| `pdf-dashboard.tsx` | KEEP | ER Queue | LOW |
| `pdf-status.tsx` | MERGE into pdf-dashboard later | ER Queue | LOW |
| `redis.tsx` | KEEP | System Health | LOW |
| `login.tsx` | KEEP | Auth | LOW |

---

## Implementation approach

### Phase 1: Navigation update (NOW)
Update `pages/admin/index.tsx` to group existing links under the 13 section headers. No page moves. No route changes. Just navigation clarity.

### Phase 2: Section consolidation (NEXT)
- Merge `access-revoke.tsx` redirect into `access-keys.tsx`
- Merge `pdf-status.tsx` into `pdf-dashboard.tsx`
- Add "Living Cases" section with new aggregation view

### Phase 3: Full console (LATER)
- Role-scoped access per section
- Consolidated views where pages overlap
- New sections for capabilities not yet surfaced (collision detection, Decision Credit overview)

---

## What must NOT happen

- Do not delete any existing admin page
- Do not rename admin routes without approval
- Do not expose admin pages publicly
- Do not restructure routing aggressively
- Do not implement role-scoped access before the role model is extended

---

## Multi-User Implications

The current navigation plan needs a small extension for the multi-user foundation pass. This does not require route refactors yet.

| Section | Purpose | Existing anchor |
|---------|---------|-----------------|
| Organisation Campaigns | Campaign list, campaign health, active sponsors, completion posture | `app/admin/organisations/[id]/dashboard/page.tsx`, `app/admin/campaigns/*` |
| Aggregation Safety | Threshold suppression, anonymity mode, sponsor-safe visibility checks | New operator sub-panel over existing campaign data |
| Divergence Review | Collision summary, leadership gap, blocker mismatch | `LeadershipGapSnapshot`, multi-user collision summary helper |
| Control Room Readiness | Whether org data is safe enough for Control Room v0 exposure | New operator checklist view |
| Respondent Privacy | Anonymous/named/hybrid campaign mode audit and suppression state | Existing campaign metadata + invite/aggregate surfaces |
| Enterprise Entitlements | Sponsor/retainer/commercial readiness for multi-user upgrade surfaces | Existing entitlements pages plus organisation context |

### Additional rules

- Operator console may inspect campaign safety state before any sponsor-facing Control Room is exposed.
- Control Room readiness is a governance section, not a UI launch flag hidden in code.
- Respondent privacy posture must be visible to operators before divergence or reporting actions are commissioned.
