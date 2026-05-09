# Earned Progression Commercial Audit

> Date: 2026-05-09
> Principle: Evidence → eligibility → earned next step → user choice → consequence of declining is remembered.

---

## Commercial CTA Classification

| Surface | CTA | Before | After | Classification |
|---------|-----|--------|-------|---------------|
| Fast Diagnostic result | "Mandate Clarity Framework — £49" | GENERIC (product recommendation) | Shows only when authority gap confirmed | EARNED |
| Fast Diagnostic result | "Decision Centre" | Always shown | Always shown | SAFE |
| Fast Diagnostic result | "You can stop here" | Missing | Implicit via whatHappensIfYouStop | SAFE |
| PA result | Next instrument card | Static "Run Team Diagnostic" | Evidence-based via `determineEarnedNextStep()` | EARNED |
| PA result | "Constitutional Diagnostic" | Static link | Secondary CTA after earned step | SAFE |
| Decision Centre | Checkpoint panel | N/A | Checkpoint response prioritised over products | SAFE |
| ER result | "Accept — enter Strategy Room" | Direct link | Earned progression (requires accept/challenge) | EARNED |
| SR entry | "Your required move" | Static instruction | Dynamic based on session state | SAFE |
| Return Brief | Checkpoint response | N/A | Response required, not product CTA | SAFE |
| Oversight Brief | Retainer intake | "Request retained oversight" | Only when retainer signal detected | CONTRACTED_ONLY |

---

## Progression State Coverage

| State | Implemented | Example |
|-------|:-----------:|---------|
| NOT_RELEVANT | YES | No instrument applies |
| INSUFFICIENT_EVIDENCE | YES | Returns null, no card shown |
| AVAILABLE_BUT_NOT_WARRANTED | YES | PDA when inactive |
| EARNED_ACCESS | YES | Mandate Clarity when authority gap confirmed |
| RECOMMENDED_BY_EVIDENCE | YES | Executive Reporting when institutional stakes detected |
| ESCALATION_WARRANTED | PARTIAL | ER/SR escalation exists, not counsel-specific |
| RETAINER_SIGNAL_DETECTED | PARTIAL | Retainer intake exists, not engine-driven |
| COUNSEL_WARRANTED | NOT_YET | Counsel Room exists but not in progression engine |
| BLOCKED_UNTIL_MORE_EVIDENCE | YES | Returns null with insufficient evidence |
| ALREADY_ENTITLED | NOT_YET | Card does not yet check entitlements |

---

## Language Corrections Applied

| Before | After |
|--------|-------|
| "Recommended next instrument" | "Earned next step" |
| "Based on the fracture detected, the next appropriate instrument is..." | Shows evidence threshold + what it will test |
| No stop path | "Your current finding and checkpoint remain active. The system will still check whether you acted." |
| Generic product description | Evidence-specific reason + whatItWillTest |
| Missing evidence explanation | "Evidence threshold met because: [list]" |

---

## Remaining Risks

| Risk | Severity | Mitigation |
|------|----------|-----------|
| PDA shows as "Not yet available" — may frustrate | Low | Text explains it's being prepared |
| Entitlement check not implemented in card | Medium | ALREADY_ENTITLED state defined but not checked |
| Counsel not integrated into progression engine | Medium | Counsel Room exists separately |
| Retainer not offered through progression engine | Low | Retainer is contracted, not self-serve |
