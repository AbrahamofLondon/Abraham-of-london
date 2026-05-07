# Premium Experience Audit

**Phase E — Institutional Stabilization**
**Date:** 2026-05-07
**Scope:** End-to-end premium experience coherence for GBP 295 – GBP 1,250 products

---

## 1. Pre-Payment: Value Communication

### 1.1 Executive Reporting Flagship Component

**File:** `components/homepage/ExecutiveReportingFlagship.tsx`

This is the primary value communication surface for the Executive Reporting product (GBP 295).

**What it does well:**
- Shows all 10 report output fields with descriptions (Headline, Constitutional route, Seriousness level, Governance risk, Top 3 pressure points, Domain breakdown, Decision options, Correction priorities, Escalation recommendation, 7/30/90 sequence)
- Clearly states the system position: "Diagnostics surfaces the signal. Executive Reporting interprets it precisely. Strategy Room intervenes when the report reveals material consequence."
- Identifies buyer fit: founders/leadership teams, boards/senior operators, institutions under exposure
- Labels the product as "Flagship bridge product" with role/output/bias metrics
- Two CTAs: "Open Executive Reporting" (primary gold) and "Begin diagnostics" (secondary)
- Optionally surfaces the latest quarterly report with PDF download

**What is missing:**
- No price shown on this component itself
- No timeline (how long does it take?)
- No sample report or redacted example
- No comparison to alternatives (consulting firms, internal analysis)
- The 12-field claim in marketing copy vs 10-field REPORT_FIELDS array is inconsistent

**Premium coherence score: 8/10**
Strong institutional design. The product specification approach (showing output fields) is unusual and effective. The lack of pricing and timeline prevents conversion optimization.

### 1.2 Strategy Room Page

**File:** `pages/strategy-room/index.tsx`

The Strategy Room page uses `StrategyRoomConversionBridge` (`components/strategy-room/StrategyRoomConversionBridge.tsx`) to present two tiers:
- Entry: GBP 750 — "One controlled execution environment for the active decision"
- Active / Multi-decision: GBP 1,250 — "Execution sequencing across multiple linked decisions"

The bridge component includes:
- Dynamic escalation tone based on diagnostic signals
- Email capture before checkout
- Checkout cancellation recovery messaging
- Analytics tracking (bridge viewed, bridge abandoned)

**What is missing:**
- No concrete deliverable list (what do you get for GBP 750?)
- No timeline or session structure description
- No example of past outcomes
- No comparison anchoring (e.g., "equivalent to X hours of consulting at Y rate")

**Premium coherence score: 6/10**
The two-tier presentation is clean, but a GBP 750 purchase decision needs more justification than a one-sentence description.

### 1.3 Diagnostic Results and Escalation

**File:** `components/diagnostics/results/ExecutiveDecisionAuthorityBlock.tsx`

The diagnostic results surface shows:
- Decision Authority band (strong/strained/weak/critical)
- Cost of Inaction with 30/60/90-day horizons
- Execution failure mode prediction
- Governance move recommendation

This is genuinely impressive — it creates urgency through data rather than pressure language.

**Premium coherence score: 9/10**
The diagnostic-to-escalation bridge is the strongest premium signal in the entire system.

---

## 2. Payment Moment

### 2.1 CheckoutButton Component

**File:** `components/commercial/CheckoutButton.tsx`

**What it does:**
- Accepts `productCode`, `email`, and `originPath` props
- Shows email input if none provided (appears on demand)
- POSTs to `/api/billing/checkout`
- Redirects to Stripe checkout URL on success
- Error handling for: email required, pricing resolution failure, product inactive, network error

**What it does NOT do:**
- No Stripe logo or "Powered by Stripe" indicator
- No padlock icon or "Secure payment" text
- No price confirmation visible at the button moment
- No refund policy link
- No deliverable summary ("You are purchasing: X")
- No trust badge of any kind
- Button text while loading: "Preparing checkout..." — functional but unpolished

**The button is purely functional.** It does the job of starting a Stripe session. It provides zero premium experience or trust reinforcement at the most critical conversion moment.

### 2.2 Checkout API

**File:** `pages/api/billing/checkout.ts`

The backend is well-built:
- Reads from a single-source-of-truth catalog (`lib/commercial/catalog.ts`)
- Resolves product identity from multiple input formats
- Applies a Do-Not-Sell gate (blocks checkout if diagnostic prerequisites unmet)
- Validates eligibility before creating a Stripe session
- Attaches comprehensive metadata (productCode, tier, email, contractId, organisationId)
- HubSpot sync on checkout (fire and forget)
- Stripe session mode: `payment` for one-time, `subscription` for recurring

**Assessment:** Backend is production-grade and well-governed. The quality gap is entirely on the frontend trust layer.

### 2.3 Checkout Cancellation

The `StrategyRoomConversionBridge` handles checkout cancellation with:

```
"Entry cancelled. No payment was taken. The decision remains unresolved."
```

This is problematic. "The decision remains unresolved" is not a neutral cancellation message — it is a pressure statement. An executive who cancelled checkout because of a scheduling issue or a need to consult a colleague should see reassurance, not admonishment.

**Payment moment premium coherence score: 3/10**
The backend is excellent. The frontend trust experience at the payment moment is the weakest link in the entire platform.

---

## 3. Post-Payment: Immediate Experience

### 3.1 Strategy Room Success Page

**File:** `app/strategy-room/success/page.tsx`

This is what an executive paying GBP 750 – GBP 1,250 sees immediately after payment.

**What they see:**
1. Loading state: "Decrypting_Strategic_Output..." with a spinner
2. If data loads: a "Strategy_Dossier_#[ID]" page showing:
   - Principal Identity (their name)
   - Operational Readiness Index (percentage score with gauge bar)
   - Volatility status
   - Risk classification (high/stable)
   - Two action buttons:
     - "Access Briefings" — links to `/vault/briefs` — active and clickable
     - **"Export PDF — Coming_Soon.exe"** — DISABLED, greyed out, opacity 40%, cursor not-allowed
3. A "Recalibrate_Assessment" link back to the strategy room

**Critical finding: "Coming_Soon.exe"**

Line 159 of the file:
```tsx
<span className="text-zinc-600 text-[9px] uppercase">Coming_Soon.exe</span>
```

An executive who just paid GBP 1,250 for a "Strategy Room — Active / Multi-Decision" engagement sees a disabled button labeled with a joke Windows executable filename. This is:
- Unprofessional for the price point
- A broken promise (the marketing implies a report PDF is part of the output)
- A trust violation at the most emotionally sensitive moment (immediately after payment)
- Aesthetically jarring — `.exe` is associated with malware, not premium consulting

**What is missing from the success page:**
- No confirmation of what was purchased and for how much
- No receipt or invoice reference
- No "what happens next" timeline
- No human contact information for questions
- No PDF export (the only tangible deliverable is disabled)
- No calendar booking for a session
- The "Access Briefings" link goes to `/vault/briefs` — is the user entitled? Is this the right next step?

**Post-payment premium coherence score: 3/10**
The page has strong visual design but fails fundamentally at post-purchase reassurance. The "Coming_Soon.exe" label is the single most damaging trust element on the platform.

### 3.2 Assessment Success Page

**File:** `app/assessment/success/page.tsx`

For comparison, the free assessment success page is substantially better:
- Shows "Commitment Verified" with a shield icon
- Displays the alignment resonance score prominently
- Clean, confident "The Registry is Updated" messaging
- Dashboard CTA is active
- PDF export is also disabled here, but without the `.exe` joke

**Assessment success premium coherence score: 6/10**

---

## 4. Delivery: Strategy Room Session Quality

### 4.1 Strategy Room Intake

**File:** `components/consulting/StrategyRoomIntake.tsx`

The intake form collects 14 structured fields:
- Name, email, organisation, sector
- Revenue band (Under GBP 1M to GBP 250M+, or Classified)
- Authority role and scope (final/shared/recommend/observer)
- Urgency window
- Market exposure
- Problem statement, observed symptoms, desired outcome, current constraint
- Board involvement

After submission, the system runs a constitutional evaluation (STRATEGY / DIAGNOSTIC / REJECT routing) with a multi-phase animation: reading → parsing → weighing → complete.

**Assessment:** This is genuinely world-class intake design. The structured fields force clarity. The constitutional routing is transparent and non-arbitrary. The "Submitting does not guarantee admission. It guarantees a serious reading." disclaimer is honest and premium.

**Intake quality score: 9/10**

### 4.2 Constitutional Follow-up Panel

**File:** `components/strategy-room/ConstitutionalFollowupPanel.tsx`

Routes to three paths (STRATEGY, DIAGNOSTIC, REJECT) with clear rationale, intervention deployment, and escalation options. Well-structured with action states and loading indicators.

**Delivery score: 9/10** (confirms previous audit rating)

### 4.3 Report / Brief Quality

The report output structure (10 fields per ExecutiveReportingFlagship) is well-defined. The briefing PDF template exists (`components/admin/reporting/briefing-pdf-template.tsx`). However, the client-facing PDF export is disabled, so the actual delivery quality of the tangible artifact cannot be fully assessed.

**Report delivery score: 7/10** (would be 9/10 if PDF export worked)

---

## 5. Follow-up: Re-engagement

### 5.1 Retainer Entry Gate

**File:** `components/strategy-room/RetainerEntryGate.tsx`

Appears conditionally when:
- Contradiction persists
- Recurrence detected
- Multi-stakeholder divergence present

Messaging:
- "This is not a one-off condition."
- "Without sustained enforcement, this does not resolve."
- "Delay does not preserve the current state. It degrades it."
- CTA: "Activate ongoing enforcement" → links to `/consulting?retainer=qualified`

**Assessment:** The qualification logic is smart — it only appears when genuinely warranted. The messaging is fear-based but not dishonest. However, it lacks:
- Pricing for the retainer
- Scope of retainer engagement
- Comparison to one-off re-entry
- Any reassurance or positive framing

**Follow-up premium coherence score: 5/10**

### 5.2 Nudge Emails

**File:** `lib/mail/templates/nudge-email.tsx`

Professional institutional design (warm white background, serif typography, gold accents). Used for audit campaign follow-ups. The email continuity system is described in the privacy policy with appropriate legal framing.

**Email quality score: 7/10**

### 5.3 Re-engagement Gaps

Missing:
- No post-delivery satisfaction check
- No "30-day check-in" or follow-up on 7/30/90 action plan
- No community or peer network access
- No referral mechanism
- No NPS or feedback collection
- No case closure confirmation

---

## 6. Touchpoint Scorecard

| Touchpoint | Score | Key Issue |
|------------|-------|-----------|
| Pre-payment: Executive Reporting value communication | 8/10 | No price/timeline on component |
| Pre-payment: Strategy Room value communication | 6/10 | Deliverable description too thin for GBP 750+ |
| Pre-payment: Diagnostic results escalation | 9/10 | Strongest conversion surface |
| Payment moment: CheckoutButton | 3/10 | Zero trust indicators |
| Payment moment: Cancellation handling | 2/10 | Manipulative copy |
| Post-payment: Strategy Room success | 3/10 | "Coming_Soon.exe" — worst single element |
| Post-payment: Assessment success | 6/10 | Functional but PDF disabled |
| Delivery: Strategy Room intake | 9/10 | World-class structured intake |
| Delivery: Constitutional routing | 9/10 | Transparent, non-arbitrary |
| Delivery: Report/brief quality | 7/10 | PDF export disabled |
| Follow-up: Retainer gate | 5/10 | Fear-based, no pricing |
| Follow-up: Email continuity | 7/10 | Professional but limited scope |
| Follow-up: Re-engagement | 2/10 | Near-total absence |

**Weighted average: 5.8/10**
**Unweighted average: 5.8/10**

---

## 7. Critical Path to Premium Coherence

### Immediate (before next paid engagement)

1. **Replace "Coming_Soon.exe"** with either:
   - A working PDF export, OR
   - A clear message: "Your report will be delivered to [email] within [X] business days" with a support contact
2. **Add trust indicators to CheckoutButton**: Stripe logo, "Secure payment by Stripe", and a link to refund/cancellation terms
3. **Rewrite checkout cancellation message**: "No payment was taken. You can return at any time." — neutral, professional, no pressure

### Within 2 weeks

4. **Create a deliverable specification** for Strategy Room (what exactly is included at each tier)
5. **Add a post-payment confirmation panel** with: purchase summary, receipt link, next steps timeline, human contact option
6. **Create a 7/30/90 follow-up email sequence** that mirrors the report's action plan

### Within 1 month

7. **Implement PDF export** for Strategy Room and Assessment success pages
8. **Add a post-engagement satisfaction survey** and feedback mechanism
9. **Reframe RetainerEntryGate messaging** to include positive framing alongside urgency
10. **Build a referral or case closure flow** for completed engagements

---

## 8. Architecture Note

The platform has an unusual and potentially powerful architecture: the pre-payment and delivery layers are both strong (8-9/10), but the payment moment and post-payment experience are weak (2-3/10). This creates a "valley of distrust" at exactly the wrong point in the buyer journey.

The fix is not a redesign — it is filling in the trust gap at the transaction boundary. The product quality is already there. The buyer just cannot see it at the moment they need to most.
