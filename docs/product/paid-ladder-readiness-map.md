# Paid Ladder Readiness Map

**Date:** 2026-05-07
**Authority:** Decision Infrastructure by Abraham of London

---

## Product Access States

```typescript
type ProductAccessState =
  | "OPEN"              // Free, no gate
  | "SUBSIDISED"        // Free now, will become paid
  | "PAID_REQUIRED"     // Payment needed before access
  | "PURCHASED"         // User has paid
  | "ENTITLED"          // Access granted (admin, sponsor, retainer)
  | "ADMITTED"          // Server admission passed
  | "RESTRICTED"        // Evidence insufficient
  | "EXPIRED"           // Entitlement expired
  | "REVOKED"           // Access revoked
  | "SPONSORED"         // Organisation sponsor granted
  | "ADMIN_GRANTED"     // Admin override
```

---

## Ladder Step Map

| Step | Current Price | Current Access | Future Paid State | Entitlement Slug | Admission Required | Org Required | Checkout Path | Post-Payment Path | Upgrade Path |
|------|-------------|---------------|-------------------|-----------------|-------------------|-------------|--------------|-------------------|-------------|
| **Fast Diagnostic** | Free | OPEN | OPEN (always free) | N/A | No | No | N/A | Inline result | → Purpose Alignment |
| **Purpose Alignment** | Free | OPEN | OPEN (always free) | N/A | No | No | N/A | Inline result | → Constitutional |
| **Constitutional Diagnostic** | Free | OPEN | SUBSIDISED → PAID_REQUIRED | `constitutional-diagnostic` | No (currently) | No | TBD | Inline result | → Team Assessment |
| **Team Assessment** | Free | OPEN | SUBSIDISED → PAID_REQUIRED | `team-assessment` | No | Yes (for respondent mode) | TBD | Inline result | → Enterprise |
| **Enterprise Assessment** | Free | OPEN | SUBSIDISED → PAID_REQUIRED | `enterprise-assessment` | No | Yes (for respondent mode) | TBD | Inline result | → Exec Reporting |
| **Executive Reporting** | £295 | PAID_REQUIRED | PAID_REQUIRED | `assessment.executive_reporting` | YES — server admission | No | `/api/billing/checkout` | `/diagnostics/executive-reporting/run` | → Strategy Room |
| **Strategy Room** | £750 | PAID_REQUIRED | PAID_REQUIRED | `strategy-room.entry` | YES — server admission | No | `/api/billing/checkout` | `/strategy-room/session/` | → Return Brief |
| **Strategy Room Extended** | £1,250 | PAID_REQUIRED | PAID_REQUIRED | `strategy-room-extended` | YES — server admission | No | `/api/billing/checkout` | `/strategy-room/session/` | → Retainer |
| **Return Brief** | Included with SR | ENTITLED | ENTITLED (with SR purchase) | Via SR entitlement | YES — session access | No | N/A | `/briefing/return/[sessionId]` | → Retainer |
| **Outcome Verification** | Included | ENTITLED | ENTITLED (with SR/ER) | Via parent entitlement | YES — session access | No | N/A | Inline in Return Brief | — |
| **Decision Credit** | N/A | System-derived | System-derived | N/A | N/A | No | N/A | Visible in Decision Centre | — |

---

## Decision Tools (Standalone Products)

| Product | Price | Access State | Entitlement | Notes |
|---------|-------|-------------|-------------|-------|
| Decision Exposure Instrument | £29 | PAID_REQUIRED | `decision-exposure-instrument` | Standalone |
| Mandate Clarity Framework | £49 | PAID_REQUIRED | `mandate-clarity-framework` | Standalone |
| Intervention Path Selector | £79 | PAID_REQUIRED | `intervention-path-selector` | Standalone |
| Operator Decision Pack | £129 | PAID_REQUIRED | Bundle of all 3 | Bundle discount |

---

## Enterprise Retainers (Contracted)

| Tier | Price | Status | Entitlement |
|------|-------|--------|-------------|
| Core | Contracted/month | Inactive until contracted | `retainer_core` |
| Operational | Contracted/month | Inactive until contracted | `retainer_operational` |
| Institutional | Contracted/month | Inactive until contracted | `retainer_institutional` |

---

## Refund/Restriction Logic

| Scenario | Policy |
|----------|--------|
| Paid for ER but admission fails | Should not happen — checkout calls `evaluateERAdmission()` before Stripe session. If edge case, refund eligible. |
| Paid for SR but admission fails | Should not happen — execution route calls `evaluateStrategyRoomAdmission()`. If edge case, refund eligible. |
| Entitlement expired | User sees expired state, not access error. Renewal path shown. |
| Revoked access | User sees revocation notice with reason. Admin action logged. |

---

## Dashboard/Control Centre Visibility

| Product | User Decision Centre | Org Control Room | Operator Console |
|---------|---------------------|-----------------|-----------------|
| Free diagnostics | Completed stages list | Campaign completion | System health |
| Executive Reporting | Entitlement status, admission | Campaign ER queue | ER queue |
| Strategy Room | Session status, execution | Intervention queue | SR queue |
| Return Brief | Available briefs, outcomes | Outcome verification | Outcome ledger |
| Decision Credit | Score + trend | Org-level credit | Credit overview |
