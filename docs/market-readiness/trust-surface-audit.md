# Trust Surface Audit

**Phase E — Institutional Stabilization**
**Date:** 2026-05-07
**Current trust score:** 5.8 / 10
**Target trust score:** 8.0 / 10

---

## 1. Trust Signals That Exist

### 1.1 Security / Privacy Language

The platform uses security language extensively but largely as **aesthetic signalling** rather than substantive disclosure:

| Signal | Location | Assessment |
|--------|----------|------------|
| "AES-256-GCM Encrypted" | `components/admin/AdminLayout.tsx` | Admin-only; users never see this |
| "Encrypted Channel" | `components/ContactForm.tsx` | Decorative — no explanation of what is encrypted |
| "AOL-CORE-SECURE" | `components/alignment/OGRCoherenceLock.tsx` | Internal institutional language, not user-facing trust |
| "Secure checkout" | `components/books/PurchaseOptions.tsx` | Single line, no Stripe logo or explanation |
| "Secure download" | `components/DownloadCard.tsx` | Decorative |
| "End-to-End Encrypted Node" | `app/audit/[id]/audit-form.tsx` | Decorative label only |
| "Your information is secure and will not be shared" | `components/downloads/DownloadForm.tsx` | Good — but lone instance |
| Privacy link in footer | `components/EnhancedFooter.tsx` | Present — links to `/privacy` |
| Terms link in footer | `components/EnhancedFooter.tsx` | Present — links to `/terms` |

**Verdict:** Security language is pervasive but theatrical. It reads like atmosphere design, not a trust contract. A buyer paying GBP 750-1,250 needs substantive assurance, not encryption poetry.

### 1.2 Privacy Policy

**Exists:** Yes — `pages/privacy.tsx`
- Last updated: 30 April 2026
- 7 sections covering: Who We Are, What We Collect, How We Use It, Email & Decision Continuity, Sharing & Processors, Retention, Your Rights
- Names data controller (Abraham Adaramola, London, UK)
- Names processors: Resend, Stripe, Google reCAPTCHA, Buttondown
- Mentions UK ICO complaint right
- Written in plain, professional English

**Assessment: 7/10** — Solid, honest, UK-compliant privacy policy. One of the strongest trust surfaces on the platform.

### 1.3 Terms of Service

**Exists:** Yes — `pages/terms.tsx` (aliased at `pages/terms-of-service.tsx`)
- Last updated: 30 April 2026
- 8 sections: Acceptance, Informational Content, Access-Controlled Services, Acceptable Use, IP, User Submissions, Availability & Liability, Governing Law
- England and Wales jurisdiction
- Explicitly disclaim advisory/fiduciary relationship
- Liability limitation clause present

**Assessment: 6/10** — Competent terms but missing a refund/cancellation section entirely. For a platform selling GBP 750+ products, this is a critical gap.

### 1.4 Credentials / Authority

**Founder page exists:** Yes — `pages/about/founder.tsx`
- Names Abraham Adaramola as founder
- Links to verification, evidence, trust, and foundations pages
- Description: "decision authority system for contradiction, consequence, enforcement, and verification"
- Page design: luxury minimal, authority-first positioning

**Assessment: 5/10** — The founder page exists and has strong design. However, it is framed as institutional mythology rather than credible biography. No verifiable credentials, client history, professional affiliations, or concrete track record are visible. For GBP 1,250 engagements, buyers need more than positioning language.

### 1.5 Social Proof

| Signal | Status |
|--------|--------|
| Client testimonials | NOT FOUND |
| Case studies with named clients | NOT FOUND (case dossiers exist but are anonymized/fictional-feeling) |
| Client count / engagement count | NOT FOUND |
| Client logos | NOT FOUND |
| Press mentions | NOT FOUND |
| Book reviews component | EXISTS (`components/books/BookReviews.tsx`) — but only for books |

**Assessment: 2/10** — Near-total absence of social proof for the consulting/advisory products. The free case dossiers (tariff shock, team alignment, escalation denied) read as demonstrations, not proof of real engagements.

### 1.6 Process Transparency

The system architecture is partially exposed:
- Executive Reporting Flagship component shows all 10 report output fields
- "Position in the system" panel explains Diagnostics → Executive Reporting → Strategy Room pipeline
- Strategy Room intake form has 14 structured fields with visible qualification logic
- Constitutional routing (STRATEGY / DIAGNOSTIC / REJECT) is shown to users

**Assessment: 7/10** — Unusually transparent about the system's structure. This is a genuine trust strength. However, the transparency is about *how the system works*, not *what the buyer receives as a deliverable*.

### 1.7 Pricing Clarity

| Product | Price | Visible? |
|---------|-------|----------|
| Decision Exposure Instrument | GBP 29 | Via catalog, shown in navigation |
| Mandate Clarity Framework | GBP 49 | Via catalog |
| Intervention Path Selector | GBP 79 | Via catalog |
| Operator Decision Pack | GBP 129 | Via catalog |
| Executive Reporting | GBP 295 | Via catalog, shown in header navigation |
| Strategy Room — Entry | GBP 750 | Shown on strategy room page + header |
| Strategy Room — Extended | GBP 1,250 | Shown on strategy room page |
| Inner Circle (membership) | GBP 30/mo | Inactive in catalog |

**Assessment: 6/10** — Prices are discoverable but not prominently displayed with value justification. The GBP 750 and GBP 1,250 prices appear near the purchase point but lack comparison anchoring or deliverable enumeration.

---

## 2. Trust Signals That Are MISSING

### 2.1 Refund / Cancellation Policy

**Status: ABSENT**

A search across the entire codebase for "refund", "guarantee", "money back", and "cancellation" returned:
- "Institutional guarantee" — one decorative line in PurchaseOptions (books only)
- "Submitting does not guarantee admission. It guarantees a serious reading." — Strategy Room intake
- Various philosophical uses of "guarantee" in blog/lexicon content
- No actual refund policy anywhere

**Severity: CRITICAL** — A platform charging GBP 750-1,250 with no stated refund policy creates immediate distrust. UK Consumer Contracts Regulations 2013 require 14-day cooling-off disclosures for online sales. This is not just a trust gap; it is a potential legal compliance issue.

### 2.2 SLA / Deliverable Description

**Status: ABSENT**

No component or page describes:
- What exactly the buyer receives after paying GBP 750 or GBP 1,250
- Timeline for delivery
- Format of deliverables (e.g., "a 12-field board-grade report" is mentioned in marketing but not in a binding context)
- What happens if the service fails to deliver

The Executive Reporting Flagship shows report output fields (good), but this is marketing, not a service agreement.

### 2.3 Trust Badges

**Status: ABSENT**

No Stripe badge, SSL indicator, data protection registration, or third-party verification badge exists anywhere in the payment flow. The `CheckoutButton` component (`components/commercial/CheckoutButton.tsx`) is a plain button with an email input — no trust indicators surround it.

### 2.4 Verified Social Proof

**Status: ABSENT** — See section 1.5 above.

### 2.5 About Page (Institutional)

The footer links to `/about` but no corresponding page file was found. Only `/about/founder` exists. An institutional about page explaining the company, its team (if any), and its operating model is missing.

### 2.6 Security Page

The footer links to `/security` but this was not located in the pages directory during this audit. If it exists, it is not a standard page route.

---

## 3. Trust by Journey Stage

### 3.1 First Visit

**What builds trust:**
- Strong visual design (luxury minimal, sharp, institutional)
- Privacy + Terms links visible in footer
- System architecture is transparently shown
- Clear product ladder from free → GBP 1,250

**What erodes trust:**
- No social proof on homepage
- No named clients, testimonials, or engagement counts
- Founder page lacks verifiable credentials
- "Institutional" language may feel opaque or alienating to first-time visitors
- No clear "who this is for" in plain language on the homepage

**Trust score at this stage: 5/10**

### 3.2 Diagnostic Stage

**What builds trust:**
- Free diagnostic is genuinely free (no payment trap)
- Assessment results show real data (score, band, domains)
- Constitutional routing gives a clear recommendation
- Process feels rigorous and structured

**What erodes trust:**
- No indication of who/what processes the diagnostic data
- AI vs human role is unclear
- Results use proprietary jargon (OGR, sovereignty, resonance) that may confuse
- Success page shows "Extract PDF Report" as disabled button — signals incompleteness

**Trust score at this stage: 6/10**

### 3.3 Payment Stage

**What builds trust:**
- Stripe checkout (credible processor)
- Price is shown before click
- Email required before redirect (prevents accidental charges)

**What erodes trust:**
- CheckoutButton has zero trust indicators (no Stripe logo, no "secure payment" messaging, no padlock)
- No refund policy visible at payment moment
- No deliverable summary at checkout
- No "what happens next" preview
- Do-not-sell gate exists but its presence is invisible to the user — they just see a rejection with no explanation
- Cancelled checkout message: "Entry cancelled. No payment was taken. The decision remains unresolved." — This is manipulative rather than reassuring

**Trust score at this stage: 4/10**

### 3.4 Delivery Stage

**What builds trust:**
- Strategy Room intake is genuinely sophisticated (14 structured fields)
- Constitutional evaluation gives a transparent verdict
- Report output fields are well-defined
- Follow-up panels exist (ConstitutionalFollowupPanel)

**What erodes trust:**
- Success page still shows "Coming_Soon.exe" for PDF export (line 159 of `app/strategy-room/success/page.tsx`)
- An executive paying GBP 1,250 sees a disabled "Export PDF" button with a joke filename
- The "Dossier_Not_Found" error state uses hacker-aesthetic language that may alarm
- No progress timeline or "what happens next" sequence

**Trust score at this stage: 6/10**

### 3.5 Follow-up Stage

**What builds trust:**
- RetainerEntryGate conditionally appears based on qualification criteria
- Decision continuity email system exists (privacy policy describes it)
- Nudge emails use professional, institutional design

**What erodes trust:**
- Retainer offer framing: "Without sustained enforcement, this does not resolve" — this reads as fear-based upselling
- No re-engagement if the user does not convert to retainer
- No feedback mechanism or satisfaction check
- No community or peer access after purchase

**Trust score at this stage: 4/10**

---

## 4. Priority Remediation

### Critical (must fix before next paid engagement)

1. **Add a refund/cancellation policy** to Terms of Service and make it visible at checkout. UK law requires this for digital services sold online.
2. **Remove "Coming_Soon.exe"** from the strategy room success page. Replace with a functional PDF export or a clear timeline for delivery.
3. **Add trust indicators to CheckoutButton** — at minimum a Stripe logo and "Secure payment" line.

### High Priority

4. **Create a deliverable description page** for Strategy Room and Executive Reporting — what exactly does the buyer receive, in what format, and when.
5. **Add at least 3 verifiable testimonials or case outcomes** to the homepage or evidence section.
6. **Add a founder bio with verifiable credentials** (education, professional history, notable engagements).

### Medium Priority

7. **Revise payment-adjacent copy** — remove manipulative framing ("The decision remains unresolved") and replace with neutral, professional confirmation language.
8. **Create the /about institutional page** explaining the company, team, and operating model.
9. **Create or verify the /security page** linked from footer.
10. **Add process timeline** — after payment, show the user a clear sequence of what happens next and when.

---

## 5. Revised Trust Score Projection

| Action | Trust impact |
|--------|-------------|
| Current state | 5.8/10 |
| + Refund policy + checkout trust indicators | +1.0 |
| + Deliverable descriptions + "Coming_Soon.exe" fix | +0.8 |
| + Social proof (3+ testimonials) | +0.7 |
| + Founder credentials + about page | +0.4 |
| + Follow-up reframing + timeline | +0.3 |
| **Projected after remediation** | **9.0/10** |
