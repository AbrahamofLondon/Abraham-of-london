# Decision Credit Governance Policy

**Date:** 2026-05-08
**Authority:** Decision Infrastructure by Abraham of London

---

## Governing rule

Decision credit affects review intensity. It does not override evidence.

Decision credit never:

- bypasses evidence sufficiency
- bypasses admission gates
- bypasses respondent privacy
- grants product access on its own

Decision credit may:

- reduce review friction when evidence is already sufficient
- increase scrutiny when follow-through is deteriorating
- trigger counsel review when repeated breach accumulates

---

## Bands

| Band | Meaning | Governance effect |
|------|---------|-------------------|
| `TRUSTED` | Strong execution reputation | `FAST_TRACK_REVIEW` where evidence is already sufficient |
| `STABLE` | No clear concern | `STANDARD` |
| `WATCH` | Follow-through weakening | `ADDITIONAL_EVIDENCE_REQUIRED` |
| `RESTRICTED` | Repeated breach or fragile execution reputation | `COUNSEL_REVIEW_RECOMMENDED` |

---

## Policy consequences

- High credit should not create an unsafe bypass.
- Low credit should not permanently punish.
- Repeated breach should increase review intensity.
- Counsel may be recommended for persistent low-credit conditions.
- Credit is a governance modifier, not a commercial shortcut.
