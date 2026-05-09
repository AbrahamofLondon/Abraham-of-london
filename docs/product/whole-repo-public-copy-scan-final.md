# Whole-Repo Public Copy Scan Final

## Scope

Scanned public-facing source with exclusions requested for this pass:

- Included: `pages/**`, `app/**`, `components/**`
- Included selectively: `lib/**` only where user-facing strings or rendered labels appear
- Included selectively: `content/**` only where routed or surfaced through public renderers
- Excluded: `docs/product/**`, `scripts/**`, tests, internal-only admin notes, comments that are not rendered

## Scan method

Terms searched:

- `advisory`
- `consulting`
- `unlock`
- `upgrade`
- `premium`
- `AI-accelerated`
- `AI baseline`
- `verified`
- `proven`
- `guaranteed`
- `proprietary`
- `algorithm`
- `kernel`
- `graph mechanics`
- `arbiter rules`
- `machine learning`
- `neural network`
- `deep learning`
- `book a call`
- `contact us`
- `private advisory`
- `score-based`
- `score formula`
- `threshold`
- `benchmark`
- `board-grade`

## Rewrite closure completed in this pass

The following public surfaces were rewritten because they would otherwise have been `REWRITE_REQUIRED`:

- [pages/why-not-ai.tsx](/C:/aol-check-visual/pages/why-not-ai.tsx)
  `proprietary cost modelling` → `case-grounded cost modelling`
- [pages/vault/index.tsx](/C:/aol-check-visual/pages/vault/index.tsx)
  `Unlock the Full Archive` / `Premium reports access` / `Private advisory` language removed
- [app/assessment/success/page.tsx](/C:/aol-check-visual/app/assessment/success/page.tsx)
  `Commitment Verified` → `Commitment Recorded`
- [pages/about.tsx](/C:/aol-check-visual/pages/about.tsx)
  `public-private advisory environments` → `mixed public-private operating environments`
- [app/downloads/vault/page.tsx](/C:/aol-check-visual/app/downloads/vault/page.tsx)
  `Proprietary artifacts` → `Restricted artifacts`
- [pages/method.tsx](/C:/aol-check-visual/pages/method.tsx)
  `Proprietary evaluation per statement` → `Structured evaluation per statement`
- [pages/foundations.tsx](/C:/aol-check-visual/pages/foundations.tsx)
  `Proprietary Systems` → `Original Systems`
- [pages/consulting/index.tsx](/C:/aol-check-visual/pages/consulting/index.tsx)
  `Private Advisory` → `Private Working Access`
- [components/diagnostics/PricingLanguageStrip.tsx](/C:/aol-check-visual/components/diagnostics/PricingLanguageStrip.tsx)
  `Premium flagship` / `Private advisory` language removed
- [components/diagnostics/ExecutiveOfferLadder.tsx](/C:/aol-check-visual/components/diagnostics/ExecutiveOfferLadder.tsx)
  `Premium` / `advisory` phrasing normalised
- [components/diagnostics/SalesObjectionGrid.tsx](/C:/aol-check-visual/components/diagnostics/SalesObjectionGrid.tsx)
  `private advisory` phrasing removed
- [components/homepage/CategoryFrontDoor.tsx](/C:/aol-check-visual/components/homepage/CategoryFrontDoor.tsx)
  `proprietary operating mechanics` → `restricted operating mechanics`

## Final classification register

### `SAFE_PUBLIC`

These matches remain user-facing but are acceptable because they are factual, caveated, or describe explicit evidence posture rather than making unsupported product claims.

- [pages/verification.tsx](/C:/aol-check-visual/pages/verification.tsx)
  `consulting` appears in a credential title and `verified` appears in evidence-standard language with explicit caveats.
- [app/briefing/return/[sessionId]/page.tsx](/C:/aol-check-visual/app/briefing/return/[sessionId]/page.tsx)
  `verified`, `threshold`, and `board-grade` appear in case-governance or evidence-standard contexts with explicit limitations.
- [pages/evidence/[slug].tsx](/C:/aol-check-visual/pages/evidence/[slug].tsx), [pages/evidence/standards.tsx](/C:/aol-check-visual/pages/evidence/standards.tsx), [pages/trust.tsx](/C:/aol-check-visual/pages/trust.tsx)
  `proprietary` appears only in negative disclosure language stating what is not exposed.
- [pages/about.tsx](/C:/aol-check-visual/pages/about.tsx)
  `verified` describes outcome posture, not a guarantee.
- [content/briefs/**](/C:/aol-check-visual/content/briefs), [content/intelligence/**](/C:/aol-check-visual/content/intelligence), [content/shorts/**](/C:/aol-check-visual/content/shorts)
  Remaining `advisory`, `verified`, `proven`, `threshold`, and `benchmark` matches are editorial series labels or article copy, not runtime claims about hidden mechanics.

### `SAFE_ROUTE_REDIRECT`

- [pages/vault/[...slug].tsx](/C:/aol-check-visual/pages/vault/[...slug].tsx)
  `ClientUnlockRenderer` is a gated route handoff, not public claim copy.
- Access/redirect helpers under `lib/access/**` and `lib/auth/**`
  `upgrade`, `premium`, and `verified` are access-routing labels or alias maps, not public runtime copy.

### `SAFE_INTERNAL`

These matches are internal code, admin copy, diagnostics-only internals, or non-public route infrastructure.

- `app/api/**` and `pages/api/**` route internals mentioning `kernel`, `threshold`, `benchmark`, or `verified`
- `lib/benchmarks/**`, `lib/analytics/**`, `lib/decision/**`, `lib/intelligence/**`, `lib/pdf/**`, `lib/boardroom/**`
- [components/Intelligence/internal/**](/C:/aol-check-visual/components/Intelligence/internal)
- Admin, diagnostics, or gated commercial components that are not imported into public intelligence runtime surfaces

### `SAFE_DOCS_ONLY`

- `content/_partials/**`
- historical authoring notes and non-routed content fragments

## Result

- `REWRITE_REQUIRED`: none
- `REMOVE_REQUIRED`: none

## Notes

- The raw search still returns many matches because the repo contains factual outcome-verification language, credential names, access-tier aliases, editorial content taxonomy, and internal benchmark/kernel code.
- Those remaining matches are now classified rather than left ambiguous.
- No unresolved public claim leakage remains in the public intelligence runtime surfaces or the user-facing marketing/reporting copy touched by this pass.
