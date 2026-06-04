---
title: Vercel Cost Control — Abraham of London
type: ops
status: active
---

# Vercel Cost Control

Build CPU minutes are the primary cost driver. Function/traffic costs are negligible.
Every Vercel build runs `contentlayer2 build + next build --webpack` at ~6GB RAM, taking
12–15 minutes. At current pace that costs ~$6–7 per build cycle.

---

## Deployment triggers

| Trigger | Produces build? | Should it? |
|---|---|---|
| Push to `main` | Yes — production deploy | Yes, if runtime files changed |
| Push to any other branch | Yes — preview deploy | Rarely — controlled by `ignoreCommand` |
| Merge PR to `main` | Yes | Yes, if runtime files changed |
| Manual redeploy (Vercel dashboard) | Yes | On demand only |

---

## Ignored Build Step

`vercel.json` sets `"ignoreCommand": "node scripts/vercel-ignore-build.mjs"`.

The script compares `VERCEL_GIT_PREVIOUS_SHA` → `VERCEL_GIT_COMMIT_SHA` and:
- **Exits 0 (build)** if any runtime file changed (`pages/`, `app/`, `components/`, `lib/`, `content/`, `public/`, `next.config.*`, etc.)
- **Exits 1 (skip)** if only non-runtime files changed (`docs/`, `tests/`, `reports/`, `_archive/`, `*.md` root docs, audit scripts, etc.)
- **Exits 0 (build)** conservatively for unknown file types

### Files that do NOT trigger a build on their own

```
docs/**                          # documentation
tests/**                         # test suites
_archive/**                      # pre-publication source archive
reports/**                       # audit reports
screenshots/**                   # visual assets
_ct600_working/**                # tax working files
scripts/audit/**                 # local governance scripts
*.md (root level)                # readme, debt, migration notes
build-*.log                      # build logs
```

### Files that always trigger a build

```
pages/**          app/**          components/**
lib/**            content/**      public/**
styles/**         hooks/**        contexts/**
prisma/**         next.config.*   contentlayer.config.*
package.json      pnpm-lock.yaml  vercel.json
netlify.toml      proxy.ts        middleware/**
```

---

## When to push

**Push freely:** documentation, tests, audit reports, archive files, `_ct600_working/`, root `*.md`.
The ignored build step will skip Vercel for these.

**Push deliberately:** `pages/`, `app/`, `lib/`, `content/`, `public/`, `package.json`.
These always trigger a build. Batch related runtime changes into one commit before pushing.

**Never push to main without running `pnpm validate:prepush` first.**

---

## Script separation

| Script | Where to run | What it does |
|---|---|---|
| `pnpm validate:local` | Local, before any commit | pdf:enforce + tsc + vitest full suite |
| `pnpm validate:prepush` | Local, before `git push` | mdx:gate + tsc + briefs tests |
| `pnpm validate:release` | Local, before production push | Full audit + tsc + vitest + contentlayer |
| `pnpm build:production` | Local dry-run or Vercel | contentlayer + pdf-registry + next build |
| `pnpm run build` (local) | Local only | Runs prebuild (pdf:enforce) + next build — heavy |

**Do NOT use `pnpm run build` in CI/Vercel.** Vercel uses `vercel.json`'s `buildCommand` directly,
which skips the heavy `prebuild` script (pdf:enforce, vault:sync) and runs a lean production build.

---

## Reducing preview deploys (Vercel dashboard)

To further reduce cost:

1. **Dashboard → Project → Settings → Git → Preview Deployments**:
   Set to "Only for Production branch" or disable for non-critical branches.

2. **Dashboard → Project → Settings → Git → Deployment Protection**:
   Enable "Only Deploy Production Branch" if preview deploys are not needed.

3. **Concurrent builds**: Vercel Pro allows 1 concurrent build per project by default.
   Do not increase this unless explicitly needed for a release.

---

## .vercelignore — excluded from deployment bundle

The following tracked files are excluded from the Vercel upload (saves ~800 files per build):

```
tests/**          # 184 tracked test files
docs/**           # 493 tracked doc files
reports/**        # 95 tracked report files
_archive/**       # 51 tracked archive files
_ct600_working/** # tax working files
scripts/audit/**  # local audit scripts
screenshots/**
*.xlsx / *.xls
```

---

## Release checklist

Before pushing a production release:

- [ ] `pnpm validate:prepush` passes locally
- [ ] `pnpm validate:release` passes locally (full — includes pdf:enforce)
- [ ] Contentlayer builds cleanly: `pnpm contentlayer2 build`
- [ ] Briefs registry correct: `node scripts/generate-briefs-registry.mjs`
- [ ] `git diff --check` clean
- [ ] Commit message is descriptive (CI and Vercel logs use this)
- [ ] Push and confirm Vercel build starts
- [ ] Watch build in Vercel dashboard — confirm no new errors

---

## Emergency: stop a runaway build

1. Open Vercel dashboard → Deployments
2. Click the active deployment → Cancel Build
3. Fix the issue locally (`pnpm validate:local`)
4. Push the fix commit
5. If the issue is in `pdf:enforce`, fix locally — Vercel `buildCommand` does NOT run `pdf:enforce`

## Emergency: disable all preview builds temporarily

In Vercel dashboard → Project → Settings → Git:
- Set **Preview Deployments** to "None"
- Re-enable after the noisy commit window

---

## Expected savings

| Change | Estimated impact |
|---|---|
| Ignored build step (skip doc/test/archive pushes) | ~30–40% fewer builds |
| `.vercelignore` (faster upload) | ~10–15s per build |
| Preview deploy discipline | ~20–30% fewer builds if branches active |
| Combined | Target: 46K → 25–30K build minutes/cycle |
