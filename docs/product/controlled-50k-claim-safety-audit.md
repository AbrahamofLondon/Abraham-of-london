# Controlled £50k Claim Safety Audit

Generated: 2026-05-10

## Findings

### FIXED THIS PASS

| File | Line | Phrase | Action | Status |
|---|---|---|---|---|
| `lib/product/oversight-signal-builder.ts` | 249 | "verified improvement" | Rewritten to "improvement signal" | FIXED |
| `pages/diagnostics/team-assessment.tsx` | 993 | Raw formula weights exposed | Replaced with descriptive text | FIXED |
| `pages/diagnostics/enterprise-assessment.tsx` | 1020 | Raw formula weights exposed | Replaced with descriptive text | FIXED |

### SAFE — NEGATION CONTEXT

| File | Line | Phrase | Context |
|---|---|---|---|
| `pages/engagements/retained-oversight.tsx` | 54 | "Not automated oversight..." | Explicit disclaimer of what system does NOT do |
| `pages/engagements/operator-pilot.tsx` | 83 | "No promise of verified improvement without verification" | Negation |
| `lib/pdf/runtime-verification.ts` | 20 | "automated oversight, or verified outcomes" | Negation check list |
| `pages/refund-policy.tsx` | 94 | "not guaranteed outcomes" | Refund policy disclaimer |
| `pages/trust.tsx` | 68 | "Guaranteed outcomes" under "What Not To Expect" | Negation section |

### SAFE — INTERNAL/AUDIT SCRIPTS

| File | Phrase | Reason |
|---|---|---|
| `scripts/audit-product-copy-integrity.ts` | "guaranteed outcome" | Guard checking for the phrase |
| `lib/product/kernel-safe-summary.ts` | "kernel", "graph" | Sanitisation logic replacing internal terms |
| `lib/analytics/contradiction-graph-presenter.ts` | "graph mechanics" | Comment: "without exposing graph mechanics" |
| `lib/product/institutional-case-intelligence-composer.ts` | "kernel", "graph", "threshold", "formula" | Comment documenting what is forbidden |

### NEEDS MONITORING

| File | Line | Phrase | Risk | Status |
|---|---|---|---|---|
| `lib/alignment/tournament-engine.ts` | test file | "industry benchmark" | Appears in test fixture generative text | INTERNAL_ONLY_OK — test file, not buyer-visible |
| `pages/engagements/retained-oversight.tsx` | 54 | Repeated mention of forbidden concepts in disclaimer | Reinforces concepts by naming them | ACCEPTABLE — disclaimer is honest |
| `lib/product/oversight-signal-builder.ts` | 168 | "routine automated oversight" | Normalises concept | NEEDS_REWRITE in future pass |

## Verdict

**Claim discipline: CONTROLLED_READY**

No buyer-visible surface currently makes an unsupported automation, verification, or benchmark claim. Formula exposure has been closed. Internal comments and guard scripts appropriately reference forbidden terms without surfacing them.
