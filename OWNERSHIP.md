# Multi-agent ownership — demo-to-evidence final closure

**Current authority state:** ACTIVE WRITER: CODEX.

- **CODEX:** ACTIVE / SOLE WRITER in `C:/Dev/aol-estate-construction` until completion or clean handoff.
- **CLAUDE:** INACTIVE / USAGE EXHAUSTED. Prior Claude-owned flagship journey lane is transferred to Codex.
- **DEEPSEEK:** NOT AUTHORISED TO WRITE in this worktree until a clean handoff is produced or a separate worktree/branch is explicitly created.

## Canonical trunk
- **`construction/estate-restoration`** is the single canonical branch (per
  `artifacts/validation/canonical-convergence/…`, which already classified
  `work/estate-market-restoration` as **superseded**).
- Do **not** commit runtime or flagship-journey work to `work/estate-market-restoration`.
  If a change exists only there, cherry-pick or port the delta onto canonical rather than
  maintaining two copies.
- Canonical worktree: `C:/Dev/aol-estate-construction`.
- Superseded worktree: `C:/aol-check-visual` — no runtime development.

## Current file ownership

Codex owns all demo-to-evidence closure work, including:

- assessment-estate readiness audit and surface inventory;
- disabled-interaction and stale-blockade remediation;
- assessment design convergence;
- clean-room PostgreSQL reproducibility;
- complete estate-suite repair;
- build and clean-room verification;
- Signal journey integration;
- Corridor;
- Operator Pilot, pilot lifecycle, customer status, operator queue, and pilot security;
- journey telemetry and conversion dashboard;
- guided four-pillar demo;
- commercial truth audit, corrected investor audit, buyer wedge, minimum sellable corridor,
  founding-customer programme, hostile demo testing, and true local end-to-end journey.

Historical note: the Decision Signal richer output model is committed on canonical at
`839268809`; durable funnel store at `93f0f0ecf`; conversion dashboard/live journey wiring at
`59b98a113`. Do not recreate parallel versions on another branch.

## Protocol — shared worktree discipline

This worktree may later be reused by another agent, so keep strict staging discipline:

- **Never `git add -A` / `git add .`** — stage exact paths only.
- Before every commit:
  1. `git status --short`
  2. inspect exact unstaged diff for owned paths
  3. `git add <exact path...>`
  4. `git diff --cached`
  5. `git commit`
- Do not use `git reset --hard`, `git clean -fd`, `git restore .`, or broad checkout/restore
  operations unless the owner explicitly authorises them.
- Commit coherent units and keep the tree clean at handoff.
- If another writer must run concurrently, create a separate worktree and branch; do not share
  this worktree simultaneously.