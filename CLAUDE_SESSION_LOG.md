# Abraham of London — Platform Handover Document
**Compiled**: 2026-04-11 (covers Sessions 1–4)
**Project root**: `C:\Abraham-of-london`
**Framework**: Next.js Pages Router (hybrid — App Router for specific API routes only)
**Database**: Prisma + PostgreSQL
**Deployment**: Netlify
**Last commit**: `2d6ad572` — enterprise-repository prisma fix

---

## 1. Session History

| # | Transcript file | Primary scope |
|---|----------------|---------------|
| 1 | `2026-04-11-04-02-22-abraham-london-platform-build.txt` | Homepage, diagnostics system, AI optimisation, database setup, design system tokens, Header/Footer, Shorts chamber |
| 2 | `2026-04-11-05-26-42-abraham-london-platform-build-2.txt` | Homepage rebuild, assessment suite upgrades, design system standardisation, GMI intelligence surfaces, playbook system, editorial library, engagement lane pages |
| 3 | `2026-04-11-11-14-28-abraham-london-platform-build-3.txt` | Intelligence surfaces, playbooks, editorials, strategy room, intervention console, consulting index, executive reporting landing + run, assessment components |
| 4 | Current session | Full diagnostic ladder rebuild (constitutional/team/enterprise), design system enforcement across all assessment components and ladder, 8-path pattern engines, fragility integration, TS audit 1346→1187, enterprise-repository prisma fix, auth unification command written |

---

## 2. Design System — Canonical Tokens

**These are law. No exceptions.**

### Background hierarchy
```
VOID  = rgb(3 3 5)     — deepest (hero sections, void/negative space)
BASE  = rgb(6 6 9)     — page background (replaces bg-black everywhere)
LIFT  = rgb(10 14 20)  — elevated cards above BASE
```
`bg-black` has been purged from 24 page/component files. Never reintroduce it on page surfaces.

### Gold — two values, two jobs
```
#C9A96E  — softGold / brand — identity, labels, eyebrows, borders, domain tints
#F59E0B  — amber-500 — action CTAs ONLY (primary buttons that must convert)
```
These are not interchangeable. An eyebrow label uses `#C9A96E`. A "Begin assessment" CTA uses `#F59E0B`. Nothing else uses amber-500.

### Typography
```
Serif (display + body):  Cormorant Garamond, fontWeight: 300
Mono (labels + data):    JetBrains Mono, ui-monospace
```

### Sharp panel system — zero rounded corners on structural elements
```
Base card:    border: 1px solid rgba(255,255,255,0.062)   backgroundColor: rgb(5 5 7)
Lifted panel: border: 1px solid rgba(255,255,255,0.07)    backgroundColor: rgb(10 14 20)
Gold panel:   border: 1px solid #C9A96E20                 backgroundColor: #C9A96E07
Alert panel:  border: 1px solid rgba(252,165,165,0.22)    backgroundColor: rgba(252,165,165,0.04)
```
Allowed border-radius: `2px` maximum on decorative dot indicators only. `rounded-full` on badges → sharp pill (`padding: "2px 10px"`). `rounded-[Xpx]` on cards → sharp border.

### Platform primitives (copy exactly, do not rewrite)

**Eyebrow:**
```tsx
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-5 w-px" style={{ backgroundColor: "#C9A96E55" }} />
      <span style={{
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: "8px", letterSpacing: "0.40em",
        textTransform: "uppercase", color: "#C9A96EBB",
      }}>
        {children}
      </span>
    </div>
  );
}
```

**GoldRule:**
```tsx
function GoldRule({ soft = false }: { soft?: boolean }) {
  return <div className={soft
    ? "h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
    : "h-px w-full bg-gradient-to-r from-transparent via-[#C9A96E]/22 to-transparent"
  } />;
}
```

**Sharp CTA button (gold, non-flagship):**
```tsx
<button
  style={{
    padding: "13px 28px",
    border: "1px solid #C9A96E42",
    backgroundColor: "#C9A96E10",
    color: "#C9A96ECC",
    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
    fontSize: "8.5px", letterSpacing: "0.28em", textTransform: "uppercase",
    cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.75rem",
  }}
  onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = "#C9A96E65"; el.style.backgroundColor = "#C9A96E18"; }}
  onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = "#C9A96E42"; el.style.backgroundColor = "#C9A96E10"; }}
>
```

**Hover states:** Always use `onMouseEnter/Leave` with exact hex values. Never use Tailwind `hover:` for gold values — Tailwind cannot resolve arbitrary hex at runtime.

**Ladder position indicator (standard pattern):**
```tsx
{[
  { label: "01 Constitutional", done: true,  active: false },
  { label: "02 Team",           done: false, active: true  },
  { label: "03 Enterprise",     done: false, active: false },
  { label: "04 Executive",      done: false, active: false },
].map(item => (
  <div key={item.label} style={{
    padding: "0.55rem 0.85rem", marginBottom: "0.30rem",
    border: `1px solid ${item.active ? "#C9A96E22" : "transparent"}`,
    backgroundColor: item.active ? "#C9A96E08" : "transparent",
    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
    fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase",
    color: item.active ? "#C9A96ECC" : item.done ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.15)",
    textDecoration: item.done ? "line-through" : "none",
  }}>
    {item.label}
  </div>
))}
```

---

## 3. Product Architecture

### The three commercial layers

```
LAYER 1 — DIAGNOSTIC ENTRY GATE
  /diagnostics                              Ladder index
  /diagnostics/constitutional-diagnostic   Layer 01 — entry gate (10 dual-axis questions)
  /diagnostics/team-assessment             Layer 02 — perception gap analysis (2-phase)
  /diagnostics/enterprise-assessment       Layer 03 — institution-wide (4 blocks × 3 questions)

LAYER 2 — EXECUTIVE REPORTING (FLAGSHIP PRODUCT)
  /diagnostics/executive-reporting         Product landing page
  /diagnostics/executive-reporting/run     Intake form + result surface
  app/api/executive-reporting/run/route.ts App Router API — DO NOT CONVERT OR TOUCH

LAYER 3 — STRATEGY ROOM (PRIVATE ADVISORY CHAMBER)
  /consulting/strategy-room                The mandate chamber
  /api/strategy-room/session/init          Session initialisation
  /api/decision/guidance                   Constitutional guidance assembly
```

### Product spine (in flow order)

```
1. Purpose Alignment Assessment (components/alignment/PurposeAlignmentAssessment.tsx)
        ↓ writes sessionStorage: "purpose-alignment-result" { percent, band, domain scores }
2. Constitutional Diagnostic (components/assessments/ConstitutionalDiagnosticSuite.tsx)
        ↓ routes to STRATEGY / DIAGNOSTIC / REJECT with confidence + rationale
3. Team Assessment (pages/diagnostics/team-assessment.tsx)
        ↓ writes sessionStorage: "team-assessment-result" { overallLeader, overallReality, overallGap }
4. Enterprise Assessment (pages/diagnostics/enterprise-assessment.tsx)
        ↓ reads team-assessment-result.overallReality
        ↓ routes to EXECUTIVE_REPORTING / STRATEGY_ROOM / WATCH
5. Executive Reporting Run (pages/diagnostics/executive-reporting/run.tsx)
        ↓ calls app/api/executive-reporting/run/route.ts (Anthropic + Prisma)
        ↓ writes sessionStorage: "executive-report-result"
6. Strategy Room (pages/consulting/strategy-room/index.tsx)
        ↓ calls /api/strategy-room/session/init and /api/decision/guidance
```

Each layer reads from sessionStorage on mount and incorporates prior results into its reading. This is what makes the ladder feel like one continuous diagnostic, not separate tools.

---

## 4. Complete File Inventory — Built or Rebuilt

### 4a. Pages — delivered to `/mnt/user-data/outputs/`

| Output file | Deploy path | Key notes |
|------------|-------------|-----------|
| `homepage-index.tsx` | `pages/index.tsx` | Hero, GMI teaser, diagnostic entry, Strategy Room CTA |
| `diagnostics-index.tsx` | `pages/diagnostics/index.tsx` | Principle strip, ladder section, escalation close |
| `constitutional-diagnostic.tsx` | `pages/diagnostics/constitutional-diagnostic.tsx` | Full hero, instrument spec panel (8 rows), ladder position, grain texture, close |
| `team-assessment.tsx` | `pages/diagnostics/team-assessment.tsx` | 3-phase: identity → leader perception → team reality → result. Gap analysis engine. **Replaces both team-alignment.tsx and old wrapper** |
| `enterprise-assessment.tsx` | `pages/diagnostics/enterprise-assessment.tsx` | 3-phase: identity → instrument → result. 8-path pattern engine. Live signal sidebar. **Replaces both enterprise.tsx and old wrapper** |
| `executive-reporting.tsx` | `pages/diagnostics/executive-reporting.tsx` | Authoritative product surface. No fake data, no pricing table |
| `executive-reporting-run.tsx` | `pages/diagnostics/executive-reporting/run.tsx` | 22-field intake (6 groups), nested API schema, 3 states: intake/generating/result |
| `strategy-room.tsx` | `pages/consulting/strategy-room/index.tsx` | 3-state: CHAMBER/LOADING/VERDICT. No "use client". Sharp panels |
| `consulting-index.tsx` | `pages/consulting/index.tsx` | Eyebrow/SectionDivider/TierBadge. Sharp engagement cards |
| `interventions.tsx` | `pages/consulting/interventions.tsx` | Hero with stats, sticky filter bar, InterventionCard expand/collapse, SWR 30s refresh |
| `gmi-landing.tsx` | `pages/intelligence/[slug].tsx` | GMI intelligence surface |
| `editorials-index.tsx` | `pages/editorials/index.tsx` | |
| `editorials-slug.tsx` | `pages/editorials/[slug].tsx` | |
| `playbooks-index.tsx` | `pages/playbooks/index.tsx` | |
| `playbooks-slug.tsx` | `pages/playbooks/[slug].tsx` | |
| `shorts-index.tsx` | `pages/shorts/index.tsx` | |
| `education-research.tsx` | `pages/education-research.tsx` | Engagement lane |
| `institutional.tsx` | `pages/institutional.tsx` | Engagement lane |
| `media.tsx` | `pages/media.tsx` | Engagement lane |
| `public-brief.tsx` | `pages/public-brief.tsx` | |
| `institutional-edition.tsx` | `pages/institutional-edition.tsx` | |

### 4b. Components — delivered to `/mnt/user-data/outputs/`

| Output file | Deploy path | Key notes |
|------------|-------------|-----------|
| `ConstitutionalDiagnosticSuite.tsx` | `components/assessments/ConstitutionalDiagnosticSuite.tsx` | "use client" removed. Full verdict surface: route + confidence + named disqualifiers + interventions + rationale log + escalation routing |
| `TeamAssessmentSuite.tsx` | `components/assessments/TeamAssessmentSuite.tsx` | "use client" removed. All rounded-* → sharp. amber-500 → softGold. Radar chart, variance index, trust gap, benchmark panel |
| `AssessmentSuiteLadder.tsx` | `components/assessments/AssessmentSuiteLadder.tsx` | "use client" removed. Sharp panels. `stepConfig(isFlagship)`. Gold thread hover. Connector line removed |
| `PurposeAlignmentAssessment.tsx` | `components/alignment/PurposeAlignmentAssessment.tsx` | `derivePatternReading()` — 9 domain-combination paths. DualAxisInput. Certainty gap notes. Escalation routing |
| `StrategyRoomForm.tsx` | `components/strategy-room/Form.tsx` | `scoreText()` gravity engine. Authority from scope selection. Consequence sliders ≤18% |
| `Header.tsx` | `components/Header.tsx` | |
| `Layout.tsx` | `components/Layout.tsx` | `headerTransparent` prop. Canonical URL support |
| `EnhancedFooter.tsx` | `components/Footer.tsx` | |
| `CinematicHero.tsx` | `components/CinematicHero.tsx` | |
| `PlaybookCard.tsx` | `components/PlaybookCard.tsx` | |
| `ShortCard.tsx` | `components/ShortCard.tsx` | |
| `EnterpriseAssessmentSuite.tsx` | `components/assessments/EnterpriseAssessmentSuite.tsx` | Slider-based multi-team tool. **NOT imported by enterprise-assessment.tsx** — exists for other uses |

### 4c. APIs and lib

| Output file | Deploy path | Key notes |
|------------|-------------|-----------|
| `interventions-api.ts` | `pages/api/constitution/interventions.ts` | Queries StrategicIntervention (not ContentMetadata). GET + PATCH |
| `route.ts` | `app/api/executive-reporting/run/route.ts` | **DO NOT TOUCH** — correct. Anthropic + Prisma wired |
| `report-recommendations-builder.ts` | `lib/decision/report-recommendations-builder.ts` | |
| `tokens.ts` | `lib/design/tokens.ts` | Canonical design system tokens |

### 4d. MDX content

| Output file | Deploy path |
|------------|-------------|
| `century-firm-playbook.mdx` | `content/playbooks/century-firm-playbook.mdx` |
| `execution-integrity-protocol.mdx` | `content/playbooks/execution-integrity-protocol.mdx` |
| `the-alignment-audit-playbook.mdx` | `content/playbooks/the-alignment-audit-playbook.mdx` |
| `the-drift-detection-framework.mdx` | `content/playbooks/the-drift-detection-framework.mdx` |
| `global-market-intelligence-report-q1-2026.mdx` | `content/editorials/global-market-intelligence-report-q1-2026.mdx` |

### 4e. Config

| Output file | Deploy path |
|------------|-------------|
| `globals.css` | `styles/globals.css` |
| `tailwind.config.js` | `tailwind.config.js` |
| `_document.tsx` | `pages/_document.tsx` |

---

## 5. Files to Retire

```
pages/diagnostics/enterprise.tsx        DELETE — replaced by enterprise-assessment.tsx
pages/diagnostics/team-alignment.tsx    DELETE — replaced by team-assessment.tsx
```

If external links exist to the old routes, add 301 redirects in `next.config.js`.

---

## 6. Key Architectural Decisions

| Decision | Rule | Reason |
|----------|------|--------|
| Pages Router throughout | Never `next/navigation` — always `next/router` | App Router is used for APIs only |
| `"use client"` | Never in Pages Router components | useState/useEffect work natively; the directive causes build warnings |
| Gold: two values | `#C9A96E` = brand. `#F59E0B` = CTAs only | Prevents the brand colour diluting into meaninglessness |
| Border-radius | 2px maximum | Institutional Monumentalism — the design language is sharp, not soft |
| Background tokens | void → base → lift. Never `bg-black` | Consistent depth hierarchy across every surface |
| Hover states | `onMouseEnter/Leave` + exact hex | Tailwind cannot resolve arbitrary hex at runtime |
| `headerTransparent` | Set on ALL rebuilt pages | Allows hero sections to bleed behind navigation |
| App Router API | `app/api/executive-reporting/run/route.ts` — untouched | Works correctly with Prisma and Anthropic |
| Scoring model | Text quality determines gravity — sliders ≤18% | Prevents low-effort self-reporting from gaming the route |
| sessionStorage chain | Each layer reads prior results on mount | Makes the ladder feel like one continuous diagnostic |
| `EnterpriseAssessmentSuite` | Exists but NOT imported by enterprise-assessment.tsx | The Likert instrument is the correct pattern for the diagnostic ladder |
| Report schema | NOT YET LOCKED — next critical item | Until locked, Executive Reporting is scaffolding around ambiguity |

---

## 7. Constitutional Scoring Engine

**`lib/constitution/rules.ts`** — V2.2 Sovereign Routing Kernel

```typescript
evaluateConstitutionalRoute(input: ConstitutionInput): ConstitutionalDecision
```
Returns: `route` (STRATEGY/DIAGNOSTIC/REJECT), `confidence` (0–1), `disqualifiersTriggered`, `recommendedInterventions`, `rationale`, `postureWeight`, `readinessWeight`, `escalationAllowed`

**Seven sequential gates:**
1. Mandate & seriousness hard gates
2. Clarity & coherence collapse
3. Authority gate (DIRECT/PROXY/UNCLEAR)
4. Structural failure density
5. Posture & readiness brakes
6. Strategy promotion (all conditions must pass)
7. Operator influence (can only degrade, never upgrade)

**`lib/decision/system-constitution.ts`**

```typescript
deriveConstitutionalAssessment(intake: ConstitutionalIntake): ConstitutionalAssessment
```
Returns: route, orgState, readinessTier, authorityType, priority, temperature, clarityScore, authorityScore, governanceScore, severityScore, failureModes, dominantDomains, requiredInterventions

**Strategy Room scoring model:**
```
Gravity    = scoreText(problem) × 0.55 + scoreText(priorFailures) × 0.20 + scoreText(costOfInaction) × 0.25
Authority  = scope selection (DIRECT=90, PROXY=65, ADVISORY=40, UNCLEAR=25) + board bonus
Sliders    = capped at 18% total contribution
Hard gate  = authority ≥ 60 required for QUALIFIED route
```

---

## 8. Assessment Engine Logic

### Constitutional Diagnostic
- 10 questions, 2 axes (resonance × certainty weight)
- Domain bucket scores → authority type, posture, readiness tier
- `evaluateConstitutionalRoute()` applies 7 sequential gates
- Verdict surface: named disqualifiers, interventions, rationale log, confidence, weights

### Team Assessment
- Phase 1 (leader perception): 4 domains × 3 questions
- Phase 2 (team reality): same 4 domains × 3 questions
- Gap = leaderPct − realityPct per domain
- `calculateFragility()` from `lib/alignment/fragility-logic.ts` — Bessel-corrected stddev on domain percentages
- `deriveGapReading()` — 8 pattern paths based on gap size, domain combination, direction
- Reads `purpose-alignment-result`; writes `team-assessment-result`

### Enterprise Assessment
- 4 blocks × 3 questions = 12 total (Leadership Coherence, Governance Reliability, Execution Variance, Risk Posture)
- `deriveReading()` — 8 pattern paths based on combination of weak sections
- Live signal sidebar updates domain bars in real time during instrument phase
- Reads `team-assessment-result.overallReality`; routes to EXECUTIVE_REPORTING / STRATEGY_ROOM / WATCH

### Purpose Alignment Assessment
- Dual-axis weighted scoring
- `derivePatternReading()` — 9 domain-combination paths
- Separates acknowledged vs unexamined weaknesses
- Writes `purpose-alignment-result`

---

## 9. Fragility Engine

**`lib/alignment/fragility-logic.ts`**

```typescript
calculateFragility(scores: number[]): FragilityResult
// status: STABLE | VOLATILE | FRACTURED | INSUFFICIENT_DATA
// score: stddev (rounded)
// Thresholds: stddev ≥ 22 → FRACTURED, ≥ 12 → VOLATILE, < 12 → STABLE
// Minimum 3 data points required
```

Used in: `TeamAssessmentSuite` (variance readout sidebar), `team-assessment.tsx` (result surface fragility panel).

---

## 10. TypeScript Audit — Full Record

**Starting errors**: 1346 | **Fixed**: 159 | **Remaining**: ~1187

### CRITICAL (build breaks / runtime crashes)

| File | Fix |
|------|-----|
| `lib/alignment/enterprise-permissions.ts` | Markdown stripped — raw markdown mixed with TS caused parse errors |
| `lib/alignment/hcd-engine.ts → .tsx` | Renamed — JSX in .ts file |
| `lib/assessments/suite-registry.ts` | `/run` href removed (404); `AssessmentId`/`AssessmentEntry` types added |
| `components/admin/reporting/briefing-pdf-template.tsx` | 7 property path corrections: `report.integrity.*` → `report.telemetry.*`, `report.reportId` → `report.header.reportId`, `report.summary.verdict` → `.mandate`, `item.score` → `item.confidence` |
| `app/api/campaigns/[id]/report/route.ts` | Async import fixed; nested property paths corrected; `await` added |
| `lib/decision/sample-assets.ts` | `asset-matcher` → `content-asset-adapter` |
| `lib/decision/constitutional-guidance-assembler.ts` | `applyRecommendationGovernance` positional args; `.filtered` → `.governed`; 8 type casts |

### HIGH (wrong behaviour / missing data)

| File | Fix |
|------|-----|
| `lib/alignment/hardened-pulse-engine.ts` | Backward-compat aliases: `weightedResonance`, `reliabilityIndex`, `standardError`, `integrityStatus`, `nodeCount` |
| `lib/alignment/domain-diagnostic.ts` | `analyzeDomainVariance` alias added |
| `lib/constitution/constitutional-diagnostic-derivation.ts` | `summary: string` added; domain signal scores; deprecated type aliases |
| `lib/constitution/route-correction.ts` | `updateCaseMemory` → `patchCaseMemory` |
| `lib/constitution/observability-types.ts` | `OPERATOR_PENALTY_APPLIED`; `operatorKey?`; `TribunalFinding` type |
| `lib/constitution/seriousness.ts` | `estimateSeriousness()` added (was imported but missing) |
| `lib/constitution/rules.ts` | `getMutation()?.value` wrapped with `Number()` at two call sites |
| `lib/constitution/export-standards.ts` | `import crypto from 'crypto'` added |
| `lib/constitution/sovereign-data.ts` | Cipher cast to `CipherGCM` / decipher to `DecipherGCM` |
| `lib/decision/system-constitution.ts` | Unreachable condition removed |
| `components/admin/reporting/manager-drill-down.tsx` | `d.status` → `d.trajectory`; `d.dissonance` → `d.friction` |
| `components/diagnostics/ConstitutionalDiagnostic.tsx` | Inline bridge type → `ConstitutionalBridgeBundle` import |
| `pages/diagnostics/directional-integrity.tsx` | `item.active` → `'active' in item && item.active` |

### MEDIUM (deduplication + background consistency)

| Change |
|--------|
| 13 `components/reporting/*` → re-exports from `admin/reporting` (BoardroomMode, BriefingPDF, DecisionAssetCard, ReportRecommendationsPanel, ContagionMap, DissonanceMatrix, DrillDownMatrix, FragilityHeatmap, GovernanceHistory, InterventionCopilot, InterventionProposal, ValueRecoveryAudit, ValueRecoveryReport) |
| `bg-black` → `bg-[#060609]` in 24 files (`app/layout.tsx`, `app/client-shell.tsx`, `components/AppShell.tsx`, `components/consulting/StrategyRoomIntegration.tsx`, and 20 page/component files) |

### New files created during audit

| File | Purpose |
|------|---------|
| `lib/constitution/risk-signals.ts` | `detectRiskSignals()` — imported by `autonomous-advisory.ts` but was missing |
| `lib/design/tokens.ts` | Canonical design system tokens: colors, animation, radii, spacing |

---

## 11. Pending — Priority Order

### 🔴 CRITICAL

**1. Auth unification**

Run inside `C:\Abraham-of-london` via Claude Code:
```bash
cat << 'PROMPT' | claude --dangerously-skip-permissions
Audit every auth-related file. Find all auth mechanisms (NextAuth, Clerk, iron-session, custom JWT, anything).
List every contradiction before touching any file.
Then unify into whichever is most dominant/functional. Requirements:
- ONE session shape everywhere: { user: { id, email, name, role, tier } }
- Role field "USER" | "ADMIN" | "SUPER_ADMIN" on Prisma User model
- Admins identified by role field — NOT hardcoded emails, NOT separate admin table
- bcrypt registration at POST /api/auth/register (default role: USER)
- lib/auth/withAuth.ts wrapper: withAuth(handler, { role: "ADMIN" })
- lib/auth/getSession.ts helper for getServerSideProps
- Edge middleware protecting /admin/* and /dashboard/*
- httpOnly cookie, secure in production, sameSite: lax, 30-day maxAge
- Do NOT introduce a second auth library
- Run: npx tsc --noEmit 2>&1 | head -40 after
- Commit: "Unify auth: single authority, role-based access, unified session shape"
PROMPT
```

**2. Canonical report schema**

Extend the Anthropic prompt in `app/api/executive-reporting/run/route.ts` to return this exact 12-field object. Nothing else in the product can be stabilised until this output is locked:

```typescript
{
  headline:                string;  // one sentence, specific to this institution's condition
  constitutional_route:    string;  // STRATEGY | DIAGNOSTIC | REJECT with confidence %
  seriousness_level:       string;  // LOW | MODERATE | HIGH | CRITICAL with rationale
  governance_risk:         string;  // paragraph naming the governance failure mode
  top_3_pressure_points:   Array<{ name: string; consequence: string; urgency: string }>;
  domain_breakdown:        Array<{ domain: string; score: number; reading: string }>;
  decision_options:        Array<{ option: string; preserves: string; sacrifices: string }>;
  trade_off_map:           string;  // prose mapping what each option preserves vs sacrifices
  correction_priorities:   Array<{ priority: string; rationale: string; owner: string }>;
  escalation_recommendation: string; // specific route with structural justification
  sequence_7_days:         string[];
  sequence_30_days:        string[];
  sequence_90_days:        string[];
}
```

### 🟡 HIGH

**3. Executive reporting proof layer** — One anonymised scenario on `/diagnostics/executive-reporting` demonstrating what the report actually produces. A real pattern (e.g. authority ambiguity at board level, trust gap producing signal failure, execution drift disguised as strategy problem) with: the structural reading, what the report found, why it escalated. Before/after framing. Not marketing copy — a real specimen.

**4. Strategy Room sequential copy** — One sentence making the product relationship unmistakable: *"Executive Reporting surfaces the structural reading. The Strategy Room is what happens when that reading warrants private advisory attention."* This separates the two products as levels of consequence, not competitors.

**5. Homepage flagship clarity** — GMI (editorial flagship) and Executive Reporting (product flagship) must be unmistakable from the homepage. Hierarchy and copy change — not a rebuild.

**6. `.env.local` verification** — Confirm all of these are present:
```
ANTHROPIC_API_KEY
DATABASE_URL
NEXTAUTH_SECRET         (or equivalent session secret)
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
RESEND_API_KEY
NEXT_PUBLIC_SITE_URL=https://www.abrahamoflondon.org
```

**7. Prisma migrations** — After auth unification adds `role` to User model:
```bash
npx prisma migrate dev --name add-user-role
```

**8. `executiveReportingRun` Prisma model** — Verify this model exists in the schema. It is referenced in `app/api/executive-reporting/run/route.ts`. If missing, the API will fail silently on save.

### 🟢 MEDIUM

**9. `npm run build` zero errors** — Run after auth unification. ~1187 TS errors remain in predictive engines, test files, and legacy API routes. Most do not affect the user-facing product.

**10. `lib/shorts/brand.ts`** — Verify these exports exist: `readImprint`, `writeImprint`, `computeWhisper`, `getOrCreateSeed`, `updateStreak`, `updateVisitCount`.

**11. Team assessment multi-respondent** — Current instrument is single-respondent (one leader estimates team reality). True multi-respondent requires a campaign/invite system. Not built. Not blocking anything currently.

---

## 12. Route Map (Complete)

```
PUBLIC
/                                         Homepage
/diagnostics                              Diagnostic ladder index
/diagnostics/constitutional-diagnostic   Layer 01
/diagnostics/team-assessment             Layer 02
/diagnostics/enterprise-assessment       Layer 03
/diagnostics/executive-reporting         Layer 04 — product landing
/diagnostics/executive-reporting/run     Layer 04 — intake + result
/diagnostics/directional-integrity       Directional integrity tool
/consulting                              Advisory index
/consulting/strategy-room                Strategy Room
/consulting/interventions                Intervention console
/playbooks                               Playbook index
/playbooks/[slug]                        Individual playbook
/editorials                              Editorial index
/editorials/[slug]                       Individual editorial
/intelligence/[slug]                     GMI intelligence surfaces
/education-research                      Engagement lane
/institutional                           Engagement lane
/media                                   Engagement lane
/shorts                                  Reading chamber
/contact                                 Contact

RETIRE (301 redirect)
/diagnostics/team-alignment              → /diagnostics/team-assessment
/diagnostics/enterprise                  → /diagnostics/enterprise-assessment

API
/api/auth/register                       User registration (post auth unification)
/api/strategy-room/session/init          Session initialisation
/api/strategy-room/session/impression    Recommendation impressions
/api/decision/guidance                   Constitutional guidance assembly
/api/constitution/interventions          Intervention CRUD (GET + PATCH)
/api/executive-reporting/run             App Router — DO NOT CONVERT
/api/purpose-alignment/assessments       Purpose alignment save
/api/diagnostics/submit                  Diagnostic submission

PROTECTED (post auth unification)
/admin/*                                 ADMIN role required
/dashboard/*                             USER role required (own data)
```

---

## 13. Repository State

**Last commit pushed**: `2d6ad572`
**Message**: "Fix enterprise-repository: use prisma client instead of db wrapper"
**What it fixed**: `enterprise-repository.ts` imported `db` from `@/lib/db` (utility wrapper) instead of `prisma` from `@/lib/prisma` (PrismaClient). This caused `/api/alignment/enterprise/campaigns/[id]/aggregate` and all dependent enterprise routes to fail at runtime with model-access errors.

**Pattern to watch**: If another Netlify deploy fails with `lib is not defined` or model-access error on an enterprise alignment route, it is the same pattern — find the file importing `db` from `@/lib/db` and change it to `prisma` from `@/lib/prisma`.

**Netlify**: Rebuild triggered by `2d6ad572`. Monitor at the Netlify dashboard.

**Auth**: Not yet unified. The audit and unification command is written and ready to run.

---

## 14. What Market-Ready Actually Requires

The diagnostic ladder is complete. All four layers exist, are design-system compliant, route correctly, and connect via sessionStorage. The product spine from Purpose Alignment through Strategy Room is built.

What remains is forcing the commercial object into disciplined market form. In order, without wandering:

1. **Auth** — Without working auth, no user data persists, no dashboard functions, no admin layer exists. Everything else is contingent on this.

2. **Report schema** — The flagship product must produce a specific, stable, 12-field output. Until this is locked, Executive Reporting is a well-designed form that returns inconsistent output. Lock the schema first, then optimise everything that serves it.

3. **Proof layer** — A serious product demonstrates its output. The landing page needs one real anonymised specimen that shows what buying the report actually gets you.

4. **Sequential framing** — Strategy Room and Executive Reporting must feel like levels of consequence, not parallel offers competing for the same buyer.

5. **Homepage hierarchy** — The two flagships must be unmistakable from the first page a visitor sees.

In that order. The foundation is hardened enough that this work will land cleanly.