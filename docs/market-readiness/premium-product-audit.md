# Premium Product Audit — Abraham of London

**Standard:** "Would a £5k–£50k/month executive client subconsciously trust this?"

**Audit date:** 2026-05-07
**Auditor:** Claude Opus 4.6 (1M context)
**Surfaces audited:** 6 premium revenue surfaces
**Price range:** £29–£1,250 (single products), £25,000+ (retainer programme)

---

## 1. Executive Reporting (£295)

**File:** `pages/diagnostics/executive-reporting/run.tsx` (2,320 lines)

### Before Payment

Executive Reporting is accessed at `/diagnostics/executive-reporting/run`. Access enforcement is handled server-side via `enforceExecutiveReportingAccess` and canonical entitlement checks. The paywall is managed through the `StrategyRoomConversionBridge` component, which displays a price-framed CTA. The user sees the intake form directly — there is no dedicated pre-payment landing page that sells what the report contains.

**Problem:** There is no "sales page" for Executive Reporting. The route is `/diagnostics/executive-reporting/run` — the word "run" in the URL signals execution, not purchase consideration. The user either has access or does not; there is no preview, sample output, or example report section.

### After Payment

The post-payment experience is substantial:
- Full structured intake form (21+ fields covering identity, authority scope, revenue band, decision window, constraints, evidence quality)
- AI-generated report with: executive summary, constitutional posture, strategic domain analysis, financial exposure quantification, observed outcome evidence, governed recommendations, matched assets
- Trajectory projection, engagement readiness, multi-stakeholder divergence analysis
- Longitudinal intelligence and ladder progression gates
- Claim governance (benchmark, predictive, team evidence tiers)
- PDF export capability via boardroom PDF endpoint

### Scoring

| Criterion | Score /10 | Notes |
|-----------|-----------|-------|
| Purpose clarity | 5 | No dedicated product page. Entry is through a "run" URL. |
| Value perception before purchase | 3 | No sample output, no "here is what your report will contain." |
| Premium feel | 8 | Post-payment result page has serious institutional depth — Cormorant Garamond, gold accents, dark palette, evidence-backed claims. |
| Worth £295? | 7 | The deliverable is genuinely deep. The problem is that nobody can see this before paying. |

---

## 2. Strategy Room (£750 Entry / £1,250 Extended)

**Files:** `pages/strategy-room/index.tsx` (2,250 lines), `pages/strategy-room/session/[id].tsx` (747 lines)

### Pre-Payment Gate (State 1: `!hasPaidAccess`)

Copy is deliberate and high-stakes:

> "The analysis is over. Now you either act or drift."
> "This locks the decision, assigns ownership, and tracks whether it actually happens. If you are not ready to act, do not enter."

Three capability labels: "Decision sequencing", "Constraint removal", "Execution verification."

There is a qualification flow (`ExecutionFlow`) before the checkout button appears. This is excellent — it forces the user to name their decision, blocker, and consequence before paying. It acts as a filter and commitment device.

Price framing is strong:
> "One delayed escalation vs £750"
> "This is not the cost of the system. This is the cost of forcing the decision."

Disqualification copy:
> "If this decision is not already costing you something measurable — do not enter."

The conversion bridge offers two tiers: Entry (£750) and Active/Multi-Decision (£1,250).

### "Coming_Soon.exe" Hacker Aesthetic — CONFIRMED

**File:** `app/strategy-room/success/page.tsx`

This is a **separate legacy success page** with an entirely different design language. Evidence:

- Loading state: `"Decrypting_Strategic_Output..."`
- Error state: `"Dossier_Not_Found"`
- Title: `Strategy_Dossier_#{id}`
- UI: `rounded-3xl`, gradient cards, `bg-gradient-to-br from-zinc-900 to-black`, motion animations
- "Operational_Readiness_Index" with percentage gauge
- CTA: `"Recalibrate_Assessment"` with underscore naming
- **The literal `Coming_Soon.exe` string** on a disabled PDF export button (line 159)
- "Principal Identity" label, "Market Context" with "UNKNOWN" fallback
- Score commentary: "CRITICAL: Structural dependencies and market friction exceed safety margins. Sovereignty pivot recommended."

**Verdict:** This page is from an older iteration of the product. It uses an entirely different design system (Tailwind utility classes, rounded corners, gradient cards) versus the rest of the Strategy Room (inline styles, sharp panels, Cormorant Garamond + JetBrains Mono). The hacker-aesthetic copy ("Decrypting_Strategic_Output", "Coming_Soon.exe", "Sovereignty pivot recommended") is completely incongruent with the institutional tone of the actual Strategy Room.

**This page must be killed or completely rewritten.** An executive who pays £750–£1,250 and lands on a page that says "Coming_Soon.exe" on a disabled button would immediately question the legitimacy of the service.

### Post-Payment Session Experience

The session page (`session/[id].tsx`) is excellent:
- Dark background (rgb(2 2 3)), tighter spacing, minimal explanation
- JetBrains Mono data + Cormorant Garamond headings (weight 300)
- Structured sections: Entry State, Evidence Case, Decision Frame, Intervention Stack, Constraint Map, Decision Log, Session Control
- Decision log with "pending/executed/blocked" status tracking
- Session status management (active/completed/monitoring/escalated)
- Return Brief interruption bar for ongoing engagement
- Intervention steps with urgency levels, dependencies, intent/effect/risk columns

### Scoring

| Criterion | Score /10 | Notes |
|-----------|-----------|-------|
| Purpose clarity | 8 | Pre-payment gate is very clear about what this is and who it is for. |
| Value perception | 7 | Qualification flow forces commitment. Cost framing is strong. |
| Premium feel (gate) | 8 | Institutional Monumentalism executed well. |
| Premium feel (session) | 9 | Board-level instrument feel. No decoration. Pure structure. |
| Premium feel (success page) | 2 | `Coming_Soon.exe`. Gradient cards. Rounded corners. Hacker copy. |
| Worth £750–£1,250? | 7 | The session experience justifies the price. The success page undermines it. |
| SLA / deliverable description | 4 | No formal SLA. No "you will receive X within Y." No outcome guarantee. |

---

## 3. Decision Instruments (£29–£129)

**Files:** `pages/decision-instruments/index.tsx`, `pages/decision-instruments/[slug].tsx`, instrument start/run pages

### Product Pages

The index page is well-structured:
- Three instruments: Decision Exposure (£29), Mandate Clarity (£49), Intervention Path (£79)
- Operator Decision Pack bundle (£129) — all three in one pass
- Each card shows: outcome, title, price, "used when" condition, time estimate
- Positioning strip: "Not advice → Structured decision instruments", "Not analysis → Immediate use", "Not content → Outputs that force action"

Individual instrument pages (`[slug].tsx`) contain extensive product copy:
- Headline, subline, when to use (4 conditions), what it produces (5 items), what changes, where it fits in the system
- Consequence if skipped (3 items)
- Transition state: routes to Executive Reporting after completion
- Guided checklist and completion prompt

### After Purchase

Start pages (`start.tsx`) are clean and functional:
- "Purchase confirmed" eyebrow
- "Your Decision Exposure Instrument is ready."
- Two CTAs: "Start interactive instrument" and "Download PDF worksheet"

### Scoring

| Criterion | Score /10 | Notes |
|-----------|-----------|-------|
| Purpose clarity | 9 | Very clear what each instrument does and when to use it. |
| Value perception | 8 | Product copy is specific. Outcome promises are concrete. |
| Premium feel | 7 | Consistent with platform design system. |
| Worth the price? | 8 | At £29–£129, these are well-priced and clearly scoped. |
| Post-purchase delivery | 7 | Clean start page. Interactive + PDF dual delivery. |

---

## 4. Checkout Experience

**Files:** `components/commercial/CheckoutButton.tsx`, `pages/api/billing/checkout.ts`

### Flow

1. User clicks CTA
2. If no email provided, inline email input appears
3. POST to `/api/billing/checkout` with product code + email
4. Server resolves product from catalog SSOT, runs do-not-sell gate, checks checkout eligibility
5. Creates Stripe Checkout session with proper metadata
6. Redirects to Stripe hosted checkout
7. On success, redirects to product's `successPath` with `?checkout=success&session_id=...`

### Security Indicators

- **No Stripe badge anywhere.** The `CheckoutButton` component contains zero security or trust indicators.
- **No refund policy visible.** Searched entire codebase — no refund policy on any checkout surface.
- **No security seal.** No SSL badge, no "secure checkout" language, no lock icon near the payment CTA.
- **No "powered by Stripe" mention** on any pre-checkout surface.

### Post-Payment Confirmation

- Strategy Room: Access is granted via cookie + entitlement. User sees "Access granted. Execution environment ready." banner. Transition is smooth.
- Executive Reporting: Similar cookie-based access. Returns to intake form with access.
- Decision Instruments: Redirects to `/decision-instruments/{slug}/start` with a clean "Purchase confirmed" confirmation.

### Scoring

| Criterion | Score /10 | Notes |
|-----------|-----------|-------|
| Security perception | 3 | Zero trust indicators. No Stripe badge, no refund policy, no "secure checkout" text. |
| Clarity of what you are buying | 6 | Product names are in the catalog but not always visible at checkout initiation. |
| Post-payment transition | 7 | Cookie-based access smoothing works. Confirmation banners are present. |
| Refund / guarantee | 0 | No refund policy found anywhere in the codebase. |

---

## 5. Return Brief

**File:** `app/briefing/return/[sessionId]/page.tsx`

### Design

This is the single best-designed premium surface in the entire product. It is styled as a document, not an app screen:

- 680px max-width, generous vertical spacing (96px padding top/bottom, 64px between sections)
- Opening with dynamic contextual title
- Trajectory snapshot (DETERIORATING / FRAGILE / IMPROVING with colour coding)
- Contradiction re-exposure: quotes the user's prior commitment, shows the blocking constraint, states it remains active — "The structure has not changed."
- Outcome evidence from similar cases with confidence level
- Personal delta tracking (clarity, authority, readiness — each colour-coded for direction)
- Direct challenge statement
- Full-width CTA: "Return to Strategy Room"
- Conditional retainer trigger at bottom

### Retainer Trigger in Return Brief

When persistent patterns are detected:
> "This is no longer a single decision issue."
> "The pattern is persistent. Without ongoing enforcement, this will continue to recur."
> "Decision Integrity Programme — £25,000+"
> "Request programme access"

### Scoring

| Criterion | Score /10 | Notes |
|-----------|-----------|-------|
| Premium feel | 9 | Document authority. Clean, left-aligned, generous space. Premium typography. |
| Re-engagement quality | 9 | Makes inaction visible. Quotes prior commitments. Shows trajectory. |
| Worth the overall price? | 9 | This is the strongest retention mechanism. It justifies the Strategy Room price. |
| Delivery format | 8 | Rendered page, not email. Could benefit from PDF export option. |

---

## 6. Retainer Gate

**Files:** `components/strategy-room/RetainerEntryGate.tsx`, `lib/retainer/qualification.ts`

### Design

The retainer gate appears conditionally — only when qualification criteria are met (persistent contradiction, recurrence, multi-stakeholder divergence). This is correct — it feels earned, not marketed.

Copy is fixed and cannot be modified:
> "System directive — ongoing enforcement required"
> "This is not a one-off condition."
> "Without sustained enforcement, this does not resolve."
> "Delay does not preserve the current state. It degrades it."

Evidence block shows qualification reason. CTA: "Activate ongoing enforcement" → `/consulting?retainer=qualified`

### Scoring

| Criterion | Score /10 | Notes |
|-----------|-----------|-------|
| Exclusivity | 8 | Conditional appearance is correct. Not shown to unqualified users. |
| Premium feel | 7 | Consistent with platform design. Severity-based colour coding. |
| Clarity of offer | 5 | No pricing on the gate itself. No description of what "ongoing enforcement" includes. |
| CTA destination | 4 | Links to `/consulting?retainer=qualified` — the consulting page is generic, not a retainer-specific page. |

---

## Summary Scorecard

| Surface | Premium Feel /10 | Worth the Price? | Key Issue | Evidence |
|---------|-----------------|------------------|-----------|----------|
| Executive Reporting (£295) | 6.5 | Probably | No pre-payment evidence of value | No sample report, no preview, no product page — just a "run" URL |
| Strategy Room Gate (£750) | 8 | Yes | Missing SLA/deliverable description | No formal "you will receive X" statement |
| Strategy Room Session | 9 | Yes | None critical | Board-level execution surface done right |
| Strategy Room Success | **2** | **No** | **Hacker aesthetic destroys trust** | `Coming_Soon.exe`, gradient cards, rounded corners, "Decrypting_Strategic_Output" |
| Decision Instruments (£29–£129) | 8 | Yes | Minor | Well-priced, well-described, clear delivery |
| Checkout | 3 | N/A | Zero trust indicators | No Stripe badge, no refund policy, no security language |
| Return Brief | 9 | N/A | Could add PDF export | Best-designed surface in the product |
| Retainer Gate | 6.5 | Unknown | No pricing, no deliverable description, generic CTA destination | Links to consulting page, not retainer-specific page |

---

## The Executive Question

> "If you were an executive paying £1,250, would you feel this was worth it based on what you see?"

**Honest answer: Almost, but not yet.**

**What works:**
1. The Strategy Room gate copy is serious and self-filtering. The qualification flow before payment is a trust signal — it says "we do not want everyone's money."
2. The session execution surface is genuinely board-level. No decoration, no marketing language, pure decision structure.
3. The return brief is the strongest post-delivery mechanism I have audited. It makes inaction visible by quoting prior commitments and tracking trajectory. This alone creates retention pressure.
4. The constitutional posture system, intervention stacking, and evidence graph give the product real intellectual depth.
5. The decision instruments at £29–£129 are correctly priced and well-described. They function as a trust-building entry point.

**What fails the £1,250 test:**
1. **The success page (`app/strategy-room/success/page.tsx`) is a live liability.** An executive paying £1,250 who encounters "Coming_Soon.exe" on a disabled button, "Decrypting_Strategic_Output..." as a loading state, and gradient cards with rounded corners will feel they have been sold something by a startup, not an institution. This page uses an entirely different design system from the rest of the product.
2. **Zero checkout trust indicators.** At £750–£1,250, the absence of a Stripe badge, refund policy, or "secure checkout" language is a conversion killer. Executives who spend at this level expect visible security signals. Their finance teams expect visible security signals.
3. **No refund policy.** At any price point above £100, this is a red flag. At £1,250, it is disqualifying for many buyers — not because they want a refund, but because the absence signals amateur commerce.
4. **No SLA or deliverable specification.** The Strategy Room tells you it "locks the decision, assigns ownership, and tracks whether it actually happens" — but there is no document that says "within 48 hours you will receive X, Y, and Z." Executives buy outcomes, and they buy them on paper.
5. **Executive Reporting has no product page.** The most expensive reporting product (£295) has no preview, no sample output, and no dedicated sales page. The URL path is `/diagnostics/executive-reporting/run` — the word "run" is operational, not commercial.
6. **Retainer gate leads to a generic consulting page.** When the system qualifies someone for a £25,000+ engagement, the CTA should land on a retainer-specific page with programme structure, not the general consulting index.

---

## Priority Fixes (Revenue Impact Order)

### P0 — Kill or Rewrite `app/strategy-room/success/page.tsx`
This is the single highest-risk page on the platform. It contradicts the design system, uses hacker-aesthetic copy, and contains a disabled button with "Coming_Soon.exe". Either delete it and redirect to the session page, or rewrite it to match the platform's Institutional Monumentalism design system.

### P1 — Add checkout trust indicators
At minimum: "Payments processed securely by Stripe" line near CheckoutButton. Add a refund or satisfaction policy. At £750+, consider adding "Stripe Verified" badge or similar.

### P1 — Create a refund/satisfaction policy
Even a simple "If the structured output does not meet the described standard, contact us within 7 days" would suffice. Its absence is more damaging than its presence.

### P2 — Create a dedicated Executive Reporting product page
Before the intake form. Show: what the report contains (section list), a redacted sample, time to delivery, what it costs. Move the URL from `/diagnostics/executive-reporting/run` to something like `/executive-reporting` with a clear CTA to the intake.

### P2 — Add SLA language to Strategy Room
"Your execution session is initiated within [X]. Intervention stack, constraint mapping, and decision log are generated from your structured intake." — something that specifies the deliverable.

### P3 — Create retainer-specific landing page
When `/consulting?retainer=qualified` is hit, the page should show retainer programme structure, not the generic consulting page. Include: programme scope, cadence, deliverables per cycle, £25,000+ starting point.

### P3 — Add PDF export to Return Brief
The return brief is the best premium document. Offer a PDF version — executives share documents with their teams, and a PDF has more authority than a URL.
