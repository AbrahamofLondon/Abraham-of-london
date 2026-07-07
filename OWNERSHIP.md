# Multi-agent ownership — flagship demo-to-evidence journey

**Purpose:** two agents (Claude + Codex) are active on this estate. This file records the
canonical branch and a non-overlapping file-ownership split so we do not commit parallel
versions of the same work or clobber each other. Read this before editing.

## Canonical trunk
- **`construction/estate-restoration`** is the single canonical branch (per
  `artifacts/validation/canonical-convergence/…`, which already classified
  `work/estate-market-restoration` as **superseded**).
- Do **not** commit flagship-journey work to `work/estate-market-restoration`. If a change
  exists only there, cherry-pick the delta onto canonical rather than maintaining two copies.
- Worktree for canonical: `C:/Dev/aol-estate-construction`.

## File ownership (to avoid clashes)

### Claude owns — the flagship buyer journey
- `lib/decision-instruments/decision-signal-engine.ts`, `decision-signal-samples.ts`
- `lib/demo/**` (journey-design tokens, funnel-event-store)
- `lib/engagements/**` (operator-pilot qualification + pilot-intake store)
- `pages/decision-instruments/signal/**`
- `pages/engagements/**` (operator-pilot + siblings, visual elevation)
- `pages/tools/decision-delay-exposure.tsx` (cost-of-delay elevation)
- `pages/corridor/**`, journey chrome of `pages/decision-centre.tsx`
- `pages/api/engagements/**`, `pages/api/demo/**`
- `tests/demo-journey/**`

### Codex owns — estate test/hygiene repair
- The 9 pre-existing estate-suite failures (instrument-pack catalogue, GMI surfacing copy,
  admin-nav registry, email/outbound env-state, Boardroom checkout).
- `tests/product-estate/**` proof-matrix + estate hygiene (except `tests/demo-journey/**`).
- Secondary-branch reconciliation.

## Protocol
- Commit small and often on canonical; never `git reset`/force another agent's commits.
- If you must touch a file the other owns, coordinate first (leave a note here) — do not
  overwrite a committed version with a parallel rewrite.
- The Decision Signal richer output model (evidence links, uncertainty, stable
  recommendation identity, carry-forward) is **already committed on canonical** at
  `839268809`; the durable funnel store at `93f0f0ecf`. Do not re-commit these elsewhere.
