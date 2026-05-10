# reCAPTCHA Canonicalisation Audit

Date: 2026-05-09

## Recommendation

- Client canonical: `lib/recaptchaClient.ts`
- Server canonical: `lib/recaptchaServer.ts`

## Classification

| File | Classification | Active usage | Notes |
| --- | --- | --- | --- |
| `lib/recaptchaClient.ts` | `CLIENT_CANONICAL` | Active in `components/ContactForm.tsx`, `components/NewsletterForm.tsx`, `components/TeaserRequest.tsx`, `pages/inner-circle/*`, `components/strategy-room/ArtifactGrid.tsx` | Correct client-only token generation path. |
| `lib/recaptchaServer.ts` | `SERVER_CANONICAL` | Active in `pages/api/*`, `lib/apiGuard.ts`, Netlify functions, strategy-room server code | Correct server verification path. |
| `lib/recaptcha.ts` | `LEGACY_COMPAT` | No active imports found | Thin shim to server canonical. |
| `lib/verifyRecaptcha.ts` | `LEGACY_COMPAT` | No active imports found | Thin shim to server canonical. |
| `lib/isRecaptchaValid.ts` | `LEGACY_COMPAT` | No active imports found | Thin wrapper over `verifyRecaptcha`. |
| `lib/server/recaptchaUtils.ts` | `LEGACY_COMPAT` | No active imports found | Thin re-export. |
| `lib/_recaptchaServer.DEPRECATED.ts` | `DEPRECATED_SAFE_TO_DELETE` | No active imports found | Deprecated re-export only. |

## Findings

- No active route lost bot protection in this pass.
- No server secret is exposed through the client canonical file; the client helper uses only `NEXT_PUBLIC_*` settings.
- The active code path already favors the correct split, but several thin compat files remain.
