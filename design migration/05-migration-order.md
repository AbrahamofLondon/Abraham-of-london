# Migration Order

## Rule zero

No destructive rewrite.

No broad deletion before proof.

No homepage-first redesign.

## Phase 0 — Audit and freeze

### Required actions

- inventory all current card and content-surface components
- record current props and hidden behavior
- identify business-critical pages and surfaces
- capture screenshots/baselines for major routes
- note known contrast failures and unstable hero regions
- note existing image-loading assumptions and fallback logic

### Output

- migration matrix
- risk map
- legacy dependency list

### Acceptance gate

No implementation begins until the current surface landscape is understood.

## Phase 1 — Foundations only

### Build

- `lib/design-system/tokens.ts`
- `lib/design-system/semantic.ts`
- `lib/design-system/surfaces.ts`
- `styles/design-system.css`
- Tailwind bridge support if needed

### Constraints

- do not migrate production pages yet
- do not delete legacy styling yet

### Acceptance gate

- types compile
- token model is coherent
- semantic mapping exists
- surfaces have explicit contracts

## Phase 2 — Primitive layer

### Build

- `CardShell`
- `SmartCover` refinement if needed
- `ContentMeta`
- `SurfaceHeader`
- `ReaderFrame`
- `ActionLink`
- `SectionDivider`
- `FilterBar`
- `EmptyState`
- `SurfaceNav`

### Acceptance gate

- primitives are typed
- visual behavior is stable
- no page-specific business logic is buried inside primitives

## Phase 3 — Pilot surface A: Canon

### Scope

Migrate Canon only.

### Goals

- prove editorial warmth
- prove reader comfort
- prove serif-forward system discipline
- prove gradient/scrim rules on warm editorial surfaces

### Acceptance gate

- strong legibility
- no contrast regressions
- no layout instability
- content behavior preserved

## Phase 4 — Pilot surface B: Vault

### Scope

Migrate Vault only.

### Goals

- prove technical density
- prove compact metadata handling
- prove cool technical surface contrast
- prove system can handle denser informational surfaces

### Acceptance gate

- high metadata clarity
- no readability collapse on dark technical panels
- no performance surprises from decorative layers

## Phase 5 — Pilot review checkpoint

Do not continue automatically.

### Review required

- visual comparison
- accessibility review
- contrast review
- performance sanity review
- hidden business-logic regression check

### Acceptance gate

Only continue if Canon and Vault are both approved.

## Phase 6 — Reading surfaces

### Migrate

- Essays
- Shorts
- Books

### Goals

- stable editorial card system
- stable reader system
- strong cover treatment discipline

## Phase 7 — Utility and restricted surfaces

### Migrate

- Resources
- Downloads
- Library
- Events
- Inner Circle
- Editorial
- Vault Briefs

### Goals

- reinforce reuse
- handle utility surfaces without visual drift
- prove restricted-state styling is quiet and controlled

## Phase 8 — Home page last

### Why last

The home page is where teams are most tempted to overperform aesthetically and underperform functionally.

By this point the rules should already be proven elsewhere.

### Goals

- institutional authority
- cinematic restraint
- fully stabilized hero
- no illegible atmospheric experiments

## Removal phase — legacy retirement

Legacy components and styling may only be removed after:

- corresponding new surface is live and approved
- no behavior loss remains
- screenshots match expected quality
- accessibility criteria pass
- rollback is no longer needed

## Required validation at each phase

At minimum:

- local type check
- local build
- route-specific smoke review
- contrast review for changed surfaces
- responsive sanity review

## Stop conditions

Stop and return for review if any of the following occur:

- card abstraction starts bloating
- raw color drift appears in components
- gradient/text legibility becomes ambiguous
- old business logic cannot be mapped cleanly
- performance regresses materially
- migration scope begins expanding beyond the phase
