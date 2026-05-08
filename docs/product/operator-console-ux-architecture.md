# Operator Console UX Architecture

**Date:** 2026-05-07
**Authority:** Decision Infrastructure by Abraham of London
**Route:** `/admin` (existing) → restructure into canonical sections
**Audience:** Internal operators — this is institutional operations, not "website admin"

---

## Console Sections

### 1. Admissions
- Recent admission decisions (ADMITTED / RESTRICTED / BLOCKED)
- Strategy Room admission queue
- Executive Reporting admission queue
- Restricted cases with reasons
- Repair action tracking
**Maps from:** authority-center.tsx (active leads, ER completions, SR entries)

### 2. Living Cases
- Active Living Cases across all users
- Case status distribution
- Evidence tier distribution
- Unresolved contradiction heatmap
- Stalled cases (no activity > 14 days)
**Maps from:** NEW — derived from DiagnosticJourney aggregation

### 3. Organisations
- Organisation list with status
- Campaign completion rates
- Member count and engagement
- Retainer status
**Maps from:** Existing organisation admin pages

### 4. Campaigns
- Active campaigns across all organisations
- Respondent completion rates
- Campaigns below threshold
- Divergence alerts
**Maps from:** Existing campaign admin functionality

### 5. Evidence Integrity
- Evidence node quality distribution
- Confidence score distribution
- Contradiction severity heatmap
- Evidence tier progression rates
- Stale evidence detection
**Maps from:** validation.tsx, calibration.tsx

### 6. Strategy Room Queue
- Pending Strategy Room inquiries
- Admission-restricted inquiries (with reasons)
- Active execution sessions
- Decision log audit
**Maps from:** authority-center.tsx (SR entries), enterprise-pipeline.tsx

### 7. Executive Reporting Queue
- Pending ER requests
- Completed reports
- ER artifact delivery status
**Maps from:** authority-center.tsx (ER completions), pdf-dashboard.tsx

### 8. Outcome Verification
- Pending outcome verifications (14-day, 30-day)
- Verified outcomes with classification
- Calibration accuracy
**Maps from:** outcome-ledger.tsx, calibration.tsx

### 9. Proof Publication
- Proof evidence pending review
- Approved evidence
- Published evidence
- Anonymisation queue
**Maps from:** proof.tsx

### 10. Entitlements
- Active entitlements by product
- Expiring entitlements
- Revenue by product
- Failed entitlement grants
**Maps from:** access-keys.tsx, conversion-dashboard.tsx

### 11. Access & Revocation
- Access key management
- Invite management
- Revocation queue
**Maps from:** access-keys.tsx, access-revoke.tsx

### 12. System Health
- Build status
- Redis cache health
- API response times
- Error rates
- Abuse detection alerts
**Maps from:** redis.tsx, enterprise-foundation.tsx

### 13. Audit Logs
- System audit log viewer
- Security events
- Governance alerts
- Admin action history
**Maps from:** intelligence.tsx (audit stream)

---

## Existing Admin Page Classification

| Page | Console Section | Classification | Action |
|------|----------------|---------------|--------|
| `index.tsx` | Console home | OPERATOR_CONSOLE_CORE | KEEP — restructure as section hub |
| `authority-center.tsx` | Admissions + Queues | OPERATOR_CONSOLE_CORE | KEEP — primary operational view |
| `command-wall.tsx` | System Health + Intelligence | SUPPORTING_TOOL | KEEP — advanced control surface |
| `outcome-ledger.tsx` | Outcome Verification | OPERATOR_CONSOLE_CORE | KEEP |
| `proof.tsx` | Proof Publication | OPERATOR_CONSOLE_CORE | KEEP |
| `calibration.tsx` | Evidence Integrity | OPERATOR_CONSOLE_CORE | KEEP |
| `intelligence.tsx` | Audit Logs + Intelligence | OPERATOR_CONSOLE_CORE | KEEP |
| `enterprise-pipeline.tsx` | Admissions (pipeline view) | SUPPORTING_TOOL | KEEP — sales intelligence |
| `enterprise-foundation.tsx` | System Health | SUPPORTING_TOOL | KEEP — risk snapshot |
| `conversion-dashboard.tsx` | Entitlements (revenue) | SUPPORTING_TOOL | KEEP |
| `assets.tsx` | Content management | SUPPORTING_TOOL | KEEP |
| `validation.tsx` | Evidence Integrity | SUPPORTING_TOOL | KEEP |
| `access-keys.tsx` | Access & Revocation | OPERATOR_CONSOLE_CORE | KEEP |
| `access-revoke.tsx` | Access & Revocation | LEGACY | MERGE into access-keys |
| `pdf-dashboard.tsx` | ER Queue (artifacts) | SUPPORTING_TOOL | KEEP |
| `pdf-status.tsx` | ER Queue (status) | DUPLICATIVE | MERGE into pdf-dashboard |
| `redis.tsx` | System Health | SUPPORTING_TOOL | KEEP — infrastructure view |
| `login.tsx` | Auth | OPERATOR_CONSOLE_CORE | KEEP |

---

## Permission Levels

| Level | Access |
|-------|--------|
| Super Admin | All sections |
| Operator | Admissions, Living Cases, Campaigns, Queues, Outcomes |
| Reviewer | Evidence Integrity, Proof Publication, Calibration |
| Finance | Entitlements, Conversion, Revenue |
| Evidence Auditor | Evidence Integrity, Proof Publication, Audit Logs |
| Support | Access & Revocation, System Health, Audit Logs |
