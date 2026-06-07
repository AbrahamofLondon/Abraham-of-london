# Agent Execution Authority

**Version:** 1.0  
**Effective:** 2026-06-07  
**Project:** Abraham of London  
**Purpose:** No future agent should discover a permission boundary by accident. Every boundary is documented here.

---

## Classification Schema

| Code | Meaning |
|------|---------|
| `AGENT_ALLOWED` | Agent may execute without asking |
| `AGENT_ALLOWED_WITH_CONFIRMATION` | Agent may execute, but must state intent and get explicit user confirmation first |
| `MANUAL_ONLY` | Human must perform this action directly — agent must not attempt it |
| `NEVER_ALLOWED` | Unconditionally prohibited. Agent must refuse and escalate |
| `REQUIRES_SECRET_ACCESS` | Requires a credential the agent must not print, log, or expose |
| `REQUIRES_BROWSER_SESSION` | Requires an active human browser session in a dashboard |

---

## Git Operations

| Action | Classification | Notes |
|--------|---------------|-------|
| `git status` | `AGENT_ALLOWED` | Read-only |
| `git diff` | `AGENT_ALLOWED` | Read-only |
| `git log` | `AGENT_ALLOWED` | Read-only |
| `git add` (targeted files) | `AGENT_ALLOWED` | Preferred over `git add .` |
| `git add -A` / `git add .` | `AGENT_ALLOWED_WITH_CONFIRMATION` | Risk of including unintended files |
| `git commit` | `AGENT_ALLOWED_WITH_CONFIRMATION` | Agent must show commit message before committing |
| `git push origin main` | `AGENT_ALLOWED_WITH_CONFIRMATION` | Agent must confirm branch and summary |
| `git push --force` | `NEVER_ALLOWED` | No exceptions |
| `git reset --hard` | `MANUAL_ONLY` | Destructive |
| `git rebase -i` | `MANUAL_ONLY` | Interactive — requires human oversight |
| `git branch -D` (protected) | `NEVER_ALLOWED` | Never delete protected branches |
| `git tag` (release) | `AGENT_ALLOWED_WITH_CONFIRMATION` | Confirm tag name and target |

**Recurring blocker:** GitHub auth session expiry. Agents cannot re-authenticate interactively. If `git push` fails with auth error, the fix is `MANUAL_ONLY`: user must refresh GitHub token via `gh auth login` or SSH key setup.

**Important distinction:** `gh auth status` failure is not automatically a deployment blocker. On this Windows estate, npm-wrapper `gh.cmd` can fail when `powershell.exe` is missing from PATH while `git push --dry-run origin main` still succeeds. If Git push works, record GitHub CLI auth as a warning and proceed with normal confirmation gates. Prefer official GitHub CLI `gh.exe` over the npm wrapper.

---

## Prisma / Database

| Action | Classification | Notes |
|--------|---------------|-------|
| `prisma validate` | `AGENT_ALLOWED` | Read-only schema check |
| `prisma generate` | `AGENT_ALLOWED` | Safe — only regenerates client |
| `prisma migrate status` | `AGENT_ALLOWED` | Read-only |
| `prisma migrate dev` | `AGENT_ALLOWED_WITH_CONFIRMATION` | **Do not run against production-connected DB.** Check `DATABASE_URL` first. |
| `prisma migrate deploy` | `AGENT_ALLOWED_WITH_CONFIRMATION` | May alter production schema. Confirm migration name before running. |
| `prisma migrate reset` | `NEVER_ALLOWED` | Drops all data |
| `prisma db push` | `AGENT_ALLOWED_WITH_CONFIRMATION` | Skips migration history — use with caution |
| `prisma db pull` | `AGENT_ALLOWED_WITH_CONFIRMATION` | Overwrites schema |
| `prisma studio` | `MANUAL_ONLY` | Requires browser |
| `prisma migrate resolve --rolled-back` | `AGENT_ALLOWED_WITH_CONFIRMATION` | Needed to recover failed migrations |

**Recurring blocker:** Migration SQL uses SQLite types (`DATETIME`) on a PostgreSQL production DB. Always use `TIMESTAMPTZ` in migration SQL for this project (Neon = PostgreSQL).

**Recurring blocker:** Neon/Prisma DB connection requires valid `DATABASE_URL` in `.env`. Agents cannot create or rotate this secret.

---

## pnpm

| Action | Classification | Notes |
|--------|---------------|-------|
| `pnpm install` | `AGENT_ALLOWED` | Safe |
| `pnpm run build` | `AGENT_ALLOWED` | Local |
| `pnpm run test` | `AGENT_ALLOWED` | Safe |
| `pnpm run test:gmi` | `AGENT_ALLOWED` | Safe |
| `pnpm run lint` | `AGENT_ALLOWED` | Safe |
| `pnpm exec tsc --noEmit` | `AGENT_ALLOWED` | Safe |
| `pnpm exec prisma *` | See Prisma section | — |
| `pnpm add <package>` | `AGENT_ALLOWED_WITH_CONFIRMATION` | Confirm package and justification |
| `pnpm run seed:*` | `AGENT_ALLOWED_WITH_CONFIRMATION` | Always confirm target environment |
| `pnpm publish` | `MANUAL_ONLY` | Package publication — N/A for this project |

---

## Vercel

| Action | Classification | Notes |
|--------|---------------|-------|
| `vercel deploy --prod` | `AGENT_ALLOWED_WITH_CONFIRMATION` | Confirm branch and deploy summary |
| `vercel env list` | `AGENT_ALLOWED` | Lists env var names (not values) |
| `vercel env add` | `REQUIRES_BROWSER_SESSION` | Use Vercel dashboard |
| `vercel env remove` | `REQUIRES_BROWSER_SESSION` | Use Vercel dashboard |
| Vercel project settings | `REQUIRES_BROWSER_SESSION` | — |
| Vercel domain configuration | `REQUIRES_BROWSER_SESSION` | — |
| Vercel billing settings | `MANUAL_ONLY` | Human only |
| Disable preview deployments | `MANUAL_ONLY` | Dashboard setting |

**Recurring blocker:** Vercel auth session expires. Agent cannot re-authenticate. `vercel whoami` will fail. Fix is `MANUAL_ONLY`: user runs `vercel login` in terminal.

---

## Stripe

| Action | Classification | Notes |
|--------|---------------|-------|
| Stripe webhook creation | `MANUAL_ONLY` | Stripe Dashboard only |
| Stripe webhook deletion | `MANUAL_ONLY` | Stripe Dashboard only |
| Stripe webhook list | `REQUIRES_SECRET_ACCESS` | Via API key, key must not be printed |
| Stripe product/price create | `AGENT_ALLOWED_WITH_CONFIRMATION` | Via API, confirm before executing |
| Stripe payment refund | `MANUAL_ONLY` | Financial action — human only |
| Stripe payout | `MANUAL_ONLY` | Financial action — human only |
| Stripe billing portal config | `REQUIRES_BROWSER_SESSION` | Dashboard |
| Stripe API key (read) | `REQUIRES_SECRET_ACCESS` | Never print/log |
| Stripe API key (rotate) | `MANUAL_ONLY` | Human action |
| Any live charge execution | `NEVER_ALLOWED` | Agents never execute financial transactions |

---

## Production HTTP Smoke Tests

| Action | Classification | Notes |
|--------|---------------|-------|
| `GET` public production routes | `AGENT_ALLOWED` | WebFetch or curl read-only |
| `GET` admin routes | `AGENT_ALLOWED_WITH_CONFIRMATION` | Confirm route is safe to probe |
| `POST` to production API | `MANUAL_ONLY` | No write ops to production via agent |

---

## Environment Variables / Secrets

| Action | Classification | Notes |
|--------|---------------|-------|
| Read `NEXT_PUBLIC_*` values | `AGENT_ALLOWED` | Public by definition |
| Read non-secret env names | `AGENT_ALLOWED` | Names (not values) are safe |
| Read `DATABASE_URL` value | `REQUIRES_SECRET_ACCESS` | Never print in full |
| Print/log any secret | `NEVER_ALLOWED` | Absolute prohibition |
| Write `.env.local` (non-secret) | `AGENT_ALLOWED_WITH_CONFIRMATION` | Confirm contents |
| Write production env values | `MANUAL_ONLY` | Use Vercel dashboard |
| Rotate any secret | `MANUAL_ONLY` | Human action only |

---

## Database Seed Scripts

| Action | Classification | Notes |
|--------|---------------|-------|
| Dry-run seed (`--dry-run` mode) | `AGENT_ALLOWED` | No DB writes |
| Dev seed (non-production DB) | `AGENT_ALLOWED_WITH_CONFIRMATION` | Confirm target DB |
| Production seed (`--confirm-production-seed`) | `AGENT_ALLOWED_WITH_CONFIRMATION` | Explicit flag required; agent must confirm edition and no-overwrite behaviour |
| Production seed without confirmation flag | `NEVER_ALLOWED` | Script guards this; agent must respect it |

---

## Local File Operations

| Action | Classification | Notes |
|--------|---------------|-------|
| Read any project file | `AGENT_ALLOWED` | — |
| Write `lib/`, `app/`, `tests/`, `scripts/` | `AGENT_ALLOWED` | Standard work |
| Write `prisma/schema.prisma` | `AGENT_ALLOWED_WITH_CONFIRMATION` | Schema changes are high-impact |
| Write `prisma/migrations/` | `AGENT_ALLOWED_WITH_CONFIRMATION` | Must validate SQL dialect |
| Write `.env`, `.env.local` | `AGENT_ALLOWED_WITH_CONFIRMATION` | Confirm no secrets are logged |
| Write `package.json` | `AGENT_ALLOWED_WITH_CONFIRMATION` | Confirm script changes |
| Delete production files | `MANUAL_ONLY` | — |

**Recurring blocker:** Windows path separator. Use forward slashes in code; Bash on Windows works with `/c/aol-check-visual/` or `C:/aol-check-visual/`. Git Bash resolves both.

---

## PowerShell / Shell

| Action | Classification | Notes |
|--------|---------------|-------|
| Read-only Bash commands | `AGENT_ALLOWED` | `ls`, `cat`, `grep`, `find` |
| File-writing Bash commands | `AGENT_ALLOWED` | Standard workflow |
| `Stop-Process` / `kill` on Node or builds | `NEVER_ALLOWED` | Other agents may share the process |
| PowerShell execution policy change | `MANUAL_ONLY` | System-level change |
| Service restart | `AGENT_ALLOWED_WITH_CONFIRMATION` | Confirm service name |

Required PATH/readiness checks before major work:

- `powershell.exe` from `C:\Windows\System32\WindowsPowerShell\v1.0`
- `pwsh.exe`
- `git.exe`
- `node.exe`
- `pnpm.cmd` or `pnpm.exe`
- Prisma via `pnpm exec prisma`
- official GitHub CLI `gh.exe` when available

If `powershell.exe` is missing, add `C:\Windows\System32\WindowsPowerShell\v1.0` to PATH. If official `gh.exe` is missing and only the npm wrapper is present, treat `gh auth status` as warning-only when Git push dry-run succeeds.

---

## Protected Branch Restrictions

| Action | Classification | Notes |
|--------|---------------|-------|
| Push to `main` (unprotected) | `AGENT_ALLOWED_WITH_CONFIRMATION` | Standard |
| Push to `main` (branch protected) | `REQUIRES_BROWSER_SESSION` | Must create PR via GitHub UI or `gh pr create` |
| Bypass branch protection | `NEVER_ALLOWED` | — |
| Merge PR | `AGENT_ALLOWED_WITH_CONFIRMATION` | Via `gh pr merge` |

---

## Auth / Session Expiry — Recovery Paths

| Session | Expiry Signal | Recovery |
|---------|--------------|----------|
| GitHub (HTTPS) | `git push` returns 401/403 | `MANUAL_ONLY`: `gh auth login` |
| GitHub (SSH) | `git push` returns "Permission denied" | `MANUAL_ONLY`: verify SSH key |
| Vercel CLI | `vercel whoami` fails | `MANUAL_ONLY`: `vercel login` |
| Neon DB | `prisma migrate` connection refused | `MANUAL_ONLY`: check Neon dashboard, rotate credentials if needed |
| Stripe Dashboard | Session timeout | `MANUAL_ONLY`: re-login in browser |

---

## Absolute Prohibitions (NEVER_ALLOWED)

These may not be overridden under any circumstances:

1. `git push --force` to any branch
2. `prisma migrate reset` against any database
3. Printing, logging, or echoing any secret value
4. Executing any financial transaction (charge, refund, payout)
5. Deleting protected branches
6. Killing Node or build processes that may be shared by other agents
7. Bypassing branch protection rules
8. Running production seeds without the `--confirm-production-seed` flag
9. Truncating or dropping tables
