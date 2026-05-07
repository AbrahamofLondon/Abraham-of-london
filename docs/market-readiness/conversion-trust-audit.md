# Conversion and Trust Layer Audit

**Date:** 2026-05-07
**Scope:** All user-facing conversion points across the Abraham of London platform
**Method:** Source-level review of each conversion component, evaluated from the user's perspective

---

## Known Factual Error: Evidence Page

**File:** `pages/evidence/index.tsx`

**Discrepancy:** The hero section badge at **line 124** reads `5 outcome-verified cases`, but the `EVIDENCE` array defined at **lines 29-51** contains only **3 items**:

1. `tariff-shock-growth-break` (line 31)
2. `team-alignment-illusion` (line 38)
3. `escalation-denied-case` (line 45)

The user sees "5 outcome-verified cases" as an authority signal in the hero, but only 3 cards render in the evidence grid below. This is a credibility-damaging mismatch on a page whose entire purpose is proving trustworthiness.

**Recommendation:** Change line 124 to read `3 outcome-verified cases` to match the actual EVIDENCE array length. Alternatively, if 5 cases exist elsewhere (e.g. in the `content/evidence/` directory which has additional `.mdx` files), add the missing 2 cases to the EVIDENCE array.

---

## Conversion Point Audit

### 1. Email Capture (ResultEmailCapture)

**File:** `components/diagnostics/ResultEmailCapture.tsx`

**What the user sees:**
- Title: "Save this reading" (not "Sign up" or "Subscribe")
- Value line: "This is not a one-time insight. It becomes more accurate as your decisions evolve."
- A lock icon beside the email input field
- A clear "Save and continue" button
- A focus-triggered helper: "This allows you to track whether this improves -- or repeats."
- Trust disclosure always visible (lines 136-139): "We store your responses to track your decision pattern over time. We do not sell or share your data. You can remove your data at any time."
- "Continue without saving" skip link always available (lines 147-161)

**Placement:** Post-result only. The component comment block (lines 3-13) explicitly states it is placed AFTER result impact, never before. The diagnostic results page must show the user their reading before this component appears.

**Trust level: 9/10**

This is one of the strongest email capture implementations reviewed. It respects user autonomy (skip always available), shows value before asking, uses non-coercive language, and has visible privacy disclosure. The only minor gap is the absence of a link to the full privacy policy from within the component itself.

**Improvement:** Add a small link to `/privacy` after the trust disclosure text.

---

### 2. Checkout / Payment (Strategy Room)

**Files:**
- `pages/api/billing/checkout.ts` (canonical checkout API)
- `components/strategy-room/StrategyRoomConversionBridge.tsx` (checkout UI)
- `app/api/checkout/route.ts` (secondary checkout route, redirects to canonical in production)

**What the user sees (StrategyRoomConversionBridge):**
- Section title: "Action layer"
- Clear comparison grid: "Diagnostics stops at position" vs "Strategy Room executes"
- A "If you stop here" block explaining what happens without payment
- An "Intervention fragment" preview showing a sample of what the execution environment delivers
- Two pricing tiers displayed as selectable cards with price in GBP and description
- "One-time execution entry - No subscription" reassurance (line 211)
- Email input before checkout
- Single checkout button: "Enter execution environment"
- Checkout cancellation feedback: "Entry cancelled. No payment was taken. The decision remains unresolved."

**Trust signals present:**
- Clear pricing (displayed in pounds with tier descriptions)
- "No subscription" explicit statement
- Cancellation feedback is honest and non-manipulative
- The checkout routes through Stripe (pages/api/billing/checkout.ts creates a Stripe Checkout Session)

**Trust signals missing:**
- No Stripe badge or "Powered by Stripe" visible in the UI
- No refund policy statement near the payment CTA
- No security iconography (lock icon, SSL mention) near the email/payment area
- No explicit mention of what currency (only implied by the pound sign)

**Trust level: 6/10**

The value proposition is well-articulated (the comparison grid is effective), but the payment moment itself lacks the standard trust markers that reduce checkout anxiety. Users buying a high-value professional service expect to see explicit security signals.

**Improvements needed:**
1. Add a "Secured by Stripe" badge or text near the checkout button
2. Add a brief refund/cancellation policy statement (e.g. "Full refund within 48 hours if not satisfied")
3. Add a lock icon next to "Enter execution environment" button
4. Consider showing "GBP" explicitly next to the price

---

### 3. Strategy Room Entry (Post-Payment)

**Files:**
- `pages/strategy-room/index.tsx` (lines 2204-2250, getServerSideProps)
- `app/strategy-room/success/page.tsx` (success page)

**Flow after payment:**
1. Stripe redirects to `/strategy-room?checkout=success&session_id={ID}`
2. Server-side: `verifyCheckoutSessionForProduct` validates the Stripe session
3. A commercial access cookie is set for immediate session smoothing
4. The entitlement is resolved and `hasPaidAccess` is set to `true`
5. The page renders the intake form / execution surface instead of the payment gate

**What the user sees on success page (`/strategy-room/success`):**
- Loading state: "Decrypting_Strategic_Output..."
- A readiness score displayed prominently
- Market context/volatility status
- Action grid with "Access Briefings" link and a disabled "Export PDF" button ("Coming_Soon.exe")
- "Recalibrate_Assessment" return link

**Trust level: 7/10**

The transition from payment to product is technically smooth (cookie-based immediate access). The user lands directly on the execution surface after paying. However, the success page has several UX issues:

**Improvements needed:**
1. The "Coming_Soon.exe" label on the disabled Export PDF button feels unprofessional for a premium product -- either remove it or show a more dignified "Available soon" message
2. The loading text "Decrypting_Strategic_Output..." and "Dossier_Not_Found" use a hacker aesthetic that may clash with the institutional authority tone of the rest of the platform
3. No confirmation email acknowledgment visible on-screen (user should see "A receipt has been sent to your email")
4. The path from payment to the actual session (`/strategy-room/session/[id]`) requires the user to fill out the intake form first -- this is correct but could benefit from a brief "Your execution environment is being prepared" transition message

---

### 4. Inner Circle Registration

**File:** `pages/inner-circle/index.tsx`

**What the user sees:**
- Header: "Identity Verification Protocol" badge
- Title: "The Inner Circle."
- Subtitle: "Entry to the Sovereign Intelligence Portfolio is restricted. Authorized stakeholders must authenticate via cryptographic key."
- Two-panel layout:
  - Left: "Clearance -- Formal Registration" with name and email fields, "Issue Access Request" button
  - Right: "Secure Entry -- Authentication Required" with cryptographic key input, "Authenticate Key" button
- Bottom section: "The Strategic Dispatch" newsletter signup with "Direct Signal - Zero Proliferation" tagline

**Value proposition clarity:**
The page communicates exclusivity and institutional weight, but it does NOT clearly explain what the Inner Circle provides before asking for registration. The user sees authority language ("Sovereign Intelligence Portfolio", "cryptographic key") but no concrete benefit statement like "Access to intelligence briefs, strategic frameworks, and decision assets."

**Trust level: 5/10**

The page is beautifully designed and the dual-panel (register/unlock) pattern is clear. However:
- The value proposition is abstract rather than concrete -- what do I get?
- "Cryptographic key" language may confuse non-technical users
- The newsletter form at the bottom has no submit handler (line 341: `onSubmit={(e) => e.preventDefault()}`) -- it is non-functional
- No social proof (member count, testimonials, example content)
- The "Institutional Name" placeholder may alienate individual professionals

**Improvements needed:**
1. Add 2-3 concrete bullet points about what Inner Circle members receive (briefs, frameworks, early access, etc.)
2. Fix the newsletter form -- it currently does nothing on submit
3. Replace "Institutional Name" placeholder with "Your name or organisation"
4. Consider adding a brief example of a recent intelligence brief or framework title as social proof

---

### 5. Download Access

**Files:**
- `pages/downloads/index.tsx` (index listing)
- `pages/downloads/[...slug].tsx` (individual download page)

**What the user sees on the index:**
- "Asset Vault" heading
- Cards grouped by category, each showing: access level badge (Available / Inner Circle / Restricted), title, excerpt, date, category
- "View asset" button on every card
- Public assets also show an "Access" direct download button
- Restricted assets show "Inner Circle" or "Unlock required" badge

**What the user sees on a download detail page:**
- Category label, title, subtitle, value description
- Access state bar showing: availability level, pricing (for paid), and appropriate CTA
- Public: direct download link via `/api/downloads/resolve/[slug]`
- Inner Circle: "Unlock with Inner Circle access" linking to `/inner-circle`
- Paid: "Unlock this resource -- [price]" linking to `/access?asset=[slug]`
- Paid assets also show: pricing justification text, "Also available through Inner Circle access" alternative path
- Content body (public) or `ClientUnlockRenderer` (gated)

**Trust level: 7/10**

The download flow is well-structured with clear access tiers and honest labeling. The "Also available through Inner Circle access" upsell on paid assets is a good trust signal (gives the user options). However:

**Improvements needed:**
1. The `/access?asset=[slug]` checkout path for paid downloads is unclear -- the user goes to a generic "access" page rather than a dedicated purchase flow for that specific asset
2. No preview/sample content visible for paid or restricted downloads -- users buy blind
3. No file format or size information shown (users want to know if they are getting a PDF, a spreadsheet, etc.)
4. No download count or popularity signal

---

### 6. Return Brief CTA

**Files:**
- `components/strategy-room/ReturnBriefInterruptionBar.tsx` (notification bar)
- `app/briefing/return/[sessionId]/page.tsx` (full return brief page)

**How the user is invited back:**
- The `ReturnBriefInterruptionBar` appears as a full-width bar at the top of Strategy Room pages
- It checks for an available return brief via API and shows:
  - Normal: "A new briefing has been generated based on your execution." with "View now" link
  - Critical (deteriorating trajectory): "Execution has deteriorated since your last session." with "Review now" link in red tones
- Links to `/briefing/return/[sessionId]`

**What the return brief page shows:**
- Opening statement (personalized)
- Trajectory snapshot (DETERIORATING / FRAGILE / improving) with color coding
- Contradiction re-exposure: reminds the user of their previous commitment and the unresolved constraint
- Outcome evidence from similar cases
- Personal delta (clarity, authority, readiness changes since last session)
- Direct challenge statement
- Full-width CTA: "Return to Strategy Room"
- If retainer triggered: a "Decision Integrity Programme" upsell at 25,000+ GBP with "Request programme access" link

**Trust level: 8/10**

This is an excellent re-engagement mechanism. It is data-driven (not generic), creates accountability (re-exposing contradictions), and escalates appropriately (critical vs normal tone). The retainer upsell is well-placed -- it only appears when the pattern is persistent, not as a blanket pitch.

**Improvements needed:**
1. The return brief is only accessible with a valid `sessionKey` -- if the user loses this (clears cookies, changes device), there is no recovery path visible. Consider adding a "Lost your session?" help link.
2. The retainer price (25,000+ GBP) appears without context on what the programme includes -- add 2-3 bullet points describing the programme scope
3. No email notification mechanism visible in the UI -- the user must revisit the Strategy Room to discover a return brief exists. If email notifications are sent (via the server-side return brief trigger engine), this concern is mitigated but not visible to the user.

---

## Summary Table

| Conversion Point | Trust Score | Key Issue |
|---|---|---|
| Email Capture (ResultEmailCapture) | 9/10 | Near-ideal. Add privacy policy link. |
| Checkout / Payment | 6/10 | Missing Stripe badge, refund policy, security signals |
| Strategy Room Entry | 7/10 | Success page tone inconsistency; no receipt confirmation |
| Inner Circle Registration | 5/10 | No concrete value proposition; broken newsletter form |
| Download Access | 7/10 | No preview content for paid assets; unclear checkout path |
| Return Brief CTA | 8/10 | Session recovery gap; retainer needs scope description |

## Critical Fix Required

**Evidence page factual error** (`pages/evidence/index.tsx`, line 124): "5 outcome-verified cases" must be corrected to "3 outcome-verified cases" to match the EVIDENCE array (3 items, lines 29-51). This is a credibility risk on a trust-building page.

## Priority Actions

1. **Fix evidence page count** -- immediate (factual error erodes trust)
2. **Add Stripe badge and refund policy to checkout** -- high priority (directly impacts conversion)
3. **Add concrete value proposition to Inner Circle page** -- high priority (users register without knowing what they get)
4. **Fix non-functional newsletter form on Inner Circle page** -- medium priority (broken functionality)
5. **Clean up Strategy Room success page tone** -- medium priority (premium product deserves premium UX)
6. **Add preview content for paid downloads** -- lower priority (reduces purchase friction)
