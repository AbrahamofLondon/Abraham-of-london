# Decision R&D Centre — Architecture Specification

**Date:** 2026-05-24
**Status:** Draft for review
**Route:** `/admin/research`
**Title:** Decision R&D Centre
**Auth:** Admin/owner/operator-only via `requireAdminServer()`

---

## 1. Core Principles

1. **Do not expose publicly.** This is an internal R&D surface. Every page under `/admin/research/` must be protected by `requireAdminServer()` in the layout.

2. **Every module connects to a real engine or is explicitly marked as a reference model.** No toy math in production modules. The original OGR model is kept as a "reference model" for comparison purposes only.

3. **Every module can save and compare scenarios.** The baseline comparison pattern from the current lab is promoted to a core feature.

4. **Every module can show formula traces.** The `FormulaInspector` pattern is promoted to a core debugging tool available on any computed value.

5. **Modules are independent.** Each module can be built, tested, and deployed independently. No cross-module coupling.

6. **The R&D Centre is a test bed, not a product surface.** Results from the R&D Centre must never leak to public or authenticated user surfaces without explicit governance review.

---

## 2. Route Architecture

```
/admin/research/
├── page.tsx                         ← Hub / Dashboard
├── layout.tsx                       ← Auth guard
│
├── simulation/                      ← Product Simulation
│   ├── page.tsx                     ← Module index
│   ├── fast-diagnostic/page.tsx     ← FD scenario tests
│   ├── purpose-alignment/page.tsx   ← PA simulation
│   ├── constitutional/page.tsx      ← Constitutional simulation
│   ├── executive-reporting/page.tsx ← ER simulation
│   ├── strategy-room/page.tsx       ← Strategy Room simulation
│   └── boardroom/page.tsx           ← Boardroom qualification simulation
│
├── engines/                         ← Engine Testing
│   ├── page.tsx                     ← Module index
│   ├── scoring/page.tsx             ← Scoring change tests
│   ├── contradiction/page.tsx       ← Contradiction detection tests
│   ├── cost-of-delay/page.tsx       ← Cost-of-delay tests
│   ├── pattern-recurrence/page.tsx  ← Pattern recurrence tests
│   ├── decision-credit/page.tsx     ← Decision credit tests
│   ├── consequence/page.tsx         ← Consequence engine tests
│   ├── retainer-readiness/page.tsx  ← Retainer readiness tests
│   ├── report-lineage/page.tsx      ← Report lineage tests
│   └── enforcement/page.tsx         ← Enforcement gate tests
│
├── market/                          ← Market Response Lab
│   ├── page.tsx                     ← Module index
│   ├── positioning/page.tsx         ← Positioning tests
│   ├── ctas/page.tsx                ← CTA tests
│   ├── outbound/page.tsx            ← Outbound post tests
│   ├── naming/page.tsx              ← Naming tests
│   ├── pathways/page.tsx            ← Buyer pathway tests
│   └── objections/page.tsx          ← Objection tests
│
├── red-team/                        ← Governance Red Team
│   ├── page.tsx                     ← Module index
│   ├── claim-risk/page.tsx          ← Claim risk detection
│   ├── overclaim/page.tsx           ← Overclaim detection
│   ├── ip-leak/page.tsx             ← IP leak scanning
│   ├── evidence-posture/page.tsx    ← Evidence posture enforcement
│   ├── contradiction-scan/page.tsx  ← Product contradiction scanning
│   └── competitive/page.tsx         ← Competitive red team
│
├── content/                         ← Content & Category Lab
│   ├── page.tsx                     ← Module index
│   ├── category/page.tsx            ← Category formation tests
│   ├── editorial/page.tsx           ← Editorial testing
│   ├── seo/page.tsx                 ← SEO scenario tests
│   └── health/page.tsx              ← Contentlayer manifest debug
│
└── reference/                       ← Reference Models
    ├── page.tsx                     ← Module index
    ├── ogr/page.tsx                 ← Original OGR reference model
    └── comparison/page.tsx          ← Engine comparison dashboard
```

---

## 3. Shared Component Library (`components/research/`)

### 3.1 `SimulationShell.tsx`

Generic 3-panel layout for any simulation module:

```
┌──────────────────────────────────────────────────┐
│ Header: Module name + description + controls     │
├──────────────────┬───────────────────────────────┤
│  INPUT PANEL     │  OUTPUT PANEL                 │
│                  │                               │
│  Sliders,        │  Metric cards with            │
│  toggles,        │  FormulaInspector wrappers    │
│  text inputs     │                               │
│                  │  ┌─────┐ ┌─────┐ ┌─────┐     │
│  [Input 1] ────  │  │ M1  │ │ M2  │ │ M3  │     │
│  [Input 2] ────  │  └─────┘ └─────┘ └─────┘     │
│  [Input 3] ────  │                               │
│                  │  Protocol check section        │
│  [Run] [Save]    │  ✓ Check 1                    │
│                  │  ✗ Check 2                    │
├──────────────────┴───────────────────────────────┤
│  ComparisonDelta (if baseline is locked)          │
└──────────────────────────────────────────────────┘
```

**Props:**
```typescript
interface SimulationShellProps {
  title: string;
  description: string;
  moduleId: string;
  inputs: React.ReactNode;
  outputs: React.ReactNode;
  checks: React.ReactNode;
  onRun: () => void;
  onSave: () => void;
  onReset: () => void;
  isRunning?: boolean;
  comparisonDelta?: React.ReactNode;
}
```

### 3.2 `NumericControl.tsx`

Generic slider control. Extracted from current workbench, no changes needed except decoupling from workbench-specific styling.

### 3.3 `OutputCard.tsx`

Generic metric display card. Extracted from current workbench, no changes needed.

### 3.4 `CheckItem.tsx`

Generic protocol check item. Extracted from current workbench, no changes needed.

### 3.5 `ComparisonDelta.tsx` (genericized)

**Current:** Coupled to `useOGRStore` and hardcoded to alpha/certainty/velocity metrics.

**Target:** Accepts generic props:
```typescript
interface ComparisonDeltaProps {
  baseline: Record<string, number>;
  current: Record<string, number>;
  metrics: Array<{
    key: string;
    label: string;
    format: (value: number) => string;
    positiveIsBetter?: boolean;
  }>;
  onClearBaseline: () => void;
  onSetBaseline: () => void;
}
```

### 3.6 `FormulaInspector.tsx` (genericized)

**Current:** Coupled to `useOGRStore` and hardcoded to 4 formula types.

**Target:** Accepts generic props:
```typescript
interface FormulaInspectorProps {
  label: string;
  formula: string;
  inputs: Array<{ name: string; value: string | number }>;
  result: string | number;
  description: string;
  children: React.ReactNode;
}
```

### 3.7 `EngineRunner.tsx`

Generic engine runner that:
1. Accepts an engine module (function with typed inputs/outputs)
2. Renders a `SimulationShell` with auto-generated inputs from the engine's input type
3. Runs the engine on input change (or on "Run" button click)
4. Renders outputs using `OutputCard` + `FormulaInspector`
5. Supports baseline comparison
6. Supports saving scenarios

```typescript
interface EngineRunnerProps<TInput, TOutput> {
  engine: {
    id: string;
    name: string;
    description: string;
    run: (input: TInput) => TOutput;
    inputConfig: InputConfig<TInput>;
    outputConfig: OutputConfig<TOutput>;
  };
}
```

### 3.8 `ScenarioHistory.tsx`

Browser of saved scenarios. Shows:
- Scenario name/ID
- Timestamp
- Engine module used
- Input values
- Output values
- Delta from baseline (if applicable)
- Export/delete actions

### 3.9 `ScenarioDiff.tsx`

Side-by-side comparison of two scenarios. Shows:
- Input differences highlighted
- Output differences highlighted
- Net delta summary

### 3.10 `BatchRunner.tsx`

Run an engine across N input combinations:
- Define input ranges (e.g., resonance: [0, 25, 50, 75, 100], friction: [0, 33, 66, 99])
- Run all combinations
- Show results as a table or heatmap
- Export results as CSV

---

## 4. Core Libraries (`lib/research/`)

### 4.1 `reference-engine.ts`

The original OGR model, preserved as a baseline reference. No changes to the math. Used for:
- Regression testing when real engines change
- Comparison against real engine outputs
- Training new team members on the R&D Centre patterns

### 4.2 `engine-registry.ts`

Registry of all testable engines. Each engine module registers itself:
```typescript
interface EngineModule<TInput, TOutput> {
  id: string;
  name: string;
  description: string;
  category: 'simulation' | 'engine' | 'reference';
  run: (input: TInput) => TOutput;
  inputSchema: Record<string, InputField>;
  outputSchema: Record<string, OutputField>;
}

const engineRegistry = new Map<string, EngineModule<any, any>>();
```

### 4.3 `scenario-store.ts`

Generic scenario state management. Replaces `useOGRStore`:
```typescript
interface ScenarioState {
  scenarios: Scenario[];
  currentInputs: Record<string, number>;
  currentOutputs: Record<string, number>;
  baseline: Scenario | null;
  saveScenario: (name: string) => Promise<string>;
  loadScenario: (id: string) => void;
  deleteScenario: (id: string) => void;
  setBaseline: () => void;
  clearBaseline: () => void;
  compareWithBaseline: () => Delta | null;
}
```

### 4.4 `batch-runner.ts`

Batch execution engine:
```typescript
interface BatchConfig {
  engineId: string;
  inputRanges: Record<string, number[]>;
}

interface BatchResult {
  engineId: string;
  timestamp: string;
  results: Array<{
    inputs: Record<string, number>;
    outputs: Record<string, number>;
  }>;
}
```

---

## 5. Module Specifications

### 5.1 Product Simulation Modules

Each simulation module:
1. Imports the real product engine function
2. Provides synthetic inputs (sliders, text inputs, toggles)
3. Runs the engine and displays outputs
4. Supports baseline comparison
5. Supports saving scenarios
6. Shows formula traces via `FormulaInspector`

**Fast Diagnostic Simulator:**
- Inputs: Decision clarity (slider), Prior attempt (toggle), Cost of delay (slider)
- Engine: Real FD scoring function
- Outputs: Condition label, confidence score, route recommendation
- Tests: "What if user answers differently?" scenarios

**Constitutional Diagnostic Simulator:**
- Inputs: 10 question responses (sliders or toggles)
- Engine: Real constitutional routing logic
- Outputs: Route (REJECT/DIAGNOSTIC/STRATEGY), posture label, readiness tier
- Tests: Edge case inputs, contradictory responses

**Executive Reporting Simulator:**
- Inputs: Evidence completeness (slider), assessment scores, financial data
- Engine: Real ER composer
- Outputs: Report sections, financial exposure, recommendations
- Tests: Thin evidence scenarios, extreme financial inputs

### 5.2 Engine Testing Modules

Each engine testing module:
1. Imports the real engine function
2. Provides parameterized inputs
3. Runs the engine with current production parameters
4. Allows changing parameters and re-running
5. Shows diff between old and new outputs
6. Supports batch runs across parameter ranges

**Scoring Change Tester:**
- Load current scoring parameters
- Allow editing parameters
- Run with sample inputs
- Show output diff
- Flag regressions

**Contradiction Detection Tester:**
- Load current contradiction rules
- Input synthetic evidence sets
- Run contradiction detection
- Show detected contradictions
- Test edge cases

### 5.3 Market Response Lab Modules

Each market module:
1. Stores variant configurations
2. Renders variants side by side
3. Allows annotation and rating
4. Supports export for review

**Positioning Tester:**
- Store N positioning variants
- Render each with the same product description
- Rate each on clarity, differentiation, credibility
- Track ratings over time

**Outbound Post Tester:**
- Compose post variants
- Render in context (simulated feed)
- Test against character limits, platform rules
- Flag compliance issues (overclaim, unearned authority)

### 5.4 Governance Red Team Modules

Each red team module:
1. Scans the codebase or product surface
2. Reports findings with severity
3. Tracks findings over time (regression detection)
4. Links to remediation guidance

**Claim Risk Detector:**
- Scan public-facing strings for overclaim patterns
- Check against evidence posture rules
- Flag claims that exceed available evidence
- Generate remediation report

**IP Leak Scanner:**
- Scan API responses for internal engine terms
- Check client bundles for proprietary logic
- Flag exposed configuration or thresholds
- Track leak closure over time

### 5.5 Content & Category Lab Modules

**Content Health (RouteChecker integration):**
- Display Contentlayer document counts
- Show route coverage
- Flag missing or broken content
- Monitor content build status

---

## 6. Data Model

### 6.1 Scenario

```typescript
interface Scenario {
  id: string;
  name: string;
  moduleId: string;
  engineId: string;
  createdAt: string;
  updatedAt: string;
  inputs: Record<string, number | string | boolean>;
  outputs: Record<string, number | string | boolean>;
  tags: string[];
  notes: string;
}
```

### 6.2 ScenarioComparison

```typescript
interface ScenarioComparison {
  id: string;
  baselineId: string;
  comparisonId: string;
  deltas: Array<{
    field: string;
    baselineValue: number | string;
    comparisonValue: number | string;
    delta: number | null;
  }>;
  createdAt: string;
}
```

### 6.3 BatchRun

```typescript
interface BatchRun {
  id: string;
  engineId: string;
  config: BatchConfig;
  results: BatchResult;
  createdAt: string;
  duration: number;
}
```

---

## 7. Integration with Admin Navigation

Add a new section to `ADMIN_NAVIGATION`:

```typescript
{
  id: "research",
  label: "R&D Centre",
  items: [
    {
      id: "research-hub",
      label: "Decision R&D Centre",
      href: "/admin/research",
      router: "app",
      visibility: "admin",
      status: "active",
      description: "Strategic simulation, engine testing, market response lab, and governance red team"
    },
    {
      id: "research-simulation",
      label: "Product Simulation",
      href: "/admin/research/simulation",
      router: "app",
      visibility: "admin",
      status: "rough",
      description: "Test diagnostic and product outcomes before exposing to users"
    },
    {
      id: "research-engines",
      label: "Engine Testing",
      href: "/admin/research/engines",
      router: "app",
      visibility: "admin",
      status: "rough",
      description: "Stress-test internal engines, scoring, and formulas"
    },
    {
      id: "research-market",
      label: "Market Response Lab",
      href: "/admin/research/market",
      router: "app",
      visibility: "admin",
      status: "stub",
      description: "Test category language, positioning, and buyer-response assumptions"
    },
    {
      id: "research-red-team",
      label: "Governance Red Team",
      href: "/admin/research/red-team",
      router: "app",
      visibility: "admin",
      status: "stub",
      description: "Attack product logic before critics, competitors, or clients do"
    },
    {
      id: "research-content",
      label: "Content & Category Lab",
      href: "/admin/research/content",
      router: "app",
      visibility: "admin",
      status: "stub",
      description: "Test category formation, editorial, and content health"
    },
    {
      id: "research-reference",
      label: "Reference Models",
      href: "/admin/research/reference",
      router: "app",
      visibility: "admin",
      status: "active",
      description: "Baseline reference models for engine comparison"
    },
  ],
}
```

---

## 8. Migration Path

### Step 1: Create route structure (immediate)
```
mkdir -p app/admin/research/simulation
mkdir -p app/admin/research/engines
mkdir -p app/admin/research/market
mkdir -p app/admin/research/red-team
mkdir -p app/admin/research/content
mkdir -p app/admin/research/reference
mkdir -p components/research
mkdir -p lib/research
```

### Step 2: Move and genericize existing assets (immediate)
- Move `app/testing/layout.tsx` → `app/admin/research/layout.tsx`
- Create `app/admin/research/page.tsx` (hub page)
- Move `lib/ogr/manifest-engine.ts` → `lib/research/reference-engine.ts`
- Move `lib/ogr/manifest-engine.test.ts` → `lib/research/reference-engine.test.ts`
- Move `lib/ogr/simulation-engine.ts` → `lib/scoring/weighted-scoring-engine.ts`
- Extract UI primitives to `components/research/`
- Genericize `FormulaInspector` → `components/research/FormulaInspector.tsx`
- Genericize `ComparisonDelta` → `components/research/ComparisonDelta.tsx`

### Step 3: Delete deprecated assets (immediate)
- Delete `lib/ogr/server-auth.ts`
- Delete `lib/ogr/client-config.ts`
- Delete `store/useOGRStore.ts`
- Delete `components/analysis/_archive/`
- Delete `app/testing/` (entire directory)
- Delete `components/analysis/StrategicStressWorkbench.tsx`

### Step 4: Build first simulation module (next)
- Build `app/admin/research/simulation/fast-diagnostic/page.tsx`
- Wire to real Fast Diagnostic engine
- Use `SimulationShell` + `FormulaInspector` + `ComparisonDelta`

### Step 5: Build remaining modules (ongoing)
- Prioritise by product need
- Each module is independent — build in any order

---

## 9. Security Considerations

1. **All routes under `/admin/research/` are admin-only.** The layout enforces `requireAdminServer()`.

2. **No R&D Centre data leaks to public surfaces.** Scenario data, engine test results, and market response data are stored separately from production data.

3. **Engine testing modules run real product engines.** Ensure test runs do not write to production databases or trigger real side effects. All engine calls in the R&D Centre should use a "dry-run" mode.

4. **Market response lab stores variant data.** Ensure variant data (positioning tests, CTA tests) is not accidentally exposed through API endpoints or content queries.

5. **Red team modules scan the codebase.** Ensure scan results are stored internally and never exposed through public API responses.
