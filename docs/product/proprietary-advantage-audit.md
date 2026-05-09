# Proprietary Advantage Audit — Full Ladder, Full Codebase, Full Moat

**Date:** 9 May 2026
**Method:** Hostile, imagination-led audit of every surface, engine, data model, and product journey.
**Standard:** If a serious competitor could add this after launch and use it to bury us, find it first.

---

## Workstream 1 — Full Ladder Experience Advantage Audit

### 1. Fast Diagnostic

| Dimension | Assessment |
|-----------|------------|
| Dominant user job | Name a stuck decision and get a label for why it's stuck |
| User emotion | Frustrated, vaguely uncomfortable, looking for clarity |
| What it makes them understand | The condition class (authority/definition/execution/instability) |
| What it fails to make them do | Return after 48 hours to report what happened |
| One action it should drive | **Commit → Act → Report → Learn** (the loop is not closed) |
| Memory it should create | "The system predicted I wouldn't act. It was right." |
| Downstream inheritance | Checkpoint outcome should feed back into the next Fast Diagnostic |
| Too dense | Now compressed to 7 sections — good |
| Too weak | No "what changed since last time" comparison |
| Hidden value | The commitment question is a behavioural intervention disguised as a feature |
| Competitor gap | No competitor has a checkpoint system that tracks whether you acted |

**Proprietary opportunity: P0 — CATEGORY-DEFINING**
Build a "Decision Velocity" metric: time from diagnosis → commitment → action → outcome. Show users their personal decision velocity score. Compare against anonymised cohort. This turns a one-off diagnostic into a **performance tracking system**.

**Files involved:** `pages/api/diagnostics/score.ts`, `lib/product/checkpoint-service.ts`, new `lib/analytics/decision-velocity.ts`, `pages/diagnostics/fast.tsx` result section.

---

### 2. Purpose Alignment / Personal Decision Audit

| Dimension | Assessment |
|-----------|------------|
| Dominant user job | Discover whether their struggle is personal or structural |
| User emotion | Introspective, slightly defensive |
| What it makes them understand | Their coherence band and weakest domain |
| What it fails to make them do | Re-test after making the required move |
| One action it should drive | **Name the competing obligation and remove it** |
| Memory it should create | "I rated my identity clarity as 9/10 but my certainty as 2/10" |
| Downstream inheritance | Competing obligation and consequence now flow to ER, SR, Return Brief, Decision Centre |
| Too dense | The result page is still abstract ("Coherence band: DRIFTING") |
| Too weak | No trend line — can't see if alignment is improving |
| Hidden value | The dual-axis scoring (resonance × certainty) is genuinely novel |
| Competitor gap | No competitor detects self-deception patterns |

**Proprietary opportunity: P1 — HIGH**
Add a **Purpose Alignment trend chart** showing coherence band movement over time. If a user completes PA multiple times, show whether they're improving. This turns a one-time assessment into a **personal decision fitness tracker**.

**Files involved:** `lib/alignment/evidence-loader.ts`, new `components/alignment/AlignmentTrendChart.tsx`, `pages/diagnostics/purpose-alignment.tsx` result section.

---

### 3. Constitutional Diagnostic

| Dimension | Assessment |
|-----------|------------|
| Dominant user job | Determine governance posture and escalation readiness |
| User emotion | Cautious, analytical |
| What it makes them understand | Their route (STRATEGY/DIAGNOSTIC/REJECT) |
| What it fails to make them do | Act on the route decision |
| One action it should drive | **Enter the next correct surface based on route** |
| Memory it should create | "The system told me I wasn't ready to escalate. It was right." |
| Downstream inheritance | Route feeds ER admission, SR access, Oversight signals |
| Too dense | The instrument spec panel is excellent but the result is buried |
| Too weak | No "what would change my route" guidance |
| Hidden value | The REJECT route is a genuine governance mechanism — most systems never say no |
| Competitor gap | No competitor has a governed "no" — they all say yes to get the sale |

**Proprietary opportunity: P1 — HIGH**
Surface the **REJECT route as a product differentiator**. Most consulting tools never say "you're not ready." Build a "What would change my route" interactive section that shows exactly what evidence is needed to move from REJECT → DIAGNOSTIC → STRATEGY.

**Files involved:** `components/diagnostics/ConstitutionalDiagnostic.tsx` result section, `lib/diagnostics/constitutional-bridge.ts`.

---

### 4. Team Assessment

| Dimension | Assessment |
|-----------|------------|
| Dominant user job | Measure perception gap between leader and team |
| User emotion | Anxious (leader), cautious (team member) |
| What it makes them understand | Where their perception diverges from reality |
| What it fails to make them do | Invite their team |
| One action it should drive | **Invite team members** |
| Memory it should create | "I thought my team saw it my way. They don't." |
| Downstream inheritance | Gap analysis feeds ER, divergence feeds Oversight |
| Too dense | The result page has good structure |
| Too weak | The invite flow is admin-routed and unclear |
| Hidden value | The perception gap is the strongest predictor of execution failure |
| Competitor gap | No competitor measures leader-vs-team perception gap as a diagnostic |

**Proprietary opportunity: P2 — MEDIUM**
Build a **one-click invite flow** that generates a shareable link (no account required for respondents). Show a live response tracker. This removes the biggest adoption barrier.

**Files involved:** `pages/diagnostics/team-assessment.tsx`, new `pages/api/team/invite.ts`, `lib/alignment/campaign-actions.ts`.

---

### 5. Enterprise Assessment

| Dimension | Assessment |
|-----------|------------|
| Dominant user job | Map institutional risk posture |
| User emotion | Strategic, concerned about organisational health |
| What it makes them understand | Enterprise strain, leadership disagreement, signal trustworthiness |
| What it fails to make them do | Act on the institutional findings |
| One action it should drive | **Enter Executive Reporting or WATCH monitoring** |
| Memory it should create | "The institution is carrying more strain than leadership acknowledges." |
| Downstream inheritance | Enterprise reading feeds ER admission and Oversight signals |
| Too dense | Appropriate for the audience |
| Too weak | No cross-organisation benchmark |
| Hidden value | The WATCH classification is honest — most systems would upsell |
| Competitor gap | No competitor does multi-layer institutional assessment |

**Proprietary opportunity: P2 — MEDIUM**
Add **anonymised cross-organisation benchmarking**. Show "your governance reliability score is in the 32nd percentile for organisations of your size/sector." This turns a private assessment into a competitive intelligence tool.

**Files involved:** `lib/diagnostics/enterprise-aggregation.ts`, new benchmark aggregation queries, `pages/diagnostics/enterprise-assessment.tsx` result section.

---

### 6. Executive Reporting

| Dimension | Assessment |
|-----------|------------|
| Dominant user job | Get a board-grade governed brief with priced consequence |
| User emotion | Serious, investing time and money |
| What it makes them understand | Financial exposure, priority stack, trajectory |
| What it fails to make them do | Accept the priority and enter execution |
| One action it should drive | **Accept the priority stack → Enter Strategy Room** |
| Memory it should create | "The system priced what I was avoiding." |
| Downstream inheritance | Canonical report feeds SR, Boardroom, Oversight, Retainer |
| Too dense | 18 blocks — needs compression to 7 like Fast Diagnostic |
| Too weak | No preview mechanism — users pay before seeing value |
| Hidden value | The priority stack is the most useful single output in the product |
| Competitor gap | No competitor produces a governed priority stack with financial exposure |

**Proprietary opportunity: P0 — CATEGORY-DEFINING**
The Executive Reporting result page needs the same compression treatment as Fast Diagnostic. 18 blocks → 7 sections. Required move (accept/challenge priority) promoted to position 3. Evidence & governance collapsed below the fold. This is the paid flagship — it must be the clearest surface in the product.

**Files involved:** `pages/diagnostics/executive-reporting/run.tsx` — `ResultSurface` function.

---

### 7. Boardroom Mode

| Dimension | Assessment |
|-----------|------------|
| Dominant user job | Generate a board-grade decision dossier |
| User emotion | Under pressure, needs to present to board |
| What it makes them understand | That a dossier exists |
| What it fails to make them do | Download and deliver it |
| One action it should drive | **Download PDF → Send to board** |
| Memory it should create | "I walked into the boardroom with a system-generated dossier." |
| Downstream inheritance | Dossier should feed boardroom archive |
| Too dense | N/A — barely surfaced |
| Too weak | No standalone page, no clean PDF download, no send-to-board workflow |
| Hidden value | The dossier content (sections, objections, decision paths) is genuinely board-grade |
| Competitor gap | No competitor produces boardroom dossiers |

**Proprietary opportunity: P0 — CATEGORY-DEFINING**
Build a standalone `/boardroom/[sessionId]` page with one-click PDF download and "deliver to board" email workflow. This turns a hidden feature into a flagship deliverable.

**Files involved:** New `pages/boardroom/[sessionId].tsx`, `app/api/executive-reporting/export/boardroom-pdf/route.ts`, new email delivery flow.

---

### 8. Strategy Room Entry

| Dimension | Assessment |
|-----------|------------|
| Dominant user job | Begin governed execution |
| User emotion | Ready to act, needs structure |
| What it makes them understand | What evidence is carried forward |
| What it fails to make them do | Execute the first intervention immediately |
| One action it should drive | **Execute the first intervention** |
| Memory it should create | "The system is watching whether I act." |
| Downstream inheritance | Execution state feeds Return Brief, Oversight, Retainer |
| Too dense | 8 sections — FirstActionPrompt should be hero |
| Too weak | FirstActionPrompt is a small 2-column panel |
| Hidden value | The enforcement state system (directive, consequence, avoidance) is sophisticated |
| Competitor gap | No competitor has a governed execution environment |

**Proprietary opportunity: P1 — HIGH**
Promote FirstActionPrompt to the hero position. Show the enforcement state (directive, consequence, avoidance) as a dashboard, not a list. Add a prominent "Execute Now" button that creates a checkpoint.

**Files involved:** `pages/strategy-room/index.tsx` — reorder sections, promote FirstActionPrompt.

---

### 9. Strategy Room Session

| Dimension | Assessment |
|-----------|------------|
| Dominant user job | Track and record decision execution |
| User emotion | Under scrutiny, accountable |
| What it makes them understand | Their decision state (blocked/pending/executed) |
| What it fails to make them do | Record decisions consistently |
| One action it should drive | **Record the outcome of each decision** |
| Memory it should create | "Every decision I make is tracked." |
| Downstream inheritance | Decision log feeds Return Brief, Oversight, Counsel |
| Too dense | The session page is a wall of text |
| Too weak | No visual decision timeline |
| Hidden value | The decision log is a complete audit trail |
| Competitor gap | No competitor has a governed decision log |

**Proprietary opportunity: P1 — HIGH**
Add a **decision timeline** visualisation showing each decision as a card on a timeline, colour-coded by status (executed/blocked/abandoned). This turns a text log into a visual execution record.

**Files involved:** `pages/strategy-room/session/[id].tsx`, new `components/strategy-room/DecisionTimeline.tsx`.

---

### 10. Return Brief

| Dimension | Assessment |
|-----------|------------|
| Dominant user job | Be confronted with unresolved decisions |
| User emotion | Defensive, then accountable |
| What it makes them understand | What they committed to and didn't do |
| What it fails to make them do | Respond to the checkpoint |
| One action it should drive | **Respond: completed, blocked, or abandoned** |
| Memory it should create | "The system remembers what I said I would do." |
| Downstream inheritance | Response feeds Decision Centre, Oversight, Counsel |
| Too dense | Well-structured — gold standard surface |
| Too weak | No email delivery — user must visit the site |
| Hidden value | The confrontation mechanism is the most behaviourally effective surface |
| Competitor gap | No competitor has a return brief that confronts inaction |

**Proprietary opportunity: P0 — CATEGORY-DEFINING**
Add **email delivery of Return Briefs** when triggers fire. The brief should be readable in email with a one-click response link. This turns a site-visit-only feature into a push-based governance system.

**Files involved:** New email template, `lib/email/templates/return-brief.ts`, trigger service integration.

---

### 11. Decision Centre

| Dimension | Assessment |
|-----------|------------|
| Dominant user job | See all active cases in one place |
| User emotion | Overwhelmed (multiple cases), or empty (no cases) |
| What it makes them understand | What cases exist and their status |
| What it fails to make them do | Act on the highest-priority case |
| One action it should drive | **Act on the most urgent case** |
| Memory it should create | "I know which case needs my attention most." |
| Downstream inheritance | Case status feeds Oversight, Retainer, Counsel |
| Too dense | Case cards are information-dense |
| Too weak | No cross-case prioritisation |
| Hidden value | The checkpoint system creates a natural priority queue |
| Competitor gap | No competitor has a multi-case decision console |

**Proprietary opportunity: P1 — HIGH**
Add **cross-case prioritisation** — rank cases by severity, cost, urgency, and checkpoint status. Show a "most urgent case" callout at the top. This turns a display console into an action console.

**Files involved:** `pages/api/decision-centre/cases.ts` — add priority ranking, `pages/decision-centre.tsx` — add priority callout.

---

### 12. Oversight Brief

| Dimension | Assessment |
|-----------|------------|
| Dominant user job | Periodic governance review for retainer clients |
| User emotion | Accountable, being governed |
| What it makes them understand | What changed, what worsened, what repeated |
| What it fails to make them do | Approve or challenge the cycle |
| One action it should drive | **Approve the cycle or challenge findings** |
| Memory it should create | "The system is watching even when I'm not." |
| Downstream inheritance | Cycle outcome feeds retainer renewal, counsel escalation |
| Too dense | Dense but appropriate for the audience |
| Too weak | No email delivery |
| Hidden value | The cancellation loss section is a genuine retention mechanism |
| Competitor gap | No competitor produces periodic governed oversight briefs |

**Proprietary opportunity: P1 — HIGH**
Add **email delivery of Oversight Briefs** with one-click approve/challenge. Add a cycle comparison chart showing key metrics over time. This turns a site-visit feature into a push-based governance rhythm.

**Files involved:** New email template, `lib/email/templates/oversight-brief.ts`, cycle comparison component.

---

### 13. Counsel Room

| Dimension | Assessment |
|-----------|------------|
| Dominant user job | Request human counsel when system cannot model the condition |
| User emotion | Relieved that escalation is governed, not random |
| What it makes them understand | Why counsel is warranted (evidence package) |
| What it fails to make them do | Submit the intake |
| One action it should drive | **Submit structured intake** |
| Memory it should create | "My case was reviewed with full context, not a blank form." |
| Downstream inheritance | Counsel case feeds operator review, retainer status |
| Too dense | Well-structured |
| Too weak | No counsel case status tracking after submission |
| Hidden value | The evidence package prefill is a genuine moat |
| Competitor gap | No competitor has a governed counsel escalation workflow |

**Proprietary opportunity: P1 — HIGH**
Add **counsel case status tracking** — show the user where their case is in the workflow (REQUESTED → EVIDENCE_REVIEW → ACCEPTED → IN_REVIEW → RESPONSE_READY → CLOSED). Add notification when status changes.

**Files involved:** `pages/counsel/status.tsx`, `lib/product/counsel-case-service.ts`, notification service.

---

## Workstream 2 — Data Compounding Advantage

### What exists now
- Evidence spine persists every stage to DiagnosticJourney
- Checkpoint system tracks commitments and outcomes
- Decision memory tracks patterns across sessions
- Financial exposure snapshots are persisted
- Cost of inaction projections are persisted

### What is underused
- **Cross-session pattern aggregation** — pattern recurrence works per-case but there's no aggregate view
- **Decision velocity tracking** — time from diagnosis to action is computable but not surfaced
- **Cohort comparison** — anonymised benchmarks exist in the benchmark system but are not user-facing
- **Trend visualisation** — coherence band, contradiction frequency, escalation trajectory over time

### Proprietary opportunities

**P0 — CATEGORY-DEFINING: Decision Velocity Score**
Track: time from Fast Diagnostic → checkpoint created → checkpoint response → outcome. Show users their personal decision velocity. Compare against anonymised cohort. This turns a diagnostic tool into a **performance tracking system** that gets more valuable the longer it's used.

**Files:** New `lib/analytics/decision-velocity.ts`, `pages/diagnostics/fast.tsx` result section, `pages/decision-centre.tsx` velocity display.

**P1 — HIGH: Institutional Memory Page**
Build `/intelligence/memory` showing aggregated patterns across all user sessions: coherence band over time, contradiction frequency, escalation trajectory, decision velocity trend, checkpoint response rate. This is the "what the system has learned about you" page.

**Files:** New `pages/intelligence/memory.tsx`, `lib/analytics/pattern-aggregation.ts`.

**P1 — HIGH: Anonymised Benchmarking**
Show users where they rank against anonymised peers: "Your decision velocity is in the 34th percentile. Your checkpoint response rate is in the 72nd percentile." This creates competitive pressure and retention.

**Files:** `lib/benchmarks/benchmark-engine.ts`, new benchmark queries, surface integration.

---

## Workstream 3 — Pricing & Commercial Leverage

### What exists now
- Executive Reporting is paid (one-off)
- Strategy Room is paid (one-off or retainer)
- Oversight Brief is retainer-only
- Fast Diagnostic, Purpose Alignment, Constitutional are free

### What is underused
- **No usage-based pricing** — no connection between how much the system is used and what it costs
- **No outcome-based pricing** — no connection between system output and user outcome
- **No tiered access** — all-or-nothing for most surfaces
- **No trial-to-paid conversion path** — users go from free diagnostics straight to paid ER with no intermediate step

### Proprietary opportunities

**P1 — HIGH: Evidence-Based Pricing Tier**
Create a "Professional" tier between free diagnostics and paid ER. Includes: unlimited Fast Diagnostics, Purpose Alignment trend tracking, Decision Centre with cross-case prioritisation, checkpoint system with email reminders. Price at £X/month. This creates a conversion path from free → paid monthly → paid one-off ER.

**Files:** New pricing configuration, entitlement checks, surface gating.

**P2 — MEDIUM: Outcome-Based Pricing (Future)**
When the outcome verification loop is mature, offer pricing based on verified improvement: "Pay per percentage point of decision velocity improvement." This is the endgame pricing model and would be impossible for competitors to replicate without the same data infrastructure.

**Files:** Future — requires mature outcome verification.

---

## Workstream 4 — Switching Cost & Retention Moat

### What exists now
- Evidence spine persists all data
- Checkpoint system creates ongoing commitments
- Return Brief creates periodic confrontation
- Oversight Brief creates periodic governance
- Counsel Room creates escalation dependency

### What is underused
- **No data export** — user cannot download their evidence package
- **No "what you would lose" calculator** — no explicit switching cost communication
- **No integration with external tools** — no calendar, email, Slack, or CRM integration
- **No team/org dependency** — individual users can leave without organisational friction

### Proprietary opportunities

**P1 — HIGH: Data Export + Switching Cost Communication**
Build a data export page that shows everything the system knows about the user. Include a "what you would lose if you leave" section that calculates: accumulated evidence, pattern history, decision velocity trend, checkpoint commitments, oversight cycles. This makes switching feel like data loss.

**Files:** New `pages/account/export.tsx`, `lib/product/data-export-service.ts`.

**P2 — MEDIUM: External Integrations**
Build calendar integration (auto-schedule checkpoints), email integration (Return Brief delivery), Slack integration (checkpoint reminders). Each integration increases switching cost.

**Files:** New integration service layer.

---

## Workstream 5 — Proof & Narrative Generation

### What exists now
- Evidence spine has all the data
- Checkpoint system has outcome data
- Decision memory has pattern data

### What is underused
- **No automated case study generation** — the system could generate anonymised case studies from real outcomes
- **No "proof pack"** — no downloadable summary of what the system has achieved for the user
- **No narrative engine** — no ability to tell the story of the user's decision journey

### Proprietary opportunities

**P1 — HIGH: Automated Proof Pack**
Generate a downloadable "Decision Infrastructure Proof Pack" showing: diagnostics completed, contradictions detected, checkpoints responded to, outcomes achieved, patterns identified, escalation history. This is a retention and upsell tool.

**Files:** New `lib/product/proof-pack-generator.ts`, new PDF template.

**P2 — MEDIUM: Anonymised Case Study Pipeline**
When outcome verification is mature, automatically generate anonymised case studies from real user journeys. This is marketing content that no competitor can replicate without the same data.

**Files:** New case study generation pipeline.

---

## Workstream 6 — Operator & Admin Advantage

### What exists now
- Admin counsel review surface exists
- Admin oversight review surface exists
- Operator can assign counsel, review evidence, submit counsel response

### What is underused
- **No operator dashboard** — no single view of all active counsel cases, pending checkpoints, escalation triggers
- **No operator notification** — operator must visit the admin panel to see new cases
- **No operator workflow automation** — no auto-assignment, auto-escalation, auto-reminder

### Proprietary opportunities

**P2 — MEDIUM: Operator Command Centre**
Build a single-pane-of-glass operator dashboard showing: open counsel cases, pending checkpoints, escalation triggers, overdue items, retainer status. Add notification when new cases arrive.

**Files:** New `pages/admin/command-centre.tsx`.

---

## Workstream 7 — Hidden Capabilities Audit

### Capabilities that exist but are hidden or underused

| Capability | Location | Current visibility | Opportunity |
|-----------|----------|-------------------|-------------|
| Dual-axis scoring (resonance × certainty) | `lib/alignment/intelligence-engine.ts` | Used in PA result only | Surface as "self-deception index" |
| REJECT route | `lib/decision/case-object.ts` | Internal only | Market as "the system that says no" |
| Evidence posture labels | `lib/product/governed-memory-contract.ts` | Internal only | Surface as "evidence confidence meter" |
| Checkpoint response rate | `lib/product/checkpoint-service.ts` | Not surfaced | Surface as "commitment reliability score" |
| Pattern recurrence detection | `lib/product/pattern-recurrence.ts` | Used in Return Brief only | Surface as "pattern frequency dashboard" |
| Cancellation loss calculation | `lib/product/oversight-brief-composer.ts` | Oversight Brief only | Surface as "what you would lose" calculator |
| Irreversibility index | `lib/product/oversight-brief-composer.ts` | Oversight Brief only | Surface in Decision Centre |
| Strategic option decay | `lib/product/oversight-brief-composer.ts` | Oversight Brief only | Surface in Decision Centre |
| Organisation divergence | `lib/product/control-room-state-loader.ts` | No UI surface | Surface in Executive Reporting |
| Boardroom qualification | `lib/constitution/boardroom-mode.ts` | ER result page only | Surface as "boardroom readiness score" |

---

## Workstream 8 — Competitive Moat Assessment

### Moats that exist now

| Moat | Strength | Notes |
|------|----------|-------|
| Evidence spine | STRONG | 80 fields across 8 stages, persisted, retrieved, rendered |
| Checkpoint system | STRONG | 7 surfaces RUNTIME_CONFIRMED, full lifecycle |
| Dual-axis scoring | MODERATE | Novel but not patented — competitors could replicate |
| Governed memory system | STRONG | Source-labelled, dated, safety-checked rendering |
| Counsel escalation workflow | MODERATE | New — needs maturity |
| Boardroom dossier generation | WEAK | Exists but no standalone delivery |
| Outcome verification | WEAK | Schema exists, no user-facing flow |

### Moats that should be built

**P0 — CATEGORY-DEFINING: Decision Velocity Tracking**
Time from diagnosis → action → outcome. This is a data moat — the longer a user stays, the more velocity data accumulates. A competitor cannot replicate this without years of user data.

**P0 — CATEGORY-DEFINING: Outcome Verification Loop**
Diagnose → Act → Verify → Learn. This is a data moat AND a switching cost moat. Once a user has verified outcomes, leaving means losing that evidence.

**P1 — HIGH: Anonymised Benchmarking**
Cross-organisation benchmarks. This is a data network effect moat — the more users, the better the benchmarks. A competitor cannot replicate without a user base.

**P1 — HIGH: Pattern Recurrence Database**
Cross-user pattern detection. This is an AI/data moat — the system gets better at detecting patterns the more users it sees.

---

## Workstream 9 — Risk Assessment

### Overexposed or dangerous

| Risk | Severity | Mitigation |
|------|----------|------------|
| Dual-axis scoring could be reverse-engineered | MEDIUM | Scoring logic is server-only, but the concept is visible |
| Checkpoint system could be gamed | LOW | Server-side validation, email-based identity |
| Counsel intake contains sensitive text | MEDIUM | Text is stored in DiagnosticRecord — needs clear retention policy |
| Boardroom dossiers contain system output presented as fact | HIGH | All financial exposure labelled as estimated, not verified |
| Outcome claims without verification loop | HIGH | No surface should claim "improvement" without verified outcome data |

---

## Workstream 10 — Execution Priority

### P0 — Build Now (CATEGORY-DEFINING)

| # | Opportunity | Effort | Impact |
|---|-------------|--------|--------|
| 1 | Decision Velocity Score — track + surface time from diagnosis to action | Medium | CATEGORY-DEFINING |
| 2 | Executive Reporting result compression (18 → 7 sections) | Medium | HIGH |
| 3 | Boardroom Mode standalone page + PDF download | High | CATEGORY-DEFINING |
| 4 | Outcome verification loop (check-in flow at 14/30/60/90 days) | High | CATEGORY-DEFINING |
| 5 | Email delivery of Return Briefs | Medium | HIGH |

### P1 — Build Next (HIGH)

| # | Opportunity | Effort | Impact |
|---|-------------|--------|--------|
| 6 | Institutional Memory page (`/intelligence/memory`) | Medium | HIGH |
| 7 | Anonymised benchmarking | High | HIGH |
| 8 | Purpose Alignment trend chart | Low | HIGH |
| 9 | Strategy Room FirstActionPrompt as hero | Low | HIGH |
| 10 | Decision timeline in Strategy Room session | Medium | HIGH |
| 11 | Cross-case prioritisation in Decision Centre | Medium | HIGH |
| 12 | Counsel case status tracking | Low | HIGH |
| 13 | Evidence-based pricing tier | Medium | HIGH |
| 14 | Data export + switching cost communication | Medium | HIGH |
| 15 | Automated Proof Pack generation | Medium | HIGH |

### P2 — Build When Capacity Allows (MEDIUM)

| # | Opportunity | Effort | Impact |
|---|-------------|--------|--------|
| 16 | One-click team invite flow | Medium | MEDIUM |
| 17 | Cross-organisation benchmarking | High | MEDIUM |
| 18 | REJECT route as product differentiator | Low | MEDIUM |
| 19 | Operator Command Centre | Medium | MEDIUM |
| 20 | External integrations (calendar, email, Slack) | High | MEDIUM |
| 21 | Anonymised case study pipeline | High | MEDIUM |

### P3 — Future (LOW)

| # | Opportunity | Effort | Impact |
|---|-------------|--------|--------|
| 22 | Outcome-based pricing | Very High | CATEGORY-DEFINING (future) |
| 23 | Self-deception index | Low | MEDIUM |
| 24 | Commitment reliability score | Low | MEDIUM |
| 25 | Boardroom readiness score | Low | MEDIUM |

---

## Summary

The product has **real moats** (evidence spine, checkpoint system, governed memory, dual-axis scoring) and **real engines** (diagnostic, synthesis, escalation, oversight). The biggest opportunities are not in building new engines — they are in:

1. **Closing the outcome verification loop** — without this, every claim about improvement is speculation
2. **Surfacing hidden data as product features** — decision velocity, pattern recurrence, benchmarks, trends
3. **Compressing dense surfaces** — Executive Reporting result page needs the same treatment as Fast Diagnostic
4. **Building delivery mechanisms** — email, PDF, push notifications — so the system reaches users where they live
5. **Creating switching costs** — data export, evidence packages, verified outcomes — so leaving feels like data loss

The single highest-leverage opportunity is **Decision Velocity Tracking**: time from diagnosis → commitment → action → outcome, surfaced as a personal metric with cohort comparison. This turns a diagnostic tool into a performance tracking system that gets more valuable the longer it's used. No competitor can replicate this without the same checkpoint infrastructure and years of user data.

---

## Deeper Audit — What Was Missed

After the main audit, a deeper examination of the engine layer revealed additional assets that are more valuable than anything surfaced in the ladder.

### 1. The Contradiction Graph — Most Underused Asset in the Codebase

**What exists:** `lib/engine/contradiction-graph.ts` (367 lines). A directed graph storing nodes (signals, contradictions, decisions, outcomes, constraints) and edges (contradicts, depends_on, amplifies, blocks, resolves). The graph gets stronger with every use and weaker when ignored — unresolved contradictions compound in severity over time.

**What's hidden:** This is a **temporal contradiction database** that tracks not just what contradicts what, but how contradictions evolve. A contradiction at severity 5 becomes severity 7 after 30 days of inaction. The system literally gets more aggressive when ignored.

**Current usage:** Internal only — used by the Decision Kernel but never exposed as a user-facing feature. No surface shows the contradiction graph or contradiction evolution over time.

**Proprietary opportunity — P0 CATEGORY-DEFINING:**
Build a **Contradiction Graph Visualiser** — an interactive graph showing the user's active contradictions, how they relate, how severity has changed over time, and which ones are approaching irreversibility. This would be the most visually distinctive surface in the entire product category. No competitor has anything like it.

**Files:** `lib/engine/contradiction-graph.ts` (exists), new `pages/intelligence/contradiction-graph.tsx`, new `components/graph/ContradictionGraphVisualisation.tsx`

---

### 2. The Arbiter Tournament — Market Differentiator No One Sees

**What exists:** `lib/decision/arbiter-tournament.ts` (203 lines). Five mandatory rules that validate LLM synthesis output. If any rule fails, synthesis is rejected and the user sees the mismatch. The code explicitly documents this as "a market differentiator."

**What's hidden:** The arbiter rejection message is buried in the collapsible evidence section of the Fast Diagnostic result. The arbiter's existence as a quality control mechanism is never communicated to the user.

**Proprietary opportunity — P1 HIGH:**
Surface the Arbiter Tournament as a **trust signal**. Show "This analysis passed 5/5 quality checks" or "This analysis was challenged by the arbiter and corrected." This turns an internal quality mechanism into a market-facing trust differentiator.

**Files:** `lib/decision/arbiter-tournament.ts` (exists), `pages/diagnostics/fast.tsx` result section, new `components/trust/ArbiterBadge.tsx`

---

### 3. The Decision Kernel's Self-Auditing Capability

**What exists:** `lib/decision/kernel.ts` (386 lines). The kernel evaluates decisions, accumulates evidence in a contradiction graph, detects cross-assessment interference, applies decay-aware enforcement, and computes its own prediction accuracy. The code comments explicitly state this is "irreplicable."

**What's hidden:** The kernel computes its own accuracy but this is never shown to the user. After enough outcomes, the kernel knows its bias (over-predicts vs under-predicts) and auto-corrects. This is a genuine AI/data moat.

**Proprietary opportunity — P0 CATEGORY-DEFINING:**
Build a **System Accuracy Dashboard** showing: prediction accuracy over time, bias correction history, contradiction graph size, cross-assessment interference detections. This turns an internal quality mechanism into a market-facing trust signal.

**Files:** `lib/decision/kernel.ts` (exists), new `pages/intelligence/accuracy.tsx`, new `lib/analytics/kernel-accuracy.ts`

---

### 4. Cross-Assessment Interference Detection — Most Sophisticated Engine in the Product

**What exists:** The Decision Kernel detects when signals from different assessments contradict each other. Purpose Alignment says "strong identity" but Constitutional says "authority is unclear" — the kernel detects that cross-assessment contradiction. No single-assessment tool can do this.

**Current usage:** Internal only. Used by the kernel but never surfaced.

**Proprietary opportunity — P0 CATEGORY-DEFINING:**
Surface cross-assessment contradictions as a **"System Intelligence"** feature. Show "Your Purpose Alignment and Constitutional Diagnostic disagree on authority clarity. This contradiction suggests the issue is not personal authority but structural governance." This is the single most powerful insight the system can produce and it's completely hidden.

**Files:** `lib/decision/kernel.ts` (exists), new surface integration.

---

### 5. The Irreversibility Index — Computed but Barely Surfaced

**What exists:** `lib/product/irreversibility-index.ts` (171 lines). Computes irreversibility from option decay, authority window closing, consequence materialising, trust erosion, competitive position loss, regulatory deadlines, contract expiry, execution failure patterns.

**Current usage:** Only surfaced in the Oversight Brief (retainer-only surface). Not shown in Decision Centre, Executive Reporting, or Strategy Room.

**Proprietary opportunity — P1 HIGH:**
Surface irreversibility score in Decision Centre case cards and Executive Reporting. Show trend: "Irreversibility has increased from MODERATE to HIGH over the last 30 days." This creates urgency and drives action.

**Files:** `lib/product/irreversibility-index.ts` (exists), `pages/decision-centre.tsx`, `pages/diagnostics/executive-reporting/run.tsx`

---

### 6. Portfolio Pattern Memory — Exists with No UI

**What exists:** `lib/product/portfolio-pattern-memory.ts` (57 lines). Detects shared contradiction patterns across organisations in a portfolio. Can identify when multiple organisations under the same portfolio show the same recurring pattern.

**Current usage:** No UI surface. The logic exists but nothing renders it.

**Proprietary opportunity — P2 MEDIUM:**
Build a portfolio-level dashboard for operators managing multiple organisations. Show shared patterns, cross-organisation divergence, and portfolio-wide escalation signals.

**Files:** `lib/product/portfolio-pattern-memory.ts` (exists), new operator dashboard.

---

### 7. Organisation Divergence — Computed but Not Surfaced

**What exists:** `lib/product/organisation-divergence-summary.ts`. Computes how organisations diverge across perception, priority, and execution.

**Current usage:** Loaded by Control Room state loader but no visible UI surface.

**Proprietary opportunity — P2 MEDIUM:**
Surface organisation divergence in Executive Reporting when multi-user data exists. Show "Your leadership-team perception gap has widened by 12% since last quarter."

---

### 8. No Before/After Comparison Anywhere

**What exists:** Checkpoint system tracks outcomes. Evidence spine persists state at each stage. But there's no comparison view.

**What's missing:** No surface shows "what changed since last time." No surface shows "your decision velocity improved by X%." No surface shows "your coherence band moved from DRIFTING to ALIGNED."

**Proprietary opportunity — P0 CATEGORY-DEFINING:**
Build a **"What Changed" dashboard** that compares current state against previous state for every measurable dimension: coherence band, decision velocity, checkpoint response rate, contradiction count, escalation level, financial exposure. This is the single most compelling retention mechanism — users stay because they want to see their trend line improve.

---

### Summary of Deeper Audit

| # | Asset | Location | Current visibility | Opportunity |
|---|-------|----------|-------------------|-------------|
| 1 | Contradiction Graph | `lib/engine/contradiction-graph.ts` | Internal only | **P0 — Interactive graph visualiser** |
| 2 | Arbiter Tournament | `lib/decision/arbiter-tournament.ts` | Buried in collapsible section | **P1 — Trust signal badge** |
| 3 | Kernel self-auditing | `lib/decision/kernel.ts` | Internal only | **P0 — System Accuracy Dashboard** |
| 4 | Cross-assessment interference | `lib/decision/kernel.ts` | Internal only | **P0 — "System Intelligence" feature** |
| 5 | Irreversibility Index | `lib/product/irreversibility-index.ts` | Oversight Brief only | **P1 — Surface in Decision Centre + ER** |
| 6 | Portfolio Pattern Memory | `lib/product/portfolio-pattern-memory.ts` | No UI | **P2 — Portfolio dashboard** |
| 7 | Organisation Divergence | `lib/product/organisation-divergence-summary.ts` | No UI | **P2 — Surface in ER** |
| 8 | Before/after comparison | None | Doesn't exist | **P0 — "What Changed" dashboard** |

The single most valuable hidden asset is the **Contradiction Graph** — a temporal, cross-assessment, decay-aware contradiction database that gets stronger with every use. No competitor has anything like it. Surfacing it as an interactive visualisation would be the most distinctive feature in the entire product category.
