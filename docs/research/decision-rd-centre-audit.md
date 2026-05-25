# Decision R&D Centre — Re-audit & Architecture

**Date:** 2026-05-24
**Scope:** Reassessment of `/testing/lab` as foundation for an internal Decision R&D Centre
**Route (proposed):** `/admin/research` (internal, admin/owner/operator-only)
**Title:** Decision R&D Centre
**Subtitle:** Strategic Simulation, Doctrine Testing, and Product Intelligence Workbench

---

## Phase 1 — Re-audit of Existing Assets

Each file is evaluated against 9 questions:
1. Can this help test product assumptions?
2. Can this help simulate diagnostic outcomes?
3. Can this help compare product versions?
4. Can this help test scoring, narrative, and escalation logic?
5. Can this help test market or buyer responses?
6. Can this help detect contradiction in the product itself?
7. Can this support content, outbound, or category-testing experiments?
8. Can this provide internal evidence before public product changes?
9. Can this become part of the operator/research console?

---

### 1. `app/testing/lab/page.tsx`

**Current state:** Thin wrapper (3 lines of JSX) that renders `StrategicStressWorkbench`.

| Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Q7 | Q8 | Q9 |
|----|----|----|----|----|----|----|----|----|
| ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

**Verdict: REBUILD**

The page itself has no value — it's a pass-through. But the *route* is valuable. Replace this file with a proper R&D centre dashboard that provides navigation to all lab modules. The file should become an index/hub, not a single-workbench render.

**Action:** Rewrite as the Decision R&D Centre hub page with module navigation cards.

---

### 2. `app/testing/layout.tsx`

**Current state:** Server component with `requireAdminServer()` auth guard.

| Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Q7 | Q8 | Q9 |
|----|----|----|----|----|----|----|----|----|
| N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | ✅ |

**Verdict: KEEP_AND_PROMOTE**

The auth guard pattern is correct and already matches the admin layout pattern. Move this to `/admin/research/layout.tsx` and keep the `requireAdminServer()` guard. Consider wrapping in `AppAdminShell` for consistent admin navigation, or keep standalone if the R&D Centre needs a different visual context from the main admin.

**Action:** Move to new route, optionally integrate with `AppAdminShell`.

---

### 3. `components/analysis/StrategicStressWorkbench.tsx`

**Current state:** Full interactive workbench with 3 sliders (resonance, friction, revenue), 4 output cards (tax, velocity, alpha, certainty), protocol checks, baseline comparison, and save-to-API.

| Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Q7 | Q8 | Q9 |
|----|----|----|----|----|----|----|----|----|
| ✅ | ✅ | ✅ | ✅ | ✗ | ✗ | ✗ | ✅ | ✅ |

**Verdict: REBUILD**

The workbench is a **prototype of a useful pattern** but the current implementation is too narrow:

**What to keep:**
- The 3-input → 4-output modelling pattern is a strong foundation for *any* simulation module
- The slider UI components (`NumericControl`, `OutputCard`, `CheckItem`) are well-built and reusable
- The save-scenario flow (though the API endpoint is questionable)
- The visual design language (dark theme, amber accents, mono labels) is consistent with the brand

**What to change:**
- The formulas are arbitrary toy math. Replace with real product engine calls.
- The inputs are abstract (resonance, friction, revenue). Replace with real diagnostic inputs.
- The outputs are abstract (tax, velocity, alpha). Replace with real diagnostic outputs.
- The "Save scenario" API (`/api/sovereign/report`) is disconnected from any real data pipeline.

**How to rebuild:**
- Make this a **generic scenario simulation shell** that accepts pluggable engine modules
- Module 1: Fast Diagnostic simulator (3-question input → condition label output)
- Module 2: Constitutional Diagnostic simulator (10-question input → route/output)
- Module 3: Executive Reporting simulator (evidence inputs → report output)
- Module 4: Strategy Room simulator (decision inputs → escalation simulation)
- Each module reuses the same slider/card/check UI primitives but connects to real engine logic

**Action:** Extract the UI primitives to `components/research/` as shared components. Rebuild the workbench as a module loader that can run different product engines.

---

### 4. `components/analysis/ComparisonDelta.tsx`

**Current state:** Baseline-lock comparison component. Locks current state, then shows delta metrics (alpha, certainty, velocity, resonance) against the locked baseline.

| Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Q7 | Q8 | Q9 |
|----|----|----|----|----|----|----|----|----|
| ✅ | ✅ | ✅ | ✅ | ✗ | ✅ | ✗ | ✅ | ✅ |

**Verdict: KEEP_AND_PROMOTE**

This is a genuinely useful pattern. The ability to lock a baseline and compare deltas is valuable for:
- **Product version comparison** (Q3): Run engine v1, lock baseline, run engine v2, see delta
- **Scenario comparison** (Q2): Run scenario A, lock, run scenario B, see delta
- **Contradiction detection** (Q6): If two engines produce different results from the same inputs, the delta reveals it
- **Internal evidence** (Q8): Before shipping a scoring change, see exactly what changes

**What to change:**
- Decouple from `useOGRStore` — make it accept generic `current` and `baseline` props
- Make the comparison dimensions pluggable (not hardcoded to alpha/certainty/velocity)
- Add a "scenario history" mode that shows deltas across multiple saved baselines

**Action:** Extract to `components/research/ComparisonDelta.tsx` with generic props. Keep the visual design.

---

### 5. `components/debug/FormulaInspector.tsx`

**Current state:** Hover-to-inspect card that shows the formula, current input trace, and computed result for any derived metric.

| Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Q7 | Q8 | Q9 |
|----|----|----|----|----|----|----|----|----|
| ✅ | ✅ | ✅ | ✅ | ✗ | ✅ | ✗ | ✅ | ✅ |

**Verdict: KEEP_AND_PROMOTE**

This is the single most valuable component in the current lab. The ability to hover over any computed value and see:
- The abstract formula/logic
- The live input trace with current values
- The computed result
- A plain-English description

...is exactly what an R&D centre needs for **engine testing** (Q4), **product version comparison** (Q3), and **contradiction detection** (Q6).

**What to change:**
- Decouple from `useOGRStore` — accept a generic `inspectorData` prop
- Make the formula display support multi-step derivations (not just single formulas)
- Add a "compare" mode that shows old formula vs new formula side by side
- Make the description field support markdown or rich text

**Action:** Extract to `components/research/FormulaInspector.tsx` with generic props. This should become a core debugging tool used across all R&D centre modules.

---

### 6. `store/useOGRStore.ts`

**Current state:** Zustand store with persistence, auth, baseline comparison, report commit, and metric management. 350+ lines.

| Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Q7 | Q8 | Q9 |
|----|----|----|----|----|----|----|----|----|
| ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

**Verdict: REBUILD**

The store is tightly coupled to the OGR toy model and carries significant baggage:
- Sovereign auth flow that duplicates the existing admin auth
- Report commit API that goes to a non-standard endpoint
- Brief selection and registry state that nothing uses
- Persistence to localStorage that creates stale state issues

**What to keep:**
- The Zustand + devtools + persist + subscribeWithSelector pattern is solid
- The `buildMetrics` / `buildComputed` pattern (separate metric state from computed state) is a good architecture
- The baseline snapshot pattern

**What to change:**
- Replace with a **generic scenario store** that can hold any engine's inputs and outputs
- Remove the sovereign auth layer (admin auth is handled by the layout)
- Remove the report commit API (replace with a generic "save scenario to DB" pattern)
- Make the store modular — each engine module gets its own store slice

**Action:** Rewrite as `store/useResearchStore.ts` — a generic scenario state manager. Keep the Zustand architecture, replace the domain logic.

---

### 7. `lib/ogr/manifest-engine.ts`

**Current state:** Math engine with sanitization, clamping, and 4 derived formulas. 130 lines. Well-tested.

| Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Q7 | Q8 | Q9 |
|----|----|----|----|----|----|----|----|----|
| ✅ | ✅ | ✅ | ✅ | ✗ | ✗ | ✗ | ✅ | ✅ |

**Verdict: KEEP_AND_PROMOTE**

The engine itself is well-architected:
- Clean separation of sanitization from computation
- Proper clamping and edge-case handling
- Deterministic output
- Well-tested (20+ tests)

**What to keep:**
- The `sanitizeResonance` / `sanitizeFriction` / `sanitizeRevenue` sanitizer pattern
- The `calculateDerived` pattern (metrics in → computed out)
- The `OGR_CONSTANTS` configuration object
- The `roundTo` utility
- All tests

**What to change:**
- The formulas are toy math. Replace with real product engine calls OR keep as a "reference model" that can be compared against real engines.
- Rename to `lib/research/reference-engine.ts` — it becomes the **baseline reference model** that real product engines are compared against.
- Add a "compare against production" mode that runs the same inputs through the real engine and shows deltas.

**Action:** Move to `lib/research/reference-engine.ts`. Keep the architecture. The formulas can remain as a simple illustrative model, but add the ability to plug in real engine comparators.

---

### 8. `lib/ogr/simulation-engine.ts`

**Current state:** Weighted resonance calculator — takes weighted inputs, computes aggregate scores, bands results. 200 lines.

| Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Q7 | Q8 | Q9 |
|----|----|----|----|----|----|----|----|----|
| ✅ | ✅ | ✅ | ✅ | ✗ | ✗ | ✗ | ✅ | ✅ |

**Verdict: KEEP_AND_PROMOTE**

This is a **genuinely reusable weighted scoring engine**. It:
- Takes any number of weighted inputs with certainty scores
- Computes aggregate weighted scores
- Bands results into LOW/MODERATE/STRONG/HIGH/SOVEREIGN
- Handles edge cases (empty inputs, zero weights, poisoned data)
- Has both sync and async APIs
- Has an aggregation function for combining multiple results

This could power:
- **Fast Diagnostic scoring** — weight each question response, compute condition score
- **Purpose Alignment scoring** — weight each domain, compute alignment score
- **Constitutional Diagnostic scoring** — weight each dimension, compute route confidence
- **Any weighted scoring model** in the product

**What to change:**
- Rename from "resonance" to generic "weighted scoring" terminology
- Move to `lib/scoring/weighted-scoring-engine.ts`
- Add TypeScript generics for input/output types
- Add a test suite (currently has none)

**Action:** Move to `lib/scoring/weighted-scoring-engine.ts`. Add tests. This should become a shared utility used by real product engines.

---

### 9. `lib/ogr/client-config.ts`

**Current state:** Client-side constants for the OGR workbench. 25 lines.

| Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Q7 | Q8 | Q9 |
|----|----|----|----|----|----|----|----|----|
| ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

**Verdict: MERGE**

The config values are specific to the toy model. However, the *pattern* of a typed client-config object is useful.

**Action:** Merge relevant constants into the reference engine. Discard the rest. The `protocolVersion`, `telemetry`, and `registry` configs are unused dead code.

---

### 10. `lib/ogr/server-auth.ts`

**Current state:** Server-side HMAC-signed session cookie verification for the OGR sovereign auth flow. 45 lines.

| Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Q7 | Q8 | Q9 |
|----|----|----|----|----|----|----|----|----|
| ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

**Verdict: DELETE**

This duplicates the existing admin auth system (`requireAdminServer()`, `requireAdminPage()`). The sovereign auth flow was an earlier experiment in separate auth that should not be maintained.

**Action:** Delete. The R&D Centre uses the existing admin auth infrastructure.

---

### 11. `lib/ogr/manifest-engine.test.ts`

**Current state:** 20+ vitest tests covering sanitization, formula integrity, threshold governance, edge cases, and business logic.

| Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Q7 | Q8 | Q9 |
|----|----|----|----|----|----|----|----|----|
| ✅ | ✅ | ✅ | ✅ | ✗ | ✅ | ✗ | ✅ | ✅ |

**Verdict: KEEP_AND_PROMOTE**

These tests are well-written and comprehensive. They serve as:
- A model for how all R&D centre engine tests should be written
- A regression suite for the reference engine
- Documentation of expected behaviour

**Action:** Move alongside the reference engine to `lib/research/reference-engine.test.ts`. Keep and expand.

---

### 12. `components/analysis/_archive/OGRStressTest.legacy.tsx`

**Current state:** Archived legacy version of the workbench. 288 lines.

**Verdict: DELETE**

This is a stale backup. The current `StrategicStressWorkbench.tsx` is the active version. If there's anything useful in the legacy version, it was already carried forward.

---

### 13. `components/analysis/_archive/HistorySidebar.legacy.tsx`

**Current state:** Archived legacy sidebar component.

**Verdict: DELETE**

Stale backup. No unique value not already present in the active codebase.

---

### 14. `components/debug/RouteChecker.tsx`

**Current state:** Debug component that fetches Contentlayer document counts from `/api/_debug/content-counts` and renders a table. Already decoupled from the lab (it's in `components/debug/`, not imported by the lab).

| Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Q7 | Q8 | Q9 |
|----|----|----|----|----|----|----|----|----|
| ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✅ | ✅ | ✅ |

**Verdict: KEEP_AND_PROMOTE**

This is a useful debug tool that should be accessible from the R&D Centre. It helps with content/category testing (Q7) and internal evidence (Q8).

**Action:** Keep in `components/debug/`. Add a link from the R&D Centre navigation to a page that renders this. Or integrate it as a "Content Health" module.

---

## Summary Classification

| File | Classification |
|------|---------------|
| `app/testing/lab/page.tsx` | **REBUILD** → R&D Centre hub page |
| `app/testing/layout.tsx` | **KEEP_AND_PROMOTE** → move to new route |
| `components/analysis/StrategicStressWorkbench.tsx` | **REBUILD** → extract UI primitives, make module loader |
| `components/analysis/ComparisonDelta.tsx` | **KEEP_AND_PROMOTE** → genericize |
| `components/debug/FormulaInspector.tsx` | **KEEP_AND_PROMOTE** → genericize (highest value component) |
| `store/useOGRStore.ts` | **REBUILD** → generic research store |
| `lib/ogr/manifest-engine.ts` | **KEEP_AND_PROMOTE** → reference engine |
| `lib/ogr/simulation-engine.ts` | **KEEP_AND_PROMOTE** → weighted scoring engine |
| `lib/ogr/client-config.ts` | **MERGE** → into reference engine |
| `lib/ogr/server-auth.ts` | **DELETE** — duplicates existing admin auth |
| `lib/ogr/manifest-engine.test.ts` | **KEEP_AND_PROMOTE** → move with engine |
| `components/analysis/_archive/OGRStressTest.legacy.tsx` | **DELETE** — stale backup |
| `components/analysis/_archive/HistorySidebar.legacy.tsx` | **DELETE** — stale backup |
| `components/debug/RouteChecker.tsx` | **KEEP_AND_PROMOTE** → add to R&D nav |

---

## Phase 2 — Decision R&D Centre Architecture

### Route Structure

```
/admin/research/                          ← Hub / dashboard
├── layout.tsx                            ← Auth guard (requireAdminServer)
│
├── simulation/                           ← Product Simulation
│   ├── page.tsx                          ← Module hub
│   ├── fast-diagnostic/                  ← Fast Diagnostic scenario tests
│   ├── purpose-alignment/                ← PA simulation
│   ├── constitutional/                   ← Constitutional Diagnostic simulation
│   ├── enterprise-campaign/              ← Enterprise campaign simulation
│   ├── executive-reporting/              ← ER simulation
│   ├── strategy-room/                    ← Strategy Room escalation simulation
│   └── boardroom/                        ← Boardroom Dossier qualification simulation
│
├── engines/                              ← Engine Testing
│   ├── page.tsx                          ← Module hub
│   ├── scoring/                          ← Scoring change stress-tests
│   ├── contradiction/                    ← Contradiction detection tests
│   ├── cost-of-delay/                    ← Cost-of-delay logic tests
│   ├── pattern-recurrence/               ← Pattern recurrence tests
│   ├── decision-credit/                  ← Decision credit tests
│   ├── consequence-engine/               ← Consequence engine tests
│   ├── retainer-readiness/               ← Retainer readiness signal tests
│   ├── report-lineage/                   ← Report lineage trigger tests
│   └── enforcement-gates/                ← Enforcement gate tests
│
├── market/                               ← Market Response Lab
│   ├── page.tsx                          ← Module hub
│   ├── positioning/                      ← Positioning variant A/B tests
│   ├── ctas/                             ← CTA variant tests
│   ├── outbound/                         ← Outbound post variant tests
│   ├── naming/                           ← Product naming tests
│   ├── pathways/                         ← Buyer pathway stress tests
│   └── objections/                       ← Objection response tests
│
├── red-team/                             ← Governance Red Team
│   ├── page.tsx                          ← Module hub
│   ├── claim-risk/                       ← Claim risk detection
│   ├── overclaim-detection/              ← Overclaim detection
│   ├── ip-leak-scan/                     ← IP leak scanning
│   ├── evidence-posture/                 ← Evidence posture enforcement
│   ├── contradiction-scan/               ← Product contradiction scanning
│   └── competitive-red-team/             ← Competitive red team scenarios
│
├── content/                              ← Content & Category Lab
│   ├── page.tsx                          ← Module hub
│   ├── category-testing/                 ← Category formation tests
│   ├── editorial/                        ← Editorial testing
│   ├── seo/                              ← SEO scenario tests
│   └── content-health/                   ← Contentlayer manifest debug (RouteChecker)
│
└── reference/                            ← Reference Models
    ├── page.tsx                          ← Module hub
    ├── ogr-model/                        ← Original OGR reference model
    └── comparison/                       ← Engine comparison dashboard
```

### Core Shared Components (`components/research/`)

```
components/research/
├── SimulationShell.tsx          ← Generic 3-panel layout (inputs | outputs | checks)
├── NumericControl.tsx           ← Slider control (extracted from workbench)
├── OutputCard.tsx               ← Metric display card (extracted from workbench)
├── CheckItem.tsx                ← Protocol check item (extracted from workbench)
├── ComparisonDelta.tsx          ← Baseline comparison (genericized)
├── FormulaInspector.tsx         ← Formula inspector (genericized)
├── EngineRunner.tsx             ← Generic engine runner (takes engine module, renders UI)
├── ScenarioHistory.tsx          ← Saved scenario history browser
├── ScenarioDiff.tsx             ← Side-by-side scenario comparison
├── BatchRunner.tsx              ← Run engine across N input combinations
└── ReportExporter.tsx           ← Export scenario results as PDF/JSON
```

### Core Libraries (`lib/research/`)

```
lib/research/
├── reference-engine.ts          ← Original OGR model (kept as baseline reference)
├── reference-engine.test.ts     ← Tests for reference engine
├── engine-registry.ts           ← Registry of all testable engines
├── scenario-store.ts            ← Generic scenario state management
├── batch-runner.ts              ← Batch execution engine
├── comparison-engine.ts         ← Engine comparison utilities
└── export-utils.ts              ← Export utilities
```

### Integration Points

| Existing System | R&D Centre Module | How |
|----------------|-------------------|-----|
| Fast Diagnostic engine | `simulation/fast-diagnostic` | Import real scoring functions, run with synthetic inputs |
| Constitutional engine | `simulation/constitutional` | Import real routing logic, test with variant inputs |
| Executive Reporting engine | `simulation/executive-reporting` | Import real report composer, test with evidence variants |
| Contradiction detection | `engines/contradiction` | Import real contradiction engine, stress-test edge cases |
| Cost-of-delay logic | `engines/cost-of-delay` | Import real cost calculation, test boundary conditions |
| Admin command centre | All modules | Link from admin nav sidebar |
| Contentlayer | `content/content-health` | Reuse `RouteChecker` component |
| Outbound publishing | `market/outbound` | Test post variants before publishing |
| Product engine tests | All engine modules | Run existing unit tests from UI, compare outputs |

### Implementation Priority

**Phase 1 (immediate):**
1. Create `/admin/research/` route with auth guard
2. Build hub page with module navigation
3. Extract and genericize `FormulaInspector`, `ComparisonDelta`, UI primitives
4. Move reference engine and simulation engine to `lib/research/`
5. Delete stale backups and duplicate auth

**Phase 2 (next):**
6. Build `simulation/fast-diagnostic` module (wraps real FD engine)
7. Build `engines/scoring` module (stress-test scoring changes)
8. Build `content/content-health` module (RouteChecker integration)

**Phase 3 (future):**
9. Build remaining simulation modules
10. Build market response lab
11. Build governance red team modules
12. Add batch runner and scenario comparison
