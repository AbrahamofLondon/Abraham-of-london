# Demo Audit and Upgrade Proposal

**Date:** 2026-07-07
**Audit:** Live site demos at abrahamoflondon.org

---

## Demo Inventory

### Discovered Demos/Interactive Surfaces

| URL | Type | Description | Status |
|---|---|---|---|
| `/decision-instruments/signal` | **Interactive tool** | Free 2-min decision signal: form with textarea, cost-of-delay selector, confidence slider, consequence selector, urgency selector. "Generate signal" button (currently disabled). | ✅ **Live** |
| `/engagements/operator-pilot` | **Landing page** | Governed pilot review: describes the pilot, who it's for, what it tests, example output, CTA to Fast Diagnostic. No interactive tool on page. | ✅ **Live** |
| `/foundry/decision-test` | **Interactive tool** | "Test a Decision" — linked from nav CTA. Likely a decision testing interface. | ✅ **Linked** |
| `/diagnostics/fast` | **Interactive tool** | Fast Diagnostic — linked from operator-pilot CTA. | ✅ **Linked** |
| `/diagnostics/purpose-alignment` | **Interactive tool** | Purpose Alignment / Personal Decision Audit. | ✅ **Linked** |
| `/decision-instruments` | **Directory** | Decision Instruments listing page. | ✅ **Live** |
| `/decision-centre` | **Dashboard** | Decision Centre — customer dashboard. | ✅ **Linked** |
| `/inner-circle` | **Access-gated** | Inner Circle member area. | ✅ **Linked** |

### Pages That Should Be Demos But Aren't

| URL | Current State | Should Be |
|---|---|---|
| `/market-intelligence/dii` | Library module only | **Interactive DII dashboard** with score breakdown, edition trend chart, methodology disclosure |
| `/market-intelligence/learning-log` | Library module only | **Interactive Learning Log** with filtering, search, call detail pages |
| `/trust-centre` | Library module only | **Interactive Trust Centre** with product governance cards, search, filtering |
| `/corridor` | Library module only | **Interactive Corridor Map** showing customer position, next moves, progression |

---

## Detailed Demo Analysis

### 1. `/decision-instruments/signal` — Decision Signal

**What it does:** A free 2-minute form that classifies decision pressure, names one signal, and identifies the next admissible action. No account required.

**What's good:**
- Clean, focused form with clear inputs
- Good use of selection buttons (cost of delay, consequence, urgency)
- Confidence slider with live value display
- Clear "no account required" messaging
- "Generate signal" button is prominent

**What's weak:**
- **"Generate signal" button is disabled** (`cursor: not-allowed; opacity: 0.4`) — the demo cannot actually be submitted
- No example output shown — user doesn't know what they'll get
- No connection to the broader system — no "what happens next" section
- No indication of what the signal will look like
- No sample signal or worked example
- The form has no validation feedback

**Upgrade proposal:**
1. **Enable the submit button** with a demo mode that returns a realistic sample output
2. **Add a sample output panel** that appears after submission showing: pressure classification, signal name, next action, checkpoint
3. **Add a "What happens next" section** linking to Fast Diagnostic, Operator Pilot, and Decision Centre
4. **Add form validation** with inline error messages
5. **Add a "Try an example" button** that pre-fills the form with sample data

### 2. `/engagements/operator-pilot` — Operator Pilot

**What it does:** Describes a governed pilot review for one real decision. Not an interactive tool — a landing page with CTA to Fast Diagnostic.

**What's good:**
- Excellent, clear positioning of what the pilot is and isn't
- Strong trust signals (company registration, legal identity)
- Clear "who this is for / who this is not for" sections
- Worked example showing input and output
- Comprehensive "what the operator receives" section
- Honest "what the system will not claim" section
- Clear escalation path after pilot

**What's weak:**
- **No way to actually start the pilot from this page** — the CTA goes to Fast Diagnostic, not a pilot intake form
- No pilot-specific form or submission mechanism
- No indication of pilot availability or capacity
- No pricing or timeline information
- No FAQ section

**Upgrade proposal:**
1. **Add a pilot intake form** directly on the page with: name, email, decision description, constraint environment, authority confirmation
2. **Add a "Pilot availability" indicator** showing current capacity
3. **Add an FAQ section** addressing: timeline, confidentiality, cost, what happens after submission
4. **Add a sample pilot output** (PDF or rendered finding) that users can inspect before applying
5. **Add a "Pilot terms" page** linked from the CTA

### 3. Missing Demos (Highest Priority)

#### Market DII Dashboard (`/market-intelligence/dii`)

**What should exist:** An interactive dashboard showing the Market Decision Integrity Index with:
- Headline score with coverage indicator
- Component score breakdown (call accuracy, falsification discipline, calibration quality, revision discipline)
- Edition trend chart
- Methodology disclosure
- Coverage information

**Why it matters:** The DII is the single most powerful trust signal the platform can publish. Without a public dashboard, the DII infrastructure exists but provides no market benefit.

#### Decision Learning Log (`/market-intelligence/learning-log`)

**What should exist:** An interactive log showing:
- All calls with outcome status, score, evidence
- Filtering by edition, theme, status, region
- Call detail pages
- Cross-edition comparison
- Falsification register

**Why it matters:** The Learning Log demonstrates accountability. Without a public view, the falsification infrastructure is invisible.

#### Trust Centre (`/trust-centre`)

**What should exist:** A governance display showing:
- Estate-level governance summary
- Product-specific governance cards with display states
- Search and filtering
- Governance Receipt download

**Why it matters:** The Trust Centre makes governance buyer-visible. Without it, the governance infrastructure provides no market trust signal.

#### Corridor Map (`/corridor`)

**What should exist:** An interactive corridor map showing:
- Current customer position
- Completed milestones
- Admissible next moves
- Controlled moves requiring qualification
- Recommendation rationale

**Why it matters:** The corridor map makes the product progression visible. Without it, the corridor is architecture, not a user experience.

---

## Priority Matrix

| Demo | Effort | Impact | Priority |
|---|---|---|---|
| Enable Decision Signal submission | **Low** (frontend only) | **High** (fixes broken demo) | **P0 — Immediate** |
| Market DII Dashboard | **Medium** (page + API) | **Very High** (key trust signal) | **P1 — This week** |
| Decision Learning Log | **Medium** (page + API) | **High** (accountability proof) | **P1 — This week** |
| Trust Centre | **Medium** (page + API) | **High** (governance visibility) | **P2 — Next week** |
| Corridor Map | **Medium** (page + API) | **Medium** (UX improvement) | **P2 — Next week** |
| Operator Pilot intake form | **Low** (form + email) | **Medium** (conversion) | **P2 — Next week** |

---

## Immediate Actions (P0)

1. **Enable the Decision Signal submit button** — the most critical fix. A demo that cannot be submitted is worse than no demo.

2. **Add sample output to Decision Signal** — show users what they'll get before they submit.

3. **Add pilot intake form to Operator Pilot** — the page has a strong CTA but no way to actually start.

## This Week (P1)

4. **Build Market DII dashboard page** — the library module exists (`calculateDecisionIntegrityIndex`), the API route exists (`/api/market-intelligence/dii`), the page route exists (`/market-intelligence/dii`). Needs to be deployed.

5. **Build Decision Learning Log page** — the library module exists (`getLearningLog`), the page route exists (`/market-intelligence/learning-log`). Needs to be deployed.

## Next Week (P2)

6. **Build Trust Centre page** — the library module exists (`getAllProductGovernanceCards`), the page route exists (`/trust-centre`). Needs to be deployed.

7. **Build Corridor Map page** — the library module exists (`buildCorridorMap`), the page route exists (`/corridor`). Needs to be deployed.

8. **Add pilot intake form** — simple form that emails the submission to the operator.
