# User Journey Map

**Product:** Abraham of London — Decision Enforcement Platform
**Audit date:** 2026-05-07
**Source:** Direct page/component code analysis

---

## Journey 1: First Visit — Homepage to Diagnostic

### Entry point
`/` (pages/index.tsx)

### What the visitor sees first
A full-screen hero with the headline:

> "You're not dealing with a strategy problem. You're dealing with a decision that hasn't actually been taken."

Subtext: "6 questions. No prep. If it's wrong, ignore it. If it's right, you'll know immediately."

A proof strip below: "Runs in under 2 minutes / No generic output / Uses your inputs against your framing."

### CTAs present
1. **Primary CTA (gold border, prominent):** "Run the diagnostic" — links to `/diagnostics/fast`
2. **Secondary CTA (subtle text link):** "See what the system returns" — scrolls to `#proof-layer`
3. **Value ladder (mid-page):** Step-by-step links to Fast Diagnostic, Constitutional Diagnostic, Executive Reporting, Strategy Room
4. **"How it works" demonstration block** — shows sample input/output, with "Run yours" link to `/diagnostics/fast`

### Below the fold
- "Reality filter" panel: "This is not for you if..." / "This is for you if..." (self-qualification)
- Platform Architecture section with three layers: Doctrine/Editorial, Structured Products, Private Mandate
- Sidebar navigation panel linking to Canon, Intelligence Archives, Editorials, Diagnostics, Consulting
- Global Market Intelligence report feature block (Q1 2026)
- Executive Reporting feature block with "Open Executive Reporting" CTA
- Diagnostic Ladder (01: Constitutional Diagnostic, 02: Executive Reporting, 03: Strategy Room)
- Escalation Close section with entry point CTAs
- Blog strip, Publication strip, Canon entries, Playbooks, Shorts signal rail

### Decision points
- The visitor must self-identify: "Is a decision stuck?" (reality filter)
- Primary action is to run the Fast Diagnostic; everything else is supporting context

### Drop-off risks
- The homepage is extremely long (1800+ lines of TSX). Visitors who scroll past the hero without clicking the primary CTA may get lost in content
- The secondary CTA ("See what the system returns") is extremely subtle (7.5px, opacity 0.22)
- No email capture on the homepage itself — the visitor must enter a diagnostic to be captured
- Multiple competing navigation paths (canon, blog, editorials, intelligence, consulting) may dilute the primary funnel

### Dead ends
- None — all links resolve to live routes

---

## Journey 2: Fast Diagnostic

### Entry point
`/diagnostics/fast` (pages/diagnostics/fast.tsx)

### Flow

**Stage 1: Hero**
- Headline: "You don't have an execution problem. You have a decision structure problem."
- Subtext: "Most decisions don't fail because they're wrong. They fail because no one actually owns them — or the structure can't carry them."
- CTA: "Find the break" (gold button)
- If a draft exists in localStorage, offers "Continue your session" / "Start fresh"
- Trust line: "No signup. No theory. You will either recognise it — or you won't."

**Stage 2: Decision (Step 1 of 3)**
- Question: "What decision has been sitting unresolved longer than it should?"
- Textarea input, minimum 8 characters to advance
- Live hint engine reacts to input patterns (detects outcomes vs decisions, vague language)
- Challenge engine may fire via `/api/diagnostics/challenge` — can block or require revision
- Microcopy: "If you can't name it clearly, that's already a signal."

**Stage 3: Authority (Step 2 of 3)**
- Question: "Who can actually make this decision binding?"
- Live hints detect shared/unclear ownership
- Challenge engine may fire

**Stage 4: Consequence (Step 3 of 3)**
- Question: "What becomes more expensive if this stays unresolved?"
- Live hints detect abstract consequences
- Challenge engine may fire

**Stage 5: Commitment**
- Question: "If this identifies the real blocker, will you act on it within 48 hours?"
- Two buttons: "Yes — if it's clear" / "No — I'm not ready to act"
- Declining shows: "Then this is not yet a decision" with "View analysis anyway" option
- Commitment status is tracked and reflected in the result

**Stage 6: Loading**
- Animated loading with contextual lines: "Reading your decision pattern... Checking structural consistency... Preparing governed analysis..."

**Stage 7: Recovery (conditional)**
- If the result contains a `recoveryQuestion`, the user is told "More detail required" and offered "Restart with more detail"

**Stage 8: Result**
- Full structured result with sections: Opening, Condition, Personal Mirror Line, Why It Exists, Pattern, Cost of Inaction (30/60/90 days), External View, Required Move
- Executive Decision Authority Block with authority index, cost of inaction, execution failure metrics
- "How this was determined" expandable section showing user's own answers back to them

### Email capture
- `ResultEmailCapture` component appears AFTER the result impact, positioned between Condition and Why It Exists
- Framed as "Save this reading" — not "Sign up"
- Posts to `/api/diagnostics/capture` with email, source, and result reference
- "Continue without saving" always available
- If email already captured in session, shows "Saved. You will be able to track this pattern over time."

### Post-result CTAs
1. **Escalation CTA:** "Continue to Purpose Alignment" — links to `/purpose-alignment`
2. **Paid CTA:** "Move this into a controlled decision environment" — links to `/diagnostics/executive-reporting`
3. **Reset CTA:** "Start again"

### Drop-off risks
- The challenge engine can block progression if inputs are too vague — may frustrate users who are not ready to be precise
- The commitment question ("Will you act within 48 hours?") is confrontational; declining changes the result framing to "unresolved"
- Recovery stage forces a restart if the system deems input insufficient
- Result is stored only in `sessionStorage` — clearing browser data loses it

### Dead ends
- None — result screen always offers next steps

---

## Journey 3: Purpose Alignment

### Entry point
`/diagnostics/purpose-alignment` (pages/diagnostics/purpose-alignment.tsx)
Also accessible at `/purpose-alignment` (app/purpose-alignment/page.tsx) — both render the same `PurposeAlignmentAssessment` component

### Flow

**Phase 1: Context (3 open-text questions)**
1. "What decision are you currently avoiding or deferring?"
2. "What competing obligation or priority is pulling against that decision?"
3. "What becomes worse if this remains unresolved?"

Each has a challenge engine check (same pattern as Fast Diagnostic).

**Phase 2: Signal (dual-axis Likert questions)**
- Questions from `PURPOSE_ALIGNMENT_QUESTIONS` across alignment domains
- Uses `DualAxisInput` component for each question
- Integrity challenge system (`detectDualAxisIntegrityChallenge`) checks for inconsistent response patterns

**Phase 3: Result**
- Scored via `scorePurposeProfile` producing a `PurposeProfileResult`
- Includes anchor narrative, pattern reading, cost of inaction
- `ResultEmailCapture` component present
- Result stored in `sessionStorage` as `purpose-alignment-result`

### CTAs
- After result: escalation to Constitutional Diagnostic or Team Assessment (based on findings)

### Drop-off risks
- Described as "8 minutes" — longer than the Fast Diagnostic; users may abandon mid-assessment
- Open-text context questions require effort and vulnerability

### Dead ends
- None identified

---

## Journey 4: Team Assessment

### Entry point
`/diagnostics/team-assessment` (pages/diagnostics/team-assessment.tsx)

### Flow

**Phase 1: Identity**
- Respondent name, email, role, organisation, team name, team size, notes

**Phase 2: Leader Perception**
- 4 domains (Direction & Priority, Execution Integrity, Trust & Communication, Authority & Escalation) x 3 questions each
- Leader rates team from their own perspective using dual-axis input
- Live challenge engine checks

**Phase 3: Leader's Team Estimate**
- Same 4 domains x 3 questions
- Leader estimates how the team would rate themselves
- The gap between Phase 2 and Phase 3 IS the diagnostic finding

**Phase 4: Result**
- Gap analysis between leader perception and estimated team reality
- Fragility classification (Bessel-corrected standard deviation)
- Domain-level gap severity
- Pattern reading per domain
- Connects to Purpose Alignment result if available in sessionStorage
- Recommended playbooks via `matchPlaybooks`
- Trajectory line and consequence timeline
- `ResultEmailCapture` component present
- Escalation routing to Enterprise Assessment with specific structural finding

### Post-result CTAs
- Continue to Enterprise Assessment
- Recommended playbooks
- Feedback loop block

### Drop-off risks
- Requires identity information (name, email, role) upfront — friction before value delivery
- Described as "10 min" — substantial time investment
- Dual-phase rating (own view + estimated team view) may confuse users

### Dead ends
- None — routes to Enterprise Assessment

---

## Journey 5: Enterprise Assessment

### Entry point
`/diagnostics/enterprise-assessment` (pages/diagnostics/enterprise-assessment.tsx)

### Flow

**Phase 1: Identity**
- Respondent and organisation context

**Phase 2: Instrument**
- 4 blocks x 3 Likert questions = 12 total
- Blocks: Leadership Coherence, Governance Reliability, Execution Variance, Institutional Risk
- Live signal panel alongside questions
- Challenge engine checks

**Phase 3: Result**
- Band classification: STABLE / WATCH / FRAGILE / ESCALATE
- Section breakdown with pattern reading per section
- Dominant failure mode identified
- Specific escalation route with structural justification
- Connects to team assessment result if in sessionStorage
- `ResultEmailCapture` component present
- Consequence timeline
- Trajectory line

### Post-result CTAs
- Escalation to Executive Reporting (if evidence warrants)
- WATCH classification (governed observation, not escalation)
- Recommended playbooks

### Drop-off risks
- Described as "15 min" — the longest free assessment
- Institutional language may alienate smaller organisations
- Requires enough enterprise context to answer meaningfully

### Dead ends
- None — routes to Executive Reporting or WATCH

---

## Journey 6: Executive Reporting (Paid)

### Entry point
`/diagnostics/executive-reporting` (pages/diagnostics/executive-reporting.tsx)

### How a user reaches it
1. Post-result CTA from Fast Diagnostic: "Move this into a controlled decision environment"
2. Post-result escalation from Enterprise Assessment
3. Direct link from homepage diagnostic ladder
4. Direct link from diagnostics index page

### Gate page flow

The entry page (`/diagnostics/executive-reporting`) is NOT the paid product itself — it is a sales/evidence page:

1. **Opening verdict:** "This is not an execution problem. It is a decision structure failure."
2. **Personalised decision exposure:** If the user has completed prior diagnostics (stored in sessionStorage), their specific decision, blocker, and consequence are reflected back
3. **Consequence snapshot:** 30/60/90 day cost of inaction (personalised if evidence exists)
4. **Evidence accumulated:** Checklist showing which diagnostics have been completed (fast, purpose, team, enterprise)
5. **What Executive Reporting adds:** Prices the cost of delay, identifies governance correction, sequences first intervention, prepares board-ready decision object
6. **Personalised report preview:** If evidence exists, shows a preview of the executive finding, structural contradiction, and cost of inaction
7. **Email capture:** `ResultEmailCapture` positioned above paywall
8. **Paywall:** "You have seen the diagnosis. You have not yet seen the full consequence." — `ExecutiveReportingPaywall` component with Stripe checkout
9. **Strategy Room bridge:** If 3+ assessments completed, shows "Move into Strategy Room" CTA; otherwise "More diagnostic evidence is required"

### Access enforcement
- Server-side `getServerSideProps` calls `enforceExecutiveReportingAccess`
- If access is not allowed, redirects to `/diagnostics/constitutional-diagnostic?executive=blocked`
- Supports sponsored access, monitoring accounts, and campaign-based access

### Post-payment flow
`/diagnostics/executive-reporting/run` — full executive reporting intake:
- Identity fields (name, email, organisation, role, sector)
- Structured context (authority scope, board involvement, revenue band, decision window, headcount, stakeholder breadth)
- High-yield free-text questions (decision question, constraints, desired outcome)
- AI interpretation via `useInterpretation` hook
- Full result surface with: Board Snapshot, Predictive Consequence, AI Terrain Exposure, Competitive Position Signal, Engagement Readiness, Multi-Stakeholder Divergence, Longitudinal Intelligence, Outcome Verification
- Strategy Room conversion bridge at the bottom

### Drop-off risks
- Users who arrive without prior diagnostic evidence see a weaker, generic version of the page
- The paywall is positioned late — users may have already gotten enough from the free evidence summary
- Checkout cancellation returns to the same page with a "Session cancelled" banner but no retry incentive
- If access enforcement fails, the redirect to constitutional diagnostic with `?executive=blocked` may confuse users

### Dead ends
- None — the page always offers a path back to diagnostics or forward to Strategy Room

---

## Journey 7: Strategy Room (Paid)

### Entry point
`/strategy-room` (pages/strategy-room/index.tsx)

### How a user reaches it
1. Post-result CTA from Executive Reporting: "Move into Strategy Room"
2. Direct link from homepage diagnostic ladder (step 3)
3. Direct link from diagnostics index page

### Three states

**State 1: GATE (Decision Authority Gate)**
- Reads `aol:tension-thread` from sessionStorage
- Runs `deriveDecisionDirective` to determine access level
- Three outcomes:
  - `allow` — user proceeds to the entry form
  - `restrict` — "prerequisite required" banner with redirect link
  - `block` — "escalation not justified" banner with redirect to diagnostics
- Links to: Institutional mandate, Private advisory, Contact

**State 2: ENTRY BRIEF (Paid)**
- Constitutional intake form with fields: fullName, email, organisation, sector, revenueBand, authorityRole, authorityScope, urgencyWindow, problemStatement, symptoms, desiredOutcome, currentConstraint, marketExposure, boardInvolved
- Pre-populated from diagnostic thread and canonical sections where available
- Strategy Entry Brief shown alongside form: decision text, constraint, cost of delay, owner domain, contradiction, confidence label
- Validation requires: fullName, email, organisation, authorityRole, authorityScope, urgencyWindow
- Checkout via Stripe for Strategy Room product

**State 3: EXECUTION CHAMBER (Active)**
- Shown when `hasPaidAccess` is true (verified via `getServerSideProps` with cookie check)
- Execution Environment header: "Execution begins now. The system has determined that action — not analysis — is required."
- Metrics panel: escalation level, dominant condition, ignored consequence, directive
- First Action Prompt
- ExecutionFlow component
- Dynamic Consequence Panel
- Escalation Trigger Panel
- Avoidance Pattern Notice
- AI Intervention Suggestions
- Competitive Position Signal
- Advantage Path Block
- Decision Log with entries (pending / executed / blocked)
- Retainer Entry Gate (qualification for ongoing advisory)
- Case Active Banner, Feedback Loop, Limitations Block

### Post-session
`/strategy-room/success?id=X` (app/strategy-room/success/page.tsx)
- Fetches results from `/api/strategy-room/results?id=X`
- Shows: Strategy Dossier with Operational Readiness Index (0-100%), Market Context/Volatility
- CTAs: "Access Briefings" (links to `/vault/briefs`), "Export PDF" (disabled — "Coming_Soon.exe")
- "Recalibrate_Assessment" link back to Strategy Room

### Drop-off risks
- The Decision Authority Gate can actively BLOCK users — if prior diagnostics are insufficient, the system will not let them proceed
- The intake form is extensive (14 fields) — high friction
- The "block" state sends users back to diagnostics with minimal explanation
- PDF export is not yet available (disabled button)

### Dead ends
- The "Export PDF" button on the success page is disabled — this is a dead end for users expecting deliverables
- If the gate blocks access, the only option is to go backwards to complete more diagnostics

---

## Journey 8: Inner Circle (Membership)

### Entry point
`/inner-circle` (pages/inner-circle/index.tsx)

### Registration flow
1. **Register panel:** Email + Name fields, submitted to `/api/inner-circle/register`
   - reCAPTCHA protected
   - If email already exists, directs to Secure Entry panel
2. **Secure Entry panel:** Access Key field, submitted for unlock
   - On success, sets `aol_access` cookie
   - Redirects to `/inner-circle/dashboard` (or `returnTo` parameter)
3. **Already unlocked:** If `aol_access` cookie exists, auto-redirects to dashboard within 800ms

### Authentication
- Server-side: `getServerSession` with NextAuth + Prisma
- Access tier checked via `getUserAccess` and `canAccessTier`

### Dashboard
`/inner-circle/dashboard` (pages/inner-circle/dashboard.tsx)
- Shows: Diagnostic Records, Briefs
- Session info: user name, tier, last login
- Navigation via `WorkspaceNav` component

### Additional pages
- `/inner-circle/account` — account management
- `/inner-circle/login` — login page
- `/inner-circle/unlock` — unlock page
- `/inner-circle/resend` — resend access key
- `/inner-circle/briefs/` — briefings
- `/inner-circle/reports/` — reports
- `/inner-circle/locked` — locked content gate
- `/inner-circle/insufficient-clearance` — tier-based access denial
- `/inner-circle/admin` — admin panel

### Drop-off risks
- Registration does not deliver immediate value — user registers, receives an access key (presumably by email), then must return to unlock
- Two-step process (register then unlock) adds friction
- The locked/insufficient-clearance pages may frustrate members who expect full access

### Dead ends
- `/inner-circle/insufficient-clearance` — tells user they lack clearance but may not clearly explain how to upgrade
- `/inner-circle/locked` — content gate with unclear path forward

---

## Journey 9: Email Capture and Follow-up

### Where emails are captured

1. **ResultEmailCapture component** — appears on:
   - `/diagnostics/fast` (result screen, between Condition and Why It Exists)
   - `/diagnostics/purpose-alignment` (result screen)
   - `/diagnostics/team-assessment` (result screen)
   - `/diagnostics/enterprise-assessment` (result screen)
   - `/diagnostics/executive-reporting` (above the paywall)
   - Also used inside `ConstitutionalDiagnostic` component

   Framing: "Save this reading" — not a newsletter signup. Posts to `/api/diagnostics/capture`.

2. **Inner Circle registration** — `/inner-circle` registration form posts to `/api/inner-circle/register`

3. **Subscribe page** — `/subscribe` — "Founding Readers Circle" with `NewsletterForm` component

4. **Contact form** — `ContactForm` component

5. **Resource downloads** — `ResourceDownload` component may require email

6. **Teaser requests** — `TeaserRequest` component

7. **Inline CTAs** — `InlineCTA` component in editorial content

### What happens after capture

**Diagnostic email capture (`/api/diagnostics/capture`):**
- Stores email with source identifier and result reference
- Session-level deduplication via `sessionStorage.aol_captured_email`
- Follow-up system: `registerPressureLoopFromSpine` (referenced in team/enterprise assessments) registers the user in a pressure-based follow-up loop
- The commitment question in Fast Diagnostic ("will you act within 48 hours?") is tracked — the system states "If you commit and do nothing, the system will follow up"

**Inner Circle registration:**
- Creates user record in Prisma database
- Sends access key (mechanism unclear from client code alone)
- User must return to unlock

**Newsletter/Subscribe:**
- Standard email list signup via `NewsletterForm`

### Drop-off risks
- Email capture is consistently positioned AFTER value delivery — this is good practice but means many users will see the result and leave without saving
- The "Continue without saving" option is always available — no friction, but also no push
- The follow-up mechanism ("the system will follow up") is referenced in the UI but the actual email sending pipeline was not auditable from client code alone
- No visible drip sequence or onboarding email flow detectable from the codebase

---

## Summary: Primary Conversion Funnel

```
Homepage (/)
    |
    v
Fast Diagnostic (/diagnostics/fast)        [FREE - 2 min]
    |
    v  (result screen email capture)
    |
    +---> Purpose Alignment                 [FREE - 8 min]
    |
    v
Constitutional Diagnostic                  [FREE - 6 min]
    |
    v
Team Assessment                             [FREE - 10 min]
    |
    v
Enterprise Assessment                      [FREE - 15 min]
    |
    v
Executive Reporting (/diagnostics/executive-reporting)  [PAID]
    |
    v
Strategy Room (/strategy-room)             [PAID - highest tier]
    |
    v
Inner Circle membership                    [ONGOING]
```

### Parallel paths
- `/diagnostics` index page serves as a hub with 5 starting signal cards that let users self-select their entry point
- The diagnostics index presents a "personal diagnostic path" (Purpose Alignment) separate from the "institutional ladder" (Constitutional > Team > Enterprise > Executive Reporting)

### Critical observations

1. **Strength: The funnel is evidence-gated.** Each step accumulates evidence in sessionStorage. Later stages reference earlier findings, creating personalised continuity. Executive Reporting and Strategy Room are meaningfully better when prior diagnostics are completed.

2. **Risk: sessionStorage dependency.** All evidence accumulation relies on sessionStorage. Users who clear their browser, switch devices, or use incognito mode lose their entire diagnostic history. There is no server-side session persistence for the free tier.

3. **Risk: No account required for the free ladder.** This removes friction but means there is no way to re-engage users who complete diagnostics but do not provide their email.

4. **Risk: Long homepage.** The homepage tries to serve too many purposes — product entry, content catalogue, intelligence reports, editorial showcase. The primary funnel (Fast Diagnostic) competes with dozens of secondary navigation paths.

5. **Dead end: PDF export on Strategy Room success.** The button exists but is disabled ("Coming_Soon.exe"). Users expecting a deliverable will be disappointed.

6. **Dead end: Inner Circle clearance pages.** `/inner-circle/locked` and `/inner-circle/insufficient-clearance` may not adequately explain upgrade paths.

7. **Strength: Email capture positioning.** Emails are captured AFTER value delivery, framed as "Save this reading," with no gates or popups. This is high-trust design.

8. **Risk: Follow-up pipeline opacity.** The system promises follow-up ("If you commit and do nothing, the system will follow up") but the actual email delivery mechanism is not visible in client code.
