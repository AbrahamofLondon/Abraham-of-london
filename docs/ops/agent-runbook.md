# Agent Execution Runbook

**Version:** 1.0  
**Effective:** 2026-06-07  
**Project:** Abraham of London  
**Purpose:** Agents execute from this runbook without improvising. Each sequence is ordered, tested, and safe.

See also: `docs/ops/agent-execution-authority.md` for permission classifications.  
See also: `ops/agent-permissions.json` for machine-readable permission matrix.

---

## 1. Standard Validation Sequence

Run before committing, migrating, or deploying. Run in this order.

```bash
# 0. Agent execution readiness
pnpm agent:readiness

# 1. Schema integrity
pnpm exec prisma validate

# 2. Migration alignment
pnpm exec prisma migrate status

# 3. TypeScript — all errors, no suppression
# Run synchronously. Do not background this step. Read the full output before proceeding.
# next build runs stricter checks than tsc --noEmit alone — if in doubt, run next build locally.
pnpm exec tsc --noEmit --pretty false 2>&1 | head -60

# 4. GMI test suite (when GMI files are involved)
pnpm run test:gmi

# 5. Whitespace/conflict markers
git diff --check
```

**What each failure means:**

| Command | Failure Cause | Fix |
|---------|-------------|-----|
| `prisma validate` | Model syntax error in schema.prisma | Fix schema, re-validate |
| `prisma migrate status` | Unapplied migration | Run `migrate deploy` (confirm first) |
| `tsc --noEmit` | Type error in new or changed files | Fix types, do not suppress with `@ts-ignore` |
| `test:gmi` | Test regression | Fix test or fix implementation — do not skip |
| `git diff --check` | Trailing whitespace or conflict markers | Fix before committing |

**Readiness interpretation:** `gh auth status` is warning-only when `git push --dry-run origin main` succeeds. Do not block deployment solely because the GitHub CLI npm wrapper fails. If `powershell.exe` is missing, add `C:\Windows\System32\WindowsPowerShell\v1.0` to PATH and prefer official GitHub CLI `gh.exe`.

---

## 2. Commit and Push Sequence

**Always targeted — never `git add .` without review.**

```bash
# 1. Review current state
git status
git diff --stat

# 2. Add only the files changed for this task
git add lib/intelligence/gmi-edition-resolver.ts
git add tests/intelligence/gmi-edition-parametric.test.ts
# ... targeted adds only

# 3. Confirm what is staged
git diff --cached --stat

# 4. Commit with descriptive message
git commit -m "feat(gmi): add edition-parametric resolver and Q3 dry-run seed

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"

# 5. Push
git push origin main
```

**Blockers and recovery:**

| Error | Recovery |
|-------|---------|
| `remote: Permission denied` | `MANUAL_ONLY` — user must refresh GitHub auth |
| `Updates were rejected` (non-fast-forward) | Pull first: `git pull --rebase origin main` |
| `protected branch` rejection | Create PR via `gh pr create` instead |
| `pre-commit hook failed` | Fix the issue; create a **new** commit — never `--amend` after hook failure |

---

## 3. Migration Sequence

### 3a. Development (non-production DB)

```bash
# Verify you are NOT pointed at production
echo $DATABASE_URL | cut -c1-40  # Show first 40 chars only — do not print full URL

# Create migration (development only)
pnpm exec prisma migrate dev --name "add_gmi_benchmark_entries"

# Validate result
pnpm exec prisma migrate status
pnpm exec prisma validate
```

**Rule:** Do not run `migrate dev` against `neon.tech` production URL unless explicitly instructed.

### 3b. Production Deployment

```bash
# 1. Always validate schema first
pnpm exec prisma validate

# 2. Check what will be applied
pnpm exec prisma migrate status

# 3. Deploy (requires confirmation)
pnpm exec prisma migrate deploy

# 4. Verify
pnpm exec prisma migrate status
```

**If a migration fails (e.g. wrong SQL dialect):**

```bash
# Mark it rolled back
pnpm exec prisma migrate resolve --rolled-back <migration_name>

# Fix the migration.sql file
# Then re-run
pnpm exec prisma migrate deploy
```

**PostgreSQL vs SQLite — Critical Rule:**  
This project uses **PostgreSQL (Neon)** in production and may use SQLite locally.  
- Use `TIMESTAMPTZ` (not `DATETIME`) in migration SQL  
- Use `TEXT` for strings, `BOOLEAN` for booleans, `INTEGER` for integers  
- Do NOT use SQLite-specific types in migration files  

---

## 4. Seed Sequence

```bash
# 1. Always dry-run first
node scripts/seed-gmi-q3-2026-dry-run.mjs

# 2. Review output — confirm edition, no-overwrite behaviour

# 3. Confirm target edition (print it)
echo "Target edition: GMI-Q3-2026"

# 4. If production seed needed, require explicit flag
node scripts/seed-gmi-q2-2026.mjs --confirm-production-seed

# Rules:
# - Dry-run never writes to DB
# - Production seed requires --confirm-production-seed
# - Script must check NODE_ENV !== 'production' || --confirm-production-seed
# - Never override existing data without --force
```

---

## 5. Production Smoke Test Sequence

### Public routes (expected: 200, no auth gate)

| Route | Expected Status | Expected Content |
|-------|----------------|-----------------|
| `/intelligence/gmi` | 200 | HTML — GMI landing |
| `/intelligence/gmi/q2-2026` | 200 | HTML — Operator dashboard |
| `/intelligence/gmi/calls` | 200 | HTML — Call ledger |
| `/intelligence/gmi/performance` | 200 | HTML — Performance centre |
| `/intelligence/gmi/falsification` | 200 | HTML — Falsification register |
| `/intelligence/gmi/operator-brief` | 200 | HTML — Operator brief |
| `/intelligence/gmi/board-pulse` | 200 | HTML — Board pulse |
| `/api/gmi/board-pack?edition=GMI-Q2-2026&format=pdf` | 200 | `application/pdf`, length > 0 |

### API routes (expected: 200, JSON with `data` + `provenance`)

| Route | Expected Status | Notes |
|-------|----------------|-------|
| `/api/gmi/editions` | 200 | Array of published editions |
| `/api/gmi/calls?edition=GMI-Q2-2026` | 200 | Public call data, no private fields |
| `/api/gmi/performance?edition=GMI-Q2-2026` | 200 | Performance metrics |
| `/api/gmi/falsification?edition=GMI-Q2-2026` | 200 | Falsification rules, no adminNotes |
| `/api/gmi/board-pulse?edition=GMI-Q2-2026` | 200 | Board pulse data |

### Failure patterns

| Pattern | Meaning | Action |
|---------|---------|--------|
| Redirect to `/` | Route not registered | Check `pages/` or `app/` routing |
| Redirect to `/login` | Auth guard active on public route | Check middleware |
| 404 | Route missing or deployment not complete | Check Vercel deploy status |
| 500 with stack trace | Runtime error — DB disconnected or service bug | Check Vercel function logs |
| PDF content-length = 0 | Board-pack artifact failed to generate | Check artifact service |

---

## 6. Manual-Only Steps

The following steps are **always MANUAL_ONLY**. Agents must not attempt them and must escalate to the user.

### Stripe

- Creating or deleting webhooks in Stripe Dashboard
- Configuring billing portal
- Processing refunds or payouts
- Rotating Stripe API keys

**How to create a webhook (human steps):**
1. Go to `https://dashboard.stripe.com/webhooks`
2. Click "Add endpoint"
3. URL: `https://www.abrahamoflondon.org/api/stripe/webhook`
4. Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
5. Copy signing secret to Vercel env as `STRIPE_WEBHOOK_SECRET`

### Vercel

- Adding environment variables (use Vercel dashboard → Settings → Environment Variables)
- Configuring custom domains
- Changing build settings
- Disabling preview deployments

### GitHub

- Re-authenticating CLI after session expiry (`gh auth login` or SSH key renewal)
- Approving OAuth applications
- Configuring branch protection rules
- Creating personal access tokens

### Neon / Database

- Creating or rotating `DATABASE_URL`
- Scaling compute
- Creating database branches

---

## 7. Known Recurring Blockers and Fixes

| Blocker | Root Cause | Fix |
|---------|-----------|-----|
| Migration SQL fails on PostgreSQL | `DATETIME` used instead of `TIMESTAMPTZ` | Always use `TIMESTAMPTZ` in migration SQL |
| `git push` auth error | GitHub token expired | `MANUAL_ONLY`: `gh auth login` |
| `gh auth status` fails but `git push --dry-run origin main` works | npm wrapper or PATH issue | Warning only; do not block deployment |
| `vercel` command fails | Vercel session expired | `MANUAL_ONLY`: `vercel login` |
| Agent can't write files in subagent | Sandbox permission model for spawned agents | Use parent agent directly instead of subagents for file writes |
| `WebFetch` denied in subagent | Sandbox restriction | Use parent agent for HTTP checks |
| `pnpm exec tsc` slow background | TSC runs full project | Add `--pretty false` and pipe to `head -60` for quick checks |
| `prisma migrate dev` vs `deploy` | `dev` creates migrations; `deploy` applies them | Never use `dev` against production-connected URL |

---

## 8. Page Creation Pre-Check — Hard Standard

**No agent may create a new page file until all seven checks below are complete.**

The product estate is too large for page creation by intuition. If any check returns a match, extend the existing file — do not create a new one.

### Required checks (run in order)

```bash
# 1. Pages Router — exact and partial matches
ls pages/<route>.tsx pages/<route>/index.tsx 2>/dev/null
find pages -name "*<keyword>*" 2>/dev/null

# 2. App Router
find app -name "page.tsx" | xargs grep -l "<keyword>" 2>/dev/null
ls app/<route>/page.tsx 2>/dev/null

# 3. Route registry (product-access-link-resolver.ts KNOWN_ROUTES)
grep '"/<route>"' lib/product/product-access-link-resolver.ts

# 4. Product surface registry
grep "'<route>'\|\"<route>\"" lib/product/product-surface-registry.ts

# 5. Feature entitlements
grep '"/<route>"' lib/product/feature-entitlements.ts

# 6. Navigation and layout
grep '"/<route>"' components/Layout.tsx components/Navigation.tsx components/nav/*.tsx 2>/dev/null

# 7. Full codebase href scan
grep -r '"/<route>"' pages/ app/ components/ lib/ --include="*.tsx" --include="*.ts" | head -20
```

### Decision rule

| Check result | Action |
|---|---|
| Route exists as a page file | Read the existing file. Extend it if the new content fits its purpose. |
| Route exists in surface registry or KNOWN_ROUTES but no page file | Create the page. Register in KNOWN_ROUTES if not already present. |
| No match anywhere | Create the page. Add to KNOWN_ROUTES and surface registry. |
| Partial name match (e.g. `/professionals` when creating `/professional`) | **Stop. Read the matched file first.** Confirm the purposes are truly distinct before creating a second file. If in doubt, merge into the existing page. |

### Why this rule exists

In June 2026, `pages/professional.tsx` was created without checking that `pages/professionals.tsx` already existed. The new page was later deleted and its content merged into the existing file. The `professional_subscription` surface was also found pointing to `/pricing` — a routing loop that would have been caught by check 4. Both errors were preventable by running these checks first.

---

## 9. Product Estate Audit Sequence

Run this after product, route, catalog, admin, checkout, entitlement, brief, or GMI changes. Always run after any page creation or route change.

```bash
# Static estate inventory and reality grades
pnpm audit:product-estate -- --json

# Local or production route smoke
pnpm smoke:product-estate -- --base-url http://localhost:3000
pnpm smoke:product-estate -- --base-url https://www.abrahamoflondon.org

# Product estate tests
pnpm exec vitest run tests/product-estate
```

Rules:

- Briefs/Vault/Editorial may be content-derived; label curated editorial static data as editorial curation, not operational truth.
- GMI must remain quarterly and edition-parametric; Q2-specific seed/published routes must not become the permanent runtime model.
- Active paid products must have persisted order/run/case state, admin visibility, entitlement/fulfilment proof, or an explicit recorded authority gap.
