# Definition of Clean

Clean means **reproducible under full validation**, not "it happened to compile once."

## Requirements

1. `git status` understood — no unexplained modifications or untracked files
2. TypeScript passes with **no exclusions** (`pnpm exec tsc --noEmit`)
3. Build passes (`pnpm build`)
4. Security audit passes or has documented false positives
5. PDF audit passes (`pnpm pdf:audit`)
6. Unit tests pass (`pnpm test:unit`)
7. Integration tests pass (`pnpm test:integration`)
8. E2E tests either pass or are explicitly marked non-blocking with reason
9. No untracked TypeScript files without justification
10. No client/server boundary violations

## Current Status (2026-04-28)

| Check | Status | Notes |
|---|---|---|
| TypeScript | PASS | 0 errors |
| Build | PASS | Exit 0 |
| PDF audit | PASS | 420 duplicate filename groups (warning, not blocker) |
| Unit tests | 52 failing / 157 passing | 9 files Codex-owned (contract changes), 2 predictive (partially fixed), 1 Layout (jsdom) |
| Integration tests | Not separated yet | Vitest runs all together |
| E2E tests | Excluded from Vitest | Run separately via Playwright |
| Security audit | PASS | Documented false positives |

## Non-Blocking Debt

- 9 test files need updates for Codex-modified module contracts
- E2E runner not yet configured for separate execution
- ESLint has broken `ajv` dependency (lint uses tsc as substitute)
- 420 PDF duplicate filename groups need cleanup
