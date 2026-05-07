# Mobile & Accessibility Audit

**Date:** 2026-05-07
**Scope:** Code-level audit of mobile readiness, touch interaction, and accessibility compliance
**Method:** Static analysis of TSX components, Tailwind config, inline styles, and layout patterns
**Standard:** WCAG 2.1 AA, iOS Safari 375px baseline, premium advisory UX expectations

---

## 1. Responsive Framework Assessment

### CSS Framework: Tailwind CSS (JIT mode)
- **Config:** `tailwind.config.cjs` with standard breakpoints: sm(640), md(768), lg(1024), xl(1280), 2xl(1440)
- **Container padding:** DEFAULT 1.25rem, sm 1.5rem, lg 3rem -- good mobile-first progression
- **Responsive utility usage:** 2,023 breakpoint-prefixed classes across 486 files -- extensive adoption

### Viewport Meta Tag
- Present in `pages/_app.tsx`: `width=device-width, initial-scale=1, viewport-fit=cover`
- Also in `components/SiteLayout.tsx` (configurable, defaults to `width=device-width, initial-scale=1.0, viewport-fit=cover`)
- Also in `components/layout/Layout.tsx`: `width=device-width, initial-scale=1, maximum-scale=5`
- **Verdict:** Correct. `viewport-fit=cover` handles iPhone notch. `maximum-scale=5` allows pinch-zoom (WCAG compliant). No `user-scalable=no` anywhere.

### Design System
- Heavy use of CSS custom properties (`--ds-text`, `--ds-border`, `--ds-panel`, etc.) for theming
- Framer Motion (`motion.div`) used extensively for viewport-triggered animations
- **Risk:** Motion-heavy pages may feel sluggish on older mobile devices; no `prefers-reduced-motion` check found in animation definitions

---

## 2. Critical Journey Audit

### 2A. Fast Diagnostic (`pages/diagnostics/fast.tsx`)

**Mobile pattern score: 7/10**

**Strengths:**
- Uses `clamp()` for hero typography: `clamp(2rem, 5vw, 3.8rem)` -- scales properly at 375px
- Full-screen centered layout (`flex flex-col items-center justify-center min-h-screen px-6`) -- works on mobile
- Textarea is full-width (`width: "100%"`) with adequate padding (16px)
- Content maxWidth capped at `640px` -- fits mobile without horizontal overflow
- Resume/start-fresh buttons use `flexWrap: "wrap"` -- safe for narrow screens

**Risks:**
- Buttons use inline style `padding: "16px 36px"` -- adequate touch targets (48px height approx)
- Step indicator text at `fontSize: "7px"` -- below legibility threshold on mobile. At 375px this is physically unreadable
- Microcopy label under "No signup" at `fontSize: "8px"` -- borderline illegible
- "Continue" button is right-aligned (`justifyContent: "flex-end"`) and not full-width on mobile -- awkward thumb reach on left-handed hold
- No explicit `min-height` on touch targets; padding creates ~46px height which passes 44px minimum

**Horizontal overflow risk:** LOW -- all content constrained to max-width with px-6 padding

### 2B. Strategy Room (`pages/strategy-room/index.tsx`, 2250 lines)

**Mobile pattern score: 5/10**

**Strengths:**
- Main wrapper uses `max-w-6xl px-6 lg:px-12` -- responsive padding
- Form component (`components/strategy-room/Form.tsx`) uses full-width inputs (`width: "100%"`)
- Buttons use `flexWrap: "wrap"` for mobile safety

**Risks:**
- Gate directive links at `fontSize: "7px"` -- unreadable on mobile
- CTA button at `fontSize: "8px"` with `padding: "8px 18px"` -- only ~30px tap target height, fails 44px minimum
- Inline style labels at `fontSize: "7px"` with `letterSpacing: "0.34em"` -- extreme letter-spacing compounds illegibility at small sizes
- Navigation links in gate ("Institutional mandate", "Private advisory", "Contact") at `fontSize: "7px"` -- untappable on mobile
- Form input padding is `11px 13px` -- creates ~38px input height, below 44px touch target guideline
- Slider inputs (consequence mapping stage) use native range inputs which are acceptable on mobile, but no visible touch-target enlargement
- 2250-line page with multiple complex states -- no mobile-specific layout adaptations found

### 2C. Checkout Flow (`components/commercial/CheckoutButton.tsx`)

**Mobile pattern score: 6/10**

**Strengths:**
- Email input is full-width (`width: "100%"`) with reasonable padding (`8px 12px`)
- Error messages are visible with adequate font size (13px)
- Flow redirects to Stripe for payment -- Stripe's hosted checkout is mobile-optimized

**Risks:**
- No explicit button styling -- relies entirely on parent className/style props. Mobile treatment depends on integration context
- Email input padding creates ~34px height -- below 44px touch target
- `onKeyDown` handler for Enter key exists but no mobile-specific keyboard handling (inputMode, autocomplete, etc.)
- No loading state visual feedback beyond boolean flag -- mobile users need clearer confirmation

### 2D. Homepage (`pages/index.tsx`, 3448 lines)

**Mobile pattern score: 7/10**

**Strengths:**
- Section wrapper uses responsive padding: `px-6 sm:px-8` with `max-w-[1200px]` container
- Hero section has responsive padding: `pb-14 pt-20 sm:pb-16 sm:pt-24 lg:pb-20 lg:pt-28`
- Typography uses responsive Tailwind classes: `text-3xl md:text-4xl lg:text-[3rem]`
- Grid layouts use responsive columns: `lg:grid-cols-[1.08fr_0.58fr]` (single column on mobile)
- Platform Registry grid uses `grid-cols-2` -- stable at 375px
- CTA buttons use `flex-wrap gap-3` -- safe for mobile wrapping

**Risks:**
- Numerous instances of `fontSize: "7px"` and `fontSize: "6.5px"` for eyebrow labels -- physically unreadable on mobile
- `fontSize: "7.5px"` for section caps with `letterSpacing: "0.46em"` -- extreme tracking makes text even harder to read at small sizes
- Bridge component dividers use `fontSize: "7px"` with `letterSpacing: "0.50em"` -- decorative but invisible on small screens
- Platform navigation links in sidebar panel use `fontSize: "7px"` eyebrows -- critical wayfinding elements that are unreadable
- Error boundary fallback uses `fontSize: "8px"` -- too small
- Sidebar panel with `lg:sticky lg:top-28` collapses to stacked layout on mobile -- but no visual separator between main and sidebar content

---

## 3. Common Mobile Killers

### 3A. Horizontal Overflow Patterns
- **559 instances** of `overflow-hidden`, `overflow-x-auto`, or `whitespace-nowrap` across 354 files
- Most are protective (`overflow-hidden` on card containers) -- generally safe
- `overflow-x-auto` on tables is the correct mobile pattern

### 3B. Fixed/Absolute Positioning
- **1,063 instances** across 347 files -- high count
- Many are decorative (gradient blurs, grain overlays, gold rules)
- `components/enhanced/BackToTop.tsx`, `components/FloatingTeaserCTA.tsx` use `fixed` positioning -- standard mobile patterns
- **Risk areas:** `components/shorts/ShortHero.tsx` has 16 absolute/fixed instances -- potential stacking conflicts on small screens

### 3C. Illegibly Small Text
- `text-[7px]` through `text-[11px]` found extensively in:
  - `lib/components/ai/SovereignDashboard.tsx`: 12+ instances of text-[7px] to text-[9px]
  - Eyebrow labels site-wide at 7-8px
  - Form labels in strategy-room/Form.tsx at 7px
  - Admin dashboards (acceptable -- not public-facing)
- **Critical finding:** The design system's "institutional" typography uses extreme small sizes (7-8px) as a brand signature. On mobile at 375px, text below 10px is functionally invisible. This is the single largest mobile UX risk.

### 3D. Hardcoded Widths
- `min-w-[1200px]` on `components/admin/decision/SignalRegistryTable.tsx` -- admin only, acceptable
- `min-w-[980px]`, `min-w-[1100px]`, `min-w-[800px]` on admin tables -- admin only
- `max-w-[1800px]` on OGR live terminal -- wrapped in `overflow-hidden`
- `max-w-[1600px]` on admin pages -- fine with container pattern
- **Public-facing risk:** LOW -- no public components use inflexible min-widths

### 3E. Low-Contrast Text
- Extensive use of `text-white/20`, `text-white/25`, `text-white/30`, `text-white/35`, `text-white/40` -- all below WCAG AA contrast ratio on dark backgrounds
- `color: "rgba(255,255,255,0.22)"` used for labels on the Fast Diagnostic and Strategy Room -- fails AA contrast
- `color: "rgba(255,255,255,0.15)"` for disabled button text -- acceptable for disabled states
- `color: "rgba(255,255,255,0.45)"` used for body text on diagnostic pages -- fails AA (4.5:1 requirement) against near-black backgrounds
- **This is a WCAG violation** in multiple public-facing journeys

---

## 4. Accessibility Audit

### 4A. ARIA Usage
- **243 instances** of `aria-*` or `role=` across 102 component files
- Coverage is moderate for a codebase of this size -- major interactive components have ARIA, but many custom interactive elements lack it

### 4B. Image Alt Text
- **74 instances** of `alt=` across 64 component files
- Reasonable coverage -- most image components include alt text

### 4C. Focus States
- **107 instances** of `focus:` Tailwind utilities across 57 component files
- Present on primary UI elements (buttons, inputs, navigation)
- Missing from many inline-styled interactive elements (strategy room form fields use onFocus/onBlur for visual styling but no focus ring)

### 4D. Skip Links
- **Present:** `components/SiteLayout.tsx` includes a proper skip-to-content link:
  ```tsx
  <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
    Skip to main content
  </a>
  ```
- Implementation is correct with `sr-only` + `focus:not-sr-only` pattern
- Target ID `main-content` is configurable

### 4E. Keyboard Navigation
- **25 instances** of `tabIndex` or `onKeyDown` across 18 component files
- Low coverage relative to the number of interactive elements
- CheckoutButton has Enter key handling on email input
- SearchPalette and command palette have keyboard handlers
- Many card-based link interactions rely on wrapper `<Link>` elements -- acceptable
- **Gap:** Sliders in strategy-room/Form.tsx rely on native range inputs (keyboard accessible by default)

### 4F. Motion Preferences
- No `prefers-reduced-motion` media query or Framer Motion `useReducedMotion` hook detected
- Site uses extensive Framer Motion animations (whileInView, viewport triggers)
- **WCAG 2.1 AA violation:** Users who prefer reduced motion have no way to disable animations

---

## 5. Critical Journey Scores

| Journey | Score /10 | Key Risk | Evidence |
|---|---|---|---|
| Fast Diagnostic | 7 | Sub-10px label text unreadable at 375px; continue button not full-width on mobile | `fontSize: "7px"` step indicator, `fontSize: "8px"` disclaimer, right-aligned CTA |
| Strategy Room | 5 | Gate links untappable (7px text, 30px tap targets); form inputs below 44px touch minimum | `fontSize: "7px"` navigation, `padding: "8px 18px"` CTA, `padding: "11px 13px"` inputs |
| Checkout Flow | 6 | Email input height ~34px below touch minimum; no mobile keyboard hints | `padding: "8px 12px"` input, missing `inputMode="email"` and `autocomplete` |
| Homepage | 7 | Decorative micro-text (6.5-7.5px) is invisible on mobile; sidebar panel lacks mobile separation | `fontSize: "6.5px"` labels, `fontSize: "7px"` with 0.46em tracking |
| Diagnostics Index | 6 | Hub page likely inherits sub-10px eyebrow pattern from shared components | Site-wide eyebrow pattern at 7-8px |

---

## 6. Priority Findings

### P0 -- Must Fix Before Launch

1. **Sub-10px text on public pages.** The institutional micro-text pattern (7-8px eyebrows, 6.5px labels) is the brand signature, but on mobile it is physically unreadable. Set a mobile floor of 10px for any text that carries meaning. Decorative-only labels can remain if they have `aria-hidden="true"`.

2. **WCAG contrast failures.** `text-white/20` through `text-white/40` on dark backgrounds fails AA ratio. Body text at `rgba(255,255,255,0.45)` on rgb(3,3,5) achieves approximately 2.4:1 -- needs 4.5:1. Raise minimum opacity to `/60` for body text, `/50` for large headings.

3. **Touch targets below 44px.** Strategy Room gate CTA (30px), form inputs (38px), checkout email input (34px). Add `min-h-[44px]` to all interactive elements on public pages.

### P1 -- Should Fix

4. **No `prefers-reduced-motion` support.** Add `useReducedMotion` from Framer Motion and conditionally disable whileInView animations. WCAG 2.1 criterion 2.3.3.

5. **Strategy Room mobile layout.** The 2250-line page has no mobile-specific layout adjustments. The gate, form, and execution chamber all render the same layout at 375px as at 1440px. Add `sm:` / `md:` responsive adjustments to padding, text sizes, and CTA widths.

6. **Checkout email input.** Add `inputMode="email"` and `autoComplete="email"` to trigger the correct mobile keyboard and autofill.

### P2 -- Polish

7. **Homepage sidebar panel.** On mobile, the platform registry sidebar stacks below main content with no visual separator. Add a divider or distinct background.

8. **Fast Diagnostic continue button.** Make full-width on mobile (`w-full sm:w-auto`) for easier thumb reach.

9. **Keyboard navigation gaps.** Add visible focus rings to inline-styled form elements in strategy-room/Form.tsx (currently uses JS onFocus for border color change but no focus ring).

---

## 7. Architecture Notes

- The codebase uses a dual layout system: `components/Layout.tsx` (pages router) and `components/SiteLayout.tsx` (more feature-rich). SiteLayout includes skip links and configurable viewport; Layout does not appear to have skip links.
- Heavy reliance on inline styles (`style={{ ... }}`) in critical journey pages means Tailwind responsive utilities are not available for those elements. Refactoring inline-styled text sizes to Tailwind classes would enable `sm:text-[10px]` overrides.
- The `text-4xs` (0.5rem/8px) and `text-3xs` (0.625rem/10px) custom size tokens in Tailwind config are the closest the design system gets to mobile-minimum sizes. `text-4xs` should not be used for meaningful content on mobile.
- Container padding defaults (1.25rem = 20px on mobile) provide adequate mobile margins throughout.

---

**Overall Mobile Readiness: 6.2/10**

The responsive grid framework is solid -- layouts collapse correctly, containers are properly constrained, and padding scales well. The fundamental architecture supports mobile. The critical gaps are all in the micro-typography layer (7-8px text, low-opacity colors) and touch-target sizing. These are fixable with a focused pass through shared component styles without restructuring layouts.
