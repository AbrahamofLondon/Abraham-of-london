# Admin Surface Audit

**Date:** 2026-05-07
**Scope:** All existing `pages/admin/*` pages

---

## Page Classification

| Page | Current Purpose | Data Sources | Protected | Relevant | Future Section | Classification | Action | Risk |
|------|----------------|-------------|-----------|----------|---------------|---------------|--------|------|
| `index.tsx` | Command center hub — status cards, navigation | Multiple API aggregations | YES | YES | Console home | OPERATOR_CONSOLE_CORE | KEEP — restructure navigation | LOW |
| `authority-center.tsx` | Active leads, ER completions, SR entries, retainers, contradictions, stakeholders | Authority center APIs | YES | YES | Admissions + Queues | OPERATOR_CONSOLE_CORE | KEEP | LOW |
| `command-wall.tsx` | Topology, security, library, decision views with knowledge graphs | Context registry APIs | YES | YES | System Intelligence | SUPPORTING_TOOL | KEEP | LOW |
| `outcome-ledger.tsx` | Decision outcomes: contradictions, enforcement, outcome classification, cost-of-delay | Outcome ledger API | YES | YES | Outcome Verification | OPERATOR_CONSOLE_CORE | KEEP | LOW |
| `proof.tsx` | Evidence review, approve, anonymise, publish workflow | Proof evidence API | YES | YES | Proof Publication | OPERATOR_CONSOLE_CORE | KEEP | LOW |
| `calibration.tsx` | Model calibration: prediction → outcome → accuracy/bias | Calibration state API | YES | YES | Evidence Integrity | OPERATOR_CONSOLE_CORE | KEEP | LOW |
| `intelligence.tsx` | Real-time audit stream, deal flow diagnostics, AI scoring | Audit log + deal flow APIs | YES | YES | Audit Logs | OPERATOR_CONSOLE_CORE | KEEP | LOW |
| `enterprise-pipeline.tsx` | Sales pipeline: deals, win probability, journey progress | Enterprise pipeline API | YES | YES | Admissions (pipeline) | SUPPORTING_TOOL | KEEP | LOW |
| `enterprise-foundation.tsx` | Executive risk snapshot: launch risk, contracts, AI-exposed decisions | Foundation API | YES | YES | System Health | SUPPORTING_TOOL | KEEP | LOW |
| `conversion-dashboard.tsx` | Conversion metrics: target vs actual, funnel health | Conversion API | YES | YES | Entitlements (revenue) | SUPPORTING_TOOL | KEEP | LOW |
| `assets.tsx` | PDF synchronisation: integrity, sync of intelligence briefs | Asset sync API | YES | YES | Content Management | SUPPORTING_TOOL | KEEP | LOW |
| `validation.tsx` | Commercial validation: product class checks | Validation API | YES | YES | Evidence Integrity | SUPPORTING_TOOL | KEEP | LOW |
| `access-keys.tsx` | Access key/invite management: grants, usage, expiration | Access key API | YES | YES | Access & Revocation | OPERATOR_CONSOLE_CORE | KEEP | LOW |
| `access-revoke.tsx` | Redirects to access-keys | N/A | YES | NO | N/A | LEGACY | RETIRE — redirect only | NONE |
| `pdf-dashboard.tsx` | PDF intelligence registry: report status, documents | PDF registry API | YES | YES | ER Queue (artifacts) | SUPPORTING_TOOL | KEEP | LOW |
| `pdf-status.tsx` | PDF status monitoring | PDF status API | YES | PARTIAL | ER Queue | DUPLICATIVE | MERGE into pdf-dashboard | LOW |
| `redis.tsx` | Redis cache inspection | Redis API | YES | YES | System Health | SUPPORTING_TOOL | KEEP | LOW |
| `login.tsx` | Admin authentication | Auth API | YES | YES | Auth | OPERATOR_CONSOLE_CORE | KEEP | LOW |

---

## Summary

| Classification | Count |
|---------------|-------|
| OPERATOR_CONSOLE_CORE | 8 |
| SUPPORTING_TOOL | 7 |
| LEGACY | 1 (access-revoke — redirect only) |
| DUPLICATIVE | 1 (pdf-status — merge into pdf-dashboard) |
| RISKY | 0 |
| UNKNOWN | 0 |

All admin pages are protected by `requireAdminPage()`. No public exposure risk. The existing admin surface is comprehensive and well-segmented — it needs restructured navigation, not replacement.
