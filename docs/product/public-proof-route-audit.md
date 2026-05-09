# Public Proof Route Audit — pages/method.tsx

Audit date: 2026-05-09

## Link inventory

| Link text | Destination | Status | Notes |
|---|---|---|---|
| source labels, evidence posture, challenge status, and the basis of the finding | `/evidence/standards` | FIXED | Was `/#proof-layer` — homepage fallback anchor that does not resolve. Replaced with `/evidence/standards` (exists as `pages/evidence/standards.tsx`). Overclaim language also replaced. |
| See applied evidence | `/evidence` | VALID | Resolves to `pages/evidence/index.tsx` |
| Run the diagnostic to see the proof | `/diagnostics/fast` | VALID | Resolves to `pages/diagnostics/fast.tsx` |
| Run the diagnostic (CTA button) | `/diagnostics/fast` | VALID | Same route, CTA variant |
| Personal assessment · Free | `/diagnostics/purpose-alignment` | VALID | Resolves to `pages/diagnostics/purpose-alignment.tsx` |
| Verify the founder | `/verification` | VALID | Resolves to `pages/verification.tsx` |
| Trust boundaries | `/trust` | VALID | Resolves to `pages/trust.tsx` |
| Foundations | `/foundations` | VALID | Resolves to `pages/foundations.tsx` |
| Founder | `/about/founder` | VALID | Resolves to `pages/about/founder.tsx` |

## Language changes

| Before | After |
|---|---|
| "determinism proof and full decision trace" | "source labels, evidence posture, challenge status, and the basis of the finding" |
| "the user can verify exactly how the system reached its conclusion" | "Internal reasoning mechanics are not exposed." |
