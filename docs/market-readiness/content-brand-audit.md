# Content & Brand Credibility Audit

**Date**: 2026-05-07
**Auditor**: Automated brand review (Claude Code)
**Scope**: All public-facing copy, CTAs, trust signals, and commercial pages
**Standard**: Premium advisory platform charging up to GBP 1,250 per engagement

---

## 1. Homepage (`pages/index.tsx`)

### What Visitors See

**Hero headline**:
> "You're not dealing with a strategy problem. You're dealing with a decision that hasn't actually been taken."

**Sub-copy**:
> "6 questions. No prep. If it's wrong, ignore it. If it's right, you'll know immediately."

**System description**:
> "The system identifies the contradiction, prices the consequence, and directs the next valid move."

**Primary CTA**: "Run the diagnostic" -> `/diagnostics/fast`

**Proof strip**: "Runs in under 2 minutes / No generic output / Uses your inputs against your framing"

**Trust line**: "Governed review. No generic assistant output. No sale if the case is not ready."

### Assessment

The homepage has been rebuilt as a conversion page focused on the free diagnostic funnel. This is a strong strategic choice. The hero addresses a real pain point directly and avoids vague consultancy language.

**Strengths**:
- Headline is specific and provocative without overclaiming
- "6 questions. No prep." is credible and low-friction
- Anti-audience filter ("This is not for you if: You are exploring ideas") is excellent trust-building
- Proof mechanism is the diagnostic itself, not testimonials
- Platform architecture section ("Three layers. One governing logic.") clearly explains the product stack
- Pricing is transparent with actual GBP figures visible on-page
- Escalation logic is clearly explained (diagnose -> price -> enforce -> verify)

**Issues**:

| Flag | Detail | Severity |
|------|--------|----------|
| **Overclaiming** | "The system identifies the contradiction, prices the consequence, and directs the next valid move" -- this is a strong claim for what is partly AI-generated output | Medium |
| **Template language** | "Institutional strategy, governance discipline, and operator doctrine for serious builders" (metadata description) uses "serious builders" which is vague | Low |
| **Internal jargon** | "Canon-derived", "Constitutional Diagnostic", "Operator Decision Pack" -- visitors unfamiliar with the platform's vocabulary face a steep ramp | Medium |
| **Inconsistent terminology** | The homepage references: "the Canon", "doctrine", "operator packs", "vault assets", "briefings", "frameworks", "playbooks", "intelligence archives" -- too many product names for a first visit | Medium |
| **Overclaiming** | "Estimated exposure: GBP 420,000 over 6 months" shown in a demo block -- specific fake numbers in a specimen could be mistaken for a real case | Medium |
| **Weak CTA** | Multiple homepage hero variants exist in `components/homepage/` (HeroSection, InstitutionalHero, CinematicHero) -- brand inconsistency if these are A/B tested without alignment | Low |

**Brand Credibility Score: 7/10**

The homepage is the strongest page on the platform. The conversion-focused rewrite is disciplined. The main risk is vocabulary density -- a new visitor encounters 15+ product names before understanding what the platform actually does. The "diagnose-price-enforce-verify" framework is clear and repeatable, which is good.

---

## 2. Diagnostics Landing (`pages/diagnostics/fast.tsx`)

### What Visitors See

**Hero headline**:
> "You don't have an execution problem. You have a decision structure problem."

**Sub-copy**:
> "Most decisions don't fail because they're wrong. They fail because no one actually owns them -- or the structure can't carry them."

**Promise**: "This will show you where yours is breaking. Takes 2 minutes."

**CTA**: "Find the break"

**Trust line**: "No signup. No theory. You will either recognise it -- or you won't."

### Assessment

This is the highest-conviction page on the platform and the primary conversion entry point.

**Strengths**:
- Three-step interrogation (Decision -> Authority -> Consequence) is genuinely diagnostic
- Live hints while typing ("This does not yet read as a decision") show system intelligence
- AI-powered challenge cards that push back on vague inputs add real credibility
- Commitment screen ("Will you act within 48 hours?") filters for genuine prospects
- Result screen provides structured output: condition, pattern, cost-of-inaction (30/60/90 days), required move
- Draft auto-save with resume is professional UX
- "How this was determined" transparency section builds trust

**Issues**:

| Flag | Detail | Severity |
|------|--------|----------|
| **Overclaiming** | The result fallback text ("You are not stuck because this is complex. You are stuck because the decision structure is broken.") is a pre-written statement that fires regardless of input quality | Medium |
| **Unearned authority** | "Governed analysis" label on results implies institutional oversight that does not exist -- it is AI-generated | High |
| **Internal jargon** | "Decision authority", "signal strength", "escalation", "constitutional diagnostic" -- users are sorted into a taxonomy they did not choose | Medium |
| **Template language** | Default result text ("This pattern is commonly seen before structural correction") could apply to almost any decision | Medium |

**Brand Credibility Score: 8/10**

The diagnostic is genuinely good. The interactive challenge system is the single most convincing trust-builder on the platform. The main risk is that result text sometimes falls back to generic patterns, which undermines the "no generic output" promise made on the homepage.

---

## 3. Evidence Page (`pages/evidence/index.tsx`)

### What Visitors See

**Hero**: "Observed under real conditions."

**Sub-copy**: "These are not opinions. These are structured readings of conditions that required decisions."

**Proof tags**: "5 outcome-verified cases" / "14-60 day enforcement windows"

**Displayed cases**: 3 cards (Tariff Shock, Team Alignment Illusion, Escalation Denied)

**Proof standard section**: Explains what is published, what is not published, what does not qualify, and what this proves.

### Assessment

**CRITICAL BUG CONFIRMED**: The page claims "5 outcome-verified cases" but displays only 3 cases in the EVIDENCE array. Meanwhile, the `content/evidence/` directory contains 8 MDX files:
1. `tariff-shock-growth-break.mdx`
2. `team-alignment-illusion.mdx`
3. `escalation-denied-case.mdx`
4. `outcome-verified-authority-boundary.mdx`
5. `outcome-verified-decision-lag.mdx`
6. `outcome-verified-escalation-restraint.mdx`
7. `outcome-verified-hidden-divergence.mdx`
8. `outcome-verified-market-exposure.mdx`

The page hardcodes 3 cases in a static array rather than reading from the content directory. The "5" claim is wrong in both directions -- there are 3 displayed and 8 available.

**Issues**:

| Flag | Detail | Severity |
|------|--------|----------|
| **Overclaiming** | "5 outcome-verified cases" -- actually shows 3 | **Critical** |
| **Missing content** | 5 additional evidence MDX files exist but are not surfaced | High |
| **Unearned authority** | "Outcome metrics preserved and auditable at system level" -- auditable by whom? There is no external audit | High |
| **Template language** | "This requires intervention, not analysis" -- dramatic but vague | Medium |
| **Overclaiming** | "14-60 day enforcement windows" -- this claim is not substantiated on the page | Medium |

**Brand Credibility Score: 4/10**

This is the weakest public-facing page. An evidence page with a factual error in its own headline is a credibility disaster for a platform that sells "governed analysis". The proof standard section is well-structured conceptually, but the execution undermines it completely.

---

## 4. Pricing / Product Pages

### What Visitors See

Pricing is embedded within the homepage and product pages, not on a dedicated pricing page. The `app/(dashboard)/pricing/page.tsx` is an admin-only price management interface, not public.

**Published price points** (from `lib/commercial/catalog.ts`):
- Decision Exposure Instrument: GBP 29
- Mandate Clarity Framework: GBP 49
- Intervention Path Selector: GBP 79
- Operator Decision Pack (bundle): GBP 129
- Global Market Intelligence Report: GBP 59
- Executive Reporting: GBP 295
- Strategy Room Entry: GBP 750
- Strategy Room Extended: GBP 1,250

### Assessment

**Strengths**:
- Prices are real and Stripe-integrated
- Price anchoring is logical (free diagnostic -> GBP 29-129 instruments -> GBP 295 reporting -> GBP 750+ strategy room)
- The escalation path makes commercial sense
- "No sale if the case is not ready" anti-selling is credible

**Issues**:

| Flag | Detail | Severity |
|------|--------|----------|
| **No dedicated pricing page** | Visitors must piece together pricing from scattered sections across the homepage | High |
| **Inconsistent terminology** | Products are called "instruments", "frameworks", "selectors", "packs" -- unclear categorisation for buyers | Medium |
| **Missing value justification** | Executive Reporting at GBP 295 and Strategy Room at GBP 750-1,250 lack outcome guarantees or service-level descriptions | Medium |

**Brand Credibility Score: 6/10**

The pricing is honest and the escalation logic is well-designed. A dedicated, clean pricing page would significantly improve conversion clarity.

---

## 5. Strategy Room (`pages/strategy-room/index.tsx`)

### What Visitors See

The Strategy Room is a gated page with multiple states:
- **Gate state**: Decision authority checks, system-level routing, constitutional intake form
- **Entry brief state**: Shows decision text, constraint, cost-of-delay, contradiction, confidence label
- **Execution state**: Active chamber with decision logs, AI interventions, escalation triggers

The page requires a paid entry (GBP 750 or GBP 1,250) and can block access based on diagnostic history.

### Assessment

**Strengths**:
- The gating logic is genuine -- the system can block entry if evidence does not warrant escalation
- Constitutional intake form collects meaningful data (revenue band, authority role, urgency window, market exposure)
- Decision state banner, consequence panels, and avoidance pattern notices show real system intelligence
- Execution flow with decision logs and feedback loops justifies premium pricing

**Issues**:

| Flag | Detail | Severity |
|------|--------|----------|
| **Internal jargon overload** | "Constitutional intake", "decision authority gate", "canonical sections", "evidence graph", "contagion map" -- this page is written for the developer, not the buyer | High |
| **Unearned authority** | "System position: escalation not justified" implies an authority that is really an algorithmic threshold | Medium |
| **Missing social proof** | No outcomes, testimonials, or case studies specific to Strategy Room results | High |
| **Template language** | Loading state shows "Decrypting_Strategic_Output..." with `.exe` references -- gamified hacker aesthetic clashes with institutional premium positioning | Medium |
| **Missing SLA** | GBP 750-1,250 with no stated response time, deliverable format, or satisfaction mechanism | High |

**Brand Credibility Score: 5/10**

The Strategy Room has genuine product depth, but the page does not communicate the value proposition clearly enough for GBP 750+. A visitor at this price point needs: clear deliverables, response time, what "strategy room access" actually includes, and evidence of past outcomes. The success page (`app/strategy-room/success/page.tsx`) uses startup-coded aesthetic ("Strategy_Dossier_#", "Coming_Soon.exe", "Recalibrate_Assessment") that undermines the institutional brand.

---

## 6. Footer & About / Trust Signals

### Footer (`components/EnhancedFooter.tsx`)

**Strengths**:
- Comprehensive directory with 5 columns covering all site sections
- Gateway cards for key products (Canon, Volumes, Library, Ventures, Strategy Room, Executive Reporting, Diagnostics, Events)
- Social channels properly linked
- Policy links present (Privacy, Terms, Security, Cookies)
- Brand statement: "A platform for disciplined thinking: doctrine, systems, and strategic execution"

**Issues**:

| Flag | Detail | Severity |
|------|--------|----------|
| **Inconsistent terminology** | "Secure inquiry" (footer CTA) vs "Submit enquiry" (contact form) vs "Begin the conversation" (section header) -- three different labels for the same action | Medium |
| **Orphaned legacy footer** | `components/layout/Footer.tsx` still exists with completely different styling ("Premium investment insights and strategies for Inner Circle members") and blue hover states -- identity crisis if rendered anywhere | Medium |
| **Template language** | "Score-based routing. Institutional gatekeeping." in Strategy Room gateway card description | Low |
| **Tag codes** | "DOC-V1", "PUB-V2", "LIB-V3", "STRAT-V1", "EXEC-V2", "DIAG-V3" -- internal version tags visible to public | Low |

### Founder Page (`pages/about/founder.tsx`)

**Strengths**:
- Named founder (Abraham Adaramola) with photo -- credible
- Proof links visible (Verify, Evidence, Trust, Foundations, Terms, Privacy)
- Positioning statement is clear: "Not a consultancy layer. Not advisory opinion."

**Issues**:

| Flag | Detail | Severity |
|------|--------|----------|
| **No credentials** | No professional background, qualifications, or career history provided | High |
| **No client logos** | No named organisations, industries served, or partnership signals | High |
| **Unearned authority** | The page establishes authority through philosophical positioning but provides no verifiable credentials | High |

**Brand Credibility Score: 5/10**

The footer is solid. The founder page is the single biggest credibility gap. A platform charging GBP 1,250 with no verifiable credentials, no named clients, and no professional background is asking for trust on faith. The philosophical positioning is well-written but insufficient for the price point.

---

## 7. Error / 404 Pages

### What Exists

- `app/briefs/[slug]/not-found.tsx`: "Briefing Not Found" -- branded, dark theme, "ABRAHAM OF LONDON // BRIEFING ARCHIVE" header
- `app/admin/campaigns/[id]/not-found.tsx`: Admin-only not-found
- `components/NotFound.tsx`: Generic "Briefing Not Found" component

### What Does NOT Exist

- **No root `app/not-found.tsx`** -- the platform falls back to Next.js default 404
- **No root `app/error.tsx`** -- the platform falls back to Next.js default error page

### Assessment

| Flag | Detail | Severity |
|------|--------|----------|
| **Missing root 404** | No branded 404 page at the app level -- visitors hitting dead links see a Next.js default | High |
| **Missing error page** | No branded error boundary at the app level | High |
| **Inconsistent language** | `NotFound.tsx` says "intelligence brief could not be located in the archive" -- visitors do not know what an "archive" is | Low |

**Brand Credibility Score: 3/10**

A premium platform must never show framework defaults. Both root-level `not-found.tsx` and `error.tsx` must be created with on-brand styling and helpful navigation.

---

## Cross-Cutting Issues

### Inconsistent Terminology (Platform-Wide)

The same concepts are called different things across pages:

| Concept | Variants Used |
|---------|---------------|
| Contact action | "Secure inquiry", "Submit enquiry", "Begin the conversation", "Contact" |
| Products | "Instruments", "Frameworks", "Selectors", "Packs", "Tools", "Deployables" |
| Content | "Canon", "Doctrine", "Editorials", "Publications", "Volumes", "Library", "Archive" |
| Premium access | "Strategy Room", "Private mandate", "Select mandates", "Qualified access" |
| Assessment | "Diagnostic", "Assessment", "Constitutional intake", "Decision Check" |
| Evidence | "Case evidence", "Outcome-verified cases", "Case dossiers", "Proof" |

### Internal Jargon Leaking

Terms visible to public visitors that require insider knowledge:
- "Canon-derived"
- "Constitutional diagnostic"
- "Contagion map"
- "Decision authority gate"
- "Evidence graph"
- "Governed analysis"
- "Canonical sections"
- "Operator doctrine"

### Overclaiming Summary

| Claim | Location | Verdict |
|-------|----------|---------|
| "5 outcome-verified cases" | Evidence page | **False** -- 3 displayed, 8 exist |
| "Governed review" | Homepage, diagnostic results | **Misleading** -- no external governance body |
| "Auditable at system level" | Evidence page | **Unverifiable** by visitors |
| "Institutional-grade strategy" | Service lines | **Unearned** -- no institutional clients named |
| "Board-grade interpretation" | Footer gateway card | **Unearned** -- no board-level credentials shown |
| "GBP 420,000 exposure" | Homepage specimen | **Fabricated example** -- could mislead |

---

## Score Summary

| Page | Score | Key Issue |
|------|-------|-----------|
| Homepage | 7/10 | Vocabulary density, jargon |
| Diagnostics (Fast) | 8/10 | Generic fallback text, "governed" claim |
| Evidence | 4/10 | **Factual error in headline claim** |
| Pricing/Products | 6/10 | No dedicated page, scattered |
| Strategy Room | 5/10 | Jargon overload, missing SLA for premium price |
| Footer/About | 5/10 | No founder credentials, no client proof |
| Error/404 | 3/10 | Missing root-level pages entirely |

**Overall Platform Brand Credibility: 5.4/10**

### Priority Fixes (Ranked)

1. **CRITICAL**: Fix evidence page -- update count to match displayed cases, or surface all 8 MDX evidence files
2. **HIGH**: Create root `app/not-found.tsx` and `app/error.tsx` with branded styling
3. **HIGH**: Add founder credentials, professional background, or verifiable proof points to `/about/founder`
4. **HIGH**: Create a dedicated public pricing page with clear deliverables per tier
5. **HIGH**: Add Strategy Room SLA, deliverable description, and outcome evidence
6. **MEDIUM**: Standardise terminology -- pick one word per concept and enforce it
7. **MEDIUM**: Replace "governed analysis" with honest framing (e.g., "structured analysis" or "system-generated analysis")
8. **MEDIUM**: Remove legacy footer (`components/layout/Footer.tsx`) that conflicts with brand
9. **MEDIUM**: Remove hacker-aesthetic text from Strategy Room success page ("Coming_Soon.exe", "Decrypting_Strategic_Output...")
10. **LOW**: Remove internal version tags from footer gateway cards ("DOC-V1", etc.)
